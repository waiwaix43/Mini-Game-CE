// EcoLink Industrial Park — Procedural PBR Canvas Textures for Realistic 3D Surfaces

import * as THREE from 'three';

function makeCanvas(w, h, drawFn) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  drawFn(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

export function createTextures() {
  // 1. Brushed & Riveted Stainless Steel (for Card 05 Silos & Vessels)
  const steelSilo = makeCanvas(256, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, '#c8d3de');
    g.addColorStop(0.35, '#e2e9f0');
    g.addColorStop(0.55, '#b8c5d2');
    g.addColorStop(0.85, '#dce5ee');
    g.addColorStop(1, '#c8d3de');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Subtle brushed horizontal grain
    for (let y = 0; y < h; y += 2) {
      ctx.fillStyle = y % 4 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.04)';
      ctx.fillRect(0, y, w, 1);
    }
    // Horizontal welded seam rings + bolts
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.35)';
    ctx.lineWidth = 2;
    for (let row = 32; row < h; row += 64) {
      ctx.beginPath();
      ctx.moveTo(0, row);
      ctx.lineTo(w, row);
      ctx.stroke();
      ctx.fillStyle = 'rgba(71, 85, 105, 0.45)';
      for (let x = 8; x < w; x += 16) {
        ctx.beginPath();
        ctx.arc(x, row - 4, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Vertical panel joints
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.22)';
    ctx.lineWidth = 1.5;
    for (let x = 0; x < w; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
  });

  // 2. Corrugated Metal Siding (Factory Walls & Roofs)
  const makeCorrugated = (baseHex, darkHex, lightHex) =>
    makeCanvas(128, 128, (ctx, w, h) => {
      ctx.fillStyle = baseHex;
      ctx.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 8) {
        ctx.fillStyle = lightHex;
        ctx.fillRect(x, 0, 3, h);
        ctx.fillStyle = darkHex;
        ctx.fillRect(x + 4, 0, 2, h);
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();
    });

  const corrugatedWhite = makeCorrugated('#edf2f4', 'rgba(30,41,59,0.10)', 'rgba(255,255,255,0.45)');
  const corrugatedAmber = makeCorrugated('#c96a08', 'rgba(69,26,3,0.22)', 'rgba(254,243,199,0.20)');
  const corrugatedBlue = makeCorrugated('#1e4a8a', 'rgba(15,23,42,0.25)', 'rgba(191,219,254,0.18)');
  const corrugatedTeal = makeCorrugated('#0a7a72', 'rgba(4,47,46,0.25)', 'rgba(153,246,228,0.18)');

  // 3. Industrial Concrete Yard Pad (with subtle texture & yellow safety perimeter line)
  const concreteYard = makeCanvas(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#cfd8dc';
    ctx.fillRect(0, 0, w, h);

    // Subtle aggregate speckles
    for (let i = 0; i < 900; i++) {
      const x = (i * 73) % w;
      const y = (i * 137) % h;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.14)' : 'rgba(30,41,59,0.08)';
      ctx.fillRect(x, y, 2, 2);
    }

    // Concrete slab expansion joints
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.25)';
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, w - 8, h - 8);
    ctx.beginPath();
    ctx.moveTo(w / 2, 4);
    ctx.lineTo(w / 2, h - 4);
    ctx.moveTo(4, h / 2);
    ctx.lineTo(w - 4, h / 2);
    ctx.stroke();

    // Industrial yellow safety border dashed line
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 4;
    ctx.setLineDash([12, 8]);
    ctx.strokeRect(14, 14, w - 28, h - 28);
    ctx.setLineDash([]);
  });

  // 4. Factory Architectural Window Band (Dark steel frames + warm backlit glass)
  const factoryWallWindows = makeCanvas(256, 128, (ctx, w, h) => {
    // Lower concrete wainscot
    ctx.fillStyle = '#dce4e8';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#9aa8b2';
    ctx.fillRect(0, h * 0.68, w, h * 0.32);

    // Vertical corrugated siding lines above
    for (let x = 0; x < w; x += 8) {
      ctx.fillStyle = 'rgba(15,23,42,0.05)';
      ctx.fillRect(x, 0, 2, h * 0.68);
    }

    // Recessed window strip with mullions
    const winY = 26;
    const winH = 38;
    for (let x = 14; x < w - 14; x += 46) {
      // Frame
      ctx.fillStyle = '#334155';
      ctx.fillRect(x, winY, 34, winH);
      // Sky/warm interior reflection gradient
      const wg = ctx.createLinearGradient(x, winY, x, winY + winH);
      wg.addColorStop(0, '#38bdf8');
      wg.addColorStop(0.55, '#1e3a5f');
      wg.addColorStop(1, '#fef08a');
      ctx.fillStyle = wg;
      ctx.fillRect(x + 3, winY + 3, 28, winH - 6);
      // Mullion cross
      ctx.fillStyle = '#334155';
      ctx.fillRect(x + 16, winY + 3, 2, winH - 6);
      ctx.fillRect(x + 3, winY + 18, 28, 2);
    }
  });

  // 5. Roll-up Industrial Loading Dock Door
  const rollDoor = makeCanvas(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(8, 8, w - 16, h - 8);
    for (let y = 14; y < h; y += 10) {
      ctx.fillStyle = 'rgba(30, 41, 59, 0.28)';
      ctx.fillRect(8, y, w - 16, 2);
    }
    // Hazard stripes on jambs
    ctx.fillStyle = '#eab308';
    ctx.fillRect(2, 8, 5, h - 8);
    ctx.fillRect(w - 7, 8, 5, h - 8);
  });

  // 6. Lush Daylight Eco-Park Meadow Grass (Balanced for ACES sunlit exposure)
  const grassTerrain = makeCanvas(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#8cc9a2';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 6000; i++) {
      const x = (i * 97 + (i % 13) * 19) % w;
      const y = (i * 193 + (i % 7) * 31) % h;
      const r = 1 + (i % 3);
      ctx.fillStyle =
        i % 3 === 0
          ? 'rgba(77, 124, 15, 0.16)'
          : i % 3 === 1
          ? 'rgba(6, 95, 91, 0.10)'
          : 'rgba(236, 253, 245, 0.16)';
      ctx.fillRect(x, y, r, r);
    }
  });
  grassTerrain.repeat.set(5, 4);

  // 7. River Water Surface Ripples
  const riverTex = makeCanvas(256, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, '#065f5b');
    g.addColorStop(0.55, '#0d9488');
    g.addColorStop(1, '#14b8a6');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(240, 253, 250, 0.22)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 28; i++) {
      const x = (i * 53) % w;
      const y = (i * 79) % h;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 8, y + 16, x, y + 32);
      ctx.stroke();
    }
  });
  riverTex.repeat.set(1, 3);

  return {
    steelSilo,
    corrugatedWhite,
    corrugatedAmber,
    corrugatedBlue,
    corrugatedTeal,
    concreteYard,
    factoryWallWindows,
    rollDoor,
    grassTerrain,
    riverTex,
  };
}
