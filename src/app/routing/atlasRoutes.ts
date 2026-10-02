import { getAtlasEntry, getEntriesByCategory } from "../content/registry";
import type { AtlasCategory, AtlasEntry } from "../content/types";
import { initialAtlasState, type AtlasState } from "../state/atlasState";

export const CASE_STUDIES_PATH = "/case-studies";
export const EXPERIMENTS_PATH = "/experiments";
export const FRAMEWORKS_PATH = "/frameworks";
export const OBSERVATORY_PATH = "/observatory";

export type ObservatoryRouteSlug =
  | "about"
  | "journey"
  | "philosophy"
  | "contact";

export type DesktopObservatoryPanelId =
  | "about"
  | "timeline"
  | "philosophy"
  | "contact";

const OBSERVATORY_ROUTE_TO_DESKTOP_PANEL = {
  about: "about",
  journey: "timeline",
  philosophy: "philosophy",
  contact: "contact",
} as const satisfies Record<ObservatoryRouteSlug, DesktopObservatoryPanelId>;

interface RoutableAtlasCategory {
  category: AtlasCategory;
  systemId: "case-studies" | "experiments" | "frameworks";
  systemPath: string;
  legacyPrefix: string;
}

const ROUTABLE_CATEGORIES: RoutableAtlasCategory[] = [
  {
    category: "case-study",
    systemId: "case-studies",
    systemPath: CASE_STUDIES_PATH,
    legacyPrefix: "/case-study/",
  },
  {
    category: "experiment",
    systemId: "experiments",
    systemPath: EXPERIMENTS_PATH,
    legacyPrefix: "/experiment/",
  },
  {
    category: "framework",
    systemId: "frameworks",
    systemPath: FRAMEWORKS_PATH,
    legacyPrefix: "/framework/",
  },
];

export interface AtlasRoute {
  atlasState: AtlasState;
  canonicalPath: string;
  entryRouteId?: string;
  sectionId?: string;
  evidenceId?: string;
  observatory?: {
    slug: ObservatoryRouteSlug | null;
    desktopPanelId: DesktopObservatoryPanelId | null;
  };
}

