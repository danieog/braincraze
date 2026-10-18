import { HumanGate } from "../components/HumanGate";
import type { VerificationProgress as SavedProgress } from "../lib/verificationProgress";
import { VerificationProgress } from "../components/VerificationProgress";
import { onboardingCopy } from "../content/onboarding";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { FeatureGate } from "../components/FeatureGate";
import { errorText } from "../lib/errors";
import {
  listSchools,
  ROLES,
  submitId,
  type Role,
  type School,
} from "../lib/idVerification";
import { useSession } from "../lib/session";

export default function VerifyIdScreen() {
  const session = useSession();
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [role, setRole] = useState<Role>("student");
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [savedProgress, setSavedProgress] = useState<SavedProgress | null>(
    null,
  );
  const pending = ["queued", "processing", "manual_review"].includes(
    savedProgress?.reviewStatus ?? "",
  );
  const approved =
    savedProgress?.schoolVerified && savedProgress.reviewStatus === "approved";

  useEffect(() => {
    listSchools()
      .then(setSchools)
      .catch((e) => setMessage(errorText(e)));
  }, []);

  async function pick(camera: boolean) {
    setMessage(null);
    const permission = camera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setMessage("Permission was not granted.");
      return;
    }
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ["images"],
      quality: 0.8,
    };
    const result = camera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
    if (!result.canceled) setImage(result.assets[0]);
  }

  async function submit() {
    if (session.status !== "ready" || !schoolId || !image) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await submitId({
        userId: session.userId,
        role,
        schoolId,
        image,
      });
      if (result.checkInvocationFailed)
        setMessage(
          "Your upload was saved for review, but the automated-check request failed. An administrator must review your ID; do not upload a duplicate.",
        );
      setDone(true);
    } catch (e) {
      setMessage(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <HumanGate>
        <FeatureGate feature="verify-id">
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title} accessibilityRole="header">
              Verify your school ID
            </Text>
            <VerificationProgress
              revision={done ? 1 : 0}
              onProgress={setSavedProgress}
            />
            {done || pending || approved ? (
              <Text style={styles.body}>
                {approved
                  ? "Your school affiliation has been approved."
                  : onboardingCopy.pending}{" "}
                {onboardingCopy.privacy}
              </Text>
            ) : (
              <>
                <Text style={styles.body}>
                  Upload a clear photo of your whole school ID. A person reviews
                  every submission, and the photo is deleted after their
                  decision when storage cleanup succeeds.
                </Text>
                <Text style={styles.label}>School</Text>
                <View style={styles.row}>
                  {schools.map((s) => (
                    <Chip
                      key={s.id}
                      label={s.name}
                      selected={schoolId === s.id}
                      onPress={() => setSchoolId(s.id)}
                    />
                  ))}
                </View>
                <Text style={styles.label}>I am a</Text>
                <View style={styles.row}>
                  {ROLES.map((r) => (
                    <Chip
                      key={r}
                      label={r.replace("_", " ")}
                      selected={role === r}
                      onPress={() => setRole(r)}
                    />
                  ))}
                </View>
                <Text style={styles.label}>School email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  accessibilityLabel="School email"
                />
                <View style={styles.row}>
                  <Chip
                    label="Take photo"
                    selected={false}
                    onPress={() => pick(true)}
                  />
                  <Chip
                    label="Choose photo"
                    selected={false}
                    onPress={() => pick(false)}
                  />
                </View>
                {image && (
                  <Image
                    source={{ uri: image.uri }}
                    style={styles.preview}
                    accessibilityLabel="ID preview"
                  />
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Submit for review"
                  disabled={busy || !schoolId || !image || !email}
                  onPress={submit}
                  style={[
                    styles.button,
                    (busy || !schoolId || !image || !email) && styles.disabled,
                  ]}
                >
                  <Text style={styles.buttonText}>Submit for review</Text>
                </Pressable>
                {busy && <ActivityIndicator accessibilityLabel="Working" />}
              </>
            )}
            {message && <Text style={styles.message}>{message}</Text>}
          </ScrollView>
        </FeatureGate>
      </HumanGate>
    </SafeAreaView>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFF8F0" },
  content: {
    padding: 20,
    gap: 12,
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
  },
  title: { fontSize: 26, fontWeight: "700", color: "#3B2F5C" },
  body: { fontSize: 16, lineHeight: 22, color: "#4A4458" },
  label: { fontSize: 14, fontWeight: "600", color: "#3B2F5C" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 48,
    fontSize: 16,
  },
  chip: {
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: "#E3D9FF",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  chipSelected: { backgroundColor: "#6B4FBB" },
  chipText: { color: "#3B2F5C", fontSize: 15, fontWeight: "600" },
  chipTextSelected: { color: "#FFFFFF" },
  preview: { width: "100%", aspectRatio: 1.6, borderRadius: 12 },
  button: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: "#6B4FBB",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  disabled: { opacity: 0.5 },
  message: { fontSize: 15, color: "#8A3B12" },
});
