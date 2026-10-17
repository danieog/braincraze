import * as Location from "expo-location";
import { Linking, Platform } from "react-native";
import { supabase } from "./supabase";

export type Profile = { id: string; display_name: string; share_location: boolean };
export type NearbyUser = { display_name: string; distance_bucket: string };

export type ShareResult =
  | { ok: true }
  | { ok: false; reason: "denied" | "blocked" | "unavailable" | "error"; message: string };

const ADJECTIVES = ["Sleepy", "Curious", "Brave", "Cozy", "Sunny", "Gentle", "Clever"];

function randomName() {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  return `${adjective} Possum ${Math.floor(10 + Math.random() * 90)}`;
}

export async function getOrCreateProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, share_location")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (data) return data;

  const created = { id: userId, display_name: randomName(), share_location: false };
  const { error: insertError } = await supabase.from("profiles").insert(created);
  if (insertError) throw insertError;
  return created;
}

export async function saveDisplayName(userId: string, name: string) {
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: name.trim() })
    .eq("id", userId);
  if (error) throw error;
}

// Asks for permission if needed, reads the position, and uploads it (the server rounds it to ~1 km).
export async function startSharing(): Promise<ShareResult> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== "granted") {
      return permission.canAskAgain
        ? { ok: false, reason: "denied", message: "Location permission was not granted." }
        : {
            ok: false,
            reason: "blocked",
            message:
              Platform.OS === "web"
                ? "Location is blocked for this site. Allow it in your browser's site settings, then reload."
                : "Location is turned off for BrainCraze. Open Settings to allow it.",
          };
    }
    if (!(await Location.hasServicesEnabledAsync())) {
      return { ok: false, reason: "unavailable", message: "Location services are turned off on this device." };
    }
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const { error } = await supabase.rpc("set_location", {
      p_lat: position.coords.latitude,
      p_lng: position.coords.longitude,
    });
    if (error) return { ok: false, reason: "error", message: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: "error", message: String(e?.message ?? e) };
  }
}

export async function stopSharing() {
  const { error } = await supabase.rpc("stop_sharing");
  if (error) throw error;
}

export async function fetchNearby(): Promise<NearbyUser[]> {
  const { data, error } = await supabase.rpc("nearby_users", { radius_m: 40234 });
  if (error) throw error;
  return (data ?? []) as NearbyUser[];
}

export function openAppSettings() {
  if (Platform.OS !== "web") Linking.openSettings();
}
