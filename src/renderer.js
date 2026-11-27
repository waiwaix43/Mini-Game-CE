// EcoLink Industrial Park — Daylight Theme 05 Architectural 2.5D Canvas Renderer

import {
  GRID_COLS,
  GRID_ROWS,
  TILE_SIZE,
  RIVER_COLS,
  RESOURCES,
  BUILDINGS,
} from './data.js';

const GRADE_COLORS = {
  A: { bg: '#15803d', fg: '#ffffff' },
  B: { bg: '#0284c7', fg: '#ffffff' },
  C: { bg: '#d97706', fg: '#ffffff' },
};

const RESOURCE_SHORT = {
  raw_water: 'ดิบ',
  hot_water: 'ร้อน',
  wastewater: 'เสีย',
  bagasse: 'อ้อย',
  organic_waste: 'กาก',
};

export class GameRenderer {
  constructor(canvas, engine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.engine = engine;

    this.cam = {
      x: (GRID_COLS * TILE_SIZE) / 2,
      y: (GRID_ROWS * TILE_SIZE) / 2,
      zoom: 1,
    };
    this.animTime = 0;

    this.hoverTile = null;
    this.activeTool = 'inspect';
    this.selectedBuildingId = null;
    this.linkSourceId = null;
    this.pointerWorld = null;
  }

