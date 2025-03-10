import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Paper
} from '@mui/material';
import { Instagram as InstagramIcon } from '@mui/icons-material';
import { completeInstagramOAuth, storeToken, getStoredToken, removeStoredToken, SocialProfile, initiateInstagramOAuth } from '../utils/OAuthService';

interface InstagramPermission {
  name: string;
  description: string;
  enabled: boolean;
  required: boolean;
}

const InstagramConnect = () => {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [redirectUri] = useState(window.location.origin + '/instagram');
  
  // Hardcoded App ID and Secret
  const appId = '3826446384273734';
  const appSecret = 'f6ffd1ccf5451dec1b75a3795867251c';
  
  const [permissions] = useState<InstagramPermission[]>([
    {
      name: 'instagram_basic',
      description: 'Access to posts and basic profile information',
      enabled: true,
      required: true
    },
    {
      name: 'instagram_content_publish',
      description: 'Ability to publish content to Instagram',
      enabled: true,
      required: true
    },
    {
      name: 'instagram_manage_comments',
      description: 'Access comments and who commented on your posts',
      enabled: true,
      required: true
    },
    {
      name: 'instagram_manage_insights',
      description: 'Access likes and who interacted with your posts',
      enabled: true,
      required: true
    }
  ]);


  // Check for existing token on component mount
  useEffect(() => {
    const storedProfile = getStoredToken('instagram');
    if (storedProfile) {
      setConnected(true);
      setProfile(storedProfile);
    }
    
    // Check for OAuth code in URL (after redirect back from Instagram)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code && !connected) {
      handleOAuthCallback(code);
    }
  }, []);

  const handleOAuthCallback = async (code: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Verify state parameter to prevent CSRF attacks
      const urlParams = new URLSearchParams(window.location.search);
      const returnedState = urlParams.get('state');
      const storedState = sessionStorage.getItem('instagram_oauth_state');
      
      if (!returnedState || !storedState || returnedState !== storedState) {
        throw new Error('Invalid state parameter. Authentication failed for security reasons.');
      }
      
      // Store credentials temporarily in localStorage for the callback
      localStorage.setItem('instagram_app_id', appId);
      localStorage.setItem('instagram_app_secret', appSecret);
      
      // Get the raw response from Instagram/Facebook API
      const rawResponse = await completeInstagramOAuth(code, appId, appSecret, redirectUri);
      
      // Check if we have an error in the response
      if (rawResponse.error) {
        console.log('Raw Instagram OAuth error:', rawResponse);
        setError(JSON.stringify(rawResponse, null, 2));
        return;
      }
      
      // Store the raw response as the profile
      storeToken('instagram', rawResponse);
      setProfile(rawResponse);
      setConnected(true);
      
      // Clean up the URL and session storage
      window.history.replaceState({}, document.title, window.location.pathname);
      sessionStorage.removeItem('instagram_oauth_state');
    } catch (err: any) {
      console.error('Instagram OAuth callback error:', err);
      // Return the raw error without any processing
      setError(JSON.stringify(err, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      // Store credentials temporarily in localStorage for the callback
      localStorage.setItem('instagram_app_id', appId);
      localStorage.setItem('instagram_app_secret', appSecret);
      
      // Get selected permissions for Instagram Graph API
      const selectedPermissions = permissions
        .filter(p => p.enabled)
        .map(p => p.name);
      
      // Use the initiateInstagramOAuth function from OAuthService
      // This function handles adding required permissions and constructing the proper URL
      initiateInstagramOAuth(appId, redirectUri, selectedPermissions);
    } catch (err) {
      console.error('Instagram OAuth error:', err);
      setError('Failed to connect to Instagram. Please try again.');
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);

    try {
      // Remove stored token
      removeStoredToken('instagram');
      
      // Clear stored credentials
      localStorage.removeItem('instagram_app_id');
      localStorage.removeItem('instagram_app_secret');
      
      // Update state
      setConnected(false);
      setProfile(null);
    } catch (err) {
      setError('Failed to disconnect from Instagram. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <InstagramIcon color="primary" sx={{ fontSize: 32, mr: 2 }} />
        <Typography variant="h4">Instagram Integration</Typography>
      </Box>

      <Typography variant="body1" color="text.secondary" paragraph>
        Connect your Instagram account to manage your posts, engage with your audience, and track performance.
      </Typography>

      {error && (
        <Box>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          
          {error.includes('No Instagram business account found') && (
            <Paper elevation={2} sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
              <Typography variant="h6" gutterBottom>
                How to Fix This Issue:
              </Typography>
              <Typography variant="body2" paragraph>
                This error occurs because Instagram's API requires a business or creator account that is linked to a Facebook page.
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Follow these steps to convert your Instagram account:
              </Typography>
              <ol>
                <li>
                  <Typography variant="body2">Open the Instagram app on your mobile device</Typography>
                </li>
                <li>
                  <Typography variant="body2">Go to your profile and tap the hamburger menu (≡) in the top right</Typography>
                </li>
                <li>
                  <Typography variant="body2">Tap Settings and privacy, then Account type and tools</Typography>
                </li>
                <li>
                  <Typography variant="body2">Select Switch to Professional Account and choose Business or Creator</Typography>
                </li>
                <li>
                  <Typography variant="body2">Follow the prompts to connect to your Facebook page</Typography>
                </li>
                <li>
                  <Typography variant="body2">If you don't have a Facebook page, you'll need to create one first</Typography>
                </li>
              </ol>
            </Paper>
          )}
        </Box>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <InstagramIcon color={connected ? "primary" : "disabled"} sx={{ mr: 1 }} />
              <Typography variant="h6">Instagram</Typography>
            </Box>
            <Box>
              <Button
                variant={connected ? 'outlined' : 'contained'}
                color={connected ? 'error' : 'primary'}
                onClick={connected ? handleDisconnect : handleConnect}
                disabled={loading}
                startIcon={!loading && !connected ? <InstagramIcon /> : undefined}
              >
                {loading ? (
                  <CircularProgress size={24} />
                ) : connected ? (
                  'Disconnect'
                ) : (
                  'Connect with Instagram'
                )}
              </Button>
            </Box>
          </Box>

          {connected && (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                Successfully connected to Instagram
              </Alert>
              <Button
                variant="contained"
                color="primary"
                component="a"
                href="/instagram/posts"
                sx={{ mb: 2 }}
                startIcon={<InstagramIcon />}
              >
                View Instagram Posts & Interactions
              </Button>
            </Box>
          )}

          {!connected && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Click the "Connect with Instagram" button above to authorize this application to access your Instagram business account.
                <strong>Important:</strong> You must have an Instagram business or creator account connected to your Facebook page.
              </Typography>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  How to set up an Instagram Business Account:
                </Typography>
                <Typography variant="body2">
                  1. Go to your Instagram profile and tap the hamburger menu (≡)
                </Typography>
                <Typography variant="body2">
                  2. Tap Settings and privacy, then Account type and tools
                </Typography>
                <Typography variant="body2">
                  3. Select Switch to Professional Account and follow the steps
                </Typography>
                <Typography variant="body2">
                  4. Choose Business (or Creator), then connect to your Facebook page
                </Typography>
                <Typography variant="body2">
                  5. Return here and try connecting again
                </Typography>
              </Alert>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom>
                Required Permissions
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                <Typography variant="body2" paragraph>
                  • <strong>instagram_basic</strong>: Access to posts and basic profile information
                </Typography>
                <Typography variant="body2" paragraph>
                  • <strong>instagram_content_publish</strong>: Ability to publish content to Instagram
                </Typography>
                <Typography variant="body2" paragraph>
                  • <strong>instagram_manage_comments</strong>: Access comments and who commented on your posts
                </Typography>
                <Typography variant="body2" paragraph>
                  • <strong>instagram_manage_insights</strong>: Access likes and who interacted with your posts
                </Typography>
              </Paper>
            </Box>
          )}
        </CardContent>
      </Card>

      {connected && profile && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Connected Instagram Account - Raw Response Data
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            {/* Display basic info if available */}
            {profile.username && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6">{profile.username}</Typography>
                <Typography variant="body2" color="text.secondary">
                  User ID: {profile.id}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Connected since: {new Date().toLocaleDateString()}
                </Typography>
              </Box>
            )}
            
            {/* Display raw response data */}
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Raw Facebook/Instagram API Response:
            </Typography>
            <Box 
              component="pre" 
              sx={{ 
                p: 2, 
                bgcolor: '#f5f5f5', 
                borderRadius: 1, 
                overflow: 'auto',
                maxHeight: '400px',
                fontSize: '0.75rem'
              }}
            >
              {JSON.stringify(profile, null, 2)}
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default InstagramConnect;