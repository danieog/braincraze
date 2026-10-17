import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { Stack } from "expo-router";

import {
  sendOzzieMessage,
  type AIProvider,
  type ChatMessage,
} from "../../lib/api";

const C = {
  cream: "#FFF9F0",
  plum: "#423653",
  muted: "#6B5E78",
  lavender: "#B8A4E3",
  pink: "#FFB7CE",
  mint: "#A8E6CF",
  white: "#FFFFFF",
};

const starterPrompts = [
  { label: "📚 Quiz me", message: "Can you quiz me on a topic?" },
  {
    label: "🧩 Break it down",
    message: "Help me break a big assignment into smaller steps.",
  },
  {
    label: "💡 Explain it",
    message: "Can you explain a difficult concept simply?",
  },
  {
    label: "⏰ Remind me",
    message: "Help me plan a reminder for my assignment.",
  },
];

export default function OzzieScreen() {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);

  const [provider, setProvider] = useState<AIProvider>("groq");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hey, little possum! ♡ I'm Ozzie. Whether you're overwhelmed, studying, or just need a little encouragement, I'm here to help. What's on your mind?",
    },
  ]);

  async function sendMessage(messageText: string) {
    const trimmed = messageText.trim();

    if (!trimmed || sending) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    setMessages((previous) => [...previous, userMessage]);
    setInput("");
    setError("");
    setSending(true);

    try {
      const response = await sendOzzieMessage(trimmed, provider);

      setMessages((previous) => [
        ...previous,
        {
          ...response,
          id: `assistant-${Date.now()}`,
        },
      ]);
    } catch {
      setError("Ozzie couldn't respond. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.center}>
        <View
          style={[
            styles.container,
            { maxWidth: width > 700 ? 650 : 480 },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>🐾</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.heading}>Ozzie AI ♡</Text>
              <Text style={styles.subheading}>
                Your little study companion
              </Text>
            </View>

            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Demo</Text>
            </View>
          </View>

          {/* AI provider selector */}
          <View style={styles.providerContainer}>
            <Text style={styles.providerTitle}>
              Choose your AI buddy
            </Text>

            <View style={styles.providerRow}>
              {(["groq", "gemini"] as const).map((item) => (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: provider === item,
                  }}
                  style={[
                    styles.providerButton,
                    provider === item && styles.activeProvider,
                  ]}
                  onPress={() => setProvider(item)}
                >
                  <Text style={styles.providerText}>
                    {item === "groq" ? "⚡ Groq" : "✨ Gemini"}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.demoNote}>
              Demo responses for now. Live AI will be connected later.
            </Text>
          </View>

          {/* Chat history */}
          <ScrollView
            ref={scrollRef}
            style={styles.chat}
            contentContainerStyle={styles.chatContent}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() =>
              scrollRef.current?.scrollToEnd({ animated: true })
            }
          >
            <Text style={styles.todayLabel}>
              A LITTLE CHAT WITH OZZIE
            </Text>

            {messages.map((message) => {
              const isUser = message.role === "user";

              return (
                <View
                  key={message.id}
                  style={[
                    styles.messageRow,
                    isUser && styles.userRow,
                  ]}
                >
                  {!isUser && (
                    <View style={styles.smallAvatar}>
                      <Text style={styles.smallAvatarText}>🐾</Text>
                    </View>
                  )}

                  <View
                    style={[
                      styles.bubble,
                      isUser
                        ? styles.userBubble
                        : styles.ozzieBubble,
                    ]}
                  >
                    <Text style={styles.bubbleText}>
                      {message.content}
                    </Text>
                  </View>
                </View>
              );
            })}

            {sending && (
              <View style={styles.messageRow}>
                <View style={styles.smallAvatar}>
                  <Text style={styles.smallAvatarText}>🐾</Text>
                </View>

                <View style={styles.typingBubble}>
                  <ActivityIndicator size="small" color={C.plum} />
                  <Text style={styles.typingText}>
                    Ozzie is thinking...
                  </Text>
                </View>
              </View>
            )}

            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setError("");
                    setMessages((previous) => {
                      const lastUser = [...previous]
                        .reverse()
                        .find((item) => item.role === "user");

                      if (lastUser) {
                        setInput(lastUser.content);
                      }

                      return previous;
                    });
                  }}
                >
                  <Text style={styles.retryText}>
                    Put my message back in the input
                  </Text>
                </Pressable>
              </View>
            )}
          </ScrollView>

          {/* Suggested actions */}
          <View style={styles.suggestions}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.suggestionRow}
            >
              {starterPrompts.map((prompt) => (
                <Pressable
                  key={prompt.label}
                  accessibilityRole="button"
                  disabled={sending}
                  onPress={() => setInput(prompt.message)}
                  style={styles.suggestionChip}
                >
                  <Text style={styles.suggestionText}>
                    {prompt.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Message input */}
          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Tell Ozzie what's on your mind..."
              placeholderTextColor={C.muted}
              multiline
              maxLength={1000}
              accessibilityLabel="Message Ozzie"
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send message"
              disabled={!input.trim() || sending}
              onPress={() => sendMessage(input)}
              style={[
                styles.sendButton,
                (!input.trim() || sending) && styles.disabled,
              ]}
            >
              <Text style={styles.sendText}>➤</Text>
            </Pressable>
          </View>

          <Text style={styles.footer}>
            Ozzie is a demo AI companion, not an emergency or
            professional support service. Reminders are not scheduled
            in demo mode.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.cream,
  },
  center: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 12,
  },
  container: {
    width: "100%",
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 18,
    paddingHorizontal: 8,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.pink,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 29,
  },
  heading: {
    color: C.plum,
    fontSize: 23,
    fontWeight: "900",
  },
  subheading: {
    color: C.muted,
    fontSize: 12,
    marginTop: 2,
  },
  statusPill: {
    backgroundColor: C.mint,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.plum,
  },
  statusText: {
    color: C.plum,
    fontSize: 11,
    fontWeight: "800",
  },
  providerContainer: {
    backgroundColor: C.white,
    padding: 15,
    borderRadius: 19,
    marginBottom: 10,
  },
  providerTitle: {
    color: C.plum,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 10,
  },
  providerRow: {
    flexDirection: "row",
    gap: 8,
  },
  providerButton: {
    flex: 1,
    backgroundColor: C.cream,
    padding: 11,
    borderRadius: 13,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  activeProvider: {
    backgroundColor: C.lavender,
    borderColor: C.plum,
  },
  providerText: {
    color: C.plum,
    fontWeight: "800",
    fontSize: 13,
  },
  demoNote: {
    color: C.muted,
    fontSize: 11,
    marginTop: 9,
  },
  chat: {
    flex: 1,
  },
  chatContent: {
    paddingVertical: 18,
    paddingHorizontal: 5,
    gap: 16,
  },
  todayLabel: {
    textAlign: "center",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.3,
    color: C.muted,
    marginBottom: 6,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  userRow: {
    justifyContent: "flex-end",
  },
  smallAvatar: {
    backgroundColor: C.pink,
    width: 31,
    height: 31,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  smallAvatarText: {
    fontSize: 17,
  },
  bubble: {
    padding: 15,
    borderRadius: 19,
    maxWidth: "80%",
  },
  ozzieBubble: {
    backgroundColor: C.white,
    borderBottomLeftRadius: 5,
  },
  userBubble: {
    backgroundColor: C.lavender,
    borderBottomRightRadius: 5,
  },
  bubbleText: {
    color: C.plum,
    fontSize: 14,
    lineHeight: 21,
  },
  typingBubble: {
    backgroundColor: C.white,
    padding: 13,
    borderRadius: 19,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  typingText: {
    color: C.muted,
    fontSize: 12,
  },
  suggestions: {
    paddingVertical: 12,
  },
  suggestionRow: {
    gap: 8,
    paddingHorizontal: 4,
  },
  suggestionChip: {
    backgroundColor: "#EDE5FB",
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  suggestionText: {
    color: C.plum,
    fontWeight: "800",
    fontSize: 12,
  },
  composer: {
    backgroundColor: C.white,
    borderRadius: 23,
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    color: C.plum,
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 9,
    maxHeight: 120,
  },
  sendButton: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: C.pink,
    justifyContent: "center",
    alignItems: "center",
  },
  sendText: {
    color: C.plum,
    fontSize: 21,
    fontWeight: "900",
  },
  disabled: {
    opacity: 0.4,
  },
  footer: {
    fontSize: 10,
    color: C.muted,
    textAlign: "center",
    lineHeight: 15,
    paddingVertical: 12,
  },
  errorBox: {
    backgroundColor: "#FFE6E6",
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    color: C.plum,
    fontSize: 12,
  },
  retryText: {
    color: C.plum,
    fontSize: 12,
    fontWeight: "900",
    marginTop: 8,
    textDecorationLine: "underline",
  },
});