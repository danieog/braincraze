import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from "react-native";
import { Stack } from "expo-router";

import {
  getVictories,
  createVictory,
  type Victory,
  type Visibility,
} from "../../lib/api";

const C = {
  lavender: "#B8A4E3",
  pink: "#FFB7CE",
  mint: "#A8E6CF",
  peach: "#FFD3B6",
  cream: "#FFF9F0",
  plum: "#423653",
  muted: "#6B5E78",
};

export default function VictoriesScreen() {
  const { width } = useWindowDimensions();

  const [victories, setVictories] = useState<Victory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [visibility, setVisibility] =
    useState<Visibility>("private");
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    let mounted = true;

    getVictories()
      .then((data) => {
        if (mounted) setVictories(data);
      })
      .catch(() => {
        Alert.alert("Oops!", "We couldn't load your victories.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function addVictory() {
    if (!content.trim() || saving) return;

    setSaving(true);

    try {
      const newVictory = await createVictory({
        userId: "demo-user",
        author: "You",
        content: content.trim(),
        visibility,
      });

      setVictories((previous) => [newVictory, ...previous]);
      setContent("");
      setShowForm(false);
      setCelebrating(true);
    } catch {
      Alert.alert("Oops!", "Couldn't save your victory. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ title: "Tiny Victories" }} />

      <View
        style={[
          styles.column,
          { maxWidth: width > 700 ? 650 : 480 },
        ]}
      >
        <Text style={styles.eyebrow}>
          YOUR LITTLE WINS MATTER ✨
        </Text>

        <Text style={styles.heading}>Tiny Victories</Text>

        <Text style={styles.subtitle}>
          Every little step deserves to be celebrated.
          What made you proud today?
        </Text>

        <View style={styles.ozzieBanner}>
          <Text style={styles.mascot}>🐾</Text>

          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>
              Ozzie believes in you!
            </Text>
            <Text style={styles.bannerBody}>
              Even the smallest victory is still progress.
            </Text>
          </View>
        </View>

        {celebrating && (
          <View style={styles.celebration}>
            <Text style={styles.celebrationTitle}>
              🎉 YOU DID IT!
            </Text>
            <Text style={styles.bannerBody}>
              Ozzie is proud of you! Keep going!
            </Text>

            <Pressable
              accessibilityRole="button"
              onPress={() => setCelebrating(false)}
            >
              <Text style={styles.dismiss}>Close ✕</Text>
            </Pressable>
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          style={styles.addButton}
          onPress={() => setShowForm(!showForm)}
        >
          <Text style={styles.addButtonText}>
            {showForm ? "Cancel" : "＋ Add a Tiny Victory"}
          </Text>
        </Pressable>

        {showForm && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>
              What did you accomplish?
            </Text>

            <TextInput
              style={styles.input}
              value={content}
              onChangeText={setContent}
              placeholder="I finally asked for help in class..."
              placeholderTextColor="#80748C"
              multiline
              maxLength={500}
              accessibilityLabel="Describe your victory"
            />

            <Text style={styles.formTitle}>Who can see it?</Text>

            <View style={styles.visibilityRow}>
              {(["private", "anonymous", "public"] as const).map(
                (option) => (
                  <Pressable
                    key={option}
                    accessibilityRole="radio"
                    accessibilityState={{
                      checked: visibility === option,
                    }}
                    style={[
                      styles.chip,
                      visibility === option && styles.selectedChip,
                    ]}
                    onPress={() => setVisibility(option)}
                  >
                    <Text style={styles.chipText}>
                      {option === "private"
                        ? "🔒 Private"
                        : option === "anonymous"
                        ? "👀 Anonymous"
                        : "🌸 Public"}
                    </Text>
                  </Pressable>
                )
              )}
            </View>

            <Pressable
              style={[
                styles.saveButton,
                (!content.trim() || saving) && styles.disabled,
              ]}
              disabled={!content.trim() || saving}
              onPress={addVictory}
              accessibilityRole="button"
            >
              <Text style={styles.addButtonText}>
                {saving ? "Saving..." : "Celebrate My Victory ♡"}
              </Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.sectionTitle}>Your Victory Journal</Text>

        {loading ? (
          <ActivityIndicator size="large" color={C.plum} />
        ) : victories.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Your story starts here ♡</Text>
            <Text style={styles.bannerBody}>
              Add your first victory, however small it may seem.
            </Text>
          </View>
        ) : (
          victories.map((victory) => (
            <View key={victory.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardAuthor}>
                  {victory.visibility === "anonymous"
                    ? "Anonymous Possum"
                    : victory.author}
                </Text>

                <Text style={styles.visibilityLabel}>
                  {victory.visibility === "private"
                    ? "🔒 Private"
                    : victory.visibility === "anonymous"
                    ? "Anonymous"
                    : "Public"}
                </Text>
              </View>

              <Text style={styles.cardContent}>
                {victory.content}
              </Text>

              <Text style={styles.cardFooter}>
                🌟 A little win worth remembering
              </Text>
            </View>
          ))
        )}
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
    paddingTop: 36,
    paddingBottom: 80,
  },
  column: {
    width: "100%",
  },
  eyebrow: {
    color: C.muted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  heading: {
    color: C.plum,
    fontSize: 32,
    fontWeight: "900",
    marginTop: 8,
  },
  subtitle: {
    color: C.muted,
    fontSize: 15,
    lineHeight: 23,
    marginTop: 8,
    marginBottom: 22,
  },
  ozzieBanner: {
    backgroundColor: C.lavender,
    borderRadius: 24,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginBottom: 20,
  },
  mascot: {
    fontSize: 40,
  },
  bannerTitle: {
    color: C.plum,
    fontSize: 17,
    fontWeight: "900",
  },
  bannerBody: {
    color: C.plum,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4,
  },
  addButton: {
    backgroundColor: C.pink,
    borderRadius: 18,
    padding: 17,
    alignItems: "center",
    minHeight: 50,
  },
  addButtonText: {
    color: C.plum,
    fontWeight: "900",
    fontSize: 15,
    textAlign: "center",
  },
  form: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 24,
    marginTop: 15,
    gap: 15,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: C.plum,
  },
  input: {
    backgroundColor: C.cream,
    borderRadius: 14,
    padding: 15,
    minHeight: 110,
    textAlignVertical: "top",
    fontSize: 15,
    color: C.plum,
  },
  visibilityRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: C.cream,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedChip: {
    backgroundColor: C.lavender,
    borderColor: C.plum,
  },
  chipText: {
    color: C.plum,
    fontSize: 12,
    fontWeight: "700",
  },
  saveButton: {
    backgroundColor: C.mint,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  disabled: {
    opacity: 0.45,
  },
  celebration: {
    backgroundColor: C.mint,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  celebrationTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: C.plum,
  },
  dismiss: {
    color: C.plum,
    fontWeight: "800",
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: C.plum,
    marginTop: 28,
    marginBottom: 15,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 20,
    marginBottom: 13,
    borderLeftWidth: 5,
    borderLeftColor: C.pink,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 13,
  },
  cardAuthor: {
    color: C.plum,
    fontWeight: "800",
    flexShrink: 1,
  },
  visibilityLabel: {
    color: C.muted,
    fontSize: 11,
  },
  cardContent: {
    color: C.plum,
    fontSize: 16,
    lineHeight: 24,
  },
  cardFooter: {
    color: C.muted,
    fontSize: 12,
    marginTop: 17,
  },
  empty: {
    padding: 28,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    alignItems: "center",
  },
  emptyTitle: {
    color: C.plum,
    fontSize: 18,
    fontWeight: "800",
  },
});