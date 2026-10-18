import { render, screen } from "@testing-library/react-native";
import RootLayout from "../app/_layout";
const mockSession = jest.fn();
jest.mock("../lib/session", () => ({
  useSession: () => mockSession(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("expo-router", () => {
  const { Text } = jest.requireActual("react-native");
  const Stack = ({ children }: { children: React.ReactNode }) => children;
  Stack.Protected = function Protected({
    guard,
    children,
  }: {
    guard: boolean;
    children: React.ReactNode;
  }) {
    return guard ? children : null;
  };
  Stack.Screen = function Screen({ name }: { name: string }) {
    return <Text>{name}</Text>;
  };
  return { Stack };
});
const signedInRoutes = [
  "location",
  "verify-id",
  "admin-review",
];
it.each([
  [{ status: "signedOut" }, false],
  // Email confirmation, ID are optional: any signed-in account reaches every screen.
  [{ status: "ready", userId: "u1", emailVerified: false }, true],
  [{ status: "ready", userId: "u1", emailVerified: true }, true],
])("protects app routes only behind sign-in for session %j", async (session, signedIn) => {
  mockSession.mockReturnValue(session);
  await render(<RootLayout />);
  for (const route of signedInRoutes)
    expect(Boolean(screen.queryByText(route))).toBe(signedIn);
  expect(Boolean(screen.queryByText("signup"))).toBe(!signedIn);
  expect(Boolean(screen.queryByText("login"))).toBe(!signedIn);
});
