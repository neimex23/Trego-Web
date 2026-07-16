import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const EDGE_TOLERANCE = 8;
const DRAG_THRESHOLD = 5;

const arrowButtonClass =
  "hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-md transition-all duration-300 hover:scale-105 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trego-orange disabled:pointer-events-none disabled:opacity-0 sm:flex";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

function CarruselHorizontal({ children, ariaLabel = "Carrusel de contenido" }) {
  const scrollRef = useRef(null);
  const rafRef = useRef(null);
  const dragRef = useRef({
    isDown: false,
    dragged: false,
    startX: 0,
    startScrollLeft: 0,
  });
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const checkArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setShowLeft(scrollLeft > EDGE_TOLERANCE);
    setShowRight(scrollLeft + clientWidth < scrollWidth - EDGE_TOLERANCE);
  }, []);

  const handleScroll = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      checkArrows();
    });
  }, [checkArrows]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkArrows();

    const observer = new ResizeObserver(() => checkArrows());
    observer.observe(el);

    return () => {
      observer.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [checkArrows, children]);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onMouseMove = (e) => {
      const drag = dragRef.current;
      if (!drag.isDown) return;

      const delta = e.clientX - drag.startX;

      if (!drag.dragged && Math.abs(delta) > DRAG_THRESHOLD) {
        drag.dragged = true;
        el.style.cursor = "grabbing";
        el.style.scrollSnapType = "none";
        el.style.userSelect = "none";
      }

      if (drag.dragged) {
        el.scrollLeft = drag.startScrollLeft - delta;
      }
    };

    const endDrag = () => {
      const drag = dragRef.current;
      if (!drag.isDown) return;

      drag.isDown = false;
      el.style.cursor = "";
      el.style.userSelect = "";

      if (drag.dragged) {
        const scrollLeft = el.scrollLeft;
        let closest = null;
        let minDistance = Infinity;

        Array.from(el.children).forEach((child) => {
          const childLeft = child.offsetLeft - el.offsetLeft;
          const distance = Math.abs(childLeft - scrollLeft);
          if (distance < minDistance) {
            minDistance = distance;
            closest = child;
          }
        });

        if (closest) {
          el.scrollTo({
            left: closest.offsetLeft - el.offsetLeft,
            behavior: prefersReducedMotion() ? "auto" : "smooth",
          });
        }

        el.style.scrollSnapType = "";
      }

      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", endDrag);
    };

    const onMouseDown = (e) => {
      if (e.button !== 0) return;

      dragRef.current = {
        isDown: true,
        dragged: false,
        startX: e.clientX,
        startScrollLeft: el.scrollLeft,
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", endDrag);
    };

    const blockNativeDrag = (e) => e.preventDefault();

    const onClickCapture = (e) => {
      if (dragRef.current.dragged) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    el.addEventListener("mousedown", onMouseDown);
    el.addEventListener("dragstart", blockNativeDrag);
    el.addEventListener("click", onClickCapture, true);

    return () => {
      el.removeEventListener("mousedown", onMouseDown);
      el.removeEventListener("dragstart", blockNativeDrag);
      el.removeEventListener("click", onClickCapture, true);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", endDrag);
    };
  }, []);

  const onKeyDown = (e) => {
    const el = scrollRef.current;
    if (!el) return;
    const behavior = prefersReducedMotion() ? "auto" : "smooth";

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      scroll("left");
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      scroll("right");
    } else if (e.key === "Home") {
      e.preventDefault();
      el.scrollTo({ left: 0, behavior });
    } else if (e.key === "End") {
      e.preventDefault();
      el.scrollTo({ left: el.scrollWidth, behavior });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => scroll("left")}
        aria-label="Desplazar hacia la izquierda"
        disabled={!showLeft}
        className={arrowButtonClass}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div className="relative min-w-0 flex-1">
        <div
          aria-hidden
          className={`pointer-events-none absolute left-0 top-0 z-10 hidden h-full w-10 transition-opacity duration-300 sm:block ${
            showLeft ? "opacity-100" : "opacity-0"
          }`}
        />

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          onKeyDown={onKeyDown}
          role="region"
          aria-label={ariaLabel}
          tabIndex={0}
          className="-mx-1 flex cursor-grab snap-x snap-mandatory gap-3 overflow-x-auto px-1 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-trego-orange [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden"
        >
          {children}
        </div>

        <div
          aria-hidden
          className={`pointer-events-none absolute right-0 top-0 z-10 hidden h-full w-10 transition-opacity duration-300 sm:block ${
            showRight ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>

      <button
        type="button"
        onClick={() => scroll("right")}
        aria-label="Desplazar hacia la derecha"
        disabled={!showRight}
        className={arrowButtonClass}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}

export default CarruselHorizontal;
