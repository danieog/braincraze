import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { errorText } from "../lib/errors";
import { decide, fetchQueue, imageUrl, requestReupload, type QueueItem } from "../lib/idVerification";

export default function AdminReviewScreen() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchQueue()
      .then(async (queue) => {
        const entries = await Promise.all(
          queue.filter((q) => q.id_path).map(async (q) => [q.request_id, await imageUrl(q.id_path!)] as const),
        );
        if (cancelled) return;
        setItems(queue);
        setUrls(Object.fromEntries(entries));
      })
      .catch((e) => !cancelled && setMessage(errorText(e)))
      .finally(() => !cancelled && setBusy(false));
    return () => {
      cancelled = true;
    };
  }, [tick]);

  async function act(run: () => Promise<void>) {
    setMessage(null);
    setBusy(true);
    try {
      await run();
    } catch (e) {
      setMessage(errorText(e));
    }
    setTick((t) => t + 1);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title} accessibilityRole="header">
          ID review
        </Text>
        <Text style={styles.body}>
          The automatic check is only a hint. Nothing is rejected without a person deciding. The photo is deleted when
          you record a decision.
        </Text>
        {busy && <ActivityIndicator accessibilityLabel="Loading" />}
        {message && <Text style={styles.message}>{message}</Text>}
        {!busy && items.length === 0 && !message && <Text style={styles.body}>Nothing waiting for review.</Text>}
        {items.map((q) => (
          <View key={q.request_id} style={styles.card}>
            <Text style={styles.name}>
              {q.display_name ?? "Unnamed"} · {q.role.replace("_", " ")} · {q.school_name}
            </Text>
            <Text style={styles.body}>{q.school_email}</Text>
            <Text style={styles.body}>
              Auto check: {q.id_check_result ?? "not run yet"}
              {q.id_check_reason ? ` (${q.id_check_reason})` : ""}
            </Text>
            {q.id_check_checks &&
              Object.entries(q.id_check_checks).map(([k, v]) => (
                <Text key={k} style={styles.check}>
                  {v ? "✓" : "✗"} {k.replace(/_/g, " ")}
                </Text>
              ))}
            {urls[q.request_id] && (
              <Image source={{ uri: urls[q.request_id] }} style={styles.image} resizeMode="contain" accessibilityLabel="ID photo" />
            )}
            <View style={styles.row}>
              <Action label="Approve" onPress={() => act(() => decide(q.request_id, "approved"))} />
              <Action label="Reject" onPress={() => act(() => decide(q.request_id, "rejected"))} />
              <Action label="Ask to re-upload" onPress={() => act(() => requestReupload(q.request_id))} />
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function Action({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.button}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFF8F0" },
  content: { padding: 20, gap: 12, maxWidth: 640, width: "100%", alignSelf: "center" },
  title: { fontSize: 26, fontWeight: "700", color: "#3B2F5C" },
  body: { fontSize: 15, lineHeight: 21, color: "#4A4458" },
  card: { backgroundColor: "#F3EEFF", borderRadius: 20, padding: 16, gap: 6 },
  name: { fontSize: 17, fontWeight: "600", color: "#2B2340" },
  check: { fontSize: 14, color: "#4A4458" },
  image: { width: "100%", aspectRatio: 1.6, backgroundColor: "#FFFFFF", borderRadius: 12 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  button: { minHeight: 44, borderRadius: 14, backgroundColor: "#6B4FBB", justifyContent: "center", paddingHorizontal: 14 },
  buttonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  message: { fontSize: 15, color: "#8A3B12" },
});
