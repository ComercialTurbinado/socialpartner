import axios from 'axios';
import { getStoredToken } from './OAuthService';

export interface TwitterTweet {
  id: string;
  text: string;
  created_at: string;
  attachments?: {
    media_keys?: string[];
  };
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
  entities?: {
    hashtags?: Array<{ tag: string }>;
    mentions?: Array<{ username: string }>;
    urls?: Array<{ url: string; expanded_url: string; display_url: string }>;
  };
  referenced_tweets?: Array<{
    type: 'retweeted' | 'quoted' | 'replied_to';
    id: string;
  }>;
  media?: TwitterMedia[];
  permalink?: string;
}

export interface TwitterMedia {
  media_key: string;
  type: 'photo' | 'video' | 'animated_gif';
  url: string;
  preview_image_url?: string;
  alt_text?: string;
}

export interface TwitterUser {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
}

export interface TwitterInteraction {
  id: string;
  author_id: string;
  author?: TwitterUser;
  text: string;
  created_at: string;
  type: 'reply' | 'retweet' | 'quote' | 'like';
}

export interface TwitterInteractions {
  retweet_count: number;
  reply_count: number;
  like_count: number;
  quote_count: number;
  replies?: TwitterInteraction[];
  retweets?: TwitterUser[];
  quotes?: TwitterInteraction[];
  likes?: TwitterUser[];
  hashtags?: string[];
  mentions?: string[];
}

export interface TwitterTweetWithInteractions extends TwitterTweet {
  interactions?: TwitterInteractions;
  author?: TwitterUser;
}

/**
 * Extracts hashtags from tweet entities
 * @param entities The tweet entities object
 * @returns Array of hashtags
 */
export const extractHashtags = (entities?: TwitterTweet['entities']): string[] => {
  if (!entities || !entities.hashtags) return [];
  return entities.hashtags.map(hashtag => hashtag.tag);
};

/**
 * Extracts mentions from tweet entities
 * @param entities The tweet entities object
 * @returns Array of mentions (usernames)
 */
export const extractMentions = (entities?: TwitterTweet['entities']): string[] => {
  if (!entities || !entities.mentions) return [];
  return entities.mentions.map(mention => mention.username);
};

/**
 * Fetches user's tweets from Twitter
 * @returns Promise with array of tweets
 */
export const fetchUserTweets = async (): Promise<TwitterTweet[]> => {
  const profile = getStoredToken('twitter');
  if (!profile) {
    throw new Error('Not authenticated with Twitter');
  }

  try {
    // Using Twitter API v2 to get user tweets
    const response = await axios.get(
      `https://api.twitter.com/2/users/me/tweets?max_results=10&tweet.fields=created_at,public_metrics,entities,attachments,referenced_tweets&expansions=attachments.media_keys&media.fields=type,url,preview_image_url`,
      {
        headers: {
          'Authorization': `Bearer ${profile.accessToken}`
        }
      }
    );
    
    const tweets = response.data.data || [];
    const media = response.data.includes?.media || [];
    
    // Attach media to tweets
    return tweets.map((tweet: TwitterTweet) => {
      if (tweet.attachments?.media_keys) {
        tweet.media = tweet.attachments.media_keys
          .map(key => media.find((m: TwitterMedia) => m.media_key === key))
          .filter(Boolean);
      }
      
      // Add permalink
      tweet.permalink = `https://twitter.com/${profile.username}/status/${tweet.id}`;
      
      return tweet;
    });
  } catch (error) {
    console.error('Error fetching Twitter tweets:', error);
    throw new Error('Failed to fetch Twitter tweets');
  }
};

/**
 * Fetches replies for a specific tweet
 * @param tweetId The ID of the tweet to fetch replies for
 * @returns Promise with array of replies
 */
export const fetchTweetReplies = async (tweetId: string): Promise<TwitterInteraction[]> => {
  const profile = getStoredToken('twitter');
  if (!profile) {
    throw new Error('Not authenticated with Twitter');
  }

  try {
    // Using Twitter API v2 to get replies to a tweet
    const response = await axios.get(
      `https://api.twitter.com/2/tweets/search/recent?query=conversation_id:${tweetId}&tweet.fields=created_at,author_id&expansions=author_id&user.fields=name,username,profile_image_url`,
      {
        headers: {
          'Authorization': `Bearer ${profile.accessToken}`
        }
      }
    );
    
    const replies = response.data.data || [];
    const users = response.data.includes?.users || [];
    
    return replies.map((reply: any) => {
      const author = users.find((user: TwitterUser) => user.id === reply.author_id);
      
      return {
        id: reply.id,
        author_id: reply.author_id,
        author,
        text: reply.text,
        created_at: reply.created_at,
        type: 'reply'
      };
    });
  } catch (error) {
    console.error(`Error fetching replies for tweet ${tweetId}:`, error);
    return [];
  }
};

