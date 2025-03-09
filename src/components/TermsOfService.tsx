import { Box, Typography, Container } from '@mui/material';

const TermsOfService = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Terms of Service
        </Typography>
        
        <Typography variant="body1" paragraph>
          Last updated: {new Date().toLocaleDateString()}
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          1. Acceptance of Terms
        </Typography>
        <Typography variant="body1" paragraph>
          By accessing or using our service, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          2. Description of Service
        </Typography>
        <Typography variant="body1" paragraph>
          Social Partner provides tools for managing and analyzing social media accounts. We reserve the right to modify or discontinue, temporarily or permanently, the service with or without notice.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          3. User Accounts
        </Typography>
        <Typography variant="body1" paragraph>
          You are responsible for safeguarding the password used to access the service and for any activities or actions under your password. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          4. Intellectual Property
        </Typography>
        <Typography variant="body1" paragraph>
          The service and its original content, features, and functionality are and will remain the exclusive property of Social Partner and its licensors. The service is protected by copyright, trademark, and other laws.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          5. User Content
        </Typography>
        <Typography variant="body1" paragraph>
          You retain any and all of your rights to any content you submit, post or display on or through the service. By submitting, posting or displaying content on or through the service, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, adapt, publish, translate and distribute your content.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          6. Third-Party Services
        </Typography>
        <Typography variant="body1" paragraph>
          Our service may contain links to third-party websites or services that are not owned or controlled by Social Partner. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites or services.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          7. Termination
        </Typography>
        <Typography variant="body1" paragraph>
          We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the service will immediately cease.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          8. Limitation of Liability
        </Typography>
        <Typography variant="body1" paragraph>
          In no event shall Social Partner, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          9. Governing Law
        </Typography>
        <Typography variant="body1" paragraph>
          These Terms shall be governed and construed in accordance with the laws, without regard to its conflict of law provisions.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          10. Changes to Terms
        </Typography>
        <Typography variant="body1" paragraph>
          We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our service after those revisions become effective, you agree to be bound by the revised terms.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          11. Contact Us
        </Typography>
        <Typography variant="body1" paragraph>
          If you have any questions about these Terms, please contact us at:
          <br />
          Email: terms@socialpartner.com
        </Typography>
      </Box>
    </Container>
  );
};

export default TermsOfService;