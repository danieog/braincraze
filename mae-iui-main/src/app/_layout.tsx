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

// Signed-out visitors can reach the landing page (index), sign up and log in. Any signed-in account can use the app:
// email, CAPTCHA and school ID verification are optional and only add trust and a badge.
function Routes() {
  const session = useSession();
  if (session.status === "loading" || session.status === "error") {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        {session.status === "loading" ? (
          <ActivityIndicator />
        ) : (
          <Text>{session.message}</Text>
        )}
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
        <Stack.Screen name="human-verification" />
        <Stack.Screen name="location" />
        <Stack.Screen name="verify-id" />
        <Stack.Screen name="admin-review" />
      </Stack.Protected>
    </Stack>
  );
}
