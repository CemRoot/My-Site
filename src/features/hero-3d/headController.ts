/**
 * Hero wire head — imperative Three.js controller.
 *
 * 1) Idle-load the optimised wire GLB (251 KB, 27.8k tris / 39.7k edges)
 * 2) One-shot intro: bars start spread across the whole hero, then converge
 *    into the assembled bust
 * 3) Afterwards the cursor drags bars along its direction of travel, leaving a
 *    wake; they spring back once it moves on
 *
 *     const dispose = await mountHead(canvas, { pointerTarget })
 *
 * Design notes that are easy to break:
 *  - There is NO fill mesh. It used to render an opaque silhouette that
 *    depth-culled any displaced bar, which is what made the hover read as a
 *    solid black blob. Pure wireframe, `depthWrite: false`, so every edge is
 *    always visible and nothing can occlude the wake.
 *  - Scale is governed in EXACTLY ONE place: the camera distance. A previous
 *    `group.scale` multiplier fought `frameCamera()` and left the bust cropped.
 *    Do not reintroduce a group scale — change FILL_RATIO_HEIGHT /
 *    BUST_WIDTH_OF_COLUMN instead.
 *  - Scatter distances are derived from the camera frustum, never hardcoded, so
 *    the intro cloud is guaranteed to be on-screen at whatever aspect ratio the
 *    hero happens to be.
 */

import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  LineBasicMaterial,
  LineSegments,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
  WireframeGeometry,
  type Mesh,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { probeSpan, probeSpanAsync } from '../../lib/perfProbe';

export interface HeadOptions {
  accent?: string;
  yaw?: number;
  url?: string;
  reducedMotion?: boolean;
  /** Element that drives the pointer wake (hero stage). Defaults to canvas. */
  pointerTarget?: HTMLElement | null;
}

const DEFAULTS = {
  accent: '#ff4a1c',
  yaw: 0,
  url: '/models/hero-head-wire.glb',
  reducedMotion: false,
  pointerTarget: null,
} satisfies Required<HeadOptions>;

/**
 * Edge budget. The model has 39,721 unique edges; desktop draws all of them —
 * capping at 7,200 was what made the mesh look patchy and unfinished, because
 * the stride pick sampled an index order that is spatially incoherent after
 * simplifySloppy. Coarse-pointer devices stay capped for fill-rate reasons.
 */
const MAX_SEGMENTS_DESKTOP = 40000;
const MAX_SEGMENTS_MOBILE = 12000;

/**
 * Vertical cap: the most of the frame's height the bust may take. Deliberately
 * low — the canvas is a full-bleed layer over the whole hero, so this keeps the
 * bust near the size it had in the old 446 px box and leaves the rest of the
 * section free for debris to travel through.
 *
 * Only a cap. Horizontal sizing (below) usually decides the actual scale.
 */
const FILL_RATIO_HEIGHT = 0.45;

/**
 * Horizontal sizing is pinned to the hero's TEXT COLUMN, not the viewport.
 *
 * The canvas is full-bleed but the copy is capped at max-w-[1440px], so on a
 * 27" display the section is ~2560 px wide while the text stops at 1440. Sizing
 * the bust off the canvas made it shrink relative to the copy as the screen
 * grew — the same page read correctly on a 16" laptop and looked off on the
 * external monitor. Measuring against the column instead keeps the
 * bust-to-headline relationship identical at every width.
 *
 * Mirrors `max-w-[1440px]` in HeroSection.tsx — keep the two in sync.
 */
const CONTENT_MAX_WIDTH = 1440;
const BUST_WIDTH_OF_COLUMN = 0.34;
/** Absolute guard rails, in CSS px, so phones don't get a postage stamp. */
const BUST_WIDTH_MIN_PX = 260;
const BUST_WIDTH_MAX_PX = 520;

/**
 * Lifts the bust above the frame's vertical centre, as a fraction of visible
 * height, so it sits in the upper hero and the headline reads beneath it
 * instead of straight through its middle.
 */
const BUST_Y_FRACTION = 0.11;

const SCATTER_HOLD_MS = 300;
const ASSEMBLE_MS = 2200;
const STAGGER = 0.78;

