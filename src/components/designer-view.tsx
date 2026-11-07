"use client";

import { useEffect, useState } from "react";
import { Plus, Redo2, Ruler, Undo2 } from "lucide-react";
import {
  measureCenterline,
  type PipeNode,
  type Vec3,
} from "../../lib/geometry";

type ViewMode = "plan" | "side";
type Material = "ss304" | "aluminized" | "titanium";

const initialNodes: PipeNode[] = [
  { id: "A", position: [12, 0, 9] },
  { id: "B", position: [50, 0, 9] },
  { id: "C", position: [50, 18, 9] },
  { id: "D", position: [90, 18, 8] },
];

const scale = 3.5;
const originX = 82;
const originY = 184;
const keepOut = { minX: 68, maxX: 82, minY: 10, maxY: 26 };

function svgPoint(node: PipeNode, view: ViewMode): [number, number] {
  const y = view === "plan" ? node.position[1] : (9 - node.position[2]) * 8;
  return [originX + node.position[0] * scale, originY + y * scale];
}

function routeTouchesKeepOut(nodes: readonly PipeNode[], view: ViewMode): boolean {
  const projected = nodes.map((node) => [
    node.position[0],
    view === "plan" ? node.position[1] : (9 - node.position[2]) * 2,
  ] as const);
  return projected.slice(1).some((point, index) => {
    const previous = projected[index];
    const overlapsX = Math.max(previous[0], point[0]) >= keepOut.minX && Math.min(previous[0], point[0]) <= keepOut.maxX;
    const overlapsY = Math.max(previous[1], point[1]) >= keepOut.minY && Math.min(previous[1], point[1]) <= keepOut.maxY;
    return overlapsX && overlapsY;
  });
}

