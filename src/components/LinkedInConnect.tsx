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
import { LinkedIn as LinkedInIcon } from '@mui/icons-material';
import { initiateLinkedInOAuth, completeLinkedInOAuth, storeToken, getStoredToken, removeStoredToken, SocialProfile } from '../utils/OAuthService';

interface LinkedInPermission {
  name: string;
  description: string;
  enabled: boolean;
  required: boolean;
}

const LinkedInConnect = () => {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [redirectUri, setRedirectUri] = useState(window.location.origin + '/linkedin');
  const [showConfig, setShowConfig] = useState(false);
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [permissions, setPermissions] = useState<LinkedInPermission[]>([
    {
      name: 'r_liteprofile',
      description: 'Access to name, photo, headline, and profile',
      enabled: true,
      required: true
    },
    {
      name: 'r_emailaddress',
      description: 'Access to primary email address',
      enabled: true,
      required: true
    },
    {
      name: 'w_member_social',
      description: 'Post, comment and like posts on your behalf',
      enabled: false,
      required: false
    },
    {
      name: 'r_organization_social',
      description: 'Access to company page content',
      enabled: false,
      required: false
    }
  ]);

  // Check for existing token on component mount
  useEffect(() => {
    const storedProfile = getStoredToken('linkedin');
    if (storedProfile) {
      setConnected(true);
      setProfile(storedProfile);
    }
    
    // Check for OAuth code in URL (after redirect back from LinkedIn)
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
      const storedClientId = localStorage.getItem('linkedin_client_id');
      const storedClientSecret = localStorage.getItem('linkedin_client_secret');
      
      if (!storedClientId || !storedClientSecret) {
        throw new Error('Client credentials not found. Please configure the app first.');
      }
      
      const userProfile = await completeLinkedInOAuth(code, storedClientId, storedClientSecret, redirectUri);
      
      // Store the profile and token
      storeToken('linkedin', userProfile);
      setProfile(userProfile);
      setConnected(true);
      
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      console.error('LinkedIn OAuth callback error:', err);
      setError('Failed to complete LinkedIn authentication. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!clientId || !clientSecret || !redirectUri) {
      setError('Client ID, Client Secret, and Redirect URI are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Store credentials temporarily in localStorage for the callback
      localStorage.setItem('linkedin_client_id', clientId);
      localStorage.setItem('linkedin_client_secret', clientSecret);
      
      // Get selected permissions
      const selectedPermissions = permissions
        .filter(p => p.enabled)
        .map(p => p.name);
      
      // Initiate OAuth flow - this will redirect the user
      initiateLinkedInOAuth(clientId, redirectUri, selectedPermissions);
    } catch (err) {
      console.error('LinkedIn OAuth error:', err);
      setError('Failed to connect to LinkedIn. Please check your credentials and try again.');
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);

    try {
      // Remove stored token
      removeStoredToken('linkedin');
      
      // Clear stored credentials
      localStorage.removeItem('linkedin_client_id');
      localStorage.removeItem('linkedin_client_secret');
      
      // Update state
      setConnected(false);
      setProfile(null);
    } catch (err) {
      setError('Failed to disconnect from LinkedIn. Please try again.');
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
        <LinkedInIcon color="primary" sx={{ fontSize: 32, mr: 2 }} />
        <Typography variant="h4">LinkedIn Integration</Typography>
      </Box>

      <Typography variant="body1" color="text.secondary" paragraph>
        Connect your LinkedIn account to manage your professional network, share content, and track engagement.
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
              <LinkedInIcon color={connected ? "primary" : "disabled"} sx={{ mr: 1 }} />
              <Typography variant="h6">LinkedIn</Typography>
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
              Successfully connected to LinkedIn
            </Alert>
          )}

          {showConfig && !connected && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                LinkedIn API Configuration
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Note: You'll need a LinkedIn Developer account and a registered app to obtain these credentials.
              </Typography>
              <TextField
                label="Client ID"
                variant="outlined"
                fullWidth
                margin="normal"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              />
              <TextField
                label="Client Secret"
                variant="outlined"
                fullWidth
                margin="normal"
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
              />
              <TextField
                label="Redirect URI"
                variant="outlined"
                fullWidth
                margin="normal"
                value={redirectUri}
                onChange={(e) => setRedirectUri(e.target.value)}
                placeholder="https://your-app.com/auth/linkedin/callback"
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                You can find these credentials in your LinkedIn Developer Portal. The Redirect URI must match exactly what you've configured in your LinkedIn app settings.
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
            Connected LinkedIn Account
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

export default LinkedInConnect;