#!/usr/bin/env node
/**
 * Hero head — 3D asset optimisation pipeline.
 *
 * Turns the raw photogrammetry scan (~80 MB GLB, 1.8M triangles) into a
 * web-deliverable wireframe asset for the hero canvas.
 *
 *   base_basic_shaded.glb   79,121,620 B   1,800,000 tris
 *        └─> public/models/hero-head-wire.glb     target < 2 MB
 *
 * Why the output is geometry-only:
 *   The hero renders the head as EdgesGeometry line segments over a flat
 *   backing mesh. Nothing samples a texture, nothing samples a normal — so
 *   TEXCOORD_0, TANGENT, NORMAL and every image are dropped outright. That is
 *   where the bulk of the size reduction comes from, before compression.
 *
 * Why meshopt and not Draco:
 *   Draco's decoder is a separate .wasm normally fetched from a CDN, which the
 *   site's `default-src 'self'` CSP blocks; self-hosting it costs ~200 KB. The
 *   meshopt decoder is a ~25 KB ES module that ships inside `three` and bundles
 *   directly — no CSP change, no third-party request.
 *
 * Source files are READ-ONLY and never copied into the repo. base.obj
 * (177 MB) is not touched at all.
 *
 * Usage:
 *   node --max-old-space-size=8192 scripts/optimize-hero-model.mjs
 *   node --max-old-space-size=8192 scripts/optimize-hero-model.mjs --tris 40000
 */

import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import {
  dedup,
  flatten,
  join,
  weld,
  simplify,
  prune,
  center,
} from '@gltf-transform/functions';
import { MeshoptSimplifier, MeshoptEncoder } from 'meshoptimizer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

const SOURCE_DIR =
  process.env.HERO_MODEL_SRC ||
  '/Users/dr.sam/Downloads/cc3e9372-0cf9-45ae-b068-333130363682 (1)';

const SOURCE_GLB = path.join(SOURCE_DIR, 'base_basic_shaded.glb');
const OUT_DIR = path.join(REPO_ROOT, 'public', 'models');
const OUT_WIRE = path.join(OUT_DIR, 'hero-head-wire.glb');

/** Triangle budget for the shipped wire mesh. */
const argIdx = process.argv.indexOf('--tris');
const TARGET_TRIS = argIdx > -1 ? Number(process.argv[argIdx + 1]) : 28000;

/** Normalise the model so it fits a unit-ish box — keeps the camera math stable. */
const TARGET_HEIGHT = 2.0;

const fmt = (b) => `${(b / 1048576).toFixed(2)} MB`;
const num = (n) => n.toLocaleString('en-US');

/**
 * Snap POSITION values onto a uniform grid.
 *
 * gltf-transform v4's weld() merges only *bitwise identical* vertices. A
 * photogrammetry scan carries thousands of seam vertices that are co-located to
 * within float rounding but not bitwise equal, so they survive welding, keep the
 * mesh topologically fragmented, and stall the simplifier well above target.
 * Quantising to a grid far below visible resolution makes those duplicates
 * identical so weld() can collapse them.
 */
/**
 * Topology-ignoring decimation via MeshoptSimplifier.simplifySloppy().
 *
 * gltf-transform's simplify() wraps meshoptimizer's *topology-preserving*
 * simplifier, which refuses to collapse edges that would produce non-manifold
 * geometry. On this scan that imposes a hard floor around 100k triangles
 * (~3.5× over target) no matter how the ratio or error budget is set — repeated
 * passes converge instead of reducing.
 *
 * simplifySloppy() drops the topology guarantee. For a wireframe silhouette
 * that constraint buys nothing, so this reaches the actual triangle budget.
 * It leaves orphaned vertices behind, so the mesh is compacted afterwards.
 */
