export type Feature = "nearby" | "verify-id";

export type Access = { isAnonymous: boolean };

// Single place to decide who can use a feature.
// Nearby works for anonymous users. School verification needs a real email account,
// because the database requires a confirmed email before it starts.
// Later: check a paid plan or an ad-supported tier here.
export function canUse(feature: Feature, access: Access = { isAnonymous: false }): boolean {
  if (feature === "verify-id") return !access.isAnonymous;
  return true;
}