/**
 * Fetches users who retweeted a specific tweet
 * @param tweetId The ID of the tweet to fetch retweets for
 * @returns Promise with array of users
 */
export const fetchTweetRetweets = async (tweetId: string): Promise<TwitterUser[]> => {
  const profile = getStoredToken('twitter');
  if (!profile) {
    throw new Error('Not authenticated with Twitter');
  }

  try {
    // Using Twitter API v2 to get users who retweeted a tweet
    const response = await axios.get(
      `https://api.twitter.com/2/tweets/${tweetId}/retweeted_by?user.fields=name,username,profile_image_url`,
      {
        headers: {
          'Authorization': `Bearer ${profile.accessToken}`
        }
      }
    );
    
    return response.data.data || [];
  } catch (error) {
    console.error(`Error fetching retweets for tweet ${tweetId}:`, error);
    return [];
  }
};

/**
 * Fetches users who liked a specific tweet
 * @param tweetId The ID of the tweet to fetch likes for
 * @returns Promise with array of users
 */
export const fetchTweetLikes = async (tweetId: string): Promise<TwitterUser[]> => {
  const profile = getStoredToken('twitter');
  if (!profile) {
    throw new Error('Not authenticated with Twitter');
  }

  try {
    // Using Twitter API v2 to get users who liked a tweet
    const response = await axios.get(
      `https://api.twitter.com/2/tweets/${tweetId}/liking_users?user.fields=name,username,profile_image_url`,
      {
        headers: {
          'Authorization': `Bearer ${profile.accessToken}`
        }
      }
    );
    
    return response.data.data || [];
  } catch (error) {
    console.error(`Error fetching likes for tweet ${tweetId}:`, error);
    return [];
  }
};

/**
 * Gets interaction data for a specific tweet
 * @param tweet The tweet to get interactions for
 * @returns Promise with interaction data
 */
export const getTweetInteractions = async (tweet: TwitterTweet): Promise<TwitterInteractions> => {
  const profile = getStoredToken('twitter');
  if (!profile) {
    throw new Error('Not authenticated with Twitter');
  }

  try {
    // Extract metrics from tweet
    const metrics = tweet.public_metrics || {
      retweet_count: 0,
      reply_count: 0,
      like_count: 0,
      quote_count: 0
    };
    
    // Get replies, retweets, and likes in parallel
    const [replies, retweets, likes] = await Promise.all([
      fetchTweetReplies(tweet.id),
      fetchTweetRetweets(tweet.id),
      fetchTweetLikes(tweet.id)
    ]);
    
    // Extract hashtags and mentions
    const hashtags = extractHashtags(tweet.entities);
    const mentions = extractMentions(tweet.entities);
    
    return {
      retweet_count: metrics.retweet_count,
      reply_count: metrics.reply_count,
      like_count: metrics.like_count,
      quote_count: metrics.quote_count,
      replies,
      retweets,
      likes,
      hashtags,
      mentions
    };
  } catch (error) {
    console.error(`Error getting interactions for tweet ${tweet.id}:`, error);
    throw new Error('Failed to get tweet interactions');
  }
};

/**
 * Fetches the author of a tweet
 * @param authorId The ID of the tweet author
 * @returns Promise with user data
 */
export const fetchTweetAuthor = async (authorId: string): Promise<TwitterUser | null> => {
  const profile = getStoredToken('twitter');
  if (!profile) {
    throw new Error('Not authenticated with Twitter');
  }

  try {
    // Using Twitter API v2 to get user data
    const response = await axios.get(
      `https://api.twitter.com/2/users/${authorId}?user.fields=name,username,profile_image_url`,
      {
        headers: {
          'Authorization': `Bearer ${profile.accessToken}`
        }
      }
    );
    
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching user ${authorId}:`, error);
    return null;
  }
};

/**
 * Gets all user tweets with their interactions
 * @returns Promise with array of tweets with their interactions
 */
export const getUserTweetsWithInteractions = async (): Promise<TwitterTweetWithInteractions[]> => {
  try {
    // Get all user tweets
    const tweets = await fetchUserTweets();
    
    // Get interactions for each tweet
    const tweetsWithInteractions = await Promise.all(
      tweets.map(async (tweet) => {
        const interactions = await getTweetInteractions(tweet);
        return {
          ...tweet,
          interactions
        };
      })
    );
    
    return tweetsWithInteractions;
  } catch (error) {
    console.error('Error getting tweets with interactions:', error);
    throw new Error('Failed to get tweets with interactions');
  }
};