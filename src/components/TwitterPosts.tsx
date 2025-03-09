import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import {
  Comment as CommentIcon,
  Repeat as RetweetIcon,
  Favorite as LikeIcon,
  FormatQuote as QuoteIcon,
  Tag as TagIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { getUserTweetsWithInteractions, TwitterTweetWithInteractions } from '../utils/TwitterService';

const TwitterPosts = () => {
  const [tweets, setTweets] = useState<TwitterTweetWithInteractions[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTweets();
  }, []);

  const fetchTweets = async () => {
    setLoading(true);
    setError(null);

    try {
      const tweetsWithInteractions = await getUserTweetsWithInteractions();
      setTweets(tweetsWithInteractions);
    } catch (err) {
      console.error('Error fetching Twitter tweets:', err);
      setError('Failed to load Twitter tweets. Please make sure you are connected to Twitter with the appropriate permissions.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
        <Button 
          variant="outlined" 
          size="small" 
          sx={{ ml: 2 }} 
          onClick={fetchTweets}
        >
          Retry
        </Button>
      </Alert>
    );
  }

  if (tweets.length === 0) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        No Twitter tweets found. Make sure you have tweets on your connected Twitter account and have granted the necessary permissions.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Twitter Tweets and Interactions
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        View your Twitter tweets and their interactions including replies, retweets, likes, and mentions.
      </Typography>

      <Grid container spacing={3}>
        {tweets.map((tweet) => (
          <Grid item xs={12} md={6} key={tweet.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {tweet.media && tweet.media.length > 0 && (
                <CardMedia
                  component={tweet.media[0].type === 'video' ? 'video' : 'img'}
                  image={tweet.media[0].type === 'video' ? tweet.media[0].preview_image_url || '' : tweet.media[0].url}
                  alt="Tweet media"
                  controls={tweet.media[0].type === 'video'}
                  sx={{ height: 0, paddingTop: '56.25%' }} // 16:9 aspect ratio
                />
              )}
              
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(tweet.created_at)}
                </Typography>
                
                <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>
                  {tweet.text}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
                    <RetweetIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="body2">
                      {tweet.interactions?.retweet_count || 0}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
                    <CommentIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="body2">
                      {tweet.interactions?.reply_count || 0}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
                    <LikeIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="body2">
                      {tweet.interactions?.like_count || 0}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <QuoteIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="body2">
                      {tweet.interactions?.quote_count || 0}
                    </Typography>
                  </Box>
                </Box>
                
                {/* Hashtags */}
                {tweet.interactions?.hashtags && tweet.interactions.hashtags.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <TagIcon fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="body2">Hashtags:</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {tweet.interactions.hashtags.map((tag, index) => (
                        <Chip key={index} label={`#${tag}`} size="small" />
                      ))}
                    </Box>
                  </Box>
                )}
                
                {/* Mentions */}
                {tweet.interactions?.mentions && tweet.interactions.mentions.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PersonIcon fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="body2">Mentions:</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {tweet.interactions.mentions.map((mention, index) => (
                        <Chip key={index} label={`@${mention}`} size="small" />
                      ))}
                    </Box>
                  </Box>
                )}
                
                {/* Replies */}
                {tweet.interactions?.replies && tweet.interactions.replies.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                      Recent Replies
                    </Typography>
                    <List dense disablePadding>
                      {tweet.interactions.replies.slice(0, 3).map((reply) => (
                        <ListItem key={reply.id} alignItems="flex-start" disableGutters>
                          <ListItemAvatar>
                            <Avatar sx={{ width: 24, height: 24 }} src={reply.author?.profile_image_url}>
                              {reply.author?.name.charAt(0).toUpperCase()}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={reply.author?.name || '@' + reply.author?.username}
                            secondary={reply.text}
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 'bold' }}
                            secondaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
                
                {/* Retweets */}
                {tweet.interactions?.retweets && tweet.interactions.retweets.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Retweeted by
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {tweet.interactions.retweets.slice(0, 5).map((user) => (
                        <Chip
                          key={user.id}
                          avatar={<Avatar src={user.profile_image_url} />}
                          label={user.name}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
                
                {/* Likes */}
                {tweet.interactions?.likes && tweet.interactions.likes.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Liked by
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {tweet.interactions.likes.slice(0, 5).map((user) => (
                        <Chip
                          key={user.id}
                          avatar={<Avatar src={user.profile_image_url} />}
                          label={user.name}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
                
                <Button 
                  variant="outlined" 
                  size="small" 
                  href={tweet.permalink || '#'} 
                  target="_blank" 
                  sx={{ mt: 2 }}
                >
                  View on Twitter
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default TwitterPosts;