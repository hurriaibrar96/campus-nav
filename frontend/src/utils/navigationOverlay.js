export function drawOverlay(ctx, w, h, currentLabel, nextLabel, current, next) {
  ctx.clearRect(0, 0, w, h);

  if (!next) {
    _drawLabel(ctx, w, h, `✅ You have arrived at ${currentLabel}`, "#00ff88");
    return;
  }

  const dx    = next.x - current.x;
  const dy    = next.y - current.y;
  const angle = Math.atan2(dy, dx);

  _drawArrow(ctx, w / 2, h / 2, angle, 80);
  _drawLabel(ctx, w, h, `➡ Head to: ${nextLabel}`, "#ffffff");
}

function _drawArrow(ctx, cx, cy, angle, size) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.strokeStyle = "#00cfff";
  ctx.lineWidth   = 6;
  ctx.lineCap     = "round";

  ctx.beginPath();
  ctx.moveTo(-size / 2, 0);
  ctx.lineTo(size / 2, 0);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(size / 2, 0);
  ctx.lineTo(size / 2 - 20, -14);
  ctx.moveTo(size / 2, 0);
  ctx.lineTo(size / 2 - 20, 14);
  ctx.stroke();

  ctx.restore();
}

function _drawLabel(ctx, w, h, text, color) {
  ctx.font      = "bold 20px sans-serif";
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(0, h - 60, w, 60);
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.fillText(text, w / 2, h - 25);
}
