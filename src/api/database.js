import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Store social media credentials
router.post('/credentials/:platform', async (req, res) => {
  const { platform } = req.params;
  const profile = req.body;
  const userId = req.body.userId || 'default-user';

  try {
    const existingAccount = await prisma.socialAccount.findFirst({
      where: {
        platform,
        accountId: profile.id,
      },
    });

    const expiresAt = profile.expiresAt ? new Date(profile.expiresAt) : null;

    if (existingAccount) {
      await prisma.socialAccount.update({
        where: { id: existingAccount.id },
        data: {
          username: profile.username || null,
          accessToken: profile.accessToken,
          refreshToken: profile.refreshToken || null,
          expiresAt,
          updatedAt: new Date(),
        },
      });
    } else {
      let user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            id: userId,
            email: profile.email || `${userId}@example.com`,
            name: profile.name || 'User',
          },
        });
      }

      await prisma.socialAccount.create({
        data: {
          platform,
          accountId: profile.id,
          username: profile.username || null,
          accessToken: profile.accessToken,
          refreshToken: profile.refreshToken || null,
          expiresAt,
          userId: user.id,
        },
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(`Error storing ${platform} credentials:`, error);
    res.status(500).json({ error: `Failed to store ${platform} credentials` });
  }
});

// Get social media credentials
router.get('/credentials/:platform', async (req, res) => {
  const { platform } = req.params;
  const userId = req.query.userId || 'default-user';

  try {
    const account = await prisma.socialAccount.findFirst({
      where: {
        platform,
        userId,
      },
    });

    if (!account) {
      return res.status(404).json(null);
    }

    const profile = {
      id: account.accountId,
      name: '',
      username: account.username || undefined,
      accessToken: account.accessToken,
      refreshToken: account.refreshToken || undefined,
      expiresAt: account.expiresAt ? account.expiresAt.getTime() : undefined,
    };

    res.status(200).json(profile);
  } catch (error) {
    console.error(`Error retrieving ${platform} credentials:`, error);
    res.status(500).json(null);
  }
});

// Remove social media credentials
router.delete('/credentials/:platform', async (req, res) => {
  const { platform } = req.params;
  const userId = req.query.userId || 'default-user';

  try {
    const account = await prisma.socialAccount.findFirst({
      where: {
        platform,
        userId,
      },
    });

    if (!account) {
      return res.status(404).json({ success: false });
    }

    await prisma.socialAccount.delete({
      where: { id: account.id },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(`Error removing ${platform} credentials:`, error);
    res.status(500).json({ success: false });
  }
});

export default router;