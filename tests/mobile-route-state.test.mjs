import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "vite";

const server = await createServer({
  appType: "custom",
  logLevel: "silent",
  server: { middlewareMode: true },
});

try {
  const routes = await server.ssrLoadModule(
    "/src/app/atlas/mobile/mobileRouteState.ts",
  );
  const registry = await server.ssrLoadModule(
    "/src/app/atlas/mobile/reading/caseStudyReadingRegistry.ts",
  );

  await test("maps the Atlas landing route", () => {
    assert.deepEqual(routes.mobileDestinationFromPath("/"), {
      kind: "atlas",
    });
  });

  await test("maps the Case Studies parent and every project", () => {
    const ids = [
      "case-studies",
      "agentic-insurance",
      "globality",
      "oracle",
      "sovereign-atlas",
    ];

    ids.forEach((id) => {
      const path = id === "case-studies" ? "/case-studies" : `/case-studies/${id}`;
      assert.deepEqual(routes.mobileDestinationFromPath(path), {
        kind: "case-studies",
        id,
      });
    });
  });

  await test("maps the Frameworks parent and every framework", () => {
    const ids = [
      "frameworks",
      "authority-gradient",
      "behavioral-architecture",
      "relational-ai-literacy",
      "presence-navigation",
      "regenerative-systems",
    ];

    ids.forEach((id) => {
      const path = id === "frameworks" ? "/frameworks" : `/frameworks/${id}`;
      assert.deepEqual(routes.mobileDestinationFromPath(path), {
        kind: "frameworks",
        id,
      });
    });
  });

  await test("maps the Experiments parent and every experiment", () => {
    const ids = [
      "experiments",
      "ai-evaluation",
      "authority-drift",
      "design-philosophy",
      "gestalt-principles",
      "think-like-a-designer",
    ];

    ids.forEach((id) => {
      const path = id === "experiments" ? "/experiments" : `/experiments/${id}`;
      assert.deepEqual(routes.mobileDestinationFromPath(path), {
        kind: "experiments",
        id,
      });
    });
  });

  await test("does not create a destination for an invalid route", () => {
    assert.equal(
      routes.mobileDestinationFromPath("/frameworks/not-a-framework"),
      null,
    );
  });

  await test("maps Case Study sections into reader destinations", () => {
    assert.deepEqual(
      routes.mobileDestinationFromPath("/case-studies/globality/context"),
      {
        kind: "case-study-reader",
        projectId: "globality",
        sectionId: "context",
        evidenceId: undefined,
        canonicalPath: "/case-studies/globality/context",
      },
    );
  });

  await test("maps Case Study evidence into reader destinations", () => {
    const path =
      "/case-studies/globality/approach/evidence/navigation-responds-to-context";
    assert.deepEqual(routes.mobileDestinationFromPath(path), {
      kind: "case-study-reader",
      projectId: "globality",
      sectionId: "approach",
      evidenceId: "navigation-responds-to-context",
      canonicalPath: path,
    });
  });

  await test("maps authored sections for all four Case Studies", () => {
    const projectIds = [
      "agentic-insurance",
      "globality",
      "oracle",
      "sovereign-atlas",
    ];
    projectIds.forEach((projectId) => {
      const document = registry.mobileCaseStudyDocumentFor(projectId);
      document.sections.forEach((section) => {
        const destination = routes.mobileDestinationFromPath(
          `/case-studies/${projectId}/${section.id}`,
        );
        assert.equal(destination.kind, "case-study-reader");
        assert.equal(destination.projectId, projectId);
        assert.equal(destination.sectionId, section.id);
      });
    });
  });

  await test("uses Sovereign Atlas's authored five-section structure", () => {
    const document = registry.mobileCaseStudyDocumentFor("sovereign-atlas");
    assert.deepEqual(
      document.sections.map((section) => section.id),
      ["context", "problem", "approach", "outcomes", "lessons"],
    );
    assert.equal(
      routes.mobileDestinationFromPath(
        "/case-studies/sovereign-atlas/decisions",
      ),
      null,
    );
  });

  await test("builds validated Case Study reader paths", () => {
    assert.equal(
      routes.mobileCaseStudyReaderEntryPath("globality"),
      "/case-studies/globality/context",
    );
    assert.equal(
      routes.mobileCaseStudySectionPath("globality", "problem"),
      "/case-studies/globality/problem",
    );
    assert.equal(
      routes.mobileCaseStudyEvidencePath(
        "globality",
        "approach",
        "navigation-responds-to-context",
      ),
      "/case-studies/globality/approach/evidence/navigation-responds-to-context",
    );
    assert.equal(
      routes.mobileCaseStudySectionPath("globality", "not-a-section"),
      null,
    );
    assert.equal(
      routes.mobileCaseStudyEvidencePath(
        "globality",
        "context",
        "navigation-responds-to-context",
      ),
      null,
    );
  });

  await test("classifies Case Study history updates", () => {
    assert.equal(routes.mobileCaseStudyHistoryIntent("reader-entry"), "push");
    assert.equal(routes.mobileCaseStudyHistoryIntent("section-change"), "replace");
    assert.equal(routes.mobileCaseStudyHistoryIntent("evidence-open"), "push");
  });

  await test("rejects invalid Case Study section and evidence routes", () => {
    assert.equal(
      routes.mobileDestinationFromPath(
        "/case-studies/globality/not-a-section",
      ),
      null,
    );
    assert.equal(
      routes.mobileDestinationFromPath(
        "/case-studies/globality/context/evidence/not-real",
      ),
      null,
    );
  });

  await test("preserves non-Case-Study deeper routes for later passes", () => {

    assert.deepEqual(
      routes.mobileDestinationFromPath(
        "/frameworks/presence-navigation/arrival/evidence/attention-architecture-map",
      ),
      {
        kind: "deeper",
        systemId: "frameworks",
        entryId: "presence-navigation",
        sectionId: "arrival",
        evidenceId: "attention-architecture-map",
        canonicalPath:
          "/frameworks/presence-navigation/arrival/evidence/attention-architecture-map",
      },
    );
  });

  await test("builds canonical paths for Mobile overview destinations", () => {
    assert.equal(routes.mobileOverviewDestinationPath({ kind: "atlas" }), "/");
    assert.equal(
      routes.mobileOverviewDestinationPath({
        kind: "case-studies",
        id: "case-studies",
      }),
      "/case-studies",
    );
    assert.equal(
      routes.mobileOverviewDestinationPath({
        kind: "frameworks",
        id: "authority-gradient",
      }),
      "/frameworks/authority-gradient",
    );
    assert.equal(
      routes.mobileOverviewDestinationPath({
        kind: "experiments",
        id: "authority-drift",
      }),
      "/experiments/authority-drift",
    );
  });

  await test("leaves Observatory routes for a later Mobile pass", () => {
    assert.equal(routes.mobileDestinationFromPath("/observatory"), null);
    assert.equal(routes.mobileDestinationFromPath("/observatory/about"), null);
  });
} finally {
  await server.close();
}
