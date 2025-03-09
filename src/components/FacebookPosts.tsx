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
  Share as ShareIcon,
  ThumbUp as LikeIcon,
  Favorite as ReactionIcon,
  Tag as TagIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { getUserPostsWithInteractions, FacebookPostWithInteractions } from '../utils/FacebookService';

const FacebookPosts = () => {
  const [posts, setPosts] = useState<FacebookPostWithInteractions[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);

    try {
      const postsWithInteractions = await getUserPostsWithInteractions();
      setPosts(postsWithInteractions);
    } catch (err) {
      console.error('Error fetching Facebook posts:', err);
      setError('Failed to load Facebook posts. Please make sure you are connected to Facebook with the appropriate permissions.');
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
        No Facebook posts found. Make sure you have posts on your connected Facebook account and have granted the necessary permissions.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Facebook Posts and Interactions
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        View your Facebook posts and their interactions including comments, reactions, shares, and who interacted with your content.
      </Typography>

      <Grid container spacing={3}>
        {posts.map((post) => (
          <Grid item xs={12} md={6} key={post.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {post.full_picture && (
                <CardMedia
                  component="img"
                  image={post.full_picture}
                  alt="Post media"
                  sx={{ height: 0, paddingTop: '56.25%' }} // 16:9 aspect ratio
                />
              )}
              
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(post.created_time)}
                </Typography>
                
                {post.message && (
                  <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>
                    {post.message}
                  </Typography>
                )}
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
                    <LikeIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="body2">
                      {post.interactions?.likes_count || 0}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
                    <CommentIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="body2">
                      {post.interactions?.comments_count || 0}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
                    <ShareIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="body2">
                      {post.interactions?.shares_count || 0}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ReactionIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="body2">
                      {post.interactions?.reactions_count || 0}
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
                            <Avatar sx={{ width: 24, height: 24 }} src={comment.from.picture?.data.url}>
                              {comment.from.name.charAt(0).toUpperCase()}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={comment.from.name}
                            secondary={comment.message}
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 'bold' }}
                            secondaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
                
                {/* Reactions */}
                {post.interactions?.reactions && post.interactions.reactions.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Recent Reactions
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {post.interactions.reactions.slice(0, 5).map((reaction) => (
                        <Chip
                          key={reaction.id}
                          avatar={<Avatar src={reaction.picture?.data.url} />}
                          label={`${reaction.name} (${reaction.type})`}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
                
                {/* Shares */}
                {post.interactions?.shares && post.interactions.shares.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Shared by
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {post.interactions.shares.slice(0, 5).map((share) => (
                        <Chip
                          key={share.id}
                          avatar={<Avatar src={share.picture?.data.url} />}
                          label={share.name}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
                
                {post.permalink_url && (
                  <Button 
                    variant="outlined" 
                    size="small" 
                    href={post.permalink_url} 
                    target="_blank" 
                    sx={{ mt: 2 }}
                  >
                    View on Facebook
                  </Button>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default FacebookPosts;