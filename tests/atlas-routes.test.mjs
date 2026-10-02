import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "vite";

const server = await createServer({
  appType: "custom",
  logLevel: "silent",
  server: { middlewareMode: true },
});

try {
  const routes = await server.ssrLoadModule("/src/app/routing/atlasRoutes.ts");

  const parse = (pathname, hash = "") => routes.parseAtlasRoute({ pathname, hash });

  await test("builds and restores the Observatory root", () => {
    assert.equal(routes.observatoryRootPath(), "/observatory");
    const route = parse("/observatory");
    assert.equal(route.canonicalPath, "/observatory");
    assert.deepEqual(route.observatory, {
      slug: null,
      desktopPanelId: null,
    });
  });

  await test("restores every canonical Observatory panel", () => {
    const panels = [
      ["about", "about"],
      ["journey", "timeline"],
      ["philosophy", "philosophy"],
      ["contact", "contact"],
    ];

    panels.forEach(([slug, desktopPanelId]) => {
      const route = parse(`/observatory/${slug}`);
      assert.equal(route.canonicalPath, `/observatory/${slug}`);
      assert.deepEqual(route.observatory, { slug, desktopPanelId });
    });
  });

  await test("rejects invalid Observatory paths", () => {
    assert.equal(parse("/observatory/timeline"), null);
    assert.equal(parse("/observatory/not-a-panel"), null);
    assert.equal(parse("/observatory/about/extra"), null);
  });

  await test("maps public journey routes to Desktop timeline state", () => {
    assert.equal(
      routes.desktopObservatoryPanelForSlug("journey"),
      "timeline",
    );
    assert.equal(
      routes.observatorySlugForDesktopPanel("timeline"),
      "journey",
    );
    assert.equal(routes.desktopObservatoryPanelForSlug("timeline"), null);
  });

  await test("builds canonical Observatory panel paths", () => {
    assert.equal(routes.observatoryPanelPath("about"), "/observatory/about");
    assert.equal(
      routes.observatoryPanelPath("journey"),
      "/observatory/journey",
    );
    assert.equal(
      routes.observatoryPanelPathForDesktopPanel("timeline"),
      "/observatory/journey",
    );
    assert.equal(routes.observatoryPanelPath("timeline"), null);
    assert.equal(routes.observatoryPanelPath("unknown"), null);
  });

  await test("builds canonical Experiment paths", () => {
    assert.equal(routes.atlasSystemPath("experiments"), "/experiments");
    assert.equal(
      routes.experimentBasePath("gestalt-principles"),
      "/experiments/gestalt-principles",
    );
    assert.equal(
      routes.experimentSectionPath("gestalt-principles", "outputs"),
      "/experiments/gestalt-principles/outputs",
    );
    assert.equal(
      routes.experimentEvidencePath(
        "gestalt-principles",
        "outputs",
        "gestalt-output-05",
      ),
      "/experiments/gestalt-principles/outputs/evidence/gestalt-output-05",
    );
  });

  await test("builds and restores canonical Framework paths", () => {
    assert.equal(routes.atlasSystemPath("frameworks"), "/frameworks");
    assert.equal(
      routes.frameworkBasePath("authority-gradient"),
      "/frameworks/authority-gradient",
    );
    const overview = parse("/frameworks/authority-gradient");
    assert.equal(overview.atlasState.level, 2);
    assert.equal(overview.atlasState.activePlanetId, "authority-gradient");
    const section = parse("/frameworks/authority-gradient/system-purpose");
    assert.equal(section.atlasState.level, 3);
    assert.equal(section.sectionId, "system-purpose");
  });

  await test("canonicalizes legacy Framework routes", () => {
    const route = parse("/framework/authority-gradient/system-purpose");
    assert.equal(
      route.canonicalPath,
      "/frameworks/authority-gradient/system-purpose",
    );
  });

  await test("canonicalizes shared Presence Navigation evidence to Arrival", () => {
    const evidenceIds = [
      "attention-architecture-demo",
      "attention-architecture-map",
    ];

    evidenceIds.forEach((evidenceId) => {
      const expected =
        `/frameworks/presence-navigation/arrival/evidence/${evidenceId}`;
      assert.equal(
        routes.atlasEntryEvidencePath(
          "presence-navigation",
          "attention",
          evidenceId,
        ),
        expected,
      );

      const route = parse(
        `/frameworks/presence-navigation/exploration/evidence/${evidenceId}`,
      );
      assert.equal(route.canonicalPath, expected);
      assert.equal(route.sectionId, "arrival");
      assert.equal(route.evidenceId, evidenceId);
    });
  });

  await test("keeps existing Case Study routes unchanged", () => {
    assert.equal(routes.atlasSystemPath("case-studies"), "/case-studies");
    assert.equal(
      routes.caseStudyBasePath("globality"),
      "/case-studies/globality",
    );
    assert.equal(
      routes.caseStudySectionPath("globality", "context"),
      "/case-studies/globality/context",
    );

    const legacy = parse("/case-study/globality/context");
    assert.equal(legacy.canonicalPath, "/case-studies/globality/context");
    assert.equal(legacy.sectionId, "context");
  });

  await test("restores the Experiments system and overview", () => {
    const system = parse("/experiments");
    assert.equal(system.atlasState.level, 1);
    assert.equal(system.atlasState.activeSystemId, "experiments");

    const overview = parse("/experiments/design-philosophy");
    assert.equal(overview.atlasState.level, 2);
    assert.equal(overview.atlasState.activePlanetId, "design-philosophy");
    assert.equal(overview.atlasState.drawerOpen, true);
  });

  await test("restores Experiment sections and evidence", () => {
    const section = parse("/experiments/authority-drift/drift");
    assert.equal(section.atlasState.level, 3);
    assert.equal(section.atlasState.activeSystemId, "experiments");
    assert.equal(section.sectionId, "drift");

    const evidence = parse(
      "/experiments/gestalt-principles/outputs/evidence/gestalt-output-05",
    );
    assert.equal(evidence.sectionId, "outputs");
    assert.equal(evidence.evidenceId, "gestalt-output-05");
  });

  await test("canonicalizes legacy Experiment routes", () => {
    const route = parse("/experiment/think-like-a-designer/reflection");
    assert.equal(
      route.canonicalPath,
      "/experiments/think-like-a-designer/reflection",
    );
  });

  await test("rejects unknown Experiment paths", () => {
    assert.equal(parse("/experiments/not-a-real-experiment"), null);
    assert.equal(parse("/experiments/gestalt-principles/not-a-section"), null);
  });
} finally {
  await server.close();
}
