import {
  atlasEntryBasePath,
  atlasSystemPath,
  parseAtlasRoute,
  type AtlasRoute,
} from "../../routing/atlasRoutes";

export type MobileAtlasOverviewDestination =
  | { kind: "atlas" }
  | {
      kind: "case-studies" | "frameworks" | "experiments";
      id: string;
    };

export interface MobileAtlasDeferredDestination {
  kind: "deeper";
  systemId: "case-studies" | "frameworks" | "experiments";
  entryId: string;
  sectionId: string;
  evidenceId?: string;
  canonicalPath: string;
}

export type MobileAtlasRouteDestination =
  | MobileAtlasOverviewDestination
  | MobileAtlasDeferredDestination;

const MOBILE_SYSTEM_IDS = [
  "case-studies",
  "frameworks",
  "experiments",
] as const;

type MobileSystemId = (typeof MOBILE_SYSTEM_IDS)[number];

function isMobileSystemId(value: string | null): value is MobileSystemId {
  return MOBILE_SYSTEM_IDS.some((systemId) => systemId === value);
}

export function mobileDestinationFromAtlasRoute(
  route: AtlasRoute | null,
): MobileAtlasRouteDestination | null {
  if (!route || route.observatory) return null;
  if (route.canonicalPath === "/") return { kind: "atlas" };

  const { activeSystemId, activePlanetId } = route.atlasState;
  const publicEntryId = route.entryRouteId ?? activePlanetId;
  if (!isMobileSystemId(activeSystemId)) return null;

  if (route.sectionId && publicEntryId) {
    return {
      kind: "deeper",
      systemId: activeSystemId,
      entryId: publicEntryId,
      sectionId: route.sectionId,
      evidenceId: route.evidenceId,
      canonicalPath: route.canonicalPath,
    };
  }

  return {
    kind: activeSystemId,
    id: publicEntryId ?? activeSystemId,
  };
}

export function mobileDestinationFromPath(
  pathname: string,
  hash = "",
): MobileAtlasRouteDestination | null {
  return mobileDestinationFromAtlasRoute(
    parseAtlasRoute({ pathname, hash }),
  );
}

export function mobileOverviewDestinationPath(
  destination: MobileAtlasOverviewDestination,
): string | null {
  if (destination.kind === "atlas") return "/";
  if (destination.id === destination.kind) {
    return atlasSystemPath(destination.kind);
  }
  return atlasEntryBasePath(destination.id);
}
