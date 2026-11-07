"use client";

import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import {
  Activity, ArrowRight, ArrowUpRight, Bell, CarFront, ChartNoAxesCombined,
  Check, ChevronDown, CircleCheck, Clock3, FolderKanban, Gauge,
  DraftingCompass, LayoutDashboard, Plus, ReceiptText, Search, Users, X,
} from "lucide-react";
import DesignerView from "./designer-view";
import { hasRolePermission, type Role } from "../../lib/policy";
import type { DemoSession } from "../../lib/auth/mock-session";
import { scopeProjects, scopeVehicles } from "../../lib/auth/workspace-scope";

type ProjectStatus = "quote_pending" | "awaiting_approval" | "in_build" | "completed";
type WorkspaceView = "overview" | "projects" | "garage" | "designer" | "quotes" | "reports";
type SoundPreference = "deep" | "aggressive" | "race" | "mild" | "exotic";

interface Vehicle {
  id: string;
  ownerId: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  engine: string;
  envelope: string;
  sample: boolean;
}

interface Project {
  id: string;
  name: string;
  customer: string;
  ownerId: string;
  assignedFabricatorId?: string;
  vehicleId: string;
  status: ProjectStatus;
  totalCents: number;
  soundLevel: number;
  soundPreference: SoundPreference;
  performancePriority: "low" | "medium" | "high";
  budgetBand: string;
  exitStyle: string;
  updated: string;
}

const starterProjects: Project[] = [
  { id: "EX-2048", name: "Street touring system", customer: "Jordan Lee", ownerId: "demo-customer-1", vehicleId: "v2", status: "quote_pending", totalCents: 278250, soundLevel: 5, soundPreference: "deep", performancePriority: "medium", budgetBand: "2000", exitStyle: "dual", updated: "18 min ago" },
  { id: "EX-2047", name: "Axle-back refresh", customer: "Maya Torres", ownerId: "demo-customer-2", vehicleId: "v1", status: "quote_pending", totalCents: 164900, soundLevel: 7, soundPreference: "aggressive", performancePriority: "high", budgetBand: "2000", exitStyle: "dual", updated: "1 hr ago" },
  { id: "EX-2044", name: "Weekend track setup", customer: "Chris Patel", ownerId: "demo-customer-3", vehicleId: "v3", status: "awaiting_approval", totalCents: 324500, soundLevel: 8, soundPreference: "race", performancePriority: "high", budgetBand: "5000+", exitStyle: "single", updated: "Yesterday" },
  { id: "EX-2041", name: "Valved performance system", customer: "Alex Morgan", ownerId: "demo-customer-4", assignedFabricatorId: "demo-fabricator", vehicleId: "v4", status: "in_build", totalCents: 489000, soundLevel: 6, soundPreference: "exotic", performancePriority: "high", budgetBand: "5000+", exitStyle: "quad", updated: "2 days ago" },
  { id: "EX-2038", name: "Daily driver resonator", customer: "Sam Rivera", ownerId: "demo-customer-5", vehicleId: "v2", status: "completed", totalCents: 198750, soundLevel: 3, soundPreference: "mild", performancePriority: "low", budgetBand: "1000", exitStyle: "dual", updated: "Oct 28" },
];

const stages: { id: ProjectStatus; title: string; icon: typeof Clock3 }[] = [
  { id: "quote_pending", title: "Pending quotes", icon: Clock3 },
  { id: "awaiting_approval", title: "Awaiting approval", icon: CircleCheck },
  { id: "in_build", title: "Active builds", icon: Activity },
  { id: "completed", title: "Completed", icon: Check },
];

const navigation: { id: WorkspaceView; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "garage", label: "Vehicle garage", icon: CarFront },
  { id: "designer", label: "Designer", icon: DraftingCompass },
  { id: "quotes", label: "Quotes & BOM", icon: ReceiptText },
  { id: "reports", label: "Analytics", icon: ChartNoAxesCombined },
];

const viewResources: Partial<Record<WorkspaceView, string>> = {
  projects: "projects",
  garage: "vehicles",
  designer: "revisions",
  quotes: "quotes",
  reports: "analytics",
};

const sessionResponseSchema = z.object({
  data: z.object({
    userId: z.string(),
    displayName: z.string(),
    role: z.enum(["owner", "shop_admin", "fabricator", "sales", "customer"]),
    shopId: z.string(),
    ownerId: z.string().nullable(),
    mode: z.literal("mock"),
    sampleData: z.literal(true),
  }),
});

