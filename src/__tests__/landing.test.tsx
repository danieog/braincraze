import { render, screen } from "@testing-library/react-native";
import { Landing } from "../components/Landing";

jest.mock("expo-router", () => {
  const { Text } = require("react-native");
  return { Link: ({ children, href }: { children: string; href: string }) => <Text accessibilityHint={href}>{children}</Text> };
});

it("explains the product and offers sign up and log in", async () => {
  await render(<Landing />);
  expect(screen.getByText("How it works")).toBeTruthy();
  expect(screen.getByText("Sign up").props.accessibilityHint).toBe("/signup");
  expect(screen.getByText("Log in").props.accessibilityHint).toBe("/login");
});
