import { VerificationProgress } from "../components/VerificationProgress";
import { Link, type Href } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Landing } from "../components/Landing";
import { useSession } from "../lib/session";

type Page = { label: string; href: Href };

const SIGNED_IN: Page[] = [
  { label: "Location", href: "/location" },
  { label: "Verify ID", href: "/verify-id" },
  { label: "Admin review", href: "/admin-review" },
];

// Signed-out visitors get the landing page. The root layout shows a spinner until the session is known.
export default function Index() {
  const session = useSession();
  if (session.status !== "ready") return <Landing />;
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.body}>
        <Text style={styles.title}>BrainCraze</Text>
        <VerificationProgress />
        {(session.emailVerified ? SIGNED_IN : []).map((page) => (
          <Link key={page.label} href={page.href} style={styles.button}>
            <Text style={styles.buttonText}>{page.label}</Text>
          </Link>
        ))}
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
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
