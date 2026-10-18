import { HumanGate } from "../components/HumanGate";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FeatureGate } from "../components/FeatureGate";
import {
  fetchNearby,
  getOrCreateProfile,
  openAppSettings,
  saveDisplayName,
  startSharing,
  stopSharing,
  type NearbyUser,
  type Profile,
} from "../lib/location";
import { errorText } from "../lib/errors";
import { useSession } from "../lib/session";

// The profile is always loaded before any button that patches it can be pressed.
/* istanbul ignore next */
const patch = (changes: Partial<Profile>) => (p: Profile | null) =>
  p ? { ...p, ...changes } : p;

export default function LocationScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <HumanGate lockedActions={<StopSharingWhileLocked />}>
        <FeatureGate feature="nearby">
          <LocationContent />
        </FeatureGate>
      </HumanGate>
    </SafeAreaView>
  );
}

function StopSharingWhileLocked() {
  const [notice, setNotice] = useState("");
  async function stop() {
    try {
      await stopSharing();
      setNotice("Location sharing stopped.");
    } catch {
      setNotice("Unable to stop sharing. Retry or contact the team.");
    }
  }
  return (
    <View>
      <Pressable accessibilityRole="button" onPress={stop}>
        <Text>Stop location sharing</Text>
      </Pressable>
      <Text accessibilityLiveRegion="polite">{notice}</Text>
    </View>
  );
}

function LocationContent() {
  const session = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [nearby, setNearby] = useState<NearbyUser[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);

  const sharing = profile?.share_location ?? false;

  const refresh = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      const result = await startSharing();
      if (!result.ok) {
        setBlocked(result.reason === "blocked");
        setMessage(result.message);
        setProfile(patch({ share_location: false }));
        return;
      }
      setBlocked(false);
      setProfile(patch({ share_location: true }));
      setNearby(await fetchNearby());
    } catch (e: any) {
      setMessage(errorText(e));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (session.status !== "ready") return;
    let cancelled = false;
    getOrCreateProfile(session.userId)
      .then((p) => {
        if (cancelled) return;
        setProfile(p);
        setName(p.display_name);
        if (p.share_location) refresh();
      })
      .catch((e) => !cancelled && setMessage(errorText(e)));
    return () => {
      cancelled = true;
    };
  }, [session, refresh]);

  async function turnOff() {
    setBusy(true);
    setMessage(null);
    try {
      await stopSharing();
      setProfile(patch({ share_location: false }));
      setNearby([]);
    } catch (e: any) {
      setMessage(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  async function saveName() {
    if (session.status !== "ready" || !name.trim()) return;
    try {
      await saveDisplayName(session.userId, name);
      setProfile(patch({ display_name: name.trim() }));
      setMessage("Name saved.");
    } catch (e: any) {
      setMessage(errorText(e));
    }
  }

  if (session.status === "loading") {
    return (
      <View style={styles.center}>
        <ActivityIndicator accessibilityLabel="Loading" />
      </View>
    );
  }
  if (session.status === "error") {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.body}>{session.message}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title} accessibilityRole="header">
        Students near you
      </Text>
      <Text style={styles.body}>
        Share your approximate location to see other BrainCraze students within
        25 miles. Your position is rounded to about 1 km, other people never see
        it (only your name and a rough distance), and it is deleted when you
        turn this off. It is off until you choose to turn it on.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Your display name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          maxLength={24}
          accessibilityLabel="Your display name"
        />
        <Button
          label="Save name"
          onPress={saveName}
          variant="light"
          disabled={!name.trim()}
        />
      </View>

      {!sharing ? (
        <Button
          label="Turn on nearby"
          onPress={refresh}
          disabled={busy || !profile}
        />
      ) : (
        <View style={styles.row}>
          <Button
            label="Refresh"
            onPress={refresh}
            disabled={busy}
            variant="light"
          />
          <Button
            label="Turn off"
            onPress={turnOff}
            disabled={busy}
            variant="light"
          />
        </View>
      )}

      {busy && (
        <ActivityIndicator
          accessibilityLabel="Working"
          style={styles.spinner}
        />
      )}
      {message && (
        <Text style={styles.message} accessibilityLiveRegion="polite">
          {message}
        </Text>
      )}
      {blocked && (
        <Button
          label="Open settings"
          onPress={openAppSettings}
          variant="light"
        />
      )}

      {sharing && (
        <View style={styles.card}>
          <Text style={styles.label}>Nearby right now</Text>
          {nearby.length === 0 ? (
            <Text style={styles.body}>
              No one nearby yet. Ask a friend to turn this on too.
            </Text>
          ) : (
            nearby.map((u, i) => (
              <View key={`${u.display_name}-${i}`} style={styles.person}>
                <Text style={styles.personName}>{u.display_name}</Text>
                <Text style={styles.body}>{u.distance_bucket}</Text>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

function Button({
  label,
  onPress,
  disabled,
  variant = "primary",
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "light";
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        variant === "light" && styles.buttonLight,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          variant === "light" && styles.buttonTextLight,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFF8F0" },
  content: {
    padding: 20,
    gap: 14,
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 8,
  },
  title: { fontSize: 26, fontWeight: "700", color: "#3B2F5C" },
  body: { fontSize: 16, lineHeight: 22, color: "#4A4458" },
  label: { fontSize: 14, fontWeight: "600", color: "#3B2F5C" },
  card: { backgroundColor: "#F3EEFF", borderRadius: 20, padding: 16, gap: 10 },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 48,
    fontSize: 16,
    color: "#2B2340",
  },
  row: { flexDirection: "row", gap: 10 },
  button: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: "#6B4FBB",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  buttonLight: { backgroundColor: "#E3D9FF" },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  buttonTextLight: { color: "#3B2F5C" },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.5 },
  spinner: { marginTop: 4 },
  message: { fontSize: 15, color: "#8A3B12" },
  person: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 12 },
  personName: { fontSize: 17, fontWeight: "600", color: "#2B2340" },
});
