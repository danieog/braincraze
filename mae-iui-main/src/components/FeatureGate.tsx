import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { canUse, type Feature } from "../lib/entitlements";

export function FeatureGate({ feature, children }: { feature: Feature; children: ReactNode }) {
  if (canUse(feature)) return <>{children}</>;
  return (
    <View style={styles.locked}>
      <Text style={styles.text}>This feature is locked. Upgrade to use it.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  locked: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  text: { fontSize: 16, textAlign: "center" },
});
