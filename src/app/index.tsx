import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useSession } from "../lib/session";

// Anonymous users are sent to sign up or log in; the auth screen lets them continue without an account.
export default function Index() {
  const session = useSession();
  if (session.status === "loading") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }
  if (session.status === "ready" && session.isAnonymous) return <Redirect href="/auth" />;
  return <Redirect href="/location" />;
}