export default function DesignerView({ projectName, vehicleName }: { projectName: string; vehicleName: string }) {
  const [nodes, setNodes] = useState(initialNodes);
  const [selectedNodeId, setSelectedNodeId] = useState("B");
  const [view, setView] = useState<ViewMode>("plan");
  const [material, setMaterial] = useState<Material>("ss304");
  const [diameter, setDiameter] = useState(2.5);
  const [showKeepOut, setShowKeepOut] = useState(true);
  const [components, setComponents] = useState(["Resonator", "Muffler"]);
  const [past, setPast] = useState<PipeNode[][]>([]);
  const [future, setFuture] = useState<PipeNode[][]>([]);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [readOnly, setReadOnly] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 720px)");
    const updateReadOnly = () => setReadOnly(media.matches);
    updateReadOnly();
    media.addEventListener("change", updateReadOnly);
    return () => media.removeEventListener("change", updateReadOnly);
  }, []);

  let measurement: ReturnType<typeof measureCenterline> | null = null;
  let validationMessage: string | null = null;
  try {
    measurement = measureCenterline(nodes, { pipeDiameter: diameter });
  } catch (error) {
    validationMessage = error instanceof Error ? error.message : "Unable to measure this route.";
  }

  const points = nodes.map((node) => svgPoint(node, view).join(",")).join(" ");
  const possibleInterference = showKeepOut && routeTouchesKeepOut(nodes, view);

  function recordChange() {
    setPast((current) => [...current.slice(-29), nodes]);
    setFuture([]);
  }

  function setNodePosition(nodeId: string, x: number, y: number) {
    setNodes((current) => current.map((node) => {
      if (node.id !== nodeId) return node;
      const position: Vec3 = view === "plan"
        ? [x, y, node.position[2]]
        : [x, node.position[1], 9 - y / 2];
      return { ...node, position };
    }));
  }

  function undo() {
    if (readOnly || past.length === 0) return;
    setFuture((current) => [...current, nodes]);
    setNodes(past[past.length - 1]);
    setPast((current) => current.slice(0, -1));
  }

  function redo() {
    if (readOnly || future.length === 0) return;
    setPast((current) => [...current, nodes]);
    setNodes(future[future.length - 1]);
    setFuture((current) => current.slice(0, -1));
  }

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (readOnly || !draggingNodeId) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const xPx = ((event.clientX - bounds.left) / bounds.width) * 640;
    const yPx = ((event.clientY - bounds.top) / bounds.height) * 360;
    const x = Math.max(0, Math.round((xPx - originX) / scale));
    const y = Math.max(0, Math.round((yPx - originY) / scale));
    setNodePosition(draggingNodeId, x, y);
  }

  function handleNodeKeyDown(event: React.KeyboardEvent<SVGCircleElement>, node: PipeNode) {
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const move = moves[event.key];
    if (!move || readOnly) return;
    event.preventDefault();
    setSelectedNodeId(node.id);
    recordChange();
    setNodePosition(node.id, node.position[0] + move[0],
      (view === "plan" ? node.position[1] : (9 - node.position[2]) * 2) + move[1]);
  }

  function addComponent(event: React.ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    if (!value || readOnly) return;
    setComponents((current) => [...current, value]);
    event.target.value = "";
  }

  const zoneX = originX + keepOut.minX * scale;
  const zoneY = view === "plan" ? originY + keepOut.minY * scale : originY + keepOut.minY * scale;

  return (
    <section className="designer-workspace">
      <header className="designer-heading">
        <div><div className="eyebrow"><span className="eyebrow-line" /> DESIGN INTENT / REVISION 01</div><h2>{projectName}</h2><p>{vehicleName} <span>·</span> Parametric envelope <span className="data-quality-tag">Approximate</span></p></div>
        <div className="designer-heading-right"><span className="draft-label"><span /> Draft</span><button className="primary-button" disabled type="button">Save draft</button></div>
      </header>

      {readOnly && <div className="phone-readonly-banner">Read-only on phones · use a tablet or desktop to edit this route.</div>}

      <div className="designer-toolbar">
        <div className="view-toggle" role="tablist" aria-label="Exhaust drawing view"><button aria-selected={view === "plan"} className={view === "plan" ? "selected" : ""} onClick={() => setView("plan")} role="tab" type="button">Plan view</button><button aria-selected={view === "side"} className={view === "side" ? "selected" : ""} onClick={() => setView("side")} role="tab" type="button">Side view</button></div>
        <div className="designer-actions"><button aria-label="Undo route change" className="icon-button" disabled={readOnly || past.length === 0} onClick={undo} title="Undo" type="button"><Undo2 size={17}/></button><button aria-label="Redo route change" className="icon-button" disabled={readOnly || future.length === 0} onClick={redo} title="Redo" type="button"><Redo2 size={17}/></button><button aria-pressed={showKeepOut} className={`quiet-button ${showKeepOut ? "toggle-on" : ""}`} onClick={() => setShowKeepOut((value) => !value)} type="button">Keep-out zones</button></div>
      </div>

      <div className="designer-grid">
        <div className="canvas-column">
          <div className="designer-canvas-wrap">
            <div className="canvas-title"><span>{view === "plan" ? "TOP-DOWN ROUTING" : "SIDE PROFILE"}</span><span className="canvas-scale">GRID · 1 IN SNAP</span></div>
            <svg aria-label={`${view} view exhaust route; nodes can be selected and nudged with arrow keys`} className="designer-svg" onPointerMove={handlePointerMove} onPointerUp={() => setDraggingNodeId(null)} role="img" viewBox="0 0 640 360">
              <defs><pattern height="28" id="designer-grid" patternUnits="userSpaceOnUse" width="28"><path d="M 28 0 L 0 0 0 28" fill="none" stroke="#23303a" strokeWidth=".6"/></pattern><pattern height="8" id="keepout-hatch" patternUnits="userSpaceOnUse" width="8"><path d="M-2 2L2-2M0 8L8 0M6 10L10 6" stroke="#d88383" strokeOpacity=".42" strokeWidth="1"/></pattern></defs>
              <rect fill="url(#designer-grid)" height="360" width="640"/>
              <path className="vehicle-envelope" d="M155 48 Q140 54 140 86 L140 274 Q140 307 163 316 L476 316 Q499 307 499 274 L499 86 Q499 54 476 48 Z"/>
              <path className="vehicle-rail" d="M204 72 L204 292 M440 72 L440 292"/>
              <path className="vehicle-crossmember" d="M178 125 L462 125 M178 248 L462 248"/>
              <rect className="vehicle-wheel" height="54" rx="13" width="35" x="123" y="89"/><rect className="vehicle-wheel" height="54" rx="13" width="35" x="123" y="232"/>
              <rect className="vehicle-wheel" height="54" rx="13" width="35" x="481" y="89"/><rect className="vehicle-wheel" height="54" rx="13" width="35" x="481" y="232"/>
              {showKeepOut && <g><rect className="keepout-zone" height="56" width="49" x={zoneX} y={zoneY}/><rect fill="url(#keepout-hatch)" height="56" width="49" x={zoneX} y={zoneY}/><text className="keepout-label" x={zoneX + 3} y={zoneY - 7}>AXLE KEEP-OUT</text></g>}
              <polyline className="route-shadow" points={points}/><polyline className="route-line" points={points}/>
              {nodes.map((node, index) => { const [x, y] = svgPoint(node, view); return <g key={node.id}><circle className={`route-node ${selectedNodeId === node.id ? "node-selected" : ""}`} cx={x} cy={y} onKeyDown={(event) => handleNodeKeyDown(event, node)} onPointerDown={(event) => { if (readOnly) return; recordChange(); setSelectedNodeId(node.id); setDraggingNodeId(node.id); event.currentTarget.setPointerCapture(event.pointerId); }} r="7" role="button" tabIndex={readOnly ? -1 : 0} aria-label={`Route node ${index + 1}; use arrow keys to nudge`} /><text className="node-label" x={x + 10} y={y - 10}>{node.id}</text></g>; })}
              {components.map((component, index) => { const node = nodes[Math.min(index + 1, nodes.length - 1)]; const [x, y] = svgPoint(node, view); return <g key={`${component}-${index}`}><rect className="component-block" height="17" rx="3" width="45" x={x - 22} y={y + 10 + index * 3}/><text className="component-label" textAnchor="middle" x={x} y={y + 22 + index * 3}>{component}</text></g>; })}
            </svg>
            <div className="canvas-legend"><span><i className="legend-pipe"/> Design route</span><span><i className="legend-zone"/> Keep-out heuristic</span><span><i className="legend-vehicle"/> Parametric envelope</span></div>
          </div>
          <div className="geometry-table-wrap"><div className="geometry-table-heading"><span>ROUTE COORDINATES</span><span>INCHES</span></div><table className="geometry-table"><thead><tr><th>Node</th><th>X</th><th>Y</th><th>Z</th><th>Bend</th><th>Radius</th></tr></thead><tbody>{nodes.map((node) => { const bend = measurement?.bends.find((item) => item.nodeId === node.id); return <tr key={node.id}><td>{node.id}</td><td>{node.position[0].toFixed(1)}</td><td>{node.position[1].toFixed(1)}</td><td>{node.position[2].toFixed(1)}</td><td>{bend ? `${bend.angleDegrees.toFixed(1)}°` : "—"}</td><td>{bend ? `${bend.radius.toFixed(2)} in` : "—"}</td></tr>; })}</tbody></table></div>
        </div>

        <aside className="designer-inspector">
          <div className="inspector-section"><div className="inspector-heading"><Ruler size={16}/><h3>Design parameters</h3></div><label className="inspector-field">Pipe diameter<select disabled={readOnly} onChange={(event) => setDiameter(Number(event.target.value))} value={diameter}><option value="2">2 in</option><option value="2.25">2.25 in</option><option value="2.5">2.5 in</option><option value="3">3 in</option></select></label><label className="inspector-field">Material<select disabled={readOnly} onChange={(event) => setMaterial(event.target.value as Material)} value={material}><option value="ss304">304 stainless steel</option><option value="aluminized">Aluminized steel</option><option value="titanium">Titanium</option></select></label><div className="measurement-readout"><span>Centerline length</span><b>{measurement ? `${measurement.lengthInches.toFixed(2)} in` : "Invalid route"}</b><small>Filleted centerline · estimate</small></div><div className="measurement-readout"><span>Mandrel bends</span><b>{measurement?.bends.length ?? "—"}</b><small>Threshold: over 5°</small></div></div>
          <div className="inspector-section"><div className="inspector-heading"><Plus size={16}/><h3>Components</h3></div><label className="sr-only" htmlFor="component-add">Add a component</label><select className="component-select" disabled={readOnly} id="component-add" onChange={addComponent} value=""><option value="">Add component…</option><option>Muffler</option><option>Resonator</option><option>X-pipe</option><option>H-pipe</option><option>Y-pipe</option><option>V-band</option><option>Tip</option><option>Valve system</option></select><div className="component-list">{components.map((component, index) => <div key={`${component}-${index}`}><span>{component}</span><button aria-label={`Remove ${component}`} disabled={readOnly} onClick={() => setComponents((current) => current.filter((_, itemIndex) => itemIndex !== index))} type="button">×</button></div>)}</div></div>
          <div className={`clearance-note ${possibleInterference ? "possible-interference" : ""}`}><span className="clearance-indicator"/><div><b>{possibleInterference ? "Possible interference (heuristic)" : "Heuristic overlay"}</b><p>{possibleInterference ? "Route overlaps the displayed envelope zone. Confirm clearance on the vehicle." : "Zones are approximate. Confirm every clearance on the vehicle."}</p></div></div>
          {validationMessage && <p className="geometry-error" role="alert">{validationMessage}</p>}
          <p className="designer-disclaimer">Design intent only · {material === "ss304" ? "304 stainless" : material === "aluminized" ? "Aluminized steel" : "Titanium"} · verify fit before fabrication.</p>
        </aside>
      </div>
    </section>
  );
}