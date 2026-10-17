import type { ReactNode } from "react";
import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { canUse, type Feature } from "../lib/entitlements";
import { useSession } from "../lib/session";

export function FeatureGate({ feature, children }: { feature: Feature; children: ReactNode }) {
  const session = useSession();
  const isAnonymous = session.status === "ready" ? session.isAnonymous : false;
  if (canUse(feature, { isAnonymous })) return <>{children}</>;
  return (
    <View style={styles.locked}>
      <Text style={styles.text}>This feature is locked. Sign up or log in to use it.</Text>
      <Link href="/auth" style={styles.link}>
        Sign up or log in
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  locked: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  text: { fontSize: 16, textAlign: "center" },
  link: { fontSize: 16, fontWeight: "600" },
});
