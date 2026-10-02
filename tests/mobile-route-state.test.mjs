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
  const frameworkRegistry = await server.ssrLoadModule(
    "/src/app/atlas/mobile/frameworks/frameworkRegistry.ts",
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

  await test("maps Framework sections into reader destinations", () => {
    assert.deepEqual(
      routes.mobileDestinationFromPath(
        "/frameworks/authority-gradient/system-purpose",
      ),
      {
        kind: "framework-reader",
        frameworkId: "authority-gradient",
        sectionId: "system-purpose",
        evidenceId: undefined,
        canonicalPath:
          "/frameworks/authority-gradient/system-purpose",
      },
    );
  });

  await test("maps Framework evidence into reader destinations", () => {
    const path =
      "/frameworks/authority-gradient/system-purpose/evidence/recommendation-first";
    assert.deepEqual(routes.mobileDestinationFromPath(path), {
      kind: "framework-reader",
      frameworkId: "authority-gradient",
      sectionId: "system-purpose",
      evidenceId: "recommendation-first",
      canonicalPath: path,
    });
  });

  await test("maps authored sections for all five Frameworks", () => {
    frameworkRegistry.MOBILE_FRAMEWORKS.forEach((framework) => {
      framework.sections.forEach((section) => {
        const destination = routes.mobileDestinationFromPath(
          `/frameworks/${framework.id}/${section.id}`,
        );
        assert.equal(destination.kind, "framework-reader");
        assert.equal(destination.frameworkId, framework.id);
        assert.equal(destination.sectionId, section.id);
      });
    });
  });

  await test("uses each Framework's authored first section", () => {
    frameworkRegistry.MOBILE_FRAMEWORKS.forEach((framework) => {
      assert.equal(
        routes.mobileFrameworkReaderEntryPath(framework.id),
        `/frameworks/${framework.id}/${framework.sections[0].id}`,
      );
    });
  });

  await test("builds validated Framework reader paths", () => {
    assert.equal(
      routes.mobileFrameworkSectionPath(
        "authority-gradient",
        "system-strategy",
      ),
      "/frameworks/authority-gradient/system-strategy",
    );
    assert.equal(
      routes.mobileFrameworkEvidencePath(
        "authority-gradient",
        "system-purpose",
        "recommendation-first",
      ),
      "/frameworks/authority-gradient/system-purpose/evidence/recommendation-first",
    );
    assert.equal(
      routes.mobileFrameworkSectionPath(
        "authority-gradient",
        "not-a-section",
      ),
      null,
    );
    assert.equal(
      routes.mobileFrameworkEvidencePath(
        "authority-gradient",
        "system-strategy",
        "recommendation-first",
      ),
      null,
    );
  });

  await test("classifies Framework history updates", () => {
    assert.equal(routes.mobileFrameworkHistoryIntent("reader-entry"), "push");
    assert.equal(
      routes.mobileFrameworkHistoryIntent("section-change"),
      "replace",
    );
    assert.equal(routes.mobileFrameworkHistoryIntent("evidence-open"), "push");
  });

  await test("canonicalizes shared Presence Navigation evidence to Arrival", () => {
    for (const evidenceId of [
      "attention-architecture-demo",
      "attention-architecture-map",
    ]) {
      for (const sectionId of [
        "arrival",
        "orientation",
        "attention",
        "exploration",
      ]) {
        assert.equal(
          routes.mobileFrameworkEvidencePath(
            "presence-navigation",
            sectionId,
            evidenceId,
          ),
          `/frameworks/presence-navigation/arrival/evidence/${evidenceId}`,
        );
      }
    }
  });

  await test("rejects invalid Framework section and evidence routes", () => {
    assert.equal(
      routes.mobileDestinationFromPath(
        "/frameworks/authority-gradient/not-a-section",
      ),
      null,
    );
    assert.equal(
      routes.mobileDestinationFromPath(
        "/frameworks/authority-gradient/system-purpose/evidence/not-real",
      ),
      null,
    );
  });

  await test("preserves Experiment deeper routes for the later pass", () => {
    const destination = routes.mobileDestinationFromPath(
      "/experiments/authority-drift/drift",
    );
    assert.equal(destination.kind, "deeper");
    assert.equal(destination.systemId, "experiments");
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
