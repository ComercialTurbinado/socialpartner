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

// Instagram OAuth (via Facebook)
export const initiateInstagramOAuth = (appId: string, redirectUri: string, permissions: string[]) => {
  const scope = permissions.join(',');
  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`;
  window.location.href = authUrl;
};

export const completeInstagramOAuth = async (code: string, appId: string, appSecret: string, redirectUri: string): Promise<SocialProfile> => {
  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://api.instagram.com/oauth/access_token',
      {
        client_id: appId,
        client_secret: appSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    const { access_token, user_id } = tokenResponse.data;
    
    // Get user profile
    const profileResponse = await axios.get(
      `https://graph.instagram.com/${user_id}?fields=id,username&access_token=${access_token}`
    );
    
    const profile = profileResponse.data;
    
    return {
      id: profile.id,
      name: profile.username,
      username: profile.username,
      accessToken: access_token
    };
  } catch (error) {
    console.error('Instagram OAuth error:', error);
    throw new Error('Failed to complete Instagram authentication');
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