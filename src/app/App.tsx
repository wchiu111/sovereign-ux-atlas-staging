import { Analytics } from '@vercel/analytics/react';
import ResponsiveAtlasExperience from "./experiences/ResponsiveAtlasExperience";
import { AtlasStateProvider } from "./state";
import AtlasSeo from "./seo/AtlasSeo";

export default function App() {
  return (
    <AtlasStateProvider>
      <AtlasSeo />
      <ResponsiveAtlasExperience />
      <Analytics />
    </AtlasStateProvider>
  );
}
