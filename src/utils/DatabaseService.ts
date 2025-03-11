import { PrismaClient } from '@prisma/client';
import type { SocialProfile } from './OAuthService';

// Initialize Prisma client
const prisma = new PrismaClient();

// Function to store social media credentials in the database
export const storeSocialCredentials = async (
  platform: string,
  profile: SocialProfile,
  userId: string = 'default-user' // Default user ID if not provided
): Promise<void> => {
  try {
    // Check if this social account already exists
    const existingAccount = await prisma.socialAccount.findFirst({
      where: {
        platform,
        accountId: profile.id,
      },
    });

    const expiresAt = profile.expiresAt ? new Date(profile.expiresAt) : null;

    if (existingAccount) {
      // Update existing account
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
      // Check if user exists, create if not
      let user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            id: userId,
            email: profile.email || `${userId}@example.com`, // Placeholder email if not provided
            name: profile.name || 'User',
          },
        });
      }

      // Create new social account
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
  } catch (error) {
    console.error(`Error storing ${platform} credentials:`, error);
    throw new Error(`Failed to store ${platform} credentials`);
  }
};

// Function to get social media credentials from the database
export const getSocialCredentials = async (
  platform: string,
  userId: string = 'default-user'
): Promise<SocialProfile | null> => {
  try {
    const account = await prisma.socialAccount.findFirst({
      where: {
        platform,
        userId,
      },
    });

    if (!account) return null;

    return {
      id: account.accountId,
      name: '', // These fields would typically come from a user profile query
      username: account.username || undefined,
      accessToken: account.accessToken,
      refreshToken: account.refreshToken || undefined,
      expiresAt: account.expiresAt ? account.expiresAt.getTime() : undefined,
    };
  } catch (error) {
    console.error(`Error retrieving ${platform} credentials:`, error);
    return null;
  }
};

// Function to remove social media credentials from the database
export const removeSocialCredentials = async (
  platform: string,
  userId: string = 'default-user'
): Promise<boolean> => {
  try {
    const account = await prisma.socialAccount.findFirst({
      where: {
        platform,
        userId,
      },
    });

    if (!account) return false;

    await prisma.socialAccount.delete({
      where: { id: account.id },
    });

    return true;
  } catch (error) {
    console.error(`Error removing ${platform} credentials:`, error);
    return false;
  }
};