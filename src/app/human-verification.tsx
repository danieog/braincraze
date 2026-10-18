import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import CaptchaWidget from "../components/CaptchaWidget";
import { loadVerificationProgress } from "../lib/verificationProgress";
import {
  startHumanVerification,
  submitHumanVerification,
  type CaptchaChallenge,
} from "../lib/humanVerification";
import { errorText } from "../lib/errors";
export default function HumanVerificationScreen() {
  const [challenge, setChallenge] = useState<CaptchaChallenge | null>(null);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [restart, setRestart] = useState(0);
  const submitting = useRef(false);
  useEffect(() => {
    let active = true;
    loadVerificationProgress()
      .then(async (progress) => {
        if (!active) return;
        if (progress.humanVerified && progress.emailVerified) {
          setVerified(true);
          setBusy(false);
          return;
        }
        if (!progress.emailVerified)
          throw new Error("Confirm your email first.");
        const next = await startHumanVerification();
        if (active) {
          setChallenge(next);
          setBusy(false);
        }
      })
      .catch((e) => {
        if (active) {
          setError(errorText(e));
          setBusy(false);
        }
      });
    return () => {
      active = false;
    };
  }, [restart]);
  const receiveToken = useCallback((value: string) => {
    setToken(value);
    setError("");
  }, []);
  const expired = useCallback(() => {
    setToken("");
    setError("The CAPTCHA expired. Start a new check.");
  }, []);
  const widgetError = useCallback(() => {
    setToken("");
    setError(
      "The CAPTCHA could not load or failed. Check your connection and start a new check.",
    );
  }, []);
  async function submit() {
    if (!challenge || !token || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      await submitHumanVerification(challenge.challengeId, token);
      const saved = await loadVerificationProgress();
      if (!saved.emailVerified || !saved.humanVerified)
        throw new Error("Verification was not saved. Retry status checking.");
      setVerified(true);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setToken("");
      setBusy(false);
      submitting.current = false;
    }
  }
  function retry() {
    setChallenge(null);
    setToken("");
    setError("");
    setBusy(true);
    setRestart((n) => n + 1);
  }
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={styles.title}>
          Verify you are human
        </Text>
        <Text>
          Email ownership and human verification are separate. Continue only
          after the server confirms the CAPTCHA.
        </Text>
        {busy && (
          <ActivityIndicator accessibilityLabel="Checking verification" />
        )}
        {verified ? (
          <>
            <Text accessibilityLiveRegion="polite">
              Human verification completed.
            </Text>
            <Link href="/verify-id">Continue to school ID verification</Link>
          </>
        ) : (
          <>
            {challenge && (
              <CaptchaWidget
                challenge={challenge}
                onToken={receiveToken}
                onExpired={expired}
                onError={widgetError}
              />
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Verify and continue"
              disabled={busy || !token}
              onPress={submit}
            >
              <Text>Verify and continue</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={retry}
            >
              <Text>Start a new check or refresh status</Text>
            </Pressable>
          </>
        )}
        {error && <Text accessibilityRole="alert">{error}</Text>}
        <Link href="/">Back to BrainCraze</Link>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    padding: 24,
    gap: 18,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
  },
  title: { fontSize: 26, fontWeight: "700" },
});
