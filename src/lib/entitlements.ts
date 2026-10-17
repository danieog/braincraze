export type Feature = "nearby";

// Single place to decide who can use a feature. Everyone can for now.
// Later: check login, a paid plan, or an ad-supported tier here.
export function canUse(_feature: Feature): boolean {
  return true;
}
