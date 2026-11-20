[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/kokorotomo51/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/kokorotomo51/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Entered in [gta6-cover-art-01](https://make.fun/bounty/gta6-cover-art-01).

# Vice Nights — GTA-style cover studio

Turn your photos and a caption into GTA-style cover art, in the browser,
offline. Pick a layout, a neon grade and a caption, drag each photo to
reframe it, and export the cover as a PNG in the sizes you post.

## What it does

- **3 layouts** — Poster (one hero panel over three small ones), Triptych
  (three tall panels), Single (full bleed).
- **4 photo slots** — upload your own photos or cycle the samples. Click a
  panel to select it, drag on the canvas to reframe it, or use the zoom and
  pan sliders. One photo can fill every panel.
- **4 neon grades** — Vice Sunset, Neon Night, Golden Hour, Noir Nights:
  canvas colour grading plus a sunset or neon tint over every panel.
- **Poster lettering** — a big condensed title with a dark outline and neon
  glow, and a letterspaced subtitle, both auto-fitted to the cover.
- **4 export sizes** — Square 1080, Portrait 1080 x 1350, Wide 1920 x 1080,
  Story 1080 x 1920, each as a PNG.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. Everything runs on your machine: photos are
read locally and never uploaded, and the app makes no network request.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and
writes `dossier.json` with the vendored make.fun library.

## Screenshots

The four images in `screenshots/` were taken with the app itself:
`1-cover.jpg` is an exported Poster cover, `2-editor.jpg` the editor with a
photo loaded, `3-cover-portrait.jpg` an exported Triptych cover, and
`4-editor-panels.jpg` the editor in the Triptych layout. They were captured
from the fixed scenes in `shots.json` (`?shot=cover` and `?shot=editor`).

## Notes

- No Rockstar Games logo, artwork or font is used anywhere. The lettering is
  a bold system sans, squeezed into condensed poster type in code.
- The two sample photos `boulevard.jpg` and `pier.jpg` were made for
  make.fun with an image model and are free to use. `skyline.jpg` and
  `palms.jpg` are stylised sunset scenes painted in code.
