import type { CaptchaChallenge } from "../lib/humanVerification";
export type CaptchaWidgetProps = {
  challenge: CaptchaChallenge;
  onToken: (token: string) => void;
  onExpired: () => void;
  onError: () => void;
};
