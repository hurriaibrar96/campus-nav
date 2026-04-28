const SCALE  = 80;  // pixels per map unit
const OFFSET = { x: 200, y: 60 }; // canvas origin offset

const NODE_COLORS = {
  default:     "#2a2a3d",
  path:        "#00cfff",
  current:     "#00ff88",
  destination: "#ff6b6b",
};

/**
 * Draws a 2D bird's-eye floor map on a canvas.
 * @param {HTMLCanvasElement} canvas
 * @param {Array}  locations      - [{ id, label, x, y }]
 * @param {Array}  path           - ordered node id array
 * @param {string} currentNodeId  - scanned/current location id
 */
export function drawFloorMap(canvas, locations, path = [], currentNodeId = "") {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const pathSet = new Set(path);
  const destId  = path[path.length - 1] ?? "";

  const toCanvas = (x, y) => ({
    cx: OFFSET.x + x * SCALE,
    cy: OFFSET.y + y * SCALE,
  });

  // Draw edges between path nodes
  if (path.length > 1) {
    ctx.strokeStyle = "#00cfff";
    ctx.lineWidth   = 3;
    ctx.setLineDash([8, 4]);
    for (let i = 0; i < path.length - 1; i++) {
      const a = locations.find((l) => l.id === path[i]);
      const b = locations.find((l) => l.id === path[i + 1]);
      if (!a || !b) continue;
      const { cx: ax, cy: ay } = toCanvas(a.x, a.y);
      const { cx: bx, cy: by } = toCanvas(b.x, b.y);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // Draw nodes
  locations.forEach(({ id, label, x, y }) => {
    const { cx, cy } = toCanvas(x, y);
    const isPath    = pathSet.has(id);
    const isCurrent = id === currentNodeId;
    const isDest    = id === destId && destId !== currentNodeId;

    const color = isCurrent ? NODE_COLORS.current
                : isDest    ? NODE_COLORS.destination
                : isPath    ? NODE_COLORS.path
                :             NODE_COLORS.default;

    // Node circle
    ctx.beginPath();
    ctx.arc(cx, cy, isCurrent || isDest ? 14 : 10, 0, Math.PI * 2);
    ctx.fillStyle   = color;
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // Label
    ctx.font      = `${isPath ? "bold" : "normal"} 11px sans-serif`;
    ctx.fillStyle = isPath ? "#ffffff" : "#aaaaaa";
    ctx.textAlign = "center";
    ctx.fillText(label, cx, cy + 24);
  });

  // Legend
  _drawLegend(ctx, canvas.width);
}

function _drawLegend(ctx, w) {
  const items = [
    { color: NODE_COLORS.current,     label: "Your location" },
    { color: NODE_COLORS.destination, label: "Destination" },
    { color: NODE_COLORS.path,        label: "Route" },
    { color: NODE_COLORS.default,     label: "Other" },
  ];
  let lx = 10;
  items.forEach(({ color, label }) => {
    ctx.beginPath();
    ctx.arc(lx + 6, 14, 6, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.font      = "11px sans-serif";
    ctx.fillStyle = "#cccccc";
    ctx.textAlign = "left";
    ctx.fillText(label, lx + 16, 18);
    lx += ctx.measureText(label).width + 30;
  });
}
