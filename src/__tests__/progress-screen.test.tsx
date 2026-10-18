import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { VerificationProgress } from "../components/VerificationProgress";
import { loadVerificationProgress } from "../lib/verificationProgress";
const mockSession = jest.fn();
jest.mock("../lib/session", () => ({ useSession: () => mockSession() }));
jest.mock("../lib/verificationProgress", () => ({
  ...jest.requireActual("../lib/verificationProgress"),
  loadVerificationProgress: jest.fn(),
}));
jest.mock("../lib/supabase", () => ({ supabase: {} }));
jest.mock("expo-router", () => {
  const { Text } = jest.requireActual("react-native");
  return {
    Link: ({ children }: { children: React.ReactNode }) => (
      <Text>{children}</Text>
    ),
  };
});
const load = loadVerificationProgress as jest.Mock;
beforeEach(() => {
  jest.resetAllMocks();
  mockSession.mockReturnValue({ status: "ready", userId: "fixture-user" });
});
it("restores pending review after remount and distinguishes reupload and approval on refresh", async () => {
  load.mockResolvedValueOnce({
    emailVerified: true,
    schoolVerified: false,
    reviewStatus: "manual_review",
  });
  await render(<VerificationProgress />);
  await waitFor(() =>
    expect(screen.getByText(/Submission is not approval/)).toBeTruthy(),
  );
  load.mockResolvedValueOnce({
    emailVerified: true,
    schoolVerified: false,
    reviewStatus: "needs_reupload",
  });
  await fireEvent.press(
    screen.getByRole("button", { name: "Refresh verification progress" }),
  );
  await waitFor(() =>
    expect(screen.getByText(/requested a new image/)).toBeTruthy(),
  );
  expect(screen.getByText("School affiliation review — Optional")).toBeTruthy();
  load.mockResolvedValueOnce({
    emailVerified: true,
    schoolVerified: true,
    reviewStatus: "approved",
  });
  await fireEvent.press(
    screen.getByRole("button", { name: "Refresh verification progress" }),
  );
  await waitFor(() =>
    expect(
      screen.getByText("School affiliation review — Completed"),
    ).toBeTruthy(),
  );
});
it("displays a failed status request and permits retry without inventing approval", async () => {
  load.mockRejectedValueOnce(new Error("Migration not installed"));
  await render(<VerificationProgress />);
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Migration not installed",
    ),
  );
  expect(
    screen.queryByText("School affiliation review — Completed"),
  ).toBeNull();
  load.mockResolvedValueOnce({
    emailVerified: true,
    schoolVerified: false,
    reviewStatus: null,
  });
  await fireEvent.press(
    screen.getByRole("button", { name: "Refresh verification progress" }),
  );
  await waitFor(() =>
    expect(screen.getByText("Submit school ID — Optional")).toBeTruthy(),
  );
});
it("does not request private progress for signed-out visitors", async () => {
  mockSession.mockReturnValue({ status: "signedOut" });
  await render(<VerificationProgress />);
  expect(load).not.toHaveBeenCalled();
  expect(screen.getByText("Create account — Next step")).toBeTruthy();
});
it("shows a brand-new account as signed up, with verification optional and nothing locked", async () => {
  load.mockResolvedValueOnce({
    emailVerified: false,
    schoolVerified: false,
    reviewStatus: null,
  });
  await render(<VerificationProgress />);
  await waitFor(() =>
    expect(screen.getByText("Create account — Completed")).toBeTruthy(),
  );
  expect(screen.getByText("Submit school ID — Optional")).toBeTruthy();
  expect(screen.queryByText(/Complete earlier steps first/)).toBeNull();
  expect(screen.queryByText(/Verify email/)).toBeNull();
  expect(screen.getByText(/Verification is optional/)).toBeTruthy();
});
