import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import HumanVerificationScreen from "../app/human-verification";
import {
  startHumanVerification,
  submitHumanVerification,
} from "../lib/humanVerification";
import { loadVerificationProgress } from "../lib/verificationProgress";
jest.mock("../lib/humanVerification", () => ({
  startHumanVerification: jest.fn(),
  submitHumanVerification: jest.fn(),
}));
jest.mock("../lib/verificationProgress", () => ({
  loadVerificationProgress: jest.fn(),
}));
jest.mock("../lib/session", () => ({
  useSession: () => ({
    status: "ready",
    userId: "fixture-user",
    emailVerified: true,
  }),
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
jest.mock("../components/CaptchaWidget", () => {
  const { Pressable, Text, View } = jest.requireActual("react-native");
  return function FixtureWidget({
    onToken,
    onExpired,
    onError,
  }: {
    onToken: (token: string) => void;
    onExpired: () => void;
    onError: () => void;
  }) {
    return (
      <View>
        <Pressable
          accessibilityRole="button"
          onPress={() => onToken("fixture-only-proof")}
        >
          <Text>Solve fixture CAPTCHA</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onExpired}>
          <Text>Expire fixture CAPTCHA</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onError}>
          <Text>Fail fixture CAPTCHA script</Text>
        </Pressable>
      </View>
    );
  };
});
const load = loadVerificationProgress as jest.Mock,
  start = startHumanVerification as jest.Mock,
  submit = submitHumanVerification as jest.Mock;
const pending = {
  emailVerified: true,
  humanVerified: false,
  schoolVerified: false,
  reviewStatus: null,
};
beforeEach(() => {
  jest.resetAllMocks();
  load.mockResolvedValue(pending);
  start.mockResolvedValue({
    challengeId: "fixture-id",
    nonce: "fixture-nonce",
    provider: "turnstile",
    siteKey: "fixture-key",
  });
  submit.mockResolvedValue(undefined);
});
it("keeps Continue locked until the backend confirms and saved progress agrees", async () => {
  await render(<HumanVerificationScreen />);
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Solve fixture CAPTCHA" }),
    ).toBeTruthy(),
  );
  expect(
    screen.getByRole("button", { name: "Verify and continue" }),
  ).toBeDisabled();
  await fireEvent.press(
    screen.getByRole("button", { name: "Solve fixture CAPTCHA" }),
  );
  load.mockResolvedValueOnce({ ...pending, humanVerified: true });
  await fireEvent.press(
    screen.getByRole("button", { name: "Verify and continue" }),
  );
  await waitFor(() =>
    expect(screen.getByText("Human verification completed.")).toBeTruthy(),
  );
  expect(submit).toHaveBeenCalledWith("fixture-id", "fixture-only-proof");
  expect(screen.getByText("Continue to school ID verification")).toBeTruthy();
});
it.each(["Expire fixture CAPTCHA", "Fail fixture CAPTCHA script"])(
  "%s removes the token and keeps the account locked",
  async (name) => {
    await render(<HumanVerificationScreen />);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Solve fixture CAPTCHA" }),
      ).toBeTruthy(),
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Solve fixture CAPTCHA" }),
    );
    await fireEvent.press(screen.getByRole("button", { name }));
    expect(
      screen.getByRole("button", { name: "Verify and continue" }),
    ).toBeDisabled();
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(submit).not.toHaveBeenCalled();
  },
);
it("provider configuration failure offers retry but cannot claim completion", async () => {
  start.mockRejectedValueOnce(
    new Error("Human verification is not configured."),
  );
  await render(<HumanVerificationScreen />);
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Human verification is not configured.",
    ),
  );
  expect(screen.queryByText("Human verification completed.")).toBeNull();
  await fireEvent.press(
    screen.getByRole("button", { name: "Start a new check or refresh status" }),
  );
  await waitFor(() => expect(start).toHaveBeenCalledTimes(2));
  expect(
    screen.getByRole("button", { name: "Verify and continue" }),
  ).toBeDisabled();
});
it("a successful HTTP response cannot override a missing saved approval", async () => {
  await render(<HumanVerificationScreen />);
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Solve fixture CAPTCHA" }),
    ).toBeTruthy(),
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Solve fixture CAPTCHA" }),
  );
  await fireEvent.press(
    screen.getByRole("button", { name: "Verify and continue" }),
  );
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Verification was not saved. Retry status checking.",
    ),
  );
  expect(screen.queryByText("Human verification completed.")).toBeNull();
});
it("restores verified status without requiring a new CAPTCHA", async () => {
  load.mockResolvedValue({ ...pending, humanVerified: true });
  await render(<HumanVerificationScreen />);
  await waitFor(() =>
    expect(screen.getByText("Human verification completed.")).toBeTruthy(),
  );
  expect(start).not.toHaveBeenCalled();
});
