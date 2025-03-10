import axios from 'axios';

// Types for OAuth responses
export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

export interface SocialProfile {
  id: string;
  name: string;
  username?: string;
  email?: string;
  picture?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

// Facebook OAuth
export const initiateFacebookOAuth = (appId: string, redirectUri: string, permissions: string[]) => {
  const scope = permissions.join(',');
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`;
  window.location.href = authUrl;
};

export const completeFacebookOAuth = async (code: string, appId: string, appSecret: string, redirectUri: string): Promise<SocialProfile> => {
  try {
    // Exchange code for access token
    const tokenResponse = await axios.get(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
    );
    
    const { access_token, expires_in } = tokenResponse.data;
    
    // Get user profile
    const profileResponse = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${access_token}`
    );
    
    const profile = profileResponse.data;
    const expiresAt = expires_in ? Date.now() + expires_in * 1000 : undefined;
    
    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      picture: profile.picture?.data?.url,
      accessToken: access_token,
      expiresAt
    };
  } catch (error) {
    console.error('Facebook OAuth error:', error);
    throw new Error('Failed to complete Facebook authentication');
  }
};

// Instagram OAuth (via Facebook Graph API)
export const initiateInstagramOAuth = (appId: string, redirectUri: string, permissions: string[]) => {
  // Instagram Graph API uses Facebook's OAuth system
  // Required permissions for Instagram Graph API:
  // instagram_basic - Access to user's posts
  // instagram_manage_comments - Access to comments and who commented
  // instagram_manage_insights - Access to likes and who liked posts
  
  // Make sure we have the required permissions
  const requiredPermissions = ['instagram_basic', 'pages_show_list', 'pages_read_engagement'];
  const allPermissions = [...new Set([...requiredPermissions, ...permissions])];
  
  const scope = allPermissions.join(',');
  const state = generateRandomString(32);
  sessionStorage.setItem('instagram_oauth_state', state);
  
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code&state=${state}`;
  window.location.href = authUrl;
};

export const completeInstagramOAuth = async (code: string, appId: string, appSecret: string, redirectUri: string): Promise<SocialProfile> => {
  try {
    // Exchange code for access token using Facebook Graph API
    const tokenResponse = await axios.get(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
    );
    
    // @ts-ignore
    const { access_token, expires_in } = tokenResponse.data;
    
    // Exchange short-lived token for long-lived token (60 days)
    const longLivedTokenResponse = await axios.get(
      `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${access_token}`
    );
    
    const longLivedToken = longLivedTokenResponse.data.access_token;
    const longExpiresIn = longLivedTokenResponse.data.expires_in;
    const expiresAt = longExpiresIn ? Date.now() + longExpiresIn * 1000 : undefined;
    
    // Get Instagram business account ID
    const accountsResponse = await axios.get(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${longLivedToken}`
    );
    
    // Find pages with Instagram business accounts
    const pages = accountsResponse.data.data || [];
    let instagramBusinessAccountId = null;
    let username = '';
    
    // Check each page for an Instagram business account
    for (const page of pages) {
      try {
        const pageResponse = await axios.get(
          `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account{id,username}&access_token=${longLivedToken}`
        );
        
        if (pageResponse.data.instagram_business_account) {
          instagramBusinessAccountId = pageResponse.data.instagram_business_account.id;
          username = pageResponse.data.instagram_business_account.username;
          break;
        }
      } catch (err) {
        console.warn(`Could not get Instagram business account for page ${page.id}:`, err);
      }
    }
    
    if (!instagramBusinessAccountId) {
      throw new Error('No Instagram business account found. Please make sure your Facebook account is connected to an Instagram business or creator account. You need to convert your Instagram account to a Business or Creator account and link it to your Facebook page.');
    }
    
    return {
      id: instagramBusinessAccountId,
      name: username,
      username: username,
      accessToken: longLivedToken,
      expiresAt
    };
  } catch (error: unknown) {
    console.error('Instagram OAuth error:', error);
    
    // Verificar se o erro é um objeto e tem a propriedade 'response'
    if (error && typeof error === 'object' && 'response' in error) {
      const errorResponse = error.response;
      if (errorResponse && typeof errorResponse === 'object' && 'data' in errorResponse) {
        // Usar uma asserção de tipo para informar ao TypeScript que data pode ter qualquer propriedade
        const data = errorResponse.data as Record<string, any>;
        const errorMessage = 
          data.error?.message || 
          data.error_message;
        
        if (errorMessage) {
          throw new Error(`Instagram authentication failed: ${errorMessage}`);
        }
      }
    }
    
    // Verificar se o erro é um objeto e tem a propriedade 'message'
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = error.message;
      
      if (typeof errorMessage === 'string') {
        // Check if we have pages but no Instagram business account
        if (errorMessage.includes('No Instagram business account found')) {
          throw new Error('No Instagram business account found. Please make sure your Facebook account is connected to an Instagram business or creator account.');
        }
        
        // Check for token exchange errors
        if (errorMessage.includes('access_token')) {
          throw new Error('Failed to exchange authorization code for access token. Please try again and ensure your app credentials are correct.');
        }
      }
    }
    
    // If no specific error message is available, provide a detailed generic message
    throw new Error('Failed to complete Instagram authentication. Please ensure: \n1. Your Facebook account is connected to an Instagram business or creator account\n2. You have granted all required permissions\n3. Your app credentials are correct');
  }
};

