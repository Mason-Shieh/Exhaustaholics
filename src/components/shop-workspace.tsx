"use client";

import { useState, type FormEvent } from "react";
import {
  Activity, ArrowRight, ArrowUpRight, Bell, CarFront, ChartNoAxesCombined,
  Check, ChevronDown, CircleCheck, Clock3, FolderKanban, Gauge,
  DraftingCompass, LayoutDashboard, Plus, ReceiptText, Search, Users, X,
} from "lucide-react";
import DesignerView from "./designer-view";

type ProjectStatus = "quote_pending" | "awaiting_approval" | "in_build" | "completed";
type WorkspaceView = "overview" | "projects" | "garage" | "designer" | "quotes" | "reports";
type SoundPreference = "deep" | "aggressive" | "race" | "mild" | "exotic";

interface Vehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  engine: string;
  envelope: string;
}

interface Project {
  id: string;
  name: string;
  customer: string;
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

const sampleVehicles: Vehicle[] = [
  { id: "v1", year: 2021, make: "Ford", model: "Mustang GT", trim: "Premium", engine: "5.0L V8", envelope: "Parametric envelope" },
  { id: "v2", year: 2020, make: "BMW", model: "M340i", trim: "xDrive", engine: "3.0L turbo I6", envelope: "Parametric envelope" },
  { id: "v3", year: 2018, make: "Subaru", model: "WRX STI", trim: "Limited", engine: "2.5L turbo flat-4", envelope: "Parametric envelope" },
  { id: "v4", year: 2023, make: "Chevrolet", model: "Corvette Stingray", trim: "3LT", engine: "6.2L V8", envelope: "Parametric envelope" },
];

const starterProjects: Project[] = [
  { id: "EX-2048", name: "Street touring system", customer: "Jordan Lee", vehicleId: "v2", status: "quote_pending", totalCents: 278250, soundLevel: 5, soundPreference: "deep", performancePriority: "medium", budgetBand: "2000", exitStyle: "dual", updated: "18 min ago" },
  { id: "EX-2047", name: "Axle-back refresh", customer: "Maya Torres", vehicleId: "v1", status: "quote_pending", totalCents: 164900, soundLevel: 7, soundPreference: "aggressive", performancePriority: "high", budgetBand: "2000", exitStyle: "dual", updated: "1 hr ago" },
  { id: "EX-2044", name: "Weekend track setup", customer: "Chris Patel", vehicleId: "v3", status: "awaiting_approval", totalCents: 324500, soundLevel: 8, soundPreference: "race", performancePriority: "high", budgetBand: "5000+", exitStyle: "single", updated: "Yesterday" },
  { id: "EX-2041", name: "Valved performance system", customer: "Alex Morgan", vehicleId: "v4", status: "in_build", totalCents: 489000, soundLevel: 6, soundPreference: "exotic", performancePriority: "high", budgetBand: "5000+", exitStyle: "quad", updated: "2 days ago" },
  { id: "EX-2038", name: "Daily driver resonator", customer: "Sam Rivera", vehicleId: "v2", status: "completed", totalCents: 198750, soundLevel: 3, soundPreference: "mild", performancePriority: "low", budgetBand: "1000", exitStyle: "dual", updated: "Oct 28" },
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

const formatMoney = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

const vehicleLabel = (vehicle?: Vehicle) => vehicle
  ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
  : "Vehicle not selected";

export default function ShopWorkspace() {
  const [view, setView] = useState<WorkspaceView>("overview");
  const [projects, setProjects] = useState(starterProjects);
  const [vehicles, setVehicles] = useState(sampleVehicles);
  const [search, setSearch] = useState("");
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newVehicleOpen, setNewVehicleOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeDesignProject, setActiveDesignProject] = useState<Project | null>(null);
  const [soundLevel, setSoundLevel] = useState(5);

  const filteredProjects = projects.filter((project) => {
    const vehicle = vehicles.find((item) => item.id === project.vehicleId);
    return `${project.id} ${project.name} ${project.customer} ${vehicleLabel(vehicle)}`
      .toLowerCase().includes(search.toLowerCase());
  });
  const activeTitle = navigation.find((item) => item.id === view)?.label ?? "Overview";

  function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const project: Project = {
      id: `EX-${2050 + projects.length}`,
      name: String(values.get("name")),
      customer: String(values.get("customer")),
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
      year: Number(values.get("year")),
      make: String(values.get("make")),
      model: String(values.get("model")),
      trim: String(values.get("trim") || "Manual entry"),
      engine: String(values.get("engine") || "Not specified"),
      envelope: "Manual entry",
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
          {navigation.map(({ id, label, icon: Icon }) => (
            <button aria-current={view === id ? "page" : undefined} className={`nav-item ${view === id ? "is-active" : ""}`} key={id} onClick={() => setView(id)} type="button">
              <Icon aria-hidden="true" size={17} strokeWidth={1.8} /><span>{label}</span>
              {id === "projects" && <span className="nav-count">{projects.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="data-quality-card"><div className="data-quality-icon"><Gauge aria-hidden="true" size={17} /></div><b>Vehicle data</b><p>Parametric envelopes are approximations. Verify fit before fabrication.</p></div>
          <button className="nav-item settings-button" onClick={() => setView("reports")} type="button"><Users aria-hidden="true" size={17} /><span>Shop settings</span></button>
          <div className="account-row"><span className="account-avatar">ML</span><span><b>Morgan Lee</b><small>Shop owner</small></span><ChevronDown aria-hidden="true" size={14} /></div>
        </div>
      </aside>

      <section className="workspace-main">
        <header className="topbar">
          <div className="breadcrumb"><span>Northline Fabrication</span><span className="breadcrumb-slash">/</span><b>{activeTitle}</b></div>
          <div className="topbar-actions">
            <label className="search-box"><Search aria-hidden="true" size={16} /><input aria-label="Search projects and vehicles" onChange={(event) => setSearch(event.target.value)} placeholder="Search projects, vehicles" value={search} /><kbd>/</kbd></label>
            <button className="icon-button notification-button" type="button" aria-label="Notifications"><Bell aria-hidden="true" size={17} /><span /></button>
            <span className="demo-chip"><span /> DEMO MODE</span>
          </div>
        </header>

        <div className="content-area">
          <div className="page-heading">
            <div><div className="eyebrow"><span className="eyebrow-line" /> SHOP FLOOR / 01</div><h1>{view === "overview" ? "Shop overview" : activeTitle}</h1><p className="heading-subtitle">{view === "garage" ? "Vehicles and fitment data for your customers." : view === "designer" ? "Edit design intent before any material is cut." : view === "quotes" ? "Transparent estimates with inputs shown on every line." : view === "reports" ? "Operational signals from this sample workspace." : "Keep every exhaust project moving, from first quote to final fit check."}</p></div>
            <div className="heading-actions"><span className="sample-data-badge"><span /> Sample data</span><button className="primary-button" onClick={() => setNewProjectOpen(true)} type="button"><Plus aria-hidden="true" size={17} /> New project</button></div>
          </div>

          {view === "overview" && <>
            <section className="metric-grid" aria-label="Shop pipeline summary">
              <article className="metric-card metric-highlight"><div className="metric-label">Open quote value <ArrowUpRight aria-hidden="true" size={15} /></div><div className="metric-value tabular">{formatMoney(projects.filter((project) => project.status === "quote_pending").reduce((sum, project) => sum + project.totalCents, 0))}</div><div className="metric-foot"><span className="metric-dot blue" /> Sample quotes · not shop rates</div></article>
              <article className="metric-card"><div className="metric-label">Awaiting approval</div><div className="metric-value tabular">{projects.filter((project) => project.status === "awaiting_approval").length.toString().padStart(2, "0")}</div><div className="metric-foot"><span className="metric-dot amber" /> Customer review</div></article>
              <article className="metric-card"><div className="metric-label">Active builds</div><div className="metric-value tabular">{projects.filter((project) => project.status === "in_build").length.toString().padStart(2, "0")}</div><div className="metric-foot"><span className="metric-dot green" /> In the shop</div></article>
              <article className="metric-card"><div className="metric-label">Completed this month</div><div className="metric-value tabular">06</div><div className="metric-foot"><span className="metric-dot silver" /> Sample shop history</div></article>
            </section>
            <PipelineBoard projects={filteredProjects} onOpen={setSelectedProject} onViewAll={() => setView("projects")} />
            <div className="workspace-footnote">Design tool. Always verify measurements and fit before fabrication.</div>
          </>}

          {view === "projects" && <><div className="section-toolbar"><div><b>Project pipeline</b><span>{filteredProjects.length} projects · values are sample estimates</span></div><button className="quiet-button" type="button"><span className="filter-glyph" /> Filter</button></div><PipelineBoard projects={filteredProjects} onOpen={setSelectedProject} /><div className="workspace-footnote">Approved revisions are immutable. Changes require a new revision and approval.</div></>}

          {view === "garage" && <section className="data-section"><div className="section-toolbar"><div><b>Customer garage</b><span>Vehicle specs and envelope provenance</span></div><button className="quiet-button" onClick={() => setNewVehicleOpen(true)} type="button"><Plus size={15} /> Add vehicle</button></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Vehicle</th><th>Trim / engine</th><th>Data source</th><th>Projects</th><th /></tr></thead><tbody>{vehicles.map((vehicle) => <tr key={vehicle.id}><td><div className="vehicle-cell"><span className="vehicle-icon"><CarFront aria-hidden="true" size={18} /></span><span><b>{vehicleLabel(vehicle)}</b><small>{vehicle.envelope === "Parametric envelope" ? "Sample record" : "Manual entry"}</small></span></div></td><td><b>{vehicle.trim}</b><small>{vehicle.engine}</small></td><td><span className={`source-badge ${vehicle.envelope === "Parametric envelope" ? "source-parametric" : "source-manual"}`}><span />{vehicle.envelope}</span></td><td className="tabular">{projects.filter((project) => project.vehicleId === vehicle.id).length}</td><td><button className="text-action" onClick={() => setNewProjectOpen(true)} type="button">New project <ArrowRight size={14} /></button></td></tr>)}</tbody></table></div><p className="table-disclaimer">Parametric envelopes are class-based approximations, not vehicle scans. Confirm measurements on the vehicle.</p></section>}

          {view === "quotes" && <QuoteLedger />}
          {view === "reports" && <ReportsPanel projectCount={projects.length} />}
          {view === "designer" && <DesignerView projectName={activeDesignProject?.name ?? projects[0]?.name ?? "New exhaust design"} vehicleName={vehicleLabel(vehicles.find((vehicle) => vehicle.id === (activeDesignProject?.vehicleId ?? projects[0]?.vehicleId)))} />}
        </div>
      </section>

      {newProjectOpen && <ProjectDialog onClose={() => setNewProjectOpen(false)} onSubmit={createProject} soundLevel={soundLevel} setSoundLevel={setSoundLevel} vehicles={vehicles} />}
      {newVehicleOpen && <VehicleDialog onClose={() => setNewVehicleOpen(false)} onSubmit={addVehicle} />}
      {selectedProject && <ProjectDetails project={selectedProject} vehicles={vehicles} onClose={() => setSelectedProject(null)} onDesign={() => { setActiveDesignProject(selectedProject); setSelectedProject(null); setView("designer"); }} />}
    </main>
  );
}

function PipelineBoard({ projects, onOpen, onViewAll }: { projects: Project[]; onOpen: (project: Project) => void; onViewAll?: () => void }) {
  return <section className="pipeline-section"><div className="section-toolbar"><div><b>Project pipeline</b><span>Design approval before fabrication</span></div>{onViewAll && <button className="text-action" onClick={onViewAll} type="button">View all projects <ArrowRight size={14} /></button>}</div><div className="pipeline-board">{stages.map(({ id, title, icon: Icon }) => { const items = projects.filter((project) => project.status === id); return <section className="pipeline-column" key={id} aria-label={`${title}, ${items.length} projects`}><div className="column-heading"><span className={`stage-icon stage-${id}`}><Icon aria-hidden="true" size={15} /></span><h2>{title}</h2><span className="column-count">{items.length}</span><button className="more-button" type="button" aria-label={`More ${title} actions`}><span>···</span></button></div><div className="column-cards">{items.map((project) => <button className="project-card" key={project.id} onClick={() => onOpen(project)} type="button"><div className="project-card-top"><span className="project-id">{project.id}</span><ArrowUpRight aria-hidden="true" size={15} /></div><strong>{project.name}</strong><span className="project-vehicle">{vehicleLabel(sampleVehicles.find((vehicle) => vehicle.id === project.vehicleId))}</span><div className="project-card-footer"><span>{project.customer}</span><b className="tabular">{project.totalCents === 0 ? "Not set" : formatMoney(project.totalCents)}</b></div><div className="project-card-meta"><span className="sample-mark"><span /> Sample</span><span>{project.updated}</span></div></button>)}{items.length === 0 && <div className="empty-column">No projects in this stage</div>}</div></section>; })}</div></section>;
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