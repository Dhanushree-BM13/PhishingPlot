import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Smooth page-to-page transitions; the sidebar and top bar are pinned via view-transition-name.
    defaultViewTransition: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
