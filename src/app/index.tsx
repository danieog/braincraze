import { VerificationProgress } from "../components/VerificationProgress";
import { Link, type Href } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Landing } from "../components/Landing";
import { logOut } from "../lib/auth";
import { useSession } from "../lib/session";
import {
  verifiedBySchoolEmail,
  type VerificationProgress as SavedProgress,
} from "../lib/verificationProgress";

type Page = { label: string; href: Href };

const SIGNED_IN: Page[] = [
  { label: "Location", href: "/location" },
  { label: "Verify ID", href: "/verify-id" },
  { label: "Admin review", href: "/admin-review" },
];

// Signed-out visitors get the landing page. The root layout shows a spinner until the session is known.
export default function Index() {
  const session = useSession();
  const [logOutFailed, setLogOutFailed] = useState(false);
  const [progress, setProgress] = useState<SavedProgress | null>(null);
  if (session.status !== "ready") return <Landing />;
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.body}>
        <Text style={styles.title}>BrainCraze</Text>
        <VerificationProgress onProgress={setProgress} />
        {(session.emailVerified ? SIGNED_IN : [])
          // School-email users are already verified, so the ID screen is not offered to them.
          .filter((page) => !(page.href === "/verify-id" && verifiedBySchoolEmail(progress)))
          .map((page) => (
          <Link key={page.label} href={page.href} style={styles.button}>
            <Text style={styles.buttonText}>{page.label}</Text>
          </Link>
        ))}
        <Pressable
          accessibilityRole="button"
          onPress={() => logOut().catch(() => setLogOutFailed(true))}
          style={[styles.button, styles.secondary]}
        >
          <Text style={[styles.buttonText, styles.secondaryText]}>Log out</Text>
        </Pressable>
        {logOutFailed ? <Text accessibilityRole="alert">Could not log out. Check your connection and try again.</Text> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { flex: 1, justifyContent: "center", padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 12 },
  button: {
    padding: 16,
    borderRadius: 10,
    backgroundColor: "#222",
    overflow: "hidden",
    textAlign: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600", textAlign: "center" },
  secondary: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#222" },
  secondaryText: { color: "#222" },
});
