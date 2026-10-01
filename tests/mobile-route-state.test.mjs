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

  await test("preserves deeper routes for the later reader-routing pass", () => {
    assert.deepEqual(
      routes.mobileDestinationFromPath("/case-studies/globality/context"),
      {
        kind: "deeper",
        systemId: "case-studies",
        entryId: "globality",
        sectionId: "context",
        evidenceId: undefined,
        canonicalPath: "/case-studies/globality/context",
      },
    );

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
