import axios from 'axios';
import { getStoredToken } from './OAuthService';

export interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: string; // IMAGE, VIDEO, CAROUSEL_ALBUM
  media_url: string;
  permalink: string;
  thumbnail_url?: string;
  timestamp: string;
  username: string;
  children?: { data: InstagramMedia[] };
}

export interface InstagramComment {
  id: string;
  text: string;
  timestamp: string;
  username: string;
  like_count?: number;
}

export interface InstagramInsight {
  name: string;
  period: string;
  values: { value: number }[];
}

export interface InstagramInteractions {
  likes_count: number;
  comments_count: number;
  comments?: InstagramComment[];
  hashtags?: string[];
  mentions?: string[];
  insights?: InstagramInsight[];
}

/**
 * Fetches user's media from Instagram
 * @returns Promise with array of media items
 */
export const fetchUserMedia = async (): Promise<InstagramMedia[]> => {
  const profile = getStoredToken('instagram');
  if (!profile) {
    throw new Error('Not authenticated with Instagram');
  }

  try {
    // Using Instagram Graph API to get user media
    const response = await axios.get(
      `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username,children{id,media_type,media_url,thumbnail_url}&access_token=${profile.accessToken}`
    );
    
    return response.data.data;
  } catch (error) {
    console.error('Error fetching Instagram media:', error);
    throw new Error('Failed to fetch Instagram media');
  }
};

/**
 * Extracts hashtags from a caption text
 * @param caption The caption text to analyze
 * @returns Array of hashtags found in the caption
 */
export const extractHashtags = (caption?: string): string[] => {
  if (!caption) return [];
  
  const hashtagRegex = /#(\w+)/g;
  const matches = caption.match(hashtagRegex);
  
  return matches ? matches.map(tag => tag.substring(1)) : [];
};

/**
 * Extracts mentions from a caption text
 * @param caption The caption text to analyze
 * @returns Array of mentions found in the caption
 */
export const extractMentions = (caption?: string): string[] => {
  if (!caption) return [];
  
  const mentionRegex = /@(\w+)/g;
  const matches = caption.match(mentionRegex);
  
  return matches ? matches.map(mention => mention.substring(1)) : [];
};

/**
 * Fetches comments for a specific media
 * @param mediaId The ID of the media to fetch comments for
 * @returns Promise with array of comments
 */
export const fetchMediaComments = async (mediaId: string): Promise<InstagramComment[]> => {
  const profile = getStoredToken('instagram');
  if (!profile) {
    throw new Error('Not authenticated with Instagram');
  }

  try {
    // Note: This requires the instagram_manage_comments permission
    const response = await axios.get(
      `https://graph.instagram.com/${mediaId}/comments?fields=id,text,timestamp,username,like_count&access_token=${profile.accessToken}`
    );
    
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching comments for media ${mediaId}:`, error);
    return [];
  }
};

/**
 * Gets interaction data for a specific media
 * @param mediaId The ID of the media to get interactions for
 * @returns Promise with interaction data
 */
export const getMediaInteractions = async (mediaId: string, caption?: string): Promise<InstagramInteractions> => {
  const profile = getStoredToken('instagram');
  if (!profile) {
    throw new Error('Not authenticated with Instagram');
  }

  try {
    // Get comments
    const comments = await fetchMediaComments(mediaId);
    
    // Extract hashtags and mentions from caption
    const hashtags = extractHashtags(caption);
    const mentions = extractMentions(caption);
    
    // Get insights if available (requires instagram_manage_insights permission)
    let insights: InstagramInsight[] = [];
    try {
      const insightsResponse = await axios.get(
        `https://graph.instagram.com/${mediaId}/insights?metric=engagement,impressions,reach&access_token=${profile.accessToken}`
      );
      insights = insightsResponse.data.data;
    } catch (error) {
      console.warn('Could not fetch insights, may require additional permissions');
    }
    
    return {
      likes_count: 0, // Instagram API no longer provides like counts directly
      comments_count: comments.length,
      comments,
      hashtags,
      mentions,
      insights
    };
  } catch (error) {
    console.error(`Error getting interactions for media ${mediaId}:`, error);
    throw new Error('Failed to get media interactions');
  }
};

/**
 * Gets all user media with their interactions
 * @returns Promise with array of media items with their interactions
 */
export const getUserMediaWithInteractions = async () => {
  try {
    // Get all user media
    const mediaItems = await fetchUserMedia();
    
    // Get interactions for each media item
    const mediaWithInteractions = await Promise.all(
      mediaItems.map(async (media) => {
        const interactions = await getMediaInteractions(media.id, media.caption);
        return {
          ...media,
          interactions
        };
      })
    );
    
    return mediaWithInteractions;
  } catch (error) {
    console.error('Error getting media with interactions:', error);
    throw new Error('Failed to get media with interactions');
  }
};