import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const PrivacyPolicy = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Privacy Policy
        </Typography>
        
        <Typography variant="body1" paragraph>
          Last updated: {new Date().toLocaleDateString()}
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          1. Information We Collect
        </Typography>
        <Typography variant="body1" paragraph>
          When you use our service, we may collect certain information about you, including:
          <ul>
            <li>Information you provide when registering for an account</li>
            <li>Social media account information when you connect your accounts</li>
            <li>Usage data and analytics</li>
            <li>Device information and IP addresses</li>
          </ul>
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          2. How We Use Your Information
        </Typography>
        <Typography variant="body1" paragraph>
          We use the collected information to:
          <ul>
            <li>Provide and maintain our services</li>
            <li>Improve and personalize your experience</li>
            <li>Communicate with you about our services</li>
            <li>Ensure compliance with our terms and policies</li>
          </ul>
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          3. Information Sharing
        </Typography>
        <Typography variant="body1" paragraph>
          We do not sell your personal information. We may share your information with:
          <ul>
            <li>Service providers who assist in our operations</li>
            <li>Social media platforms when you connect your accounts</li>
            <li>Law enforcement when required by law</li>
          </ul>
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          4. Data Security
        </Typography>
        <Typography variant="body1" paragraph>
          We implement appropriate security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          5. Your Rights
        </Typography>
        <Typography variant="body1" paragraph>
          You have the right to:
          <ul>
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your information</li>
            <li>Withdraw consent for data processing</li>
          </ul>
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          6. Changes to This Policy
        </Typography>
        <Typography variant="body1" paragraph>
          We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          7. Contact Us
        </Typography>
        <Typography variant="body1" paragraph>
          If you have any questions about this Privacy Policy, please contact us at:
          <br />
          Email: privacy@socialpartner.com
        </Typography>
      </Box>
    </Container>
  );
};

export default PrivacyPolicy;