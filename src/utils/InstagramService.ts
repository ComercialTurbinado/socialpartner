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

export interface InstagramLiker {
  username: string;
  name?: string;
}

export interface InstagramInteractions {
  likes_count: number;
  comments_count: number;
  comments?: InstagramComment[];
  hashtags?: string[];
  mentions?: string[];
  insights?: InstagramInsight[];
  likers?: InstagramLiker[];
}

/**
 * Fetches user's media from Instagram using the Graph API
 * @returns Promise with array of media items
 */
/**
 * Checks if the user has a valid Instagram business account
 * @returns Boolean indicating if user has a valid Instagram business account
 */
export const hasValidInstagramAccount = (): boolean => {
  const profile = getStoredToken('instagram');
  if (!profile) return false;
  
  // Check if we have a valid Instagram business account ID
  // Look for either direct ID or check in rawPageResponses for connected accounts
  return !!(profile.id || 
    (profile.rawPageResponses && profile.rawPageResponses.some(page => 
      page.instagram_business_account || page.connected_instagram_account
    )));
};

export const fetchUserMedia = async (): Promise<InstagramMedia[]> => {
  const profile = getStoredToken('instagram');
  if (!profile) {
    throw new Error('Not authenticated with Instagram');
  }
  
  // Get Instagram business account ID - either directly from profile or from page responses
  let instagramId = profile.id;
  
  // If no direct ID, try to find it in the rawPageResponses
  if (!instagramId && profile.rawPageResponses) {
    for (const page of profile.rawPageResponses) {
      if (page.instagram_business_account) {
        instagramId = page.instagram_business_account.id;
        break;
      } else if (page.connected_instagram_account) {
        instagramId = page.connected_instagram_account.id;
        break;
      }
    }
  }
  
  if (!instagramId) {
    throw new Error('No Instagram business account found. Please make sure you have a business or creator account connected to a Facebook page.');
  }

  try {
    // Using Instagram Graph API to get user media
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${instagramId}/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username,children{id,media_type,media_url,thumbnail_url}&access_token=${profile.accessToken}`
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
      `https://graph.facebook.com/v18.0/${mediaId}/comments?fields=id,text,timestamp,username,like_count&access_token=${profile.accessToken}`
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
/**
 * Fetches users who liked a specific media
 * @param mediaId The ID of the media to fetch likes for
 * @returns Promise with array of users who liked the post
 */
export const fetchMediaLikes = async (mediaId: string): Promise<InstagramLiker[]> => {
  const profile = getStoredToken('instagram');
  if (!profile) {
    throw new Error('Not authenticated with Instagram');
  }

  try {
    // Note: This requires the instagram_manage_insights permission
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${mediaId}/likes?fields=username,name&access_token=${profile.accessToken}`
    );
    
    return response.data.data || [];
  } catch (error) {
    console.error(`Error fetching likes for media ${mediaId}:`, error);
    return [];
  }
};

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
    let likesCount = 0;
    let likers: InstagramLiker[] = [];
    
    try {
      // Get insights metrics for the post
      const insightsResponse = await axios.get(
        `https://graph.facebook.com/v18.0/${mediaId}/insights?metric=engagement,impressions,reach,saved,likes,comments&access_token=${profile.accessToken}`
      );
      insights = insightsResponse.data.data;
      
      // Find likes metric in insights
      const likesMetric = insights.find(insight => insight.name === 'likes');
      if (likesMetric && likesMetric.values && likesMetric.values.length > 0) {
        likesCount = likesMetric.values[0].value || 0;
      }
      
      // Get users who liked the post
      likers = await fetchMediaLikes(mediaId);
    } catch (error) {
      console.warn('Could not fetch insights, may require additional permissions:', error);
    }
    
    return {
      likes_count: likesCount,
      comments_count: comments.length,
      comments,
      hashtags,
      mentions,
      insights,
      likers
    };
  } catch (error) {
    console.error(`Error getting interactions for media ${mediaId}:`, error);
    throw new Error('Failed to get media interactions');
  }
};

/**
 * Fetches media where the user is tagged
 * @returns Promise with array of media items where user is tagged
 */
export const fetchUserTags = async (): Promise<InstagramMedia[]> => {
  const profile = getStoredToken('instagram');
  if (!profile) {
    throw new Error('Not authenticated with Instagram');
  }

  try {
    // Using Instagram Graph API to get media where user is tagged
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${profile.id}/tags?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username&access_token=${profile.accessToken}`
    );
    
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching Instagram tags:', error);
    return [];
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