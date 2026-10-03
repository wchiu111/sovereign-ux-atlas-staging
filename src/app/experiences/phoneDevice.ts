export interface DeviceSignals {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
  coarsePointer: boolean;
  mobileHint?: boolean;
  screenWidth: number;
  screenHeight: number;
}

export function isPhoneDevice(signals: DeviceSignals): boolean {
  const { userAgent: ua, platform, maxTouchPoints, coarsePointer, mobileHint } = signals;
  const touchCapable = maxTouchPoints > 0 || coarsePointer;
  const android = /Android/i.test(ua);
  // iPadOS can identify itself as a Mac, including in desktop browsing mode.
  if (/iPad|Tablet|PlayBook|Silk|Kindle|Nexus (7|9|10)|SM-T\w*|SM-X\w*/i.test(ua)
    || (/Mac/i.test(platform) && maxTouchPoints > 1)
    || (android && !/Mobile/i.test(ua))) return false;
  if (!touchCapable) return false;
  if (/iPhone|iPod/i.test(ua)) return true;
  if (android && /Mobile/i.test(ua)) return true;
  // Unknown mobile platforms need an explicit mobile hint and phone-sized screen.
  // Physical screen dimensions are supporting evidence, never the window width.
  return mobileHint === true
    && !/Windows NT|Macintosh|CrOS|X11/i.test(ua)
    && Math.min(signals.screenWidth, signals.screenHeight) > 0
    && Math.min(signals.screenWidth, signals.screenHeight) < 600;
}

export function detectPhoneDevice(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { userAgentData?: { mobile?: boolean } };
  return isPhoneDevice({
    userAgent: nav.userAgent,
    platform: nav.platform,
    maxTouchPoints: nav.maxTouchPoints,
    coarsePointer: window.matchMedia("(pointer: coarse)").matches,
    mobileHint: nav.userAgentData?.mobile,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
  });
}
