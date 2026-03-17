// ── Helpers ─────────────────────────────────────────────────────────────

function exposureColor(score, alpha = 1) {
  // Richer 5-stop gradient: teal → green → amber → orange → red
  const t = Math.max(0, Math.min(10, score)) / 10;
  const stops = [
    [0, 45, 180, 120],    // 0: deep teal
    [0.25, 52, 211, 153], // 2.5: emerald green
    [0.5, 250, 204, 21],  // 5: golden amber
    [0.75, 249, 115, 22], // 7.5: vivid orange
    [1, 239, 68, 68],     // 10: red
  ];
  let i = 0;
  for (; i < stops.length - 2; i++) { if (t <= stops[i + 1][0]) break; }
  const [t0, r0, g0, b0] = stops[i];
  const [t1, r1, g1, b1] = stops[i + 1];
  const s = (t - t0) / (t1 - t0);
  const r = Math.round(r0 + s * (r1 - r0));
  const g = Math.round(g0 + s * (g1 - g0));
  const b = Math.round(b0 + s * (b1 - b0));
  return `rgba(${r},${g},${b},${alpha})`;
}
function exposureRGB(score) {
  const t = Math.max(0, Math.min(10, score)) / 10;
  const stops = [
    [0, 45, 180, 120], [0.25, 52, 211, 153], [0.5, 250, 204, 21],
    [0.75, 249, 115, 22], [1, 239, 68, 68],
  ];
  let i = 0;
  for (; i < stops.length - 2; i++) { if (t <= stops[i + 1][0]) break; }
  const [t0, r0, g0, b0] = stops[i], [t1, r1, g1, b1] = stops[i + 1];
  const s = (t - t0) / (t1 - t0);
  return [Math.round(r0+s*(r1-r0)), Math.round(g0+s*(g1-g0)), Math.round(b0+s*(b1-b0))];
}

const EDU_COLORS = {
  "No formal educational credential": "#6ee7b7",
  "High school diploma or equivalent": "#34d399",
  "Postsecondary nondegree award": "#fbbf24",
  "Some college, no degree": "#fb923c",
  "See How to Become One": "#94a3b8",
  "Associate's degree": "#60a5fa",
  "Bachelor's degree": "#a78bfa",
  "Master's degree": "#c084fc",
  "Doctoral or professional degree": "#f472b6",
};

function fmt(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
  return n.toLocaleString();
}
function fmtPay(n) { return n ? "$" + n.toLocaleString() : "—"; }

Chart.defaults.color = "#888894";
Chart.defaults.borderColor = "rgba(255,255,255,0.06)";
Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
Chart.defaults.font.size = 11;

// ── Build all charts ───────────────────────────────────────────────────

(function() {
  const DATA = SOURCE_DATA;
  buildTreemap(DATA);
  buildExposureHistogram(DATA);
  buildTierDoughnut(DATA);
  buildPayExposure(DATA);
  buildWagePremium();
  buildIndustryProductivityGap();
  buildProductivityStudies();
  buildCoverageGap();
  buildEduAiSkill();
  buildEduMatrix();
  buildAdoptionRate();
  setupNav();
})();

// ── TREEMAP (squarified, canvas-rendered) ──────────────────────────────

