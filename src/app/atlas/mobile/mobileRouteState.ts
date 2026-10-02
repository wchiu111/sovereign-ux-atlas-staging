import {
  atlasEntryBasePath,
  atlasEntryEvidencePath,
  atlasEntrySectionPath,
  atlasSystemPath,
  parseAtlasRoute,
  type AtlasRoute,
} from "../../routing/atlasRoutes";
import { mobileCaseStudyDocumentFor } from "./reading/caseStudyReadingRegistry";
import type { MobileCaseStudyProjectId } from "./reading/mobileReadingTypes";

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

export interface MobileCaseStudyReaderDestination {
  kind: "case-study-reader";
  projectId: MobileCaseStudyProjectId;
  sectionId: string;
  evidenceId?: string;
  canonicalPath: string;
}

export type MobileAtlasRouteDestination =
  | MobileAtlasOverviewDestination
  | MobileCaseStudyReaderDestination
  | MobileAtlasDeferredDestination;

export type MobileCaseStudyHistoryIntent = "push" | "replace";

const MOBILE_CASE_STUDY_IDS = [
  "agentic-insurance",
  "globality",
  "oracle",
  "sovereign-atlas",
] as const satisfies readonly MobileCaseStudyProjectId[];

function isMobileCaseStudyProjectId(
  value: string,
): value is MobileCaseStudyProjectId {
  return MOBILE_CASE_STUDY_IDS.some((projectId) => projectId === value);
}

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
    if (
      activeSystemId === "case-studies" &&
      isMobileCaseStudyProjectId(publicEntryId)
    ) {
      return {
        kind: "case-study-reader",
        projectId: publicEntryId,
        sectionId: route.sectionId,
        evidenceId: route.evidenceId,
        canonicalPath: route.canonicalPath,
      };
    }

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

export function mobileCaseStudyReaderEntryPath(
  projectId: MobileCaseStudyProjectId,
): string | null {
  const firstSection = mobileCaseStudyDocumentFor(projectId).sections[0];
  return firstSection
    ? mobileCaseStudySectionPath(projectId, firstSection.id)
    : null;
}

export function mobileCaseStudySectionPath(
  projectId: MobileCaseStudyProjectId,
  sectionId: string,
): string | null {
  const document = mobileCaseStudyDocumentFor(projectId);
  if (!document.sections.some((section) => section.id === sectionId)) {
    return null;
  }
  return atlasEntrySectionPath(projectId, sectionId);
}

export function mobileCaseStudyEvidencePath(
  projectId: MobileCaseStudyProjectId,
  sectionId: string,
  evidenceId: string,
): string | null {
  const document = mobileCaseStudyDocumentFor(projectId);
  const evidence = document.evidence.find(
    (item) => item.id === evidenceId && item.sectionId === sectionId,
  );
  if (!evidence) return null;
  return atlasEntryEvidencePath(projectId, sectionId, evidenceId);
}

export function mobileCaseStudyHistoryIntent(
  event: "reader-entry" | "section-change" | "evidence-open",
): MobileCaseStudyHistoryIntent {
  return event === "section-change" ? "replace" : "push";
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
