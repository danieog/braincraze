import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { canUse } from "../lib/entitlements";
import { FeatureGate } from "../components/FeatureGate";

it("allows nearby for everyone", () => expect(canUse("nearby")).toBe(true));

it("renders children when allowed", async () => {
  await render(
    <FeatureGate feature="nearby">
      <Text>inside</Text>
    </FeatureGate>,
  );
  expect(screen.getByText("inside")).toBeTruthy();
});
