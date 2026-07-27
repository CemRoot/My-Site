/**
 * Renders the assembled hero wire head to a static WebP poster.
 *
 *     node scripts/generate-hero-poster.mjs
 *
 * WHY THIS EXISTS
 * ---------------
 * The live hero is three.js + a 251 KB GLB. Even deferred, that is ~430 KB the
 * visitor cannot see anything without. The poster lets the bust paint at first
 * paint; the canvas then fades in over it once the page is idle and the hero is
 * actually in view (see HeroHeadCanvas.tsx).
 *
 * WHY IT IS NOT A HEADLESS BROWSER
 * --------------------------------
 * The render is 39,721 straight lines of one flat colour. Everything three.js
 * contributes here — GLB parsing, a wireframe edge list, a perspective
 * projection, alpha-blended 1px lines — is a few dozen lines of arithmetic, so
 * the script does it directly. No puppeteer, no WebGL, no GPU, and the output is
 * byte-identical on every machine.
 *
 * ⚠️ The projection constants below MUST mirror src/features/hero-3d/
 * headController.ts. tests/hero-poster-geometry.test.mjs asserts they do.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GLB_PATH = path.join(ROOT, 'public/models/hero-head-wire.glb');
const OUT_PATH = path.join(ROOT, 'public/models/hero-head-poster.webp');
const META_PATH = path.join(ROOT, 'src/features/hero-3d/posterMetrics.json');

/* --- Mirrored from headController.ts -------------------------------------
   Both the render and the CSS that positions the poster over the live canvas
   are derived from these. tests/hero-poster-metrics.test.mjs re-reads
   headController.ts and fails if any of them drifts. */
const FOV = 42;
const GROUP_ROTATION_X = -0.04;
const ACCENT = [0xff, 0x4a, 0x1c];
const LINE_OPACITY = 0.5;
const FILL_RATIO_HEIGHT = 0.45;
const CONTENT_MAX_WIDTH = 1440;
const BUST_WIDTH_OF_COLUMN = 0.34;
const BUST_WIDTH_MIN_PX = 260;
const BUST_WIDTH_MAX_PX = 520;
const BUST_Y_FRACTION = 0.11;

/* --- Render settings (poster only) ---------------------------------------
   The model is rendered MODEL_PX tall into a square canvas, with room around it
   for perspective spill (the near side of the bust magnifies ~1.17x) before the
   tight crop is measured.

   CANVAS_PX is MODEL_PX / FILL_RATIO_HEIGHT, not an arbitrary multiple, because
   that makes the camera distance below identical to the one updateFraming()
   picks whenever height is the binding axis — which is every desktop viewport.
   Perspective foreshortening then matches the live canvas exactly instead of
   being ~2% more exaggerated, so the cross-fade has nothing to give away. On
   very narrow viewports width binds and the live distance shifts; the residual
   is a couple of pixels at the shoulders, under a 500 ms fade. */
const MODEL_PX = 900;
const CANVAS_PX = Math.round(MODEL_PX / FILL_RATIO_HEIGHT);

/**
 * Delivered size, long edge. Rendering well above it and scaling down is what
 * anti-aliases the 1px lines.
 *
 * 400 is deliberately below the ~490 CSS px the poster occupies on a 1440
 * desktop. 39,721 anti-aliased lines are close to worst-case input for any
 * image codec, so resolution is the only real size lever, and this is a
 * placeholder that cross-fades into the live canvas within a few seconds —
 * slightly soft for that window is a far better trade than parking 100 KB in
 * front of Largest Contentful Paint. On mobile, where the poster is only ~273
 * CSS px, 400 is already oversampled.
 */
const OUTPUT_LONG_EDGE = Number(process.env.POSTER_PX || 400);

/**
 * WebP encodes RGB and alpha separately, and this poster's RGB is one flat
 * colour — so `quality` is almost inert here and `alphaQuality` is the entire
 * size/fidelity dial. Measured on the real asset: q80/aq40 = 51.8 KB,
 * q80/aq25 = 45.0 KB, q80/aq10 = 35.0 KB, all at identical resolution.
 */
const WEBP_QUALITY = Number(process.env.POSTER_Q || 80);
const WEBP_ALPHA_QUALITY = Number(process.env.POSTER_AQ || 10);

