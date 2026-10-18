import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Link } from "expo-router";
import { useSession } from "../lib/session";
import {
  loadVerificationProgress,
  progressSteps,
  type VerificationProgress as Progress,
} from "../lib/verificationProgress";
import { errorText } from "../lib/errors";
import { onboardingCopy as copy } from "../content/onboarding";

type Props = {
  revision?: number;
  onProgress?: (progress: Progress | null) => void;
};
export function VerificationProgress(props: Props) {
  const session = useSession();
  const userId = session.status === "ready" ? session.userId : null;
  return (
    <ProgressForUser key={userId ?? "visitor"} userId={userId} {...props} />
  );
}
function ProgressForUser({
  userId,
  revision = 0,
  onProgress,
}: Props & { userId: string | null }) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [busy, setBusy] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    if (!userId) return;
    let active = true;
    loadVerificationProgress()
      .then((saved) => {
        if (!active) return;
        setProgress(saved);
        setError(null);
        setBusy(false);
        onProgress?.(saved);
      })
      .catch((e) => {
        if (!active) return;
        setProgress(null);
        setError(errorText(e));
        setBusy(false);
        onProgress?.(null);
      });
    return () => {
      active = false;
    };
  }, [userId, revision, reload, onProgress]);
  function refresh() {
    setBusy(true);
    setProgress(null);
    setError(null);
    onProgress?.(null);
    setReload((n) => n + 1);
  }
  const status = progress?.reviewStatus;
  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.heading}>
        {copy.title}
      </Text>
      {busy ? (
        <ActivityIndicator accessibilityLabel="Loading verification progress" />
      ) : error ? (
        <Text accessibilityRole="alert">{error}</Text>
      ) : (
        progressSteps(progress, Boolean(userId)).map((step) => (
          <View key={step.key} style={styles.step}>
            <Text>
              {copy.steps[step.key]} — {copy.states[step.state]}
            </Text>
            {(step.state === "current" || step.state === "optional") &&
              step.key !== "review" && (
              <Link
                href={
                  step.key === "account"
                    ? "/signup"
                    : step.key === "human"
                      ? "/human-verification"
                      : "/verify-id"
                }
              >
                Continue
              </Link>
            )}
          </View>
        ))
      )}
      {userId && (
        <Pressable accessibilityRole="button" disabled={busy} onPress={refresh}>
          <Text>Refresh verification progress</Text>
        </Pressable>
      )}
      {["queued", "processing", "manual_review"].includes(status ?? "") && (
        <Text>{copy.pending}</Text>
      )}
      {status === "rejected" && <Text>{copy.rejected}</Text>}
      {status === "needs_reupload" && <Text>{copy.reupload}</Text>}
      <Text style={styles.note}>{copy.notice}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    borderColor: "#D9D0E8",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 10,
    width: "100%",
  },
  heading: { fontSize: 17, fontWeight: "600" },
  step: { gap: 4 },
  note: { fontSize: 13, lineHeight: 19, color: "#4A4458" },
});
