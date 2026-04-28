const SCALE  = 95;
const OFFSET = { x: 160, y: 120 };

const AR_ANCHORS = new Set(["entrance","stage","student_counter","library_gate1","library_gate2","stairs_first_floor"]);

const HALLWAY_SPINE = [
  "entrance","sitting_area","g4_room","g3_area","stage",
  "library_gate2","library_gate1","computer_lab1","student_counter",
  "avionics_lab","aircraft_showroom","stairs_first_floor","aerolab","back_stairs"
];

function drawGrid(ctx, w, h) {
  ctx.strokeStyle = "rgba(124,92,191,0.06)";
  ctx.lineWidth   = 1;
  for (let x = 0; x < w; x += 50) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += 50) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
}

export function drawFloorMap(canvas, locations, path = [], currentNodeId = "") {
  const ctx = canvas.getContext("2d");
  const W   = canvas.width;
  const H   = canvas.height;

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0d0820");
  bg.addColorStop(1, "#0a1628");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  drawGrid(ctx, W, H);

  const pathSet = new Set(path);
  const destId  = path[path.length - 1] ?? "";
  const locMap  = Object.fromEntries(locations.map((l) => [l.id, l]));
  const toC     = (x, y) => ({ cx: OFFSET.x + x * SCALE, cy: OFFSET.y + y * SCALE });

  // Hallway spine — thick corridor background
  const spine = HALLWAY_SPINE.map((id) => locMap[id]).filter(Boolean);
  if (spine.length > 1) {
    const f = toC(spine[0].x, spine[0].y);
    // Outer glow
    ctx.beginPath();
    ctx.moveTo(f.cx, f.cy);
    spine.slice(1).forEach((n) => { const p = toC(n.x, n.y); ctx.lineTo(p.cx, p.cy); });
    ctx.strokeStyle = "rgba(74,44,158,0.18)";
    ctx.lineWidth   = 40;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
    ctx.stroke();
    // Inner corridor
    ctx.beginPath();
    ctx.moveTo(f.cx, f.cy);
    spine.slice(1).forEach((n) => { const p = toC(n.x, n.y); ctx.lineTo(p.cx, p.cy); });
    ctx.strokeStyle = "rgba(124,92,191,0.12)";
    ctx.lineWidth   = 22;
    ctx.stroke();
  }

  // All neighbor connections (dim dashed)
  ctx.setLineDash([4, 8]);
  locations.forEach(({ id, x, y, neighbors }) => {
    if (!neighbors) return;
    Object.keys(neighbors).forEach((nid) => {
      const nb = locMap[nid];
      if (!nb) return;
      const { cx: ax, cy: ay } = toC(x, y);
      const { cx: bx, cy: by } = toC(nb.x, nb.y);
      ctx.beginPath();
      ctx.moveTo(ax, ay); ctx.lineTo(bx, by);
      ctx.strokeStyle = "rgba(124,92,191,0.15)";
      ctx.lineWidth   = 1.5;
      ctx.stroke();
    });
  });
  ctx.setLineDash([]);

  // Route path — glowing purple line
  if (path.length > 1) {
    for (let i = 0; i < path.length - 1; i++) {
      const a = locMap[path[i]];
      const b = locMap[path[i + 1]];
      if (!a || !b) continue;
      const { cx: ax, cy: ay } = toC(a.x, a.y);
      const { cx: bx, cy: by } = toC(b.x, b.y);
      // Glow
      ctx.beginPath();
      ctx.moveTo(ax, ay); ctx.lineTo(bx, by);
      ctx.strokeStyle = "rgba(167,139,250,0.35)";
      ctx.lineWidth   = 14;
      ctx.lineCap     = "round";
      ctx.stroke();
      // Core
      ctx.beginPath();
      ctx.moveTo(ax, ay); ctx.lineTo(bx, by);
      ctx.strokeStyle = "#a78bfa";
      ctx.lineWidth   = 3.5;
      ctx.stroke();
      // Midpoint dot
      ctx.beginPath();
      ctx.arc((ax + bx) / 2, (ay + by) / 2, 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(167,139,250,0.7)";
      ctx.fill();
    }
  }

  // Nodes
  locations.forEach(({ id, label, x, y }) => {
    const { cx, cy } = toC(x, y);
    const isCurrent = id === currentNodeId;
    const isDest    = id === destId && destId !== currentNodeId;
    const isPath    = pathSet.has(id);
    const isAnchor  = AR_ANCHORS.has(id);

    const r = isCurrent || isDest ? 16 : isAnchor ? 12 : 8;

    // Outer glow
    if (isCurrent || isDest || isPath) {
      ctx.beginPath();
      ctx.arc(cx, cy, r + 10, 0, Math.PI * 2);
      ctx.fillStyle = isCurrent ? "rgba(61,186,126,0.2)"
                    : isDest    ? "rgba(224,85,85,0.2)"
                    :             "rgba(167,139,250,0.15)";
      ctx.fill();
    }

    // Node gradient
    const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
    if (isCurrent) {
      g.addColorStop(0, "#6ee7b7"); g.addColorStop(1, "#3dba7e");
    } else if (isDest) {
      g.addColorStop(0, "#fca5a5"); g.addColorStop(1, "#e05555");
    } else if (isPath) {
      g.addColorStop(0, "#c4b5fd"); g.addColorStop(1, "#7c5cbf");
    } else if (isAnchor) {
      g.addColorStop(0, "#2d1b69"); g.addColorStop(1, "#1a0f3d");
    } else {
      g.addColorStop(0, "#1e1640"); g.addColorStop(1, "#130e30");
    }

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = isCurrent ? "#3dba7e"
                    : isDest    ? "#e05555"
                    : isPath    ? "#a78bfa"
                    : isAnchor  ? "rgba(124,92,191,0.6)"
                    :             "rgba(124,92,191,0.2)";
    ctx.lineWidth = isCurrent || isDest ? 2.5 : 1.5;
    ctx.stroke();

    // Label
    ctx.font         = `${isCurrent || isDest || isPath ? "600" : "400"} ${isCurrent || isDest ? 11 : 10}px Inter, sans-serif`;
    ctx.fillStyle    = isCurrent ? "#6ee7b7"
                     : isDest    ? "#fca5a5"
                     : isPath    ? "#c4b5fd"
                     : isAnchor  ? "rgba(253,246,236,0.65)"
                     :             "rgba(253,246,236,0.3)";
    ctx.textAlign    = "center";
    ctx.textBaseline = "top";
    ctx.shadowColor  = "rgba(0,0,0,0.9)";
    ctx.shadowBlur   = 5;
    ctx.fillText(label, cx, cy + r + 5);
    ctx.shadowBlur   = 0;
  });
}
