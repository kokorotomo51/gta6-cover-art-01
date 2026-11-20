// Vice Nights editor: wires the page — pick photos, choose a layout and a
// grade, write the caption, drag to reframe, export the cover as a PNG. A
// `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { GRADES, LAYOUTS, EXPORT_SIZES, SAMPLES, drawCover, highlightPanel, panelRects, panelAt, slotCount } from './cover.js';
import { runShot, drawShotCover } from './shots.js';

const stage = document.getElementById('stage');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');
const status = document.getElementById('status');
const zoomInput = document.getElementById('zoom');
const panXInput = document.getElementById('panx');
const panYInput = document.getElementById('pany');
const slotList = document.getElementById('slots');

const state = {
  layout: 'poster',
  grade: 'sunset',
  title: 'Sunset Heist',
  subtitle: 'Vice City',
  photos: [null, null, null, null].map(() => ({ img: null, zoom: 1, ox: 0, oy: 0 })),
  selected: 0,
};

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function previewSize() {
  return { w: stage.width, h: stage.height };
}

function redraw() {
  const { w, h } = previewSize();
  const ctx = stage.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  drawCover(ctx, w, h, state);
  const rects = panelRects(state.layout, w, h);
  if (state.selected >= 0 && state.selected < rects.length) {
    highlightPanel(ctx, rects[state.selected]);
  }
  syncSlotControls();
}

function syncSlotControls() {
  const slot = state.photos[state.selected];
  zoomInput.value = String(slot.zoom);
  panXInput.value = String(slot.ox);
  panYInput.value = String(slot.oy);
  document.querySelectorAll('#slots .slot').forEach((el, i) => {
    el.classList.toggle('active', i === state.selected);
    const img = el.querySelector('img');
    const photo = state.photos[i];
    img.src = photo.img ? photo.img.src : '';
    img.style.display = photo.img ? 'block' : 'none';
    el.querySelector('.slot-empty').style.display = photo.img ? 'none' : 'block';
  });
}

function selectPanel(i) {
  const count = slotCount(state.layout);
  state.selected = Math.max(0, Math.min(count - 1, i));
  redraw();
}

function setLayout(id) {
  state.layout = id;
  selectPanel(Math.min(state.selected, slotCount(id) - 1));
  document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('on', b.dataset.layout === id));
  redraw();
}

function setGrade(id) {
  state.grade = id;
  document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('on', b.dataset.grade === id));
  redraw();
}

/** A photo's default pan: portraits usually hold the subject in the upper
    half, so a tall photo in a wide panel starts framed toward its top instead
    of dead centre, where a face would be cut off. */
function defaultPan(img) {
  return { ox: 0, oy: img.naturalHeight > img.naturalWidth * 1.15 ? 0.55 : 0 };
}

function fillWithSamples() {
  return Promise.all(SAMPLES.map((name) => loadImage(`samples/${name}.jpg`).catch(() => null))).then((imgs) => {
    imgs.forEach((img, i) => {
      if (img) state.photos[i] = { img, zoom: 1, ...defaultPan(img) };
    });
    redraw();
  });
}

// --- Controls ---------------------------------------------------------------

LAYOUTS.forEach(({ id, name }) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'chip' + (id === state.layout ? ' on' : '');
  b.dataset.layout = id;
  b.textContent = name;
  b.addEventListener('click', () => setLayout(id));
  document.getElementById('layouts').appendChild(b);
});

GRADES.forEach(({ id, name }) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'chip' + (id === state.grade ? ' on' : '');
  b.dataset.grade = id;
  b.textContent = name;
  b.addEventListener('click', () => setGrade(id));
  document.getElementById('grades').appendChild(b);
});

titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });

zoomInput.addEventListener('input', () => {
  state.photos[state.selected].zoom = Number(zoomInput.value);
  redraw();
});
panXInput.addEventListener('input', () => {
  state.photos[state.selected].ox = Number(panXInput.value);
  redraw();
});
panYInput.addEventListener('input', () => {
  state.photos[state.selected].oy = Number(panYInput.value);
  redraw();
});

