import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { resendConfirmation } from "../lib/auth";
import { useSession } from "../lib/session";
import { errorText } from "../lib/errors";

export default function VerifyEmailScreen() {
  const session = useSession();
  const [email, setEmail] = useState(
    session.status === "ready" ? (session.email ?? "") : "",
  );
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  async function resend() {
    if (submitting.current || cooldown) return;
    setError(null);
    setMessage(null);
    if (
      email.trim().length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      setError("Enter a valid email address.");
      return;
    }
    submitting.current = true;
    setBusy(true);
    try {
      await resendConfirmation(email);
      setMessage(
        "If this address can be confirmed, a new confirmation email has been requested. Check your inbox, then log in.",
      );
      setCooldown(60);
    } catch (e) {
      setError(errorText(e));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text accessibilityRole="header" style={styles.title}>
          Verify your email
        </Text>
        <Text>
          Open the BrainCraze confirmation email and follow its link. Then
          return here and log in. This screen cannot approve an email address or
          an ID.
        </Text>
        <TextInput
          accessibilityLabel="Email"
          placeholder="Email"
          autoComplete="email"
          autoCapitalize="none"
          keyboardType="email-address"
          maxLength={254}
          value={email}
          onChangeText={setEmail}
          editable={!busy}
          style={styles.input}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Resend confirmation email"
          disabled={busy || Boolean(cooldown)}
          onPress={resend}
        >
          <Text>
            {busy
              ? "Requesting email…"
              : cooldown
                ? `Resend available in ${cooldown}s`
                : "Resend confirmation email"}
          </Text>
        </Pressable>
        {error && <Text accessibilityRole="alert">{error}</Text>}
        {message && <Text accessibilityLiveRegion="polite">{message}</Text>}
        <Link href="/login">Log in after confirming</Link>
        <Link href="/">Back to BrainCraze</Link>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    padding: 24,
    gap: 16,
    maxWidth: 480,
    width: "100%",
    alignSelf: "center",
  },
  title: { fontSize: 24, fontWeight: "700" },
  input: { padding: 12, borderWidth: 1, borderColor: "#777", borderRadius: 8 },
});