function simplifySloppyPrimitive(doc, prim, targetTris) {
  const posAttr = prim.getAttribute('POSITION');
  const idxAccessor = prim.getIndices();
  if (!posAttr || !idxAccessor) return null;

  const positions = new Float32Array(posAttr.getArray());
  const indices = new Uint32Array(idxAccessor.getArray());
  const vertexCount = posAttr.getCount();

  const targetIndexCount = Math.max(3, Math.floor(targetTris * 3));
  if (indices.length <= targetIndexCount) return null;

  // Signature: (indices, positions, stride, vertex_lock, target_index_count,
  // target_error). Vertex count is derived from positions.length / stride.
  const [simplified] = MeshoptSimplifier.simplifySloppy(
    indices,
    positions,
    3, // stride, in floats
    null, // no locked vertices
    targetIndexCount,
    1.0, // permissive error — the target count governs
  );

  // Compact: keep only referenced vertices, rewrite indices densely.
  const remap = new Int32Array(vertexCount).fill(-1);
  let next = 0;
  for (let i = 0; i < simplified.length; i++) {
    if (remap[simplified[i]] === -1) remap[simplified[i]] = next++;
  }
  const newPositions = new Float32Array(next * 3);
  for (let v = 0; v < vertexCount; v++) {
    const dst = remap[v];
    if (dst === -1) continue;
    newPositions[dst * 3] = positions[v * 3];
    newPositions[dst * 3 + 1] = positions[v * 3 + 1];
    newPositions[dst * 3 + 2] = positions[v * 3 + 2];
  }
  const newIndices = new Uint32Array(simplified.length);
  for (let i = 0; i < simplified.length; i++) newIndices[i] = remap[simplified[i]];

  posAttr.setArray(newPositions);
  idxAccessor.setArray(newIndices);

  return { tris: newIndices.length / 3, verts: next };
}

/** Axis-aligned bounds over every POSITION accessor in the document. */
function measureBounds(doc) {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const pos = prim.getAttribute('POSITION');
      if (!pos) continue;
      const el = [0, 0, 0];
      for (let i = 0; i < pos.getCount(); i++) {
        pos.getElement(i, el);
        if (el[0] < minX) minX = el[0];
        if (el[0] > maxX) maxX = el[0];
        if (el[1] < minY) minY = el[1];
        if (el[1] > maxY) maxY = el[1];
        if (el[2] < minZ) minZ = el[2];
        if (el[2] > maxZ) maxZ = el[2];
      }
    }
  }
  const width = maxX - minX;
  const height = maxY - minY;
  const depth = maxZ - minZ;
  return { width, height, depth, maxExtent: Math.max(width, height, depth) };
}

function snapPositions(doc, grid) {
  let moved = 0;
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const pos = prim.getAttribute('POSITION');
      if (!pos) continue;
      const el = [0, 0, 0];
      for (let i = 0; i < pos.getCount(); i++) {
        pos.getElement(i, el);
        const x = Math.round(el[0] / grid) * grid;
        const y = Math.round(el[1] / grid) * grid;
        const z = Math.round(el[2] / grid) * grid;
        if (x !== el[0] || y !== el[1] || z !== el[2]) moved++;
        pos.setElement(i, [x, y, z]);
      }
    }
  }
  return moved;
}

function countTris(doc) {
  let tris = 0;
  let verts = 0;
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const idx = prim.getIndices();
      const pos = prim.getAttribute('POSITION');
      if (idx) tris += idx.getCount() / 3;
      else if (pos) tris += pos.getCount() / 3;
      if (pos) verts += pos.getCount();
    }
  }
  return { tris: Math.round(tris), verts };
}

