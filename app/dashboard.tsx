import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Star,
  MessageSquare,
  LogOut,
  Building2,
  Mail,
  Edit,
  Users,
  MessageCircle,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { mockEntities } from '@/mocks/entities';
import { getReviews } from '@/lib/firebaseService';
import { Review, Chat } from '@/types';
import Colors from '@/constants/colors';

export default function DashboardScreen() {
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState<boolean>(true);
  const [chats, setChats] = useState<Chat[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);
  const isFocused = useIsFocused();
  const isFocusedRef = useRef<boolean>(false);
  isFocusedRef.current = isFocused;

  useEffect(() => {
    if (isFocusedRef.current && !isAuthenticated && !authLoading) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to access your dashboard.',
        [
          {
            text: 'Sign In',
            onPress: () => router.replace('/auth/login'),
          },
        ]
      );
    }
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    const loadUserReviews = async () => {
      if (!user) {
        setIsLoadingReviews(false);
        return;
      }

      try {
        setIsLoadingReviews(true);
        const allReviews: Review[] = [];
        
        for (const entity of mockEntities) {
          try {
            const reviews = await getReviews(entity.id);
            allReviews.push(...reviews.filter(r => r.userId === user.id));
          } catch {
            console.log(`No reviews found for entity ${entity.id}`);
          }
        }
        
        setUserReviews(allReviews);
      } catch (error) {
        console.error('Error loading user reviews:', error);
      } finally {
        setIsLoadingReviews(false);
      }
    };

    loadUserReviews();
  }, [user]);

  useEffect(() => {
    if (!user?.ownedEntityIds || user.ownedEntityIds.length === 0) return;

    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('entityId', 'in', user.ownedEntityIds),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedChats = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            entityId: data.entityId,
            entityName: data.entityName,
            userId: data.userId,
            userName: data.userName,
            lastMessage: data.lastMessage,
            lastMessageAt: data.lastMessageAt
              ? (data.lastMessageAt as Timestamp).toDate().toISOString()
              : undefined,
            unreadCount: data.unreadCount || 0,
            createdAt: data.createdAt
              ? (data.createdAt as Timestamp).toDate().toISOString()
              : new Date().toISOString(),
          } as Chat;
        });
        setChats(loadedChats);
        const unread = loadedChats.reduce((acc, chat) => acc + chat.unreadCount, 0);
        setUnreadChatCount(unread);
      },
      (error) => {
        console.error('Error loading chats:', error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setTimeout(async () => {
              await logout();
            }, 300);
            router.replace('/(tabs)');
          },
        },
      ]
    );
  };

  const ownedEntity = user?.ownedEntityIds?.[0] 
    ? mockEntities.find(e => e.id === user.ownedEntityIds![0])
    : undefined;

  if (authLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Dashboard' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Dashboard' }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Unable to load user profile</Text>
          <Text style={styles.errorSubText}>Please check your connection and try again</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.replace('/auth/login')}
          >
            <Text style={styles.retryButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'My Dashboard',
          headerRight: () => (
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <LogOut size={20} color={Colors.light.error} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Users size={32} color={Colors.light.primary} />
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <View style={styles.emailContainer}>
                <Mail size={14} color={Colors.light.muted} />
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userReviews.length}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.favorites.length}</Text>
              <Text style={styles.statLabel}>Favorites</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.ownedEntityIds?.length || 0}</Text>
              <Text style={styles.statLabel}>Businesses</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Reviews</Text>
            <Text style={styles.sectionCount}>{userReviews.length}</Text>
          </View>

          {isLoadingReviews ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.light.primary} />
            </View>
          ) : userReviews.length > 0 ? (
            <View style={styles.reviewsList}>
              {userReviews.map((review) => {
                const reviewEntity = mockEntities.find(e => e.id === review.entityId);
                return (
                  <TouchableOpacity
                    key={review.id}
                    style={styles.reviewCard}
                    onPress={() => router.push(`/entity/${review.entityId}` as any)}
                  >
                    <View style={styles.reviewCardHeader}>
                      <View style={styles.reviewCardInfo}>
                        <Text style={styles.reviewEntityName} numberOfLines={1}>
                          {reviewEntity?.name || 'Unknown Business'}
                        </Text>
                        <View style={styles.reviewRating}>
                          <Star size={14} color={Colors.light.secondary} fill={Colors.light.secondary} />
                          <Text style={styles.reviewRatingText}>{review.rating}</Text>
                        </View>
                      </View>
                      <Text style={styles.reviewDate}>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={styles.reviewText} numberOfLines={2}>
                      {review.reviewText}
                    </Text>
                    <View style={styles.reviewStats}>
                      <View style={styles.reviewStatItem}>
                        <MessageSquare size={14} color={Colors.light.muted} />
                        <Text style={styles.reviewStatText}>{review.likes} likes</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyReviews}>
              <MessageSquare size={32} color={Colors.light.muted} />
              <Text style={styles.emptyReviewsText}>No reviews yet</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/(tabs)' as any)}
              >
                <Text style={styles.emptyButtonText}>Browse Businesses</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {ownedEntity && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Business</Text>
              <TouchableOpacity onPress={() => router.push(`/entity/${ownedEntity.id}` as any)}>
                <Edit size={18} color={Colors.light.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.businessCard}>
              <View style={styles.businessHeader}>
                <Building2 size={24} color={Colors.light.primary} />
                <View style={styles.businessInfo}>
                  <Text style={styles.businessName}>{ownedEntity.name}</Text>
                  <Text style={styles.businessLocation}>{ownedEntity.location}</Text>
                </View>
              </View>

              <View style={styles.businessStats}>
                <View style={styles.businessStat}>
                  <Star size={20} color={Colors.light.secondary} fill={Colors.light.secondary} />
                  <Text style={styles.businessStatValue}>{ownedEntity.biasharaScore.toFixed(1)}</Text>
                  <Text style={styles.businessStatLabel}>Score</Text>
                </View>
                <View style={styles.businessStat}>
                  <MessageSquare size={20} color={Colors.light.primary} />
                  <Text style={styles.businessStatValue}>{ownedEntity.totalReviews}</Text>
                  <Text style={styles.businessStatLabel}>Reviews</Text>
                </View>
              </View>
            </View>
          </View>
        )}
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
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.light.muted,
  },
  logoutButton: {
    marginRight: 16,
  },
  profileSection: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${Colors.light.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 6,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.light.muted,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.muted,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  sectionCount: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.primary,
  },
  reviewsList: {
    gap: 12,
  },
  reviewCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reviewCardInfo: {
    flex: 1,
    marginRight: 8,
  },
  reviewEntityName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewRatingText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  reviewDate: {
    fontSize: 12,
    color: Colors.light.muted,
  },
  reviewText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  reviewStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewStatText: {
    fontSize: 12,
    color: Colors.light.muted,
  },
  emptyReviews: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
  },
  emptyReviewsText: {
    fontSize: 14,
    color: Colors.light.muted,
    marginTop: 12,
    marginBottom: 8,
  },
  emptyButton: {
    marginTop: 16,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  businessCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  businessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  businessLocation: {
    fontSize: 13,
    color: Colors.light.muted,
  },
  businessStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  businessStat: {
    alignItems: 'center',
  },
  businessStatValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginTop: 8,
    marginBottom: 4,
  },
  businessStatLabel: {
    fontSize: 12,
    color: Colors.light.muted,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubText: {
    fontSize: 14,
    color: Colors.light.muted,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
