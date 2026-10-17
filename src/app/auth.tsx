import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { logIn, logOut, signUp } from "../lib/auth";
import { errorText } from "../lib/errors";
import { useSession } from "../lib/session";

export default function AuthScreen() {
  const session = useSession();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setMessage(null);
    try {
      if (mode === "signup") {
        await signUp(email.trim(), password);
        setMessage("Check your email and tap the confirmation link to finish signing up.");
      } else {
        await logIn(email.trim(), password);
        router.replace("/location");
      }
    } catch (e) {
      setMessage(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  if (session.status === "ready" && !session.isAnonymous) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Text style={styles.title} accessibilityRole="header">
            Signed in
          </Text>
          <Text>{session.email}</Text>
          <Pressable style={styles.button} onPress={() => router.replace("/location")}>
            <Text style={styles.buttonText}>Continue</Text>
          </Pressable>
          <Pressable onPress={() => logOut().catch((e) => setMessage(errorText(e)))}>
            <Text style={styles.link}>Log out</Text>
          </Pressable>
          {message && <Text>{message}</Text>}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.title} accessibilityRole="header">
          {mode === "signup" ? "Create your account" : "Log in"}
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
          value={password}
          onChangeText={setPassword}
        />
        <Pressable style={styles.button} onPress={submit} disabled={busy || !email || !password}>
          {busy ? <ActivityIndicator /> : <Text style={styles.buttonText}>{mode === "signup" ? "Sign up" : "Log in"}</Text>}
        </Pressable>
        {message && <Text>{message}</Text>}
        <Pressable onPress={() => setMode(mode === "signup" ? "login" : "signup")}>
          <Text style={styles.link}>{mode === "signup" ? "Have an account? Log in" : "New here? Sign up"}</Text>
        </Pressable>
        <Pressable onPress={() => router.replace("/location")}>
          <Text style={styles.link}>Continue without an account</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, justifyContent: "center", padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: "700" },
  input: { borderWidth: 1, borderColor: "#999", borderRadius: 8, padding: 12, fontSize: 16 },
  button: { backgroundColor: "#222", borderRadius: 8, padding: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  link: { fontSize: 15, textAlign: "center", textDecorationLine: "underline" },
});
