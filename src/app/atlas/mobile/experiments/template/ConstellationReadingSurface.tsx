import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { T } from "../../components/mobileShared";
import MobileReadingHeader from "../../reading/MobileReadingHeader";
import ConstellationSectionRail from "./ConstellationSectionRail";
import ConstellationEvidenceStrip from "./ConstellationEvidenceStrip";
import ConstellationEvidenceViewer from "./ConstellationEvidenceViewer";
import type {
  ConstellationEvidence,
  ConstellationItem,
  ConstellationSection,
} from "./constellationTypes";

function evidenceTriggerId(
  itemId: string,
  sectionId: string,
  evidenceId: string,
) {
  return `evidence-${itemId}-${sectionId}-${evidenceId}`.replace(
    /[^a-zA-Z0-9-_]/g,
    "-",
  );
}

export default function ConstellationReadingSurface<TId extends string>({
  item,
  domainColor,
  insightLabel = "EXPERIMENT INSIGHT",
  initialSectionId,
  initialEvidenceId,
  routeRestoreKey = 0,
  onActiveSectionChange,
  onEvidenceOpen,
  onEvidenceChange,
  onEvidenceClose,
  onBack,
  renderSectionExtras,
}: {
  item: ConstellationItem<TId>;
  domainColor: string;
  insightLabel?: string;
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
  renderSectionExtras?: (
    section: ConstellationSection,
  ) => ReactNode;
}) {
  const sections = item.sections;
  const scrollRef = useRef<HTMLDivElement>(null);
  const chromeRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef(new Map<string, HTMLElement>());
  const resolvedInitialSection =
    sections.find((section) => section.id === initialSectionId) ?? sections[0];
  const resolvedInitialEvidenceIndex = initialEvidenceId
    ? (resolvedInitialSection?.evidence ?? []).findIndex(
        (evidence) => evidence.id === initialEvidenceId,
      )
    : -1;
  const resolvedInitialEvidence =
    resolvedInitialSection && resolvedInitialEvidenceIndex >= 0
      ? {
          section: resolvedInitialSection,
          index: resolvedInitialEvidenceIndex,
          triggerId: evidenceTriggerId(
            item.id,
            resolvedInitialSection.id,
            initialEvidenceId!,
          ),
        }
      : null;

  const [activeId, setActiveId] = useState(
    resolvedInitialSection?.id ?? "",
  );
  const [headerElevated, setHeaderElevated] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [chromeHeight, setChromeHeight] = useState(114);
  const [isExiting, setIsExiting] = useState(false);
  const [activeEvidence, setActiveEvidence] = useState<{
    section: ConstellationSection;
    index: number;
    triggerId: string;
  } | null>(resolvedInitialEvidence);
  const exitTimerRef = useRef<number | null>(null);
  const restoringRouteRef = useRef(true);

  const sectionIds = useMemo(
    () => sections.map((section) => section.id),
    [sections],
  );

  useEffect(() => {
    restoringRouteRef.current = true;
    setActiveId(resolvedInitialSection?.id ?? "");
    setActiveEvidence(resolvedInitialEvidence);

    const positionRequestedSection = () => {
      if (!resolvedInitialSection) return;
      const node = sectionRefs.current.get(resolvedInitialSection.id);
      const scroller = scrollRef.current;
      if (!node || !scroller) return;

      const scrollerTop = scroller.getBoundingClientRect().top;
      const nodeTop = node.getBoundingClientRect().top;
      scroller.scrollTo({
        top: scroller.scrollTop + nodeTop - scrollerTop - 2,
        behavior: "auto",
      });
    };
    const frame = requestAnimationFrame(positionRequestedSection);
    const layoutTimer = window.setTimeout(positionRequestedSection, 160);
    const settleTimer = window.setTimeout(() => {
      positionRequestedSection();
      restoringRouteRef.current = false;
    }, 420);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(layoutTimer);
      window.clearTimeout(settleTimer);
    };
  }, [item.id, routeRestoreKey]);

  useEffect(() => {
    onActiveSectionChange?.(activeId);
  }, [activeId, onActiveSectionChange]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPrefersReducedMotion(media.matches);
    sync();
    media.addEventListener?.("change", sync);
    return () => media.removeEventListener?.("change", sync);
  }, []);

  useEffect(() => {
    const chrome = chromeRef.current;
    if (!chrome) return;

    const updateChromeHeight = () => {
      const nextHeight = Math.ceil(chrome.getBoundingClientRect().height);
      if (nextHeight > 0) setChromeHeight(nextHeight);
    };

    updateChromeHeight();

    const observer = new ResizeObserver(updateChromeHeight);
    observer.observe(chrome);
    window.addEventListener("resize", updateChromeHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateChromeHeight);
    };
  }, []);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller || sectionIds.length === 0) return;

    let frame = 0;

    const updateActiveSection = () => {
      cancelAnimationFrame(frame);
      setHeaderElevated(scroller.scrollTop > 12);
      if (restoringRouteRef.current) return;

      frame = requestAnimationFrame(() => {
        const rootTop = scroller.getBoundingClientRect().top;
        const activationLine = rootTop + 156;

        let bestId = sectionIds[0];
        let bestDistance = Number.POSITIVE_INFINITY;

        for (const id of sectionIds) {
          const node = sectionRefs.current.get(id);
          if (!node) continue;

          const rect = node.getBoundingClientRect();
          const distance = Math.abs(rect.top - activationLine);

          if (
            rect.top <= activationLine + 24 &&
            distance < bestDistance
          ) {
            bestId = id;
            bestDistance = distance;
          }
        }

        const lastId = sectionIds[sectionIds.length - 1];
        const lastNode = sectionRefs.current.get(lastId);

        if (
          lastNode &&
          scroller.scrollTop + scroller.clientHeight >=
            scroller.scrollHeight - 24
        ) {
          bestId = lastId;
        }

        setActiveId(bestId);
      });
    };

    updateActiveSection();
    scroller.addEventListener("scroll", updateActiveSection, {
      passive: true,
    });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      cancelAnimationFrame(frame);
      scroller.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [sectionIds]);

  const requestBack = () => {
    if (isExiting) return;
    setIsExiting(true);

    const duration = prefersReducedMotion ? 140 : 280;
    exitTimerRef.current = window.setTimeout(() => {
      exitTimerRef.current = null;
      onBack();
    }, duration);
  };

  useEffect(() => {
    return () => {
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && activeEvidence === null) {
        requestBack();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const closeEvidence = () => {
    const sectionId = activeEvidence?.section.id;
    const triggerId = activeEvidence?.triggerId;
    setActiveEvidence(null);
    if (sectionId) onEvidenceClose?.(sectionId);

    if (triggerId) {
      requestAnimationFrame(() => {
        document.getElementById(triggerId)?.focus({
          preventScroll: true,
        });
      });
    }
  };

  const scrollToSection = (id: string) => {
    const node = sectionRefs.current.get(id);
    const scroller = scrollRef.current;
    if (!node || !scroller) return;

    setActiveId(id);

    const scrollerTop = scroller.getBoundingClientRect().top;
    const nodeTop = node.getBoundingClientRect().top;
    const target =
      scroller.scrollTop + nodeTop - scrollerTop - 2;

    scroller.scrollTo({
      top: target,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  return (
    <div
      className="atlas-template-reading"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background:
          "linear-gradient(to bottom, rgba(5,5,10,0.72), rgba(5,5,10,0.99) 180px)",
        color: T.body,
        opacity: isExiting ? 0 : 1,
        transition: prefersReducedMotion
          ? "opacity 140ms ease"
          : "opacity 260ms ease",
        pointerEvents: isExiting ? "none" : "auto",
      }}
    >
      <style>{`
        .atlas-template-reading .mobile-reading-focusable:focus-visible {
          outline: 1.5px solid ${domainColor} !important;
          outline-offset: 3px;
        }

        .atlas-template-reading-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .atlas-template-reading-scroll::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
        }

        @media (min-width: 431px) {
          .atlas-template-reading {
            max-width: 430px;
            margin: 0 auto;
            left: 50% !important;
            right: auto !important;
            width: min(100%, 430px);
            transform: translateX(-50%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .atlas-template-reading *,
          .atlas-template-reading *::before,
          .atlas-template-reading *::after {
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
          }
        }
      `}</style>

      <div
        ref={chromeRef}
        style={{
          position: "absolute",
          inset: "0 0 auto 0",
          zIndex: 10,
        }}
      >
        <MobileReadingHeader
          title={item.title}
          onBack={requestBack}
          elevated={headerElevated}
        />

        <ConstellationSectionRail
          sections={sections}
          activeId={activeId}
          color={domainColor}
          ariaLabel={`${item.title} experiment sections`}
          onSelect={scrollToSection}
        />
      </div>

      <div
        ref={scrollRef}
        className="atlas-template-reading-scroll"
        role="main"
        aria-label={`${item.title} experiment reading`}
        style={{
          position: "absolute",
          top: chromeHeight,
          right: 0,
          bottom: 0,
          left: 0,
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          overscrollBehaviorY: "contain",
        }}
      >
        {sections.map((section) => (
          <section
            key={section.id}
            ref={(node) => {
              if (node) sectionRefs.current.set(section.id, node);
              else sectionRefs.current.delete(section.id);
            }}
            data-section-id={section.id}
            style={{
              scrollMarginTop: 138,
              padding:
                "clamp(32px, 8.4vw, 38px) clamp(24px, 6.8vw, 28px) clamp(52px, 13vw, 60px)",
              borderBottom:
                "0.5px solid rgba(232,213,163,0.08)",
            }}
          >
            <div style={{ marginBottom: 18 }}>
              <h2
                style={{
                  margin: "0 0 10px",
                  fontFamily: T.serif,
                  fontSize: "clamp(28px, 7.4vw, 32px)",
                  fontWeight: 600,
                  lineHeight: 1.08,
                  color: "#F0E9D8",
                }}
              >
                {section.label
                  .toLowerCase()
                  .replace(/\b\w/g, (letter) =>
                    letter.toUpperCase(),
                  )}
              </h2>

              <div
                style={{
                  fontFamily: T.serif,
                  fontSize: 17.5,
                  lineHeight: 1.3,
                  color: T.accentGold,
                  opacity: 0.88,
                }}
              >
                {section.subtitle}
              </div>
            </div>

            <div
              style={{
                height: 0.5,
                background: "rgba(232,213,163,0.10)",
                marginBottom: 22,
              }}
            />

            {section.content.split("\n\n").map((paragraph, index) => (
              <p
                key={index}
                style={{
                  margin: "0 0 17px",
                  fontFamily: T.serif,
                  fontSize: "clamp(14.5px, 3.85vw, 15.5px)",
                  color: "#F0E9D8",
                  opacity: 0.84,
                  lineHeight: 1.72,
                  whiteSpace: "pre-line",
                }}
              >
                {paragraph}
              </p>
            ))}

            {section.evidence && section.evidence.length > 0 && (
              <ConstellationEvidenceStrip
                evidence={section.evidence}
                domainColor={domainColor}
                itemId={item.id}
                sectionId={section.id}
                onInspect={(index, triggerId) => {
                  const evidence = section.evidence?.[index];
                  setActiveEvidence({
                    section,
                    index,
                    triggerId,
                  });
                  if (evidence) onEvidenceOpen?.(section.id, evidence);
                }}
              />
            )}

            <aside
              style={{
                borderLeft: `1.5px solid ${domainColor}4D`,
                paddingLeft: 15,
                margin: "26px 0 24px",
              }}
            >
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: 7,
                  letterSpacing: "0.18em",
                  color: domainColor,
                  opacity: 0.72,
                  marginBottom: 8,
                }}
              >
                {insightLabel}
              </div>

              <div
                style={{
                  fontFamily: T.serif,
                  fontSize: 13.25,
                  color: T.body,
                  opacity: 0.78,
                  lineHeight: 1.6,
                  fontStyle: "italic",
                }}
              >
                “{section.insight}”
              </div>
            </aside>

            {renderSectionExtras?.(section)}
          </section>
        ))}

        <div
          style={{
            padding:
              "clamp(42px, 11vw, 50px) clamp(22px, 6.6vw, 28px) calc(72px + env(safe-area-inset-bottom))",
            fontFamily: T.mono,
            fontSize: 8,
            letterSpacing: "0.16em",
            color: domainColor,
            opacity: 0.48,
          }}
        >
          END OF EXPERIMENT
        </div>
      </div>

      {activeEvidence &&
        activeEvidence.section.evidence &&
        activeEvidence.section.evidence.length > 0 && (
          <ConstellationEvidenceViewer
            items={activeEvidence.section.evidence}
            index={activeEvidence.index}
            sectionLabel={activeEvidence.section.label}
            domainColor={domainColor}
            onIndexChange={(index) => {
              const evidence = activeEvidence.section.evidence?.[index];
              setActiveEvidence((current) =>
                current
                  ? {
                      ...current,
                      index,
                    }
                  : current,
              );
              if (evidence) {
                onEvidenceChange?.(activeEvidence.section.id, evidence);
              }
            }}
            onClose={closeEvidence}
          />
        )}
    </div>
  );
}
