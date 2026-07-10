// WebGL depth-displacement renderer — the "fake 3D" technique that turns a 2D
// product cutout + a depth map into an interactive 2.5D view. The fragment
// shader offsets each pixel's texture lookup by the depth at that pixel, scaled
// by a "look" vector driven by pointer / device tilt, so nearer parts of the
// garment parallax more than farther ones and it reads as worn volume.
//
// Pure WebGL — no library, no model. Runs at 60fps on the main thread (it's
// just two textured triangles), and exports the current frame to a blob for
// download/save.

const VERT = `
  attribute vec2 aPos;
  varying vec2 vUv;
  void main() {
    // Full-screen quad; flip V so image space matches texture space.
    vUv = vec2(aPos.x * 0.5 + 0.5, 1.0 - (aPos.y * 0.5 + 0.5));
    gl_Position = vec4(aPos, 0.0, 1.0);
  }
`;

const FRAG = `
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
    vec4 color = texture2D(uImage, uv);
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

/**
 * Mount an interactive depth-displacement view on a canvas.
 *
 * @param {HTMLCanvasElement} canvas Target canvas (sized to the display area).
 * @param {ImageBitmap|HTMLImageElement} image The product cutout (RGBA).
 * @param {ImageBitmap|HTMLImageElement} depth The grayscale depth map.
 * @param {{ amount?: number }} [opts] `amount` = max parallax (0.02–0.08 feels right).
 * @returns {{ setLook: (x:number,y:number)=>void, exportBlob: () => Promise<Blob>, dispose: () => void }}
 */
export function mountMannequin3D(canvas, image, depth, { amount = 0.04 } = {}) {
  const gl = canvas.getContext("webgl", { premultipliedAlpha: false, preserveDrawingBuffer: true });
  if (!gl) throw new Error("WebGL isn't available on this device.");

  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error("Program link failed: " + gl.getProgramInfoLog(prog));
  }
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

  gl.useProgram(prog);
  gl.uniform1i(gl.getUniformLocation(prog, "uImage"), 0);
  gl.uniform1i(gl.getUniformLocation(prog, "uDepth"), 1);
  gl.uniform1f(gl.getUniformLocation(prog, "uAmount"), amount);
  const uLook = gl.getUniformLocation(prog, "uLook");

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
