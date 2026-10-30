import { useEffect, type RefObject } from "react";

const REVEAL_SELECTOR = ".cg-panel, .verdict-card, .reveal";

/**
 * Console-wide motion: every panel under `root` fades and rises into view with a stagger
 * (on navigation, on scroll, and when new panels mount), and panels track the cursor for a
 * spotlight. Respects prefers-reduced-motion by doing nothing.
 */
export function useLiveMotion(root: RefObject<HTMLElement | null>, routeKey: string) {
  useEffect(() => {
    const container = root.current;
    if (!container || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let batch = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        const entering = entries.filter((entry) => entry.isIntersecting);
        entering.forEach((entry, index) => {
          const element = entry.target as HTMLElement;
          element.style.transitionDelay = `${Math.min(batch + index, 8) * 70}ms`;
          element.dataset["reveal"] = "shown";
          observer.unobserve(element);
        });
        batch = 0;
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );

    // Elements may already be "pending" from the previous route's observer, so re-observe
    // anything not yet shown.
    const track = (element: HTMLElement) => {
      if (element.dataset["reveal"] === "shown") return;
      element.dataset["reveal"] = "pending";
      observer.observe(element);
    };
    const tag = (scope: ParentNode) => {
      scope.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach(track);
    };
    tag(container);

    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches(REVEAL_SELECTOR)) track(node);
          tag(node);
        });
      }
    });
    mutations.observe(container, { childList: true, subtree: true });

    // Safety net: never leave content hidden if the observer doesn't fire (background tab, print).
    const fallback = window.setTimeout(() => {
      container.querySelectorAll<HTMLElement>('[data-reveal="pending"]').forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.top < window.innerHeight) element.dataset["reveal"] = "shown";
      });
    }, 1200);

    const onPointerMove = (event: PointerEvent) => {
      const panel = (event.target as Element | null)?.closest?.<HTMLElement>(".cg-panel");
      if (!panel) return;
      const rect = panel.getBoundingClientRect();
      panel.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      panel.style.setProperty("--my", `${event.clientY - rect.top}px`);
    };
    container.addEventListener("pointermove", onPointerMove);

    return () => {
      window.clearTimeout(fallback);
      observer.disconnect();
      mutations.disconnect();
      container.removeEventListener("pointermove", onPointerMove);
    };
  }, [root, routeKey]);
}
