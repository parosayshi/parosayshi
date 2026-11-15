import { AnimatePresence, motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon";
import { ArrowUpRightIcon } from "@phosphor-icons/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { folioProjectOrder, folioProjects, type FolioProjectId } from "../data/folioProjects";
import { PersonalEnvelope } from "./PersonalEnvelope";
import { ContactBirdFlock } from "./ContactBirdFlock";
import { ProjectBookshelf } from "./ProjectBookshelf";
import { FolioProjectViewer } from "./FolioProjectViewer";
import { PaperSurface } from "./PaperSurface";
import { WallLightShader } from "./WallLightShader";
import { trackEvent } from "../lib/analytics";

interface InvoiceFolioHomeProps {
  onOpenPlay: () => void;
  reducedMotion: boolean;
}

const RESUME_URL =
  "https://drive.google.com/file/d/1Hey3depw6La0gfbqJMN9uv8QBNtiF_qr/view?usp=drive_link";

const WALL_THEME_STORAGE_KEY = "parosayshi:wall-theme:v1";
type WallTheme = "day" | "evening" | "night";

function getInitialWallTheme(): WallTheme {
  try {
    const saved = window.localStorage.getItem(WALL_THEME_STORAGE_KEY);
    if (saved === "day" || saved === "evening" || saved === "night") return saved;
  } catch { /* Use daylight when storage is unavailable. */ }
  return "day";
}

function getFolioProjectIdFromUrl(): FolioProjectId | null {
  if (typeof window === "undefined") return null;
  const projectId = new URL(window.location.href).searchParams.get("project");
  if (projectId === "personal-letter") return "personal-letter";
  return folioProjectOrder.find((candidate) => candidate === projectId) ?? null;
}

const experienceItems = [
  {
    company: "Superr.ai",
    date: "2025—26 (Present)",
    detail:
      "Designed learning tools across classroom and student experiences, from unified search and AI notebook navigation to book creation. Worked across interface design, working prototypes, and prompt refinement for AI-generated content and imagery.",
    id: "superr",
    logo: "/assets/invoice-folio/superr-current-mark.svg",
    role: "Product design / AI learning",
  },
  {
    company: "WizCommerce",
    date: "2023—25",
    detail:
      "Shaped product direction and end-to-end design across 10+ core modules, spanning orders, payments, CRM, and AI workflows. Designed WizPay’s payment experience, supporting $5M+ in monthly transactions.",
    id: "wizcommerce",
    logo: "/assets/invoice-folio/wizcommerce-current-mark.svg",
    role: "Product design / B2B commerce",
  },
  {
    company: "Polygon (cope studio)",
    date: "2022",
    detail:
      "Explored early Web3 product concepts through research and prototyping, including collaborations with Team Liquid and Nothing.",
    id: "polygon",
    logo: "/assets/invoice-folio/polygon-current-mark.svg",
    role: "Product design intern / Web3",
  },
] as const;

const INDIA_TIME_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  hour: "2-digit",
  hourCycle: "h23",
  minute: "2-digit",
  second: "2-digit",
  timeZone: "Asia/Kolkata",
});

function LiveIndiaWatch() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const parts = Object.fromEntries(
    INDIA_TIME_FORMATTER.formatToParts(now).map(({ type, value }) => [type, value]),
  );
  const hours = Number(parts.hour);
  const minutes = Number(parts.minute);
  const seconds = Number(parts.second);
  const hourAngle = ((hours % 12) + minutes / 60 + seconds / 3600) * 30;
  const minuteAngle = (minutes + seconds / 60) * 6;
  const secondAngle = seconds * 6;

  return (
    <div
      aria-label={`Casio MW-240 showing ${INDIA_TIME_FORMATTER.format(now)} India time`}
      className="folio-experience__watch"
      role="img"
    >
      <img alt="" aria-hidden="true" src="/assets/invoice-folio/receipt-casio-mw240-7ev-dial.png" />
      <span aria-hidden="true" className="folio-experience__watch-dial">
        <span className="folio-experience__watch-hand folio-experience__watch-hand--hour" style={{ transform: `translateX(-50%) rotate(${hourAngle}deg)` }} />
        <span className="folio-experience__watch-hand folio-experience__watch-hand--minute" style={{ transform: `translateX(-50%) rotate(${minuteAngle}deg)` }} />
        <span className="folio-experience__watch-hand folio-experience__watch-hand--second" style={{ transform: `translateX(-50%) rotate(${secondAngle}deg)` }} />
        <span className="folio-experience__watch-pin" />
      </span>
    </div>
  );
}