const roleOptions: { role: Role; label: string; description: string }[] = [
  { role: "owner", label: "Shop owner", description: "Full shop access" },
  { role: "shop_admin", label: "Shop admin", description: "Manage shop operations" },
  { role: "fabricator", label: "Fabricator", description: "Assigned builds, no pricing" },
  { role: "sales", label: "Sales", description: "Customers, quotes, and CRM" },
  { role: "customer", label: "Customer", description: "Own garage and projects only" },
];

const formatMoney = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

const vehicleLabel = (vehicle?: Vehicle) => vehicle
  ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
  : "Vehicle not selected";

export default function ShopWorkspace({ initialVehicles }: { initialVehicles: Vehicle[] }) {
  const [view, setView] = useState<WorkspaceView>("overview");
  const [projects, setProjects] = useState(starterProjects);
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [search, setSearch] = useState("");
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newVehicleOpen, setNewVehicleOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeDesignProject, setActiveDesignProject] = useState<Project | null>(null);
  const [soundLevel, setSoundLevel] = useState(5);
  const [session, setSession] = useState<DemoSession>({ userId: "demo-owner", displayName: "Morgan Lee", role: "owner", shopId: "00000000-0000-4000-8000-000000000001" });
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch("/api/v1/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: unknown) => {
        const parsed = sessionResponseSchema.safeParse(payload);
        if (active && parsed.success) setSession(parsed.data.data);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const scopedProjects = scopeProjects(projects, session);
  const scopedVehicles = scopeVehicles(vehicles, scopedProjects, session);
  const visibleNavigation = navigation.filter(({ id }) => {
    const resource = viewResources[id];
    return !resource || hasRolePermission(session.role, resource, "read");
  });

  const filteredProjects = scopedProjects.filter((project) => {
    const vehicle = scopedVehicles.find((item) => item.id === project.vehicleId);
    return `${project.id} ${project.name} ${project.customer} ${vehicleLabel(vehicle)}`
      .toLowerCase().includes(search.toLowerCase());
  });
  const activeTitle = navigation.find((item) => item.id === view)?.label ?? "Overview";

  async function switchDemoRole(role: Role) {
    const response = await fetch("/api/v1/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const payload: unknown = await response.json();
    const parsed = sessionResponseSchema.safeParse(payload);
    if (!response.ok || !parsed.success) return;
    setSession(parsed.data.data);
    setSelectedProject(null);
    setActiveDesignProject(null);
    setView("overview");
    setRoleMenuOpen(false);
  }

  function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const project: Project = {
      id: `EX-${2050 + projects.length}`,
      name: String(values.get("name")),
      customer: session.role === "customer" ? session.displayName : String(values.get("customer")),
      ownerId: session.role === "customer" ? session.userId : "demo-owner",
      vehicleId: String(values.get("vehicleId")),
      status: "quote_pending",
      totalCents: 0,
      soundLevel,
      soundPreference: String(values.get("soundPreference")) as SoundPreference,
      performancePriority: String(values.get("performancePriority")) as Project["performancePriority"],
      budgetBand: String(values.get("budgetBand")),
      exitStyle: String(values.get("exitStyle")),
      updated: "Just now",
    };
    setProjects((current) => [project, ...current]);
    setSelectedProject(project);
    setNewProjectOpen(false);
    setView("projects");
  }

  function addVehicle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setVehicles((current) => [{
      id: `manual-${Date.now()}`,
      ownerId: session.role === "customer" ? session.userId : "demo-owner",
      year: Number(values.get("year")),
      make: String(values.get("make")),
      model: String(values.get("model")),
      trim: String(values.get("trim") || "Manual entry"),
      engine: String(values.get("engine") || "Not specified"),
      envelope: "Manual entry",
      sample: false,
    }, ...current]);
    setNewVehicleOpen(false);
  }

  return (
    <main className="workspace-shell">
      <aside className="sidebar">
        <a className="brand-lockup" href="#overview" onClick={() => setView("overview")}>
          <span className="brand-mark" aria-hidden="true">E</span>
          <span className="brand-wordmark">EXHAUST<span>AHOLICS</span></span>
        </a>
        <div className="shop-switcher"><span className="shop-avatar">N</span><span className="shop-switcher-copy"><b>Northline Fabrication</b><small>Demo shop</small></span><ChevronDown aria-hidden="true" size={15} /></div>
        <div className="nav-caption">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          {visibleNavigation.map(({ id, label, icon: Icon }) => (
            <button aria-current={view === id ? "page" : undefined} className={`nav-item ${view === id ? "is-active" : ""}`} key={id} onClick={() => setView(id)} type="button">
              <Icon aria-hidden="true" size={17} strokeWidth={1.8} /><span>{label}</span>
              {id === "projects" && <span className="nav-count">{scopedProjects.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="data-quality-card"><div className="data-quality-icon"><Gauge aria-hidden="true" size={17} /></div><b>Vehicle data</b><p>Parametric envelopes are approximations. Verify fit before fabrication.</p></div>
          {hasRolePermission(session.role, "settings", "read") && <button className="nav-item settings-button" onClick={() => setView("reports")} type="button"><Users aria-hidden="true" size={17} /><span>Shop settings</span></button>}
          <button aria-expanded={roleMenuOpen} aria-label={`Demo role: ${session.role.replaceAll("_", " ")}. Change role`} className="account-row account-switcher" onClick={() => setRoleMenuOpen(true)} type="button"><span className="account-avatar">{session.displayName.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span><span><b>{session.displayName}</b><small>{session.role.replaceAll("_", " ")}</small></span><ChevronDown aria-hidden="true" size={14} /></button>
        </div>
      </aside>

      <section className="workspace-main">
        <header className="topbar">
          <div className="breadcrumb"><span>Northline Fabrication</span><span className="breadcrumb-slash">/</span><b>{activeTitle}</b></div>
          <div className="topbar-actions">
            <label className="search-box"><Search aria-hidden="true" size={16} /><input aria-label="Search projects and vehicles" onChange={(event) => setSearch(event.target.value)} placeholder="Search projects, vehicles" value={search} /><kbd>/</kbd></label>
            <button className="icon-button notification-button" type="button" aria-label="Notifications"><Bell aria-hidden="true" size={17} /><span /></button>
            <span className="demo-chip"><span /> DEMO · {session.role.replaceAll("_", " ").toUpperCase()}</span>
          </div>
        </header>

        <div className="content-area">
          <div className="page-heading">
            <div><div className="eyebrow"><span className="eyebrow-line" /> SHOP FLOOR / 01</div><h1>{view === "overview" ? "Shop overview" : activeTitle}</h1><p className="heading-subtitle">{view === "garage" ? "Vehicles and fitment data for your customers." : view === "designer" ? "Edit design intent before any material is cut." : view === "quotes" ? "Transparent estimates with inputs shown on every line." : view === "reports" ? "Operational signals from this sample workspace." : "Keep every exhaust project moving, from first quote to final fit check."}</p></div>
            <div className="heading-actions"><span className="sample-data-badge"><span /> Sample data</span>{hasRolePermission(session.role, "projects", "create") && <button className="primary-button" onClick={() => setNewProjectOpen(true)} type="button"><Plus aria-hidden="true" size={17} /> New project</button>}</div>
          </div>

          {view === "overview" && session.role === "customer" && <>
            <section className="customer-welcome"><div className="eyebrow"><span className="eyebrow-line" /> CUSTOMER GARAGE</div><h2>Welcome back, {session.displayName.split(" ")[0]}.</h2><p>Your vehicles and exhaust projects, in one place. Fitment envelopes are approximate; verify all measurements on the vehicle.</p></section>
            <PipelineBoard projects={filteredProjects} vehicles={scopedVehicles} canSeeQuotes={hasRolePermission(session.role, "quotes", "read")} onOpen={(project) => setSelectedProject(hasRolePermission(session.role, "quotes", "read") ? project : { ...project, totalCents: 0 })} />
            <div className="workspace-footnote">Design tool. Always verify measurements and fit before fabrication.</div>
          </>}

          {view === "overview" && session.role !== "customer" && <>
            <section className="metric-grid" aria-label="Shop pipeline summary">
              {hasRolePermission(session.role, "quotes", "read") && <article className="metric-card metric-highlight"><div className="metric-label">Open quote value <ArrowUpRight aria-hidden="true" size={15} /></div><div className="metric-value tabular">{formatMoney(scopedProjects.filter((project) => project.status === "quote_pending").reduce((sum, project) => sum + project.totalCents, 0))}</div><div className="metric-foot"><span className="metric-dot blue" /> Sample quotes · not shop rates</div></article>}
              {hasRolePermission(session.role, "approvals", "read") && <article className="metric-card"><div className="metric-label">Awaiting approval</div><div className="metric-value tabular">{scopedProjects.filter((project) => project.status === "awaiting_approval").length.toString().padStart(2, "0")}</div><div className="metric-foot"><span className="metric-dot amber" /> Customer review</div></article>}
              {hasRolePermission(session.role, "builds", "read") && <article className="metric-card"><div className="metric-label">Active builds</div><div className="metric-value tabular">{scopedProjects.filter((project) => project.status === "in_build").length.toString().padStart(2, "0")}</div><div className="metric-foot"><span className="metric-dot green" /> In the shop</div></article>}
              <article className="metric-card"><div className="metric-label">Completed this month</div><div className="metric-value tabular">06</div><div className="metric-foot"><span className="metric-dot silver" /> Sample shop history</div></article>
            </section>
            <PipelineBoard projects={filteredProjects} vehicles={scopedVehicles} canSeeQuotes={hasRolePermission(session.role, "quotes", "read")} onOpen={(project) => setSelectedProject(hasRolePermission(session.role, "quotes", "read") ? project : { ...project, totalCents: 0 })} onViewAll={() => setView("projects")} />
            <div className="workspace-footnote">Design tool. Always verify measurements and fit before fabrication.</div>
          </>}

          {view === "projects" && <><div className="section-toolbar"><div><b>{session.role === "customer" ? "My projects" : session.role === "fabricator" ? "Assigned builds" : "Project pipeline"}</b><span>{filteredProjects.length} projects · values are sample estimates</span></div><button className="quiet-button" type="button"><span className="filter-glyph" /> Filter</button></div><PipelineBoard projects={filteredProjects} vehicles={scopedVehicles} canSeeQuotes={hasRolePermission(session.role, "quotes", "read")} onOpen={(project) => setSelectedProject(hasRolePermission(session.role, "quotes", "read") ? project : { ...project, totalCents: 0 })} /><div className="workspace-footnote">Approved revisions are immutable. Changes require a new revision and approval.</div></>}

          {view === "garage" && <section className="data-section"><div className="section-toolbar"><div><b>{session.role === "customer" ? "My garage" : "Customer garage"}</b><span>{scopedVehicles.length} vehicles · vehicle specs and envelope provenance</span></div>{hasRolePermission(session.role, "vehicles", "create") && <button className="quiet-button" onClick={() => setNewVehicleOpen(true)} type="button"><Plus size={15} /> Add vehicle</button>}</div><div className="table-wrap"><table className="data-table"><thead><tr><th>Vehicle</th><th>Trim / engine</th><th>Data source</th><th>Projects</th><th /></tr></thead><tbody>{scopedVehicles.map((vehicle) => <tr key={vehicle.id}><td><div className="vehicle-cell"><span className="vehicle-icon"><CarFront aria-hidden="true" size={18} /></span><span><b>{vehicleLabel(vehicle)}</b><small>{vehicle.sample ? "Sample record" : "Manual entry"}</small></span></div></td><td><b>{vehicle.trim}</b><small>{vehicle.engine}</small></td><td><span className={`source-badge ${vehicle.envelope === "Parametric envelope" ? "source-parametric" : "source-manual"}`}><span />{vehicle.envelope}</span></td><td className="tabular">{scopedProjects.filter((project) => project.vehicleId === vehicle.id).length}</td><td>{hasRolePermission(session.role, "projects", "create") && <button className="text-action" onClick={() => setNewProjectOpen(true)} type="button">New project <ArrowRight size={14} /></button>}</td></tr>)}</tbody></table></div><p className="table-disclaimer">Parametric envelopes are class-based approximations, not vehicle scans. Confirm measurements on the vehicle.</p></section>}

          {view === "quotes" && (session.role === "customer" ? <CustomerQuote project={filteredProjects[0]} /> : <QuoteLedger />)}
          {view === "reports" && <ReportsPanel projectCount={scopedProjects.length} />}
          {view === "designer" && <DesignerView projectName={activeDesignProject?.name ?? scopedProjects[0]?.name ?? "New exhaust design"} vehicleName={vehicleLabel(scopedVehicles.find((vehicle) => vehicle.id === (activeDesignProject?.vehicleId ?? scopedProjects[0]?.vehicleId)))} editable={session.role === "owner" || session.role === "shop_admin" || session.role === "fabricator"} />}
        </div>
      </section>

      {newProjectOpen && <ProjectDialog onClose={() => setNewProjectOpen(false)} onSubmit={createProject} soundLevel={soundLevel} setSoundLevel={setSoundLevel} vehicles={scopedVehicles} />}
      {newVehicleOpen && <VehicleDialog onClose={() => setNewVehicleOpen(false)} onSubmit={addVehicle} />}
      {selectedProject && <ProjectDetails project={selectedProject} vehicles={scopedVehicles} onClose={() => setSelectedProject(null)} onDesign={() => { setActiveDesignProject(selectedProject); setSelectedProject(null); setView("designer"); }} />}
      {roleMenuOpen && <DemoRoleDialog currentRole={session.role} onClose={() => setRoleMenuOpen(false)} onSelect={switchDemoRole} />}
    </main>
  );
}

function PipelineBoard({ projects, vehicles, canSeeQuotes, onOpen, onViewAll }: { projects: Project[]; vehicles: Vehicle[]; canSeeQuotes: boolean; onOpen: (project: Project) => void; onViewAll?: () => void }) {
  return (
    <section className="pipeline-section">
      <div className="section-toolbar">
        <div><b>Project pipeline</b><span>Design approval before fabrication</span></div>
        {onViewAll && <button className="text-action" onClick={onViewAll} type="button">View all projects <ArrowRight size={14} /></button>}
      </div>
      <div className="pipeline-board">
        {stages.map(({ id, title, icon: Icon }) => {
          const items = projects.filter((project) => project.status === id);
          return (
            <section className="pipeline-column" key={id} aria-label={`${title}, ${items.length} projects`}>
              <div className="column-heading"><span className={`stage-icon stage-${id}`}><Icon aria-hidden="true" size={15} /></span><h2>{title}</h2><span className="column-count">{items.length}</span></div>
              <div className="column-cards">
                {items.map((project) => (
                  <button className="project-card" key={project.id} onClick={() => onOpen(project)} type="button">
                    <div className="project-card-top"><span className="project-id">{project.id}</span><ArrowUpRight aria-hidden="true" size={15} /></div>
                    <strong>{project.name}</strong>
                    <span className="project-vehicle">{vehicleLabel(vehicles.find((vehicle) => vehicle.id === project.vehicleId))}</span>
                    <div className="project-card-footer"><span>{project.customer}</span>{canSeeQuotes && <b className="tabular">{project.totalCents === 0 ? "Not set" : formatMoney(project.totalCents)}</b>}</div>
                    <div className="project-card-meta"><span className="sample-mark"><span /> Sample</span><span>{project.updated}</span></div>
                  </button>
                ))}
                {items.length === 0 && <div className="empty-column">No projects in this stage</div>}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}

function ProjectDialog({ onClose, onSubmit, soundLevel, setSoundLevel, vehicles }: { onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; soundLevel: number; setSoundLevel: (value: number) => void; vehicles: Vehicle[] }) {
  return <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section aria-labelledby="project-dialog-title" aria-modal="true" className="dialog-panel" role="dialog"><div className="dialog-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> PROJECT INTAKE / 01</div><h2 id="project-dialog-title">Start a project</h2></div><button aria-label="Close project form" className="icon-button" onClick={onClose} type="button"><X size={18} /></button></div><form className="project-form" onSubmit={onSubmit}><label className="field-label">Project name<input autoFocus maxLength={70} name="name" placeholder="e.g. Street touring system" required /></label><label className="field-label">Customer<input maxLength={70} name="customer" placeholder="Customer name" required /></label><label className="field-label">Vehicle<select name="vehicleId" required defaultValue=""><option disabled value="">Select a garage vehicle</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicleLabel(vehicle)} · {vehicle.trim}</option>)}</select></label><div className="field-row"><label className="field-label">Sound preference<select name="soundPreference" defaultValue="deep"><option value="deep">Deep</option><option value="aggressive">Aggressive</option><option value="race">Race</option><option value="mild">Mild</option><option value="exotic">Exotic</option></select></label><label className="field-label">Performance priority<select name="performancePriority" defaultValue="medium"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label></div><label className="field-label">Sound level goal <span className="range-value">{soundLevel} / 10</span><input aria-label="Sound level goal, not a prediction" max="10" min="1" onChange={(event) => setSoundLevel(Number(event.target.value))} type="range" value={soundLevel} /><small>Customer preference only. This is not a sound measurement or prediction.</small></label><div className="field-row"><label className="field-label">Budget band<select name="budgetBand" defaultValue="2000"><option value="500">$500</option><option value="1000">$1,000</option><option value="2000">$2,000</option><option value="5000+">$5,000+</option></select></label><label className="field-label">Exit style<select name="exitStyle" defaultValue="dual"><option value="single">Single</option><option value="dual">Dual</option><option value="quad">Quad</option><option value="center">Center</option><option value="side">Side</option></select></label></div><div className="dialog-actions"><span>Demo only · changes are not saved to an account</span><button className="primary-button" type="submit"><Plus size={16} /> Create project</button></div></form></section></div>;
}

function VehicleDialog({ onClose, onSubmit }: { onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section aria-labelledby="vehicle-dialog-title" aria-modal="true" className="dialog-panel compact-dialog" role="dialog"><div className="dialog-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> GARAGE / MANUAL ENTRY</div><h2 id="vehicle-dialog-title">Add vehicle</h2></div><button aria-label="Close vehicle form" className="icon-button" onClick={onClose} type="button"><X size={18} /></button></div><form className="project-form" onSubmit={onSubmit}><div className="field-row"><label className="field-label">Year<input max="2035" min="1950" name="year" required type="number" /></label><label className="field-label">Make<input maxLength={50} name="make" required /></label></div><label className="field-label">Model<input maxLength={60} name="model" required /></label><div className="field-row"><label className="field-label">Trim<input maxLength={60} name="trim" /></label><label className="field-label">Engine<input maxLength={60} name="engine" /></label></div><p className="form-notice">Manual entry has no verified underbody model. Fitment envelope: not set.</p><div className="dialog-actions"><span>Local demo record</span><button className="primary-button" type="submit"><Plus size={16} /> Add vehicle</button></div></form></section></div>;
}

function ProjectDetails({ project, vehicles, onClose, onDesign }: { project: Project; vehicles: Vehicle[]; onClose: () => void; onDesign: () => void }) {
  return <div className="dialog-backdrop detail-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><aside aria-labelledby="project-detail-title" aria-modal="true" className="detail-panel" role="dialog"><div className="detail-top"><span className={`status-label status-${project.status}`}>{project.status.replaceAll("_", " ")}</span><button aria-label="Close project details" className="icon-button" onClick={onClose} type="button"><X size={18} /></button></div><span className="project-id">{project.id} · SAMPLE</span><h2 id="project-detail-title">{project.name}</h2><p className="detail-vehicle">{vehicleLabel(vehicles.find((vehicle) => vehicle.id === project.vehicleId))}</p><div className="detail-divider"/><div className="detail-field"><span>Customer</span><b>{project.customer}</b></div><div className="detail-field"><span>Estimate</span><b className="tabular">{project.totalCents === 0 ? "Not set" : formatMoney(project.totalCents)}</b></div><div className="detail-field"><span>Sound level</span><b>{project.soundLevel} / 10 · stated goal</b></div><div className="detail-field"><span>Sound preference</span><b>{project.soundPreference}</b></div><div className="detail-field"><span>Performance priority</span><b>{project.performancePriority}</b></div><div className="detail-note"><Gauge size={17}/><span>Design intent only. Vehicle envelope is parametric; verify fit on vehicle before fabrication.</span></div><button className="primary-button detail-action" onClick={onDesign} type="button"><DraftingCompassIcon /> Open design workspace</button><p className="detail-session-note">Demo interaction · not yet saved to a shop account</p></aside></div>;
}

function DraftingCompassIcon() {
  return <FolderKanban aria-hidden="true" size={17} />;
}

function DemoRoleDialog({ currentRole, onClose, onSelect }: { currentRole: Role; onClose: () => void; onSelect: (role: Role) => void }) {
  return (
    <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section aria-labelledby="demo-role-title" aria-modal="true" className="dialog-panel role-dialog" role="dialog">
        <div className="dialog-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> DEMO IDENTITY</div><h2 id="demo-role-title">Switch role</h2></div><button aria-label="Close role selector" className="icon-button" onClick={onClose} type="button"><X size={18}/></button></div>
        <div className="role-options">{roleOptions.map(({ role, label, description }) => <button aria-pressed={currentRole === role} className={`role-option ${currentRole === role ? "selected" : ""}`} key={role} onClick={() => onSelect(role)} type="button"><span className="role-option-avatar">{label.slice(0, 1)}</span><span><b>{label}</b><small>{description}</small></span><span className="role-current">{currentRole === role ? "ACTIVE" : ""}</span></button>)}</div>
        <p className="role-dialog-note">Preset demo identities only. No account is created and demo records are not private customer data.</p>
      </section>
    </div>
  );
}

function CustomerQuote({ project }: { project?: Project }) {
  if (!project) {
    return <section className="data-section"><h2>No project quotes</h2><p>No quote is available for this customer demo account.</p></section>;
  }
  const isPending = project.status === "quote_pending";
  return (
    <section className="data-section customer-quote">
      <div className="section-toolbar"><div><b>Quote status</b><span>{project.id} · {project.name}</span></div><span className={`status-label status-${project.status}`}>{project.status.replaceAll("_", " ")}</span></div>
      <h2>{isPending ? "Your quote is being prepared" : "Your project estimate"}</h2>
      <p>{isPending ? "The shop has not shared a quote for approval yet." : "This sample estimate is for planning only; it is not a final invoice."}</p>
      <div className="customer-quote-total"><span>{isPending ? "Estimate" : "Sample estimate"}</span><b className="tabular">{isPending || project.totalCents === 0 ? "Not set" : formatMoney(project.totalCents)}</b></div>
    </section>
  );
}

function QuoteLedger() {
  const lines = [
    ["Materials", "Pipe + components · sample rate book", 100000],
    ["Labor", "10.00 h × $100.00 / h", 100000],
    ["Consumables", "5% × ($1,000.00 + $1,000.00)", 10000],
    ["Markup", "25% × $2,100.00", 52500],
    ["Tax", "6% × $2,625.00", 15750],
  ] as const;
  return <section className="quote-layout"><div className="data-section quote-list-section"><div className="section-toolbar"><div><b>Quote preview</b><span>EX-2048 · Street touring system</span></div><span className="sample-data-badge"><span/> Sample calculation</span></div><div className="quote-table">{lines.map(([label, formula, cents]) => <div className="quote-line" key={label}><span className="quote-line-title"><b>{label}</b><small>{formula}</small></span><b className="tabular">{formatMoney(cents)}</b></div>)}<div className="quote-total"><span><b>Estimated total</b><small>Estimate · not a final invoice</small></span><strong className="tabular">{formatMoney(278250)}</strong></div></div></div><aside className="rate-snapshot"><div className="eyebrow"><span className="eyebrow-line"/> RATE SNAPSHOT</div><h2>Inputs used</h2><p>Every derived amount traces to these sample assumptions.</p><dl><div><dt>Hourly labor</dt><dd>$100.00 / h</dd></div><div><dt>Consumables</dt><dd>5%</dd></div><div><dt>Markup</dt><dd>25%</dd></div><div><dt>Tax</dt><dd>6%</dd></div><div><dt>Material rates</dt><dd>Sample price book</dd></div></dl><div className="source-note"><ReceiptText size={16}/><span>Sample prices only. Shop rates are not configured in this demo.</span></div></aside></section>;
}

function ReportsPanel({ projectCount }: { projectCount: number }) {
  return <section className="reports-grid"><article className="report-card report-wide"><div className="report-card-heading"><div><span className="eyebrow"><span className="eyebrow-line"/> PIPELINE SNAPSHOT</span><h2>Shop activity</h2></div><span className="sample-data-badge"><span/> Sample data</span></div><div className="report-bars" aria-label={`${projectCount} sample projects in pipeline`}>{[2, 4, 3, 5, 2, 4, 3, 5, 4, 6, 3, 5].map((height, index) => <span aria-hidden="true" key={index} style={{ height: `${height * 12}px` }}/>)}</div><div className="report-axis"><span>12 weeks ago</span><span>Current</span></div></article><article className="report-card"><span className="eyebrow"><span className="eyebrow-line"/> BASELINE REQUIRED</span><h2>Hours saved</h2><strong className="not-set-value">Not set</strong><p>Enter your average rework hours per job before adoption to calculate this estimate.</p><button className="text-action" type="button">Configure baseline <ArrowRight size={14}/></button></article><article className="report-card"><span className="eyebrow"><span className="eyebrow-line"/> SAMPLE ONLY</span><h2>Pipeline volume</h2><strong className="not-set-value">{projectCount} <small>projects</small></strong><p>Sample records are not included in production analytics.</p><Activity className="report-watermark" aria-hidden="true" size={52}/></article></section>;
}