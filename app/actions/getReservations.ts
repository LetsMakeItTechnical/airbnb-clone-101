import prisma from '@/app/libs/prismadb';
import { CacheManager } from '@/utils/cache/cache-manager';

interface IParams {
  listingId?: string;
  userId?: string;
  authorId?: string;
}

type SafeReservations = {
  createdAt: string;
  startDate: string;
  endDate: string;
  listing: {
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
  };
  id: string;
  userId: string;
  listingId: string;
  totalPrice: number;
}[];

export default async function getReservations(params: IParams) {
  try {
    const { listingId, userId, authorId } = params;

    const query: any = {};

    if (listingId) {
      query.listingId = listingId;
    }

    if (userId) {
      query.userId = userId;
    }

    if (authorId) {
      query.listing = { userId: authorId };
    }

    const cacheKey = `getReservations:${JSON.stringify(query)}`;
    const cacheManager = new CacheManager();
    const cachedData = await cacheManager.getDataFromCache<SafeReservations>(cacheKey);

    if (cachedData) return cachedData;

    const reservations = await prisma.reservation.findMany({
      where: query,
      include: {
        listing: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const safeReservations = reservations.map((reservation) => ({
      ...reservation,
      createdAt: reservation.createdAt.toISOString(),
      startDate: reservation.startDate.toISOString(),
      endDate: reservation.endDate.toISOString(),
      listing: {
        ...reservation.listing,
        createdAt: reservation.listing.createdAt.toISOString(),
      },
    }));

    cacheManager.setCache(cacheKey, JSON.stringify(safeReservations));
    return safeReservations;
  } catch (error: any) {
    throw new Error(error);
  }
}
