import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Avatar
} from '@mui/material';
import {
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  Google as GoogleIcon
} from '@mui/icons-material';
import { getStoredToken, removeStoredToken, SocialProfile } from '../utils/OAuthService';
import { useNavigate } from 'react-router-dom';

interface SocialPlatform {
  name: string;
  icon: React.ReactNode;
  connected: boolean;
  loading: boolean;
  error: string | null;
  profile?: SocialProfile | null;
  path: string;
}

const SocialMediaConnect = () => {
  const navigate = useNavigate();
  const [platforms, setPlatforms] = useState<SocialPlatform[]>([
    { name: 'Instagram', icon: <InstagramIcon />, connected: false, loading: false, error: null, path: '/instagram' },
    { name: 'Facebook', icon: <FacebookIcon />, connected: false, loading: false, error: null, path: '/facebook' },
    { name: 'Twitter', icon: <TwitterIcon />, connected: false, loading: false, error: null, path: '/twitter' },
    { name: 'LinkedIn', icon: <LinkedInIcon />, connected: false, loading: false, error: null, path: '/linkedin' },
    { name: 'Google', icon: <GoogleIcon />, connected: false, loading: false, error: null, path: '/google' }
  ]);
  
  // Check for existing connections on component mount
  useEffect(() => {
    const updatedPlatforms = platforms.map(platform => {
      const platformKey = platform.name.toLowerCase();
      const storedProfile = getStoredToken(platformKey);
      
      return {
        ...platform,
        connected: !!storedProfile,
        profile: storedProfile
      };
    });
    
    setPlatforms(updatedPlatforms);
  }, []);

  const handleConnect = (platformName: string) => {
    // Find the platform to navigate to its dedicated connection page
    const platform = platforms.find(p => p.name === platformName);
    if (platform) {
      navigate(platform.path);
    }
  };

  const handleDisconnect = async (platformName: string) => {
    setPlatforms(platforms.map(platform => {
      if (platform.name === platformName) {
        return { ...platform, loading: true };
      }
      return platform;
    }));

    try {
      // Remove stored token
      const platformKey = platformName.toLowerCase();
      removeStoredToken(platformKey);
      
      // Clear stored credentials based on platform
      if (platformName === 'Facebook') {
        localStorage.removeItem('facebook_app_id');
        localStorage.removeItem('facebook_app_secret');
      } else if (platformName === 'Instagram') {
        localStorage.removeItem('instagram_app_id');
        localStorage.removeItem('instagram_app_secret');
      } else if (platformName === 'Twitter') {
        localStorage.removeItem('twitter_api_key');
        localStorage.removeItem('twitter_api_secret');
      } else if (platformName === 'LinkedIn') {
        localStorage.removeItem('linkedin_client_id');
        localStorage.removeItem('linkedin_client_secret');
      } else if (platformName === 'Google') {
        localStorage.removeItem('google_client_id');
      }

      setPlatforms(platforms.map(platform => {
        if (platform.name === platformName) {
          return { ...platform, connected: false, loading: false, error: null, profile: null };
        }
        return platform;
      }));
    } catch (error) {
      setPlatforms(platforms.map(platform => {
        if (platform.name === platformName) {
          return { ...platform, loading: false, error: 'Disconnect failed. Please try again.' };
        }
        return platform;
      }));
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Connect Social Media Accounts
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Connect your social media accounts to manage all your social presence in one place.
      </Typography>

      <Grid container spacing={3}>
        {platforms.map((platform) => (
          <Grid item xs={12} sm={6} md={3} key={platform.name}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ mr: 1, color: platform.connected ? 'success.main' : 'action.active' }}>
                    {platform.icon}
                  </Box>
                  <Typography variant="h6">{platform.name}</Typography>
                </Box>
                
                {platform.connected && platform.profile && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {platform.profile.picture && (
                      <Avatar 
                        src={platform.profile.picture} 
                        alt={platform.profile.name} 
                        sx={{ width: 32, height: 32, mr: 1 }} 
                      />
                    )}
                    <Typography variant="body2">
                      {platform.profile.username || platform.profile.name}
                    </Typography>
                  </Box>
                )}

                {platform.error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {platform.error}
                  </Alert>
                )}

                {platform.connected ? (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleDisconnect(platform.name)}
                    disabled={platform.loading}
                    fullWidth
                  >
                    {platform.loading ? <CircularProgress size={24} /> : 'Disconnect'}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleConnect(platform.name)}
                    disabled={platform.loading}
                    fullWidth
                  >
                    {platform.loading ? <CircularProgress size={24} /> : 'Connect'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default SocialMediaConnect;