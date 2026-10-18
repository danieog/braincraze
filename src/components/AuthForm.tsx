import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { logIn, signUp } from "../lib/auth";
import { errorText } from "../lib/errors";
import { passwordStrength, signupError } from "../lib/registration";
import { VerificationProgress } from "./VerificationProgress";

export function AuthForm({ mode }: { mode: "signup" | "login" }) {
  const isSignup = mode === "signup";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (submitting.current) return;
    setError(null);
    setMessage(null);
    const invalid = isSignup
      ? signupError(email, password, confirmation)
      : !email.trim() || !password
        ? "Enter your email and password."
        : null;
    if (invalid) {
      setError(invalid);
      return;
    }
    submitting.current = true;
    setBusy(true);
    try {
      if (isSignup) {
        const signedIn = await signUp(email.trim(), password);
        setPassword("");
        setConfirmation("");
        // When signedIn is true the session listener moves the user into the app; there is nothing to show.
        if (!signedIn)
          setMessage(
            "Your account was created, but email confirmation is still switched on for this project. Check your email and tap the confirmation link, then log in.",
          );
      } else {
        await logIn(email.trim(), password);
      }
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
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <Link href="/" style={styles.link}>
          Back
        </Link>
        <Text style={styles.title} accessibilityRole="header">
          {isSignup ? "Create your account" : "Log in"}
        </Text>
        {isSignup && <VerificationProgress />}
        {isSignup && (
          <Text>
            Verification is optional. You can join now and verify your school
            later with a school ID.
          </Text>
        )}
        <Text>Email</Text>
        <TextInput
          style={styles.input}
          accessibilityLabel="Email"
          placeholder="Email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          maxLength={254}
          editable={!busy}
          value={email}
          onChangeText={setEmail}
        />
        <Text>Password</Text>
        <TextInput
          style={styles.input}
          accessibilityLabel="Password"
          placeholder="Password"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoComplete={isSignup ? "new-password" : "current-password"}
          editable={!busy}
          maxLength={128}
          value={password}
          onChangeText={setPassword}
        />
        {isSignup && (
          <>
            <Text accessibilityLiveRegion="polite">
              {passwordStrength(password)}
            </Text>
            <Text>Confirm password</Text>
            <TextInput
              style={styles.input}
              accessibilityLabel="Confirm password"
              placeholder="Confirm password"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="new-password"
              editable={!busy}
              maxLength={128}
              value={confirmation}
              onChangeText={setConfirmation}
            />
          </>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={showPassword ? "Hide password" : "Show password"}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Text>{showPassword ? "Hide password" : "Show password"}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isSignup ? "Sign up" : "Log in"}
          style={styles.button}
          onPress={submit}
          disabled={busy || !email || !password || (isSignup && !confirmation)}
          accessibilityState={{
            disabled:
              busy || !email || !password || (isSignup && !confirmation),
          }}
        >
          {busy ? (
            <ActivityIndicator accessibilityLabel="Submitting" />
          ) : (
            <Text style={styles.buttonText}>
              {isSignup ? "Sign up" : "Log in"}
            </Text>
          )}
        </Pressable>
        {error && <Text accessibilityRole="alert">{error}</Text>}
        {message && <Text accessibilityLiveRegion="polite">{message}</Text>}
        <Link href={isSignup ? "/login" : "/signup"} style={styles.link}>
          {isSignup ? "Have an account? Log in" : "New here? Sign up"}
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    gap: 12,
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
  },
  title: { fontSize: 24, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderColor: "#777",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#222",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  link: { fontSize: 15, textAlign: "center", textDecorationLine: "underline" },
});
