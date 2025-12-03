import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import {
  Star,
  MapPin,
  Phone,
  Mail,
  Globe,
  Heart,
  MessageSquare,
  ThumbsUp,
  Flag,
  Calendar,
  Instagram,
  Facebook,
  Twitter,
  ShieldCheck,
  Send,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { mockEntities } from '@/mocks/entities';
import { mockReviews } from '@/mocks/reviews';
import { useAuth } from '@/contexts/AuthContext';
import { trpcClient } from '@/lib/trpc';
import Colors from '@/constants/colors';

export default function EntityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, toggleFavorite, isAuthenticated } = useAuth();
  const [showAllReviews, setShowAllReviews] = useState<boolean>(false);
  const [isCreatingChat, setIsCreatingChat] = useState<boolean>(false);

  const entity = mockEntities.find(e => e.id === id);
  const entityReviews = mockReviews.filter(r => r.entityId === id);

  if (!entity) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Entity Not Found' }} />
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Entity not found</Text>
        </View>
      </View>
    );
  }

  const isFavorite = user?.favorites.includes(entity.id) || false;
  const displayedReviews = showAllReviews ? entityReviews : entityReviews.slice(0, 3);

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: entityReviews.filter(r => r.rating === rating).length,
    percentage: entityReviews.length > 0
      ? (entityReviews.filter(r => r.rating === rating).length / entityReviews.length) * 100
      : 0,
  }));

  const handleToggleFavorite = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    toggleFavorite(entity.id);
  };

  const handleChatWithBusiness = async () => {
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }

    if (!entity.isClaimed) {
      return;
    }

    setIsCreatingChat(true);

    try {
      const result = await trpcClient.chat.create.mutate({
        entityId: entity.id,
        entityName: entity.name,
        userId: user.id,
        userName: user.name,
      });

      if (result.success && result.chatId) {
        router.push(`/chat/${result.chatId}` as any);
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
    } finally {
      setIsCreatingChat(false);
    }
  };

  const renderStars = (rating: number, size: number = 16) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            color={star <= rating ? Colors.light.secondary : Colors.light.border}
            fill={star <= rating ? Colors.light.secondary : 'transparent'}
          />
        ))}
      </View>
    );
  };

  const renderReview = (review: typeof mockReviews[0]) => (
    <View key={review.id} style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.userInfo}>
          {review.userAvatar ? (
            <Image source={{ uri: review.userAvatar }} style={styles.userAvatar} />
          ) : (
            <View style={styles.userAvatarPlaceholder}>
              <Text style={styles.userAvatarText}>{review.userName.charAt(0)}</Text>
            </View>
          )}
          <View style={styles.userDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{review.userName}</Text>
              {review.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
            </View>
            <View style={styles.dateRow}>
              <Calendar size={11} color={Colors.light.muted} />
              <Text style={styles.reviewDate}>
                {new Date(review.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
        {renderStars(review.rating, 14)}
      </View>

      <Text style={styles.reviewText}>{review.reviewText}</Text>

      {review.photoUrls && review.photoUrls.length > 0 && (
        <Image source={{ uri: review.photoUrls[0] }} style={styles.reviewPhoto} />
      )}

      <View style={styles.reviewActions}>
        <View style={styles.actionButton}>
          <ThumbsUp size={14} color={Colors.light.muted} />
          <Text style={styles.actionText}>{review.likes}</Text>
        </View>
        <View style={styles.actionButton}>
          <Flag size={14} color={Colors.light.muted} />
          <Text style={styles.actionText}>{review.reports}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: entity.name,
          headerRight: () => (
            <TouchableOpacity onPress={handleToggleFavorite} style={styles.favoriteButton}>
              <Heart
                size={24}
                color={isFavorite ? Colors.light.error : Colors.light.text}
                fill={isFavorite ? Colors.light.error : 'transparent'}
              />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Image source={{ uri: entity.imageUrl }} style={styles.headerImage} />

        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.entityName}>{entity.name}</Text>
              {entity.isClaimed && (
                <View style={styles.claimedBadge}>
                  <Text style={styles.claimedText}>Claimed Profile</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.scoreCard}>
            <View style={styles.scoreMain}>
              <Text style={styles.scoreValue}>{entity.biasharaScore.toFixed(1)}</Text>
              <Text style={styles.scoreLabel}>BiasharaScore</Text>
              {renderStars(Math.round(entity.biasharaScore), 20)}
              <Text style={styles.reviewCount}>{entity.totalReviews} reviews</Text>
            </View>
          </View>

          <Text style={styles.description}>{entity.description}</Text>

          <View style={styles.contactSection}>
            <View style={styles.contactItem}>
              <MapPin size={18} color={Colors.light.primary} />
              <Text style={styles.contactText}>{entity.location}</Text>
            </View>

            {entity.contactInfo.phone && (
              <View style={styles.contactItem}>
                <Phone size={18} color={Colors.light.primary} />
                <Text style={styles.contactText}>{entity.contactInfo.phone}</Text>
              </View>
            )}

            {entity.contactInfo.email && (
              <View style={styles.contactItem}>
                <Mail size={18} color={Colors.light.primary} />
                <Text style={styles.contactText}>{entity.contactInfo.email}</Text>
              </View>
            )}

            {entity.contactInfo.website && (
              <View style={styles.contactItem}>
                <Globe size={18} color={Colors.light.primary} />
                <Text style={styles.contactText}>{entity.contactInfo.website}</Text>
              </View>
            )}

            {entity.contactInfo.social && (
              <View style={styles.socialContainer}>
                {entity.contactInfo.social.instagram && (
                  <View style={styles.socialItem}>
                    <Instagram size={16} color={Colors.light.primary} />
                    <Text style={styles.socialText}>
                      {entity.contactInfo.social.instagram}
                    </Text>
                  </View>
                )}
                {entity.contactInfo.social.facebook && (
                  <View style={styles.socialItem}>
                    <Facebook size={16} color={Colors.light.primary} />
                    <Text style={styles.socialText}>
                      {entity.contactInfo.social.facebook}
                    </Text>
                  </View>
                )}
                {entity.contactInfo.social.twitter && (
                  <View style={styles.socialItem}>
                    <Twitter size={16} color={Colors.light.primary} />
                    <Text style={styles.socialText}>
                      {entity.contactInfo.social.twitter}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.actionButtons}>
            {!entity.isClaimed && (
              <TouchableOpacity
                style={styles.claimButton}
                onPress={() => router.push(`/contact?entityId=${entity.id}&entityName=${encodeURIComponent(entity.name)}` as any)}
              >
                <ShieldCheck size={20} color={Colors.light.primary} />
                <Text style={styles.claimButtonText}>Claim Profile</Text>
              </TouchableOpacity>
            )}
            
            {entity.isClaimed ? (
              <View style={styles.claimedActionRow}>
                <TouchableOpacity
                  style={[styles.chatButton, isCreatingChat && styles.buttonDisabled]}
                  onPress={handleChatWithBusiness}
                  disabled={isCreatingChat}
                >
                  <Send size={20} color="#FFFFFF" />
                  <Text style={styles.chatButtonText}>
                    {isCreatingChat ? 'Opening...' : 'Chat with Business'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.writeReviewButton}
                  onPress={() => router.push(`/review/submit?entityId=${entity.id}` as any)}
                >
                  <MessageSquare size={20} color="#FFFFFF" />
                  <Text style={styles.writeReviewText}>Write Review</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.writeReviewButtonFull}
                onPress={() => router.push(`/review/submit?entityId=${entity.id}` as any)}
              >
                <MessageSquare size={20} color="#FFFFFF" />
                <Text style={styles.writeReviewText}>Write a Review</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {!entity.isClaimed && (
            <View style={styles.chatUnavailable}>
              <Text style={styles.chatUnavailableText}>
                Chat unavailable – business not claimed
              </Text>
            </View>
          )}
        </View>

        <View style={styles.reviewsSection}>
          <Text style={styles.sectionTitle}>Reviews & Ratings</Text>

          <View style={styles.ratingDistribution}>
            {ratingDistribution.map((item) => (
              <View key={item.rating} style={styles.ratingRow}>
                <Text style={styles.ratingLabel}>{item.rating}</Text>
                <Star size={12} color={Colors.light.secondary} fill={Colors.light.secondary} />
                <View style={styles.ratingBarContainer}>
                  <View
                    style={[
                      styles.ratingBar,
                      { width: `${item.percentage}%` },
                    ]}
                  />
                </View>
                <Text style={styles.ratingCount}>{item.count}</Text>
              </View>
            ))}
          </View>

          {displayedReviews.map(renderReview)}

          {entityReviews.length > 3 && !showAllReviews && (
            <TouchableOpacity
              style={styles.showMoreButton}
              onPress={() => setShowAllReviews(true)}
            >
              <Text style={styles.showMoreText}>
                Show All {entityReviews.length} Reviews
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  headerImage: {
    width: '100%',
    height: 250,
  },
  favoriteButton: {
    marginRight: 8,
  },
  infoSection: {
    padding: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  entityName: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  claimedBadge: {
    backgroundColor: Colors.light.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  claimedText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  scoreCard: {
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreMain: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  scoreLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  reviewCount: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.light.text,
    marginBottom: 20,
  },
  contactSection: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactText: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  socialContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  socialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  socialText: {
    fontSize: 13,
    color: Colors.light.text,
  },
  actionButtons: {
    gap: 12,
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.card,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  claimButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.primary,
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  writeReviewButtonSecondary: {
    flex: 1,
  },
  writeReviewText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  reviewsSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 16,
  },
  ratingDistribution: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
    width: 12,
  },
  ratingBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.light.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  ratingBar: {
    height: '100%',
    backgroundColor: Colors.light.secondary,
  },
  ratingCount: {
    fontSize: 13,
    color: Colors.light.muted,
    width: 30,
    textAlign: 'right',
  },
  reviewCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  userAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  userDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  verifiedBadge: {
    backgroundColor: Colors.light.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewDate: {
    fontSize: 11,
    color: Colors.light.muted,
  },
  reviewText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  reviewPhoto: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginBottom: 12,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    color: Colors.light.muted,
  },
  showMoreButton: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  showMoreText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.primary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.muted,
  },
  claimedActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  chatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.secondary,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  chatButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  writeReviewButtonFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  chatUnavailable: {
    marginTop: 12,
    padding: 12,
    backgroundColor: `${Colors.light.muted}15`,
    borderRadius: 8,
    alignItems: 'center',
  },
  chatUnavailableText: {
    fontSize: 13,
    color: Colors.light.muted,
    textAlign: 'center',
  },
});
