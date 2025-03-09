import axios from 'axios';
import { getStoredToken } from './OAuthService';

export interface LinkedInPost {
  id: string;
  author: string;
  created_time: string;
  text?: string;
  content?: {
    contentEntities?: Array<{
      entityLocation: string;
      thumbnails?: Array<{
        resolvedUrl: string;
      }>;
    }>;
  };
  permalink?: string;
  thumbnailUrl?: string;
}

export interface LinkedInComment {
  id: string;
  text: string;
  created_time: string;
  author: {
    id: string;
    name: string;
    picture?: string;
  };
  likes_count?: number;
}

export interface LinkedInLike {
  id: string;
  name: string;
  picture?: string;
}

export interface LinkedInShare {
  id: string;
  name: string;
  picture?: string;
}

export interface LinkedInInteractions {
  likes_count: number;
  comments_count: number;
  shares_count: number;
  comments?: LinkedInComment[];
  likes?: LinkedInLike[];
  shares?: LinkedInShare[];
  hashtags?: string[];
  mentions?: string[];
}

export interface LinkedInPostWithInteractions extends LinkedInPost {
  interactions?: LinkedInInteractions;
}

/**
 * Extracts hashtags from a post text
 * @param text The post text to analyze
 * @returns Array of hashtags found in the text
 */
export const extractHashtags = (text?: string): string[] => {
  if (!text) return [];
  
  const hashtagRegex = /#(\w+)/g;
  const matches = text.match(hashtagRegex);
  
  return matches ? matches.map(tag => tag.substring(1)) : [];
};

/**
 * Extracts mentions from a post text
 * @param text The post text to analyze
 * @returns Array of mentions found in the text
 */
export const extractMentions = (text?: string): string[] => {
  if (!text) return [];
  
  const mentionRegex = /@\[(\d+):(\w+)\]/g;
  const matches = text.match(mentionRegex);
  
  return matches ? matches.map(mention => {
    const parts = mention.match(/@\[(\d+):(\w+)\]/);
    return parts ? parts[2] : '';
  }).filter(Boolean) : [];
};

/**
 * Fetches user's posts from LinkedIn
 * @returns Promise with array of posts
 */
export const fetchUserPosts = async (): Promise<LinkedInPost[]> => {
  const profile = getStoredToken('linkedin');
  if (!profile) {
    throw new Error('Not authenticated with LinkedIn');
  }

  try {
    // Using LinkedIn API to get user posts
    const response = await axios.get(
      `https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(${profile.id})&count=10`,
      {
        headers: {
          'Authorization': `Bearer ${profile.accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      }
    );
    
    const posts = response.data.elements || [];
    
    // Process posts to standardize format
    return posts.map((post: any) => {
      const specificContent = post.specificContent?.['com.linkedin.ugc.ShareContent'];
      const media = specificContent?.media;
      const thumbnailUrl = media?.[0]?.thumbnails?.[0]?.resolvedUrl;
      
      return {
        id: post.id,
        author: post.author,
        created_time: post.created?.time,
        text: specificContent?.text,
        content: specificContent,
        thumbnailUrl,
        permalink: `https://www.linkedin.com/feed/update/${post.id}/`
      };
    });
  } catch (error) {
    console.error('Error fetching LinkedIn posts:', error);
    throw new Error('Failed to fetch LinkedIn posts');
  }
};

/**
 * Fetches comments for a specific post
 * @param postId The ID of the post to fetch comments for
 * @returns Promise with array of comments
 */
