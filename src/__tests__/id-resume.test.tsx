import { render, screen, waitFor } from "@testing-library/react-native";
import VerifyIdScreen from "../app/verify-id";
import { loadVerificationProgress } from "../lib/verificationProgress";
jest.mock("../lib/session", () => ({
  useSession: () => ({
    status: "ready",
    userId: "fixture-user",
    emailVerified: true,
    humanVerified: true,
  }),
}));
jest.mock("../lib/idVerification", () => ({
  listSchools: async () => [{ id: "fixture-school", name: "Fixture School" }],
  ROLES: ["student"],
  submitId: jest.fn(),
}));
jest.mock("../lib/verificationProgress", () => ({
  ...jest.requireActual("../lib/verificationProgress"),
  loadVerificationProgress: jest.fn(),
}));
jest.mock("../lib/supabase", () => ({ supabase: {} }));
jest.mock("expo-image-picker", () => ({}));
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
const load = loadVerificationProgress as jest.Mock;
it("restores queued review after reopening and hides duplicate submission controls", async () => {
  load.mockResolvedValue({
    emailVerified: true,
    humanVerified: true,
    schoolVerified: false,
    reviewStatus: "queued",
  });
  await render(<VerifyIdScreen />);
  await waitFor(() =>
    expect(
      screen.queryByRole("button", { name: "Submit for review" }),
    ).toBeNull(),
  );
  expect(
    screen.getAllByText(/Submission is not approval/).length,
  ).toBeGreaterThan(0);
});
it("offers replacement evidence when a reviewer requested a new image", async () => {
  load.mockResolvedValue({
    emailVerified: true,
    humanVerified: true,
    schoolVerified: false,
    reviewStatus: "needs_reupload",
  });
  await render(<VerifyIdScreen />);
  await waitFor(() =>
    expect(screen.getByText(/requested a new image/)).toBeTruthy(),
  );
  expect(
    screen.getByRole("button", { name: "Submit for review" }),
  ).toBeTruthy();
});
