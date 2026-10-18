import { useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Link } from "expo-router";
import { useSession } from "../lib/session";
import { loadVerificationProgress } from "../lib/verificationProgress";
export function HumanGate({
  children,
  lockedActions,
}: {
  children: ReactNode;
  lockedActions?: ReactNode;
}) {
  const session = useSession();
  const userId = session.status === "ready" ? session.userId : null;
  return (
    <GateForUser
      key={userId ?? "visitor"}
      userId={userId}
      lockedActions={lockedActions}
    >
      {children}
    </GateForUser>
  );
}
function GateForUser({
  userId,
  children,
  lockedActions,
}: {
  userId: string | null;
  children: ReactNode;
  lockedActions?: ReactNode;
}) {
  const [status, setStatus] = useState<
    "loading" | "locked" | "ready" | "error"
  >("loading");
  useEffect(() => {
    let active = true;
    loadVerificationProgress()
      .then((p) => {
        if (active)
          setStatus(p.emailVerified && p.humanVerified ? "ready" : "locked");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [userId]);
  if (status === "loading")
    return (
      <ActivityIndicator accessibilityLabel="Checking human verification" />
    );
  if (status !== "ready")
    return (
      <View>
        <Text accessibilityRole="alert">
          {status === "error"
            ? "Verification status is unavailable. Access remains locked."
            : "Complete email and human verification before continuing."}
        </Text>
        <Link href="/human-verification">Open human verification</Link>
        {lockedActions}
      </View>
    );
  return children;
}
