import { passwordStrength, signupError } from "../lib/registration";

it("rejects malformed email, mismatched passwords and unsupported lengths", () => {
  expect(
    signupError(
      "not-an-email",
      "Long enough passphrase",
      "Long enough passphrase",
    ),
  ).toMatch(/email/);
  expect(signupError("a@example.test", "short", "short")).toMatch(/12/);
  expect(
    signupError("a@example.test", "x".repeat(129), "x".repeat(129)),
  ).toMatch(/128/);
  expect(
    signupError(
      "a@example.test",
      "Long enough passphrase",
      "Different passphrase",
    ),
  ).toMatch(/match/);
  expect(
    signupError(
      " a@example.test ",
      "Long enough passphrase!",
      "Long enough passphrase!",
    ),
  ).toBeNull();
});
it("gives length and variety guidance without claiming a security guarantee", () => {
  expect(passwordStrength("")).toMatch(/12/);
  expect(passwordStrength("short")).toBe("Too short");
  expect(passwordStrength("abcdefghijkl")).toMatch(/Good length/);
  expect(passwordStrength("Long and varied passphrase 12!")).toMatch(/Strong/);
});