function buildTreemap(DATA) {
  const canvas = document.getElementById("treemapCanvas");
  const ctx = canvas.getContext("2d");
  const wrapper = canvas.parentElement;
  let dpr = window.devicePixelRatio || 1;
  let rects = [];
  let hovered = null;

  // Squarified treemap layout algorithm
  function squarify(items, x, y, w, h) {
    if (!items.length) return [];
    if (items.length === 1) return [{ ...items[0], rx: x, ry: y, rw: w, rh: h }];
    const total = items.reduce((s, d) => s + d.value, 0);
    if (total === 0) return [];
    const results = [];
    let rem = [...items], cx = x, cy = y, cw = w, ch = h;
    while (rem.length > 0) {
      const remTotal = rem.reduce((s, d) => s + d.value, 0);
      const vert = cw >= ch;
      const side = vert ? ch : cw;
      let row = [rem[0]], rowSum = rem[0].value;
      for (let i = 1; i < rem.length; i++) {
        const cand = [...row, rem[i]], candSum = rowSum + rem[i].value;
        if (worstAR(cand, candSum, side, remTotal, vert ? cw : ch) < worstAR(row, rowSum, side, remTotal, vert ? cw : ch)) {
          row = cand; rowSum = candSum;
        } else break;
      }
      const frac = rowSum / remTotal;
      const thick = vert ? cw * frac : ch * frac;
      let off = 0;
      for (const item of row) {
        const itemFrac = item.value / rowSum;
        const itemLen = side * itemFrac;
        if (vert) results.push({ ...item, rx: cx, ry: cy + off, rw: thick, rh: itemLen });
        else results.push({ ...item, rx: cx + off, ry: cy, rw: itemLen, rh: thick });
        off += itemLen;
      }
      if (vert) { cx += thick; cw -= thick; } else { cy += thick; ch -= thick; }
      rem = rem.slice(row.length);
    }
    return results;
  }
  function worstAR(row, rowSum, side, total, extent) {
    const re = extent * (rowSum / total);
    if (re === 0) return Infinity;
    let worst = 0;
    for (const item of row) {
      const il = side * (item.value / rowSum);
      if (il === 0) continue;
      worst = Math.max(worst, Math.max(re / il, il / re));
    }
    return worst;
  }

  let catRectsList = []; // store category-level rects for labels

  function layout() {
    const w = wrapper.clientWidth;
    const h = wrapper.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    const CATGAP = 3, INNERGAP = 1;

    const bycat = {};
    DATA.forEach(d => {
      if (!bycat[d.category]) bycat[d.category] = [];
      bycat[d.category].push(d);
    });
    const cats = Object.keys(bycat).map(c => ({
      cat: c,
      name: CAT_NAMES[c] || c,
      items: bycat[c].sort((a, b) => (b.jobs || 0) - (a.jobs || 0)),
      value: bycat[c].reduce((s, d) => s + (d.jobs || 1), 0),
    })).sort((a, b) => b.value - a.value);

    catRectsList = squarify(cats, CATGAP, CATGAP, w - CATGAP * 2, h - CATGAP * 2);
    rects = [];
    for (const cr of catRectsList) {
      const pad = CATGAP;
      const items = cr.items.map(d => ({ ...d, value: d.jobs || 1 }));
      const inner = squarify(items, cr.rx + pad, cr.ry + pad, cr.rw - pad * 2, cr.rh - pad * 2);
      for (const ir of inner) ir._cat = cr.cat;
      rects.push(...inner);
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  function draw() {
    const cw = canvas.width / dpr, ch = canvas.height / dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Dark background
    ctx.fillStyle = "#08080c";
    ctx.fillRect(0, 0, cw, ch);

    // Draw category group backgrounds (subtle)
    for (const cr of catRectsList) {
      roundRect(ctx, cr.rx, cr.ry, cr.rw, cr.rh, 4);
      ctx.fillStyle = "rgba(255,255,255,0.02)";
      ctx.fill();
    }

    // Draw occupation tiles
    const G = 0.6;
    for (const r of rects) {
      const isH = r === hovered;
      const rx = r.rx + G, ry = r.ry + G, rw = r.rw - G * 2, rh = r.rh - G * 2;
      if (rw <= 0 || rh <= 0) continue;

      const exp = r.exposure != null ? r.exposure : 5;
      const [cr, cg, cb] = exposureRGB(exp);
      const baseAlpha = isH ? 0.82 : 0.48;

      // Fill with rounded corners
      roundRect(ctx, rx, ry, rw, rh, 3);
      ctx.fillStyle = `rgba(${cr},${cg},${cb},${baseAlpha})`;
      ctx.fill();

      // Subtle inner glow on hover
      if (isH) {
        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.lineWidth = 1.5;
        roundRect(ctx, rx, ry, rw, rh, 3);
        ctx.stroke();
      }

      // Text labels — show on more tiles by lowering thresholds
      if (rw > 36 && rh > 14) {
        ctx.save();
        ctx.beginPath(); ctx.rect(rx + 3, ry + 2, rw - 6, rh - 4); ctx.clip();

        const fs = Math.min(13, Math.max(7.5, Math.min(rw / 8, rh / 2.8)));
        ctx.font = `600 ${fs}px -apple-system, system-ui, sans-serif`;
        ctx.fillStyle = isH ? "#fff" : "rgba(255,255,255,0.88)";
        ctx.textBaseline = "top";

        // Shadow for readability
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 2;
        ctx.fillText(r.title, rx + 5, ry + 4);
        ctx.shadowBlur = 0;

        // Sub-label: exposure + jobs
        if (rh > 26 && rw > 44) {
          const info = (r.exposure != null ? r.exposure + "/10" : "") +
                       (r.jobs ? " · " + fmt(r.jobs) + " jobs" : "");
          ctx.font = `400 ${Math.max(7, fs - 2.5)}px -apple-system, system-ui, sans-serif`;
          ctx.fillStyle = isH ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.45)";
          ctx.fillText(info, rx + 5, ry + 5 + fs + 1);
        }
        // Third line: pay (for larger tiles)
        if (rh > 44 && rw > 60 && r.pay) {
          ctx.font = `400 ${Math.max(7, fs - 3)}px -apple-system, system-ui, sans-serif`;
          ctx.fillStyle = "rgba(255,255,255,0.35)";
          ctx.fillText(fmtPay(r.pay) + " median", rx + 5, ry + 6 + fs * 2);
        }
        ctx.restore();
      }
    }

    // Draw category labels (overlaid in corners of each group)
    ctx.save();
    for (const cr of catRectsList) {
      if (cr.rw < 60 || cr.rh < 30) continue;
      const name = cr.name || CAT_NAMES[cr.cat] || cr.cat;
      const fs = Math.min(11, Math.max(8, cr.rw / 18));
      ctx.font = `700 ${fs}px -apple-system, system-ui, sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.textBaseline = "bottom";
      ctx.textAlign = "right";
      ctx.fillText(name.toUpperCase(), cr.rx + cr.rw - 5, cr.ry + cr.rh - 4);
    }
    ctx.restore();
  }

  function hitTest(mx, my) {
    const rect = canvas.getBoundingClientRect();
    const cx = mx - rect.left, cy = my - rect.top;
    for (let i = rects.length - 1; i >= 0; i--) {
      const r = rects[i];
      if (cx >= r.rx && cx < r.rx + r.rw && cy >= r.ry && cy < r.ry + r.rh) return r;
    }
    return null;
  }

  function showTooltip(d, mx, my) {
    const tt = document.getElementById("treemapTooltip");
    tt.querySelector(".tt-title").textContent = d.title;
    if (d.exposure != null) {
      const color = exposureColor(d.exposure, 1);
      tt.querySelector(".tt-exposure").innerHTML =
        `<span style="color:${color};font-weight:600;">AI Exposure: ${d.exposure}/10</span>` +
        `<div style="margin-top:2px;height:4px;background:rgba(255,255,255,0.08);border-radius:2px;"><div style="height:100%;width:${d.exposure*10}%;background:${color};border-radius:2px;"></div></div>`;
    } else { tt.querySelector(".tt-exposure").innerHTML = ""; }
    tt.querySelector(".tt-stats").innerHTML = `
      <span class="label">Median pay</span><span class="value">${fmtPay(d.pay)}</span>
      <span class="label">Jobs (2024)</span><span class="value">${fmt(d.jobs)}</span>
      <span class="label">Growth outlook</span><span class="value">${d.outlook != null ? d.outlook + '%' : '—'} ${d.outlook_desc ? '(' + d.outlook_desc + ')' : ''}</span>
      <span class="label">Education</span><span class="value">${d.education || '—'}</span>
      <span class="label">Sector</span><span class="value">${CAT_NAMES[d.category] || d.category}</span>`;
    tt.querySelector(".tt-rationale").textContent = d.exposure_rationale || "";
    const ttW = Math.min(340, window.innerWidth - 20);
    let tx = mx + 14, ty = my - 14;
    if (tx + ttW > window.innerWidth - 10) tx = Math.max(10, mx - ttW - 10);
    if (ty < 10) ty = my + 14;
    if (ty + 200 > window.innerHeight) ty = Math.max(10, my - 200);
    tt.style.left = tx + "px"; tt.style.top = ty + "px";
    tt.classList.add("visible");
  }
  function hideTooltip() { document.getElementById("treemapTooltip").classList.remove("visible"); }

  canvas.addEventListener("mousemove", e => {
    const hit = hitTest(e.clientX, e.clientY);
    if (hit !== hovered) { hovered = hit; draw(); }
    if (hovered) { showTooltip(hovered, e.clientX, e.clientY); canvas.style.cursor = "pointer"; }
    else { hideTooltip(); canvas.style.cursor = "default"; }
  });
  canvas.addEventListener("mouseleave", () => { hovered = null; hideTooltip(); draw(); });

  // Touch support for mobile
  canvas.addEventListener("touchstart", e => {
    const touch = e.touches[0];
    const hit = hitTest(touch.clientX, touch.clientY);
    if (hit !== hovered) { hovered = hit; draw(); }
    if (hovered) { e.preventDefault(); showTooltip(hovered, touch.clientX, touch.clientY); }
    else { hideTooltip(); }
  }, { passive: false });
  canvas.addEventListener("touchmove", e => {
    const touch = e.touches[0];
    const hit = hitTest(touch.clientX, touch.clientY);
    if (hit !== hovered) { hovered = hit; draw(); }
    if (hovered) { e.preventDefault(); showTooltip(hovered, touch.clientX, touch.clientY); }
    else { hideTooltip(); }
  }, { passive: false });
  canvas.addEventListener("touchend", () => {
    if (hovered && hovered.url) window.open(hovered.url, "_blank");
    setTimeout(() => { hovered = null; hideTooltip(); draw(); }, 1500);
  });

  canvas.addEventListener("click", e => {
    const hit = hitTest(e.clientX, e.clientY);
    if (hit && hit.url) window.open(hit.url, "_blank");
  });

  function resize() { dpr = window.devicePixelRatio || 1; layout(); draw(); }
  window.addEventListener("resize", resize);
  resize();

  // Draw gradient legend
  const gc = document.getElementById("treemapGradient");
  if (gc) {
    const gctx = gc.getContext("2d");
    for (let x = 0; x < 120; x++) { gctx.fillStyle = exposureColor((x / 119) * 10, 1); gctx.fillRect(x, 0, 1, 10); }
  }
}

// ── 1. Exposure Histogram ──────────────────────────────────────────────

function buildExposureHistogram(DATA) {
  const buckets = new Array(11).fill(0);
  DATA.forEach(d => { if (d.exposure != null && d.jobs) buckets[d.exposure] += d.jobs; });

  new Chart(document.getElementById("exposureHistogram"), {
    type: "bar",
    data: {
      labels: Array.from({length: 11}, (_, i) => i),
      datasets: [{
        data: buckets,
        backgroundColor: Array.from({length: 11}, (_, i) => exposureColor(i, 0.65)),
        borderColor: Array.from({length: 11}, (_, i) => exposureColor(i, 1)),
        borderWidth: 1, borderRadius: 4,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => fmt(ctx.raw) + " jobs" } } },
      scales: {
        x: { title: { display: true, text: "AI Exposure Score" } },
        y: { title: { display: true, text: "Number of Jobs" }, ticks: { callback: v => fmt(v) } }
      }
    }
  });
}

// ── 2. Tier Doughnut ───────────────────────────────────────────────────

function buildTierDoughnut(DATA) {
  const tiers = [
    { name: "Minimal (0–1)", min: 0, max: 1 },
    { name: "Low (2–3)", min: 2, max: 3 },
    { name: "Moderate (4–5)", min: 4, max: 5 },
    { name: "High (6–7)", min: 6, max: 7 },
    { name: "Very High (8–10)", min: 8, max: 10 },
  ];
  const total = DATA.reduce((s, d) => s + (d.jobs || 0), 0);
  const tierJobs = tiers.map(t => DATA.filter(d => d.exposure != null && d.exposure >= t.min && d.exposure <= t.max).reduce((s, d) => s + (d.jobs || 0), 0));

  new Chart(document.getElementById("tierDoughnut"), {
    type: "doughnut",
    data: {
      labels: tiers.map(t => t.name),
      datasets: [{ data: tierJobs, backgroundColor: [exposureColor(0.5,0.8), exposureColor(2.5,0.8), exposureColor(4.5,0.8), exposureColor(6.5,0.8), exposureColor(9,0.8)], borderColor: "#1a1a28", borderWidth: 2 }]
    },
    options: {
      responsive: true, cutout: "55%",
      plugins: {
        legend: { position: "bottom", labels: { padding: 10, usePointStyle: true, pointStyle: "rectRounded", font: { size: 11 } } },
        tooltip: { callbacks: { label: ctx => ` ${fmt(ctx.raw)} jobs (${(ctx.raw/total*100).toFixed(1)}%)` } }
      }
    }
  });
}

// ── 3. Pay vs Exposure ─────────────────────────────────────────────────

function buildPayExposure(DATA) {
  const bands = [
    {label:"<$35K",min:0,max:35000}, {label:"$35–50K",min:35000,max:50000},
    {label:"$50–75K",min:50000,max:75000}, {label:"$75–100K",min:75000,max:100000},
    {label:"$100–150K",min:100000,max:150000}, {label:"$150K+",min:150000,max:Infinity},
  ];
  const avgs = bands.map(b => {
    let ws=0,wc=0;
    DATA.forEach(d => { if (d.exposure!=null && d.jobs && d.pay && d.pay>=b.min && d.pay<b.max) { ws+=d.exposure*d.jobs; wc+=d.jobs; } });
    return wc>0 ? ws/wc : 0;
  });
  new Chart(document.getElementById("payExposure"), {
    type: "bar",
    data: { labels: bands.map(b=>b.label), datasets: [{ data: avgs, backgroundColor: avgs.map(v=>exposureColor(v,0.65)), borderColor: avgs.map(v=>exposureColor(v,1)), borderWidth: 1, borderRadius: 4 }] },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { title: { display: true, text: "Median Pay Band" } }, y: { min: 0, max: 8, title: { display: true, text: "Avg Exposure Score" } } } }
  });
}

// ── 4. Coverage Gap ────────────────────────────────────────────────────

function buildCoverageGap() {
  new Chart(document.getElementById("coverageGap"), {
    type: "bar",
    data: {
      labels: ["Computer\n& Math", "Office\n& Admin", "Business\n& Finance", "Sales", "Legal", "Arts\n& Media"],
      datasets: [
        { label: "Theoretical AI Capability (β metric)", data: [94, 90, 88, 62, 89, 83.7], backgroundColor: "rgba(167,139,250,0.35)", borderColor: "#a78bfa", borderWidth: 1, borderRadius: 4 },
        { label: "Actual Observed Usage (Claude data, Jan 2026)", data: [35.8, 34.3, 28.4, 26.9, 20.4, 19.2], backgroundColor: "rgba(96,165,250,0.7)", borderColor: "#60a5fa", borderWidth: 1, borderRadius: 4 },
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "top", labels: { usePointStyle: true, padding: 12 } }, tooltip: { callbacks: { label: ctx => ctx.raw != null ? ` ${ctx.dataset.label}: ${ctx.raw}%` : "" } } },
      scales: { y: { min: 0, max: 100, title: { display: true, text: "% of Tasks" }, ticks: { callback: v => v+"%" } } }
    }
  });
}

// ── 5. Education + AI Skill ───────────────────────────────────────────

function buildEduAiSkill() {
  const cats = ["No Credential\n(exp: 3.1)", "High School\n(exp: 4.9)", "Some College\n(exp: 5.5)", "Bachelor's\n(exp: 6.7)", "Master's+\n(exp: 5.7)"];
  const aiSkilled =   [ 10,  15,  24,  38,  48];
  const notAiSkilled = [-2,  -6, -12, -20, -28];

  new Chart(document.getElementById("eduAiSkill"), {
    type: "bar",
    data: { labels: cats, datasets: [
      { label: "AI-Skilled", data: aiSkilled, backgroundColor: "rgba(52,211,153,0.65)", borderColor: "#34d399", borderWidth: 1, borderRadius: 4 },
      { label: "Not AI-Skilled", data: notAiSkilled, backgroundColor: "rgba(248,113,113,0.65)", borderColor: "#f87171", borderWidth: 1, borderRadius: 4 },
    ] },
    options: { responsive: true, plugins: { legend: { position: "top", labels: { usePointStyle: true } } }, scales: { y: { title: { display: true, text: "Projected Employability Change by 2034" }, ticks: { callback: v => (v>0?"+":"")+v+"%" } } } }
  });
}

// ── 6. Education-AI Matrix ────────────────────────────────────────────

function buildEduMatrix() {
  const cells = [
    { title: "Degree + AI-Skilled", tag: "Best Positioned", tagColor: "#34d399", tagBg: "rgba(52,211,153,0.12)",
      body: "Domain expertise amplified by AI mastery. PwC data: 56% wage premium, 3x productivity growth in exposed industries. These workers direct AI workflows rather than compete with them.",
      outlook: "+38–48% employability", outlookColor: "#34d399",
      examples: "Data scientist using AI for rapid modeling · Lawyer using AI for discovery · Financial analyst automating reports" },
    { title: "Degree + Not AI-Skilled", tag: "High Risk", tagColor: "#fb923c", tagBg: "rgba(251,146,60,0.12)",
      body: "Highest exposure, no offset. Bachelor's holders face 6.74 avg exposure — the highest of any education level. Without AI skills, their core digital work is exactly what AI automates.",
      outlook: "-20–28% employability", outlookColor: "#f87171",
      examples: "Junior accountant doing routine audits · Paralegal doing document review · Entry-level analyst running standard reports" },
    { title: "No Degree + AI-Skilled", tag: "Rising Opportunity", tagColor: "#60a5fa", tagBg: "rgba(96,165,250,0.12)",
      body: "AI as the great equalizer. PwC: degree requirements dropping 7–9pp for AI roles. Brynjolfsson: 36% productivity gain for bottom quintile vs 15% avg. AI tools open doors previously gated by credentials.",
      outlook: "+10–24% employability", outlookColor: "#34d399",
      examples: "Self-taught prompt engineer · Customer service rep moving into ops analysis · Tradesperson using AI for business management" },
    { title: "No Degree + Not AI-Skilled", tag: "Moderate Risk", tagColor: "#fbbf24", tagBg: "rgba(251,191,36,0.12)",
      body: "Somewhat protected short-term: avg exposure only 3.09 for no-credential roles (physical work). BLS projects 4–5% growth for low-exposure tiers. But upward mobility narrows as adjacent digital roles automate.",
      outlook: "-2–6% employability", outlookColor: "#fb923c",
      examples: "Construction laborer (exposure: 1, jobs growing 7%) · Warehouse worker · Food service worker with fewer paths to office roles" },
  ];
  document.getElementById("eduMatrix").innerHTML = cells.map(c =>
    `<div class="matrix-cell"><h4>${c.title}</h4><span class="mc-tag" style="color:${c.tagColor};background:${c.tagBg}">${c.tag}</span><p>${c.body}</p><div class="mc-outlook" style="color:${c.outlookColor}">${c.outlook}</div><div class="mc-examples">${c.examples}</div></div>`
  ).join("");
}

// ── 7. AI Adoption Rate (Census BTOS) ──────────────────────────────────

function buildAdoptionRate() {
  const labels = ["All Firms\n(production)", "All Firms\n(any function)", "Information", "Publishing", "Data\nProcessing", "Prof. /\nTech Services"];
  const values = [10, 17.3, 27, 36, 35, 15];

  new Chart(document.getElementById("adoptionRate"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "% of Firms Using AI",
        data: values,
        backgroundColor: values.map(v => `rgba(167,139,250,${0.3 + v / 60})`),
        borderColor: "#a78bfa",
        borderWidth: 1,
        borderRadius: 4,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.raw}% of firms` } } },
      scales: {
        x: { title: { display: true, text: "Sector (Census BTOS, Nov 2025)" } },
        y: { min: 0, max: 45, title: { display: true, text: "% of Firms Using AI" }, ticks: { callback: v => v + "%" } }
      }
    }
  });
}

