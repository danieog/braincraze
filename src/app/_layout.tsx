import { Stack } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { SessionProvider, useSession } from "../lib/session";

export default function RootLayout() {
  return (
    <SessionProvider>
      <Routes />
    </SessionProvider>
  );
}

// Signed-out visitors can reach the landing page (index), sign up and log in. Everything else needs an email session.
function Routes() {
  const session = useSession();
  if (session.status === "loading" || session.status === "error") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
        {session.status === "loading" ? <ActivityIndicator /> : <Text>{session.message}</Text>}
      </View>
    );
  }
  const signedIn = session.status === "ready";
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="signup" />
        <Stack.Screen name="login" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="location" />
        <Stack.Screen name="verify-id" />
        <Stack.Screen name="admin-review" />
      </Stack.Protected>
    </Stack>
  );
}
