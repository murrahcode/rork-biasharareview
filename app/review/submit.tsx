import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Star, Camera, X, Calendar } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { mockEntities } from '@/mocks/entities';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import Colors from '@/constants/colors';

export default function SubmitReviewScreen() {
  const { entityId } = useLocalSearchParams<{ entityId: string }>();
  const { user, isAuthenticated } = useAuth();
  const [rating, setRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>('');
  const [dateOfExperience, setDateOfExperience] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const entity = mockEntities.find(e => e.id === entityId);
  
  const submitReviewMutation = trpc.reviews.submit.useMutation();

  const pickImage = async () => {
    if (photos.length >= 3) {
      Alert.alert('Limit Reached', 'You can upload up to 3 photos');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant photo library permission');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to submit a review.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => router.back(),
          },
          {
            text: 'Sign In',
            onPress: () => router.replace('/auth/login'),
          },
        ]
      );
    }
  }, [isAuthenticated]);

  const handleSubmit = async () => {
    if (!isAuthenticated || !user) {
      Alert.alert('Error', 'You must be signed in to submit a review.');
      return;
    }

    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating');
      return;
    }

    if (reviewText.trim().length < 10) {
      Alert.alert('Review Too Short', 'Please write at least 10 characters');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await submitReviewMutation.mutateAsync({
        entityId: entityId || '',
        rating,
        reviewText: reviewText.trim(),
        dateOfExperience,
        photoUrls: photos,
      });

      console.log('Review submitted:', result.reviewId);

      setIsSubmitting(false);
      Alert.alert(
        'Review Published!',
        'Your review has been published and is being checked by our moderation system.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to submit review:', error);
      setIsSubmitting(false);
      Alert.alert(
        'Error',
        'Failed to submit review. Please try again.',
        [
          {
            text: 'OK',
          },
        ]
      );
    }
  };

  if (!entity) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Write Review' }} />
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Entity not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Write Review' }} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.entityCard}>
          <Image source={{ uri: entity.imageUrl }} style={styles.entityImage} />
          <View style={styles.entityInfo}>
            <Text style={styles.entityName} numberOfLines={2}>
              {entity.name}
            </Text>
            <Text style={styles.entityLocation}>{entity.location}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Rating *</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Star
                  size={40}
                  color={star <= rating ? Colors.light.secondary : Colors.light.border}
                  fill={star <= rating ? Colors.light.secondary : 'transparent'}
                  strokeWidth={2}
                />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingText}>
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Review *</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Share your experience..."
            placeholderTextColor={Colors.light.muted}
            value={reviewText}
            onChangeText={setReviewText}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{reviewText.length} / 500</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date of Experience</Text>
          <View style={styles.dateInput}>
            <Calendar size={20} color={Colors.light.muted} />
            <TextInput
              style={styles.dateText}
              value={dateOfExperience}
              onChangeText={setDateOfExperience}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.light.muted}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Photos (Optional)</Text>
          <Text style={styles.sectionSubtitle}>Upload up to 3 photos</Text>

          <View style={styles.photosContainer}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoItem}>
                <Image source={{ uri: photo }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => removePhoto(index)}
                >
                  <X size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}

            {photos.length < 3 && (
              <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
                <Camera size={32} color={Colors.light.muted} />
                <Text style={styles.addPhotoText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          By submitting, you agree that your review may be publicly visible.
          Reviews are subject to verification.
        </Text>
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
  entityCard: {
    flexDirection: 'row',
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  entityImage: {
    width: 80,
    height: 80,
  },
  entityInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  entityName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  entityLocation: {
    fontSize: 13,
    color: Colors.light.muted,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.light.muted,
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.primary,
    marginTop: 8,
  },
  textArea: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 16,
    fontSize: 15,
    color: Colors.light.text,
    minHeight: 140,
  },
  charCount: {
    fontSize: 12,
    color: Colors.light.muted,
    textAlign: 'right',
    marginTop: 8,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 16,
    height: 56,
    gap: 12,
  },
  dateText: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoItem: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.light.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addPhotoText: {
    fontSize: 12,
    color: Colors.light.muted,
  },
  submitButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  disclaimer: {
    fontSize: 12,
    color: Colors.light.muted,
    textAlign: 'center',
    lineHeight: 18,
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
});
