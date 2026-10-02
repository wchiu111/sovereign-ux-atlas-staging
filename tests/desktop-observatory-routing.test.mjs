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
  const seo = await server.ssrLoadModule("/src/app/seo/seoMetadata.ts");

  await test("maps Desktop Observatory routes to room and focused panels", () => {
    assert.deepEqual(routes.parseAtlasRoute({ pathname: "/observatory" }).observatory, {
      slug: null,
      desktopPanelId: null,
    });

    const panels = [
      ["about", "about"],
      ["journey", "timeline"],
      ["philosophy", "philosophy"],
      ["contact", "contact"],
    ];
    panels.forEach(([slug, panelId]) => {
      assert.equal(
        routes.parseAtlasRoute({ pathname: `/observatory/${slug}` })
          .observatory.desktopPanelId,
        panelId,
      );
      assert.equal(
        routes.observatoryPanelPathForDesktopPanel(panelId),
        `/observatory/${slug}`,
      );
    });
    assert.equal(routes.parseAtlasRoute({ pathname: "/observatory/timeline" }), null);
    assert.equal(routes.observatoryRootPath(), "/observatory");
  });

  await test("notifies runtime consumers only when push or replace changes the path", () => {
    const originalWindow = globalThis.window;
    const browser = new EventTarget();
    const location = { pathname: "/", search: "", hash: "" };
    const setPath = (path) => {
      location.pathname = path;
      location.search = "";
      location.hash = "";
    };
    Object.assign(browser, {
      location,
      history: {
        pushState: (_state, _title, path) => setPath(path),
        replaceState: (_state, _title, path) => setPath(path),
      },
    });
    globalThis.window = browser;

    try {
      let notifications = 0;
      browser.addEventListener(routes.ATLAS_PATH_CHANGE_EVENT, () => {
        notifications += 1;
      });

      routes.pushAtlasPath("/observatory");
      assert.equal(notifications, 1);
      routes.pushAtlasPath("/observatory");
      assert.equal(notifications, 1);
      routes.replaceAtlasPath("/observatory/about");
      assert.equal(notifications, 2);
      routes.replaceAtlasPath("/observatory/about");
      assert.equal(notifications, 2);
      routes.replaceAtlasPath("/");
      assert.equal(location.pathname, "/");
      assert.equal(notifications, 3);
    } finally {
      globalThis.window = originalWindow;
    }
  });

  await test("keeps Observatory routes outside the indexed SEO inventory", () => {
    const room = seo.getSeoMetadata("/observatory");
    const journey = seo.getSeoMetadata("/observatory/journey");
    assert.equal(room.indexability, "app-state-only");
    assert.equal(journey.indexability, "app-state-only");
    assert.equal(room.canonicalPath, "/observatory");
    assert.equal(journey.canonicalPath, "/observatory/journey");
    assert.equal(
      seo.getIndexableSeoRoutes().some((route) =>
        route.path.startsWith("/observatory"),
      ),
      false,
    );
  });
} finally {
  await server.close();
}
