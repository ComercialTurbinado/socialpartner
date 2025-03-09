import express from 'express';
import { config } from 'dotenv';
import { metaWebhookVerification } from './src/api/webhook.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Parse JSON request body
app.use(express.json());

// Meta webhook verification endpoint
app.get('/auth/callback', metaWebhookVerification);

// For all other routes, serve the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});