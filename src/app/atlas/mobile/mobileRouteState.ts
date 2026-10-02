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
import {
  MOBILE_FRAMEWORKS,
  mobileFrameworkFor,
} from "./frameworks/frameworkRegistry";
import type { MobileFrameworkId } from "./frameworks/mobileFrameworkTypes";
import {
  MOBILE_EXPERIMENTS,
  mobileExperimentFor,
} from "./experiments/config/experimentsContent";
import type { MobileExperimentId } from "./experiments/experimentsTypes";

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

export interface MobileFrameworkReaderDestination {
  kind: "framework-reader";
  frameworkId: MobileFrameworkId;
  sectionId: string;
  evidenceId?: string;
  canonicalPath: string;
}

export interface MobileExperimentReaderDestination {
  kind: "experiment-reader";
  experimentId: MobileExperimentId;
  sectionId: string;
  evidenceId?: string;
  canonicalPath: string;
}

export type MobileAtlasRouteDestination =
  | MobileAtlasOverviewDestination
  | MobileCaseStudyReaderDestination
  | MobileFrameworkReaderDestination
  | MobileExperimentReaderDestination
  | MobileAtlasDeferredDestination;

export type MobileReaderHistoryIntent = "push" | "replace";

function historyIntentForReaderEvent(
  event: "reader-entry" | "section-change" | "evidence-open",
): MobileReaderHistoryIntent {
  return event === "section-change" ? "replace" : "push";
}

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

function isMobileFrameworkId(value: string): value is MobileFrameworkId {
  return MOBILE_FRAMEWORKS.some((framework) => framework.id === value);
}

function isMobileExperimentId(value: string): value is MobileExperimentId {
  return MOBILE_EXPERIMENTS.some((experiment) => experiment.id === value);
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

    if (
      activeSystemId === "frameworks" &&
      isMobileFrameworkId(publicEntryId)
    ) {
      return {
        kind: "framework-reader",
        frameworkId: publicEntryId,
        sectionId: route.sectionId,
        evidenceId: route.evidenceId,
        canonicalPath: route.canonicalPath,
      };
    }

    if (
      activeSystemId === "experiments" &&
      isMobileExperimentId(publicEntryId)
    ) {
      return {
        kind: "experiment-reader",
        experimentId: publicEntryId,
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
): MobileReaderHistoryIntent {
  return historyIntentForReaderEvent(event);
}

export function mobileFrameworkReaderEntryPath(
  frameworkId: MobileFrameworkId,
): string | null {
  const firstSection = mobileFrameworkFor(frameworkId).sections[0];
  return firstSection
    ? mobileFrameworkSectionPath(frameworkId, firstSection.id)
    : null;
}

export function mobileFrameworkSectionPath(
  frameworkId: MobileFrameworkId,
  sectionId: string,
): string | null {
  const framework = mobileFrameworkFor(frameworkId);
  if (!framework.sections.some((section) => section.id === sectionId)) {
    return null;
  }
  return atlasEntrySectionPath(frameworkId, sectionId);
}

export function mobileFrameworkEvidencePath(
  frameworkId: MobileFrameworkId,
  sectionId: string,
  evidenceId: string,
): string | null {
  const framework = mobileFrameworkFor(frameworkId);
  const sectionExists = framework.sections.some(
    (section) => section.id === sectionId,
  );
  const evidence = framework.evidence.find(
    (item) =>
      item.id === evidenceId &&
      (item.sectionId === sectionId || item.sectionId === "*"),
  );
  if (!sectionExists || !evidence) return null;
  return atlasEntryEvidencePath(frameworkId, sectionId, evidenceId);
}

export function mobileFrameworkHistoryIntent(
  event: "reader-entry" | "section-change" | "evidence-open",
): MobileReaderHistoryIntent {
  return historyIntentForReaderEvent(event);
}

export function mobileExperimentReaderEntryPath(
  experimentId: MobileExperimentId,
): string | null {
  const firstSection = mobileExperimentFor(experimentId).sections[0];
  return firstSection
    ? mobileExperimentSectionPath(experimentId, firstSection.id)
    : null;
}

export function mobileExperimentSectionPath(
  experimentId: MobileExperimentId,
  sectionId: string,
): string | null {
  const experiment = mobileExperimentFor(experimentId);
  if (!experiment.sections.some((section) => section.id === sectionId)) {
    return null;
  }
  return atlasEntrySectionPath(experimentId, sectionId);
}

export function mobileExperimentEvidencePath(
  experimentId: MobileExperimentId,
  sectionId: string,
  evidenceId: string,
): string | null {
  const experiment = mobileExperimentFor(experimentId);
  const section = experiment.sections.find(
    (candidate) => candidate.id === sectionId,
  );
  if (!section?.evidence?.some((evidence) => evidence.id === evidenceId)) {
    return null;
  }
  return atlasEntryEvidencePath(experimentId, sectionId, evidenceId);
}

export function mobileExperimentHistoryIntent(
  event: "reader-entry" | "section-change" | "evidence-open",
): MobileReaderHistoryIntent {
  return historyIntentForReaderEvent(event);
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
