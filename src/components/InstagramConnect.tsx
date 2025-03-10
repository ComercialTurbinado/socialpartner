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
import { completeInstagramOAuth, storeToken, getStoredToken, removeStoredToken, SocialProfile } from '../utils/OAuthService';

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
  const [redirectUri] = useState('https://main.d12gqpnoazw6w2.amplifyapp.com/instagram');
  
  // Use environment variables for App ID and Secret
  const appId = import.meta.env.VITE_INSTAGRAM_APP_ID;
  const appSecret = import.meta.env.VITE_INSTAGRAM_APP_SECRET;
  
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
      // Store credentials temporarily in localStorage for the callback
      localStorage.setItem('instagram_app_id', appId);
      localStorage.setItem('instagram_app_secret', appSecret);
      
      const userProfile = await completeInstagramOAuth(code, appId, appSecret, redirectUri);
      
      // Store the profile and token
      storeToken('instagram', userProfile);
      setProfile(userProfile);
      setConnected(true);
      
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      console.error('Instagram OAuth callback error:', err);
      setError('Failed to complete Instagram authentication. Please try again.');
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
      
      // Add required Facebook permissions for Instagram Graph API
      selectedPermissions.push('pages_show_list', 'instagram_basic', 'instagram_content_publish', 'pages_read_engagement');
      
      // Use the mapped permissions for the scope
      const scope = selectedPermissions.join('%2C');
      
      const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`;
      window.location.href = authUrl;
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
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
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
                Make sure your Facebook account is connected to an Instagram business or creator account.
              </Typography>
              
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
            Connected Instagram Account
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6">{profile.username || profile.name}</Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary">
              User ID: {profile.id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Connected since: {new Date().toLocaleDateString()}
            </Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default InstagramConnect;