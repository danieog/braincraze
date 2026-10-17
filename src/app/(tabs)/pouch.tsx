import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { Stack } from "expo-router";

import {
  getCommunityPosts,
  type CommunityPost,
} from "../../lib/api";

const C = {
  cream: "#FFF9F0",
  lavender: "#B8A4E3",
  pink: "#FFB7CE",
  mint: "#A8E6CF",
  peach: "#FFD3B6",
  plum: "#423653",
  muted: "#6B5E78",
  white: "#FFFFFF",
};

const categories = [
  "All",
  "Little wins",
  "Study buddies",
  "Academics",
  "Campus Life",
  "Confidence",
  "Vent",
];

export default function PouchScreen() {
  const { width } = useWindowDimensions();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Little wins");
  const [anonymous, setAnonymous] = useState(true);
  const [liked, setLiked] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    getCommunityPosts()
      .then(setPosts)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const filteredPosts =
    filter === "All"
      ? posts
      : posts.filter((post) => post.category === filter);

  function toggleLike(id: string) {
    setLiked((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  }

  function sharePost() {
    if (!content.trim()) return;

    const newPost: CommunityPost = {
      id: `${Date.now()}`,
      author: anonymous ? "A little possum" : "You",
      anonymous,
      category,
      content: content.trim(),
      reactions: 0,
      comments: 0,
    };

    // Local demo only. Backend persistence comes later.
    setPosts((previous) => [newPost, ...previous]);
    setContent("");
    setShowForm(false);
    setFilter("All");
    setSuccess(true);
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View
        style={[
          styles.column,
          { maxWidth: width > 700 ? 650 : 480 },
        ]}
      >
        <Text style={styles.eyebrow}>
          YOUR LITTLE CAMPUS COMPANION
        </Text>

        <Text style={styles.heading}>Possum Pouch</Text>

        <Text style={styles.subtitle}>
          There&apos;s room for everyone in the pouch.
        </Text>

        {/* Ozzie's welcome message */}
        <View style={styles.ozzieBanner}>
          <Text style={styles.ozzieEmoji}>🐾</Text>

          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>
              A little nudge from Ozzie
            </Text>

            <Text style={styles.bannerBody}>
              A soft place to land. You don&apos;t have to do college alone.
            </Text>
          </View>
        </View>

        {success && (
          <Pressable
            accessibilityRole="button"
            onPress={() => setSuccess(false)}
            style={styles.success}
          >
            <Text style={styles.successText}>
              Your post has been added to this demo! ♡
            </Text>
            <Text style={styles.small}>Tap to dismiss</Text>
          </Pressable>
        )}

        {/* Category filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filters}
          contentContainerStyle={{ gap: 8 }}
        >
          {categories.map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected: filter === item }}
              onPress={() => setFilter(item)}
              style={[
                styles.filterChip,
                filter === item && styles.activeChip,
              ]}
            >
              <Text style={styles.filterText}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Community posts */}
        {loading ? (
          <ActivityIndicator
            color={C.plum}
            size="large"
            style={{ marginTop: 30 }}
          />
        ) : error ? (
          <View style={styles.empty}>
            <Text style={styles.postContent}>
              Couldn&apos;t load the community right now.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setError(false);
                setLoading(true);
                getCommunityPosts()
                  .then(setPosts)
                  .catch(() => setError(true))
                  .finally(() => setLoading(false));
              }}
            >
              <Text style={styles.actionText}>Try again</Text>
            </Pressable>
          </View>
        ) : filteredPosts.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              It&apos;s quiet in here! 🌱
            </Text>
            <Text style={styles.bannerBody}>
              Be the first to share something in this category.
            </Text>
          </View>
        ) : (
          filteredPosts.map((post, index) => {
            const isLiked = liked.includes(post.id);

            return (
              <View key={post.id} style={styles.card}>
                <View style={styles.postHeader}>
                  <View
                    style={[
                      styles.avatar,
                      {
                        backgroundColor:
                          index % 2 === 0 ? C.peach : C.lavender,
                      },
                    ]}
                  >
                    <Text style={styles.avatarText}>
                      {post.anonymous ? "👻" : "♡"}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.author}>{post.author}</Text>
                    <Text style={styles.small}>{post.category}</Text>
                  </View>

                  <Text style={styles.dots}>•••</Text>
                </View>

                <Text style={styles.postContent}>
                  {post.content}
                </Text>

                <View style={styles.reactions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      isLiked ? "Remove encouragement" : "Encourage post"
                    }
                    onPress={() => toggleLike(post.id)}
                    style={[
                      styles.reaction,
                      isLiked && styles.likedReaction,
                    ]}
                  >
                    <Text style={styles.reactionText}>
                      {isLiked ? "♥" : "♡"} You got this ·{" "}
                      {post.reactions + (isLiked ? 1 : 0)}
                    </Text>
                  </Pressable>

                  <View style={styles.reaction}>
                    <Text style={styles.reactionText}>
                      🌱 Me too
                    </Text>
                  </View>

                  <Text style={styles.commentCount}>
                    ♧ {post.comments}
                  </Text>
                </View>
              </View>
            );
          })
        )}

        {/* Create a post */}
        <Pressable
          accessibilityRole="button"
          style={styles.shareButton}
          onPress={() => setShowForm(!showForm)}
        >
          <Text style={styles.shareText}>
            {showForm ? "Cancel" : "＋ Share with the pouch"}
          </Text>
        </Pressable>

        {showForm && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>
              What&apos;s on your mind?
            </Text>

            <TextInput
              value={content}
              onChangeText={setContent}
              multiline
              maxLength={500}
              placeholder="Share a little win, ask for advice, or encourage someone..."
              placeholderTextColor={C.muted}
              style={styles.input}
              accessibilityLabel="Write your community post"
            />

            <Text style={styles.small}>
              {content.length}/500 characters
            </Text>

            <Text style={styles.formTitle}>Choose a category</Text>

            <View style={styles.categoryRow}>
              {categories
                .filter((item) => item !== "All")
                .map((item) => (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    accessibilityState={{
                      selected: category === item,
                    }}
                    style={[
                      styles.categoryButton,
                      category === item && styles.selectedCategory,
                    ]}
                    onPress={() => setCategory(item)}
                  >
                    <Text style={styles.categoryText}>{item}</Text>
                  </Pressable>
                ))}
            </View>

            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: anonymous }}
              onPress={() => setAnonymous(!anonymous)}
              style={styles.anonymousRow}
            >
              <Text style={styles.postContent}>
                {anonymous ? "☑" : "□"} Post anonymously
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={sharePost}
              disabled={!content.trim()}
              style={[
                styles.shareButton,
                !content.trim() && { opacity: 0.45 },
              ]}
            >
              <Text style={styles.shareText}>
                Share a little kindness ♡
              </Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.disclaimer}>
          Demo community · Posts are temporarily stored in this session.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.cream,
  },
  content: {
    alignItems: "center",
    padding: 20,
    paddingTop: 45,
    paddingBottom: 90,
  },
  column: {
    width: "100%",
  },
  eyebrow: {
    color: C.muted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.3,
  },
  heading: {
    color: C.plum,
    fontSize: 32,
    fontWeight: "900",
    marginTop: 6,
  },
  subtitle: {
    color: C.muted,
    fontSize: 15,
    marginTop: 8,
    marginBottom: 20,
  },
  ozzieBanner: {
    backgroundColor: "#E5F5ED",
    padding: 18,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 22,
  },
  ozzieEmoji: {
    fontSize: 36,
  },
  bannerTitle: {
    color: C.plum,
    fontWeight: "900",
    fontSize: 15,
  },
  bannerBody: {
    color: C.plum,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4,
  },
  filters: {
    marginBottom: 19,
    flexGrow: 0,
  },
  filterChip: {
    backgroundColor: C.white,
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  activeChip: {
    backgroundColor: C.lavender,
  },
  filterText: {
    color: C.plum,
    fontSize: 12,
    fontWeight: "800",
  },
  card: {
    backgroundColor: C.white,
    borderRadius: 25,
    padding: 20,
    marginBottom: 12,
    width: "100%",
    shadowColor: C.plum,
    shadowOpacity: 0.05,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 21,
  },
  author: {
    color: C.plum,
    fontSize: 15,
    fontWeight: "900",
  },
  small: {
    color: C.muted,
    fontSize: 12,
    marginTop: 3,
  },
  dots: {
    color: C.plum,
    fontSize: 18,
  },
  postContent: {
    color: C.plum,
    fontSize: 15,
    lineHeight: 23,
  },
  reactions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginTop: 17,
  },
  reaction: {
    backgroundColor: "#FFF0F5",
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 20,
  },
  likedReaction: {
    backgroundColor: C.pink,
  },
  reactionText: {
    color: C.plum,
    fontSize: 12,
    fontWeight: "800",
  },
  commentCount: {
    color: C.muted,
    fontSize: 12,
    marginLeft: "auto",
  },
  shareButton: {
    backgroundColor: C.lavender,
    padding: 17,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 16,
    minHeight: 50,
  },
  shareText: {
    fontSize: 15,
    color: C.plum,
    fontWeight: "900",
  },
  form: {
    backgroundColor: C.white,
    padding: 20,
    borderRadius: 24,
    marginTop: 18,
    gap: 14,
  },
  formTitle: {
    color: C.plum,
    fontWeight: "900",
    fontSize: 16,
  },
  input: {
    backgroundColor: C.cream,
    padding: 15,
    borderRadius: 14,
    minHeight: 115,
    color: C.plum,
    fontSize: 15,
    textAlignVertical: "top",
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryButton: {
    backgroundColor: C.cream,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectedCategory: {
    backgroundColor: C.mint,
  },
  categoryText: {
    color: C.plum,
    fontSize: 12,
    fontWeight: "800",
  },
  anonymousRow: {
    paddingVertical: 8,
  },
  success: {
    backgroundColor: C.mint,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  successText: {
    color: C.plum,
    fontWeight: "900",
  },
  empty: {
    backgroundColor: C.white,
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
  },
  emptyTitle: {
    color: C.plum,
    fontSize: 19,
    fontWeight: "900",
  },
  actionText: {
    color: C.plum,
    fontWeight: "900",
    marginTop: 12,
    textDecorationLine: "underline",
  },
  disclaimer: {
    color: C.muted,
    fontSize: 11,
    textAlign: "center",
    marginTop: 25,
  },
});