export const fetchPostComments = async (postId: string): Promise<LinkedInComment[]> => {
  const profile = getStoredToken('linkedin');
  if (!profile) {
    throw new Error('Not authenticated with LinkedIn');
  }

  try {
    // Using LinkedIn API to get post comments
    const response = await axios.get(
      `https://api.linkedin.com/v2/socialActions/${postId}/comments`,
      {
        headers: {
          'Authorization': `Bearer ${profile.accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      }
    );
    
    const comments = response.data.elements || [];
    
    // Process comments to standardize format
    return Promise.all(comments.map(async (comment: any) => {
      // Fetch commenter profile
      const authorProfile = await fetchUserProfile(comment.actor);
      
      return {
        id: comment.id,
        text: comment.message?.text,
        created_time: comment.created?.time,
        author: {
          id: comment.actor,
          name: authorProfile?.name || 'LinkedIn User',
          picture: authorProfile?.picture
        },
        likes_count: comment.likesSummary?.totalLikes || 0
      };
    }));
  } catch (error) {
    console.error(`Error fetching comments for post ${postId}:`, error);
    return [];
  }
};

/**
 * Fetches likes for a specific post
 * @param postId The ID of the post to fetch likes for
 * @returns Promise with array of likes
 */
export const fetchPostLikes = async (postId: string): Promise<LinkedInLike[]> => {
  const profile = getStoredToken('linkedin');
  if (!profile) {
    throw new Error('Not authenticated with LinkedIn');
  }

  try {
    // Using LinkedIn API to get post likes
    const response = await axios.get(
      `https://api.linkedin.com/v2/socialActions/${postId}/likes`,
      {
        headers: {
          'Authorization': `Bearer ${profile.accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      }
    );
    
    const likes = response.data.elements || [];
    
    // Process likes to standardize format
    return Promise.all(likes.map(async (like: any) => {
      // Fetch liker profile
      const likerProfile = await fetchUserProfile(like.actor);
      
      return {
        id: like.actor,
        name: likerProfile?.name || 'LinkedIn User',
        picture: likerProfile?.picture
      };
    }));
  } catch (error) {
    console.error(`Error fetching likes for post ${postId}:`, error);
    return [];
  }
};

/**
 * Fetches shares for a specific post
 * @param postId The ID of the post to fetch shares for
 * @returns Promise with array of shares
 */
export const fetchPostShares = async (postId: string): Promise<LinkedInShare[]> => {
  const profile = getStoredToken('linkedin');
  if (!profile) {
    throw new Error('Not authenticated with LinkedIn');
  }

  try {
    // Using LinkedIn API to get post shares
    const response = await axios.get(
      `https://api.linkedin.com/v2/socialActions/${postId}/resharesByActor`,
      {
        headers: {
          'Authorization': `Bearer ${profile.accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      }
    );
    
    const shares = response.data.elements || [];
    
    // Process shares to standardize format
    return Promise.all(shares.map(async (share: any) => {
      // Fetch sharer profile
      const sharerProfile = await fetchUserProfile(share.actor);
      
      return {
        id: share.actor,
        name: sharerProfile?.name || 'LinkedIn User',
        picture: sharerProfile?.picture
      };
    }));
  } catch (error) {
    console.error(`Error fetching shares for post ${postId}:`, error);
    return [];
  }
};

/**
 * Fetches a user profile by ID
 * @param userId The ID of the user to fetch
 * @returns Promise with user profile data
 */
export const fetchUserProfile = async (userId: string): Promise<{name: string, picture?: string} | null> => {
  const profile = getStoredToken('linkedin');
  if (!profile) {
    throw new Error('Not authenticated with LinkedIn');
  }

  try {
    // Using LinkedIn API to get user profile
    const response = await axios.get(
      `https://api.linkedin.com/v2/people/${userId}?projection=(id,firstName,lastName,profilePicture)`,
      {
        headers: {
          'Authorization': `Bearer ${profile.accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      }
    );
    
    const userData = response.data;
    const firstName = userData.firstName?.localized?.en_US || '';
    const lastName = userData.lastName?.localized?.en_US || '';
    const picture = userData.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier;
    
    return {
      name: `${firstName} ${lastName}`.trim(),
      picture
    };
  } catch (error) {
    console.error(`Error fetching user profile ${userId}:`, error);
    return null;
  }
};

/**
 * Gets interaction data for a specific post
 * @param post The post to get interactions for
 * @returns Promise with interaction data
 */
export const getPostInteractions = async (post: LinkedInPost): Promise<LinkedInInteractions> => {
  const profile = getStoredToken('linkedin');
  if (!profile) {
    throw new Error('Not authenticated with LinkedIn');
  }

  try {
    // Get post social actions summary
    const summaryResponse = await axios.get(
      `https://api.linkedin.com/v2/socialActions/${post.id}`,
      {
        headers: {
          'Authorization': `Bearer ${profile.accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      }
    );
    
    const summary = summaryResponse.data;
    
    // Get comments, likes, and shares in parallel
    const [comments, likes, shares] = await Promise.all([
      fetchPostComments(post.id),
      fetchPostLikes(post.id),
      fetchPostShares(post.id)
    ]);
    
    // Extract hashtags and mentions
    const hashtags = extractHashtags(post.text);
    const mentions = extractMentions(post.text);
    
    return {
      likes_count: summary.likesSummary?.totalLikes || 0,
      comments_count: summary.commentsSummary?.totalComments || 0,
      shares_count: summary.resharesSummary?.totalReshares || 0,
      comments,
      likes,
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
export const getUserPostsWithInteractions = async (): Promise<LinkedInPostWithInteractions[]> => {
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