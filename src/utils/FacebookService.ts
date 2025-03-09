import axios from 'axios';
import { getStoredToken } from './OAuthService';

export interface FacebookPost {
  id: string;
  message?: string;
  created_time: string;
  permalink_url?: string;
  full_picture?: string;
  attachments?: {
    data: Array<{
      type: string;
      url: string;
      media?: {
        image?: {
          src: string;
        };
      };
    }>;
  };
}

export interface FacebookComment {
  id: string;
  message: string;
  created_time: string;
  from: {
    id: string;
    name: string;
    picture?: {
      data: {
        url: string;
      };
    };
  };
  like_count?: number;
}

export interface FacebookReaction {
  id: string;
  name: string;
  type: string;
  profile_type?: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

export interface FacebookShare {
  id: string;
  name: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

export interface FacebookInteractions {
  likes_count: number;
  comments_count: number;
  shares_count: number;
  reactions_count: number;
  comments?: FacebookComment[];
  reactions?: FacebookReaction[];
  shares?: FacebookShare[];
  hashtags?: string[];
  mentions?: string[];
}

export interface FacebookPostWithInteractions extends FacebookPost {
  interactions?: FacebookInteractions;
}

/**
 * Extracts hashtags from a post message
 * @param message The post message to analyze
 * @returns Array of hashtags found in the message
 */
export const extractHashtags = (message?: string): string[] => {
  if (!message) return [];
  
  const hashtagRegex = /#(\w+)/g;
  const matches = message.match(hashtagRegex);
  
  return matches ? matches.map(tag => tag.substring(1)) : [];
};

/**
 * Extracts mentions from a post message
 * @param message The post message to analyze
 * @returns Array of mentions found in the message
 */
export const extractMentions = (message?: string): string[] => {
  if (!message) return [];
  
  const mentionRegex = /@\[(\d+):(\w+)\]/g;
  const matches = message.match(mentionRegex);
  
  return matches ? matches.map(mention => {
    const parts = mention.match(/@\[(\d+):(\w+)\]/);
    return parts ? parts[2] : '';
  }).filter(Boolean) : [];
};

/**
 * Fetches user's posts from Facebook
 * @returns Promise with array of posts
 */
export const fetchUserPosts = async (): Promise<FacebookPost[]> => {
  const profile = getStoredToken('facebook');
  if (!profile) {
    throw new Error('Not authenticated with Facebook');
  }

  try {
    // Using Facebook Graph API to get user posts
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/me/posts?fields=id,message,created_time,permalink_url,full_picture,attachments{type,url,media}&access_token=${profile.accessToken}`
    );
    
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching Facebook posts:', error);
    throw new Error('Failed to fetch Facebook posts');
  }
};

/**
 * Fetches comments for a specific post
 * @param postId The ID of the post to fetch comments for
 * @returns Promise with array of comments
 */
export const fetchPostComments = async (postId: string): Promise<FacebookComment[]> => {
  const profile = getStoredToken('facebook');
  if (!profile) {
    throw new Error('Not authenticated with Facebook');
  }

  try {
    // Using Facebook Graph API to get post comments
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${postId}/comments?fields=id,message,created_time,from{id,name,picture},like_count&access_token=${profile.accessToken}`
    );
    
    return response.data.data || [];
  } catch (error) {
    console.error(`Error fetching comments for post ${postId}:`, error);
    return [];
  }
};

/**
 * Fetches reactions for a specific post
 * @param postId The ID of the post to fetch reactions for
 * @returns Promise with array of reactions
 */
export const fetchPostReactions = async (postId: string): Promise<FacebookReaction[]> => {
  const profile = getStoredToken('facebook');
  if (!profile) {
    throw new Error('Not authenticated with Facebook');
  }

  try {
    // Using Facebook Graph API to get post reactions
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${postId}/reactions?fields=id,name,type,profile_type,picture&access_token=${profile.accessToken}`
    );
    
    return response.data.data || [];
  } catch (error) {
    console.error(`Error fetching reactions for post ${postId}:`, error);
    return [];
  }
};

/**
 * Fetches shares for a specific post
 * @param postId The ID of the post to fetch shares for
 * @returns Promise with array of shares
 */
export const fetchPostShares = async (postId: string): Promise<FacebookShare[]> => {
  const profile = getStoredToken('facebook');
  if (!profile) {
    throw new Error('Not authenticated with Facebook');
  }

  try {
    // Using Facebook Graph API to get post shares
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${postId}/sharedposts?fields=id,from{id,name,picture}&access_token=${profile.accessToken}`
    );
    
    return response.data.data.map((share: any) => ({
      id: share.id,
      name: share.from?.name,
      picture: share.from?.picture
    })) || [];
  } catch (error) {
    console.error(`Error fetching shares for post ${postId}:`, error);
    return [];
  }
};

/**
 * Gets interaction data for a specific post
 * @param post The post to get interactions for
 * @returns Promise with interaction data
 */
export const getPostInteractions = async (post: FacebookPost): Promise<FacebookInteractions> => {
  const profile = getStoredToken('facebook');
  if (!profile) {
    throw new Error('Not authenticated with Facebook');
  }

  try {
    // Get post summary to get counts
    const summaryResponse = await axios.get(
      `https://graph.facebook.com/v18.0/${post.id}?fields=likes.summary(true),comments.summary(true),shares.summary(true)&access_token=${profile.accessToken}`
    );
    
    const summary = summaryResponse.data;
    
    // Get comments, reactions, and shares in parallel
    const [comments, reactions, shares] = await Promise.all([
      fetchPostComments(post.id),
      fetchPostReactions(post.id),
      fetchPostShares(post.id)
    ]);
    
    // Extract hashtags and mentions
    const hashtags = extractHashtags(post.message);
    const mentions = extractMentions(post.message);
    
    return {
      likes_count: summary.likes?.summary?.total_count || 0,
      comments_count: summary.comments?.summary?.total_count || 0,
      shares_count: summary.shares?.count || 0,
      reactions_count: reactions.length,
      comments,
      reactions,
      shares,
      hashtags,
      mentions
    };
  } catch (error) {
    console.error(`Error getting interactions for post ${post.id}:`, error);
    throw new Error('Failed to get post interactions');
  }
};

/**
 * Gets all user posts with their interactions
 * @returns Promise with array of posts with their interactions
 */
export const getUserPostsWithInteractions = async (): Promise<FacebookPostWithInteractions[]> => {
  try {
    // Get all user posts
    const posts = await fetchUserPosts();
    
    // Get interactions for each post
    const postsWithInteractions = await Promise.all(
      posts.map(async (post) => {
        const interactions = await getPostInteractions(post);
        return {
          ...post,
          interactions
        };
      })
    );
    
    return postsWithInteractions;
  } catch (error) {
    console.error('Error getting posts with interactions:', error);
    throw new Error('Failed to get posts with interactions');
  }
};