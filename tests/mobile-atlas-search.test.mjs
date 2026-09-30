import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "vite";

const server = await createServer({
  appType: "custom",
  logLevel: "silent",
  server: { middlewareMode: true },
});

try {
  const search = await server.ssrLoadModule(
    "/src/app/atlas/mobile/components/atlasMobileSearchIndex.ts",
  );
  const caseStudies = await server.ssrLoadModule(
    "/src/app/atlas/mobile/case-studies/caseStudyData.ts",
  );
  const frameworks = await server.ssrLoadModule(
    "/src/app/atlas/mobile/frameworks/frameworkRegistry.ts",
  );
  const experiments = await server.ssrLoadModule(
    "/src/app/atlas/mobile/experiments/config/experimentsContent.ts",
  );
  const observatory = await server.ssrLoadModule(
    "/src/app/atlas/mobile/observatory/config/observatoryHotspots.ts",
  );

  const firstResultFor = (query) => search.searchAtlasMobile(query)[0];

  await test("indexes every mobile Atlas destination family", () => {
    const kinds = new Set(
      search.ATLAS_MOBILE_SEARCH_RESULTS.map((result) => result.destination.kind),
    );

    assert.deepEqual(
      [...kinds].sort(),
      ["case-studies", "experiments", "frameworks", "observatory"],
    );
  });

  await test("resolves representative mobile queries", () => {
    assert.equal(firstResultFor("Globality").id, "globality");
    assert.equal(firstResultFor("Oracle").id, "oracle");
    assert.equal(firstResultFor("Authority Gradient").id, "authority-gradient");
    assert.equal(firstResultFor("Authority Drift").id, "authority-drift");
    assert.equal(firstResultFor("About Wilson").id, "about-wilson");
  });

  await test("maps every parent result to its system destination", () => {
    const expected = {
      "case-studies": { kind: "case-studies", id: "case-studies" },
      frameworks: { kind: "frameworks", id: "frameworks" },
      experiments: { kind: "experiments", id: "experiments" },
      observatory: { kind: "observatory", id: "observatory" },
    };

    Object.entries(expected).forEach(([resultId, destination]) => {
      const result = search.ATLAS_MOBILE_SEARCH_RESULTS.find(
        (candidate) => candidate.id === resultId,
      );
      assert.deepEqual(result?.destination, destination);
    });
  });

  await test("keeps specific search destinations aligned with live registries", () => {
    const validIds = {
      "case-studies": new Set([
        "case-studies",
        ...caseStudies.CASE_STUDY_PROJECTS.map((project) => project.id),
      ]),
      frameworks: new Set([
        "frameworks",
        ...frameworks.MOBILE_FRAMEWORKS.map((framework) => framework.id),
      ]),
      experiments: new Set([
        "experiments",
        ...experiments.MOBILE_EXPERIMENTS.map((experiment) => experiment.id),
      ]),
      observatory: new Set([
        "observatory",
        ...observatory.OBSERVATORY_HOTSPOTS
          .filter((hotspot) => hotspot.id !== "atlas")
          .map((hotspot) => hotspot.id),
      ]),
    };

    search.ATLAS_MOBILE_SEARCH_RESULTS.forEach((result) => {
      assert.ok(
        validIds[result.destination.kind].has(result.destination.id),
        `${result.id} points to missing ${result.destination.kind} destination ${result.destination.id}`,
      );
    });
  });

  await test("keeps every guided prompt connected to a live result", () => {
    search.ATLAS_MOBILE_GUIDED_PROMPTS.forEach((prompt) => {
      assert.ok(
        search.searchAtlasMobile(prompt.query).length > 0,
        `No result for guided prompt: ${prompt.label}`,
      );
    });
  });
} finally {
  await server.close();
}
