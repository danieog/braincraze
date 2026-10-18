import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Colors and copy from the mae-iui-main LandingView.
const STEPS = [
  { title: "Create an account", body: "Sign up with your email and a password. No ID or email confirmation is needed to join." },
  { title: "Verify your school (optional)", body: "Photograph your school ID to earn a verified badge. A person reviews ID photos, then the photo is deleted." },
  { title: "Find people nearby", body: "Turn on location sharing to see students near you. It is off until you choose it, and you can stop any time." },
];

// Public page for signed-out visitors, on mobile and web.
export function Landing() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>BrainCraze Community</Text>
          </View>
          <Text style={styles.headline} accessibilityRole="header">
            Meet verified students and teachers near you.
          </Text>
          <Text style={styles.lead}>
            BrainCraze connects people at your school. Anyone can join. Members whose school ID a person has reviewed
            carry a badge showing they are a real student, faculty member, teaching assistant, staff member or tutor.
          </Text>
          <View style={styles.actions}>
            <Link href="/signup" style={[styles.button, styles.primary]}>
              Sign up
            </Link>
            <Link href="/login" style={[styles.button, styles.secondary]}>
              Log in
            </Link>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            How it works
          </Text>
          {STEPS.map((step, i) => (
            <View key={step.title} style={styles.card}>
              <Text style={styles.stepNumber}>{i + 1}</Text>
              <View style={styles.stepText}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.body}>{step.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.card, styles.privacy]}>
          <Text style={styles.privacyTitle} accessibilityRole="header">
            Your privacy
          </Text>
          <Text style={styles.body}>
            Location sharing is opt-in and approximate. Your position is rounded to about 1 km so your exact home or
            classroom is never disclosed. Your ID photo is used only to verify your academic affiliation and is
            permanently deleted after human review.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFF8F0" },
  content: { paddingHorizontal: 16, paddingVertical: 32, gap: 40, width: "100%", maxWidth: 768, alignSelf: "center" },
  hero: { gap: 16 },
  badge: { alignSelf: "flex-start", backgroundColor: "#E3D9FF", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  badgeText: { color: "#3B2F5C", fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6 },
  headline: { color: "#3B2F5C", fontSize: 30, lineHeight: 37, fontWeight: "800", letterSpacing: -0.4 },
  lead: { color: "#4A4458", fontSize: 16, lineHeight: 26 },
  actions: { gap: 12, paddingTop: 8 },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    overflow: "hidden",
  },
  primary: { backgroundColor: "#222222", color: "#FFFFFF" },
  secondary: { borderWidth: 1, borderColor: "#222222", color: "#222222" },
  section: { gap: 16 },
  sectionTitle: { color: "#3B2F5C", fontSize: 20, fontWeight: "700" },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E3D9FF",
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#222222",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 32,
    fontSize: 14,
    fontWeight: "700",
    overflow: "hidden",
    marginTop: 2,
  },
  stepText: { flex: 1, gap: 4 },
  stepTitle: { color: "#3B2F5C", fontSize: 16, fontWeight: "700" },
  body: { color: "#4A4458", fontSize: 14, lineHeight: 22 },
  privacy: { flexDirection: "column", gap: 8, padding: 20 },
  privacyTitle: { color: "#3B2F5C", fontSize: 18, fontWeight: "700" },
});
