import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Search, MapPin, Star, TrendingUp } from 'lucide-react-native';
import { mockEntities } from '@/mocks/entities';
import Colors from '@/constants/colors';

const categories = [
  { id: '1', name: 'Restaurants', icon: '🍽️' },
  { id: '2', name: 'Retail', icon: '🛍️' },
  { id: '3', name: 'Tech', icon: '💻' },
  { id: '4', name: 'Health', icon: '🏥' },
  { id: '5', name: 'Education', icon: '📚' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const trendingEntities = mockEntities
    .sort((a, b) => b.biasharaScore - a.biasharaScore)
    .slice(0, 3);

  const filteredEntities = searchQuery
    ? mockEntities.filter(
        (entity) =>
          entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entity.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : mockEntities;

  const renderTrendingCard = (entity: typeof mockEntities[0]) => (
    <TouchableOpacity
      key={entity.id}
      style={styles.trendingCard}
      onPress={() => router.push(`/entity/${entity.id}` as any)}
    >
      <Image source={{ uri: entity.imageUrl }} style={styles.trendingImage} />
      <View style={styles.trendingOverlay}>
        <Text style={styles.trendingName} numberOfLines={2}>
          {entity.name}
        </Text>
        <View style={styles.trendingRating}>
          <Star size={16} color="#FFD700" fill="#FFD700" />
          <Text style={styles.trendingRatingText}>{entity.biasharaScore.toFixed(1)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderBusinessCard = (entity: typeof mockEntities[0]) => (
    <TouchableOpacity
      key={entity.id}
      style={styles.businessCard}
      onPress={() => router.push(`/entity/${entity.id}` as any)}
    >
      <Image source={{ uri: entity.imageUrl }} style={styles.businessImage} />
      <View style={styles.businessInfo}>
        <View style={styles.businessHeader}>
          <Text style={styles.businessName} numberOfLines={1}>
            {entity.name}
          </Text>
          {entity.isClaimed && <View style={styles.claimedBadge}>
            <Text style={styles.claimedText}>Claimed</Text>
          </View>}
        </View>
        <View style={styles.locationRow}>
          <MapPin size={14} color={Colors.light.muted} />
          <Text style={styles.locationText} numberOfLines={1}>
            {entity.location}
          </Text>
        </View>
        <View style={styles.bottomRow}>
          <View style={styles.ratingRow}>
            <Star size={16} color={Colors.light.secondary} fill={Colors.light.secondary} />
            <Text style={styles.ratingText}>{entity.biasharaScore.toFixed(1)}</Text>
          </View>
          <Text style={styles.reviewCount}>{entity.totalReviews} reviews</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.logo}>BiasharaReview</Text>
        <Text style={styles.tagline}>Discover & Review Tanzania's Best Businesses</Text>

        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.light.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search businesses..."
            placeholderTextColor={Colors.light.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.categoryChipActive,
              ]}
              onPress={() =>
                setSelectedCategory(
                  selectedCategory === category.id ? null : category.id
                )
              }
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextActive,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={20} color={Colors.light.text} />
            <Text style={styles.sectionTitle}>Trending Now</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trendingScroll}
          >
            {trendingEntities.map(renderTrendingCard)}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.allBusinessesTitle}>All Businesses</Text>
          <View style={styles.businessList}>
            {filteredEntities.map(renderBusinessCard)}
          </View>
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
    paddingBottom: 100,
  },
  header: {
    padding: 20,
    paddingBottom: 24,
    backgroundColor: Colors.light.primary,
  },
  logo: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
  },
  categoriesScroll: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipActive: {
    backgroundColor: Colors.light.primary + '15',
    borderColor: Colors.light.primary,
  },
  categoryIcon: {
    fontSize: 18,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  categoryTextActive: {
    color: Colors.light.primary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  trendingScroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  trendingCard: {
    width: 280,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.light.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  trendingImage: {
    width: '100%',
    height: '100%',
  },
  trendingOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  trendingName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  trendingRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trendingRatingText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  allBusinessesTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  businessList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  businessCard: {
    flexDirection: 'row',
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  businessImage: {
    width: 100,
    height: 110,
  },
  businessInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  businessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    flex: 1,
  },
  claimedBadge: {
    backgroundColor: Colors.light.primary,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  claimedText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 13,
    color: Colors.light.muted,
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  reviewCount: {
    fontSize: 13,
    color: Colors.light.muted,
  },
});
