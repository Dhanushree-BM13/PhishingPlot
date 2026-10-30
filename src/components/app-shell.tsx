import { useState } from "react";
import {
  Activity,
  BellRing,
  Bot,
  ChevronLeft,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  Command,
  FileClock,
  LayoutDashboard,
  Link2,
  Menu,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  ScanSearch,
  Settings,
  Shield,
  BookOpenCheck,
  UserRound,
} from "lucide-react";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BackendStatus } from "@/components/cyberguard/backend-status";
import { useDemoStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const primaryNavigation = [
  { to: "/dashboard", title: "Dashboard", icon: LayoutDashboard },
  { to: "/investigation", title: "Investigate email", icon: ScanSearch },
  { to: "/incidents", title: "Incidents", icon: ClipboardList },
  { to: "/agents", title: "AI agent network", icon: Network },
  { to: "/approvals", title: "Approval queue", icon: ClipboardCheck },
  { to: "/alerts", title: "Alerts", icon: BellRing },
  { to: "/audit", title: "Audit", icon: FileClock },
  { to: "/settings", title: "Settings", icon: Settings },
] as const;

const scenarioNavigation = [
  { kind: "hurdle", to: "/hurdle-guide", title: "Hurdle guide", icon: BookOpenCheck },
  { kind: "hurdle", to: "/hurdle/trusted-sender", title: "Trusted sender turns", icon: Shield },
  {
    kind: "incident",
    incidentId: "DEMO-LINK-DRIFT-01",
    title: "Link drifts after approval",
    icon: Link2,
  },
  {
    kind: "incident",
    incidentId: "DEMO-DISSENT-01",
    title: "Analysts disagree",
    icon: UserRound,
  },
] as const;

const routeTitles: Record<string, string> = {
  "/": "PhishPilot",
  "/dashboard": "Dashboard",
  "/investigation": "Phishing investigation",
  "/incidents": "Incidents",
  "/agents": "AI agent network",
  "/approvals": "Human approval queue",
  "/alerts": "Alerts",
  "/audit": "Audit log",
  "/settings": "Settings",
  "/hurdle/trusted-sender": "Trusted sender turns",
  "/hurdle-guide": "Hurdle guide",
};

function dashboardLinkProps() {
  return { to: "/dashboard" as const, search: { scenario: undefined } };
}

function NavigationLink({
  to,
  title,
  icon: Icon,
  active,
  collapsed,
}: {
  to: (typeof primaryNavigation)[number]["to"];
  title: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  collapsed: boolean;
}) {
  const className = cn(
    "flex items-center gap-3 rounded-sm border px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active
      ? "border-primary/30 bg-primary/10 text-foreground"
      : "border-transparent text-muted-foreground hover:border-border hover:bg-secondary/60 hover:text-foreground",
    collapsed && "justify-center px-2",
  );
  const content = (
    <>
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      <span className={collapsed ? "sr-only" : "truncate"}>{title}</span>
    </>
  );
  const props = {
    "aria-current": active ? ("page" as const) : undefined,
    className,
    title: collapsed ? title : undefined,
  };
  if (to === "/dashboard") {
    return (
      <Link to="/dashboard" search={{ scenario: undefined }} {...props}>
        {content}
      </Link>
    );
  }
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={className}
      title={collapsed ? title : undefined}
      to={to}
    >
      {content}
    </Link>
  );
}

