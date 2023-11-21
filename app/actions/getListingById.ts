import prisma from '@/app/libs/prismadb';
import { CacheManager } from '@/utils/cache/cache-manager';
import { Listing, User } from '@prisma/client';
import { SafeListing, SafeUser } from '../types';

interface IParams {
  listingId?: string;
}

type ListingResponse = SafeListing & {
  user: SafeUser;
};

export default async function getListingById(params: IParams) {
  try {
    const { listingId } = params;

    const cacheKey = `getListingById:${listingId}`;
    const cacheManager = new CacheManager();
    const cachedData = await cacheManager.getDataFromCache<ListingResponse>(cacheKey);

    if (cachedData) return cachedData;

    const listing = await prisma.listing.findUnique({
      where: {
        id: listingId,
      },
      include: {
        user: true,
      },
    });

    if (!listing) {
      return null;
    }

    const response = {
      ...listing,
      createdAt: listing.createdAt.toString(),
      user: {
        ...listing.user,
        createdAt: listing.user.createdAt.toString(),
        updatedAt: listing.user.updatedAt.toString(),
        emailVerified: listing.user.emailVerified?.toString() || null,
      },
    };

    cacheManager.setCache(cacheKey, JSON.stringify(response));
    return response;
  } catch (error: any) {
    throw new Error(error);
  }
}