function navigationState(overrides: Partial<AtlasState>): AtlasState {
  return {
    ...initialAtlasState,
    ...overrides,
    searchMode: null,
    focusTransition: null,
  };
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function publicSlug(entry: AtlasEntry): string {
  return entry.routeSlug ?? entry.id;
}

function findEntry(
  category: AtlasCategory,
  routeId: string,
): AtlasEntry | undefined {
  return getEntriesByCategory(category).find(
    (entry) =>
      publicSlug(entry) === routeId ||
      entry.id === routeId ||
      entry.aliases?.includes(routeId),
  );
}

function routeConfigForEntry(entry: AtlasEntry): RoutableAtlasCategory | undefined {
  return ROUTABLE_CATEGORIES.find((config) => config.category === entry.category);
}

export function atlasSystemPath(systemId: string): string | null {
  return ROUTABLE_CATEGORIES.find((config) => config.systemId === systemId)
    ?.systemPath ?? null;
}

export function observatoryRootPath(): string {
  return OBSERVATORY_PATH;
}

export function desktopObservatoryPanelForSlug(
  slug: string,
): DesktopObservatoryPanelId | null {
  return OBSERVATORY_ROUTE_TO_DESKTOP_PANEL[
    slug as ObservatoryRouteSlug
  ] ?? null;
}

export function observatorySlugForDesktopPanel(
  panelId: string,
): ObservatoryRouteSlug | null {
  const match = Object.entries(OBSERVATORY_ROUTE_TO_DESKTOP_PANEL).find(
    ([, desktopPanelId]) => desktopPanelId === panelId,
  );
  return (match?.[0] as ObservatoryRouteSlug | undefined) ?? null;
}

export function observatoryPanelPath(slug: string): string | null {
  return desktopObservatoryPanelForSlug(slug)
    ? `${OBSERVATORY_PATH}/${slug}`
    : null;
}

export function observatoryPanelPathForDesktopPanel(
  panelId: string,
): string | null {
  const slug = observatorySlugForDesktopPanel(panelId);
  return slug ? observatoryPanelPath(slug) : null;
}

export function atlasEntryBasePath(entryId: string): string | null {
  const entry = getAtlasEntry(entryId);
  if (!entry) return null;
  const config = routeConfigForEntry(entry);
  return config ? `${config.systemPath}/${publicSlug(entry)}` : null;
}

export function atlasEntrySectionPath(
  entryId: string,
  sectionId: string,
): string | null {
  const entry = getAtlasEntry(entryId);
  const section = entry?.sections?.find(
    (candidate) => candidate.id === sectionId,
  );
  if (!entry || !section) return null;
  const basePath = atlasEntryBasePath(entryId);
  return basePath ? `${basePath}/${encodeURIComponent(section.id)}` : null;
}

export function atlasEntryEvidencePath(
  entryId: string,
  sectionId: string,
  evidenceId: string,
): string | null {
  const entry = getAtlasEntry(entryId);
  const requestedSection = entry?.sections?.find(
    (section) => section.id === sectionId,
  );
  const evidenceExistsInRequestedSection = requestedSection?.evidence?.some(
    (evidence) => evidence.id === evidenceId,
  );
  if (!entry || !requestedSection || !evidenceExistsInRequestedSection) {
    return null;
  }

  // Shared evidence receives one stable URL: its first authored section.
  const canonicalSection = entry.sections?.find((section) =>
    section.evidence?.some((evidence) => evidence.id === evidenceId),
  );
  const sectionPath = canonicalSection
    ? atlasEntrySectionPath(entry.id, canonicalSection.id)
    : null;
  return sectionPath
    ? `${sectionPath}/evidence/${encodeURIComponent(evidenceId)}`
    : null;
}

export function caseStudyBasePath(entryId: string): string {
  return atlasEntryBasePath(entryId) ?? `${CASE_STUDIES_PATH}/${entryId}`;
}

export function experimentBasePath(entryId: string): string {
  return atlasEntryBasePath(entryId) ?? `${EXPERIMENTS_PATH}/${entryId}`;
}

export function frameworkBasePath(entryId: string): string {
  return atlasEntryBasePath(entryId) ?? `${FRAMEWORKS_PATH}/${entryId}`;
}

export function experimentSectionPath(
  entryId: string,
  sectionId: string,
): string {
  return atlasEntrySectionPath(entryId, sectionId)
    ?? `${experimentBasePath(entryId)}/${encodeURIComponent(sectionId)}`;
}

export function experimentEvidencePath(
  entryId: string,
  sectionId: string,
  evidenceId: string,
): string {
  return atlasEntryEvidencePath(entryId, sectionId, evidenceId)
    ?? `${experimentSectionPath(entryId, sectionId)}/evidence/${encodeURIComponent(evidenceId)}`;
}

export function caseStudySectionPath(
  entryId: string,
  sectionId: string,
): string {
  return `${caseStudyBasePath(entryId)}/${encodeURIComponent(sectionId)}`;
}

export function caseStudyEvidencePath(
  entryId: string,
  sectionId: string,
  evidenceId: string,
): string {
  return `${caseStudySectionPath(entryId, sectionId)}/evidence/${encodeURIComponent(evidenceId)}`;
}

export function parseAtlasRoute(
  location: Pick<Location, "pathname" | "hash">,
): AtlasRoute | null {
  const pathname = location.pathname.replace(/\/+$/, "") || "/";
  if (pathname === "/") {
    return { atlasState: navigationState({ level: 0 }), canonicalPath: "/" };
  }

  if (pathname === OBSERVATORY_PATH) {
    return {
      atlasState: navigationState({ level: 0 }),
      canonicalPath: OBSERVATORY_PATH,
      observatory: { slug: null, desktopPanelId: null },
    };
  }

  if (pathname.startsWith(`${OBSERVATORY_PATH}/`)) {
    const routeSegments = pathname
      .slice(OBSERVATORY_PATH.length + 1)
      .split("/")
      .map(safeDecode);
    if (routeSegments.length !== 1) return null;

    const slug = routeSegments[0] as ObservatoryRouteSlug;
    const desktopPanelId = desktopObservatoryPanelForSlug(slug);
    if (!desktopPanelId) return null;

    return {
      atlasState: navigationState({ level: 0 }),
      canonicalPath: observatoryPanelPath(slug)!,
      observatory: { slug, desktopPanelId },
    };
  }

  const systemRoute = ROUTABLE_CATEGORIES.find(
    (config) => pathname === config.systemPath,
  );
  if (systemRoute) {
    return {
      atlasState: navigationState({
        level: 1,
        activeSystemId: systemRoute.systemId,
      }),
      canonicalPath: systemRoute.systemPath,
    };
  }

  const routeConfig = ROUTABLE_CATEGORIES.find((config) =>
    pathname.startsWith(`${config.systemPath}/`)
    || pathname.startsWith(config.legacyPrefix),
  );
  if (!routeConfig) return null;
  const canonicalPrefix = `${routeConfig.systemPath}/`;
  const prefix = pathname.startsWith(canonicalPrefix)
    ? canonicalPrefix
    : routeConfig.legacyPrefix;

  const routeSegments = pathname.slice(prefix.length).split("/").map(safeDecode);
  const entry = findEntry(routeConfig.category, routeSegments[0]);
  if (!entry) return null;
  const canonicalBase = atlasEntryBasePath(entry.id)!;
  const segments = routeSegments.slice(1);

  if (segments.length === 0) {
    return {
      atlasState: navigationState({
        level: 2,
        activeSystemId: routeConfig.systemId,
        activePlanetId: entry.id,
        drawerOpen: true,
      }),
      canonicalPath: canonicalBase,
      entryRouteId: publicSlug(entry),
    };
  }

  const requestedSectionIndex = entry.sections?.findIndex(
    (section) => section.id === segments[0],
  ) ?? -1;
  if (requestedSectionIndex < 0) return null;
  const requestedSection = entry.sections![requestedSectionIndex];
  const hasPathEvidence =
    segments.length === 3 && segments[1] === "evidence" && Boolean(segments[2]);
  if (segments.length !== 1 && !hasPathEvidence) return null;
  const pathEvidenceId =
    hasPathEvidence ? segments[2] : undefined;
  const hashEvidenceId = location.hash ? safeDecode(location.hash.slice(1)) : undefined;
  const candidateEvidenceId = pathEvidenceId ?? hashEvidenceId;
  const evidenceId = requestedSection.evidence?.some(
    (evidence) => evidence.id === candidateEvidenceId,
  )
    ? candidateEvidenceId
    : undefined;
  if (candidateEvidenceId && !evidenceId) return null;
  const canonicalEvidenceSection = evidenceId
    ? entry.sections?.find((section) =>
        section.evidence?.some((evidence) => evidence.id === evidenceId),
      )
    : undefined;
  const section = canonicalEvidenceSection ?? requestedSection;
  const sectionIndex = entry.sections!.findIndex(
    (candidate) => candidate.id === section.id,
  );

  return {
    atlasState: navigationState({
      level: 3,
      activeSystemId: routeConfig.systemId,
      activePlanetId: entry.id,
      focusSection: sectionIndex,
    }),
    canonicalPath: evidenceId
      ? atlasEntryEvidencePath(entry.id, section.id, evidenceId)!
      : atlasEntrySectionPath(entry.id, section.id)!,
    entryRouteId: publicSlug(entry),
    sectionId: section.id,
    evidenceId,
  };
}

export function currentBrowserPath(): string {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function pushAtlasPath(path: string): void {
  if (typeof window === "undefined" || currentBrowserPath() === path) return;
  window.history.pushState({}, "", path);
}

export function replaceAtlasPath(path: string): void {
  if (typeof window === "undefined" || currentBrowserPath() === path) return;
  window.history.replaceState({}, "", path);
}
