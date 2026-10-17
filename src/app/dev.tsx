import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

const C = { lavender: "#B8A4E3", cream: "#FFF9F0", plum: "#423653", muted: "#6B5E78" };

export default function DevLauncher() {
  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <Text accessibilityRole="header" style={styles.title}>BrainCraze screens</Text>
      <Text style={styles.sub}>Temporary launcher for my screens.</Text>
      <Link href="/odds" style={styles.button}>
        Against the Odds
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.cream, padding: 24, paddingTop: 80, gap: 12 },
  title: { color: C.plum, fontSize: 28, fontWeight: "900" },
  sub: { color: C.muted, fontSize: 14, marginBottom: 12 },
  button: {
    backgroundColor: C.lavender,
    color: C.plum,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
    paddingVertical: 14,
    borderRadius: 99,
    overflow: "hidden",
  },
});