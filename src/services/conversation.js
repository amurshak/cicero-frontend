/**
 * Conversation management service
 * Handles conversation history, creation, and retrieval
 */

import { api } from './api';

export const conversationService = {
  /**
   * Get user's conversation history
   * Only works for paid users (pro/enterprise)
   */
  async getConversations(limit = 50, archived = false) {
    try {
      const response = await api.get(`/conversations?limit=${limit}&archived=${archived}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get conversations:', error);
      // If user doesn't have access, return empty array (free users)
      if (error.response?.status === 403) {
        return [];
      }
      throw error;
    }
  },

  /**
   * Create a new conversation
   */
  async createConversation(title = null) {
    try {
      const response = await api.post('/conversations', { title });
      return response.data;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw error;
    }
  },

  /**
   * Get conversation details with all messages
   * Only works for paid users
   */
  async getConversationWithMessages(conversationId) {
    try {
      const response = await api.get(`/conversations/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get conversation messages:', error);
      throw error;
    }
  },

  /**
   * Update conversation (title, archive status)
   * Only works for paid users
   */
  async updateConversation(conversationId, updates) {
    try {
      const response = await api.put(`/conversations/${conversationId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Failed to update conversation:', error);
      throw error;
    }
  },

  /**
   * Delete conversation
   * Only works for paid users
   */
  async deleteConversation(conversationId) {
    try {
      const response = await api.delete(`/conversations/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      throw error;
    }
  },

  /**
   * Archive conversation
   * Only works for paid users
   */
  async archiveConversation(conversationId) {
    return this.updateConversation(conversationId, { is_archived: true });
  },

  /**
   * Unarchive conversation
   * Only works for paid users
   */
  async unarchiveConversation(conversationId) {
    return this.updateConversation(conversationId, { is_archived: false });
  },

  /**
   * Rename conversation
   * Only works for paid users
   */
  async renameConversation(conversationId, title) {
    return this.updateConversation(conversationId, { title });
  },

  /**
   * Check if user can access conversation history
   * Based on subscription tier
   */
  canAccessHistory(user) {
    if (!user) return false;
    return user.subscription_tier === 'pro' || user.subscription_tier === 'enterprise';
  },

  /**
   * Generate title from message content (client-side helper)
   */
  generateTitle(content) {
    // Take first 50 characters, stop at sentence end
    let title = content.trim().substring(0, 50);
    
    // Try to end at a sentence boundary
    const endings = ['.', '!', '?'];
    for (const ending of endings) {
      if (title.includes(ending)) {
        title = title.split(ending)[0] + ending;
        break;
      }
    }
    
    // If still too long, truncate at word boundary
    if (title.length > 45) {
      const words = title.split(' ');
      if (words.length > 1) {
        words.pop();
        title = words.join(' ') + '...';
      } else {
        title = title.substring(0, 45) + '...';
      }
    }
    
    return title;
  },

  /**
   * Format conversation for display
   */
  formatConversation(conversation) {
    return {
      ...conversation,
      created_at: new Date(conversation.created_at),
      updated_at: new Date(conversation.updated_at),
      displayTitle: conversation.title || 'Untitled Conversation',
      timeAgo: this.getTimeAgo(new Date(conversation.updated_at))
    };
  },

  /**
   * Get human-readable time ago string
   */
  getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }
};

export default conversationService;