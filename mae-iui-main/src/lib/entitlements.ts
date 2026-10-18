export type Feature = "nearby" | "verify-id";

// Single place to decide who can use a feature. Everyone can for now.
// Everyone is signed in with an email by the time they get here (see the route guard in app/_layout.tsx).
// Later: check a paid plan or an ad-supported tier here.
export function canUse(_feature: Feature): boolean {
  return true;
}
