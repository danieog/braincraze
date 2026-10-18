export function signupError(
  email: string,
  password: string,
  confirmation: string,
): string | null {
  if (
    email.trim().length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  )
    return "Enter a valid email address.";
  if (password.length < 12 || password.length > 128)
    return "Use a password with 12–128 characters.";
  if (password !== confirmation) return "Passwords do not match.";
  return null;
}
export function passwordStrength(password: string): string {
  if (!password) return "Use 12–128 characters.";
  if (password.length < 12) return "Too short";
  const variety = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter(
    (pattern) => pattern.test(password),
  ).length;
  return password.length >= 16 && variety >= 3
    ? "Strong length and variety"
    : "Good length; consider a longer, varied passphrase";
}
