import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "vite";

const server = await createServer({ appType: "custom", logLevel: "silent", server: { middlewareMode: true } });
try {
  const { isPhoneDevice } = await server.ssrLoadModule("/src/app/experiences/phoneDevice.ts");
  const base = { platform: "Linux armv8l", maxTouchPoints: 5, coarsePointer: true, screenWidth: 390, screenHeight: 844 };
  const cases = [
    ["Android phone", { userAgent: "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36" }, true],
    ["iPhone", { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148 Safari/604.1", platform: "iPhone" }, true],
    ["iPad", { userAgent: "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) Mobile/15E148 Safari/604.1", screenWidth: 768, screenHeight: 1024 }, false],
    ["iPad Pro desktop identity", { userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) Safari/605.1.15", platform: "MacIntel", screenWidth: 1024, screenHeight: 1366 }, false],
    ["Android tablet", { userAgent: "Mozilla/5.0 (Linux; Android 15; Pixel Tablet) Chrome/130 Safari/537.36" }, false],
    ["Samsung tablet reporting Mobile", { userAgent: "Mozilla/5.0 (Linux; Android 14; SM-X910) Chrome/130 Mobile Safari/537.36" }, false],
    ["desktop at 390px", { userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130 Safari/537.36", platform: "Win32", maxTouchPoints: 0, coarsePointer: false }, false],
    ["touch laptop", { userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130 Safari/537.36", platform: "Win32", mobileHint: true }, false],
    ["phone UA without phone capabilities", { userAgent: "iPhone", maxTouchPoints: 0, coarsePointer: false }, false],
    ["unknown device defaults desktop", { userAgent: "Unknown" }, false],
    ["mobile hint with phone screen", { userAgent: "Mobile browser", mobileHint: true }, true],
    ["mobile hint with tablet screen", { userAgent: "Mobile browser", mobileHint: true, screenWidth: 800, screenHeight: 1280 }, false],
    ["Android phone landscape", { userAgent: "Android Mobile", screenWidth: 844, screenHeight: 390 }, true],
  ];
  for (const [name, signals, expected] of cases) {
    await test(name, () => assert.equal(isPhoneDevice({ ...base, ...signals }), expected));
  }
} finally {
  await server.close();
}
