import { useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { Stack, router } from "expo-router";

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

export default function AgainstTheOdds() {
  const { width } = useWindowDimensions();
  const pageWidth = Math.min(width, 520);
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const [saved, setSaved] = useState<string[]>([]);
  const total = oddsData.length;
  const current = oddsData[index];

  function goTo(next: number) {
    const i = Math.max(0, Math.min(total - 1, next));
    setIndex(i);
    scrollRef.current?.scrollTo({ x: i * pageWidth, animated: true });
  }

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    if (i !== index && i >= 0 && i < total) setIndex(i);
  }

  function toggleSave(id: string) {
    setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  const isSaved = saved.includes(current.id);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.column, { width: pageWidth }]}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>YOUR LITTLE CAMPUS COMPANION</Text>
              <Text accessibilityRole="header" style={styles.heading}>
                Against the Odds
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                isSaved ? `Remove ${current.name} from saved` : `Save ${current.name}`
              }
              onPress={() => toggleSave(current.id)}
              style={styles.iconButton}
            >
              <Text style={styles.iconText}>{isSaved ? "★" : "☆"}</Text>
            </Pressable>
          </View>

          <Text style={styles.subtitle}>
            Different paths. Remarkable people. A little courage for your own story.
          </Text>

          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            style={{ width: pageWidth }}
          >
            {oddsData.map((p, i) => (
              <View key={p.id} style={[styles.page, { width: pageWidth }]}>
                <View style={styles.card}>
                  <View style={[styles.portrait, { backgroundColor: p.color }]}>
                    <View style={styles.placeholderChip}>
                      <Text style={styles.placeholderText}>
                        Portrait placeholder · not a likeness
                      </Text>
                    </View>
                    <Text style={styles.counter}>
                      {i + 1} / {total}
                    </Text>
                  </View>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{p.tag.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.name}>{p.name}</Text>
                  <Text style={styles.bio}>{p.bio}</Text>
                  <View style={styles.takeawayBox}>
                    <Text style={styles.takeawayText}>{p.takeaway}</Text>
                  </View>
                  <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${p.exploreLabel}: ${p.name}`}
                      onPress={() => router.push(`/odds/${p.id}` as never)}
                      style={styles.primaryButton}
                   >
                    <Text style={styles.primaryText}>{p.exploreLabel}</Text>
                  </Pressable>
                  <Text style={styles.sourceLine}>Source: {p.sourceLabel}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.navRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous story"
              accessibilityState={{ disabled: index === 0 }}
              disabled={index === 0}
              onPress={() => goTo(index - 1)}
              style={[styles.navButton, index === 0 && styles.disabled]}
            >
              <Text style={styles.navText}>Back</Text>
            </Pressable>
            <View style={styles.dots} accessibilityElementsHidden>
              {oddsData.map((p, i) => (
                <View
                  key={p.id}
                  style={[styles.dot, i === index && styles.dotActive]}
                />
              ))}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next story"
              accessibilityState={{ disabled: index === total - 1 }}
              disabled={index === total - 1}
              onPress={() => goTo(index + 1)}
              style={[styles.navButton, index === total - 1 && styles.disabled]}
            >
              <Text style={styles.navText}>Next</Text>
            </Pressable>
          </View>

          <View style={styles.ozzieBanner}>
            <View style={styles.ozziePlaceholder}>
              <Text style={styles.ozzieLabel}>Ozzie art</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.ozzieTitle}>You don’t have to fit a mold.</Text>
              <Text style={styles.ozzieBody}>
                Keep a takeaway in your pocket today.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.cream },
  content: { alignItems: "center", paddingTop: 56, paddingBottom: 48 },
  column: { paddingHorizontal: 0 },
  headerRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20 },
  eyebrow: { color: C.muted, fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  heading: { color: C.plum, fontSize: 30, fontWeight: "900", marginTop: 2 },
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { fontSize: 22, color: C.plum },
  subtitle: {
    color: C.muted,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  page: { paddingHorizontal: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 16,
    shadowColor: C.plum,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  portrait: {
    height: 170,
    borderRadius: 22,
    justifyContent: "space-between",
    padding: 10,
  },
  placeholderChip: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  placeholderText: { color: C.plum, fontSize: 11, fontWeight: "700" },
  counter: {
    alignSelf: "flex-end",
    backgroundColor: "rgba(66,54,83,0.85)",
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 3,
    overflow: "hidden",
  },
  tag: {
    alignSelf: "flex-start",
    backgroundColor: C.peach,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 14,
  },
  tagText: { color: C.plum, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  name: { color: C.plum, fontSize: 26, fontWeight: "900", marginTop: 8 },
  bio: { color: C.plum, fontSize: 15, lineHeight: 22, marginTop: 6 },
  takeawayBox: {
    backgroundColor: C.cream,
    borderRadius: 16,
    padding: 12,
    marginTop: 12,
  },
  takeawayText: { color: C.plum, fontSize: 14, fontWeight: "700", lineHeight: 20 },
  primaryButton: {
    backgroundColor: C.lavender,
    borderRadius: 99,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  primaryText: { color: C.plum, fontSize: 16, fontWeight: "800" },
  sourceLine: { color: C.muted, fontSize: 11, marginTop: 10, textAlign: "center" },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 14,
  },
  navButton: {
    minHeight: 44,
    minWidth: 76,
    borderRadius: 99,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  navText: { color: C.plum, fontWeight: "800" },
  disabled: { opacity: 0.4 },
  dots: { flexDirection: "row", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#D9CFE8" },
  dotActive: { width: 22, backgroundColor: C.lavender },
  ozzieBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.peach,
    borderRadius: 24,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 18,
  },
  ozziePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  ozzieLabel: { color: C.plum, fontSize: 10, fontWeight: "800" },
  ozzieTitle: { color: C.plum, fontSize: 15, fontWeight: "800" },
  ozzieBody: { color: C.plum, fontSize: 13, marginTop: 2 },
});