// ── 8. Productivity Studies ──────────────────────────────────────────

function buildProductivityStudies() {
  const studies = [
    { label: "Peng et al.\n(Copilot, devs)", value: 55.8, color: "rgba(96,165,250,0.65)", border: "#60a5fa" },
    { label: "Noy & Zhang\n(ChatGPT, n=453)", value: 40, color: "rgba(52,211,153,0.65)", border: "#34d399" },
    { label: "Brynjolfsson\nBottom 20% (n=5172)", value: 36, color: "rgba(167,139,250,0.65)", border: "#a78bfa" },
    { label: "St. Louis Fed\nDuring AI use", value: 33, color: "rgba(251,191,36,0.65)", border: "#fbbf24" },
    { label: "Cui et al.\nWeekly tasks (n=5000)", value: 26, color: "rgba(249,115,22,0.65)", border: "#f97316" },
    { label: "Brynjolfsson\nAvg gain (n=5172)", value: 15, color: "rgba(148,163,184,0.5)", border: "#94a3b8" },
  ];

  new Chart(document.getElementById("productivityStudies"), {
    type: "bar",
    data: {
      labels: studies.map(s => s.label),
      datasets: [{
        data: studies.map(s => s.value),
        backgroundColor: studies.map(s => s.color),
        borderColor: studies.map(s => s.border),
        borderWidth: 1,
        borderRadius: 4,
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` +${ctx.raw}% productivity gain` } }
      },
      scales: {
        x: { min: 0, max: 65, title: { display: true, text: "% Productivity / Speed Gain" }, ticks: { callback: v => "+" + v + "%" } },
        y: { ticks: { font: { size: 11 } } }
      }
    }
  });
}

