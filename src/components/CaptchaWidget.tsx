import { Text, View } from "react-native";
import { Link } from "expo-router";
import type { CaptchaWidgetProps } from "./CaptchaWidget.types";
// No native WebView bridge or token-in-URL bypass. The same account must complete the web check.
export default function CaptchaWidget(_props: CaptchaWidgetProps) {
  return (
    <View>
      <Text>
        In-app CAPTCHA is not supported on native mobile yet. Open BrainCraze in
        your browser, log in to the same account, and complete human
        verification there. Then return and refresh your status.
      </Text>
      <Link href="https://braincraze.study/human-verification">
        Open web human verification
      </Link>
    </View>
  );
}