async function main() {
  if (!fs.existsSync(SOURCE_GLB)) {
    console.error(`✖ Source GLB not found:\n  ${SOURCE_GLB}`);
    console.error('  Set HERO_MODEL_SRC to the folder containing base_basic_shaded.glb.');
    process.exit(1);
  }

  await MeshoptSimplifier.ready;
  await MeshoptEncoder.ready;

  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.encoder': MeshoptEncoder });

  const srcBytes = fs.statSync(SOURCE_GLB).size;
  console.log('━'.repeat(64));
  console.log('HERO HEAD — 3D OPTIMISATION');
  console.log('━'.repeat(64));
  console.log(`source      ${path.basename(SOURCE_GLB)}  ${fmt(srcBytes)}`);

  console.log('\n▸ reading (this takes a moment at 80 MB)…');
  const doc = await io.read(SOURCE_GLB);

  const before = countTris(doc);
  console.log(
    `  in:  ${num(before.tris)} tris · ${num(before.verts)} verts · ` +
      `${doc.getRoot().listTextures().length} textures · ` +
      `${doc.getRoot().listMaterials().length} materials`,
  );

  // ---------------------------------------------------------------- geometry
  const ratio = Math.min(1, TARGET_TRIS / before.tris);
  console.log(`\n▸ simplifying to ~${num(TARGET_TRIS)} tris (ratio ${ratio.toFixed(5)})…`);

  // NOTE on `error`: simplify() aims for `ratio` but bails early if the error
  // budget is exceeded. gltf-transform v4's weld() merges only bitwise-identical
  // vertices — it has no distance tolerance — so this photogrammetry scan keeps
  // its split seam vertices and the simplifier stalls under a tight budget
  // (error 0.02 bottomed out at 130k tris, ~4.6× over target). A wireframe only
  // needs the silhouette and major features, so the error cap is opened up and
  // `ratio` is left to govern the result.
  await doc.transform(dedup(), flatten(), join());

  // Grid = 0.01% of the model's largest extent — orders of magnitude below
  // anything visible, but enough to make seam duplicates bitwise equal.
  const bbox0 = measureBounds(doc);
  const grid = Math.max(bbox0.maxExtent * 1e-4, Number.EPSILON);
  const snapped = snapPositions(doc, grid);
  console.log(`  snapped ${num(snapped)} positions to a ${grid.toExponential(2)} grid`);

  await doc.transform(weld());
  const welded = countTris(doc);
  console.log(`  after weld: ${num(welded.tris)} tris · ${num(welded.verts)} verts`);

  await doc.transform(
    simplify({ simplifier: MeshoptSimplifier, ratio, error: 1.0, lockBorder: false }),
  );

  const afterSimplify = countTris(doc);
  console.log(
    `  quality pass: ${num(afterSimplify.tris)} tris · ${num(afterSimplify.verts)} verts`,
  );

  // ------------------------------------------------------------ strip to bone
  // MUST happen before the sloppy pass: simplifySloppy rewrites POSITION and
  // indices only, so any surviving NORMAL / TEXCOORD_0 / TANGENT accessor would
  // be left indexed against the old vertex order.
  console.log('\n▸ stripping textures / materials / unused attributes…');
  const root = doc.getRoot();

  for (const mesh of root.listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      for (const semantic of prim.listSemantics()) {
        if (semantic !== 'POSITION') prim.setAttribute(semantic, null);
      }
      prim.setMaterial(null);
    }
  }
  for (const texture of root.listTextures()) texture.dispose();
  for (const material of root.listMaterials()) material.dispose();

  await doc.transform(prune());

  // ------------------------------------------------------- sloppy decimation
  if (afterSimplify.tris > TARGET_TRIS * 1.15) {
    console.log(`\n▸ sloppy decimation → ${num(TARGET_TRIS)} tris…`);
    for (const mesh of root.listMeshes()) {
      for (const prim of mesh.listPrimitives()) {
        const res = simplifySloppyPrimitive(doc, prim, TARGET_TRIS);
        if (res) console.log(`  ${num(res.tris)} tris · ${num(res.verts)} verts`);
      }
    }
  }

  // ------------------------------------------------------------- orient/scale
  console.log('▸ centering + normalising scale…');
  await doc.transform(center());

  // Rescale so the head is TARGET_HEIGHT tall regardless of the scan's units.
  const bounds = measureBounds(doc);
  const scale = bounds.height > 0 ? TARGET_HEIGHT / bounds.height : 1;
  console.log(
    `  bbox h ${bounds.height.toFixed(4)} · w ${bounds.width.toFixed(4)} · ` +
      `d ${bounds.depth.toFixed(4)} → scale ×${scale.toFixed(4)}`,
  );

  for (const node of root.listNodes()) {
    if (!node.getParentNode()) {
      const s = node.getScale();
      node.setScale([s[0] * scale, s[1] * scale, s[2] * scale]);
    }
  }

  // ------------------------------------------------------------- compression
  console.log('\n▸ encoding EXT_meshopt_compression…');
  doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({
    method: EXTMeshoptCompression.EncoderMethod.QUANTIZE,
  });

  fs.mkdirSync(OUT_DIR, { recursive: true });
  await io.write(OUT_WIRE, doc);

  const outBytes = fs.statSync(OUT_WIRE).size;
  const final = countTris(doc);

  console.log('\n' + '━'.repeat(64));
  console.log('RESULT');
  console.log('━'.repeat(64));
  console.log(`  source      ${fmt(srcBytes)}   ${num(before.tris)} tris`);
  console.log(`  output      ${fmt(outBytes)}   ${num(final.tris)} tris`);
  console.log(
    `  reduction   ${(srcBytes / outBytes).toFixed(1)}× smaller · ` +
      `${(100 - (outBytes / srcBytes) * 100).toFixed(2)}% saved`,
  );
  console.log(`  written     ${path.relative(REPO_ROOT, OUT_WIRE)}`);

  const HARD_CAP = 5 * 1024 * 1024;
  const IDEAL = 2 * 1024 * 1024;
  if (outBytes > HARD_CAP) {
    console.error(`\n✖ FAIL: ${fmt(outBytes)} exceeds the 5 MB hard cap.`);
    process.exit(1);
  }
  console.log(
    outBytes > IDEAL
      ? `\n⚠ over the 2 MB ideal but within the 5 MB cap.`
      : `\n✓ within the 2 MB ideal budget.`,
  );
}

main().catch((err) => {
  console.error('\n✖ optimisation failed:', err);
  process.exit(1);
});
