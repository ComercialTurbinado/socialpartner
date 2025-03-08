import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { storeToken, getStoredToken, removeStoredToken } from '../utils/OAuthService';

const GoogleConnect = () => {
  const navigate = useNavigate();
  const [clientId, setClientId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    // Check if we already have stored credentials
    const storedClientId = localStorage.getItem('google_client_id');
    if (storedClientId) {
      setClientId(storedClientId);
    }

    // Check if we have a stored profile
    const storedProfile = getStoredToken('google');
    if (storedProfile) {
      setConnected(true);
      setProfile(storedProfile);
    }

    // Check for OAuth callback in URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state) {
      const storedState = sessionStorage.getItem('google_oauth_state');
      if (state === storedState) {
        handleOAuthCallback(code);
      } else {
        setError('Invalid state parameter. Authentication failed.');
      }
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const initiateGoogleOAuth = () => {
    if (!clientId) {
      setError('Please enter your Google Client ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Store client ID for future use
      localStorage.setItem('google_client_id', clientId);

      // Generate random state for security
      const state = generateRandomString(32);
      sessionStorage.setItem('google_oauth_state', state);

      // Define OAuth scopes
      const scope = [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/business.manage'
      ].join(' ');

      // Redirect to Google OAuth
      const redirectUri = `${window.location.origin}/google`;
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}&access_type=offline&prompt=consent`;
      
      window.location.href = authUrl;
    } catch (err) {
      setError('Failed to initiate Google authentication');
      setLoading(false);
    }
  };

  const handleOAuthCallback = async (code: string) => {
    setLoading(true);
    setError(null);

    try {
      // In a real implementation, you would exchange the code for tokens
      // This would typically be done on a backend to keep client_secret secure
      const redirectUri = `${window.location.origin}/google`;
      
      // Simulate token exchange and profile fetch
      // In production, replace with actual API calls to Google
      setTimeout(() => {
        const mockProfile = {
          id: 'google_user_id',
          name: 'Google User',
          email: 'user@gmail.com',
          picture: 'https://lh3.googleusercontent.com/a/default-user',
          accessToken: 'mock_access_token',
          refreshToken: 'mock_refresh_token',
          expiresAt: Date.now() + 3600 * 1000
        };

        // Store the profile
        storeToken('google', mockProfile);
        setProfile(mockProfile);
        setConnected(true);
        setSuccess('Successfully connected to Google!');
        setLoading(false);
      }, 1000);

      // Note: In a real implementation, you would make an API call like:
      /*
      const tokenResponse = await axios.post(
        'https://oauth2.googleapis.com/token',
        {
          code,
          client_id: clientId,
          client_secret: 'YOUR_CLIENT_SECRET', // This should be on server side
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        }
      );

      const { access_token, refresh_token, expires_in } = tokenResponse.data;

      // Get user profile
      const profileResponse = await axios.get(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            'Authorization': `Bearer ${access_token}`
          }
        }
      );

      const profile = profileResponse.data;
      const expiresAt = expires_in ? Date.now() + expires_in * 1000 : undefined;

      const userProfile = {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        picture: profile.picture,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt
      };

      storeToken('google', userProfile);
      setProfile(userProfile);
      setConnected(true);
      */

    } catch (err) {
      console.error('Google OAuth callback error:', err);
      setError('Failed to complete Google authentication');
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setLoading(true);
    
    try {
      // Remove stored token and credentials
      removeStoredToken('google');
      localStorage.removeItem('google_client_id');
      
      setConnected(false);
      setProfile(null);
      setSuccess('Successfully disconnected from Google');
    } catch (err) {
      setError('Failed to disconnect from Google');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to generate random string for state
  const generateRandomString = (length: number): string => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Connect Google Account
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Connect your Google account to access Google My Business and Google Reviews.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {!connected ? (
        <Card sx={{ maxWidth: 600, mx: 'auto' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Google API Credentials
            </Typography>
            <TextField
              label="Client ID"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              fullWidth
              margin="normal"
              helperText="Enter your Google OAuth Client ID"
            />
            <Button
              variant="contained"
              color="primary"
              onClick={initiateGoogleOAuth}
              disabled={loading || !clientId}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Connect with Google'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ maxWidth: 600, mx: 'auto' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Connected to Google
            </Typography>
            {profile && (
              <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {profile.picture && (
                    <Box
                      component="img"
                      src={profile.picture}
                      alt={profile.name}
                      sx={{ width: 40, height: 40, borderRadius: '50%', mr: 2 }}
                    />
                  )}
                  <Box>
                    <Typography variant="subtitle1">{profile.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {profile.email}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            )}
            <Button
              variant="outlined"
              color="error"
              onClick={handleDisconnect}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Disconnect'}
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default GoogleConnect;