document.getElementById('upload').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const img = await loadImage(URL.createObjectURL(file));
  state.photos[state.selected] = { img, zoom: 1, ...defaultPan(img) };
  status.textContent = `Photo loaded into panel ${state.selected + 1}.`;
  redraw();
});

document.getElementById('cycle').addEventListener('click', async () => {
  const slot = state.photos[state.selected];
  const current = slot.img ? SAMPLES.findIndex((n) => slot.img.src.includes(`samples/${n}.jpg`)) : -1;
  const next = SAMPLES[(current + 1) % SAMPLES.length];
  const img = await loadImage(`samples/${next}.jpg`);
  state.photos[state.selected] = { img, zoom: 1, ...defaultPan(img) };
  status.textContent = `Panel ${state.selected + 1} now shows the ${next} sample.`;
  redraw();
});

document.getElementById('fill-all').addEventListener('click', async () => {
  const img = state.photos[state.selected].img;
  if (!img) { status.textContent = 'Load a photo into the selected panel first.'; return; }
  state.photos.forEach((slot) => { slot.img = img; slot.zoom = 1; Object.assign(slot, defaultPan(img)); });
  status.textContent = 'One photo now fills every panel.';
  redraw();
});

// Slot strip: one card per panel; click a card to select its panel.
for (let i = 0; i < 4; i++) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'slot';
  card.innerHTML = `<span class="slot-num">${i + 1}</span><img alt=""><span class="slot-empty">empty</span>`;
  card.addEventListener('click', () => selectPanel(i));
  slotList.appendChild(card);
}

// Drag on the canvas to reframe the selected panel; click to select a panel.
let drag = null;
function canvasPoint(e) {
  const r = stage.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) * (stage.width / r.width),
    y: (e.clientY - r.top) * (stage.height / r.height),
  };
}
stage.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const hit = panelAt(state.layout, stage.width, stage.height, p.x, p.y);
  if (hit >= 0) selectPanel(hit);
  drag = { x: p.x, y: p.y, moved: false };
  stage.setPointerCapture(e.pointerId);
});
stage.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const dx = p.x - drag.x;
  const dy = p.y - drag.y;
  if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
  const slot = state.photos[state.selected];
  const rects = panelRects(state.layout, stage.width, stage.height);
  const rect = rects[state.selected];
  if (slot.img && rect) {
    slot.ox = Math.max(-1, Math.min(1, slot.ox + (dx / rect.w) * 2));
    slot.oy = Math.max(-1, Math.min(1, slot.oy + (dy / rect.h) * 2));
    drag.x = p.x;
    drag.y = p.y;
    redraw();
  }
});
stage.addEventListener('pointerup', () => { drag = null; });

// --- Export -----------------------------------------------------------------

function exportCover(size) {
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawCover(off.getContext('2d'), size.w, size.h, state);
  off.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-nights-${size.id}-${size.w}x${size.h}.png`;
    a.click();
    status.textContent = `Saved ${a.download}.`;
  }, 'image/png');
}

EXPORT_SIZES.forEach((size) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'export';
  b.textContent = size.name;
  b.addEventListener('click', () => exportCover(size));
  document.getElementById('exports').appendChild(b);
});

// --- Start ------------------------------------------------------------------

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot === 'cover') {
  runShot(shot, query, async (scene) => {
    const photo = await loadImage(`samples/${scene.photo}.jpg`);
    drawShotCover(stage, scene, photo);
  });
} else if (shot === 'editor') {
  runShot(shot, query, async (scene) => {
    state.layout = scene.layout;
    state.grade = scene.grade;
    state.title = scene.title;
    state.subtitle = scene.subtitle;
    titleInput.value = scene.title;
    subtitleInput.value = scene.subtitle;
    document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('on', b.dataset.layout === scene.layout));
    document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('on', b.dataset.grade === scene.grade));
    const photo = await loadImage(`samples/${scene.photo}.jpg`);
    state.photos.forEach((slot) => {
      slot.img = photo;
      slot.zoom = 1;
      Object.assign(slot, defaultPan(photo));
    });
    state.selected = 0;
    redraw();
  });
} else {
  fillWithSamples();
}
