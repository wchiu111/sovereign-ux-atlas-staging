import { lazy, Suspense, useState } from "react";
import SovereignExperience from "./SovereignExperience";
import { detectPhoneDevice } from "./phoneDevice";

const MobileAtlas = lazy(() => import("../atlas/mobile/MobileAtlas"));

export default function ResponsiveAtlasExperience() {
  const [phone] = useState(detectPhoneDevice);
  if (!phone) return <SovereignExperience />;
  return (
    <Suspense fallback={<div style={{ position: "fixed", inset: 0, background: "#080810" }} />}>
      <MobileAtlas />
    </Suspense>
  );
}
