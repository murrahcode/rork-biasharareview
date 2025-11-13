import { z } from 'zod';
import { protectedProcedure } from '../../../create-context';
import { getFirestore } from 'firebase-admin/firestore';
import { generateText } from '@rork-ai/toolkit-sdk';

const db = getFirestore();

const submitReviewInputSchema = z.object({
  entityId: z.string(),
  rating: z.number().min(1).max(5),
  reviewText: z.string().min(10).max(500),
  dateOfExperience: z.string(),
  photoUrls: z.array(z.string()).optional(),
});

export const submitReviewProcedure = protectedProcedure
  .input(submitReviewInputSchema)
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.user?.uid;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const userName = userData?.name || 'Anonymous';
    const userAvatar = userData?.avatar;

    const reviewId = `review_${Date.now()}_${userId}`;
    
    const review = {
      id: reviewId,
      entityId: input.entityId,
      userId,
      userName,
      userAvatar,
      rating: input.rating,
      reviewText: input.reviewText,
      dateOfExperience: input.dateOfExperience,
      createdAt: new Date().toISOString(),
      photoUrls: input.photoUrls || [],
      isVerified: true,
      likes: 0,
      reports: 0,
      moderationStatus: 'published',
      moderationFlags: [],
      moderationCheckedAt: undefined,
    };

    await db.collection('reviews').doc(reviewId).set(review);

    (async () => {
      try {
        const userReviewsSnapshot = await db
          .collection('reviews')
          .where('userId', '==', userId)
          .get();
        const userReviewsCount = userReviewsSnapshot.size;
        
        const recentReviewsSnapshot = await db
          .collection('reviews')
          .where('userId', '==', userId)
          .get();
        const flaggedReviewsCount = recentReviewsSnapshot.docs.filter(
          doc => doc.data().moderationFlags && doc.data().moderationFlags.length > 0
        ).length;

        const moderationPrompt = `Analyze this review for policy violations. Return a JSON object with:
- isSafe: boolean (true if the review is safe, false if it violates policies)
- flags: array of strings (reasons if unsafe, empty if safe)

Review policies:
- No hate speech, discrimination, or harassment
- No spam or promotional content
- No fake or misleading information
- No personal attacks
- No profanity or offensive language
- Must be relevant to the business

Review text: "${input.reviewText}"
User history: ${userReviewsCount} total reviews, ${flaggedReviewsCount} previously flagged

Respond ONLY with valid JSON, no additional text.`;

        const response = await generateText({
          messages: [{ role: 'user', content: moderationPrompt }],
        });

        let moderationResult;
        try {
          moderationResult = JSON.parse(response);
        } catch {
          console.error('Failed to parse moderation response:', response);
          moderationResult = { isSafe: true, flags: [] };
        }

        const updates: any = {
          moderationCheckedAt: new Date().toISOString(),
        };

        if (!moderationResult.isSafe && moderationResult.flags?.length > 0) {
          updates.moderationStatus = 'pending';
          updates.moderationFlags = moderationResult.flags;
          
          console.log(`Review ${reviewId} flagged for moderation:`, moderationResult.flags);
        } else {
          updates.moderationFlags = [];
        }

        await db.collection('reviews').doc(reviewId).update(updates);

        const entityReviewsSnapshot = await db
          .collection('reviews')
          .where('entityId', '==', input.entityId)
          .get();
        
        let totalRating = 0;
        let publishedCount = 0;
        
        entityReviewsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.moderationStatus === 'published') {
            totalRating += data.rating;
            publishedCount++;
          }
        });

        if (publishedCount > 0) {
          const averageRating = totalRating / publishedCount;
          await db.collection('entities').doc(input.entityId).update({
            biasharaScore: Number(averageRating.toFixed(1)),
            totalReviews: publishedCount,
          });
        }
      } catch (error) {
        console.error('Background moderation failed:', error);
      }
    })();

    return { success: true, reviewId, review };
  });

export default submitReviewProcedure;