function ScenarioLink({ scenario }: { scenario: (typeof scenarioNavigation)[number] }) {
  if (scenario.kind === "hurdle") {
    return (
      <Link
        className="block rounded-sm px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
        to={scenario.to}
      >
        {scenario.title}
      </Link>
    );
  }
  return (
    <Link
      className="block rounded-sm px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
      params={{ id: scenario.incidentId }}
      to="/incidents/$id"
    >
      {scenario.title}
    </Link>
  );
}

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border bg-sidebar transition-[width] duration-200 md:flex",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center border-b border-border",
          collapsed ? "justify-center" : "justify-between px-4",
        )}
      >
        <Link
          aria-label="PhishPilot dashboard"
          className="inline-flex items-center gap-2"
          {...dashboardLinkProps()}
        >
          <Shield aria-hidden="true" className="size-5 text-primary" />
          {!collapsed && (
            <span className="text-sm font-bold tracking-[0.12em]">
              PHISH<span className="text-primary">PILOT</span>
            </span>
          )}
        </Link>
        {!collapsed && (
          <Button aria-label="Collapse sidebar" onClick={onToggle} size="icon" variant="ghost">
            <PanelLeftClose aria-hidden="true" className="size-4" />
          </Button>
        )}
      </div>
      {collapsed && (
        <Button
          aria-label="Expand sidebar"
          className="mx-auto mt-3"
          onClick={onToggle}
          size="icon"
          variant="ghost"
        >
          <PanelLeftOpen aria-hidden="true" className="size-4" />
        </Button>
      )}
      <nav aria-label="Primary navigation" className="flex-1 space-y-1 overflow-y-auto p-3">
        {primaryNavigation.map(({ to, title, icon }) => (
          <NavigationLink
            active={path === to || path.startsWith(`${to}/`)}
            collapsed={collapsed}
            icon={icon}
            key={to}
            title={title}
            to={to}
          />
        ))}
        {!collapsed ? (
          <>
            <div className="px-3 pb-1 pt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Scenarios
            </div>
            {scenarioNavigation.map((scenario) => (
              <ScenarioLink key={scenario.title} scenario={scenario} />
            ))}
          </>
        ) : (
          <div className="mt-4 space-y-1 border-t border-border pt-3">
            {scenarioNavigation.map(({ icon: Icon, title, ...scenario }) => (
              <Link
                aria-label={title}
                className="mx-auto flex size-10 items-center justify-center rounded-sm text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                key={title}
                title={title}
                to={scenario.kind === "hurdle" ? scenario.to : "/incidents/$id"}
                {...(scenario.kind === "incident" ? { params: { id: scenario.incidentId } } : {})}
              >
                <Icon aria-hidden="true" className="size-4" />
              </Link>
            ))}
          </div>
        )}
      </nav>
      <div className={cn("border-t border-border p-3", collapsed && "flex justify-center")}>
        <Link
          className={cn(
            "flex items-center gap-3 rounded-sm px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            collapsed && "px-2",
          )}
          title={collapsed ? "Open landing" : undefined}
          to="/"
        >
          <ChevronLeft aria-hidden="true" className="size-4 shrink-0" />
          <span className={collapsed ? "sr-only" : ""}>Open landing</span>
        </Link>
      </div>
    </aside>
  );
}

function MobileNavigation() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-background/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur md:hidden"
    >
      {primaryNavigation.slice(0, 3).map(({ to, title, icon: Icon }) =>
        to === "/dashboard" ? (
          <Link
            aria-current={path === to ? "page" : undefined}
            className="flex flex-col items-center gap-1 py-1 text-[10px] text-muted-foreground data-[active=true]:text-foreground"
            data-active={path === to}
            key={to}
            search={{ scenario: undefined }}
            to="/dashboard"
          >
            <Icon aria-hidden="true" className="size-4" />
            {title}
          </Link>
        ) : (
          <Link
            aria-current={path === to ? "page" : undefined}
            className="flex flex-col items-center gap-1 py-1 text-[10px] text-muted-foreground data-[active=true]:text-foreground"
            data-active={path === to}
            key={to}
            to={to}
          >
            <Icon aria-hidden="true" className="size-4" />
            {title}
          </Link>
        ),
      )}
      <Sheet>
        <SheetTrigger asChild>
          <Button className="h-auto flex-col gap-1 py-1 text-[10px]" variant="ghost">
            <Menu aria-hidden="true" className="size-4" />
            More
          </Button>
        </SheetTrigger>
        <SheetContent aria-describedby={undefined} side="bottom">
          <SheetHeader>
            <SheetTitle>PhishPilot navigation</SheetTitle>
          </SheetHeader>
          <div className="mt-4 grid gap-1">
            {primaryNavigation.slice(3).map(({ to, title, icon: Icon }) => (
              <Link
                className="flex items-center gap-3 rounded-sm px-3 py-3 text-sm hover:bg-secondary"
                key={to}
                to={to}
              >
                <Icon aria-hidden="true" className="size-4" />
                {title}
              </Link>
            ))}
            <div className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Scenarios
            </div>
            {scenarioNavigation.map((scenario) => (
              <ScenarioLink key={scenario.title} scenario={scenario} />
            ))}
            <Link className="rounded-sm px-3 py-3 text-sm hover:bg-secondary" to="/">
              Open landing
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}

