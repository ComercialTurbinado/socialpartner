import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Switch,
  FormControlLabel,
  Paper,
  Avatar
} from '@mui/material';
import { Twitter as TwitterIcon } from '@mui/icons-material';
import { initiateTwitterOAuth, completeTwitterOAuth, storeToken, getStoredToken, removeStoredToken, SocialProfile } from '../utils/OAuthService';

interface TwitterPermission {
  name: string;
  description: string;
  enabled: boolean;
  required: boolean;
}

const TwitterConnect = () => {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [redirectUri, setRedirectUri] = useState(window.location.origin + '/twitter');
  const [showConfig, setShowConfig] = useState(false);
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [permissions, setPermissions] = useState<TwitterPermission[]>([
    {
      name: 'read',
      description: 'Read Tweets and profile information',
      enabled: true,
      required: true
    },
    {
      name: 'write',
      description: 'Post Tweets and interact with other Tweets',
      enabled: true,
      required: true
    },
    {
      name: 'direct_messages',
      description: 'Send and receive direct messages',
      enabled: false,
      required: false
    },
    {
      name: 'tweet_analytics',
      description: 'Access Tweet analytics and metrics',
      enabled: false,
      required: false
    }
  ]);

  // Check for existing token on component mount
  useEffect(() => {
    const storedProfile = getStoredToken('twitter');
    if (storedProfile) {
      setConnected(true);
      setProfile(storedProfile);
    }
    
    // Check for OAuth code in URL (after redirect back from Twitter)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && !connected) {
      handleOAuthCallback(code);
    }
  }, []);

  const handleOAuthCallback = async (code: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Get stored credentials from localStorage
      const storedApiKey = localStorage.getItem('twitter_api_key');
      const storedApiSecret = localStorage.getItem('twitter_api_secret');
      
      if (!storedApiKey || !storedApiSecret) {
        throw new Error('API credentials not found. Please configure the app first.');
      }
      
      const userProfile = await completeTwitterOAuth(code, storedApiKey, storedApiSecret, redirectUri);
      
      // Store the profile and token
      storeToken('twitter', userProfile);
      setProfile(userProfile);
      setConnected(true);
      
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      console.error('Twitter OAuth callback error:', err);
      setError('Failed to complete Twitter authentication. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!apiKey || !apiSecret) {
      setError('API Key and API Secret are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Store credentials temporarily in localStorage for the callback
      localStorage.setItem('twitter_api_key', apiKey);
      localStorage.setItem('twitter_api_secret', apiSecret);
      
      // Initiate OAuth flow - this will redirect the user
      initiateTwitterOAuth(apiKey, redirectUri);
    } catch (err) {
      console.error('Twitter OAuth error:', err);
      setError('Failed to connect to Twitter. Please check your credentials and try again.');
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);

    try {
      // Remove stored token
      removeStoredToken('twitter');
      
      // Clear stored credentials
      localStorage.removeItem('twitter_api_key');
      localStorage.removeItem('twitter_api_secret');
      
      // Update state
      setConnected(false);
      setProfile(null);
    } catch (err) {
      setError('Failed to disconnect from Twitter. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (index: number) => {
    const updatedPermissions = [...permissions];
    if (!updatedPermissions[index].required) {
      updatedPermissions[index].enabled = !updatedPermissions[index].enabled;
      setPermissions(updatedPermissions);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <TwitterIcon color="primary" sx={{ fontSize: 32, mr: 2 }} />
        <Typography variant="h4">Twitter Integration</Typography>
      </Box>

      <Typography variant="body1" color="text.secondary" paragraph>
        Connect your Twitter account to manage tweets, engage with your audience, and track performance.
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
              <TwitterIcon color={connected ? "primary" : "disabled"} sx={{ mr: 1 }} />
              <Typography variant="h6">Twitter</Typography>
            </Box>
            <Box>
              {!connected ? (
                <Button 
                  variant="outlined" 
                  color="primary" 
                  onClick={() => setShowConfig(!showConfig)}
                  sx={{ mr: 1 }}
                >
                  Configure
                </Button>
              ) : null}
              <Button
                variant={connected ? 'outlined' : 'contained'}
                color={connected ? 'error' : 'primary'}
                onClick={connected ? handleDisconnect : handleConnect}
                disabled={loading || (!connected && !showConfig)}
              >
                {loading ? (
                  <CircularProgress size={24} />
                ) : connected ? (
                  'Disconnect'
                ) : (
                  'Connect'
                )}
              </Button>
            </Box>
          </Box>

          {connected && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Successfully connected to Twitter
            </Alert>
          )}

          {showConfig && !connected && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Twitter API Configuration
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Note: You'll need a Twitter Developer account and a registered app to obtain these credentials.
              </Typography>
              <TextField
                label="API Key"
                variant="outlined"
                fullWidth
                margin="normal"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <TextField
                label="API Secret"
                variant="outlined"
                fullWidth
                margin="normal"
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
              />
              <TextField
                label="Redirect URI"
                variant="outlined"
                fullWidth
                margin="normal"
                value={redirectUri}
                onChange={(e) => setRedirectUri(e.target.value)}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                You can find these credentials in your Twitter Developer Portal.
              </Typography>

              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom>
                Permissions
              </Typography>
              <Paper variant="outlined" sx={{ mt: 1 }}>
                <List>
                  {permissions.map((permission, index) => (
                    <ListItem key={permission.name} divider={index < permissions.length - 1}>
                      <ListItemText
                        primary={permission.name}
                        secondary={permission.description}
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={permission.enabled}
                            onChange={() => handlePermissionChange(index)}
                            disabled={permission.required}
                          />
                        }
                        label={permission.required ? "Required" : "Optional"}
                        labelPlacement="start"
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Box>
          )}
        </CardContent>
      </Card>

      {connected && profile && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Connected Twitter Account
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {profile.picture && (
                <Avatar src={profile.picture} alt={profile.name} sx={{ mr: 2, width: 56, height: 56 }} />
              )}
              <Box>
                <Typography variant="h6">{profile.name}</Typography>
                {profile.username && (
                  <Typography variant="body2" color="text.secondary">
                    @{profile.username}
                  </Typography>
                )}
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary">
              User ID: {profile.id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Connected since: {new Date().toLocaleDateString()}
            </Typography>
            {profile.expiresAt && (
              <Typography variant="body2" color="text.secondary">
                Token expires: {new Date(profile.expiresAt).toLocaleString()}
              </Typography>
            )}
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default TwitterConnect;