/**
 * Pointer wake radius, as a fraction of the bust's height — NOT an absolute
 * world value.
 *
 * It was 1.3 world units against a 1.82-unit-tall bust, i.e. a reach *larger
 * than the model itself*: at 1728px that put a 326px radius around a 473×456px
 * bust, so the effective trigger area was ~1125×1108px and the head reacted to
 * the cursor sitting over the headline. Deriving it from the model keeps the
 * disturbance local and stops it drifting out of proportion if the mesh or
 * framing ever changes.
 */
const WAKE_RADIUS_OF_BUST = 0.33;
/**
 * Fewer bars are now in reach, so each one is thrown harder — the effect stays
 * dramatic while the cursor's aim stays honest.
 */
const WAKE_STRENGTH = 2.5;
/**
 * Mix of the three scatter components. JITTER dominates on purpose — it is what
 * separates "the mesh came apart" from "the mesh got dragged sideways".
 */
const W_RADIAL = 0.5;
const W_TRAVEL = 0.4;
const W_JITTER = 0.85;
/**
 * Pointer speed (world units/event) that counts as a "normal" sweep — one
 * WAKE_SPEED_REF of travel produces exactly WAKE_STRENGTH of throw.
 */
const WAKE_SPEED_REF = 0.05;
/**
 * How far past that reference a fast flick can push. This used to be hard
 * clamped at 1.0, so everything above a gentle sweep produced an identical
 * result and the effect felt scripted rather than physical. Letting it run to
 * 2.4× means a slow drift barely disturbs the surface while a fast swipe tears
 * a wide channel through it.
 */
const WAKE_SPEED_MAX = 2.4;
/** Fast movement also widens the disturbed channel, not just the throw distance. */
const WAKE_RADIUS_SPEED_GAIN = 0.3;
const WAKE_RADIUS_SPEED_MAX = 1.35;

/**
 * The influence field is a CONE aligned to travel, not a circle.
 *
 * `clientX/clientY` is the cursor hotspot — the arrow's tip — so the anchor was
 * always exact. The circle was the problem: it reached equally in every
 * direction, so bars well off to the *side* of the swipe were disturbed as
 * readily as the ones being cut through. Stretching it behind the tip and
 * pinching it laterally makes the cursor carve a channel and leave a trail,
 * which is both what a pointer physically ought to do and far easier to aim.
 *
 * Multipliers on the base radius: ahead of the tip, behind it, and sideways.
 */
const WAKE_AHEAD = 0.7;
const WAKE_BEHIND = 1.7;
const WAKE_LATERAL = 0.5;
/** Cheap bounding-circle reject before the cone maths. */
const WAKE_BOUND = Math.max(WAKE_AHEAD, WAKE_BEHIND, WAKE_LATERAL);
/** Exponential smoothing on the pointer velocity estimate. */
const VEL_SMOOTH = 0.3;
/**
 * Per-frame velocity decay. Governs how long the trail lingers once the cursor
 * stops moving — lower values snap back immediately and read as barely-there.
 */
const VEL_DECAY = 0.95;
/**
 * Asymmetric spring. A single rate for both directions made the debris snap
 * home almost as fast as it left (~0.37 s), so the scatter never got to be
 * seen. Bars now fly apart immediately and drift back slowly.
 */
const SPRING_SCATTER = 0.3;
const SPRING_RETURN = 0.022;
const SETTLE_EPS = 0.0015;
const SPEED_EPS = 0.0015;

export class HeadController {
  private readonly canvas: HTMLCanvasElement;
  private readonly opts: Required<HeadOptions>;

  private renderer!: WebGLRenderer;
  private scene!: Scene;
  private camera!: PerspectiveCamera;
  private group!: Group;

  private geometries: BufferGeometry[] = [];
  private materials: LineBasicMaterial[] = [];

  private disposed = false;
  private resizeObserver?: ResizeObserver;
  private raf = 0;

  private lineMaterial: LineBasicMaterial | null = null;

  /** Settled bar positions (assembled). */
  private finalPos: Float32Array | null = null;
  private livePos: Float32Array | null = null;
  private posAttr: BufferAttribute | null = null;
  private segCount = 0;
  /** Per-segment current displacement from the settled position. */
  private offsetX: Float32Array | null = null;
  private offsetY: Float32Array | null = null;
  private offsetZ: Float32Array | null = null;
  /**
   * Per-segment scatter direction + magnitude, generated once and reused.
   * Without this every disturbed bar moved along the same vector, which reads
   * as the whole surface being dragged rather than coming apart.
   */
  private jitterX: Float32Array | null = null;
  private jitterY: Float32Array | null = null;
  private jitterZ: Float32Array | null = null;
  private magScale: Float32Array | null = null;
  /** Per-segment return-rate multiplier — keeps the reassembly from happening in lockstep. */
  private returnRate: Float32Array | null = null;

