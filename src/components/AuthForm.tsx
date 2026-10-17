import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { logIn, signUp } from "../lib/auth";
import { errorText } from "../lib/errors";

// Shared by the sign up and log in pages. Both use email and password only.
export function AuthForm({ mode }: { mode: "signup" | "login" }) {
  const isSignup = mode === "signup";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setMessage(null);
    try {
      if (isSignup) {
        await signUp(email.trim(), password);
        setMessage("Check your email and tap the confirmation link to finish signing up. Then log in.");
      } else {
        await logIn(email.trim(), password);
      }
    } catch (e) {
      setMessage(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Link href="/" style={styles.link}>
          Back
        </Link>
        <Text style={styles.title} accessibilityRole="header">
          {isSignup ? "Create your account" : "Log in"}
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          autoCapitalize="none"
          autoComplete={isSignup ? "new-password" : "current-password"}
          value={password}
          onChangeText={setPassword}
        />
        <Pressable style={styles.button} onPress={submit} disabled={busy || !email || !password}>
          {busy ? <ActivityIndicator /> : <Text style={styles.buttonText}>{isSignup ? "Sign up" : "Log in"}</Text>}
        </Pressable>
        {message && <Text>{message}</Text>}
        <Link href={isSignup ? "/login" : "/signup"} style={styles.link}>
          {isSignup ? "Have an account? Log in" : "New here? Sign up"}
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, justifyContent: "center", padding: 24, gap: 12, width: "100%", maxWidth: 440, alignSelf: "center" },
  title: { fontSize: 24, fontWeight: "700" },
  input: { borderWidth: 1, borderColor: "#999", borderRadius: 8, padding: 12, fontSize: 16 },
  button: { backgroundColor: "#222", borderRadius: 8, padding: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  link: { fontSize: 15, textAlign: "center", textDecorationLine: "underline" },
});
