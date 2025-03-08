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
import { Facebook as FacebookIcon } from '@mui/icons-material';
import { initiateFacebookOAuth, completeFacebookOAuth, storeToken, getStoredToken, removeStoredToken, SocialProfile } from '../utils/OAuthService';

interface FacebookPermission {
  name: string;
  description: string;
  enabled: boolean;
  required: boolean;
}

const FacebookConnect = () => {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appId, setAppId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [redirectUri, setRedirectUri] = useState(window.location.origin + '/facebook');
  const [showConfig, setShowConfig] = useState(false);
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [permissions, setPermissions] = useState<FacebookPermission[]>([
    {
      name: 'pages_read_engagement',
      description: 'Access to Facebook Pages where you are an administrator',
      enabled: true,
      required: true
    },
    {
      name: 'user_posts',
      description: 'Access to posts on your timeline',
      enabled: true,
      required: true
    },
    {
      name: 'user_photos',
      description: 'Access to photos you uploaded or were tagged in',
      enabled: false,
      required: false
    },
    {
      name: 'instagram_basic',
      description: 'Access to Instagram account if connected to your Facebook page',
      enabled: false,
      required: false
    }
  ]);

  // Check for existing token on component mount
  useEffect(() => {
    const storedProfile = getStoredToken('facebook');
    if (storedProfile) {
      setConnected(true);
      setProfile(storedProfile);
    }
    
    // Check for OAuth code in URL (after redirect back from Facebook)
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
      const storedAppId = localStorage.getItem('facebook_app_id');
      const storedAppSecret = localStorage.getItem('facebook_app_secret');
      
      if (!storedAppId || !storedAppSecret) {
        throw new Error('App credentials not found. Please configure the app first.');
      }
      
      const userProfile = await completeFacebookOAuth(code, storedAppId, storedAppSecret, redirectUri);
      
      // Store the profile and token
      storeToken('facebook', userProfile);
      setProfile(userProfile);
      setConnected(true);
      
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      console.error('Facebook OAuth callback error:', err);
      setError('Failed to complete Facebook authentication. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!appId || !appSecret) {
      setError('App ID and App Secret are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Store credentials temporarily in localStorage for the callback
      localStorage.setItem('facebook_app_id', appId);
      localStorage.setItem('facebook_app_secret', appSecret);
      
      // Get selected permissions
      const selectedPermissions = permissions
        .filter(p => p.enabled)
        .map(p => p.name);
      
      // Initiate OAuth flow - this will redirect the user
      initiateFacebookOAuth(appId, redirectUri, selectedPermissions);
    } catch (err) {
      console.error('Facebook OAuth error:', err);
      setError('Failed to connect to Facebook. Please check your credentials and try again.');
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);

    try {
      // Remove stored token
      removeStoredToken('facebook');
      
      // Clear stored credentials
      localStorage.removeItem('facebook_app_id');
      localStorage.removeItem('facebook_app_secret');
      
      // Update state
      setConnected(false);
      setProfile(null);
    } catch (err) {
      setError('Failed to disconnect from Facebook. Please try again.');
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
        <FacebookIcon color="primary" sx={{ fontSize: 32, mr: 2 }} />
        <Typography variant="h4">Facebook Integration</Typography>
      </Box>

      <Typography variant="body1" color="text.secondary" paragraph>
        Connect your Facebook account to manage your pages, posts, and engage with your audience.
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
              <FacebookIcon color={connected ? "primary" : "disabled"} sx={{ mr: 1 }} />
              <Typography variant="h6">Facebook</Typography>
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
              Successfully connected to Facebook
            </Alert>
          )}

          {showConfig && !connected && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Facebook App Configuration
              </Typography>
              <TextField
                label="App ID"
                variant="outlined"
                fullWidth
                margin="normal"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
              />
              <TextField
                label="App Secret"
                variant="outlined"
                fullWidth
                margin="normal"
                type="password"
                value={appSecret}
                onChange={(e) => setAppSecret(e.target.value)}
              />
              <TextField
                label="Redirect URI"
                variant="outlined"
                fullWidth
                margin="normal"
                value={redirectUri}
                onChange={(e) => setRedirectUri(e.target.value)}
                helperText="This must match the redirect URI configured in your Facebook app"
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                You can find your App ID and App Secret in the Facebook Developer Portal. Make sure to add the Redirect URI to your Facebook app's Valid OAuth Redirect URIs.
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
            Connected Facebook Account
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {profile.picture && (
                <Avatar src={profile.picture} alt={profile.name} sx={{ mr: 2, width: 56, height: 56 }} />
              )}
              <Box>
                <Typography variant="h6">{profile.name}</Typography>
                {profile.email && (
                  <Typography variant="body2" color="text.secondary">
                    {profile.email}
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

export default FacebookConnect;