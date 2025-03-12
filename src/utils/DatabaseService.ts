import axios from 'axios';
import type { SocialProfile } from './OAuthService';

// Function to store social media credentials in the database via API
export const storeSocialCredentials = async (
  platform: string,
  profile: SocialProfile,
  userId: string = 'default-user' // Default user ID if not provided
): Promise<void> => {
  try {
    // Send request to the API endpoint
    const response = await axios.post(`/api/database/credentials/${platform}`, {
      ...profile,
      userId
    });
    
    if (!response.data.success) {
      throw new Error(`Failed to store ${platform} credentials`);
    }
  } catch (error) {
    console.error(`Error storing ${platform} credentials:`, error);
    throw new Error(`Failed to store ${platform} credentials`);
  }
};

// Function to get social media credentials from the database via API
export const getSocialCredentials = async (
  platform: string,
  userId: string = 'default-user'
): Promise<SocialProfile | null> => {
  try {
    // Send request to the API endpoint
    const response = await axios.get(`/api/database/credentials/${platform}`, {
      params: { userId }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error retrieving ${platform} credentials:`, error);
    return null;
  }
};

// Function to remove social media credentials from the database via API
export const removeSocialCredentials = async (
  platform: string,
  userId: string = 'default-user'
): Promise<boolean> => {
  try {
    // Send request to the API endpoint
    const response = await axios.delete(`/api/database/credentials/${platform}`, {
      params: { userId }
    });
    
    return response.data.success;
  } catch (error) {
    console.error(`Error removing ${platform} credentials:`, error);
    return false;
  }
};