import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { MessageSquare } from 'lucide-react-native';
import { Chat } from '@/types';
import Colors from '@/constants/colors';

interface ConversationListProps {
  conversations: Chat[];
  onSelectConversation: (chatId: string) => void;
  isLoading: boolean;
}

export default function ConversationList({
  conversations,
  onSelectConversation,
  isLoading,
}: ConversationListProps) {
  const formatTimeAgo = (dateString?: string): string => {
    if (!dateString) return 'No messages';
    
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const renderConversation = ({ item }: { item: Chat }) => (
    <TouchableOpacity
      style={styles.conversationCard}
      onPress={() => onSelectConversation(item.id)}
    >
      <View style={styles.avatarContainer}>
        <View style={styles.avatarPlaceholder}>
          <MessageSquare size={20} color={Colors.light.primary} />
        </View>
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unreadCount}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName} numberOfLines={1}>
            {item.entityName}
          </Text>
          <Text style={styles.conversationTime}>
            {formatTimeAgo(item.lastMessageAt)}
          </Text>
        </View>
        
        <Text
          style={[
            styles.conversationMessage,
            item.unreadCount > 0 && styles.conversationMessageUnread,
          ]}
          numberOfLines={2}
        >
          {item.lastMessage || 'No messages yet'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Loading conversations...</Text>
      </View>
    );
  }

  if (conversations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MessageSquare size={48} color={Colors.light.muted} />
        <Text style={styles.emptyText}>No conversations yet</Text>
        <Text style={styles.emptySubtext}>
          Start a conversation with a business owner
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={conversations}
      renderItem={renderConversation}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },
  conversationCard: {
    flexDirection: 'row',
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Colors.light.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.light.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.text,
    flex: 1,
    marginRight: 8,
  },
  conversationTime: {
    fontSize: 12,
    color: Colors.light.muted,
  },
  conversationMessage: {
    fontSize: 14,
    color: Colors.light.muted,
    lineHeight: 20,
  },
  conversationMessageUnread: {
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.light.muted,
    textAlign: 'center',
  },
});
