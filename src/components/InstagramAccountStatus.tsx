import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  AlertTitle,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ArrowRight as ArrowRightIcon
} from '@mui/icons-material';
import { SocialProfile } from '../utils/OAuthService';

interface InstagramAccountStatusProps {
  profile: any; // Raw Instagram profile data
  error: string | null;
}

const InstagramAccountStatus: React.FC<InstagramAccountStatusProps> = ({ profile, error }) => {
  // Check if we have a valid Instagram business account ID
  const hasBusinessAccount = profile && profile.id;
  
  // Check if we have Facebook pages but no Instagram business account
  const hasPages = profile && 
    profile.rawAccountsResponse && 
    profile.rawAccountsResponse.data && 
    profile.rawAccountsResponse.data.length > 0;
  
  return (
    <Box sx={{ mt: 2 }}>
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Connection Error</AlertTitle>
          {error}
        </Alert>
      ) : hasBusinessAccount ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          <AlertTitle>Successfully Connected</AlertTitle>
          Your Instagram Business account is successfully connected.
        </Alert>
      ) : (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>Instagram Business Account Required</AlertTitle>
          <Typography variant="body2" paragraph>
            You've successfully authenticated with Facebook, but no Instagram Business account was found.
          </Typography>
          
          {hasPages ? (
            <Typography variant="body2">
              You have {profile.rawAccountsResponse.data.length} Facebook page(s), but none of them have an Instagram Business account connected.
            </Typography>
          ) : (
            <Typography variant="body2">
              No Facebook pages were found in your account. You need at least one Facebook page to connect an Instagram Business account.
            </Typography>
          )}
        </Alert>
      )}
      
      {!hasBusinessAccount && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            How to Connect an Instagram Business Account
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon>
                <ArrowRightIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Step 1: Create a Facebook Page" 
                secondary="If you don't have a Facebook Page, create one at facebook.com/pages/create"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <ArrowRightIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Step 2: Convert your Instagram account to a Business account" 
                secondary="Open Instagram app > Profile > Menu > Settings > Account > Switch to Professional Account > Business"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <ArrowRightIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Step 3: Link your Instagram Business account to your Facebook Page" 
                secondary="In Instagram app > Profile > Edit Profile > Page > Select your Facebook Page"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <ArrowRightIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Step 4: Try connecting again" 
                secondary="After completing these steps, try connecting your Instagram account again"
              />
            </ListItem>
          </List>
          
          <Typography variant="body2" sx={{ mt: 2 }}>
            For more detailed instructions, visit the{' '}
            <Link href="https://help.instagram.com/502981923235522" target="_blank" rel="noopener">
              Instagram Help Center
            </Link>
          </Typography>
        </Paper>
      )}
      
      {profile && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Technical Details</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="subtitle2" gutterBottom>Access Token Status:</Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {profile.accessToken ? 'Access token received' : 'No access token'}
            </Typography>
            
            <Typography variant="subtitle2" gutterBottom>Facebook Pages:</Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {hasPages ? `${profile.rawAccountsResponse.data.length} page(s) found` : 'No Facebook pages found'}
            </Typography>
            
            <Typography variant="subtitle2" gutterBottom>Instagram Business Account:</Typography>
            <Typography variant="body2">
              {hasBusinessAccount ? `ID: ${profile.id}` : 'No Instagram business account found'}
            </Typography>
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );
};

export default InstagramAccountStatus;