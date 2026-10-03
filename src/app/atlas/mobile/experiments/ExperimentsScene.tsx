import { W, H } from "../components/mobileShared";
import AtlasOverviewChrome from "../overview/AtlasOverviewChrome";
import AtlasOverviewFrame from "../overview/AtlasOverviewFrame";
import {
  DEFAULT_MOBILE_EXPERIMENT_ID,
  mobileExperimentFor,
} from "./config/experimentsContent";
import { EXPERIMENTS_TEMPLATE } from "./config/experimentsConfig";
import { EXPERIMENTS_MOTION } from "./config/experimentsMotion";
import ExperimentsOverviewConstellation from "./constellation/ExperimentsOverviewConstellation";
import type {
  ExperimentOverviewId,
  MobileExperimentId,
} from "./experimentsTypes";
import type { ConstellationEvidence } from "./template/constellationTypes";
import ExperimentsPreviewDrawer from "./surfaces/ExperimentsPreviewDrawer";
import ConstellationReadingSurface from "./template/ConstellationReadingSurface";
import useConstellationChoreography from "./template/useConstellationChoreography";

export type ExperimentsSceneState =
  | "experiments-focus"
  | "experiment-reading";

interface ExperimentsSceneProps {
  state: ExperimentsSceneState;
  activeExperimentId?: MobileExperimentId;
  initialExperimentId?: MobileExperimentId | null;
  returnExperimentId?: MobileExperimentId | null;
  viewportUiTarget?: HTMLElement | null;
  onSelectExperiment?: (id: MobileExperimentId) => void;
  onOverviewSelection?: (id: ExperimentOverviewId) => void;
  onExplore?: (id: MobileExperimentId) => void;
  onReturnExperimentComplete?: () => void;
  initialSectionId?: string | null;
  initialEvidenceId?: string | null;
  routeRestoreKey?: number;
  onActiveSectionChange?: (sectionId: string) => void;
  onEvidenceOpen?: (
    sectionId: string,
    evidence: ConstellationEvidence,
  ) => void;
  onEvidenceChange?: (
    sectionId: string,
    evidence: ConstellationEvidence,
  ) => void;
  onEvidenceClose?: (sectionId: string) => void;
  onBack: () => void;
}

function ExperimentsOverviewMode({
  initialExperimentId,
  returnExperimentId,
  viewportUiTarget,
  onSelectExperiment,
  onOverviewSelection,
  onExplore,
  onReturnExperimentComplete,
  onBack,
}: {
  initialExperimentId: MobileExperimentId | null;
  returnExperimentId: MobileExperimentId | null;
  viewportUiTarget: HTMLElement | null;
  onSelectExperiment: (id: MobileExperimentId) => void;
  onOverviewSelection: (id: ExperimentOverviewId) => void;
  onExplore: (id: MobileExperimentId) => void;
  onReturnExperimentComplete?: () => void;
  onBack: () => void;
}) {
  const {
    selectedId,
    drawerItemId,
    drawerPhase,
    selectionPulseId,
    labelsVisible,
    chromeVisible,
    drawerVisible,
    prefersReducedMotion,
    ambientPaused,
    focusedEntryItemId,
    focusedEntryProgress,
    isReturningFromReading,
    focusedReturnProgress,
    selectOverviewItem,
    enterFocusedReading,
  } = useConstellationChoreography({
    parentId: EXPERIMENTS_TEMPLATE.parent.id,
    motion: EXPERIMENTS_MOTION,
    returnItemId: returnExperimentId,
    initialItemId: initialExperimentId,
    onCommit: (id) => {
      onSelectExperiment(id);
      onExplore(id);
    },
    onSelection: onOverviewSelection,
    onReturnComplete: onReturnExperimentComplete,
  });

  const drawerItem =
    drawerItemId === EXPERIMENTS_TEMPLATE.parent.id
      ? null
      : mobileExperimentFor(drawerItemId as MobileExperimentId);

  return (
    <>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        style={{ position: "absolute", inset: 0 }}
        aria-label="Experiments constellation"
      >
        <ExperimentsOverviewConstellation
          selectedId={selectedId as ExperimentOverviewId}
          selectionPulseId={
            selectionPulseId as ExperimentOverviewId | null
          }
          ambientPaused={ambientPaused}
          labelsVisible={labelsVisible}
          focusedEntryId={focusedEntryItemId}
          focusedEntryProgress={focusedEntryProgress}
          focusedReturnId={
            isReturningFromReading ? returnExperimentId : null
          }
          focusedReturnProgress={focusedReturnProgress}
          reducedMotion={prefersReducedMotion}
          onSelect={(id) =>
            selectOverviewItem(id as ExperimentOverviewId)
          }
        />
      </svg>

      <AtlasOverviewFrame
        target={viewportUiTarget}
        chrome={
          <AtlasOverviewChrome
            label="EXPERIMENTS"
            ariaLabel="Return from Experiments to Atlas"
            visible={chromeVisible}
            interactive={!focusedEntryItemId}
            onBack={onBack}
          />
        }
        narrative={
          <ExperimentsPreviewDrawer
            item={drawerItem}
            phase={drawerPhase}
            arrivalVisible={drawerVisible}
            reducedMotion={prefersReducedMotion}
            closeDurationMs={EXPERIMENTS_MOTION.drawerCloseMs}
            reducedDurationMs={EXPERIMENTS_MOTION.drawerReducedMs}
            onExplore={() => {
              if (
                selectedId !== EXPERIMENTS_TEMPLATE.parent.id
              ) {
                enterFocusedReading(
                  selectedId as MobileExperimentId,
                );
              }
            }}
          />
        }
      />
    </>
  );
}

export default function ExperimentsScene({
  state,
  activeExperimentId = DEFAULT_MOBILE_EXPERIMENT_ID,
  initialExperimentId = null,
  returnExperimentId = null,
  viewportUiTarget = null,
  onSelectExperiment = () => {},
  onOverviewSelection = () => {},
  onExplore = () => {},
  onReturnExperimentComplete,
  initialSectionId = null,
  initialEvidenceId = null,
  routeRestoreKey = 0,
  onActiveSectionChange,
  onEvidenceOpen,
  onEvidenceChange,
  onEvidenceClose,
  onBack,
}: ExperimentsSceneProps) {
  const activeExperiment = mobileExperimentFor(activeExperimentId);

  if (state === "experiment-reading") {
    return (
      <ConstellationReadingSurface
        item={activeExperiment}
        domainColor={EXPERIMENTS_TEMPLATE.parent.color}
        initialSectionId={initialSectionId}
        initialEvidenceId={initialEvidenceId}
        routeRestoreKey={routeRestoreKey}
        onActiveSectionChange={onActiveSectionChange}
        onEvidenceOpen={onEvidenceOpen}
        onEvidenceChange={onEvidenceChange}
        onEvidenceClose={onEvidenceClose}
        onBack={onBack}
      />
    );
  }

  return (
    <ExperimentsOverviewMode
      initialExperimentId={initialExperimentId}
      returnExperimentId={returnExperimentId}
      viewportUiTarget={viewportUiTarget}
      onSelectExperiment={onSelectExperiment}
      onOverviewSelection={onOverviewSelection}
      onExplore={onExplore}
      onReturnExperimentComplete={onReturnExperimentComplete}
      onBack={onBack}
    />
  );
}
