import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "vite";

const server = await createServer({
  appType: "custom",
  logLevel: "silent",
  server: { middlewareMode: true },
});

try {
  const { isNexusInteractionReady } = await server.ssrLoadModule(
    "/src/app/atlas/mobile/case-studies/constellation/nexusInteraction.ts",
  );

  await test("enables the Nexus only on the ready Atlas landing", () => {
    assert.equal(
      isNexusInteractionReady({
        atlasLanding: true,
        localTransitionActive: false,
        parentNavigationReady: true,
      }),
      true,
    );
  });

  await test("disables the Nexus inside a resolved Atlas system", () => {
    assert.equal(
      isNexusInteractionReady({
        atlasLanding: false,
        localTransitionActive: false,
        parentNavigationReady: true,
      }),
      false,
    );
  });

  await test("disables the Nexus during Case Study and Framework transitions", () => {
    assert.equal(
      isNexusInteractionReady({
        atlasLanding: true,
        localTransitionActive: true,
        parentNavigationReady: true,
      }),
      false,
    );
  });

  await test("disables the Nexus during parent-owned transitions", () => {
    assert.equal(
      isNexusInteractionReady({
        atlasLanding: true,
        localTransitionActive: false,
        parentNavigationReady: false,
      }),
      false,
    );
  });
} finally {
  await server.close();
}
