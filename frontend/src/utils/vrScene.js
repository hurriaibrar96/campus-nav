const SCALE  = 95;
const OFFSET = { x: 160, y: 120 };

const HIDDEN_NODES = new Set([
  "corridor_junction", "main_corridor_junction", "library_junction",
  "g2_junction", "medan", "back_stairs", "emergency_exit", "stage", "main_building"
]);

const HALLWAY_SPINE = [
  "entrance", "carbs_dept", "computer_lab", "library_gate1",
  "g3", "sitting_area2", "g4", "aerolab", "ahs_corridor", "ahs_faculty"
];

function drawGrid(ctx, w, h) {
  ctx.strokeStyle = "rgba(123,45,139,0.08)";
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

  const PAD = 80;
  const xs  = locations.map((l) => l.x);
  const ys  = locations.map((l) => l.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const scaleX = (W - PAD * 2) / (maxX - minX || 1);
  const scaleY = (H - PAD * 2) / (maxY - minY || 1);
  const SCALE  = Math.min(scaleX, scaleY);
  const OFFSET = {
    x: PAD + ((W - PAD * 2) - (maxX - minX) * SCALE) / 2 - minX * SCALE,
    y: PAD + ((H - PAD * 2) - (maxY - minY) * SCALE) / 2 - minY * SCALE,
  };
  const toC = (x, y) => ({ cx: OFFSET.x + x * SCALE, cy: OFFSET.y + y * SCALE });

  // Background — soft warm parchment
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#fdf6ec");
  bg.addColorStop(0.5, "#f5eef8");
  bg.addColorStop(1, "#ede8f5");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  drawGrid(ctx, W, H);

  const pathSet = new Set(path);
  const destId  = path[path.length - 1] ?? "";
  const locMap  = Object.fromEntries(locations.map((l) => [l.id, l]));

  // Hallway spine — thick corridor background
  const spine = HALLWAY_SPINE.map((id) => locMap[id]).filter(Boolean);
  if (spine.length > 1) {
    const f = toC(spine[0].x, spine[0].y);
    // Outer glow
    ctx.beginPath();
    ctx.moveTo(f.cx, f.cy);
    spine.slice(1).forEach((n) => { const p = toC(n.x, n.y); ctx.lineTo(p.cx, p.cy); });
    ctx.strokeStyle = "rgba(123,45,139,0.12)";
    ctx.lineWidth   = 40;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
    ctx.stroke();
    // Inner corridor
    ctx.beginPath();
    ctx.moveTo(f.cx, f.cy);
    spine.slice(1).forEach((n) => { const p = toC(n.x, n.y); ctx.lineTo(p.cx, p.cy); });
    ctx.strokeStyle = "rgba(123,45,139,0.07)";
    ctx.lineWidth   = 22;
    ctx.stroke();
  }

  // All neighbor connections (dim dashed)
  ctx.setLineDash([4, 8]);
  locations.filter(l => !HIDDEN_NODES.has(l.id)).forEach(({ id, x, y, neighbors }) => {
    if (!neighbors) return;
    Object.keys(neighbors).forEach((nid) => {
      const nb = locMap[nid];
      if (!nb) return;
      const { cx: ax, cy: ay } = toC(x, y);
      const { cx: bx, cy: by } = toC(nb.x, nb.y);
      ctx.beginPath();
      ctx.moveTo(ax, ay); ctx.lineTo(bx, by);
      ctx.strokeStyle = "rgba(123,45,139,0.25)";
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
      ctx.strokeStyle = "rgba(123,45,139,0.2)";
      ctx.lineWidth   = 14;
      ctx.lineCap     = "round";
      ctx.stroke();
      // Core
      ctx.beginPath();
      ctx.moveTo(ax, ay); ctx.lineTo(bx, by);
      ctx.strokeStyle = "#7B2D8B";
      ctx.lineWidth   = 3.5;
      ctx.stroke();
      // Midpoint dot
      ctx.beginPath();
      ctx.arc((ax + bx) / 2, (ay + by) / 2, 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(123,45,139,0.7)";
      ctx.fill();
    }
  }

  // Nodes
  locations.filter(l => !HIDDEN_NODES.has(l.id)).forEach(({ id, label, x, y }) => {
    const { cx, cy } = toC(x, y);
    const isCurrent = id === currentNodeId;
    const isDest    = id === destId && destId !== currentNodeId;
    const isPath    = pathSet.has(id);

    const r = isCurrent || isDest ? 16 : isPath ? 12 : 8;

    // Outer glow
    if (isCurrent || isDest || isPath) {
      ctx.beginPath();
      ctx.arc(cx, cy, r + 10, 0, Math.PI * 2);
      ctx.fillStyle = isCurrent ? "rgba(61,186,126,0.2)"
                    : isDest    ? "rgba(224,85,85,0.2)"
                    :             "rgba(245,197,24,0.15)";
      ctx.fill();
    }

    // Node gradient
    const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
    if (isCurrent) {
      g.addColorStop(0, "#6ee7b7"); g.addColorStop(1, "#3dba7e");
    } else if (isDest) {
      g.addColorStop(0, "#fca5a5"); g.addColorStop(1, "#e05555");
    } else if (isPath) {
      g.addColorStop(0, "#ffd740"); g.addColorStop(1, "#f5c518");
    } else {
      g.addColorStop(0, "#e8d5f0"); g.addColorStop(1, "#d4b8e8");
    }

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = isCurrent ? "#3dba7e"
                    : isDest    ? "#e05555"
                    : isPath    ? "#f5c518"
                    :             "rgba(123,45,139,0.4)";
    ctx.lineWidth = isCurrent || isDest ? 2.5 : 1.5;
    ctx.stroke();

    // Label
    ctx.font         = `${isCurrent || isDest || isPath ? "600" : "400"} ${isCurrent || isDest ? 11 : 10}px Inter, sans-serif`;
    ctx.fillStyle    = isCurrent ? "#16a34a"
                     : isDest    ? "#dc2626"
                     : isPath    ? "#7B2D8B"
                     :             "rgba(42,10,48,0.55)";
    ctx.textAlign    = "center";
    ctx.textBaseline = "top";
    ctx.shadowColor  = "rgba(255,255,255,0.8)";
    ctx.shadowBlur   = 4;
    ctx.fillText(label, cx, cy + r + 5);
    ctx.shadowBlur   = 0;
  });
}
