import { useState } from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  IconButton, 
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Badge
} from '@mui/material';
import { 
  MoreVert as MoreVertIcon,
  ZoomIn as ZoomInIcon, 
  ZoomOut as ZoomOutIcon,
  Fullscreen as FullscreenIcon,
  Home as HomeIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { Line, Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Mock data for the dashboard
const socialMediaData = {
  weeklyEngagement: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Likes',
        data: [650, 750, 800, 780, 750, 820, 900],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Comments',
        data: [320, 350, 300, 290, 320, 350, 380],
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Shares',
        data: [150, 170, 160, 140, 160, 180, 200],
        borderColor: 'rgb(255, 159, 64)',
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        tension: 0.4,
        fill: true
      }
    ]
  },
  followerGrowth: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Followers',
        data: [150, 200, 250, 300, 380, 420, 480],
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.4,
        fill: true
      }
    ]
  },
  topPerformers: [
    { id: 1, name: 'Marina Silva', points: 1245, interactions: 85, rank: 1 },
    { id: 2, name: 'Carlos Rodriguez', points: 980, interactions: 72, rank: 2 },
    { id: 3, name: 'Julia Nakamura', points: 845, interactions: 63, rank: 3 },
    { id: 4, name: 'Ahmed Hassan', points: 720, interactions: 58, rank: 4 }
  ],
  interactionSources: {
    labels: ['Instagram', 'Facebook', 'LinkedIn', 'Twitter'],
    datasets: [
      {
        data: [42, 28, 18, 12],
        backgroundColor: [
          'rgba(153, 102, 255, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 159, 64, 0.8)'
        ],
        borderColor: [
          'rgb(153, 102, 255)',
          'rgb(54, 162, 235)',
          'rgb(75, 192, 192)',
          'rgb(255, 159, 64)'
        ],
        borderWidth: 1
      }
    ]
  },
  contentPerformance: {
    labels: ['Immigration Tips', 'Success Stories', 'News Updates', 'Q&A Sessions', 'Team Spotlights'],
    datasets: [
      {
        label: 'Likes',
        data: [400, 350, 300, 200, 150],
        backgroundColor: 'rgba(153, 102, 255, 0.8)'
      },
      {
        label: 'Comments',
        data: [150, 120, 180, 100, 80],
        backgroundColor: 'rgba(54, 162, 235, 0.8)'
      },
      {
        label: 'Shares',
        data: [80, 60, 70, 40, 30],
        backgroundColor: 'rgba(75, 192, 192, 0.8)'
      }
    ]
  },
  gamificationRewards: [
    { id: 1, title: 'Most Engaging Post', description: 'Create the post with highest engagement rate this month', reward: '$50 Gift Card', status: 'Active', timeLeft: '5 days' },
    { id: 2, title: 'Follower Milestone', description: 'Reach 5,000 followers on your professional account', reward: 'Team Recognition Award', status: 'Active', timeLeft: '2 days' },
    { id: 3, title: 'Client Conversion', description: 'Generate the most qualified leads through social media', reward: '$100 Performance Bonus', status: 'New', timeLeft: 'Starts tomorrow' }
  ]
};

// Chart options
const lineChartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'bottom' as const,
    },
    title: {
      display: false
    },
  },
  scales: {
    y: {
      beginAtZero: true
    }
  },
  elements: {
    point: {
      radius: 2
    }
  }
};

const pieChartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'bottom' as const,
    },
    title: {
      display: false
    }
  }
};

const barChartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'bottom' as const,
    },
    title: {
      display: false
    },
  },
  scales: {
    y: {
      beginAtZero: true
    }
  }
};