/* ========================================================================== *
 * GLB
 * ========================================================================== */

function parseGlb(buffer) {
  if (buffer.readUInt32LE(0) !== 0x46546c67) throw new Error('not a GLB');

  const chunks = {};
  for (let off = 12; off < buffer.length; ) {
    const len = buffer.readUInt32LE(off);
    const type = buffer.readUInt32LE(off + 4);
    chunks[type === 0x4e4f534a ? 'json' : 'bin'] = buffer.subarray(off + 8, off + 8 + len);
    off += 8 + len;
  }
  return { json: JSON.parse(chunks.json.toString('utf8')), bin: chunks.bin };
}

/** EXT_meshopt_compression — the same call three's GLTFMeshoptCompression makes. */
async function decodeBufferView(view, bin) {
  const ext = view.extensions?.EXT_meshopt_compression;
  if (!ext) return bin.subarray(view.byteOffset, view.byteOffset + view.byteLength);

  await MeshoptDecoder.ready;
  const source = bin.subarray(ext.byteOffset, ext.byteOffset + ext.byteLength);
  const target = new Uint8Array(ext.count * ext.byteStride);
  MeshoptDecoder.decodeGltfBuffer(
    target,
    ext.count,
    ext.byteStride,
    source,
    ext.mode,
    ext.filter,
  );
  return target;
}

async function loadMesh() {
  const { json, bin } = parseGlb(fs.readFileSync(GLB_PATH));

  const primitive = json.meshes[0].primitives[0];
  const posAccessor = json.accessors[primitive.attributes.POSITION];
  const idxAccessor = json.accessors[primitive.indices];

  const posBytes = await decodeBufferView(json.bufferViews[posAccessor.bufferView], bin);
  const idxBytes = await decodeBufferView(json.bufferViews[idxAccessor.bufferView], bin);

  const positions = new Float32Array(
    posBytes.buffer,
    posBytes.byteOffset,
    posAccessor.count * 3,
  ).slice();
  const indices = new Uint32Array(
    idxBytes.buffer,
    idxBytes.byteOffset,
    idxAccessor.count,
  ).slice();

  // Bake the node transform, exactly like headController's applyMatrix4(matrixWorld).
  // The optimiser writes normalisation onto the root node as uniform scale +
  // translation; there is no rotation, so a TRS matrix collapses to this.
  const node = json.nodes[0];
  const s = node.scale?.[0] ?? 1;
  const [tx, ty, tz] = node.translation ?? [0, 0, 0];
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] = positions[i] * s + tx;
    positions[i + 1] = positions[i + 1] * s + ty;
    positions[i + 2] = positions[i + 2] * s + tz;
  }

  return { positions, indices };
}

/**
 * Unique triangle edges — WireframeGeometry's output, minus the duplicates it
 * drops. Keyed on the sorted index pair, which is what three hashes on.
 */
