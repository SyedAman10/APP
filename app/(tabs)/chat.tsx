import { LMN8Colors, LMN8Spacing, LMN8Typography } from '@/constants/LMN8DesignSystem';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function ChatScreen() {
  const { user } = useAuth();
  const { messages, isLoading, sendMessage, isAIAvailable } = useChat();
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSendMessage = async () => {
    if (inputText.trim().length === 0) return;

    const message = inputText.trim();
    setInputText('');
    
    // Scroll to bottom when sending message
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    await sendMessage(message);
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <View style={styles.container}>
      {/* Background with gradient overlay */}
      <LinearGradient
        colors={[
          LMN8Colors.bgDark,
          '#1e1e3f',
          LMN8Colors.bgDark,
          '#2a1a4e',
          LMN8Colors.bgDark
        ]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Floating background elements */}
      <View style={styles.floatingElement1} />
      <View style={styles.floatingElement2} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.aiAvatar}>
            <Text style={styles.aiAvatarText}>🧠</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>AI Companion</Text>
            <Text style={styles.headerSubtitle}>Always here to listen and help</Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message, index) => (
          <View
            key={index}
            style={[
              styles.messageContainer,
              message.role === 'user' ? styles.userMessage : styles.aiMessage,
            ]}
          >
            <View
              style={[
                styles.messageBubble,
                message.role === 'user' ? styles.userBubble : styles.aiBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  message.role === 'user' ? styles.userText : styles.aiText,
                ]}
              >
                {message.content}
              </Text>
              <Text
                style={[
                  styles.messageTime,
                  message.role === 'user' ? styles.userTime : styles.aiTime,
                ]}
              >
                {formatTime(new Date())}
              </Text>
            </View>
          </View>
        ))}
        
        {isLoading && (
          <View style={[styles.messageContainer, styles.aiMessage]}>
            <View style={[styles.messageBubble, styles.aiBubble]}>
              <View style={styles.typingIndicator}>
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="Type your message..."
            placeholderTextColor={LMN8Colors.text60}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              inputText.trim().length === 0 && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={inputText.trim().length === 0}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LMN8Colors.bgDark,
  },

  floatingElement1: {
    position: 'absolute',
    top: height * 0.15,
    right: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${LMN8Colors.accentPrimary}06`,
    opacity: 0.4,
  },

  floatingElement2: {
    position: 'absolute',
    bottom: height * 0.3,
    left: -60,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${LMN8Colors.accentPrimary}04`,
    opacity: 0.3,
  },

  header: {
    paddingTop: 50, // Account for status bar
    paddingHorizontal: LMN8Spacing.lg,
    paddingBottom: LMN8Spacing.md,
    backgroundColor: `${LMN8Colors.container}95`,
    borderBottomWidth: 1,
    borderBottomColor: `${LMN8Colors.accentPrimary}20`,
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  aiAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${LMN8Colors.accentPrimary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: LMN8Spacing.md,
  },

  aiAvatarText: {
    fontSize: 24,
  },

  headerText: {
    flex: 1,
  },

  headerTitle: {
    ...LMN8Typography.h3,
    fontSize: 18,
    fontWeight: '600',
    color: LMN8Colors.text100,
    marginBottom: 2,
  },

  headerSubtitle: {
    ...LMN8Typography.caption,
    color: LMN8Colors.text60,
    fontSize: 12,
  },

  messagesContainer: {
    flex: 1,
  },

  messagesContent: {
    padding: LMN8Spacing.lg,
    paddingBottom: LMN8Spacing.md,
  },

  messageContainer: {
    marginBottom: LMN8Spacing.md,
  },

  userMessage: {
    alignItems: 'flex-end',
  },

  aiMessage: {
    alignItems: 'flex-start',
  },

  messageBubble: {
    maxWidth: width * 0.75,
    paddingHorizontal: LMN8Spacing.md,
    paddingVertical: LMN8Spacing.sm,
    borderRadius: 20,
  },

  userBubble: {
    backgroundColor: LMN8Colors.accentPrimary,
    borderBottomRightRadius: 4,
  },

  aiBubble: {
    backgroundColor: `${LMN8Colors.container}95`,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: `${LMN8Colors.accentPrimary}20`,
  },

  messageText: {
    ...LMN8Typography.body,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },

  userText: {
    color: '#ffffff',
  },

  aiText: {
    color: LMN8Colors.text100,
  },

  messageTime: {
    ...LMN8Typography.caption,
    fontSize: 11,
  },

  userTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },

  aiTime: {
    color: LMN8Colors.text60,
  },

  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },

  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: LMN8Colors.accentPrimary,
    marginHorizontal: 2,
    opacity: 0.6,
  },

  inputContainer: {
    padding: LMN8Spacing.lg,
    paddingBottom: 20, // Reduced padding for tab bar
    backgroundColor: `${LMN8Colors.container}95`,
    borderTopWidth: 1,
    borderTopColor: `${LMN8Colors.accentPrimary}20`,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: `${LMN8Colors.bgDark}80`,
    borderRadius: 25,
    paddingHorizontal: LMN8Spacing.md,
    paddingVertical: LMN8Spacing.sm,
    borderWidth: 1,
    borderColor: `${LMN8Colors.accentPrimary}30`,
  },

  textInput: {
    flex: 1,
    ...LMN8Typography.body,
    color: LMN8Colors.text100,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: LMN8Spacing.sm,
  },

  sendButton: {
    backgroundColor: LMN8Colors.accentPrimary,
    paddingHorizontal: LMN8Spacing.md,
    paddingVertical: LMN8Spacing.sm,
    borderRadius: 20,
    marginLeft: LMN8Spacing.sm,
  },

  sendButtonDisabled: {
    backgroundColor: LMN8Colors.text60,
    opacity: 0.5,
  },

  sendButtonText: {
    ...LMN8Typography.label,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
