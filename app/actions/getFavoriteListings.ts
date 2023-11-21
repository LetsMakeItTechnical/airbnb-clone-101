import prisma from '@/app/libs/prismadb';

import getCurrentUser from './getCurrentUser';
import { CacheManager } from '@/utils/cache/cache-manager';

type FavouriteListings = {
  createdAt: string;
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  category: string;
  roomCount: number;
  bathroomCount: number;
  guestCount: number;
  locationValue: string;
  userId: string;
  price: number;
}[];

export default async function getFavoriteListings() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return [];
    }

    const cacheKey = `getFavoriteListings:${currentUser.id}`;
    const cacheManager = new CacheManager();
    const cachedData = await cacheManager.getDataFromCache<FavouriteListings>(cacheKey);

    if (cachedData) return cachedData;

    const favorites = await prisma.listing.findMany({
      where: {
        id: {
          in: [...(currentUser?.favoriteIds || [])],
        },
      },
    });

    const safeFavorites = favorites.map((favorite) => ({
      ...favorite,
      createdAt: favorite.createdAt.toString(),
    }));

    cacheManager.setCache(cacheKey, JSON.stringify(safeFavorites));
    return safeFavorites;
  } catch (error: any) {
    throw new Error(error);
  }
}
