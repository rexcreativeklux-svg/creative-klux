// WebGL depth renderers for the Ghost Mannequin "3D Preview" — pure WebGL, no
// library, no model. Two modes:
//
//  • "mesh" (default) — TRUE 3D: a grid mesh whose vertices are displaced in Z
//    by the depth map (displacement precomputed on the CPU, so no vertex-
//    texture-fetch compatibility worries), rendered through a perspective
//    camera the user rotates by dragging (yaw/pitch, clamped + eased). Real
//    geometry: the silhouette itself shifts as you rotate.
//  • "parallax" — the original 2.5D fallback: a full-screen quad whose fragment
//    shader offsets texture lookups by depth ("fake 3D"). Used automatically
//    when the mesh path fails (very old GPUs).
//
// Both run at 60fps (a few ms of triangles) and export the current frame as a
// PNG blob for download/save.

const GRID = 128; // mesh resolution — 129² verts fits comfortably in Uint16
const MAX_YAW = 0.44; // ±25° — beyond this a single-view depth mesh falls apart
const MAX_PITCH = 0.35; // ±20°

const PARALLAX_VERT = `
  attribute vec2 aPos;
  varying vec2 vUv;
  void main() {
    // Full-screen quad; flip V so image space matches texture space.
    vUv = vec2(aPos.x * 0.5 + 0.5, 1.0 - (aPos.y * 0.5 + 0.5));
    gl_Position = vec4(aPos, 0.0, 1.0);
  }
`;

const PARALLAX_FRAG = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uImage; // RGBA cutout (alpha = product mask)
  uniform sampler2D uDepth; // grayscale depth (r channel)
  uniform vec2 uLook;       // parallax offset from pointer/tilt
  uniform float uAmount;    // displacement strength
  void main() {
    // Depth in [0,1]; center it so mid-depth doesn't drift.
    float d = texture2D(uDepth, vUv).r - 0.5;
    vec2 uv = vUv + uLook * d * uAmount;
    gl_FragColor = texture2D(uImage, uv);
  }
`;

const MESH_VERT = `
  attribute vec3 aPos;
  attribute vec2 aUv;
  uniform mat4 uMvp;
  varying vec2 vUv;
  void main() {
    vUv = aUv;
    gl_Position = uMvp * vec4(aPos, 1.0);
  }
`;

const MESH_FRAG = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uImage;
  void main() {
    vec4 color = texture2D(uImage, vUv);
    // Invisible fragments must not write depth (they'd occlude real ones).
    if (color.a < 0.05) discard;
    gl_FragColor = color;
  }
`;

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    throw new Error("Shader compile failed: " + gl.getShaderInfoLog(sh));
  }
  return sh;
}

function link(gl, vertSrc, fragSrc) {
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, vertSrc));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, fragSrc));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error("Program link failed: " + gl.getProgramInfoLog(prog));
  }
  return prog;
}

function texture(gl, source) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  return tex;
}

// ── Minimal column-major mat4 helpers (all we need: perspective × rotations) ──
function mat4Perspective(fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2);
  const nf = 1 / (near - far);
  // prettier-ignore
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, 2 * far * near * nf, 0,
  ]);
}

function mat4Multiply(a, b) {
  const out = new Float32Array(16);
  for (let c = 0; c < 4; c += 1) {
    for (let r = 0; r < 4; r += 1) {
      out[c * 4 + r] =
        a[r] * b[c * 4] +
        a[4 + r] * b[c * 4 + 1] +
        a[8 + r] * b[c * 4 + 2] +
        a[12 + r] * b[c * 4 + 3];
    }
  }
  return out;
}

function mat4ModelView(yaw, pitch, zOffset) {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cx = Math.cos(pitch);
  const sx = Math.sin(pitch);
  // Ry(yaw) then Rx(pitch), translated back by zOffset (camera at origin).
  // prettier-ignore
  return new Float32Array([
    cy, sx * sy, -cx * sy, 0,
    0, cx, sx, 0,
    sy, -sx * cy, cx * cy, 0,
    0, 0, zOffset, 1,
  ]);
}

/** Sample the depth image into a (GRID+1)² Float32 height field (0–1). */
function sampleDepthField(depth) {
  const side = GRID + 1;
  const canvas = document.createElement("canvas");
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(depth, 0, 0, side, side);
  const { data } = ctx.getImageData(0, 0, side, side);
  const field = new Float32Array(side * side);
  for (let i = 0; i < field.length; i += 1) field[i] = data[i * 4] / 255;
  return field;
}

/**
 * Mount an interactive depth view on a canvas.
 *
 * @param {HTMLCanvasElement} canvas Target canvas (sized to the display area).
 * @param {ImageBitmap|HTMLImageElement} image The product cutout (RGBA).
 * @param {ImageBitmap|HTMLImageElement} depth The grayscale depth map.
 * @param {{ amount?: number, depthScale?: number, mode?: "mesh"|"parallax" }} [opts]
 *   `amount` = parallax strength (2.5D mode); `depthScale` = mesh Z relief.
 * @returns {{ mode: "mesh"|"parallax", setLook: (x:number,y:number)=>void,
 *   exportBlob: () => Promise<Blob>, dispose: () => void }}
 *   `setLook` takes normalized [-1,1] values: in mesh mode they map to
 *   yaw/pitch rotation, in parallax mode to the look offset.
 */
export function mountMannequin3D(canvas, image, depth, opts = {}) {
  const { amount = 0.04, depthScale = 0.3, mode = "mesh" } = opts;
  const gl = canvas.getContext("webgl", {
    premultipliedAlpha: false,
    preserveDrawingBuffer: true,
  });
  if (!gl) throw new Error("WebGL isn't available on this device.");

  if (mode === "mesh") {
    try {
      return mountMesh(gl, canvas, image, depth, depthScale);
    } catch (err) {
      console.warn("⚠️ mannequin3D: mesh mode failed, falling back to parallax:", err?.message);
    }
  }
  return mountParallax(gl, canvas, image, depth, amount);
}

