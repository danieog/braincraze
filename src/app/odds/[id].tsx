import { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Linking, useWindowDimensions } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";

import oddsData from "../../data/odds.json";

const C = {
  lavender: "#B8A4E3",
  pink: "#FFB7CE",
  mint: "#A8E6CF",
  peach: "#FFD3B6",
  cream: "#FFF9F0",
  plum: "#423653",
  muted: "#6B5E78",
};

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace("/odds");
}

function openSafe(url: string) {
  if (url.startsWith("https://")) Linking.openURL(url);
}

export default function StoryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const [kept, setKept] = useState(false);
  const person = oddsData.find((p) => p.id === id);
  const columnWidth = Math.min(width, 520);

  if (!person) {
    return (
      <View style={[styles.screen, { padding: 24, paddingTop: 72 }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.name}>Story not found</Text>
        <Pressable accessibilityRole="button" onPress={goBack} style={styles.primaryButton}>
          <Text style={styles.primaryText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ alignItems: "center", paddingTop: 56, paddingBottom: 48 }}>
        <View style={{ width: columnWidth, paddingHorizontal: 16 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to stories"
            onPress={goBack}
            style={styles.backButton}
          >
            <Text style={styles.backText}>← Back</Text>
          </Pressable>

          <View style={[styles.portrait, { backgroundColor: person.color }]}>
            <View style={styles.placeholderChip}>
              <Text style={styles.placeholderText}>Portrait placeholder · not a likeness</Text>
            </View>
          </View>

          <Text accessibilityRole="header" style={styles.name}>{person.name}</Text>
          <Text style={styles.roles}>{person.roles}</Text>
          <Text style={styles.body}>{person.bio}</Text>

          <View style={[styles.section, { backgroundColor: "#fff" }]}>
            <Text style={styles.sectionTitle}>The challenge</Text>
            <Text style={styles.body}>{person.challenge}</Text>
          </View>

          <View style={[styles.section, { backgroundColor: C.mint }]}>
            <Text style={styles.sectionTitle}>What they made possible</Text>
            <Text style={styles.body}>{person.madePossible}</Text>
          </View>

          <View style={[styles.section, { backgroundColor: C.lavender }]}>
            <Text style={styles.label}>BRAINCRAZE TAKEAWAY · NOT A QUOTE</Text>
            <Text style={styles.takeaway}>{person.takeaway}</Text>
          </View>

          <Text style={styles.sources}>
            Biographical summary, not a quotation. Sources:
          </Text>
          {person.sources.map((s) => (
            <Pressable
              key={s.url}
              accessibilityRole="link"
              accessibilityLabel={`Open source: ${s.label}`}
              onPress={() => openSafe(s.url)}
              style={styles.sourceLink}
            >
              <Text style={styles.sourceLinkText}>{s.label}</Text>
            </Pressable>
          ))}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: kept }}
            onPress={() => setKept((k) => !k)}
            style={[styles.primaryButton, kept && { backgroundColor: C.pink }]}
          >
            <Text style={styles.primaryText}>
              {kept ? "Kept! Saved on this screen only" : "Keep this takeaway"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.cream },
  backButton: { minHeight: 44, justifyContent: "center", marginBottom: 8 },
  backText: { color: C.plum, fontSize: 16, fontWeight: "800" },
  portrait: { height: 190, borderRadius: 24, padding: 10 },
  placeholderChip: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  placeholderText: { color: C.plum, fontSize: 11, fontWeight: "700" },
  name: { color: C.plum, fontSize: 28, fontWeight: "900", marginTop: 14 },
  roles: { color: C.muted, fontSize: 13, fontWeight: "700", marginTop: 2, marginBottom: 8 },
  body: { color: C.plum, fontSize: 15, lineHeight: 22 },
  section: { borderRadius: 20, padding: 14, marginTop: 12 },
  sectionTitle: { color: C.plum, fontSize: 16, fontWeight: "800", marginBottom: 4 },
  label: { color: C.plum, fontSize: 10, fontWeight: "800", letterSpacing: 1, marginBottom: 4 },
  takeaway: { color: C.plum, fontSize: 16, fontWeight: "800", lineHeight: 22 },
  sources: { color: C.muted, fontSize: 12, marginTop: 14 },
  sourceLink: { minHeight: 44, justifyContent: "center" },
  sourceLinkText: { color: C.plum, fontSize: 14, fontWeight: "700", textDecorationLine: "underline" },
  primaryButton: {
    backgroundColor: C.lavender,
    borderRadius: 99,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  primaryText: { color: C.plum, fontSize: 16, fontWeight: "800" },
});