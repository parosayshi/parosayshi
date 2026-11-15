import { useEffect, useRef } from "react";
import { folioProjects, type FolioProjectId } from "../data/folioProjects";
import "../styles/project-bookshelf.css";

const books = [
  { id: "superr-paper", subject: "Learning tools for students and teachers" },
  { id: "wizpay", subject: "How wholesalers collect payments" },
  { id: "wiz-commerce", subject: "How sales reps find products and take orders" },
  { id: "journal-desk", subject: "A writing app that feels like paper" },
] as const;

function SpineMark({ id }: { id: (typeof books)[number]["id"] }) {
  switch (id) {
    case "superr-paper":
      return <img src="/assets/invoice-folio/superr-current-mark.svg" alt="" />;
    case "wizpay":
      return <i className="book-receipt" />;
    case "wiz-commerce":
      return <i className="book-catalogue" />;
    case "journal-desk":
      return <img src="/assets/parth-signature.png" alt="" />;
  }
}

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
      {books.map(({ id, subject }) => (
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
              <span className="project-spine__title">{folioProjects[id].title}</span>
              <span className="project-spine__subject">{subject}</span>
              <span className="project-spine__mark" aria-hidden="true"><SpineMark id={id} /></span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
