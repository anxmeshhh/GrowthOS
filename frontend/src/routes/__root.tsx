import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { GrowthProvider } from "../lib/growth-store";
import { Sidebar, MobileTopBar } from "../components/growth-sidebar";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "GrowthOS — Developer Learning Operating System" },
      { name: "description", content: "A serious learning OS for self-taught developers. Roadmaps, notes, quizzes, and build proof in one workspace." },
      { name: "author", content: "GrowthOS" },
      { property: "og:title", content: "GrowthOS — Developer Learning OS" },
      { property: "og:description", content: "A serious learning OS for self-taught developers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "GrowthOS — Developer Learning OS" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

import { ToastProvider, useToast } from "../components/toast-context";
import { apiFetch } from "../lib/api-client";
import { FloatingChat } from "../components/floating-chat";

function GlobalGamificationWrapper({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const router = useRouter();
  const path = router.state.location.pathname;
  const isAuthRoute = path === "/login" || path === "/signup" || path === "/";

  useEffect(() => {
    if (!isAuthRoute) {
      apiFetch("/auth/daily-login/", { method: "POST" })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "awarded") {
            showToast(data.message, "xp");
          }
        })
        .catch(() => {});
    }
  }, [isAuthRoute, showToast]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f0f0f0] flex flex-col lg:flex-row">
      {!isAuthRoute && <Sidebar />}
      <div className="flex-1 min-w-0 flex flex-col">
        {!isAuthRoute && <MobileTopBar />}
        {children}
      </div>
      {!isAuthRoute && <FloatingChat />}
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <GrowthProvider>
        <ToastProvider>
          <GlobalGamificationWrapper>
            <Outlet />
          </GlobalGamificationWrapper>
        </ToastProvider>
      </GrowthProvider>
    </QueryClientProvider>
  );
}