function DemoControls() {
  const { advanceSimulatedTime, resetDemo, simulatedTime } = useDemoStore();
  const timeLabel = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(simulatedTime);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label="Open demo controls" size="sm" variant="outline">
          <Command aria-hidden="true" className="size-4" />
          Demo controls
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Clock3 aria-hidden="true" className="size-4" />
          Simulated time · {timeLabel} UTC
        </DropdownMenuLabel>
        {[30, 60, 120].map((minutes) => (
          <DropdownMenuItem key={minutes} onSelect={() => advanceSimulatedTime(minutes)}>
            Advance +{minutes >= 60 ? `${minutes / 60}h` : `${minutes}m`}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Scenario shortcuts</DropdownMenuLabel>
        {scenarioNavigation.map((scenario) => (
          <DropdownMenuItem asChild key={scenario.title}>
            <ScenarioLink scenario={scenario} />
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={resetDemo}>Reset demo</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { demoDataLabel, simulatedTime } = useDemoStore();
  const title =
    routeTitles[pathname] ??
    (pathname.startsWith("/incidents/") ? "Incident detail" : "PhishPilot");

  if (pathname === "/") {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
          <nav className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-5">
            <Link className="flex items-center gap-2" to="/">
              <Shield aria-hidden="true" className="size-5 text-primary" />
              <span className="text-sm font-bold tracking-[0.12em]">
                PHISH<span className="text-primary">PILOT</span>
              </span>
            </Link>
            <div className="ml-auto hidden items-center gap-5 text-sm text-muted-foreground md:flex">
              <a className="hover:text-foreground" href="#how">
                How it works
              </a>
              <Link className="hover:text-foreground" to="/hurdle-guide">
                The hurdle
              </Link>
              <Link className="hover:text-foreground" to="/investigation">
                Live analysis
              </Link>
            </div>
            <Button asChild className="cg-primary-button ml-auto md:ml-0" size="sm">
              <Link search={{ scenario: undefined }} to="/dashboard">
                Open console
              </Link>
            </Button>
          </nav>
        </header>
        <Outlet />
      </div>
    );
  }

  return (
    <div className="cg-shell min-h-screen bg-background text-foreground">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
      <div
        className={cn(
          "min-h-screen transition-[padding] duration-200",
          collapsed ? "md:pl-16" : "md:pl-60",
        )}
      >
        <header className="sticky top-0 z-20 flex min-h-16 flex-wrap items-center gap-3 border-b border-border bg-background/95 px-4 py-2 backdrop-blur md:px-6">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold tracking-wide">{title}</p>
            <p className="text-[10px] uppercase tracking-[0.13em] text-muted-foreground">
              Agentic phishing response
            </p>
          </div>
          <BackendStatus compact />
          <Badge className="hidden gap-1.5 border-status-analysis/30 bg-status-analysis/10 text-status-analysis sm:inline-flex">
            <Activity aria-hidden="true" className="size-3" />
            {demoDataLabel}
          </Badge>
          <time className="hidden font-mono text-xs tabular-nums text-muted-foreground lg:block">
            {new Intl.DateTimeFormat("en", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "UTC",
            }).format(simulatedTime)}{" "}
            UTC
          </time>
          <DemoControls />
        </header>
        <main className="min-w-0 px-4 pb-24 pt-5 md:px-6 md:pb-8">
          <div className="route-transition" key={pathname}>
            <Outlet />
          </div>
        </main>
      </div>
      <MobileNavigation />
    </div>
  );
}
