// Рисунок товара в стиле эскиза: металлочерепица, профнастил, сайдинг, водосток, доборные.
// Поверхность делится на мелкие грани, грани и линии рисуются на canvas от дальних к ближним.
/* eslint-disable */
// @ts-nocheck — геометрия перенесена из макета как есть; типы здесь только мешали бы читать

export interface ArtOptions {
  kind?: string;
  model?: string;
  color?: string;
  sketch?: boolean;
  wash?: boolean;
}

export function artItems(kind, model, color, sketch) {
  const TAU = Math.PI * 2;
  const fract = (x) => x - Math.floor(x);
  const sm = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  const STEP = 0.35;
  const row = (s) => 0.35 + 0.65 * Math.sin(Math.PI * s);
  // Профили: высота (м) над плоскостью в точке u (поперёк) и v (вдоль ската); первое число — шаг волны
  const PROF = {
    classic: [
      0.1833,
      (u, v) => {
        const s = fract(v / STEP);
        const w = 0.5 + 0.5 * Math.cos((TAU * u) / 0.1833);
        return 0.022 * Math.pow(1 - s, 0.8) + 0.03 * w * row(s);
      },
    ],
    volume: [
      0.1833,
      (u, v) => {
        const s = fract(v / STEP);
        const w = Math.pow(0.5 + 0.5 * Math.cos((TAU * u) / 0.1833), 0.55);
        return (
          0.03 * Math.pow(1 - s, 0.6) +
          0.036 * w * (0.2 + 0.8 * Math.pow(Math.sin(Math.PI * s), 0.6))
        );
      },
    ],
    wide: [
      0.2,
      (u, v) => {
        const s = fract(v / STEP);
        const w = sm(0.15, 0.85, 0.5 + 0.5 * Math.cos((TAU * u) / 0.2));
        return 0.024 * Math.pow(1 - s, 0.8) + 0.03 * w * row(s);
      },
    ],
    flatTop: [
      0.1833,
      (u, v) => {
        const s = fract(v / STEP);
        const w = Math.min(1, 1.45 * (0.5 + 0.5 * Math.cos((TAU * u) / 0.1833)));
        return 0.024 * Math.pow(1 - s, 0.8) + 0.03 * w * row(s);
      },
    ],
    kaskad: [
      0,
      (u, v) => {
        const s = fract(v / STEP);
        const x = fract(u / 0.2);
        const w = sm(0.06, 0.16, x) - sm(0.84, 0.94, x);
        return 0.024 * (1 - s) + 0.022 * w * sm(0, 0.08, s) * sm(1, 0.9, s);
      },
    ],
    stella: [
      0.2,
      (u, v) => {
        const s = fract(v / STEP);
        const w = 0.5 + 0.5 * Math.cos((TAU * u) / 0.2);
        return 0.026 * Math.pow(1 - s, 0.7) + 0.032 * w * Math.pow(Math.sin(Math.PI * s), 0.8);
      },
    ],
    como: [
      0,
      (u, v) => {
        const s = fract(v / STEP);
        const r = Math.floor(v / STEP);
        const x = fract(u / 0.25 + (r % 2) * 0.5);
        const gq = 1 - (1 - sm(0, 0.05, x) * sm(1, 0.95, x)) * 0.8;
        return 0.026 * Math.pow(1 - s, 0.9) + 0.008 * gq;
      },
    ],
    c8: [
      0.115,
      (u) => {
        const x = fract(u / 0.115);
        return 0.008 * (sm(0.1, 0.22, x) - sm(0.62, 0.74, x));
      },
    ],
    c20: [
      0,
      (u) => {
        const x = fract(u / 0.1375);
        return 0.02 * (sm(0.12, 0.26, x) - sm(0.6, 0.74, x));
      },
    ],
    ns35: [
      0,
      (u) => {
        const x = fract(u / 0.2);
        return 0.035 * (sm(0.1, 0.24, x) - sm(0.56, 0.7, x));
      },
    ],
  };
  const norm = (v) => {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  };
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cam = (az, el) => {
    az *= Math.PI / 180;
    el *= Math.PI / 180;
    return [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)];
  };
  const tilt = (a) => (u, v, hh) => [
    u,
    v * Math.sin(a) + hh * Math.cos(a),
    -v * Math.cos(a) + hh * Math.sin(a),
  ];

  let C = cam(-28, 30);
  const LIGHT = norm([-0.55, 0.85, 0.5]);
  const S = []; // поверхности: P(s,t), сетка, штриховка hs (линии вдоль t) и ht (линии вдоль s)
  if (kind === "tile" || kind === "profnastil" || kind === "siding") {
    const W = kind === "siding" ? 1.2 : 1.1,
      Ln = kind === "siding" ? 1.0 : 1.2;
    const [period, prof] =
      kind === "siding" ? [0, (u, v) => 0.02 * (1 - fract(v / 0.2))] : PROF[model] || PROF.classic;
    const T = kind === "tile" ? tilt(0.55) : tilt(Math.PI / 2 - (kind === "siding" ? 0.05 : 0.12));
    if (kind !== "tile") C = cam(-32, 14);
    const ou = 0.04,
      ov = 0.1;
    const hs = [],
      ht = [];
    if (period)
      for (let u = period; u < W + ou; u += period) {
        const s = (u - ou) / W;
        if (s > 0.01 && s < 0.99) hs.push(s);
      }
    const rowStep = kind === "siding" ? 0.2 : kind === "tile" ? STEP : 0;
    if (rowStep)
      for (let v = rowStep; v < Ln + ov; v += rowStep) {
        const t = (v - ov) / Ln;
        if (t > 0.01 && t < 0.99) ht.push(t - 0.004);
      }
    S.push({
      P: (s, t) => T(s * W - W / 2, t * Ln - Ln / 2, prof(s * W + ou, t * Ln + ov)),
      ns: Math.round(W / 0.011),
      nt: kind === "tile" ? Math.round(Ln / 0.01) : kind === "siding" ? 100 : 16,
      hs,
      ht,
      edge: true,
    });
    // Нижний срез листа — видно профиль волны
    S.push({
      P: (s, t) => {
        const p = T(s * W - W / 2, -Ln / 2, prof(s * W + ou, ov));
        return [p[0], p[1] - 0.012 * t, p[2]];
      },
      ns: Math.round(W / 0.011),
      nt: 1,
      cut: true,
      edge: true,
    });
  } else if (kind === "gutter") {
    const r = 0.07,
      len = 0.9;
    C = cam(-24, 50);
    S.push({
      P: (s, t) => {
        const a = Math.PI + s * Math.PI;
        return [len * (t - 0.5), r * Math.sin(a), r * Math.cos(a)];
      },
      ns: 48,
      nt: 60,
      two: true,
      edge: true,
      ht: [],
      hs: [0.25, 0.5, 0.75],
    });
    S.push({
      P: (s, t) => {
        const a = s * TAU;
        return [len * (t - 0.5), 0.006 * Math.sin(a), r + 0.006 + 0.006 * Math.cos(a)];
      },
      ns: 16,
      nt: 60,
      edge: false,
    });
  } else if (kind === "pipe") {
    const r = 0.05,
      len = 0.55;
    C = cam(-30, 18);
    S.push({
      P: (s, t) => {
        const a = s * TAU;
        return [r * Math.cos(a), len * (t - 0.5), r * Math.sin(a)];
      },
      ns: 64,
      nt: 24,
      edge: true,
      hs: [0.55, 0.6, 0.64, 0.68, 0.71],
      ht: [],
    });
    S.push({
      P: (s, t) => {
        const a = s * TAU;
        return [(r + 0.012) * Math.cos(a), 0.1 + 0.05 * t, (r + 0.012) * Math.sin(a)];
      },
      ns: 64,
      nt: 3,
      edge: true,
    });
  } else if (kind === "ridge") {
    const r = 0.11,
      len = 0.9;
    C = cam(-30, 30);
    S.push({
      P: (s, t) => {
        const x = len * (t - 0.5);
        if (s < 0.2) {
          const kk = s / 0.2;
          return [
            x,
            -0.04 * (1 - kk) + r * Math.sin(0.35) * kk,
            -0.2 + (0.2 - r * Math.cos(0.35)) * kk,
          ];
        }
        if (s > 0.8) {
          const kk = (s - 0.8) / 0.2;
          return [
            x,
            r * Math.sin(0.35) * (1 - kk) - 0.04 * kk,
            r * Math.cos(0.35) + (0.2 - r * Math.cos(0.35)) * kk,
          ];
        }
        const a = Math.PI - 0.35 - ((s - 0.2) / 0.6) * (Math.PI - 0.7);
        return [x, r * Math.sin(a), -r * Math.cos(a)];
      },
      ns: 60,
      nt: 30,
      two: true,
      edge: true,
      hs: [0.35, 0.5, 0.65],
      ht: [],
    });
  } else {
    const len = 0.9;
    C = cam(-30, 28);
    const pts = [
      [-0.1, 0.06],
      [0.02, 0],
      [0.06, -0.035],
      [0.075, -0.05],
    ];
    S.push({
      P: (s, t) => {
        const f = s * (pts.length - 1);
        const i = Math.min(pts.length - 2, Math.floor(f));
        const kk = f - i;
        return [
          len * (t - 0.5),
          pts[i][1] + (pts[i + 1][1] - pts[i][1]) * kk,
          pts[i][0] + (pts[i + 1][0] - pts[i][0]) * kk,
        ];
      },
      ns: 36,
      nt: 20,
      two: true,
      edge: true,
      hs: [],
      ht: [],
    });
  }

  const R = norm(cross([0, 1, 0], C));
  const U = cross(C, R);
  const hex = color.replace("#", "");
  const base = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const paper = [255, 253, 249];
  // Три тона: тень, полутон, свет — ровная заливка, как в архитектурной подаче
  const tone = (lvl) => {
    if (sketch)
      return (
        "rgb(" + paper.map((p, i) => Math.round(p - [10, 6, 0][i] - (2 - lvl) * 4)).join(",") + ")"
      );
    const m = [0.74, 0.9, 1.0][lvl],
      lift = [0, 0.06, 0.2][lvl];
    return (
      "rgb(" +
      base.map((c, i) => Math.round(Math.min(255, c * m + (paper[i] - c * m) * lift))).join(",") +
      ")"
    );
  };
  const tones = [
    tone(0),
    tone(1),
    tone(2),
    sketch ? "rgb(236,229,219)" : "rgb(" + base.map((c) => Math.round(c * 0.55)).join(",") + ")",
  ];
  const items = [];
  for (const sf of S) {
    const grid = [];
    for (let j = 0; j <= sf.nt; j++) {
      const r = [];
      for (let i = 0; i <= sf.ns; i++) r.push(sf.P(i / sf.ns, j / sf.nt));
      grid.push(r);
    }
    const nrm = [];
    for (let j = 0; j < sf.nt; j++) {
      nrm.push([]);
      for (let i = 0; i < sf.ns; i++) {
        const a = grid[j][i],
          b = grid[j][i + 1],
          c = grid[j + 1][i + 1],
          d = grid[j + 1][i];
        let n = norm(cross(sub(b, a), sub(d, a)));
        if (dot(n, C) < 0) {
          if (!sf.two && !sf.cut) {
            nrm[j].push(null);
            continue;
          }
          n = [-n[0], -n[1], -n[2]];
        }
        nrm[j].push(n);
        const lit = Math.max(0, dot(n, LIGHT));
        const lvl = sf.cut ? 3 : lit < 0.45 ? 0 : lit < 0.8 ? 1 : 2;
        items.push({
          z: dot([(a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2], C),
          pts: [a, b, c, d],
          fill: tones[lvl],
        });
      }
    }
    // Линии: изломы (резкая смена нормали), штриховка по гребням и ступенькам, контур
    const seg = (p, q, w, a, bias) =>
      items.push({
        z: dot([(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2], C) + bias,
        line: [p, q],
        w,
        a,
      });
    for (let j = 0; j < sf.nt; j++)
      for (let i = 0; i < sf.ns; i++) {
        const n = nrm[j][i];
        if (!n) continue;
        const nr = i + 1 < sf.ns ? nrm[j][i + 1] : null;
        if (nr && dot(n, nr) < 0.62) seg(grid[j][i + 1], grid[j + 1][i + 1], 0.7, 0.6, 0.006);
        const nd = j + 1 < sf.nt ? nrm[j + 1][i] : null;
        if (nd && dot(n, nd) < 0.62) seg(grid[j + 1][i], grid[j + 1][i + 1], 0.7, 0.6, 0.006);
      }
    for (const s of sf.hs || []) {
      const i = Math.round(s * sf.ns);
      for (let j = 0; j < sf.nt; j++)
        if (nrm[j][Math.min(i, sf.ns - 1)]) seg(grid[j][i], grid[j + 1][i], 0.55, 0.38, 0.006);
    }
    for (const t of sf.ht || []) {
      const j = Math.round(t * sf.nt);
      for (let i = 0; i < sf.ns; i++) seg(grid[j][i], grid[j][i + 1], 0.8, 0.62, 0.006);
    }
    if (sf.edge) {
      for (let i = 0; i < sf.ns; i++) {
        seg(grid[0][i], grid[0][i + 1], 1.1, 0.8, 0.02);
        seg(grid[sf.nt][i], grid[sf.nt][i + 1], 1.1, 0.8, 0.02);
      }
      for (let j = 0; j < sf.nt; j++) {
        seg(grid[j][0], grid[j + 1][0], 1.1, 0.8, 0.02);
        seg(grid[j][sf.ns], grid[j + 1][sf.ns], 1.1, 0.8, 0.02);
      }
    }
  }
  items.sort((p, q) => p.z - q.z);
  const proj = (p) => [dot(p, R), -dot(p, U)];
  let x0 = 1e9,
    x1 = -1e9,
    y0 = 1e9,
    y1 = -1e9;
  for (const it of items)
    for (const p of it.pts || it.line) {
      const [x, y] = proj(p);
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }
  const sc = Math.min(330 / (x1 - x0), 220 / (y1 - y0));
  const ox = 200 - ((x0 + x1) / 2) * sc,
    oy = 142 - ((y0 + y1) / 2) * sc;
  const S2 = (p) => {
    const [x, y] = proj(p);
    return [ox + x * sc, oy + y * sc];
  };
  return {
    items: items.map((it) =>
      it.pts
        ? { q: it.pts.flatMap(S2), fill: it.fill }
        : { l: it.line.flatMap(S2), w: it.w, a: it.a },
    ),
    shX: 200,
    shY: Math.min(290, oy + y1 * sc + 6),
    shR: (x1 - x0) * sc * 0.5,
  };
}

const cache = new WeakMap();

export function paintArt(canvasEl: HTMLCanvasElement, opts: ArtOptions = {}) {
  const self = { canvas: canvasEl, props: opts, _key: cache.get(canvasEl), art: artItems };

  const cv = self.canvas;
  if (!cv) return;
  const P = self.props;
  const kind = P.kind || "tile";
  const model = P.model || (kind === "profnastil" ? "c20" : "classic");
  const color = P.color || "#45322E";
  const key = [kind, model, color, P.sketch, P.wash, cv.clientWidth, cv.clientHeight].join("|");
  if (self._key === key) return;
  self._key = key;
  const art = self.art(kind, model, color, Boolean(P.sketch));
  const w = cv.clientWidth || 400,
    h = cv.clientHeight || 300;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(w * dpr);
  cv.height = Math.round(h * dpr);
  const g = cv.getContext("2d");
  const k = Math.min(w / 400, h / 300) * dpr;
  g.setTransform(k, 0, 0, k, (cv.width - 400 * k) / 2, (cv.height - 300 * k) / 2);
  if (P.wash !== false) {
    const rg = g.createRadialGradient(250, 110, 0, 250, 110, 150);
    rg.addColorStop(0, "rgba(243,201,157,.55)");
    rg.addColorStop(0.6, "rgba(246,220,192,.3)");
    rg.addColorStop(1, "rgba(251,238,224,0)");
    g.fillStyle = rg;
    g.fillRect(100, -40, 300, 300);
    g.fillStyle = "rgba(246,210,172,.42)";
    g.beginPath();
    g.arc(258, 100, 70, 0, Math.PI * 2);
    g.fill();
  }
  // Мягкая тень на «земле»
  g.save();
  g.translate(art.shX, art.shY);
  g.scale(1, 0.09);
  const sg = g.createRadialGradient(0, 0, 0, 0, 0, art.shR);
  sg.addColorStop(0, "rgba(59,49,40,.2)");
  sg.addColorStop(1, "rgba(59,49,40,0)");
  g.fillStyle = sg;
  g.beginPath();
  g.arc(0, 0, art.shR, 0, Math.PI * 2);
  g.fill();
  g.restore();
  g.lineJoin = "round";
  g.lineCap = "round";
  for (const it of art.items) {
    if (it.q) {
      g.fillStyle = it.fill;
      g.strokeStyle = it.fill;
      g.lineWidth = 0.5;
      g.beginPath();
      g.moveTo(it.q[0], it.q[1]);
      g.lineTo(it.q[2], it.q[3]);
      g.lineTo(it.q[4], it.q[5]);
      g.lineTo(it.q[6], it.q[7]);
      g.closePath();
      g.fill();
      g.stroke();
    } else {
      g.strokeStyle = "rgba(43,38,34," + it.a + ")";
      g.lineWidth = it.w;
      g.beginPath();
      g.moveTo(it.l[0], it.l[1]);
      g.lineTo(it.l[2], it.l[3]);
      g.stroke();
    }
  }

  cache.set(canvasEl, self._key);
}
