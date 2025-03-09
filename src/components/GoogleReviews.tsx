import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Rating,
  List,
  ListItem,
  Divider,
  CircularProgress,
  Alert,
  TextField,
  Button,
  Stack
} from '@mui/material';
import { LoadScript } from '@react-google-maps/api';

interface Review {
  author_name: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}

const GoogleReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placeId, setPlaceId] = useState('');

  const fetchReviews = async () => {
    if (!placeId) {
      setError('Please enter a valid Place ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Initialize the Places service
      const service = new google.maps.places.PlacesService(
        document.createElement('div')
      );

      service.getDetails(
        {
          placeId: placeId,
          fields: ['reviews']
        },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place?.reviews) {
            // Filter out any reviews with undefined ratings and map to ensure all required fields
            const validReviews = place.reviews
              .filter((review): review is google.maps.places.PlaceReview & {rating: number} => 
                typeof review.rating === 'number'
              )
              .map(review => ({
                author_name: review.author_name || '',
                rating: review.rating,
                relative_time_description: review.relative_time_description || '',
                text: review.text || '',
                time: review.time || 0
              }));
            setReviews(validReviews);
          } else {
            setError('Failed to fetch reviews. Please check the Place ID and try again.');
          }
          setLoading(false);
        }
      );
    } catch (err) {
      setError('An error occurred while fetching reviews');
      setLoading(false);
    }
  };

  return (
    <LoadScript
      googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}
      libraries={['places']}
    >
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Google Reviews
        </Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                label="Place ID"
                value={placeId}
                onChange={(e) => setPlaceId(e.target.value)}
                fullWidth
                helperText="Enter your Google Place ID"
              />
              <Button
                variant="contained"
                onClick={fetchReviews}
                disabled={loading || !placeId}
              >
                Fetch Reviews
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {reviews.length > 0 && (
          <List>
            {reviews.map((review, index) => (
              <Box key={review.time}>
                <ListItem>
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {review.author_name}
                    </Typography>
                    <Rating value={review.rating} readOnly />
                    <Typography variant="body2" color="text.secondary">
                      {review.relative_time_description}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      {review.text}
                    </Typography>
                  </Box>
                </ListItem>
                {index < reviews.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        )}

        {!loading && !error && reviews.length === 0 && (
          <Typography variant="body1" color="text.secondary" align="center">
            No reviews to display. Enter a Place ID and click "Fetch Reviews" to get started.
          </Typography>
        )}
      </Box>
    </LoadScript>
  );
};

export default GoogleReviews;