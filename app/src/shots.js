// Fixed scenes for screenshots: ?shot=editor shows the page with a sample
// photo loaded; ?shot=cover shows the cover alone, full viewport. `layout`,
// `grade`, `photo` and `caption` pick the scene; `subtitle` the small line.
// window.__shotReady is set once the scene has painted, twice through
// requestAnimationFrame so the canvas is on screen when the shot is taken.
import { drawCover } from './cover.js';

export async function runShot(shot, query, setup) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const scene = {
    layout: query.get('layout') ?? 'poster',
    grade: query.get('grade') ?? 'sunset',
    title: query.get('caption') ?? 'Sunset Heist',
    subtitle: query.get('subtitle') ?? 'Vice City',
    photo: query.get('photo') ?? 'boulevard',
  };
  await setup(scene);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}

/** Draws a cover scene straight onto a canvas of the viewport's size. */
export function drawShotCover(canvas, scene, photo) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w;
  canvas.height = h;
  // Portraits hold their subject in the upper half: frame toward the top so
  // a wide panel shows the face instead of the chest.
  const oy = photo.naturalHeight > photo.naturalWidth * 1.15 ? 0.55 : 0;
  const slots = [{ img: photo, zoom: 1, ox: 0, oy }];
  while (slots.length < 4) slots.push({ img: photo, zoom: 1, ox: 0, oy });
  drawCover(canvas.getContext('2d'), w, h, {
    layout: scene.layout,
    grade: scene.grade,
    title: scene.title,
    subtitle: scene.subtitle,
    photos: slots,
  });
}
