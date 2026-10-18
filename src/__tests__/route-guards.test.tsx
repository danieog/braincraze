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
it.each([
  [{ status: "signedOut" }, true, false],
  [{ status: "ready", userId: "u1", emailVerified: false }, true, false],
  [{ status: "ready", userId: "u1", emailVerified: true }, false, true],
])(
  "shows email confirmation and protects ID routes for session %j",
  async (session, confirmation, verification) => {
    mockSession.mockReturnValue(session);
    await render(<RootLayout />);
    expect(Boolean(screen.queryByText("verify-email"))).toBe(confirmation);
    expect(Boolean(screen.queryByText("verify-id"))).toBe(verification);
    expect(Boolean(screen.queryByText("admin-review"))).toBe(verification);
  },
);