const Dashboard = () => {
  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', py: 3 }}>
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            D4U Performance Analytics
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Badge badgeContent={3} color="error">
              <IconButton color="primary">
                <MoreVertIcon />
              </IconButton>
            </Badge>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Social Media Engagement */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Social Media Engagement</Typography>
                <IconButton size="small">
                  <MoreVertIcon />
                </IconButton>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mb: 1 }}>
                <IconButton size="small">
                  <ZoomOutIcon fontSize="small" />
                </IconButton>
                <IconButton size="small">
                  <ZoomInIcon fontSize="small" />
                </IconButton>
                <IconButton size="small">
                  <FullscreenIcon fontSize="small" />
                </IconButton>
                <IconButton size="small">
                  <HomeIcon fontSize="small" />
                </IconButton>
              </Box>
              <Line options={lineChartOptions} data={socialMediaData.weeklyEngagement} height={200} />
            </Paper>
          </Grid>

          {/* Follower Growth */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Follower Growth</Typography>
                <IconButton size="small">
                  <MoreVertIcon />
                </IconButton>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mb: 1 }}>
                <IconButton size="small">
                  <ZoomOutIcon fontSize="small" />
                </IconButton>
                <IconButton size="small">
                  <ZoomInIcon fontSize="small" />
                </IconButton>
                <IconButton size="small">
                  <FullscreenIcon fontSize="small" />
                </IconButton>
                <IconButton size="small">
                  <HomeIcon fontSize="small" />
                </IconButton>
              </Box>
              <Line options={lineChartOptions} data={socialMediaData.followerGrowth} height={200} />
            </Paper>
          </Grid>

          {/* Top Performers */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Top Performers</Typography>
              <List>
                {socialMediaData.topPerformers.map((performer) => (
                  <ListItem key={performer.id} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: performer.rank === 1 ? 'warning.main' : 
                                          performer.rank === 2 ? 'info.main' : 
                                          performer.rank === 3 ? 'success.main' : 'primary.main' }}>
                        {performer.rank}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={performer.name} 
                      secondary={`${performer.points} points · ${performer.interactions} interactions`} 
                    />
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      bgcolor: performer.rank === 1 ? 'warning.main' : 
                              performer.rank === 2 ? 'info.main' : 
                              performer.rank === 3 ? 'success.main' : 'primary.main',
                      color: 'white',
                      borderRadius: '50%',
                      width: 30,
                      height: 30,
                      fontSize: 12,
                      fontWeight: 'bold'
                    }}>
                      {performer.rank === 1 ? '1st' : 
                       performer.rank === 2 ? '2nd' : 
                       performer.rank === 3 ? '3rd' : '4th'}
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Interaction Sources */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Interaction Sources</Typography>
                <IconButton size="small">
                  <MoreVertIcon />
                </IconButton>
              </Box>
              <Box sx={{ height: 250, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Pie options={pieChartOptions} data={socialMediaData.interactionSources} />
              </Box>
            </Paper>
          </Grid>

          {/* Performance Metrics by Content Type */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, borderRadius: 2, height:'400px',paddingBottom:'60px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Performance Metrics by Content Type</Typography>
                <IconButton size="small">
                  <MoreVertIcon />
                </IconButton>
              </Box>
              <Bar options={barChartOptions} data={socialMediaData.contentPerformance} height={300} />
            </Paper>
          </Grid>

          {/* Upcoming Gamification Rewards */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Upcoming Gamification Rewards</Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<AddIcon />}
                  size="small"
                >
                  Add Reward
                </Button>
              </Box>
              <Grid container spacing={2}>
                {socialMediaData.gamificationRewards.map((reward) => (
                  <Grid item xs={12} md={4} key={reward.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Box 
                            sx={{ 
                              bgcolor: reward.status === 'Active' ? '#e3f2fd' : 
                                     reward.status === 'New' ? '#e8f5e9' : '#f5f5f5',
                              color: reward.status === 'Active' ? '#1976d2' : 
                                     reward.status === 'New' ? '#2e7d32' : '#757575',
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 1,
                              fontSize: 12,
                              fontWeight: 'medium'
                            }}
                          >
                            {reward.status}
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                            {reward.timeLeft}
                          </Typography>
                        </Box>
                        <Typography variant="h6" sx={{ fontSize: 16, mb: 1 }}>
                          {reward.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {reward.description}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" fontWeight="bold" color="primary">
                            {reward.reward}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard;