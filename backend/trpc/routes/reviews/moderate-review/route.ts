import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

const moderateReviewInputSchema = z.object({
  reviewId: z.string(),
  action: z.enum(['approve', 'hide']),
});

export const moderateReviewProcedure = protectedProcedure
  .input(moderateReviewInputSchema)
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.user?.uid;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const newStatus = input.action === 'approve' ? 'published' : 'hidden';
    
    await db.collection('reviews').doc(input.reviewId).update({
      moderationStatus: newStatus,
    });

    console.log(`Review ${input.reviewId} ${input.action}d by admin ${userId}`);

    return { success: true, newStatus };
  });

export default moderateReviewProcedure;
