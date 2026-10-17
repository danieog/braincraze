import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const STEPS = [
  { title: "Create an account", body: "Sign up with your email and confirm it. No other login method." },
  { title: "Verify your school", body: "Confirm a school email or photograph your school ID. A person reviews ID photos, then the photo is deleted." },
  { title: "Find people nearby", body: "Turn on location sharing to see students near you. It is off until you choose it, and you can stop any time." },
];

// Public page for signed-out visitors, on mobile and web.
export function Landing() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.brand}>BrainCraze</Text>
        <Text style={styles.headline} accessibilityRole="header">
          Meet verified students and teachers near you.
        </Text>
        <Text style={styles.body}>
          BrainCraze connects people at your school. Everyone you see has confirmed their email, and school-verified
          members carry a badge showing they are a real student, faculty member, teaching assistant, staff member or tutor.
        </Text>

        <Text style={styles.section} accessibilityRole="header">
          How it works
        </Text>
        {STEPS.map((step, i) => (
          <View key={step.title} style={styles.step}>
            <Text style={styles.stepNumber}>{i + 1}</Text>
            <View style={styles.stepText}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.body}>{step.body}</Text>
            </View>
          </View>
        ))}

        <Text style={styles.section} accessibilityRole="header">
          Your privacy
        </Text>
        <Text style={styles.body}>
          Location sharing is opt-in and approximate. Your ID photo is used only to verify you and is deleted after review.
        </Text>

        <View style={styles.actions}>
          <Link href="/signup" style={[styles.button, styles.primary]}>
            Sign up
          </Link>
          <Link href="/login" style={[styles.button, styles.secondary]}>
            Log in
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 24, gap: 12, width: "100%", maxWidth: 640, alignSelf: "center" },
  brand: { fontSize: 16, fontWeight: "700", letterSpacing: 1 },
  headline: { fontSize: 32, fontWeight: "800", marginTop: 8 },
  section: { fontSize: 20, fontWeight: "700", marginTop: 20 },
  body: { fontSize: 16, lineHeight: 24 },
  step: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#222", color: "#fff", textAlign: "center", lineHeight: 28, fontWeight: "700", overflow: "hidden" },
  stepText: { flex: 1, gap: 2 },
  stepTitle: { fontSize: 16, fontWeight: "700" },
  actions: { gap: 12, marginTop: 24 },
  button: { padding: 16, borderRadius: 10, textAlign: "center", fontSize: 16, fontWeight: "600", overflow: "hidden" },
  primary: { backgroundColor: "#222", color: "#fff" },
  secondary: { borderWidth: 1, borderColor: "#222", color: "#222" },
});
