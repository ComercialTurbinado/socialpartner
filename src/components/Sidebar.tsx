import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  Typography,
  useMediaQuery,
  useTheme,
  Collapse
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  BarChart as AnalyticsIcon,
  People as PeopleIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Instagram as InstagramIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  EmojiEvents as RewardsIcon,
  RateReview as ReviewsIcon,
  ExpandLess,
  ExpandMore,
  PhotoLibrary,
  Policy as PolicyIcon
  
} from '@mui/icons-material';

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics' },
  { text: 'Social Media', icon: <InstagramIcon />, path: '/social-media' },
  { text: 'Top Performers', icon: <PeopleIcon />, path: '/performers' },
  { text: 'Rewards', icon: <RewardsIcon />, path: '/rewards' },
  { text: 'Notifications', icon: <NotificationsIcon />, path: '/notifications' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

const socialItems = [
  { text: 'Instagram', icon: <InstagramIcon />, path: '/instagram', subItems: [
    { text: 'Connect', icon: <PhotoLibrary />, path: '/instagram' },
    { text: 'Posts', icon: <PhotoLibrary />, path: '/instagram/posts' },
    { text: 'Interactions', icon: <PhotoLibrary />, path: '/instagram/interactions' }
  ] },
  { text: 'Facebook', icon: <FacebookIcon />, path: '/facebook', subItems: [
    { text: 'Connect', icon: <PhotoLibrary />, path: '/facebook' },
    { text: 'Posts', icon: <PhotoLibrary />, path: '/facebook/posts' },
    { text: 'Interactions', icon: <PhotoLibrary />, path: '/facebook/interactions' }
  ] },
  { text: 'Twitter', icon: <TwitterIcon />, path: '/twitter', subItems: [
    { text: 'Connect', icon: <PhotoLibrary />, path: '/twitter' },
    { text: 'Posts', icon: <PhotoLibrary />, path: '/twitter/posts' },
    { text: 'Interactions', icon: <PhotoLibrary />, path: '/twitter/interactions' }
  ] },
  { text: 'LinkedIn', icon: <LinkedInIcon />, path: '/linkedin', subItems: [
    { text: 'Connect', icon: <PhotoLibrary />, path: '/linkedin' },
    { text: 'Posts', icon: <PhotoLibrary />, path: '/linkedin/posts' },
    { text: 'Interactions', icon: <PhotoLibrary />, path: '/linkedin/interactions' }
  ] },
  { text: 'Google Reviews', icon: <ReviewsIcon />, path: '/google-reviews' },
];

const Sidebar = ({ open, onToggle }: SidebarProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  return (
    <>
      {/* Mobile menu toggle button */}
      {isMobile && (
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={onToggle}
          edge="start"
          sx={{
            position: 'fixed',
            top: 10,
            left: open ? drawerWidth + 10 : 10,
            zIndex: 1300,
            transition: theme.transitions.create(['left'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          }}
        >
          {open ? <ChevronLeftIcon /> : <MenuIcon />}
        </IconButton>
      )}

      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? open : true}
        onClose={isMobile ? onToggle : undefined}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
            backgroundColor: '#ffffff',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Social Partner
          </Typography>
          {!isMobile && (
            <IconButton onClick={onToggle}>
              {open ? <ChevronLeftIcon /> : <MenuIcon />}
            </IconButton>
          )}
        </Box>
        <Divider />
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                component={Link}
                to={item.path}
                sx={{
                  minHeight: 48,
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: 2,
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider />
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            SOCIAL PLATFORMS
          </Typography>
        </Box>
        <List>
          {socialItems.map((item) => {
            const [open, setOpen] = useState(false);
            const hasSubItems = item.subItems && item.subItems.length > 0;
            
            return (
              <Box key={item.text}>
                <ListItem disablePadding>
                  <ListItemButton
                    component={hasSubItems ? 'div' : Link}
                    to={hasSubItems ? undefined : item.path}
                    onClick={hasSubItems ? () => setOpen(!open) : undefined}
                    sx={{
                      minHeight: 48,
                      px: 2.5,
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: 2,
                        justifyContent: 'center',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.text} />
                    {hasSubItems && (open ? <ExpandLess /> : <ExpandMore />)}
                  </ListItemButton>
                </ListItem>
                
                {hasSubItems && (
                  <Collapse in={open} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {item.subItems.map((subItem) => (
                        <ListItemButton
                          key={subItem.text}
                          component={Link}
                          to={subItem.path}
                          sx={{ pl: 4 }}
                        >
                          <ListItemIcon
                            sx={{
                              minWidth: 0,
                              mr: 2,
                              justifyContent: 'center',
                            }}
                          >
                            {subItem.icon}
                          </ListItemIcon>
                          <ListItemText primary={subItem.text} />
                        </ListItemButton>
                      ))}
                    </List>
                  </Collapse>
                )}
              </Box>
            );
          })}
        </List>
        
        {/* Footer with Privacy Policy link */}
        <Box sx={{ mt: 'auto', p: 2 }}>
          <Divider />
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/privacy-policy"
              sx={{
                minHeight: 48,
                px: 2.5,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: 2,
                  justifyContent: 'center',
                }}
              >
                <PolicyIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Privacy Policy" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/terms-of-service"
              sx={{
                minHeight: 48,
                px: 2.5,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: 2,
                  justifyContent: 'center',
                }}
              >
                <PolicyIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Terms of Service" />
            </ListItemButton>
          </ListItem>
        </Box>
      </Drawer>
    </>
  );
};

export default Sidebar;