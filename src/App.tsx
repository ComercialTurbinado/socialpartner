import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import SocialMediaConnect from './components/SocialMediaConnect';
import FacebookConnect from './components/FacebookConnect';
import InstagramConnect from './components/InstagramConnect';
import InstagramPosts from './components/InstagramPosts';
import TwitterConnect from './components/TwitterConnect';
import LinkedInConnect from './components/LinkedInConnect';
import GoogleReviews from './components/GoogleReviews';
import GoogleConnect from './components/GoogleConnect';
import FacebookPosts from './components/FacebookPosts';
import TwitterPosts from './components/TwitterPosts';
import LinkedInPosts from './components/LinkedInPosts';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import { Box } from '@mui/material';
import './App.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Router>
      <Box sx={{ display: 'flex' }}>
        <Sidebar open={sidebarOpen} onToggle={toggleSidebar} />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            transition: (theme) => theme.transitions.create('margin', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
            marginLeft: 0,
            width: '100%'
          }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/social-media" element={<SocialMediaConnect />} />
            <Route path="/facebook" element={<FacebookConnect />} />
            <Route path="/facebook/posts" element={<FacebookPosts />} />
            <Route path="/instagram" element={<InstagramConnect />} />
            <Route path="/instagram/posts" element={<InstagramPosts />} />
            <Route path="/twitter" element={<TwitterConnect />} />
            <Route path="/twitter/posts" element={<TwitterPosts />} />
            <Route path="/linkedin" element={<LinkedInConnect />} />
            <Route path="/linkedin/posts" element={<LinkedInPosts />} />
            <Route path="/google-reviews" element={<GoogleReviews />} />
            <Route path="/google" element={<GoogleConnect />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;
