import { useEffect, useState } from "react";
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
import { cyberguardApi, isCyberguardApiConfigured } from "@/lib/cyberguard-api";
import { deriveDemoAlerts } from "@/lib/demo-alerts";
import { useDemoStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const primaryNavigation = [
  { to: "/dashboard", title: "Dashboard", icon: LayoutDashboard, group: "Operate" },
  { to: "/investigation", title: "Investigate email", icon: ScanSearch, group: "Operate" },
  { to: "/incidents", title: "Incidents", icon: ClipboardList, group: "Operate" },
  { to: "/alerts", title: "Alerts", icon: BellRing, group: "Operate" },
  { to: "/approvals", title: "Approval queue", icon: ClipboardCheck, group: "Respond" },
  { to: "/agents", title: "AI agent network", icon: Network, group: "Respond" },
  { to: "/audit", title: "Audit", icon: FileClock, group: "Govern" },
  { to: "/settings", title: "Settings", icon: Settings, group: "Govern" },
] as const;

const navigationGroups = ["Operate", "Respond", "Govern"] as const;
type NavigationTo = (typeof primaryNavigation)[number]["to"];
type NavCount = { value: number; tone: "critical" | "warning" | "neutral" };

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
  count,
}: {
  to: NavigationTo;
  title: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  collapsed: boolean;
  count?: NavCount | undefined;
}) {
  const className = cn(
    "nav-link group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active
      ? "is-active bg-secondary text-foreground"
      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
    collapsed && "justify-center px-2",
  );
  const content = (
    <>
      <Icon
        aria-hidden="true"
        className={cn(
          "size-4 shrink-0 transition-colors",
          active ? "text-primary" : "group-hover:text-foreground",
        )}
      />
      <span className={collapsed ? "sr-only" : "flex-1 truncate"}>{title}</span>
      {count && count.value > 0 && (
        <span
          aria-label={`${count.value} ${title.toLowerCase()}`}
          className={cn("nav-count", `is-${count.tone}`, collapsed && "is-dot")}
          key={count.value}
        >
          {collapsed ? "" : count.value}
        </span>
      )}
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
  const path = useRouterState({ select: (state) => state.location.pathname });
  const Icon = scenario.icon;
  const className =
    "group flex items-center gap-3 rounded-md px-3 py-1.5 text-[0.8rem] text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground";
  const body = (
    <>
      <Icon aria-hidden="true" className="size-3.5 shrink-0 group-hover:text-primary" />
      <span className="truncate">{scenario.title}</span>
    </>
  );
  if (scenario.kind === "hurdle") {
    return (
      <Link
        className={cn(className, path === scenario.to && "bg-secondary text-foreground")}
        to={scenario.to}
      >
        {body}
      </Link>
    );
  }
  return (
    <Link
      className={cn(
        className,
        path === `/incidents/${scenario.incidentId}` && "bg-secondary text-foreground",
      )}
      params={{ id: scenario.incidentId }}
      to="/incidents/$id"
    >
      {body}
    </Link>
  );
}

type ServiceState = "checking" | "up" | "down" | "off";

/** Polls the backend health endpoint for API and database status. */
function useServiceStatus() {
  const [status, setStatus] = useState<{ api: ServiceState; db: ServiceState }>({
    api: isCyberguardApiConfigured ? "checking" : "off",
    db: isCyberguardApiConfigured ? "checking" : "off",
  });

  useEffect(() => {
    if (!isCyberguardApiConfigured) return;
    let active = true;
    const check = () =>
      void cyberguardApi
        .health()
        .then((health) => {
          if (!active) return;
          setStatus({
            api: health.status === "ok" ? "up" : "down",
            db:
              health.database === "connected" ? "up" : health.database === "error" ? "down" : "off",
          });
        })
        .catch(() => active && setStatus({ api: "down", db: "off" }));
    check();
    const interval = window.setInterval(check, 15_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return status;
}

const serviceLabel: Record<ServiceState, string> = {
  checking: "Checking",
  up: "Online",
  down: "Offline",
  off: "Not configured",
};

function SidebarStatus({ collapsed }: { collapsed: boolean }) {
  const { simulatedTime } = useDemoStore();
  const status = useServiceStatus();
  const rows = [
    { label: "Agent API", state: status.api },
    { label: "Supabase", state: status.db },
  ];

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 py-1" title="Service status">
        {rows.map((row) => (
          <span className={`status-dot is-${row.state}`} key={row.label} />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-background/60 p-3">
      <ul className="space-y-1.5">
        {rows.map((row) => (
          <li className="flex items-center gap-2 text-xs" key={row.label}>
            <span className={`status-dot is-${row.state}`} />
            <span className="text-muted-foreground">{row.label}</span>
            <span className="ml-auto font-mono text-[0.66rem] uppercase">
              {serviceLabel[row.state]}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2.5 flex items-center gap-1.5 border-t border-border pt-2.5 font-mono text-[0.66rem] text-muted-foreground">
        <Clock3 aria-hidden="true" className="size-3" />
        {new Intl.DateTimeFormat("en", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "UTC",
        }).format(simulatedTime)}{" "}
        UTC · simulated
      </p>
    </div>
  );
}

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const { incidents, approvals } = useDemoStore();
  const alerts = deriveDemoAlerts(incidents, approvals);
  const counts: Partial<Record<NavigationTo, NavCount>> = {
    "/incidents": {
      value: incidents.filter((item) => !["approved", "rejected", "resolved"].includes(item.status))
        .length,
      tone: "neutral",
    },
    "/alerts": {
      value: alerts.length,
      tone: alerts.some((alert) => alert.priority === "critical") ? "critical" : "warning",
    },
    "/approvals": {
      value: incidents.filter((item) =>
        ["awaiting_approval", "escalated", "needs_rereview"].includes(item.status),
      ).length,
      tone: "warning",
    },
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border bg-sidebar transition-[width] duration-200 md:flex",
        collapsed ? "w-16" : "w-64",
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
          className="inline-flex items-center gap-2.5"
          {...dashboardLinkProps()}
        >
          <span className="brand-mark">
            <Shield aria-hidden="true" className="size-4" />
          </span>
          {!collapsed && (
            <span className="leading-tight">
              <span className="block text-sm font-bold tracking-[0.1em]">
                PHISH<span className="text-primary">PILOT</span>
              </span>
              <span className="block font-mono text-[0.6rem] uppercase text-muted-foreground">
                Incident response
              </span>
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
      <nav aria-label="Primary navigation" className="flex-1 overflow-y-auto p-3">
        {navigationGroups.map((group) => (
          <div className="mb-3" key={group}>
            {!collapsed && <p className="nav-group-label">{group}</p>}
            <div className="space-y-0.5">
              {primaryNavigation
                .filter((item) => item.group === group)
                .map(({ to, title, icon }) => (
                  <NavigationLink
                    active={path === to || path.startsWith(`${to}/`)}
                    collapsed={collapsed}
                    count={counts[to]}
                    icon={icon}
                    key={to}
                    title={title}
                    to={to}
                  />
                ))}
            </div>
          </div>
        ))}
        {!collapsed ? (
          <>
            <p className="nav-group-label">Scenarios</p>
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
      <div
        className={cn(
          "space-y-2 border-t border-border p-3",
          collapsed && "flex flex-col items-center",
        )}
      >
        <SidebarStatus collapsed={collapsed} />
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
          collapsed ? "md:pl-16" : "md:pl-64",
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