// ── 9. Wage Premium Trajectory ──────────────────────────────────────

function buildWagePremium() {
  const canvas = document.getElementById("wagePremium");
  canvas.style.width = "100%";
  canvas.style.height = "100%";

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: ["2024 Report", "2025 Report"],
      datasets: [{
        label: "AI Wage Premium",
        data: [25, 56],
        backgroundColor: ["rgba(148,163,184,0.5)", "rgba(52,211,153,0.7)"],
        borderColor: ["#94a3b8", "#34d399"],
        borderWidth: 2,
        borderRadius: 6,
        barPercentage: 0.5,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.raw}% wage premium for AI-skilled roles` } }
      },
      scales: {
        x: { title: { display: true, text: "PwC Global AI Jobs Barometer (~1B postings)" } },
        y: { min: 0, max: 70, title: { display: true, text: "Wage Premium (%)" }, ticks: { callback: v => "+" + v + "%" } }
      }
    }
  });
}

// ── 10. Industry Productivity Gap (NEW) ─────────────────────────────

function buildIndustryProductivityGap() {
  new Chart(document.getElementById("industryProductivityGap"), {
    type: "bar",
    data: {
      labels: ["AI-Exposed\nIndustries", "Unexposed\nIndustries"],
      datasets: [{
        label: "Productivity Growth 2018–2024",
        data: [PWC.productivityGrowthExposed, PWC.productivityGrowthUnexposed],
        backgroundColor: ["rgba(52,211,153,0.65)", "rgba(148,163,184,0.4)"],
        borderColor: ["#34d399", "#94a3b8"],
        borderWidth: 2,
        borderRadius: 6,
        barPercentage: 0.5,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.raw}% productivity growth (PwC)` } }
      },
      scales: {
        x: { title: { display: true, text: "PwC, 2018–2024" } },
        y: { min: 0, max: 35, title: { display: true, text: "Productivity Growth (%)" }, ticks: { callback: v => v + "%" } }
      }
    }
  });
}

// ── Navigation ─────────────────────────────────────────────────────────

function setupNav() {
  const links = document.querySelectorAll(".nav-link");
  const sections = [...links].map(l => document.querySelector(l.getAttribute("href")));
  function update() {
    let current = 0;
    sections.forEach((s,i) => { if (s && s.offsetTop <= window.scrollY + 100) current = i; });
    links.forEach((l,i) => l.classList.toggle("active", i === current));
  }
  window.addEventListener("scroll", update, { passive: true });
  links.forEach(l => l.addEventListener("click", e => { e.preventDefault(); document.querySelector(l.getAttribute("href")).scrollIntoView({ behavior: "smooth" }); }));
}
