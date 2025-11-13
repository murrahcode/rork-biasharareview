import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

const calculateRatingsInputSchema = z.object({
  entityId: z.string(),
});

export const calculateRatingsProcedure = publicProcedure
  .input(calculateRatingsInputSchema)
  .mutation(async ({ input }) => {
    const snapshot = await db
      .collection('reviews')
      .where('entityId', '==', input.entityId)
      .where('moderationStatus', '==', 'published')
      .get();
    
    if (snapshot.empty) {
      return {
        averageRating: 0,
        totalReviews: 0,
      };
    }

    let totalRating = 0;
    let count = 0;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      totalRating += data.rating;
      count++;
    });

    const averageRating = Number((totalRating / count).toFixed(1));

    await db.collection('entities').doc(input.entityId).update({
      biasharaScore: averageRating,
      totalReviews: count,
    });

    console.log(`Updated entity ${input.entityId}: ${averageRating} stars (${count} reviews)`);

    return {
      averageRating,
      totalReviews: count,
    };
  });

export default calculateRatingsProcedure;
