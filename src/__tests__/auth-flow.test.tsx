import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { AuthForm } from "../components/AuthForm";
import VerifyEmailScreen from "../app/verify-email";
import { logIn, resendConfirmation, signUp } from "../lib/auth";

jest.mock("../lib/auth", () => ({
  signUp: jest.fn(),
  logIn: jest.fn(),
  resendConfirmation: jest.fn(),
}));
jest.mock("../lib/session", () => ({
  useSession: () => ({ status: "signedOut" }),
}));
jest.mock("../components/VerificationProgress", () => ({
  VerificationProgress: () => null,
}));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("expo-router", () => {
  const { Text } = jest.requireActual("react-native");
  return {
    Link: ({ children }: { children: React.ReactNode }) => (
      <Text>{children}</Text>
    ),
  };
});
const signup = signUp as jest.Mock;
const login = logIn as jest.Mock;
const resend = resendConfirmation as jest.Mock;
beforeEach(() => jest.resetAllMocks());

it("validates confirmation before contacting Supabase, then clears passwords and explains the next step", async () => {
  signup.mockResolvedValue(undefined);
  await render(<AuthForm mode="signup" />);
  await fireEvent.changeText(
    screen.getByLabelText("Email"),
    " a@example.test ",
  );
  await fireEvent.changeText(
    screen.getByLabelText("Password"),
    "A long signup passphrase 12!",
  );
  await fireEvent.changeText(
    screen.getByLabelText("Confirm password"),
    "A different passphrase",
  );
  await fireEvent.press(screen.getByRole("button", { name: "Sign up" }));
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Passwords do not match.",
  );
  expect(signup).not.toHaveBeenCalled();
  await fireEvent.changeText(
    screen.getByLabelText("Confirm password"),
    "A long signup passphrase 12!",
  );
  await fireEvent.press(screen.getByRole("button", { name: "Show password" }));
  expect(screen.getByLabelText("Password").props.secureTextEntry).toBe(false);
  await fireEvent.press(screen.getByRole("button", { name: "Sign up" }));
  await waitFor(() =>
    expect(signup).toHaveBeenCalledWith(
      "a@example.test",
      "A long signup passphrase 12!",
    ),
  );
  expect(screen.getByText(/Creating an account does not approve/)).toBeTruthy();
  expect(screen.getByLabelText("Password").props.value).toBe("");
  expect(screen.getByLabelText("Confirm password").props.value).toBe("");
});
it("shows provider errors and preserves login support for existing passwords", async () => {
  login.mockRejectedValue(new Error("Invalid login credentials"));
  await render(<AuthForm mode="login" />);
  await fireEvent.changeText(screen.getByLabelText("Email"), "a@example.test");
  await fireEvent.changeText(screen.getByLabelText("Password"), "legacy");
  await fireEvent.press(screen.getByRole("button", { name: "Log in" }));
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Invalid login credentials",
    ),
  );
  expect(login).toHaveBeenCalledWith("a@example.test", "legacy");
});
it("requests a confirmation email without granting verification and enforces the UI cooldown", async () => {
  resend.mockResolvedValue(undefined);
  await render(<VerifyEmailScreen />);
  await fireEvent.changeText(screen.getByLabelText("Email"), "a@example.test");
  await fireEvent.press(
    screen.getByRole("button", { name: "Resend confirmation email" }),
  );
  await waitFor(() => expect(resend).toHaveBeenCalledWith("a@example.test"));
  expect(screen.getByText(/If this address can be confirmed/)).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Resend confirmation email" }),
  ).toBeDisabled();
  expect(signup).not.toHaveBeenCalled();
  expect(login).not.toHaveBeenCalled();
});
