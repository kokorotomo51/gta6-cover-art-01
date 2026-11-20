// Vice Nights cover engine: draws a multi-panel GTA-style cover onto a
// canvas 2D context. Everything is drawn in code — no Rockstar logos,
// artwork or fonts, no network, no library. A photo slot is { img, zoom, ox,
// oy }: the image (or null), a zoom factor of 1 and up, and a pan offset in
// [-1, 1] in each direction. A cover state is { layout, grade, title,
// subtitle, photos } with one photo slot per panel of the layout.

export const GRADES = [
  {
    id: 'sunset',
    name: 'Vice Sunset',
    filter: 'saturate(1.35) contrast(1.08) brightness(1.02) sepia(0.18)',
    top: 'rgba(255, 122, 64, 0.10)',
    bottom: 'rgba(196, 32, 112, 0.38)',
    glow: '#ff5e8a',
  },
  {
    id: 'neon',
    name: 'Neon Night',
    filter: 'saturate(1.5) contrast(1.15) brightness(0.92) hue-rotate(-12deg)',
    top: 'rgba(24, 12, 64, 0.28)',
    bottom: 'rgba(255, 42, 140, 0.32)',
    glow: '#ff2e88',
  },
  {
    id: 'golden',
    name: 'Golden Hour',
    filter: 'saturate(1.3) contrast(1.05) brightness(1.06) sepia(0.28)',
    top: 'rgba(255, 172, 64, 0.16)',
    bottom: 'rgba(122, 42, 12, 0.24)',
    glow: '#ffb347',
  },
  {
    id: 'noir',
    name: 'Noir Nights',
    filter: 'saturate(0.55) contrast(1.25) brightness(0.9)',
    top: 'rgba(12, 12, 28, 0.35)',
    bottom: 'rgba(0, 0, 0, 0.48)',
    glow: '#9fd8ff',
  },
];

export const LAYOUTS = [
  { id: 'poster', name: 'Poster' },
  { id: 'triptych', name: 'Triptych' },
  { id: 'single', name: 'Single' },
];

export const EXPORT_SIZES = [
  { id: 'square', name: 'Square 1080', w: 1080, h: 1080 },
  { id: 'portrait', name: 'Portrait 1080 x 1350', w: 1080, h: 1350 },
  { id: 'wide', name: 'Wide 1920 x 1080', w: 1920, h: 1080 },
  { id: 'story', name: 'Story 1080 x 1920', w: 1080, h: 1920 },
];

export const SAMPLES = ['boulevard', 'pier', 'skyline', 'palms'];

/** The panel rectangles for a layout on a canvas of w by h. */
export function panelRects(layout, w, h) {
  const g = Math.max(4, Math.min(14, Math.round(w * 0.008)));
  if (layout === 'triptych') {
    const pw = (w - 2 * g) / 3;
    return [0, 1, 2].map((i) => ({ x: i * (pw + g), y: 0, w: pw, h }));
  }
  if (layout === 'single') {
    return [{ x: 0, y: 0, w, h }];
  }
  // Poster: one hero panel over three small panels.
  const heroH = Math.round(h * 0.6);
  const bottomY = heroH + g;
  const bottomH = h - bottomY;
  const pw = (w - 2 * g) / 3;
  return [
    { x: 0, y: 0, w, h: heroH },
    { x: 0, y: bottomY, w: pw, h: bottomH },
    { x: pw + g, y: bottomY, w: pw, h: bottomH },
    { x: 2 * (pw + g), y: bottomY, w: pw, h: bottomH },
  ];
}

/** Which panel index holds point (x, y), or -1. */
export function panelAt(layout, w, h, x, y) {
  const rects = panelRects(layout, w, h);
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return i;
  }
  return -1;
}

/** How many photo slots a layout uses. */
export function slotCount(layout) {
  return panelRects(layout, 100, 100).length;
}

