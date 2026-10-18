import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { logIn, signUp } from "../lib/auth";
import { errorText } from "../lib/errors";
import { passwordStrength, signupError } from "../lib/registration";
import { VerificationProgress } from "./VerificationProgress";

// Layout, colors and copy from the mae-iui-main AuthScreen.
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
  const disabled = busy || !email || !password || (isSignup && !confirmation);

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
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <Link href="/" style={styles.back}>
          ← Back to BrainCraze
        </Link>

        <View style={styles.card}>
          <View>
            <Text style={styles.title} accessibilityRole="header">
              {isSignup ? "Create your account" : "Log in"}
            </Text>
            <Text style={styles.subtitle}>
              {isSignup
                ? "Verification is optional. You can join now and verify your school later with a school ID."
                : "Welcome back! Enter your account details to access BrainCraze."}
            </Text>
          </View>

          {isSignup && <VerificationProgress />}

          <View style={styles.form}>
            <View>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                accessibilityLabel="Email"
                placeholder="name@school.edu or personal email"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                maxLength={254}
                editable={!busy}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View>
              <Text style={styles.label}>Password</Text>
              <View>
                <TextInput
                  style={[styles.input, styles.inputWithToggle]}
                  accessibilityLabel="Password"
                  placeholder={isSignup ? "Password (min 12 characters)" : "Password"}
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  editable={!busy}
                  maxLength={128}
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.toggle}
                  hitSlop={8}
                >
                  <Text style={styles.toggleText}>{showPassword ? "Hide" : "Show"}</Text>
                </Pressable>
              </View>
              {isSignup && !!password && (
                <Text style={styles.strength} accessibilityLiveRegion="polite">
                  {passwordStrength(password)}
                </Text>
              )}
            </View>

            {isSignup && (
              <View>
                <Text style={styles.label}>Confirm password</Text>
                <TextInput
                  style={styles.input}
                  accessibilityLabel="Confirm password"
                  placeholder="Repeat your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="new-password"
                  editable={!busy}
                  maxLength={128}
                  value={confirmation}
                  onChangeText={setConfirmation}
                />
              </View>
            )}

            {error && (
              <View style={[styles.notice, styles.errorBox]}>
                <Text style={styles.errorText} accessibilityRole="alert">
                  {error}
                </Text>
              </View>
            )}
            {message && (
              <View style={[styles.notice, styles.messageBox]}>
                <Text style={styles.messageText} accessibilityLiveRegion="polite">
                  {message}
                </Text>
              </View>
            )}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isSignup ? "Sign up" : "Log in"}
              style={({ pressed }) => [styles.submit, pressed && styles.pressed, disabled && styles.disabled]}
              onPress={submit}
              disabled={disabled}
              accessibilityState={{ disabled }}
            >
              {busy ? (
                <View style={styles.busyRow}>
                  <ActivityIndicator color="#FFFFFF" accessibilityLabel="Submitting" />
                  <Text style={styles.submitText}>Submitting...</Text>
                </View>
              ) : (
                <Text style={styles.submitText}>{isSignup ? "Sign up" : "Log in"}</Text>
              )}
            </Pressable>
          </View>

          <Link href={isSignup ? "/login" : "/signup"} style={styles.switch}>
            {isSignup ? "Already have an account? Log in" : "New to BrainCraze? Sign up"}
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFF8F0" },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 32,
    width: "100%",
    maxWidth: 448,
    alignSelf: "center",
  },
  back: { color: "#4A4458", fontSize: 14, fontWeight: "600", marginBottom: 24 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E3D9FF",
    padding: 24,
    gap: 24,
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  title: { color: "#3B2F5C", fontSize: 24, fontWeight: "700" },
  subtitle: { color: "#4A4458", fontSize: 14, lineHeight: 20, marginTop: 4 },
  form: { gap: 16 },
  label: { color: "#3B2F5C", fontSize: 12, fontWeight: "600", marginBottom: 4 },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D9D0E8",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    fontSize: 14,
    color: "#2B2340",
  },
  inputWithToggle: { paddingRight: 60 },
  toggle: { position: "absolute", right: 12, top: 0, bottom: 0, justifyContent: "center" },
  toggleText: { color: "#6B4FBB", fontSize: 12, fontWeight: "700" },
  strength: { color: "#6B4FBB", fontSize: 11, fontWeight: "500", marginTop: 4 },
  notice: { padding: 12, borderRadius: 12, borderWidth: 1 },
  errorBox: { backgroundColor: "#FFF1F2", borderColor: "#FECDD3" },
  errorText: { color: "#9F1239", fontSize: 12, lineHeight: 17 },
  messageBox: { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
  messageText: { color: "#065F46", fontSize: 12, lineHeight: 17 },
  submit: {
    backgroundColor: "#222222",
    borderRadius: 12,
    minHeight: 46,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  busyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  pressed: { backgroundColor: "#333333" },
  disabled: { opacity: 0.5 },
  switch: { color: "#6B4FBB", fontSize: 12, fontWeight: "600", textAlign: "center" },
});
