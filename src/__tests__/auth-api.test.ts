import { logIn, resendConfirmation, signUp } from "../lib/auth";
const mockAuth = {
  signUp: jest.fn(),
  signInWithPassword: jest.fn(),
  resend: jest.fn(),
};
jest.mock("../lib/supabase", () => ({
  supabase: {
    auth: {
      signUp: (...args: unknown[]) => mockAuth.signUp(...args),
      signInWithPassword: (...args: unknown[]) =>
        mockAuth.signInWithPassword(...args),
      resend: (...args: unknown[]) => mockAuth.resend(...args),
    },
  },
}));
beforeEach(() => jest.resetAllMocks());
it("delegates signup and confirmation to Supabase without setting verification metadata", async () => {
  mockAuth.signUp.mockResolvedValue({ error: null });
  await signUp(" a@example.test ", "A passphrase");
  expect(mockAuth.signUp).toHaveBeenCalledWith({
    email: "a@example.test",
    password: "A passphrase",
    options: { emailRedirectTo: expect.any(String) },
  });
});
it("resends via Supabase and propagates provider errors without inventing successful delivery", async () => {
  mockAuth.resend
    .mockResolvedValueOnce({ error: null })
    .mockResolvedValueOnce({ error: new Error("Email rate limit exceeded") });
  await resendConfirmation(" a@example.test ");
  expect(mockAuth.resend).toHaveBeenCalledWith({
    type: "signup",
    email: "a@example.test",
    options: { emailRedirectTo: expect.any(String) },
  });
  await expect(resendConfirmation("a@example.test")).rejects.toThrow(
    "rate limit",
  );
});
it("forwards credentials and returns an authentication failure to the caller", async () => {
  mockAuth.signInWithPassword.mockResolvedValue({
    error: new Error("Invalid login"),
  });
  await expect(logIn("a@example.test", "wrong")).rejects.toThrow(
    "Invalid login",
  );
});