/** TRUE-3D mode: depth-displaced grid mesh + drag-rotated perspective camera. */
function mountMesh(gl, canvas, image, depth, depthScale) {
  const prog = link(gl, MESH_VERT, MESH_FRAG);
  gl.useProgram(prog);

  // Plane sized so the longest side is 1, matching the cutout's aspect.
  const aspect = image.naturalWidth
    ? image.naturalWidth / image.naturalHeight
    : image.width / image.height;
  const planeW = aspect >= 1 ? 1 : aspect;
  const planeH = aspect >= 1 ? 1 / aspect : 1;

  // CPU-displaced vertices (avoids vertex-texture-fetch, which some low-end
  // GPUs don't support): x,y across the plane, z from the depth field.
  const field = sampleDepthField(depth);
  const side = GRID + 1;
  const positions = new Float32Array(side * side * 3);
  const uvs = new Float32Array(side * side * 2);
  for (let gy = 0; gy < side; gy += 1) {
    for (let gx = 0; gx < side; gx += 1) {
      const i = gy * side + gx;
      const u = gx / GRID;
      const v = gy / GRID;
      positions[i * 3] = (u - 0.5) * planeW;
      positions[i * 3 + 1] = (0.5 - v) * planeH;
      positions[i * 3 + 2] = (field[i] - 0.5) * depthScale;
      uvs[i * 2] = u;
      uvs[i * 2 + 1] = v;
    }
  }
  const indices = new Uint16Array(GRID * GRID * 6);
  let k = 0;
  for (let gy = 0; gy < GRID; gy += 1) {
    for (let gx = 0; gx < GRID; gx += 1) {
      const tl = gy * side + gx;
      const tr = tl + 1;
      const bl = tl + side;
      const br = bl + 1;
      indices[k++] = tl;
      indices[k++] = bl;
      indices[k++] = tr;
      indices[k++] = tr;
      indices[k++] = bl;
      indices[k++] = br;
    }
  }

  const posBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

  const uvBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
  gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
  const aUv = gl.getAttribLocation(prog, "aUv");
  gl.enableVertexAttribArray(aUv);
  gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);

  const idxBuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  gl.activeTexture(gl.TEXTURE0);
  const imgTex = texture(gl, image);
  gl.uniform1i(gl.getUniformLocation(prog, "uImage"), 0);
  const uMvp = gl.getUniformLocation(prog, "uMvp");

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const proj = mat4Perspective(
    (28 * Math.PI) / 180,
    canvas.width / canvas.height,
    0.1,
    10,
  );

  let look = { x: 0, y: 0 };
  let target = { x: 0, y: 0 };
  let raf = 0;
  let disposed = false;

  function render() {
    look.x += (target.x - look.x) * 0.12;
    look.y += (target.y - look.y) * 0.12;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const mv = mat4ModelView(look.x * MAX_YAW, look.y * MAX_PITCH, -2.4);
    gl.uniformMatrix4fv(uMvp, false, mat4Multiply(proj, mv));
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    if (!disposed) raf = requestAnimationFrame(render);
  }
  render();

  return {
    mode: "mesh",
    /** Normalized [-1,1] → clamped yaw/pitch rotation targets. */
    setLook(x, y) {
      target.x = Math.max(-1, Math.min(1, x));
      target.y = Math.max(-1, Math.min(1, y));
    },
    /** Snapshot the current frame (current angle) as a transparent PNG blob. */
    exportBlob() {
      return new Promise((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Export failed"))), "image/png"),
      );
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      gl.deleteTexture(imgTex);
      gl.deleteBuffer(posBuf);
      gl.deleteBuffer(uvBuf);
      gl.deleteBuffer(idxBuf);
      gl.deleteProgram(prog);
    },
  };
}

/** 2.5D fallback: full-screen quad, fragment-shader parallax. */
function mountParallax(gl, canvas, image, depth, amount) {
  const prog = link(gl, PARALLAX_VERT, PARALLAX_FRAG);
  gl.useProgram(prog);

  // Full-screen quad.
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  gl.activeTexture(gl.TEXTURE0);
  const imgTex = texture(gl, image);
  gl.activeTexture(gl.TEXTURE1);
  const depthTex = texture(gl, depth);

  gl.uniform1i(gl.getUniformLocation(prog, "uImage"), 0);
  gl.uniform1i(gl.getUniformLocation(prog, "uDepth"), 1);
  gl.uniform1f(gl.getUniformLocation(prog, "uAmount"), amount);
  const uLook = gl.getUniformLocation(prog, "uLook");

  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  let look = { x: 0, y: 0 };
  let target = { x: 0, y: 0 };
  let raf = 0;
  let disposed = false;

  function render() {
    // Ease toward the target look for a smooth, non-jerky parallax.
    look.x += (target.x - look.x) * 0.12;
    look.y += (target.y - look.y) * 0.12;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(uLook, look.x, look.y);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (!disposed) raf = requestAnimationFrame(render);
  }
  render();

  return {
    mode: "parallax",
    /** Set the parallax target from a normalized [-1,1] pointer/tilt position. */
    setLook(x, y) {
      target.x = Math.max(-1, Math.min(1, x));
      target.y = Math.max(-1, Math.min(1, y));
    },
    /** Snapshot the current frame as a PNG blob (straight-on if look is reset). */
    exportBlob() {
      return new Promise((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Export failed"))), "image/png"),
      );
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      gl.deleteTexture(imgTex);
      gl.deleteTexture(depthTex);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    },
  };
}
