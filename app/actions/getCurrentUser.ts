import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/app/libs/prismadb';
import { SafeUser } from '../types';
import { CacheManager } from '@/utils/cache/cache-manager';

export async function getSession() {
  return await getServerSession(authOptions);
}

export default async function getCurrentUser() {
  try {
    const session = await getSession();

    if (!session?.user?.email) {
      return null;
    }

    const cacheKey = `getFavoriteListings:${session?.user?.email}`;
    const cacheManager = new CacheManager();
    const cachedData = await cacheManager.getDataFromCache<SafeUser>(cacheKey);

    if (cachedData) return cachedData;

    const currentUser = await prisma.user.findUnique({
      where: {
        email: session.user.email as string,
      },
    });

    if (!currentUser) {
      return null;
    }

    const responseData = {
      ...currentUser,
      createdAt: currentUser.createdAt.toISOString(),
      updatedAt: currentUser.updatedAt.toISOString(),
      emailVerified: currentUser.emailVerified?.toISOString() || null,
    };

    void cacheManager.setCache(cacheKey, JSON.stringify(responseData));
    return responseData;
  } catch (error: any) {
    return null;
  }
}
