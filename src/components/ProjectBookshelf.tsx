import { useLayoutEffect, useRef } from "react";
import { folioProjects, type FolioProjectId } from "../data/folioProjects";
import "../styles/project-bookshelf.css";

const books = [
  { id: "superr-paper", logo: "/assets/invoice-folio/superr-official-logo.svg", subject: "Finding a lesson again" },
  { id: "wizpay", logo: "/assets/invoice-folio/wizcommerce-current-mark.svg", subject: "An order today. A payment later." },
  { id: "wiz-commerce", logo: "/assets/invoice-folio/wizcommerce-current-mark.svg", subject: "What a rep needs on a sales call" },
  { id: "journal-desk", logo: "/assets/invoice-folio/journal-desk-case-study/favicon.png", subject: "A writing desk of my own" },
] as const;

export function ProjectBookshelf({ onOpen }: {
  onOpen: (id: FolioProjectId, trigger: HTMLButtonElement) => void;
}) {
  const stackRef = useRef<HTMLUListElement>(null);
  useLayoutEffect(() => {
    const stack = stackRef.current;
    if (!stack || !("IntersectionObserver" in window)) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) return;

    const rows = Array.from(stack.children) as HTMLLIElement[];
    let settling: Animation | undefined;
    stack.dataset.awaitingEntry = "true";
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting)
        .map(entry => entry.target as HTMLLIElement)
        .sort((a, b) => rows.indexOf(a) - rows.indexOf(b));
      if (!visible.length) return;
      visible.forEach((row, index) => {
        row.style.setProperty("--delay", `${(visible.length - index) * 50}ms`);
        row.dataset.entered = "true";
        observer.unobserve(row);
      });

      if (!settling) {
        const landing = visible.length * 50;
        const duration = landing + 1000;
        const frames: Keyframe[] = visible.map((_, index) => ({
          transform: `translateY(${index * 4}px)`, offset: index * 50 / duration,
        }));
        frames.push(
          { transform: `translateY(${visible.length * 4 + 16}px)`, offset: landing / duration, easing: "cubic-bezier(.19,1,.22,1)" },
          { transform: "none", offset: 1 },
        );
        settling = stack.animate(frames, { duration, delay: 250 });
      }
    }, { threshold: 0.05 });
    rows.forEach(row => observer.observe(row));
    const stop = () => {
      observer.disconnect();
      settling?.cancel();
      delete stack.dataset.awaitingEntry;
    };
    motion.addEventListener("change", stop);
    return () => {
      stop();
      motion.removeEventListener("change", stop);
    };
  }, []);

  return (
    <ul className="project-bookshelf__stack" ref={stackRef}>
      {books.map(({ id, logo, subject }) => (
        <li key={id} data-volume={id}>
          <button
            type="button"
            className="project-spine"
            data-folio-project={id}
            data-cursor-keep
            aria-haspopup="dialog"
            onClick={(event) => onOpen(id, event.currentTarget)}
          >
            <span className="project-spine__binding">
              {id === "wizpay" && (
                <img className="project-spine__payment-preview" src="/assets/invoice-folio/wizpay-case-study/payment-form-charge.png" alt="" draggable={false} />
              )}
              <img className="project-spine__logo" src={logo} alt={folioProjects[id].title} draggable={false} />
              <span className="project-spine__subject">{subject}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