  private cameraDistance = 3;
  private modelWidth = 2;
  private modelHeight = 2;
  /** WAKE_RADIUS_OF_BUST × modelHeight, resolved once the mesh is measured. */
  private wakeRadius = 0.6;
  private assembled = false;

  private pointerActive = false;
  private pointerX = 0;
  private pointerY = 0;
  private hasPointerSample = false;
  private velX = 0;
  private velY = 0;

  private readonly tmp = new Vector3();
  private readonly planePoint = new Vector3();

  private onPointerMove?: (e: PointerEvent) => void;
  private onPointerLeave?: () => void;

  constructor(canvas: HTMLCanvasElement, options: HeadOptions = {}) {
    this.canvas = canvas;
    this.opts = { ...DEFAULTS, ...stripUndefined(options) };
  }

  async mount(): Promise<void> {
    const { canvas, opts } = this;

    if (!canvas.isConnected) {
      throw new Error('Canvas is not in the document');
    }

    try {
      this.renderer = probeSpan('head.WebGLRenderer', () => new WebGLRenderer({
        canvas,
        alpha: true,
        antialias: !isCoarsePointer(),
        powerPreference: 'low-power',
        failIfMajorPerformanceCaveat: false,
      }));
    } catch (error) {
      throw new Error(
        `WebGLRenderer failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    this.renderer.setClearAlpha(0);
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, isCoarsePointer() ? 1.25 : 1.75),
    );

    this.scene = new Scene();
    this.camera = new PerspectiveCamera(42, 1, 0.1, 100);

    this.group = new Group();
    this.group.rotation.y = opts.yaw;
    this.group.rotation.x = -0.04;
    this.scene.add(this.group);

    const geometry = await probeSpanAsync('head.loadGeometry', () =>
      this.loadGeometry(opts.url),
    );
    if (this.disposed) {
      geometry.dispose();
      return;
    }

    const box = geometry.boundingBox;
    this.modelWidth = box ? box.max.x - box.min.x : 2;
    this.modelHeight = box ? box.max.y - box.min.y : 2;
    this.wakeRadius = this.modelHeight * WAKE_RADIUS_OF_BUST;

    probeSpan('head.buildWireHead', () => this.buildWireHead(geometry));
    // Split the mount across frames — see yieldToMain() below.
    // resize() sets the aspect and then reframes, so the scatter cloud below is
    // sized against a frustum that is already correct for this canvas.
    probeSpan('head.resize', () => this.resize());

    // Attach the wake listener up front rather than as a completion callback of
    // the intro. Tying it to the animation meant that if rAF was ever paused
    // mid-intro (background tab, throttled device) the listener was never
    // attached at all and the head stayed inert for the rest of the session.
    // The handler no-ops until `assembled` flips.
    this.enablePointer();

    if (opts.reducedMotion) {
      probeSpan('head.showAssembled', () => this.showAssembled());
      this.renderer.render(this.scene, this.camera);
    } else {
      probeSpan('head.startAssemble', () => this.startAssemble());
    }

    this.resizeObserver = new ResizeObserver(() => {
      this.resize();
      if (!this.disposed && !this.raf) this.renderer.render(this.scene, this.camera);
    });
    this.resizeObserver.observe(canvas);
  }

  private async loadGeometry(url: string): Promise<BufferGeometry> {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);

    const gltf = await loader.loadAsync(url);

    let found: BufferGeometry | null = null;
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((child) => {
      if (found) return;
      const mesh = child as Mesh;
      if (mesh.isMesh && mesh.geometry) {
        const clone = mesh.geometry.clone();
        // Bake the node transform — the optimiser writes normalisation scale
        // onto the root node, so framing math can then ignore the hierarchy.
        clone.applyMatrix4(mesh.matrixWorld);
        found = clone;
      }
    });

    gltf.scene.traverse((child) => {
      const mesh = child as Mesh;
      if (mesh.isMesh) mesh.geometry?.dispose();
    });

    if (!found) throw new Error(`No mesh found in ${url}`);

    // The full bust ships as-is. An earlier `cropBelow()` sheared the bottom 6%
    // and was a direct cause of the "mesh looks incomplete" report.
    const geometry = found as BufferGeometry;
    geometry.center();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return geometry;
  }

  private buildWireHead(geometry: BufferGeometry): void {
    const maxSegs = isCoarsePointer() ? MAX_SEGMENTS_MOBILE : MAX_SEGMENTS_DESKTOP;
    const edges = probeSpan('head.buildWireBars', () => buildWireBars(geometry, maxSegs));

    this.lineMaterial = new LineBasicMaterial({
      color: new Color(this.opts.accent),
      transparent: true,
      // Every edge draws, front and back, so per-line alpha is low and depth
      // accumulates from overlap instead of one flat mass of colour.
      opacity: 0.5,
      // No depth writes: nothing occludes anything, so a bar thrown out by the
      // wake stays visible wherever it lands.
      depthWrite: false,
    });
    this.group.add(new LineSegments(edges, this.lineMaterial));

    // The source geometry is only needed for framing; the bars own the render.
    this.geometries.push(edges);
    this.materials.push(this.lineMaterial);

    this.posAttr = edges.getAttribute('position') as BufferAttribute;
    this.livePos = this.posAttr.array as Float32Array;
    this.finalPos = new Float32Array(this.livePos);
    this.segCount = (this.livePos.length / 6) | 0;
    this.offsetX = new Float32Array(this.segCount);
    this.offsetY = new Float32Array(this.segCount);
    this.offsetZ = new Float32Array(this.segCount);

    // Give every bar its own escape vector and throw distance up front, so the
    // wake disperses the surface instead of translating it as one piece.
    this.jitterX = new Float32Array(this.segCount);
    this.jitterY = new Float32Array(this.segCount);
    this.jitterZ = new Float32Array(this.segCount);
    this.magScale = new Float32Array(this.segCount);
    this.returnRate = new Float32Array(this.segCount);
    // Locals, not `this.*`, inside the closure: the fields are nullable and
    // TypeScript drops the narrowing across a callback boundary.
    const jitterX = this.jitterX;
    const jitterY = this.jitterY;
    const jitterZ = this.jitterZ;
    const magScale = this.magScale;
    const returnRate = this.returnRate;
    const segCount = this.segCount;
    probeSpan('head.perSegmentRandom', () => {
      for (let s = 0; s < segCount; s++) {
        const rnd = mulberry32((s * 40503 + 12345) >>> 0);
        // Uniform-ish direction on the sphere.
        const theta = rnd() * Math.PI * 2;
        const z = rnd() * 2 - 1;
        const r = Math.sqrt(Math.max(0, 1 - z * z));
        jitterX[s] = Math.cos(theta) * r;
        jitterY[s] = Math.sin(theta) * r;
        jitterZ[s] = z;
        magScale[s] = 0.45 + rnd() * 1.35;
        // Spread the return over a range so the bust re-forms progressively
        // rather than every bar arriving home on the same frame.
        returnRate[s] = 0.55 + rnd() * 1.1;
      }
    });
  }

  /**
   * Fit the bust: capped by FILL_RATIO_HEIGHT vertically, and horizontally
   * by a target width derived from the text column (see CONTENT_MAX_WIDTH).
   *
   * Fits the bounding BOX rather than the bounding sphere: a sphere
   * circumscribes the bust's diagonal and over-estimates its on-screen size,
   * which made margins unpredictable.
   *
   * Both axes matter. Fitting height alone is correct on the wide desktop hero
   * but overflows badly on a narrow portrait canvas — at 375×503 the visible
   * width is only 1.655 units against a 1.887-unit-wide bust, so the head burst
   * out of frame on mobile. Taking the larger of the two distances fits
   * whichever axis is actually binding.
   */
  private updateFraming(): void {
    const halfFov = (this.camera.fov * Math.PI) / 360;
    const aspect = this.camera.aspect || 1;

    // Target on-screen bust width, derived from the text column so it stays
    // visually constant across a 16" laptop and a 27" monitor.
    const canvasWidth = this.canvas.clientWidth || 1;
    const columnWidth = Math.min(canvasWidth, CONTENT_MAX_WIDTH);
    const targetWidthPx = Math.min(
      BUST_WIDTH_MAX_PX,
      Math.max(BUST_WIDTH_MIN_PX, columnWidth * BUST_WIDTH_OF_COLUMN),
    );
    const widthRatio = Math.min(1, targetWidthPx / canvasWidth);

    const distanceForHeight = this.modelHeight / FILL_RATIO_HEIGHT / 2 / Math.tan(halfFov);
    const distanceForWidth =
      this.modelWidth / widthRatio / 2 / (Math.tan(halfFov) * aspect);

    this.cameraDistance = Math.max(distanceForHeight, distanceForWidth);
    this.camera.position.set(0, 0, this.cameraDistance);
    this.camera.lookAt(0, 0, 0);

    // Shift the bust up rather than moving the camera, so the frustum maths
    // above (and the scatter extents derived from it) stay centred on the axis.
    const visibleHeight = 2 * Math.tan(halfFov) * this.cameraDistance;
    this.group.position.y = visibleHeight * BUST_Y_FRACTION;
  }

  /** Half-extents of the frustum on the z=0 plane, in world units. */
  private visibleHalfExtents(): { halfWidth: number; halfHeight: number } {
    const halfFov = (this.camera.fov * Math.PI) / 360;
    const halfHeight = Math.tan(halfFov) * this.cameraDistance;
    return { halfWidth: halfHeight * this.camera.aspect, halfHeight };
  }

  private startAssemble(): void {
    if (!this.livePos || !this.finalPos || !this.posAttr) {
      this.showAssembled();
      this.renderer.render(this.scene, this.camera);
      return;
    }

    const live = this.livePos;
    const finalPos = this.finalPos;
    const attr = this.posAttr;
    const segCount = this.segCount;
    const scatterPos = new Float32Array(live.length);
    const delays = new Float32Array(segCount);
    /** Set once a segment has reached finalPos, so the tick can skip it. */
    const arrived = new Uint8Array(segCount);

    // Spread the cloud over the actual visible rect so the intro fills the hero
    // rather than starting outside the frustum (the old hardcoded radius of 5.8
    // put every bar off-screen for the whole hold).
    const { halfWidth, halfHeight } = this.visibleHalfExtents();
    const spreadX = halfWidth * 0.92;
    const spreadY = halfHeight * 0.92;
    // The group is lifted by BUST_Y_FRACTION, so in group-local space the
    // frame's centre sits below the origin. Without this the intro cloud would
    // be biased upward and leave the lower hero empty.
    const frameCenterY = -this.group.position.y;

    for (let s = 0; s < segCount; s++) {
      const i = s * 6;
      // Deterministic per-segment noise: stable across remounts, no Math.random.
      const rnd = mulberry32((s * 2654435761) >>> 0);

      // Translate the whole segment so its midpoint lands somewhere in the
      // visible rect — keeps each bar's own length and orientation intact.
      const midX = (finalPos[i] + finalPos[i + 3]) * 0.5;
      const midY = (finalPos[i + 1] + finalPos[i + 4]) * 0.5;
      const ox = (rnd() * 2 - 1) * spreadX - midX;
      const oy = frameCenterY + (rnd() * 2 - 1) * spreadY - midY;
      const oz = (rnd() * 2 - 1) * 0.55;

      scatterPos[i] = finalPos[i] + ox;
      scatterPos[i + 1] = finalPos[i + 1] + oy;
      scatterPos[i + 2] = finalPos[i + 2] + oz;
      scatterPos[i + 3] = finalPos[i + 3] + ox;
      scatterPos[i + 4] = finalPos[i + 4] + oy;
      scatterPos[i + 5] = finalPos[i + 5] + oz;
      delays[s] = rnd() ** 1.2;
    }

    live.set(scatterPos);
    attr.needsUpdate = true;
    if (this.lineMaterial) this.lineMaterial.opacity = 0.34;
    this.renderer.render(this.scene, this.camera);

    const t0 = performance.now();
    const tick = (now: number) => {
      if (this.disposed) return;

      const held = now - t0;
      if (held < SCATTER_HOLD_MS) {
        this.raf = requestAnimationFrame(tick);
        return;
      }

      const u = Math.min(1, (held - SCATTER_HOLD_MS) / ASSEMBLE_MS);
      const span = 1 - STAGGER;

      /*
        Only segments that are actually MOVING this frame are written.

        Every segment used to be rewritten on all 150-odd frames of the intro —
        238,326 float writes per frame — even though STAGGER is 0.78, so each
        one only travels during 22% of the timeline. The rest are sitting at
        their scatter position (already in `live` from the set() above) or have
        already landed on `finalPos`; rewriting them produces the identical
        number.

        `arrived` stops a landed segment from being written again on every
        later frame. The rendered output is bit-identical — this is arithmetic
        that was being thrown away.
      */
      for (let s = 0; s < segCount; s++) {
        if (arrived[s] === 1) continue;
        const local = Math.min(1, Math.max(0, (u - delays[s] * STAGGER) / span));
        if (local <= 0) continue;
        const e = easeOutCubic(local);
        const i = s * 6;
        for (let k = 0; k < 6; k++) {
          const a = scatterPos[i + k];
          live[i + k] = a + (finalPos[i + k] - a) * e;
        }
        if (local >= 1) arrived[s] = 1;
      }


      attr.needsUpdate = true;
      if (this.lineMaterial) {
        this.lineMaterial.opacity = 0.34 + 0.16 * easeOutCubic(u);
      }

      this.renderer.render(this.scene, this.camera);

      if (u < 1) {
        this.raf = requestAnimationFrame(tick);
      } else {
        this.raf = 0;
        live.set(finalPos);
        attr.needsUpdate = true;
        this.showAssembled();
        this.renderer.render(this.scene, this.camera);
        // Pointer moves that landed during the intro were ignored, and no new
        // event is guaranteed to arrive — kick the loop so a cursor already
        // resting on the head takes effect immediately.
        if (this.pointerActive) this.ensureLoop();
      }
    };

    this.raf = requestAnimationFrame(tick);
  }

  private showAssembled(): void {
    this.assembled = true;
    if (this.lineMaterial) this.lineMaterial.opacity = 0.5;
  }

  private enablePointer(): void {
    if (this.opts.reducedMotion || isCoarsePointer()) return;
    if (!this.finalPos || !this.livePos) return;

    const target = this.opts.pointerTarget ?? this.canvas;

    this.onPointerMove = (e: PointerEvent) => {
      if (!this.assembled || this.disposed) return;
      const rect = target.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;

      // NDC → unproject onto the z=0 plane through the head's centre.
      const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      this.tmp.set(ndcX, ndcY, 0.5).unproject(this.camera);
      this.tmp.sub(this.camera.position).normalize();
      const dist = -this.camera.position.z / this.tmp.z;
      this.planePoint.copy(this.camera.position).addScaledVector(this.tmp, dist);
      // Bars live in group-local space (yaw/pitch sit on the group).
      this.group.worldToLocal(this.planePoint);

      const wx = this.planePoint.x;
      const wy = this.planePoint.y;

      if (this.hasPointerSample) {
        // Smoothed direction of travel — this is what the wake pushes along.
        const dx = wx - this.pointerX;
        const dy = wy - this.pointerY;
        this.velX = this.velX * (1 - VEL_SMOOTH) + dx * VEL_SMOOTH;
        this.velY = this.velY * (1 - VEL_SMOOTH) + dy * VEL_SMOOTH;
      }

      this.pointerX = wx;
      this.pointerY = wy;
      this.hasPointerSample = true;
      this.pointerActive = true;
      this.ensureLoop();
    };

    this.onPointerLeave = () => {
      this.pointerActive = false;
      this.hasPointerSample = false;
      this.ensureLoop();
    };

    target.addEventListener('pointermove', this.onPointerMove, { passive: true });
    target.addEventListener('pointerleave', this.onPointerLeave, { passive: true });
  }

  private ensureLoop(): void {
    if (this.raf || this.disposed) return;
    const step = () => {
      if (this.disposed) return;
      const moving = this.tickPointer();
      this.renderer.render(this.scene, this.camera);
      if (moving) {
        this.raf = requestAnimationFrame(step);
      } else {
        this.raf = 0;
      }
    };
    this.raf = requestAnimationFrame(step);
  }

  /** Returns true while anything is still in motion. */
  private tickPointer(): boolean {
    const finalPos = this.finalPos;
    const live = this.livePos;
    const attr = this.posAttr;
    const ox = this.offsetX;
    const oy = this.offsetY;
    const oz = this.offsetZ;
    const jx = this.jitterX;
    const jy = this.jitterY;
    const jz = this.jitterZ;
    const mag = this.magScale;
    const ret = this.returnRate;
    if (!finalPos || !live || !attr || !ox || !oy || !oz || !jx || !jy || !jz || !mag || !ret) {
      return false;
    }

    // Velocity bleeds off every frame so the wake relaxes when the cursor
    // stops moving, even while it is still hovering.
    this.velX *= VEL_DECAY;
    this.velY *= VEL_DECAY;

    const speed = Math.sqrt(this.velX * this.velX + this.velY * this.velY);
    const active = this.pointerActive && speed > SPEED_EPS;

    let dirX = 0;
    let dirY = 0;
    let strength = 0;
    let speedFactor = 0;
    if (active) {
      dirX = this.velX / speed;
      dirY = this.velY / speed;
      speedFactor = Math.min(WAKE_SPEED_MAX, speed / WAKE_SPEED_REF);
      strength = speedFactor * WAKE_STRENGTH;
    }

    const px = this.pointerX;
    const py = this.pointerY;
    // The channel widens with speed too — a flick disturbs more of the surface
    // than a slow drag, which is what sells it as momentum rather than a switch.
    const radius = active
      ? this.wakeRadius *
        Math.min(WAKE_RADIUS_SPEED_MAX, 0.8 + WAKE_RADIUS_SPEED_GAIN * speedFactor)
      : this.wakeRadius;
    const bound = radius * WAKE_BOUND;
    const boundSq = bound * bound;
    let maxAbs = 0;

    for (let s = 0; s < this.segCount; s++) {
      const i = s * 6;

      let targetOx = 0;
      let targetOy = 0;
      let targetOz = 0;

      if (active) {
        const midX = (finalPos[i] + finalPos[i + 3]) * 0.5;
        const midY = (finalPos[i + 1] + finalPos[i + 4]) * 0.5;
        const dx = midX - px;
        const dy = midY - py;
        const dSq = dx * dx + dy * dy;
        if (dSq < boundSq) {
          // Rotate into the cursor's frame: `forward` runs along the direction
          // of travel, `lateral` across it. Normalising each by its own reach
          // turns the circle into the trailing cone described above.
          const forward = dx * dirX + dy * dirY;
          const lateral = dy * dirX - dx * dirY;
          const nf = forward / (radius * (forward >= 0 ? WAKE_AHEAD : WAKE_BEHIND));
          const ns = lateral / (radius * WAKE_LATERAL);
          const norm = Math.sqrt(nf * nf + ns * ns);
          if (norm >= 1) {
            // Outside the cone — leave this bar to spring home.
            const k0 = SPRING_RETURN * ret[s];
            const rx = ox[s] * (1 - k0);
            const ry = oy[s] * (1 - k0);
            const rz = oz[s] * (1 - k0);
            ox[s] = rx;
            oy[s] = ry;
            oz[s] = rz;
            live[i] = finalPos[i] + rx;
            live[i + 1] = finalPos[i + 1] + ry;
            live[i + 2] = finalPos[i + 2] + rz;
            live[i + 3] = finalPos[i + 3] + rx;
            live[i + 4] = finalPos[i + 4] + ry;
            live[i + 5] = finalPos[i + 5] + rz;
            const bx = rx < 0 ? -rx : rx;
            const by = ry < 0 ? -ry : ry;
            const bz = rz < 0 ? -rz : rz;
            if (bx > maxAbs) maxAbs = bx;
            if (by > maxAbs) maxAbs = by;
            if (bz > maxAbs) maxAbs = bz;
            continue;
          }
          const d = Math.sqrt(dSq) || 1e-4;
          const falloff = 1 - norm;
          const push = falloff * falloff * strength * mag[s];

          // Three superposed components. The mix is what makes this read as the
          // surface coming apart rather than being dragged:
          //   RADIAL  — pushes bars off the cursor, opening a hole along its path
          //   TRAVEL  — biases the debris the way the cursor is heading
          //   JITTER  — each bar's own direction; without it every bar moves
          //             identically and the whole thing smears as one piece
          const radialX = dx / d;
          const radialY = dy / d;
          targetOx = (radialX * W_RADIAL + dirX * W_TRAVEL + jx[s] * W_JITTER) * push;
          targetOy = (radialY * W_RADIAL + dirY * W_TRAVEL + jy[s] * W_JITTER) * push;
          targetOz = jz[s] * W_JITTER * push;
        }
      }

      // Moving further out than we already are means the cursor is actively
      // throwing this bar — snap. Otherwise it is drifting home — take it slow.
      const targetMagSq = targetOx * targetOx + targetOy * targetOy + targetOz * targetOz;
      const currentMagSq = ox[s] * ox[s] + oy[s] * oy[s] + oz[s] * oz[s];
      const k =
        targetMagSq > currentMagSq ? SPRING_SCATTER : SPRING_RETURN * ret[s];

      const nx = ox[s] + (targetOx - ox[s]) * k;
      const ny = oy[s] + (targetOy - oy[s]) * k;
      const nz = oz[s] + (targetOz - oz[s]) * k;
      ox[s] = nx;
      oy[s] = ny;
      oz[s] = nz;

      live[i] = finalPos[i] + nx;
      live[i + 1] = finalPos[i + 1] + ny;
      live[i + 2] = finalPos[i + 2] + nz;
      live[i + 3] = finalPos[i + 3] + nx;
      live[i + 4] = finalPos[i + 4] + ny;
      live[i + 5] = finalPos[i + 5] + nz;

      const absX = nx < 0 ? -nx : nx;
      const absY = ny < 0 ? -ny : ny;
      const absZ = nz < 0 ? -nz : nz;
      if (absX > maxAbs) maxAbs = absX;
      if (absY > maxAbs) maxAbs = absY;
      if (absZ > maxAbs) maxAbs = absZ;
    }

    attr.needsUpdate = true;
    return maxAbs > SETTLE_EPS || active;
  }

  private resize = (): void => {
    if (this.disposed) return;
    const { canvas, renderer, camera } = this;
    const width = canvas.clientWidth || 1;
    const height = canvas.clientHeight || 1;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Reframe on every resize — which axis is binding changes with the aspect
    // ratio, so a window resize or device rotation would otherwise leave the
    // bust cropped or stranded.
    this.updateFraming();
    camera.updateProjectionMatrix();
  };

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.resizeObserver?.disconnect();

    const target = this.opts.pointerTarget ?? this.canvas;
    if (this.onPointerMove) target.removeEventListener('pointermove', this.onPointerMove);
    if (this.onPointerLeave) target.removeEventListener('pointerleave', this.onPointerLeave);

    for (const geometry of this.geometries) geometry.dispose();
    for (const material of this.materials) material.dispose();
    this.geometries = [];
    this.materials = [];
    this.lineMaterial = null;
    this.finalPos = null;
    this.livePos = null;
    this.posAttr = null;
    this.offsetX = null;
    this.offsetY = null;
    this.offsetZ = null;
    this.jitterX = null;
    this.jitterY = null;
    this.jitterZ = null;
    this.magScale = null;
    this.returnRate = null;

    this.scene?.clear();
    this.renderer?.dispose();
    this.renderer?.forceContextLoss();
  }
}

export async function mountHead(
  canvas: HTMLCanvasElement,
  options: HeadOptions = {},
): Promise<() => void> {
  const controller = new HeadController(canvas, options);
  await controller.mount();
  return () => controller.dispose();
}

/**
 * Full triangle-edge wireframe, capped only if it exceeds the device budget.
 *
 * The previous version also dropped edges outside the 3rd–99.5th length
 * percentile. At full density that trim removed real surface detail for no
 * benefit, so only the device cap remains.
 */
function buildWireBars(geometry: BufferGeometry, maxSegments: number): BufferGeometry {
  const wire = probeSpan('head.wb:WireframeGeometry', () => new WireframeGeometry(geometry));
  const src = (wire.getAttribute('position') as BufferAttribute).array as Float32Array;
  const segCount = (src.length / 6) | 0;

  let out: Float32Array;
  if (segCount <= maxSegments) {
    out = probeSpan('head.wb:copy', () => new Float32Array(src));
  } else {
    out = new Float32Array(maxSegments * 6);
    for (let i = 0; i < maxSegments; i++) {
      const s = Math.floor((i * segCount) / maxSegments);
      out.set(src.subarray(s * 6, s * 6 + 6), i * 6);
    }
  }

  wire.dispose();
  const bars = new BufferGeometry();
  bars.setAttribute('position', new BufferAttribute(out, 3));
  return bars;
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

/** Small deterministic PRNG so the intro scatter is identical on every mount. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function isCoarsePointer(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}
