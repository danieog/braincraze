import { useEffect, useRef } from "react";
import type { CaptchaWidgetProps } from "./CaptchaWidget.types";
type WidgetApi = {
  render: (
    container: HTMLElement,
    options: Record<string, unknown>,
  ) => string | number;
  remove?: (id: string | number) => void;
  reset?: (id: string | number) => void;
};
let callbackSequence = 0;
const scripts = {
  turnstile:
    "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit",
  hcaptcha: "https://js.hcaptcha.com/1/api.js?render=explicit",
  recaptcha: "https://www.google.com/recaptcha/api.js?render=explicit",
};
export default function CaptchaWidget({
  challenge,
  onToken,
  onExpired,
  onError,
}: CaptchaWidgetProps) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let active = true,
      id: string | number | undefined;
    const api = () =>
      (window as unknown as Record<string, WidgetApi | undefined>)[
        challenge.provider === "recaptcha" ? "grecaptcha" : challenge.provider
      ];
    const timeout = setTimeout(() => {
      if (active && id === undefined) onError();
    }, 20000);
    const render = () => {
      if (!active || !container.current || id !== undefined) return;
      try {
        const options: Record<string, unknown> = {
          sitekey: challenge.siteKey,
          size: container.current.clientWidth < 320 ? "compact" : "normal",
          callback: (token: string) => {
            if (active) onToken(token);
          },
          "expired-callback": () => {
            if (active) onExpired();
          },
          "error-callback": () => {
            if (active) onError();
          },
        };
        if (challenge.provider === "turnstile") {
          options.action = "braincraze_human";
          options.cData = challenge.nonce;
        }
        const provider = api();
        if (!provider) {
          onError();
          return;
        }
        id = provider.render(container.current, options);
      } catch {
        onError();
      }
    };
    const readyName = `braincrazeCaptchaReady${++callbackSequence}`;
    const globals = window as unknown as Record<string, unknown>;
    globals[readyName] = render;
    const script = document.createElement("script");
    script.src = `${scripts[challenge.provider]}&onload=${readyName}`;
    script.async = true;
    script.onload = () => {
      if (typeof api()?.render === "function") render();
    };
    script.onerror = () => {
      if (active) onError();
    };
    if (api()) render();
    else document.head.appendChild(script);
    return () => {
      active = false;
      clearTimeout(timeout);
      script.remove();
      delete globals[readyName];
      if (id !== undefined) {
        try {
          const provider = api();
          if (provider?.remove) provider.remove(id);
          else provider?.reset?.(id);
        } catch {
          /* Widget already detached. */
        }
      }
    };
  }, [challenge, onToken, onExpired, onError]);
  return <div ref={container} aria-label="Human verification CAPTCHA" />;
}
