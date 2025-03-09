import type { Request, Response } from 'express';
import { config } from 'dotenv';
import { z } from 'zod';

config();

const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;
if (!META_VERIFY_TOKEN) {
  throw new Error('META_VERIFY_TOKEN is required in environment variables');
}

const WebhookVerificationSchema = z.object({
  'hub.mode': z.string(),
  'hub.verify_token': z.string(),
  'hub.challenge': z.string().optional()
});

export const metaWebhookVerification = (req: Request, res: Response) => {
  try {
    const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = WebhookVerificationSchema.parse(req.query);

    if (mode === 'subscribe' && token === META_VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      return res.status(200).send(challenge);
    }

    return res.sendStatus(403);
  } catch (error) {
    console.error('Webhook verification error:', error);
    return res.status(400).json({ error: 'Invalid request parameters' });
  }
};