export function InvoiceFolioHome({ reducedMotion }: InvoiceFolioHomeProps) {
  const [wallTheme] = useState<WallTheme>(getInitialWallTheme);
  const [expandedExperienceId, setExpandedExperienceId] = useState<string | null>(null);
  const [experienceReceiptHeight, setExperienceReceiptHeight] = useState<number | null>(null);
  const [activeFolioProjectId, setActiveFolioProjectId] = useState<FolioProjectId | null>(getFolioProjectIdFromUrl);
  const folioProjectTriggerRef = useRef<HTMLButtonElement | null>(null);
  const lastFolioProjectIdRef = useRef<FolioProjectId | null>(activeFolioProjectId);
  const experienceReceiptContentRef = useRef<HTMLDivElement>(null);
  const experiencePlacementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.dataset.wallTheme = wallTheme;
    try {
      window.localStorage.setItem(WALL_THEME_STORAGE_KEY, wallTheme);
    } catch {
      // Theme changes remain available without persistence.
    }
    return () => {
      delete document.body.dataset.wallTheme;
    };
  }, [wallTheme]);


  const restoreProjectTriggerFocus = useCallback(() => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const fallbackTrigger = lastFolioProjectIdRef.current
          ? document.querySelector<HTMLButtonElement>(`[data-folio-project="${lastFolioProjectIdRef.current}"]`)
          : null;
        (folioProjectTriggerRef.current ?? fallbackTrigger)?.focus({ preventScroll: true });
      });
    });
  }, []);

  useEffect(() => {
    const syncProjectFromUrl = () => {
      const nextProjectId = getFolioProjectIdFromUrl();
      if (nextProjectId) lastFolioProjectIdRef.current = nextProjectId;
      setActiveFolioProjectId(nextProjectId);
      if (!nextProjectId) restoreProjectTriggerFocus();
    };

    window.addEventListener("popstate", syncProjectFromUrl);
    return () => window.removeEventListener("popstate", syncProjectFromUrl);
  }, [restoreProjectTriggerFocus]);

  useLayoutEffect(() => {
    const content = experienceReceiptContentRef.current;
    if (!content) return undefined;

    const measure = () => setExperienceReceiptHeight(content.offsetHeight);
    const observer = new ResizeObserver(measure);
    measure();
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  const openFolioProject = (projectId: FolioProjectId, trigger: HTMLButtonElement) => {
    trackEvent("project_open", {
      project_id: projectId,
      project_title: folioProjects[projectId].title,
    });
    folioProjectTriggerRef.current = trigger;
    lastFolioProjectIdRef.current = projectId;
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("project", projectId);
    window.history.pushState(
      { ...window.history.state, folioProjectViewer: projectId },
      "",
      nextUrl,
    );
    setActiveFolioProjectId(projectId);
  };

  const closeFolioProject = () => {
    if (
      activeFolioProjectId
      && window.history.state?.folioProjectViewer === activeFolioProjectId
    ) {
      window.history.back();
      return;
    }

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.delete("project");
    const nextState = { ...window.history.state };
    delete nextState.folioProjectViewer;
    window.history.replaceState(nextState, "", nextUrl);
    setActiveFolioProjectId(null);
    restoreProjectTriggerFocus();
  };

  return (
    <>
    <main
      aria-hidden={activeFolioProjectId ? true : undefined}
      data-paper-open={activeFolioProjectId === "superr-paper" || activeFolioProjectId === "wizpay" || activeFolioProjectId === "wiz-commerce" || activeFolioProjectId === "journal-desk" || activeFolioProjectId === "personal-letter" ? "true" : undefined}
      className="invoice-folio invoice-folio--wall"
      data-reduced-motion={reducedMotion ? "true" : "false"}
      data-wall-theme={wallTheme}
      inert={activeFolioProjectId ? true : undefined}
    >
      <div aria-hidden="true" className="folio-scroll-blur" />
      <WallLightShader
        blossom
        paused={activeFolioProjectId !== null && activeFolioProjectId !== "superr-paper" && activeFolioProjectId !== "wizpay" && activeFolioProjectId !== "wiz-commerce" && activeFolioProjectId !== "journal-desk"}
        glowColor={wallTheme === "night" ? "#b38bae" : "#ef96b7"}
        glowStrength={0}
        lightColor={wallTheme === "night" ? "#dbc9e7" : "#ffe1bd"}
        reducedMotion={reducedMotion}
        wallColor={wallTheme === "night" ? "#0b0f18" : wallTheme === "evening" ? "#f0c7b1" : "#fffaf7"}
      />
      <PaperSurface />
      <div className="folio-resume-sticker">
        <svg aria-hidden="true" width="0" height="0" style={{ position: "absolute" }}>
          <defs>
            <clipPath id="resume-ribbon-outline" clipPathUnits="objectBoundingBox">
              <path d="M0 0 H1 V.965 Q1 .999 .95 .98 L.525 .85 Q.5 .842 .475 .85 L.05 .98 Q0 .999 0 .965 Z" />
            </clipPath>
          </defs>
        </svg>
        <a className="folio-resume-sticker__link" href={RESUME_URL} target="_blank" rel="noopener noreferrer" aria-label="View résumé" onClick={() => trackEvent("resume_click", { placement: "floating_badge" })}>
          <span className="folio-resume-sticker__caption">Resume</span>
        </a>
      </div>

      <header className="shelf-intro" id="home">
        <h1>Hi, I’m Parth. <img src="/assets/polaroid.jpeg" alt="" /></h1>
        <p>I’m a product designer. I’ve designed tools for classrooms and wholesale teams, and lately I’ve been building things of my own.</p>
        <svg aria-hidden="true" className="wall-folio__signature-filter" focusable="false">
          <defs>
            <filter
              colorInterpolationFilters="sRGB"
              height="120%"
              id="signature-engraved"
              width="120%"
              x="-10%"
              y="-10%"
            >
              <feFlood floodColor={wallTheme === "night" ? "#05080d" : "#242320"} floodOpacity="0.9" result="blackInk" />
              <feComposite in="blackInk" in2="SourceAlpha" operator="in" result="blackSignature" />

              <feGaussianBlur in="SourceAlpha" result="softAlpha" stdDeviation="0.3" />
              <feOffset dx="0.45" dy="1.1" in="softAlpha" result="raisedAlpha" />
              <feComposite
                in="SourceAlpha"
                in2="raisedAlpha"
                k2="1"
                k3="-1"
                operator="arithmetic"
                result="lowerInnerEdge"
              />
              <feFlood floodColor={wallTheme === "night" ? "#010307" : "#090909"} floodOpacity="0.82" result="edgeLight" />
              <feComposite in="edgeLight" in2="lowerInnerEdge" operator="in" result="engravedHighlight" />

              <feOffset dx="0.35" dy="1" in="SourceAlpha" result="rimOffset" />
              <feComposite in="rimOffset" in2="SourceAlpha" operator="out" result="rimEdge" />
              <feFlood floodColor={wallTheme === "night" ? "#a3b4cc" : "#fffaf1"} floodOpacity={wallTheme === "night" ? "0.2" : "0.8"} result="rimLight" />
              <feComposite in="rimLight" in2="rimEdge" operator="in" result="litRim" />

              <feOffset dx="-0.25" dy="-0.65" in="SourceAlpha" result="innerLightOffset" />
              <feComposite in="SourceAlpha" in2="innerLightOffset" operator="out" result="innerLightEdge" />
              <feFlood floodColor="#ffffff" floodOpacity="0.28" result="innerLight" />
              <feComposite in="innerLight" in2="innerLightEdge" operator="in" result="innerHighlight" />

              <feMerge>
                <feMergeNode in="litRim" />
                <feMergeNode in="blackSignature" />
                <feMergeNode in="engravedHighlight" />
                <feMergeNode in="innerHighlight" />
              </feMerge>
            </filter>
          </defs>
        </svg>
        <img
          alt="Parth's signature"
          className="wall-folio__signature"
          draggable={false}
          src="/assets/parth-signature.png"
        />
      </header>

      <ProjectBookshelf onOpen={openFolioProject} />

      <section aria-labelledby="experience-receipt-title" className="folio-experience" id="resume">
        <motion.div
          className="folio-experience__receipt-placement"
          ref={experiencePlacementRef}
          style={{ rotate: -1.5 }}
        >
          <motion.div
            animate={experienceReceiptHeight === null ? undefined : { height: experienceReceiptHeight }}
            className="folio-experience__receipt"
            initial={false}
            transition={reducedMotion ? { duration: 0 } : {
              height: {
                damping: 25,
                mass: 0.7,
                stiffness: 500,
                type: "spring",
              },
            }}
          >
          <div className="folio-experience__receipt-content" ref={experienceReceiptContentRef}>
          {/* <LiveIndiaWatch /> */}
          <a
            aria-label="View résumé"
            className="folio-experience__download"
            href={RESUME_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="View résumé"
          >
            <ArrowUpRightIcon aria-hidden="true" size={18} weight="regular" />
            <span>Resume</span>
          </a>
          <h2 id="experience-receipt-title">Experience</h2>
          <ol>
            {experienceItems.map((item) => {
              const expanded = expandedExperienceId === item.id;
              const detailId = `experience-${item.id}-detail`;

              return (
                <motion.li
                  key={item.id}
                  layout={reducedMotion ? false : "position"}
                  transition={reducedMotion ? { duration: 0 } : {
                    layout: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
                  }}
                >
                  <button
                    aria-controls={detailId}
                    aria-expanded={expanded}
                    className="folio-experience__row"
                    onClick={() => setExpandedExperienceId(expanded ? null : item.id)}
                    type="button"
                  >
                    <img alt="" aria-hidden="true" src={item.logo} />
                    <strong>{item.company}</strong>
                    <small>{item.role}</small>
                    <time>{item.date}</time>
                    <HugeiconsIcon aria-hidden="true" className="folio-experience__chevron" icon={ArrowDown01Icon} size={18} strokeWidth={2.4} />
                  </button>
                  <AnimatePresence initial={false} mode="popLayout">
                    {expanded ? (
                      <motion.div
                        animate={{ opacity: 1 }}
                        className="folio-experience__intro-shell"
                        exit={{ opacity: 0 }}
                        id={detailId}
                        initial={reducedMotion ? false : { opacity: 0 }}
                        transition={reducedMotion ? { duration: 0 } : {
                          duration: 0.24,
                          ease: [0.4, 0, 0.2, 1],
                        }}
                      >
                        <p className="folio-experience__intro">{item.detail}</p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.li>
              );
            })}
          </ol>
          <motion.p
            className="folio-experience__education"
            layout={reducedMotion ? false : "position"}
            transition={reducedMotion ? { duration: 0 } : {
              layout: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
            }}
          >
            <span>IIIT Nagpur</span>
            <span>B.Tech / CS major</span>
            <time>2019—23</time>
          </motion.p>
          </div>
          </motion.div>
        </motion.div>
      </section>

      <PersonalEnvelope onOpen={(event) => openFolioProject("personal-letter", event.currentTarget)} />

      <motion.section
        aria-label="Contact"
        className="folio-contact"
        id="contact"
      >
        <ContactBirdFlock reducedMotion={reducedMotion} theme={wallTheme === "night" ? "night" : "day"} />
      </motion.section>
    </main>
    {typeof document !== "undefined" ? createPortal(
      <AnimatePresence>
        {activeFolioProjectId ? (
          <FolioProjectViewer
            key={activeFolioProjectId}
            openingSpine={folioProjectTriggerRef.current?.dataset.folioProject === activeFolioProjectId ? folioProjectTriggerRef.current : null}
            onClose={closeFolioProject}
            project={folioProjects[activeFolioProjectId]}
            reducedMotion={reducedMotion}
          />
        ) : null}
      </AnimatePresence>,
      document.body,
    ) : null}
    </>
  );
}
