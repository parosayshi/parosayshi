import { useEffect, useRef } from "react";
import { folioProjects, type FolioProjectId } from "../data/folioProjects";
import "../styles/project-bookshelf.css";

const books = [
  { id: "superr-paper", logo: "/assets/invoice-folio/superr-official-logo.svg", subject: "Learning tools for students and teachers" },
  { id: "wizpay", logo: "/assets/invoice-folio/wizcommerce-current-mark.svg", subject: "How wholesalers collect payments" },
  { id: "wiz-commerce", logo: "/assets/invoice-folio/wizcommerce-current-mark.svg", subject: "How sales reps find products and take orders" },
  { id: "journal-desk", logo: "/assets/invoice-folio/journal-desk-case-study/favicon.png", subject: "A writing app that feels like paper" },
] as const;

export function ProjectBookshelf({ onOpen }: {
  onOpen: (id: FolioProjectId, trigger: HTMLButtonElement) => void;
}) {
  const stackRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const stack = stackRef.current;
    if (!stack || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      stack.dataset.entered = "true";
      observer.disconnect();
    });
    observer.observe(stack);
    return () => observer.disconnect();
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
              <img className="project-spine__logo" src={logo} alt={folioProjects[id].title} draggable={false} />
              <span className="project-spine__subject">{subject}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
