import { Redirect } from "expo-router";
import { Text, View, StyleSheet } from "react-native";

// For now the app opens straight onto location services.
// To bring the home screen back, delete this default export and rename Home to Index.
export default function Index() {
  return <Redirect href="/location" />;
}

export function Home() {
  return (
    <View style={styles.container}>
      <Text>Edit src/app/index.tsx to edit this screen.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
