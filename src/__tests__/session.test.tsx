import { act, render, screen, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import { SessionProvider, useSession } from "../lib/session";
const mockGetSession = jest.fn();
const mockOnAuth = jest.fn();
jest.mock("../lib/supabase", () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuth(...args),
    },
  },
}));
function Probe() {
  const state = useSession();
  return <Text>{JSON.stringify(state)}</Text>;
}
let authChanged: (event: string, session: unknown) => void;
beforeEach(() => {
  jest.resetAllMocks();
  mockOnAuth.mockImplementation((callback) => {
    authChanged = callback;
    return { data: { subscription: { unsubscribe: jest.fn() } } };
  });
});
it.each([undefined, "2026-10-18T00:00:00Z"])(
  "derives email verification from the Supabase user, confirmed at %s",
  async (confirmed) => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "u1",
            email: "a@example.test",
            email_confirmed_at: confirmed,
          },
        },
      },
      error: null,
    });
    await render(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    );
    await waitFor(() =>
      expect(screen.getByText(/"status":"ready"/)).toBeTruthy(),
    );
    expect(
      screen.getByText(new RegExp(`"emailVerified":${Boolean(confirmed)}`)),
    ).toBeTruthy();
  },
);
it("reports session restore errors instead of assuming a usable session", async () => {
  mockGetSession.mockResolvedValue({
    data: { session: null },
    error: new Error("Session service unavailable"),
  });
  await render(
    <SessionProvider>
      <Probe />
    </SessionProvider>,
  );
  await waitFor(() =>
    expect(screen.getByText(/Session service unavailable/)).toBeTruthy(),
  );
});
it("does not overwrite a fresh auth event with an older session-restore response", async () => {
  let restore!: (value: unknown) => void;
  mockGetSession.mockReturnValue(
    new Promise((resolve) => {
      restore = resolve;
    }),
  );
  await render(
    <SessionProvider>
      <Probe />
    </SessionProvider>,
  );
  await act(async () => {
    authChanged("SIGNED_IN", {
      user: { id: "fresh", email_confirmed_at: "2026-10-18" },
    });
  });
  await act(async () => {
    restore({ data: { session: null }, error: null });
  });
  expect(screen.getByText(/"userId":"fresh"/)).toBeTruthy();
});