function uniqueEdges(indices) {
  const seen = new Set();
  const edges = [];
  for (let i = 0; i < indices.length; i += 3) {
    const tri = [indices[i], indices[i + 1], indices[i + 2]];
    for (let e = 0; e < 3; e++) {
      const a = tri[e];
      const b = tri[(e + 1) % 3];
      const key = a < b ? `${a}_${b}` : `${b}_${a}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push(a, b);
    }
  }
  return new Uint32Array(edges);
}

/* ========================================================================== *
 * Raster
 * ========================================================================== */

/**
 * Xiaolin Wu anti-aliased line, composited source-over into a straight-alpha
 * RGBA buffer. three draws these as 1-device-pixel GL_LINES with
 * `transparent: true, opacity: 0.5, depthWrite: false`, so overlapping edges
 * accumulate rather than occlude — which is the whole look.
 */
/*
  Only alpha is accumulated. Every edge is the same flat accent, and
  source-over of a colour onto itself leaves the colour unchanged — so RGB is
  constant across the whole poster and the image is really an alpha mask.

  This is not just a compression trick, it is the correct result: compositing
  the accent onto a black canvas and calling that straight alpha would darken
  every faint line, and faint lines are most of the bust.
*/
function makeCanvas(size) {
  return { size, data: new Float32Array(size * size) };
}

function blend(buf, x, y, coverage) {
  if (x < 0 || y < 0 || x >= buf.size || y >= buf.size) return;
  const a = LINE_OPACITY * coverage;
  if (a <= 0) return;
  const i = y * buf.size + x;
  buf.data[i] += a * (1 - buf.data[i]);
}

function drawLine(buf, x0, y0, x1, y1) {
  let steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
  if (steep) {
    [x0, y0] = [y0, x0];
    [x1, y1] = [y1, x1];
  }
  if (x0 > x1) {
    [x0, x1] = [x1, x0];
    [y0, y1] = [y1, y0];
  }

  const dx = x1 - x0;
  const gradient = dx === 0 ? 1 : (y1 - y0) / dx;

  let intery = y0 + gradient * (Math.round(x0) - x0);
  const xStart = Math.round(x0);
  const xEnd = Math.round(x1);

  for (let x = xStart; x <= xEnd; x++) {
    const y = Math.floor(intery);
    const f = intery - y;
    if (steep) {
      blend(buf, y, x, 1 - f);
      blend(buf, y + 1, x, f);
    } else {
      blend(buf, x, y, 1 - f);
      blend(buf, x, y + 1, f);
    }
    intery += gradient;
  }
}

/* ========================================================================== *
 * Main
 * ========================================================================== */

async function main() {
  const { positions, indices } = await loadMesh();

  // geometry.center() — translate so the bounding box centre is the origin.
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    if (positions[i] < minX) minX = positions[i];
    if (positions[i] > maxX) maxX = positions[i];
    if (positions[i + 1] < minY) minY = positions[i + 1];
    if (positions[i + 1] > maxY) maxY = positions[i + 1];
    if (positions[i + 2] < minZ) minZ = positions[i + 2];
    if (positions[i + 2] > maxZ) maxZ = positions[i + 2];
  }
  const modelWidth = maxX - minX;
  const modelHeight = maxY - minY;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const cz = (minZ + maxZ) / 2;

  // group.rotation.x — the only rotation with yaw at its default 0.
  const cos = Math.cos(GROUP_ROTATION_X);
  const sin = Math.sin(GROUP_ROTATION_X);

  const halfFov = (FOV * Math.PI) / 360;
  const tan = Math.tan(halfFov);
  // updateFraming()'s distanceForHeight, verbatim. Because CANVAS_PX is derived
  // from FILL_RATIO_HEIGHT, this also puts the model at exactly MODEL_PX tall.
  const distance = modelHeight / FILL_RATIO_HEIGHT / 2 / tan;

  const edges = uniqueEdges(indices);
  const buf = makeCanvas(CANVAS_PX);
  const half = CANVAS_PX / 2;
  const scale = half / tan;

  const project = (vi) => {
    const x = positions[vi * 3] - cx;
    const yc = positions[vi * 3 + 1] - cy;
    const zc = positions[vi * 3 + 2] - cz;
    const y = yc * cos - zc * sin;
    const z = yc * sin + zc * cos;
    const depth = distance - z; // -zView; positive in front of the camera
    return { sx: half + (x / depth) * scale, sy: half - (y / depth) * scale };
  };

  for (let i = 0; i < edges.length; i += 2) {
    const a = project(edges[i]);
    const b = project(edges[i + 1]);
    drawLine(buf, a.sx, a.sy, b.sx, b.sy);
  }

  // Tight crop, forced symmetric about the model centre so the CSS that places
  // the poster is a plain centred box (see HeroHeadCanvas.tsx).
  let top = CANVAS_PX, bottom = -1, left = CANVAS_PX, right = -1;
  for (let y = 0; y < CANVAS_PX; y++) {
    for (let x = 0; x < CANVAS_PX; x++) {
      if (buf.data[y * CANVAS_PX + x] < 0.004) continue;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
      if (x < left) left = x;
      if (x > right) right = x;
    }
  }
  const halfW = Math.ceil(Math.max(half - left, right - half)) + 1;
  const halfH = Math.ceil(Math.max(half - top, bottom - half)) + 1;
  const cropW = halfW * 2;
  const cropH = halfH * 2;

  const rgba = Buffer.alloc(cropW * cropH * 4);
  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const src = (y + half - halfH) * CANVAS_PX + (x + half - halfW);
      const dst = (y * cropW + x) * 4;
      rgba[dst] = ACCENT[0];
      rgba[dst + 1] = ACCENT[1];
      rgba[dst + 2] = ACCENT[2];
      rgba[dst + 3] = Math.round(buf.data[src] * 255);
    }
  }

  const shrink = OUTPUT_LONG_EDGE / Math.max(cropW, cropH);
  const outW = Math.round(cropW * shrink);
  const outH = Math.round(cropH * shrink);

  await sharp(rgba, { raw: { width: cropW, height: cropH, channels: 4 } })
    .resize(outW, outH, { fit: 'fill', kernel: 'lanczos3' })
    .webp({ quality: WEBP_QUALITY, alphaQuality: WEBP_ALPHA_QUALITY, effort: 6 })
    .toFile(OUT_PATH);

  const bytes = fs.statSync(OUT_PATH).size;

  /*
    CSS that lands the poster exactly where updateFraming() puts the bust.

    updateFraming() picks the LARGER of two camera distances, i.e. the SMALLER
    of two apparent sizes, so the bust's rendered height is

        min(FILL_RATIO_HEIGHT x canvasHeight,
            targetWidthPx x modelHeight/modelWidth)

    with targetWidthPx = clamp(MIN, min(canvasWidth, 1440) x 0.34, MAX). Both
    terms are expressible in CSS against the stage box, and everything the
    poster draws scales with that one height — so folding the poster's own
    overshoot (perspective spill past the model's bounding box) into each term
    gives a single `height`, and `width` follows from the intrinsic ratio.

    The stage is `absolute inset-0` over the hero <section>, and the live canvas
    measures itself with clientWidth/clientHeight on that same box, so a
    percentage here resolves against exactly what the camera sees.

    100vw counts the scrollbar and canvasWidth does not — a ~1% overestimate on
    desktop. It cannot show: the width term only binds on narrow viewports,
    which have no persistent scrollbar.
  */
  const overshoot = cropH / MODEL_PX;
  const metrics = {
    generatedBy: 'scripts/generate-hero-poster.mjs — do not edit by hand',
    file: 'hero-head-poster.webp',
    pixels: { width: outW, height: outH },
    bytes,
    modelAspect: Number((modelWidth / modelHeight).toFixed(6)),
    /** Poster box as a multiple of the bust's rendered height. */
    heightOverModelHeight: Number(overshoot.toFixed(6)),
    edges: edges.length / 2,
    style: {
      left: '50%',
      top: `${((0.5 - BUST_Y_FRACTION) * 100).toFixed(4)}%`,
      height:
        `min(${(FILL_RATIO_HEIGHT * overshoot * 100).toFixed(4)}%, ` +
        `calc(clamp(${BUST_WIDTH_MIN_PX}px, ` +
        `min(100vw, ${CONTENT_MAX_WIDTH}px) * ${BUST_WIDTH_OF_COLUMN}, ` +
        `${BUST_WIDTH_MAX_PX}px) * ` +
        `${((modelHeight / modelWidth) * overshoot).toFixed(6)}))`,
      aspectRatio: `${outW} / ${outH}`,
      // Height drives the box; width has to be released or the `width`
      // attribute (needed so the slot is reserved before the file arrives)
      // wins and squashes the bust horizontally.
      width: 'auto',
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
    },
  };
  fs.writeFileSync(META_PATH, `${JSON.stringify(metrics, null, 2)}\n`);

  console.log(`✅ ${path.relative(ROOT, OUT_PATH)}`);
  console.log(`   ${outW}x${outH}  ${(bytes / 1024).toFixed(1)} KB  ` +
    `${((bytes * 8) / (outW * outH)).toFixed(2)} bpp`);
  console.log(`   ${metrics.edges.toLocaleString()} unique edges  ` +
    `model ${modelWidth.toFixed(4)} x ${modelHeight.toFixed(4)}  ` +
    `aspect ${metrics.modelAspect}`);
  console.log(`   poster height = ${metrics.heightOverModelHeight} x bust height`);
}

main().catch((error) => {
  console.error('hero poster failed:', error);
  process.exitCode = 1;
});