  fitToViewport() {
    const rect = this.canvas.getBoundingClientRect();
    const worldW = GRID_COLS * TILE_SIZE;
    const worldH = GRID_ROWS * TILE_SIZE;
    const padX = 52;
    const padY = 195;
    const availW = Math.max(300, rect.width - padX);
    const availH = Math.max(220, rect.height - padY);
    this.cam.zoom = Math.max(0.52, Math.min(1.22, Math.min(availW / worldW, availH / worldH)));
    this.cam.x = worldW / 2;
    this.cam.y = worldH / 2 + 12;
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  screenToWorld(sx, sy) {
    const rect = this.canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    return {
      x: (sx - cx) / this.cam.zoom + this.cam.x,
      y: (sy - cy) / this.cam.zoom + this.cam.y,
    };
  }

  worldToTile(wx, wy) {
    return {
      gx: Math.floor(wx / TILE_SIZE),
      gy: Math.floor(wy / TILE_SIZE),
    };
  }

  render(dt) {
    this.animTime += dt;
    const ctx = this.ctx;
    const rect = this.canvas.getBoundingClientRect();

    // Soft daylight mint-slate backdrop
    const bgGrad = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    bgGrad.addColorStop(0, '#cde8e2');
    bgGrad.addColorStop(1, '#dceee9');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.save();
    ctx.translate(rect.width / 2, rect.height / 2);
    ctx.scale(this.cam.zoom, this.cam.zoom);
    ctx.translate(-this.cam.x, -this.cam.y);

    this._drawTerrain(ctx);
    this._drawLinks(ctx);
    this._drawPackets(ctx);
    this._drawBuildings(ctx);
    this._drawInteractionOverlays(ctx);
    this._drawFloatingTexts(ctx);

    ctx.restore();
  }

  _drawTerrain(ctx) {
    const w = GRID_COLS * TILE_SIZE;
    const h = GRID_ROWS * TILE_SIZE;

    // Subtle elevation drop shadow beneath the park board
    ctx.save();
    ctx.fillStyle = 'rgba(6, 78, 75, 0.14)';
    this._roundRect(ctx, -6, 6, w + 12, h + 14, 20);
    ctx.fill();
    ctx.restore();

    ctx.save();
    this._roundRect(ctx, 0, 0, w, h, 18);
    ctx.clip();

    // Daylight eco-industrial park ground
    const landGrad = ctx.createLinearGradient(0, 0, w, h);
    landGrad.addColorStop(0, '#eef8f5');
    landGrad.addColorStop(1, '#e1f2ed');
    ctx.fillStyle = landGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle alternating plots
    for (let gx = RIVER_COLS; gx < GRID_COLS; gx++) {
      for (let gy = 0; gy < GRID_ROWS; gy++) {
        if ((gx + gy) % 2 === 0) {
          ctx.fillStyle = 'rgba(13, 148, 136, 0.035)';
          ctx.fillRect(gx * TILE_SIZE, gy * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    // Crisp architectural drafting grid
    ctx.strokeStyle = 'rgba(6, 95, 91, 0.10)';
    ctx.lineWidth = 1;
    for (let gx = RIVER_COLS; gx <= GRID_COLS; gx++) {
      ctx.beginPath();
      ctx.moveTo(gx * TILE_SIZE, 0);
      ctx.lineTo(gx * TILE_SIZE, h);
      ctx.stroke();
    }
    for (let gy = 0; gy <= GRID_ROWS; gy++) {
      ctx.beginPath();
      ctx.moveTo(RIVER_COLS * TILE_SIZE, gy * TILE_SIZE);
      ctx.lineTo(w, gy * TILE_SIZE);
      ctx.stroke();
    }

    // Card 05 Teal-Aqua River (left columns 0..RIVER_COLS)
    const riverW = RIVER_COLS * TILE_SIZE;
    const riverGrad = ctx.createLinearGradient(0, 0, riverW, 0);
    riverGrad.addColorStop(0, '#065f5b');
    riverGrad.addColorStop(0.65, '#0d9488');
    riverGrad.addColorStop(1, '#2dd4bf');
    ctx.fillStyle = riverGrad;
    ctx.fillRect(0, 0, riverW, h);

    // Gentle sunlit river current lines
    ctx.strokeStyle = 'rgba(240, 253, 250, 0.34)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let i = 0; i < 10; i++) {
      const rx = 20 + (i % 3) * 38;
      const ry = ((i * 88 + this.animTime * 20) % (h + 60)) - 30;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.quadraticCurveTo(rx + 6, ry + 14, rx, ry + 28);
      ctx.stroke();
    }

    // Concrete quay embankment + green strip
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(riverW - 8, 0, 12, h);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(riverW - 8, 0, 4, h);
    ctx.fillStyle = '#a7f3d0';
    ctx.fillRect(riverW + 4, 0, 5, h);

    // Subtle decorative eco-trees along right edge
    const treeSpots = [
      { x: w - 16, y: 24 },
      { x: w - 16, y: 66 },
      { x: w - 16, y: h - 66 },
      { x: w - 16, y: h - 24 },
    ];
    for (const t of treeSpots) {
      ctx.fillStyle = 'rgba(6, 95, 91, 0.14)';
      ctx.beginPath();
      ctx.arc(t.x + 2, t.y + 3, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#65a30d';
      ctx.beginPath();
      ctx.arc(t.x, t.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#84cc16';
      ctx.beginPath();
      ctx.arc(t.x - 3, t.y - 3, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Clean teal-slate border frame
    ctx.strokeStyle = '#99cfc6';
    ctx.lineWidth = 2;
    this._roundRect(ctx, 0, 0, w, h, 18);
    ctx.stroke();
  }

  _drawLinks(ctx) {
    for (const link of this.engine.links) {
      const res = RESOURCES[link.resource];
      const pts = link.path.map((p) => ({ x: p.x * TILE_SIZE, y: p.y * TILE_SIZE }));

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (link.kind === 'pipe') {
        // Metallic silver industrial pipe shadow & shell
        ctx.strokeStyle = 'rgba(6, 78, 75, 0.2)';
        ctx.lineWidth = 15;
        ctx.save();
        ctx.translate(0, 3);
        this._tracePolyline(ctx, pts);
        ctx.stroke();
        ctx.restore();

        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 13;
        this._tracePolyline(ctx, pts);
        ctx.stroke();

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 9;
        this._tracePolyline(ctx, pts);
        ctx.stroke();

        // Colored liquid flow inside glass sight-strip
        ctx.strokeStyle = res.color;
        ctx.lineWidth = 4.5;
        ctx.setLineDash([12, 10]);
        ctx.lineDashOffset = -this.animTime * 34;
        this._tracePolyline(ctx, pts);
        ctx.stroke();
      } else {
        // Paved industrial transport road / conveyor
        ctx.strokeStyle = 'rgba(15, 41, 40, 0.16)';
        ctx.lineWidth = 18;
        ctx.save();
        ctx.translate(0, 3);
        this._tracePolyline(ctx, pts);
        ctx.stroke();
        ctx.restore();

        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 15;
        this._tracePolyline(ctx, pts);
        ctx.stroke();

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 11;
        this._tracePolyline(ctx, pts);
        ctx.stroke();

        ctx.strokeStyle = res.color;
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 10]);
        ctx.lineDashOffset = -this.animTime * 26;
        this._tracePolyline(ctx, pts);
        ctx.stroke();
      }

      ctx.setLineDash([]);

      // Clean architectural midpoint label pill (no emojis)
      const mid = this._pointOnPolyline(pts, 0.5);
      ctx.fillStyle = '#ffffff';
      this._roundRect(ctx, mid.x - 19, mid.y - 10, 38, 20, 10);
      ctx.fill();
      ctx.strokeStyle = res.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#0f2928';
      ctx.font = '700 10px "IBM Plex Sans Thai", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(RESOURCE_SHORT[link.resource] || '', mid.x, mid.y + 0.5);

      ctx.restore();
    }
  }

  _drawPackets(ctx) {
    for (const p of this.engine.packets) {
      const link = this.engine.links.find((l) => l.id === p.linkId);
      if (!link) continue;
      const pts = link.path.map((pt) => ({ x: pt.x * TILE_SIZE, y: pt.y * TILE_SIZE }));
      const pos = this._pointOnPolyline(pts, p.t);
      const res = RESOURCES[p.resource];

      ctx.save();
      ctx.fillStyle = res.color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      if (link.kind === 'pipe') {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        this._roundRect(ctx, pos.x - 6.5, pos.y - 6.5, 13, 13, 3);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  _drawBuildings(ctx) {
    for (const b of this.engine.buildings) {
      const def = BUILDINGS[b.typeId];
      const x = b.gx * TILE_SIZE + 6;
      const y = b.gy * TILE_SIZE + 6;
      const size = b.size * TILE_SIZE - 12;
      const isSelected = b.id === this.selectedBuildingId;
      const isLinkSource = b.id === this.linkSourceId;

      let isValidTarget = false;
      if (
        this.linkSourceId &&
        this.linkSourceId !== b.id &&
        (this.activeTool === 'pipe' || this.activeTool === 'road')
      ) {
        const check = this.engine.findConnectableResource(this.linkSourceId, b.id, this.activeTool);
        isValidTarget = check.ok;
      }

      ctx.save();

      // Soft daylight architectural shadow
      ctx.fillStyle = 'rgba(6, 78, 75, 0.20)';
      this._roundRect(ctx, x + 5, y + 8, size, size, 14);
      ctx.fill();

      // Concrete foundation pad
      ctx.fillStyle = '#e2ece9';
      this._roundRect(ctx, x, y, size, size, 14);
      ctx.fill();

      // 2.5D architectural illustration per factory type
      this._drawFactoryArchitecture(ctx, b.typeId, x, y, size, b.producing);

      // Selection / Target Glow Border
      if (isSelected || isLinkSource || isValidTarget) {
        ctx.strokeStyle = isLinkSource
          ? '#d97706'
          : isValidTarget
          ? '#16a34a'
          : '#065f5b';
        ctx.lineWidth = isValidTarget ? 3.5 : 3;
        this._roundRect(ctx, x - 2, y - 2, size + 4, size + 4, 15);
        ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(6, 95, 91, 0.28)';
        ctx.lineWidth = 1.5;
        this._roundRect(ctx, x, y, size, size, 14);
        ctx.stroke();
      }

      // Crisp bottom title strip
      ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
      this._roundRect(ctx, x + 6, y + size - 36, size - 12, 30, 8);
      ctx.fill();

      ctx.fillStyle = '#0f2928';
      ctx.font = '700 11.5px "IBM Plex Sans Thai", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(def.shortName, x + size / 2, y + size - 25);

      // Production Progress Bar
      if (b.typeId !== 'water_intake') {
        const barX = x + 13;
        const barY = y + size - 14;
        const barW = size - 26;
        const barH = 5;

        ctx.fillStyle = '#d5ece6';
        this._roundRect(ctx, barX, barY, barW, barH, 3);
        ctx.fill();

        const ratio = b.producing ? Math.min(1, b.progress / b.cycleDuration) : 0;
        if (ratio > 0) {
          const g = b.activeRecipe ? b.activeRecipe.grade : 'B';
          ctx.fillStyle = GRADE_COLORS[g].bg;
          this._roundRect(ctx, barX, barY, Math.max(5, barW * ratio), barH, 3);
          ctx.fill();
        }

        // Grade Pill (top-right)
        if (b.producing && b.activeRecipe) {
          const g = b.activeRecipe.grade;
          ctx.fillStyle = GRADE_COLORS[g].bg;
          this._roundRect(ctx, x + size - 26, y + 7, 20, 20, 6);
          ctx.fill();
          ctx.fillStyle = GRADE_COLORS[g].fg;
          ctx.font = '700 11px "JetBrains Mono", monospace';
          ctx.fillText(g, x + size - 16, y + 17.5);
        } else {
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(x + size - 14, y + 14, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Input buffer mini pills (top-left, crisp colored dot + count)
        const bufEntries = Object.entries(b.inBuf).filter(([, v]) => v > 0);
        let bx = x + 8;
        for (const [resId, qty] of bufEntries.slice(0, 3)) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
          this._roundRect(ctx, bx, y + 7, 26, 17, 6);
          ctx.fill();
          ctx.strokeStyle = RESOURCES[resId].color;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = RESOURCES[resId].color;
          ctx.beginPath();
          ctx.arc(bx + 8, y + 15.5, 3.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#0f2928';
          ctx.font = '700 10px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`${qty}`, bx + 14, y + 16);
          bx += 29;
        }
      }

      ctx.restore();
    }
  }

  _drawFactoryArchitecture(ctx, typeId, x, y, size, producing) {
    const cx = x + size / 2;
    const cy = y + size / 2 - 12;

    if (typeId === 'water_intake') {
      // Pump house + dual turquoise intake basins
      ctx.fillStyle = '#0e7490';
      this._roundRect(ctx, x + 10, y + 10, size - 20, size - 48, 10);
      ctx.fill();
      ctx.fillStyle = '#f0fdfa';
      this._roundRect(ctx, x + 20, y + 20, size - 40, 36, 7);
      ctx.fill();
      // Twin turbine circles
      for (const dx of [-16, 16]) {
        ctx.fillStyle = '#14b8a6';
        ctx.beginPath();
        ctx.arc(cx + dx, cy + 2, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#065f5b';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      return;
    }

    if (typeId === 'sugar') {
      // Warm amber roofed hall + twin metallic silver silos (echoing Card 05!)
      ctx.fillStyle = '#fef3c7';
      this._roundRect(ctx, x + 8, y + 8, size - 16, size - 44, 10);
      ctx.fill();
      // Main boiler roof
      ctx.fillStyle = '#d97706';
      this._roundRect(ctx, x + 16, y + 32, 54, 48, 7);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      this._roundRect(ctx, x + 16, y + 32, 54, 16, 5);
      ctx.fill();
      // Twin metallic silver silos
      for (const sy of [34, 62]) {
        const sGrad = ctx.createLinearGradient(x + 78, 0, x + 112, 0);
        sGrad.addColorStop(0, '#94a3b8');
        sGrad.addColorStop(0.5, '#f1f5f9');
        sGrad.addColorStop(1, '#64748b');
        ctx.fillStyle = sGrad;
        ctx.beginPath();
        ctx.arc(x + 94, y + sy + 6, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      // Subtle animated white steam puff when producing
      if (producing) {
        const p = (this.animTime * 0.7) % 1;
        ctx.fillStyle = `rgba(255,255,255,${0.65 * (1 - p)})`;
        ctx.beginPath();
        ctx.arc(x + 30 + p * 8, y + 30 - p * 14, 5 + p * 6, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    if (typeId === 'food') {
      // Clean coral-terracotta processing hall + stainless steel kettles
      ctx.fillStyle = '#fff1f2';
      this._roundRect(ctx, x + 8, y + 8, size - 16, size - 44, 10);
      ctx.fill();
      ctx.fillStyle = '#e11d48';
      this._roundRect(ctx, x + 18, y + 26, size - 36, 52, 9);
      ctx.fill();
      ctx.fillStyle = '#fb7185';
      this._roundRect(ctx, x + 22, y + 30, size - 44, 18, 6);
      ctx.fill();
      // Stainless steel kettle lids
      for (const dx of [-18, 18]) {
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.arc(cx + dx, cy + 12, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      return;
    }

    if (typeId === 'paper') {
      // Cobalt-slate sawtooth roof mill + white paper roll drums
      ctx.fillStyle = '#eff6ff';
      this._roundRect(ctx, x + 8, y + 8, size - 16, size - 44, 10);
      ctx.fill();
      // Sawtooth roof bays
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#1d4ed8' : '#2563eb';
        this._roundRect(ctx, x + 16 + i * 24, y + 26, 22, 52, 4);
        ctx.fill();
        ctx.fillStyle = '#93c5fd';
        ctx.fillRect(x + 19 + i * 24, y + 30, 6, 44);
      }
      // White paper rolls on deck
      for (const ry of [36, 58]) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x + 102, y + ry + 6, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1e40af';
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }
      return;
    }

    if (typeId === 'fertilizer') {
      // Signature Card 05 Deep Teal & Leaf-Green Bioreactor Domes!
      ctx.fillStyle = '#e6f6f3';
      this._roundRect(ctx, x + 8, y + 8, size - 16, size - 44, 10);
      ctx.fill();
      // Twin bioreactor tanks
      for (const dx of [-22, 22]) {
        const g = ctx.createRadialGradient(cx + dx - 4, cy, 3, cx + dx, cy + 4, 22);
        g.addColorStop(0, '#2dd4bf');
        g.addColorStop(0.6, '#0d9488');
        g.addColorStop(1, '#065f5b');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx + dx, cy + 6, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      // Botanical leaf accent at center
      ctx.fillStyle = '#84cc16';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 22, 13, 6, -0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  _drawInteractionOverlays(ctx) {
    if (this.activeTool.startsWith('build:') && this.hoverTile) {
      const typeId = this.activeTool.split(':')[1];
      const def = BUILDINGS[typeId];
      const { gx, gy } = this.hoverTile;
      const check = this.engine.canPlaceBuilding(typeId, gx, gy);

      const x = gx * TILE_SIZE + 5;
      const y = gy * TILE_SIZE + 5;
      const size = def.size * TILE_SIZE - 10;

      ctx.save();
      ctx.fillStyle = check.ok ? 'rgba(13, 148, 136, 0.20)' : 'rgba(220, 38, 38, 0.20)';
      ctx.strokeStyle = check.ok ? '#0d9488' : '#dc2626';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 5]);
      this._roundRect(ctx, x, y, size, size, 14);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    if (
      this.linkSourceId &&
      this.pointerWorld &&
      (this.activeTool === 'pipe' || this.activeTool === 'road')
    ) {
      const src = this.engine.buildings.find((b) => b.id === this.linkSourceId);
      if (src) {
        const sx = (src.gx + src.size / 2) * TILE_SIZE;
        const sy = (src.gy + src.size / 2) * TILE_SIZE;
        ctx.save();
        ctx.strokeStyle = this.activeTool === 'pipe' ? '#0d9488' : '#ca8a04';
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 7]);
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(this.pointerWorld.x, this.pointerWorld.y);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  _drawFloatingTexts(ctx) {
    for (const f of this.engine.floatingTexts) {
      const alpha = Math.max(0, 1 - f.age / f.duration);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = '700 13px "IBM Plex Sans Thai", sans-serif';
      ctx.textAlign = 'center';
      // Crisp white halo for daylight legibility
      ctx.strokeStyle = 'rgba(255,255,255,0.92)';
      ctx.lineWidth = 4;
      ctx.strokeText(f.text, f.x * TILE_SIZE, f.y * TILE_SIZE);
      ctx.fillStyle = f.color === '#fde047' ? '#b45309' : f.color === '#4ade80' ? '#15803d' : f.color;
      ctx.fillText(f.text, f.x * TILE_SIZE, f.y * TILE_SIZE);
      ctx.restore();
    }
  }

  _tracePolyline(ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
  }

  _pointOnPolyline(pts, t) {
    let total = 0;
    const segs = [];
    for (let i = 1; i < pts.length; i++) {
      const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      segs.push(d);
      total += d;
    }
    let target = total * Math.max(0, Math.min(1, t));
    for (let i = 0; i < segs.length; i++) {
      if (target <= segs[i] || i === segs.length - 1) {
        const ratio = segs[i] === 0 ? 0 : target / segs[i];
        return {
          x: pts[i].x + (pts[i + 1].x - pts[i].x) * ratio,
          y: pts[i].y + (pts[i + 1].y - pts[i].y) * ratio,
        };
      }
      target -= segs[i];
    }
    return pts[0];
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}
