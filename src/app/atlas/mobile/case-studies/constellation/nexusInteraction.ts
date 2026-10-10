export interface NexusInteractionState {
  atlasLanding: boolean;
  localTransitionActive: boolean;
  parentNavigationReady: boolean;
}

export function isNexusInteractionReady({
  atlasLanding,
  localTransitionActive,
  parentNavigationReady,
}: NexusInteractionState) {
  return atlasLanding && !localTransitionActive && parentNavigationReady;
}
