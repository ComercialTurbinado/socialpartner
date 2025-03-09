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
  Tag as TagIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { getUserMediaWithInteractions, InstagramMedia } from '../utils/InstagramService';

interface InstagramPostWithInteractions extends InstagramMedia {
  interactions?: {
    likes_count: number;
    comments_count: number;
    comments?: Array<{
      id: string;
      text: string;
      timestamp: string;
      username: string;
      like_count?: number;
    }>;
    hashtags?: string[];
    mentions?: string[];
    insights?: Array<{
      name: string;
      period: string;
      values: { value: number }[];
    }>;
  };
}

const InstagramPosts = () => {
  const [posts, setPosts] = useState<InstagramPostWithInteractions[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);

    try {
      const mediaWithInteractions = await getUserMediaWithInteractions();
      setPosts(mediaWithInteractions);
    } catch (err) {
      console.error('Error fetching Instagram posts:', err);
      setError('Failed to load Instagram posts. Please make sure you are connected to Instagram with the appropriate permissions.');
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
          onClick={fetchPosts}
        >
          Retry
        </Button>
      </Alert>
    );
  }

  if (posts.length === 0) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        No Instagram posts found. Make sure you have posts on your connected Instagram account and have granted the necessary permissions.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Instagram Posts and Interactions
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        View your Instagram posts and their interactions including comments, hashtags, and mentions.
      </Typography>

      <Grid container spacing={3}>
        {posts.map((post) => (
          <Grid item xs={12} md={6} lg={4} key={post.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {post.media_type === 'VIDEO' ? (
                <Box sx={{ position: 'relative', pt: '100%' }}>
                  <Box
                    component="video"
                    src={post.media_url}
                    controls
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </Box>
              ) : (
                <CardMedia
                  component="img"
                  image={post.media_url}
                  alt={post.caption || 'Instagram post'}
                  sx={{ pt: '100%', objectFit: 'cover' }}
                />
              )}
              
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(post.timestamp)}
                </Typography>
                
                {post.caption && (
                  <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>
                    {post.caption}
                  </Typography>
                )}
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
                    <CommentIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="body2">
                      {post.interactions?.comments_count || 0} comments
                    </Typography>
                  </Box>
                </Box>
                
                {/* Hashtags */}
                {post.interactions?.hashtags && post.interactions.hashtags.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <TagIcon fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="body2">Hashtags:</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {post.interactions.hashtags.map((tag, index) => (
                        <Chip key={index} label={`#${tag}`} size="small" />
                      ))}
                    </Box>
                  </Box>
                )}
                
                {/* Mentions */}
                {post.interactions?.mentions && post.interactions.mentions.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PersonIcon fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="body2">Mentions:</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {post.interactions.mentions.map((mention, index) => (
                        <Chip key={index} label={`@${mention}`} size="small" />
                      ))}
                    </Box>
                  </Box>
                )}
                
                {/* Comments */}
                {post.interactions?.comments && post.interactions.comments.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                      Recent Comments
                    </Typography>
                    <List dense disablePadding>
                      {post.interactions.comments.slice(0, 3).map((comment) => (
                        <ListItem key={comment.id} alignItems="flex-start" disableGutters>
                          <ListItemAvatar>
                            <Avatar sx={{ width: 24, height: 24 }}>
                              {comment.username.charAt(0).toUpperCase()}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={comment.username}
                            secondary={comment.text}
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 'bold' }}
                            secondaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
                
                <Button 
                  variant="outlined" 
                  size="small" 
                  href={post.permalink} 
                  target="_blank" 
                  sx={{ mt: 2 }}
                >
                  View on Instagram
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default InstagramPosts;