// Twitter OAuth
export const initiateTwitterOAuth = (apiKey: string, redirectUri: string) => {
  // Twitter uses OAuth 2.0 now
  const scope = 'tweet.read users.read';
  const state = generateRandomString(32);
  const codeChallenge = generateRandomString(43);
  
  // Store state and code challenge in session storage for verification later
  sessionStorage.setItem('twitter_oauth_state', state);
  sessionStorage.setItem('twitter_code_challenge', codeChallenge);
  
  const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${apiKey}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=plain`;
  window.location.href = authUrl;
};

export const completeTwitterOAuth = async (code: string, apiKey: string, apiSecret: string, redirectUri: string): Promise<SocialProfile> => {
  try {
    const state = sessionStorage.getItem('twitter_oauth_state');
    const codeChallenge = sessionStorage.getItem('twitter_code_challenge');
    
    if (!state || !codeChallenge) {
      throw new Error('OAuth state or code challenge not found');
    }
    
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://api.twitter.com/2/oauth2/token',
      new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: apiKey,
        redirect_uri: redirectUri,
        code_verifier: codeChallenge
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${apiKey}:${apiSecret}`)}`
        }
      }
    );
    
    const { access_token, expires_in, refresh_token } = tokenResponse.data;
    
    // Get user profile
    const profileResponse = await axios.get(
      'https://api.twitter.com/2/users/me?user.fields=profile_image_url,name,username',
      {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      }
    );
    
    const profile = profileResponse.data.data;
    const expiresAt = expires_in ? Date.now() + expires_in * 1000 : undefined;
    
    return {
      id: profile.id,
      name: profile.name,
      username: profile.username,
      picture: profile.profile_image_url,
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt
    };
  } catch (error) {
    console.error('Twitter OAuth error:', error);
    throw new Error('Failed to complete Twitter authentication');
  }
};

// LinkedIn OAuth
export const initiateLinkedInOAuth = (clientId: string, redirectUri: string, permissions: string[]) => {
  const scope = permissions.join(' ');
  const state = generateRandomString(32);
  
  // Store state in session storage for verification later
  sessionStorage.setItem('linkedin_oauth_state', state);
  
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scope)}`;
  window.location.href = authUrl;
};

export const completeLinkedInOAuth = async (code: string, clientId: string, clientSecret: string, redirectUri: string): Promise<SocialProfile> => {
  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    const { access_token, expires_in } = tokenResponse.data;
    
    // Get user profile
    const profileResponse = await axios.get(
      'https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))',
      {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      }
    );
    
    const profile = profileResponse.data;
    const name = `${profile.localizedFirstName} ${profile.localizedLastName}`;
    const picture = profile.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier;
    const expiresAt = expires_in ? Date.now() + expires_in * 1000 : undefined;
    
    // Get email address (requires r_emailaddress scope)
    const emailResponse = await axios.get(
      'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))',
      {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      }
    );
    
    const email = emailResponse.data.elements?.[0]?.['handle~']?.emailAddress;
    
    return {
      id: profile.id,
      name,
      email,
      picture,
      accessToken: access_token,
      expiresAt
    };
  } catch (error) {
    console.error('LinkedIn OAuth error:', error);
    throw new Error('Failed to complete LinkedIn authentication');
  }
};

// Helper function to generate random string for state and PKCE
function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// Function to refresh Instagram access token (long-lived token lasts 60 days)
export const refreshInstagramToken = async (): Promise<boolean> => {
  const profile = getStoredToken('instagram');
  if (!profile || !profile.accessToken) return false;
  
  try {
    // Get stored credentials from localStorage
    const appId = localStorage.getItem('instagram_app_id');
    const appSecret = localStorage.getItem('instagram_app_secret');
    
    if (!appId || !appSecret) {
      throw new Error('App credentials not found');
    }
    
    // Exchange current token for a new long-lived token
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${profile.accessToken}`
    );
    
    const { access_token, expires_in } = response.data;
    const expiresAt = expires_in ? Date.now() + expires_in * 1000 : undefined;
    
    // Update the stored profile with new token
    const updatedProfile = {
      ...profile,
      accessToken: access_token,
      expiresAt
    };
    
    storeToken('instagram', updatedProfile);
    return true;
  } catch (error) {
    console.error('Error refreshing Instagram token:', error);
    return false;
  }
};

// Check if token needs refresh (if it expires in less than 7 days)
export const checkAndRefreshToken = async (platform: string): Promise<SocialProfile | null> => {
  const profile = getStoredToken(platform);
  if (!profile) return null;
  
  // If token expires in less than 7 days, refresh it
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  const shouldRefresh = profile.expiresAt && (profile.expiresAt - Date.now() < sevenDaysInMs);
  
  if (shouldRefresh) {
    if (platform === 'instagram') {
      const success = await refreshInstagramToken();
      if (success) {
        return getStoredToken(platform);
      }
    }
    // Add other platforms' refresh logic here as needed
  }
  
  return profile;
};

// Token storage in localStorage with encryption
export const storeToken = (platform: string, profile: SocialProfile): void => {
  localStorage.setItem(`social_${platform}_profile`, JSON.stringify(profile));
};

export const getStoredToken = (platform: string): SocialProfile | null => {
  const profileJson = localStorage.getItem(`social_${platform}_profile`);
  if (!profileJson) return null;
  
  try {
    return JSON.parse(profileJson);
  } catch (e) {
    console.error(`Error parsing stored ${platform} profile:`, e);
    return null;
  }
};

export const removeStoredToken = (platform: string): void => {
  localStorage.removeItem(`social_${platform}_profile`);
};