/** Draws one photo slot into its rectangle, cover-fit, with the grade. */
function drawPhoto(ctx, rect, slot, grade) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = '#241530';
  ctx.fillRect(x, y, w, h);
  if (slot && slot.img) {
    const img = slot.img;
    const zoom = slot.zoom ?? 1;
    const base = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
    const dw = img.naturalWidth * base;
    const dh = img.naturalHeight * base;
    const ox = slot.ox ?? 0;
    const oy = slot.oy ?? 0;
    const dx = x + (w - dw) / 2 + ox * Math.max(0, (dw - w) / 2);
    const dy = y + (h - dh) / 2 + oy * Math.max(0, (dh - h) / 2);
    ctx.filter = grade.filter;
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.filter = 'none';
  }
  const tint = ctx.createLinearGradient(0, y, 0, y + h);
  tint.addColorStop(0, grade.top);
  tint.addColorStop(1, grade.bottom);
  ctx.fillStyle = tint;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  // A thin white frame, the poster's panel edge.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = Math.max(2, w * 0.002);
  ctx.strokeRect(x + ctx.lineWidth / 2, y + ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
}

/** Shrinks the font until the text fits, returning the size used. */
function fitTitleSize(ctx, text, maxWidth, start) {
  let size = start;
  ctx.font = `800 ${size}px system-ui, sans-serif`;
  while (size > 12 && ctx.measureText(text).width * 0.82 > maxWidth) {
    size -= 2;
    ctx.font = `800 ${size}px system-ui, sans-serif`;
  }
  return size;
}

/** Draws tracked (letter-spaced) capitals, centred on x. */
function drawTracked(ctx, text, cx, y, size, tracking, color, glow) {
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + tracking * (chars.length - 1);
  let x = cx - total / 2;
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = glow;
  ctx.shadowBlur = size * 0.35;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  chars.forEach((c, i) => {
    ctx.fillText(c, x, y);
    x += widths[i] + tracking;
  });
  ctx.restore();
}

/** The title block: a dark band, a big condensed title, a tracked subtitle. */
function drawTitleBlock(ctx, w, h, title, subtitle, grade) {
  const bandTop = h * 0.74;
  const band = ctx.createLinearGradient(0, bandTop, 0, h);
  band.addColorStop(0, 'rgba(8, 4, 18, 0)');
  band.addColorStop(0.45, 'rgba(8, 4, 18, 0.72)');
  band.addColorStop(1, 'rgba(8, 4, 18, 0.9)');
  ctx.fillStyle = band;
  ctx.fillRect(0, bandTop, w, h - bandTop);

  const words = (title || '').trim().toUpperCase();
  if (words) {
    const size = fitTitleSize(ctx, words, w * 0.92, Math.round(h * 0.11));
    const baseline = h - h * 0.045;
    ctx.save();
    ctx.translate(w / 2, baseline);
    ctx.scale(0.82, 1); // Squeeze the bold sans into condensed poster lettering.
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `800 ${size}px system-ui, sans-serif`;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(18, 4, 24, 0.9)';
    ctx.lineWidth = size * 0.07;
    ctx.shadowColor = grade.glow;
    ctx.shadowBlur = size * 0.28;
    ctx.strokeText(words, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(words, 0, 0);
    ctx.restore();

    const sub = (subtitle || '').trim().toUpperCase();
    if (sub) {
      const subSize = Math.max(10, Math.round(size * 0.24));
      ctx.font = `700 ${subSize}px system-ui, sans-serif`;
      drawTracked(ctx, sub, w / 2, baseline - size * 0.78, subSize, subSize * 0.42, '#ffe3f0', grade.glow);
    }
  }
}

/** Draws the whole cover for a state onto ctx at the canvas's own size. */
export function drawCover(ctx, w, h, state) {
  const grade = GRADES.find((g) => g.id === state.grade) ?? GRADES[0];
  const rects = panelRects(state.layout, w, h);
  rects.forEach((rect, i) => drawPhoto(ctx, rect, state.photos[i], grade));
  // A vignette to pull the eye to the middle.
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, 'rgba(0, 0, 0, 0.26)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
  drawTitleBlock(ctx, w, h, state.title, state.subtitle, grade);
}

/** Outlines the selected panel for the editor preview. */
export function highlightPanel(ctx, rect) {
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 6]);
  ctx.strokeRect(rect.x + 4, rect.y + 4, rect.w - 8, rect.h - 8);
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(8, 4, 18, 0.8)';
  ctx.fillRect(rect.x + 8, rect.y + 8, 118, 26);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('SELECTED PANEL', rect.x + 16, rect.y + 21);
  ctx.restore();
}
