// EcoLink Industrial Park — Core Simulation Engine

import {
  GRID_COLS,
  GRID_ROWS,
  RIVER_COLS,
  SESSION_DURATION_SEC,
  STARTING_MONEY,
  PIPE_COST_PER_TILE,
  ROAD_COST_PER_TILE,
  EXTERNAL_WATER_COST,
  WASTE_DISPOSAL_FEE,
  RESOURCES,
  PRODUCTS,
  GRADE_RANK,
  BUILDINGS,
  ORDER_TEMPLATES,
} from './data.js';

export class SimulationEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.timeElapsed = 0;
    this.sessionDuration = SESSION_DURATION_SEC;
    this.paused = false;
    this.speed = 1; // 1 or 2
    this.sandboxMode = false;
    this.sessionEnded = false;
    this.isTimeSkipping = false;

    this.money = STARTING_MONEY;
    this.score = 0;
    this.nextId = 1;

    this.buildings = [];
    this.links = []; // { id, fromId, toId, kind: 'pipe'|'road', resource, path: [{x,y}], rrIndex }
    this.packets = []; // animated resource packets moving on links
    this.orders = [];
    this.floatingTexts = [];
    this.toasts = [];

    // Metrics for scoring & learning report
    this.stats = {
      waterRecycled: 0,
      waterExternal: 0,
      waterWasted: 0,
      solidReused: 0,
      solidWasted: 0,
      productsMade: { sugar: 0, food: 0, box: 0, fertilizer: 0, reclaimed_water: 0 },
      ordersCompleted: 0,
      ordersExpired: 0,
      moneySavedBySymbiosis: 0,
      disposalFeesPaid: 0,
      closedLoopSeconds: 0,
      peakCircularity: 0,
      correctMatches: 0,
      wrongAttempts: 0,
      fastForwardedSeconds: 0,
    };
    this.recentWaterEvents = []; // rolling window of recent water usage for accurate live circularity
    this.unlockedInsights = new Set();

    // Place permanent External Water Intake on riverbank
    this.buildings.push(this._createBuilding('water_intake', 0, 4));
  }

  _createBuilding(typeId, gx, gy) {
    const def = BUILDINGS[typeId];
    return {
      id: this.nextId++,
      typeId,
      gx,
      gy,
      size: def.size,
      mode: def.modes ? def.modes[0].id : null,
      // Resource buffers
      inBuf: {
        raw_water: 0,
        hot_water: 0,
        wastewater: 0,
        bagasse: 0,
        organic_waste: 0,
      },
      outBuf: {
        raw_water: 0,
        hot_water: 0,
        wastewater: 0,
        bagasse: 0,
        organic_waste: 0,
      },
      // Active production cycle
      producing: false,
      progress: 0,
      cycleDuration: 10,
      activeRecipe: null, // { duration, grade, label, outputs: {}, waterRecycledCount }
      statusText: typeId === 'water_intake' ? 'พร้อมสูบน้ำดิบ' : 'รอทรัพยากร',
      rrCursor: {}, // round-robin cursor per resource
      intakeCooldown: 0,
      totalProduced: 0,
    };
  }

  canPlaceBuilding(typeId, gx, gy) {
    const def = BUILDINGS[typeId];
    if (!def || !def.buildable) return { ok: false, reason: 'ไม่สามารถสร้างสิ่งปลูกสร้างนี้ได้' };
    if (gx < RIVER_COLS || gy < 0 || gx + def.size > GRID_COLS || gy + def.size > GRID_ROWS) {
      return { ok: false, reason: 'ต้องวางบนพื้นที่ดิน (ไม่ทับแม่น้ำหรือขอบแผนที่)' };
    }
    if (this.money < def.cost) {
      return { ok: false, reason: `งบประมาณไม่พอ (ต้องการ ฿${def.cost})` };
    }
    for (const b of this.buildings) {
      const overlap =
        gx < b.gx + b.size &&
        gx + def.size > b.gx &&
        gy < b.gy + b.size &&
        gy + def.size > b.gy;
      if (overlap) return { ok: false, reason: 'พื้นที่ทับซ้อนกับโรงงานอื่น' };
    }
    return { ok: true };
  }

  placeBuilding(typeId, gx, gy) {
    const check = this.canPlaceBuilding(typeId, gx, gy);
    if (!check.ok) return check;
    const def = BUILDINGS[typeId];
    this.money -= def.cost;
    const b = this._createBuilding(typeId, gx, gy);
    this.buildings.push(b);
    this._addFloat(b.gx + 1, b.gy, `-฿${def.cost}`, '#f87171');
    this.pushToast(`สร้าง${def.name}สำเร็จ`, 'success');
    return { ok: true, building: b };
  }

  demolishBuilding(buildingId) {
    const idx = this.buildings.findIndex((b) => b.id === buildingId);
    if (idx === -1) return { ok: false, reason: 'ไม่พบโรงงาน' };
    const b = this.buildings[idx];
    const def = BUILDINGS[b.typeId];
    if (!def.demolishable) return { ok: false, reason: 'ไม่สามารถรื้อถอนแหล่งน้ำดิบภายนอกได้' };

    const refund = Math.round(def.cost * 0.5);
    this.money += refund;
    this.buildings.splice(idx, 1);
    this.links = this.links.filter((l) => l.fromId !== buildingId && l.toId !== buildingId);
    this.packets = this.packets.filter((p) => {
      const linkExists = this.links.some((l) => l.id === p.linkId);
      return linkExists;
    });
    this._addFloat(b.gx + 1, b.gy, `+฿${refund}`, '#4ade80');
    this.pushToast(`รื้อถอน${def.name} (คืนเงิน ฿${refund})`, 'info');
    return { ok: true };
  }

  demolishLink(linkId) {
    const idx = this.links.findIndex((l) => l.id === linkId);
    if (idx === -1) return { ok: false };
    const link = this.links[idx];
    this.links.splice(idx, 1);
    this.packets = this.packets.filter((p) => p.linkId !== linkId);
    this.pushToast(`ยกเลิกการเชื่อมต่อ ${RESOURCES[link.resource].name}`, 'info');
    return { ok: true };
  }

  getBuildingAt(gx, gy) {
    return this.buildings.find(
      (b) => gx >= b.gx && gx < b.gx + b.size && gy >= b.gy && gy < b.gy + b.size
    ) || null;
  }

  findConnectableResource(fromId, toId, kind) {
    if (fromId === toId) return { ok: false, reason: 'ไม่สามารถเชื่อมต่อโรงงานเข้ากับตัวเองได้' };
    const fromB = this.buildings.find((b) => b.id === fromId);
    const toB = this.buildings.find((b) => b.id === toId);
    if (!fromB || !toB) return { ok: false, reason: 'ไม่พบโรงงานต้นทางหรือปลายทาง' };

    const fromDef = BUILDINGS[fromB.typeId];
    const toDef = BUILDINGS[toB.typeId];

    const outputs = kind === 'pipe' ? fromDef.outputsWater : fromDef.outputsSolid;
    const accepts = kind === 'pipe' ? toDef.acceptsWater : toDef.acceptsSolid;

    const match = outputs.find((r) => accepts.includes(r));
    if (!match) {
      if (kind === 'pipe') {
        const outNames = outputs.map((r) => RESOURCES[r].name).join('/') || 'ไม่มี';
        const accNames = accepts.map((r) => RESOURCES[r].name).join('/') || 'ไม่รับน้ำ';
        return {
          ok: false,
          reason: `${fromDef.shortName}ปล่อย (${outNames}) แต่${toDef.shortName}รับเฉพาะ (${accNames})`,
        };
      } else {
        const outNames = outputs.map((r) => RESOURCES[r].name).join('/') || 'ไม่มีของเหลือแข็ง';
        const accNames = accepts.map((r) => RESOURCES[r].name).join('/') || 'ไม่รับของเหลือแข็ง';
        return {
          ok: false,
          reason: `${fromDef.shortName}ปล่อย (${outNames}) แต่${toDef.shortName}รับ (${accNames})`,
        };
      }
    }

    const exists = this.links.some(
      (l) => l.fromId === fromId && l.toId === toId && l.resource === match
    );
    if (exists) {
      return { ok: false, reason: 'มีการเชื่อมต่อทรัพยากรนี้ระหว่างสองโรงงานอยู่แล้ว' };
    }

    return { ok: true, resource: match };
  }

  createLink(fromId, toId, kind, explicitResource = null) {
    let resourceId = explicitResource;
    if (!resourceId) {
      const check = this.findConnectableResource(fromId, toId, kind);
      if (!check.ok) return check;
      resourceId = check.resource;
    }

    const fromB = this.buildings.find((b) => b.id === fromId);
    const toB = this.buildings.find((b) => b.id === toId);
    const path = this._buildOrthogonalPath(fromB, toB, kind);
    const dist = Math.max(2, Math.round(this._pathLength(path)));
    const cost = dist * (kind === 'pipe' ? PIPE_COST_PER_TILE : ROAD_COST_PER_TILE);

    if (this.money < cost) {
      return { ok: false, reason: `งบประมาณไม่พอสร้างเส้นทาง (ต้องการ ฿${cost})` };
    }

    this.money -= cost;
    const link = {
      id: this.nextId++,
      fromId,
      toId,
      kind,
      resource: resourceId,
      path,
      cost,
    };
    this.links.push(link);
    const res = RESOURCES[resourceId];
    this._addFloat((fromB.gx + toB.gx) / 2 + 1, (fromB.gy + toB.gy) / 2 + 1, `-฿${cost}`, '#f87171');
    this.pushToast(
      `เชื่อมต่อ${kind === 'pipe' ? 'ท่อ' : 'เส้นทาง'} ${res.name} สำเร็จ (-฿${cost})`,
      'success'
    );
    return { ok: true, link };
  }

  // Auto-detect ALL connectable resources (water + solid) directly between two factories
  findConnectableResourcesAny(fromId, toId) {
    if (fromId === toId) return [];
    const fromB = this.buildings.find((b) => b.id === fromId);
    const toB = this.buildings.find((b) => b.id === toId);
    if (!fromB || !toB) return [];

    const fromDef = BUILDINGS[fromB.typeId];
    const toDef = BUILDINGS[toB.typeId];
    const matches = [];

    for (const r of fromDef.outputsWater) {
      if (toDef.acceptsWater.includes(r)) {
        const exists = this.links.some((l) => l.fromId === fromId && l.toId === toId && l.resource === r);
        if (!exists) matches.push({ resource: r, kind: 'pipe' });
      }
    }
    for (const r of fromDef.outputsSolid) {
      if (toDef.acceptsSolid.includes(r)) {
        const exists = this.links.some((l) => l.fromId === fromId && l.toId === toId && l.resource === r);
        if (!exists) matches.push({ resource: r, kind: 'road' });
      }
    }
    return matches;
  }

  // Connect ONE specific leftover/resource chosen deliberately by the player
  createSpecificLink(fromId, toId, resourceId) {
    if (fromId === toId) {
      return { ok: false, reason: 'ไม่สามารถส่งผลพลอยได้กลับเข้าโรงงานเดิมโดยตรงได้' };
    }
    const fromB = this.buildings.find((b) => b.id === fromId);
    const toB = this.buildings.find((b) => b.id === toId);
    if (!fromB || !toB) return { ok: false, reason: 'ไม่พบโรงงานต้นทางหรือปลายทาง' };

    const resInfo = RESOURCES[resourceId];
    if (!resInfo) return { ok: false, reason: 'ไม่พบชนิดทรัพยากรที่เลือก' };

    const kind = resInfo.category === 'water' ? 'pipe' : 'road';
    const toDef = BUILDINGS[toB.typeId];
    const accepts = kind === 'pipe' ? toDef.acceptsWater : toDef.acceptsSolid;

    const alreadyLinked = this.links.some(
      (l) => l.fromId === fromId && l.toId === toId && l.resource === resourceId
    );
    if (alreadyLinked) {
      return {
        ok: false,
        alreadyLinked: true,
        reason: `มีการส่ง${resInfo.name}ไปยัง${toDef.shortName}อยู่แล้ว`,
      };
    }

    if (!accepts.includes(resourceId)) {
      this.stats.wrongAttempts += 1;
      return {
        ok: false,
        reason: this._explainResourceMismatch(resourceId, fromB.typeId, toB.typeId),
      };
    }

    const res = this.createLink(fromId, toId, kind, resourceId);
    if (!res.ok) return res;

    this.stats.correctMatches += 1;
    const edu = this._explainSuccess(fromB.typeId, toB.typeId, resourceId);
    if (edu) {
      const key = `${resourceId}:${toB.typeId}`;
      if (!this.unlockedInsights.has(key)) {
        this.unlockedInsights.add(key);
        this.score += 100;
        this.pushToast(`${edu} (+100 คะแนน)`, 'success');
      } else {
        this.pushToast(edu, 'success');
      }
    }
    return { ok: true, link: res.link };
  }

  _explainResourceMismatch(resId, fromType, toType) {
    const toDef = BUILDINGS[toType];
    if (resId === 'bagasse') {
      return `ไม่เหมาะสม: ${toDef.shortName}ไม่สามารถใช้ "ชานอ้อย" ได้ — ชานอ้อยมีเส้นใยเซลลูโลสและอินทรียวัตถุ ลองคิดดูว่าโรงงานใดใช้เส้นใยพืชหรือหมักอินทรียวัตถุแทนวัตถุดิบใหม่?`;
    }
    if (resId === 'organic_waste') {
      return `ไม่เหมาะสม: ${toDef.shortName}ไม่สามารถนำ "กากอินทรีย์" ไปผลิตได้ — กากอาหารอุดมด้วยธาตุอาหาร ควรส่งไปโรงงานที่ผลิตสารบำรุงดิน/ปุ๋ย`;
    }
    if (resId === 'hot_water') {
      return `ไม่เหมาะสม: ${toDef.shortName}ไม่ได้ใช้ประโยชน์จาก "น้ำร้อน" — น้ำร้อนสะอาดเหมาะสำหรับช่วยลดเวลาต้ม ลวก หรือฆ่าเชื้อในโรงงานอาหารและกระดาษ`;
    }
    if (resId === 'wastewater') {
      return `ไม่เหมาะสม: ${toDef.shortName}ต้องใช้น้ำสะอาด ไม่สามารถรับ "น้ำเสีย" ได้ — ลองส่งน้ำเสียไปโรงงานบำบัดน้ำหรือโรงงานปุ๋ยชีวภาพเพื่อบำบัดคืนระบบ`;
    }
    if (resId === 'raw_water' && toType === 'treatment') {
      return 'ไม่เหมาะสม: น้ำดิบสะอาดอยู่แล้ว ไม่จำเป็นต้องส่งเข้าโรงงานบำบัดน้ำเสีย';
    }
    return `ไม่เหมาะสม: ${toDef.shortName}ไม่สามารถรับ "${RESOURCES[resId].name}" เข้ากระบวนการผลิตได้`;
  }

  _explainSuccess(fromType, toType, resId) {
    if (resId === 'hot_water' && toType === 'food') {
      return 'ถูกต้อง! น้ำร้อนหล่อเย็นช่วยลวกและฆ่าเชื้ออาหาร ลดเวลาผลิตจาก 12 วิ → 8 วิ';
    }
    if (resId === 'hot_water' && toType === 'paper') {
      return 'ถูกต้อง! น้ำร้อนช่วยต้มเยื่อกระดาษได้ไวขึ้น ลดเวลาผลิตลง 3–4 วิ';
    }
    if (resId === 'bagasse' && toType === 'paper') {
      return 'ถูกต้อง! ชานอ้อยมีเส้นใยเซลลูโลสใช้ผลิตกล่องแทนเยื่อไม้ใหม่ ประหยัด ฿45/รอบ';
    }
    if (resId === 'bagasse' && toType === 'fertilizer') {
      return 'ถูกต้อง! ชานอ้อยเป็นอินทรียวัตถุที่นำมาหมักปุ๋ยร่วมกับน้ำเสียได้';
    }
    if (resId === 'organic_waste' && toType === 'fertilizer') {
      return 'ถูกต้อง! กากอาหารอุดมด้วยธาตุอาหาร ยกระดับปุ๋ยชีวภาพจากเกรด C → เกรด A พรีเมียม';
    }
    if (resId === 'wastewater' && toType === 'treatment') {
      return 'ถูกต้อง! ส่งน้ำเสียเข้าโรงงานบำบัดน้ำเพื่อกรองและตกตะกอนคืนเป็นน้ำดิบใน 6 วิ';
    }
    if (resId === 'wastewater' && toType === 'fertilizer') {
      return 'ถูกต้อง! น้ำเสียอินทรีย์มีธาตุอาหารสูง เหมาะนำไปหมักปุ๋ยพร้อมบำบัดคืนน้ำดิบ';
    }
    if (resId === 'raw_water' && (fromType === 'treatment' || fromType === 'fertilizer')) {
      return 'ยอดเยี่ยม! นำน้ำดิบที่ผ่านการบำบัดกลับมาใช้ซ้ำ ลดการสูบน้ำจากแม่น้ำธรรมชาติ';
    }
    return null;
  }

  _explainMismatch(fromType, toType) {
    const fromDef = BUILDINGS[fromType];
    const toDef = BUILDINGS[toType];
    if (fromDef.outputsWater.includes('wastewater') && ['sugar', 'food', 'paper'].includes(toType)) {
      return `ไม่เหมาะสม: ${toDef.shortName}ต้องใช้น้ำสะอาด (น้ำดิบ/น้ำร้อน) ไม่สามารถรับน้ำเสียได้ — ลองส่งน้ำเสียไปโรงงานที่บำบัดหรือใช้ธาตุอาหารจากน้ำเสียได้`;
    }
    if (fromDef.outputsWater.includes('hot_water') && toType === 'treatment') {
      return 'ไม่เหมาะสม: น้ำร้อนจากระบบหล่อเย็นสะอาดอยู่แล้ว มีคุณค่าด้านความร้อน ควรส่งไปลดเวลาต้มในโรงงานอาหารหรือกระดาษ';
    }
    if (fromType === 'sugar' && toType === 'treatment') {
      return 'ไม่เหมาะสม: โรงงานน้ำตาลปล่อยน้ำร้อนและชานอ้อย ไม่ใช่น้ำเสีย — ลองคิดดูว่าโรงงานใดต้องการความร้อนหรือเส้นใยพืช';
    }
    if (fromType === 'water_intake' && toType === 'treatment') {
      return 'ไม่เหมาะสม: น้ำดิบจากแม่น้ำสะอาดอยู่แล้ว ไม่จำเป็นต้องส่งเข้าโรงงานบำบัดน้ำเสีย';
    }
    if (fromType === 'food' && ['sugar', 'paper'].includes(toType)) {
      return `ไม่เหมาะสม: ${toDef.shortName}ไม่สามารถใช้น้ำเสียหรือกากอาหารได้ — ลองคิดดูว่าโรงงานใดต้องการธาตุอาหารอินทรีย์หรือบำบัดน้ำเสีย`;
    }
    return `ไม่เหมาะสม: ของเหลือจาก${fromDef.shortName}ไม่ตรงกับกระบวนการผลิตของ${toDef.shortName} ลองตรวจสอบคุณสมบัติวัตถุดิบอีกครั้ง`;
  }

  // Non-overlapping orthogonal lane router so pipes/conveyors NEVER stack on top of each other
  _buildOrthogonalPath(fromB, toB, kind) {
    const existingOut = this.links.filter((l) => l.fromId === fromB.id).length;
    const existingIn = this.links.filter((l) => l.toId === toB.id).length;

    const portOffsets = [0, -0.34, 0.34, -0.62, 0.62];
    const outOff = portOffsets[existingOut % portOffsets.length];
    const inOff = portOffsets[existingIn % portOffsets.length];

    const fcx = fromB.gx + fromB.size / 2;
    const fcz = fromB.gy + fromB.size / 2;
    const tcx = toB.gx + toB.size / 2;
    const tcz = toB.gy + toB.size / 2;

    const dx = tcx - fcx;
    const dz = tcz - fcz;

    // Exit from clean perimeter port rather than overlapping center
    const sx = dx >= 0 ? fromB.gx + fromB.size + 0.05 : fromB.gx - 0.05;
    const sy = fcz + outOff;
    const ex = dx >= 0 ? toB.gx - 0.05 : toB.gx + toB.size + 0.05;
    const ey = tcz + inOff;

    // Find a clear vertical corridor X that doesn't overlap existing vertical link segments
    let baseMidX = sx + (ex - sx) * 0.5;
    if (Math.abs(ex - sx) < 0.8) {
      // Vertically stacked factories: route cleanly to the side corridor
      baseMidX = Math.max(fromB.gx + fromB.size, toB.gx + toB.size) + 0.55;
    }

    const usedMidXs = this.links.map((l) => (l.path && l.path[1] ? l.path[1].x : -999));
    let midX = baseMidX;
    const shifts = [0, 0.36, -0.36, 0.72, -0.72, 1.08, -1.08, 1.44, -1.44];
    for (const sh of shifts) {
      const cand = baseMidX + sh;
      if (cand < RIVER_COLS + 0.25 || cand > GRID_COLS - 0.25) continue;
      const clash = usedMidXs.some((ux) => Math.abs(ux - cand) < 0.28);
      if (!clash) {
        midX = cand;
        break;
      }
    }

    // Add tiny kind-based separation if still close
    if (kind === 'road') midX += 0.06;

    return [
      { x: sx, y: sy },
      { x: midX, y: sy },
      { x: midX, y: ey },
      { x: ex, y: ey },
    ];
  }

  _pathLength(path) {
    let total = 0;
    for (let i = 1; i < path.length; i++) {
      total += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
    }
    return total;
  }

  setBuildingMode(buildingId, modeId) {
    const b = this.buildings.find((x) => x.id === buildingId);
    if (b) b.mode = modeId;
  }

  // --- Main Simulation Tick ---
  update(dtReal) {
    // Update floating texts & toasts even when paused
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const f = this.floatingTexts[i];
      f.age += dtReal;
      f.y -= dtReal * 0.45;
      if (f.age >= f.duration) this.floatingTexts.splice(i, 1);
    }
    for (let i = this.toasts.length - 1; i >= 0; i--) {
      this.toasts[i].ttl -= dtReal;
      if (this.toasts[i].ttl <= 0) this.toasts.splice(i, 1);
    }

    if (this.paused || (this.sessionEnded && !this.sandboxMode)) return;

    const dt = dtReal * this.speed;
    this._stepSimulationCore(dt);
  }

  // Advance simulation accurately by `simSeconds` using fixed 0.1s sub-steps (for live animated Time Skip)
  advanceSimulatedTime(simSeconds, dtRealForFloats = 0.016) {
    if (this.sandboxMode || this.sessionEnded || simSeconds <= 0) return;
    const prevPaused = this.paused;
    const prevSpeed = this.speed;
    this.paused = false;
    this.speed = 1;

    // Age existing floating texts & toasts once per real frame so they glide cleanly
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const f = this.floatingTexts[i];
      f.age += dtRealForFloats * 2.2;
      f.y -= dtRealForFloats * 0.9;
      if (f.age >= f.duration) this.floatingTexts.splice(i, 1);
    }
    for (let i = this.toasts.length - 1; i >= 0; i--) {
      this.toasts[i].ttl -= dtRealForFloats;
      if (this.toasts[i].ttl <= 0) this.toasts.splice(i, 1);
    }

    const MAX_STEP = 0.1;
    let remaining = simSeconds;
    let guard = 0;
    while (remaining > 1e-6 && !this.sessionEnded && guard < 2000) {
      const step = Math.min(MAX_STEP, remaining);
      this._stepSimulationCore(step);
      remaining -= step;
      guard++;
    }

    this.speed = prevSpeed;
    if (!this.sessionEnded) this.paused = prevPaused;
  }

  _stepSimulationCore(dt) {
    this.timeElapsed += dt;

    // Check session end
    if (!this.sandboxMode && this.timeElapsed >= this.sessionDuration) {
      this.timeElapsed = this.sessionDuration;
      this.sessionEnded = true;
      this.paused = true;
      this._finalizeSessionScore();
      return;
    }

    // 1. Update animated resource packets in transit
    this._updatePackets(dt);

    // 2. Update External Water Intake pumping
    this._updateWaterIntake(dt);

    // 3. Update factory production & output dispatch
    for (const b of this.buildings) {
      if (b.typeId === 'water_intake') continue;
      this._updateFactory(b, dt);
      this._dispatchOutputs(b);
      this._handleOverflow(b);
    }

    // 4. Track closed-loop bonus time
    const circ = this.getWaterCircularity();
    if (circ > this.stats.peakCircularity) this.stats.peakCircularity = circ;
    if (this.hasActiveClosedWaterLoop() && circ >= 85) {
      this.stats.closedLoopSeconds += dt;
      this.score += dt * 1.5; // continuous circularity score drip
    }
  }

  // Instantly simulate all remaining session time to evaluate the player's current park design
  fastForwardToEnd(initialRemainingSec = null) {
    if (this.sandboxMode || this.sessionEnded || this.timeElapsed >= this.sessionDuration) {
      this.paused = true;
      return { simulatedSeconds: initialRemainingSec ?? this.stats.fastForwardedSeconds ?? 0 };
    }
    const remainingSec = Math.max(0, this.sessionDuration - this.timeElapsed);
    this.paused = false;
    this.speed = 1;

    const step = 0.1;
    const maxSteps = Math.ceil(remainingSec / step) + 20;
    let steps = 0;
    while (!this.sessionEnded && steps < maxSteps) {
      this._stepSimulationCore(step);
      steps++;
    }

    // Clear transient floating texts accumulated during fast-forward
    this.floatingTexts = [];
    this.paused = true;
    const totalSkipped = initialRemainingSec !== null ? Math.round(initialRemainingSec) : Math.round(remainingSec);
    this.stats.fastForwardedSeconds = totalSkipped;
    return { simulatedSeconds: totalSkipped };
  }

  _updatePackets(dt) {
    const speedTilesPerSec = 3.2;
    for (let i = this.packets.length - 1; i >= 0; i--) {
      const p = this.packets[i];
      const link = this.links.find((l) => l.id === p.linkId);
      if (!link) {
        this.packets.splice(i, 1);
        continue;
      }
      const len = Math.max(0.5, this._pathLength(link.path));
      p.t += (speedTilesPerSec * dt) / len;
      if (p.t >= 1) {
        const toB = this.buildings.find((b) => b.id === link.toId);
        if (toB) {
          toB.inBuf[p.resource] = Math.min(8, (toB.inBuf[p.resource] || 0) + p.amount);
        }
        this.packets.splice(i, 1);
      }
    }
  }

  _recordWaterEvent(kind, count = 1) {
    for (let i = 0; i < count; i++) {
      this.recentWaterEvents.push(kind);
    }
    const MAX_WINDOW = 40;
    if (this.recentWaterEvents.length > MAX_WINDOW) {
      this.recentWaterEvents.splice(0, this.recentWaterEvents.length - MAX_WINDOW);
    }
  }

  _countSystemWater() {
    let total = 0;
    const waterKeys = ['raw_water', 'hot_water', 'wastewater'];
    for (const b of this.buildings) {
      total += (b.inBuf.raw_water || 0) + (b.outBuf.raw_water || 0);
      total += (b.inBuf.hot_water || 0) + (b.outBuf.hot_water || 0);
      // Cap counted wastewater per reclaimer so trapped/excess wastewater doesn't mask a water deficit
      const isReclaimer = b.typeId === 'treatment' || (b.typeId === 'fertilizer' && b.mode !== 'fresh_rush');
      total += isReclaimer ? Math.min(2, b.inBuf.wastewater || 0) : (b.inBuf.wastewater || 0);
      total += b.outBuf.wastewater || 0;
      if (b.producing && b.activeRecipe && b.activeRecipe.waterInUse) {
        total += b.activeRecipe.waterInUse;
      }
    }
    for (const p of this.packets) {
      if (waterKeys.includes(p.resource)) total += p.amount;
    }
    return total;
  }

  _getDesiredLoopWater() {
    // Target circulating water volume so every connected factory in a closed loop runs smoothly without starving or flooding
    let desired = 0;
    for (const b of this.buildings) {
      if (b.typeId === 'water_intake') continue;
      const hasPipe = this.links.some((l) => l.kind === 'pipe' && (l.fromId === b.id || l.toId === b.id));
      if (!hasPipe) continue;
      if (b.typeId === 'sugar') desired += 3;
      else if (b.typeId === 'food' || b.typeId === 'paper') desired += 1.5;
      else if (b.typeId === 'fertilizer' && b.mode !== 'fresh_rush') desired += 1.5;
      else if (b.typeId === 'treatment') desired += 1.5;
    }
    return Math.max(4, Math.round(desired));
  }

  _updateWaterIntake(dt) {
    const intake = this.buildings.find((b) => b.typeId === 'water_intake');
    if (!intake) return;
    intake.intakeCooldown -= dt;
    if (intake.intakeCooldown > 0) return;

    const outLinks = this.links.filter((l) => l.fromId === intake.id);
    if (outLinks.length === 0) {
      intake.statusText = 'พร้อมสูบน้ำดิบ (ยังไม่เชื่อมต่อ)';
      return;
    }

    const closedLoop = this.hasActiveClosedWaterLoop();
    const systemWater = closedLoop ? this._countSystemWater() : 0;
    const desiredLoopWater = closedLoop ? this._getDesiredLoopWater() : 0;

    let pumpedAny = false;
    let standbyClosed = false;

    for (const link of outLinks) {
      const target = this.buildings.find((b) => b.id === link.toId);
      if (!target) continue;

      // Smart priority: check if target has an active recycled raw_water link from Treatment or Bio-Fertilizer
      const hasRecycledLink = this.links.some((l) => {
        if (l.toId !== target.id || l.resource !== 'raw_water') return false;
        const src = this.buildings.find((b) => b.id === l.fromId);
        return src && (src.typeId === 'treatment' || (src.typeId === 'fertilizer' && src.mode !== 'fresh_rush'));
      });

      const inTransit = this.packets
        .filter((p) => {
          const l = this.links.find((x) => x.id === p.linkId);
          return l && l.toId === target.id && p.resource === 'raw_water';
        })
        .reduce((s, p) => s + p.amount, 0);

      const needed = target.typeId === 'sugar' || target.typeId === 'fertilizer' ? 2 : 1;
      const currentRaw = (target.inBuf.raw_water || 0) + inTransit;

      // If target prefers hot water and already has hot water, don't pump external raw water
      if (
        (target.typeId === 'food' || target.typeId === 'paper') &&
        (target.inBuf.hot_water || 0) >= 1
      ) {
        continue;
      }
      if (target.typeId === 'food' && target.mode === 'hot_only') continue;
      if (target.typeId === 'fertilizer' && target.mode === 'circular') continue;

      // When closed loop is active and already primed with sufficient circulating water, stay on standby!
      if (hasRecycledLink && closedLoop && systemWater >= desiredLoopWater) {
        standbyClosed = true;
        continue;
      }

      // If recycled link exists, only prime up to needed when target is waiting
      const threshold = hasRecycledLink ? (target.producing ? 0 : needed) : needed + 1;
      if (currentRaw < threshold && this.money >= EXTERNAL_WATER_COST) {
        this.money -= EXTERNAL_WATER_COST;
        this.stats.waterExternal += 1;
        this._recordWaterEvent('external', 1);
        this.packets.push({
          linkId: link.id,
          resource: 'raw_water',
          amount: 1,
          t: 0,
          isExternal: true,
        });
        this._addFloat(intake.gx + 1, intake.gy, `-฿${EXTERNAL_WATER_COST} น้ำดิบ`, '#38bdf8');
        pumpedAny = true;
      }
    }

    if (pumpedAny) {
      intake.statusText = closedLoop ? 'เติมน้ำตั้งต้นวงจร' : 'กำลังสูบน้ำดิบเข้าระบบ';
    } else if (standbyClosed) {
      intake.statusText = 'สแตนด์บาย (วงจรน้ำปิด 100%)';
    } else {
      intake.statusText = 'พร้อมสูบน้ำดิบ';
    }

    intake.intakeCooldown = pumpedAny ? 2.0 : 0.8;
  }

  _updateFactory(b, dt) {
    if (!b.producing) {
      const recipe = this._tryStartRecipe(b);
      if (recipe) {
        b.producing = true;
        b.progress = 0;
        b.cycleDuration = recipe.duration;
        b.activeRecipe = recipe;
        b.statusText = `กำลังผลิต (${recipe.label})`;
      }
      return;
    }

    b.progress += dt;
    if (b.progress >= b.cycleDuration) {
      this._finishProduction(b);
    }
  }

  _tryStartRecipe(b) {
    const def = BUILDINGS[b.typeId];

    if (b.typeId === 'sugar') {
      if (b.inBuf.raw_water >= 2) {
        if (this.money < def.externalCost) {
          b.statusText = 'งบไม่พอซื้ออ้อย';
          return null;
        }
        b.inBuf.raw_water -= 2;
        this.money -= def.externalCost;
        return {
          duration: 8,
          grade: 'B',
          label: 'น้ำดิบ 2 → 8 วิ',
          outputs: { hot_water: 2, bagasse: 2 },
          waterInUse: 2,
        };
      }
      b.statusText = `รอน้ำดิบ (${b.inBuf.raw_water}/2)`;
      return null;
    }

    if (b.typeId === 'food') {
      const useHot = b.inBuf.hot_water >= 1;
      const useRaw = !useHot && b.mode !== 'hot_only' && b.inBuf.raw_water >= 1;
      if (!useHot && !useRaw) {
        b.statusText = b.mode === 'hot_only' ? 'รอน้ำร้อน (1)' : 'รอน้ำร้อน หรือ น้ำดิบ (1)';
        return null;
      }
      if (this.money < def.externalCost) {
        b.statusText = 'งบไม่พอซื้อวัตถุดิบ';
        return null;
      }
      this.money -= def.externalCost;
      if (useHot) {
        b.inBuf.hot_water -= 1;
        this.stats.waterRecycled += 1;
        this._recordWaterEvent('recycled', 1);
        this.stats.moneySavedBySymbiosis += EXTERNAL_WATER_COST;
        return {
          duration: 8,
          grade: 'B',
          label: 'น้ำร้อน → 8 วิ',
          outputs: { wastewater: 1, organic_waste: 1 },
          waterInUse: 1,
        };
      } else {
        b.inBuf.raw_water -= 1;
        return {
          duration: 12,
          grade: 'B',
          label: 'น้ำดิบ → 12 วิ',
          outputs: { wastewater: 1, organic_waste: 1 },
          waterInUse: 1,
        };
      }
    }

    if (b.typeId === 'paper') {
      const useHot = b.inBuf.hot_water >= 1;
      const useRaw = !useHot && b.inBuf.raw_water >= 1;
      if (!useHot && !useRaw) {
        b.statusText = 'รอน้ำร้อน หรือ น้ำดิบ (1)';
        return null;
      }

      let useBagasse = false;
      if (b.mode === 'bagasse_only') {
        if (b.inBuf.bagasse < 1) {
          b.statusText = 'รอชานอ้อย (1)';
          return null;
        }
        useBagasse = true;
      } else if (b.mode === 'bagasse_first') {
        useBagasse = b.inBuf.bagasse >= 1;
      } else {
        useBagasse = false; // virgin_pulp
      }

      if (!useBagasse && this.money < def.externalCost) {
        b.statusText = 'งบไม่พอซื้อเยื่อไม้ใหม่';
        return null;
      }

      if (useHot) {
        b.inBuf.hot_water -= 1;
        this.stats.waterRecycled += 1;
        this._recordWaterEvent('recycled', 1);
        this.stats.moneySavedBySymbiosis += EXTERNAL_WATER_COST;
      } else {
        b.inBuf.raw_water -= 1;
      }

      if (useBagasse) {
        b.inBuf.bagasse -= 1;
        this.stats.solidReused += 1;
        this.stats.moneySavedBySymbiosis += def.externalCost;
        const duration = useHot ? 8 : 11;
        return {
          duration,
          grade: 'B',
          label: `ชานอ้อย + ${useHot ? 'น้ำร้อน' : 'น้ำดิบ'} → ${duration} วิ`,
          outputs: { wastewater: 1 },
          waterInUse: 1,
        };
      } else {
        this.money -= def.externalCost;
        const duration = useHot ? 10 : 14;
        return {
          duration,
          grade: 'A',
          label: `เยื่อไม้ใหม่ + ${useHot ? 'น้ำร้อน' : 'น้ำดิบ'} → ${duration} วิ`,
          outputs: { wastewater: 1 },
          waterInUse: 1,
        };
      }
    }

    if (b.typeId === 'fertilizer') {
      if (b.mode === 'fresh_rush') {
        if (b.inBuf.raw_water < 2) {
          b.statusText = `รอน้ำดิบ (${b.inBuf.raw_water}/2)`;
          return null;
        }
        if (this.money < def.externalCost) {
          b.statusText = 'งบไม่พอซื้อวัตถุดิบ';
          return null;
        }
        b.inBuf.raw_water -= 2;
        this.money -= def.externalCost;
        return {
          duration: 8,
          grade: 'C',
          label: 'โหมดเร่งด่วน → 8 วิ (เกรด C)',
          outputs: {},
          waterInUse: 0,
        };
      }

      // Circular mode: 1 wastewater + 2 solid (organic_waste / bagasse) -> 1 clean raw_water + Grade A/B fertilizer
      if (b.inBuf.wastewater < 1) {
        b.statusText = 'รอน้ำเสีย (0/1)';
        return null;
      }
      const org = b.inBuf.organic_waste;
      const bag = b.inBuf.bagasse;

      if (org >= 2) {
        b.inBuf.wastewater -= 1;
        b.inBuf.organic_waste -= 2;
        this.stats.waterRecycled += 1;
        this._recordWaterEvent('recycled', 1);
        this.stats.solidReused += 2;
        this.stats.moneySavedBySymbiosis += EXTERNAL_WATER_COST + def.externalCost;
        return {
          duration: 7,
          grade: 'A',
          label: 'กากอินทรีย์ 2 + น้ำเสีย 1 → 7 วิ',
          outputs: { raw_water: 1 },
          waterInUse: 1,
        };
      } else if (org >= 1 && bag >= 1) {
        b.inBuf.wastewater -= 1;
        b.inBuf.organic_waste -= 1;
        b.inBuf.bagasse -= 1;
        this.stats.waterRecycled += 1;
        this._recordWaterEvent('recycled', 1);
        this.stats.solidReused += 2;
        this.stats.moneySavedBySymbiosis += EXTERNAL_WATER_COST + def.externalCost;
        return {
          duration: 8,
          grade: 'A',
          label: 'กาก+ชานอ้อย + น้ำเสีย 1 → 8 วิ',
          outputs: { raw_water: 1 },
          waterInUse: 1,
        };
      } else if (bag >= 2) {
        b.inBuf.wastewater -= 1;
        b.inBuf.bagasse -= 2;
        this.stats.waterRecycled += 1;
        this._recordWaterEvent('recycled', 1);
        this.stats.solidReused += 2;
        this.stats.moneySavedBySymbiosis += EXTERNAL_WATER_COST + def.externalCost;
        return {
          duration: 9,
          grade: 'B',
          label: 'ชานอ้อย 2 + น้ำเสีย 1 → 9 วิ',
          outputs: { raw_water: 1 },
          waterInUse: 1,
        };
      }
      b.statusText = `รอกากอินทรีย์/ชานอ้อย (${org + bag}/2)`;
      return null;
    }

    if (b.typeId === 'treatment') {
      if (b.inBuf.wastewater < 1) {
        b.statusText = 'รอน้ำเสีย (0/1)';
        return null;
      }
      if (this.money < def.externalCost) {
        b.statusText = 'งบไม่พอซื้อสารบำบัด';
        return null;
      }
      b.inBuf.wastewater -= 1;
      this.money -= def.externalCost;
      this.stats.waterRecycled += 1;
      this._recordWaterEvent('recycled', 1);
      this.stats.moneySavedBySymbiosis += EXTERNAL_WATER_COST;
      return {
        duration: 6,
        grade: 'A',
        label: 'บำบัดน้ำเสีย 1 → คืนน้ำดิบ 1 (6 วิ)',
        outputs: { raw_water: 1 },
        waterInUse: 1,
      };
    }

    return null;
  }

  _finishProduction(b) {
    const def = BUILDINGS[b.typeId];
    const recipe = b.activeRecipe;
    b.producing = false;
    b.progress = 0;
    b.activeRecipe = null;
    b.totalProduced += 1;

    // Add by-products to output buffer
    for (const [resId, qty] of Object.entries(recipe.outputs)) {
      b.outBuf[resId] = (b.outBuf[resId] || 0) + qty;
    }

    // Handle Main Product → sell directly to market based on Grade (A > B > C)
    const prodId = def.mainProduct;
    if (prodId) {
      this.stats.productsMade[prodId] += 1;
      const price = PRODUCTS[prodId].basePrice[recipe.grade];
      this.money += price;
      this.score += recipe.grade === 'A' ? 35 : recipe.grade === 'B' ? 20 : 10;
      this._addFloat(b.gx + 1, b.gy, `+฿${price} (เกรด ${recipe.grade})`, '#15803d');
    }
  }

  _dispatchOutputs(b) {
    for (const resId of Object.keys(b.outBuf)) {
      while (b.outBuf[resId] >= 1) {
        const outLinks = this.links.filter((l) => l.fromId === b.id && l.resource === resId);
        if (outLinks.length === 0) break;

        // Least-loaded target first (with round-robin tie-breaker) for perfectly balanced splitting
        const startIdx = b.rrCursor[resId] || 0;
        let bestIdx = -1;
        let bestLoad = Infinity;

        for (let offset = 0; offset < outLinks.length; offset++) {
          const idx = (startIdx + offset) % outLinks.length;
          const link = outLinks[idx];
          const target = this.buildings.find((x) => x.id === link.toId);
          if (!target) continue;
          // Skip targets whose current mode doesn't consume this resource
          if (target.typeId === 'fertilizer' && target.mode === 'fresh_rush' && (resId === 'wastewater' || resId === 'organic_waste' || resId === 'bagasse')) {
            continue;
          }
          if (target.typeId === 'paper' && target.mode === 'virgin_pulp' && resId === 'bagasse') {
            continue;
          }
          const inTransit = this.packets
            .filter((p) => {
              const pl = this.links.find((x) => x.id === p.linkId);
              return pl && pl.toId === target.id && p.resource === resId;
            })
            .reduce((s, p) => s + p.amount, 0);
          const load = (target.inBuf[resId] || 0) + inTransit;
          if (load < 6 && load < bestLoad) {
            bestLoad = load;
            bestIdx = idx;
          }
        }

        if (bestIdx === -1) break;
        const chosenLink = outLinks[bestIdx];
        b.outBuf[resId] -= 1;
        b.rrCursor[resId] = (bestIdx + 1) % outLinks.length;
        this.packets.push({
          linkId: chosenLink.id,
          resource: resId,
          amount: 1,
          t: 0,
          isExternal: false,
        });
      }
    }
  }

  _handleOverflow(b) {
    const MAX_OUT = 4;
    for (const resId of Object.keys(b.outBuf)) {
      if (resId === 'raw_water') {
        // Recycled raw water never incurs a waste fee; cap buffer
        if (b.outBuf[resId] > 6) b.outBuf[resId] = 6;
        continue;
      }
      while (b.outBuf[resId] > MAX_OUT) {
        b.outBuf[resId] -= 1;
        const fee = WASTE_DISPOSAL_FEE[resId] || 15;
        this.money = Math.max(0, this.money - fee);
        this.stats.disposalFeesPaid += fee;
        if (RESOURCES[resId].category === 'water') {
          this.stats.waterWasted += 1;
          this._recordWaterEvent('wasted', 1);
        } else {
          this.stats.solidWasted += 1;
        }
        this._addFloat(b.gx + 1, b.gy + 0.5, `-฿${fee} กำจัด${RESOURCES[resId].name}เกินระบบ`, '#dc2626');
      }
    }
  }

  _spawnOrder(templateIdx = null) {
    let tpl;
    if (templateIdx !== null) {
      tpl = ORDER_TEMPLATES[templateIdx];
    } else {
      const available = ORDER_TEMPLATES.filter(
        (t) => !this.orders.some((o) => o.product === t.product && o.minGrade === t.minGrade)
      );
      const pool = available.length > 0 ? available : ORDER_TEMPLATES;
      tpl = pool[Math.floor(Math.random() * pool.length)];
    }
    this.orders.push({
      id: this.nextId++,
      product: tpl.product,
      minGrade: tpl.minGrade,
      qty: tpl.qty,
      delivered: 0,
      reward: tpl.reward,
      score: tpl.score,
      timeLeft: tpl.duration,
      duration: tpl.duration,
      tag: tpl.tag,
    });
  }

  _matchOrder(productId, grade) {
    const candidates = this.orders.filter(
      (o) =>
        o.product === productId &&
        GRADE_RANK[grade] >= GRADE_RANK[o.minGrade] &&
        o.delivered < o.qty
    );
    if (candidates.length === 0) return null;
    // Prioritize exact grade match first, then soonest deadline
    candidates.sort((a, b) => {
      const aExact = a.minGrade === grade ? 0 : 1;
      const bExact = b.minGrade === grade ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      return a.timeLeft - b.timeLeft;
    });
    return candidates[0];
  }

  _completeOrder(order) {
    this.money += order.reward;
    this.score += order.score;
    this.stats.ordersCompleted += 1;
    this.pushToast(
      `ส่งมอบคำสั่งซื้อ ${PRODUCTS[order.product].name} ครบจำนวน (+฿${order.reward})`,
      'success'
    );
    if (this.onOrderComplete) this.onOrderComplete();
    this.orders = this.orders.filter((o) => o.id !== order.id);
    this._spawnOrder();
  }

  _updateOrders(dt) {
    for (let i = this.orders.length - 1; i >= 0; i--) {
      const o = this.orders[i];
      o.timeLeft -= dt;
      if (o.timeLeft <= 0) {
        this.stats.ordersExpired += 1;
        this.orders.splice(i, 1);
        this._spawnOrder();
      }
    }
    while (this.orders.length < 3) {
      this._spawnOrder();
    }
  }

  // --- Analytics & Circularity Checks ---
  getWaterCircularity() {
    if (this.recentWaterEvents.length > 0) {
      const recycled = this.recentWaterEvents.filter((e) => e === 'recycled').length;
      return Math.round((recycled / this.recentWaterEvents.length) * 100);
    }
    const recycled = this.stats.waterRecycled;
    const total = recycled + this.stats.waterExternal + this.stats.waterWasted;
    if (total === 0) return 0;
    return Math.round((recycled / total) * 100);
  }

  hasActiveClosedWaterLoop() {
    // Check if there is a water cycle returning clean water via Treatment Plant OR Bio-Fertilizer (in circular mode)
    const reclaimers = this.buildings.filter(
      (b) => b.typeId === 'treatment' || (b.typeId === 'fertilizer' && b.mode !== 'fresh_rush')
    );
    for (const f of reclaimers) {
      const visited = new Set();
      const queue = [f.id];
      while (queue.length > 0) {
        const curr = queue.shift();
        const outs = this.links.filter((l) => l.fromId === curr && l.kind === 'pipe');
        for (const l of outs) {
          if (l.toId === f.id && l.resource === 'wastewater') return true;
          if (!visited.has(l.toId)) {
            visited.add(l.toId);
            queue.push(l.toId);
          }
        }
      }
    }
    return false;
  }

  getSymbiosisLinkCount() {
    return this.links.filter((l) => {
      const src = this.buildings.find((b) => b.id === l.fromId);
      return src && src.typeId !== 'water_intake';
    }).length;
  }

  _finalizeSessionScore() {
    const circ = this.getWaterCircularity();
    if (this.hasActiveClosedWaterLoop()) this.score += 500;
    if (circ >= 80) this.score += 300;
    this.score += Math.round(this.money * 0.1);
  }

  getEvaluationReport() {
    const circ = this.getWaterCircularity();
    const closedLoop = this.hasActiveClosedWaterLoop();
    const symLinks = this.getSymbiosisLinkCount();
    const totalScore = Math.round(this.score);
    const totalProducts = Object.values(this.stats.productsMade).reduce((a, b) => a + b, 0);

    // 3 Learning Mastery Pillars (0..100%)
    const waterMastery = closedLoop ? Math.max(70, circ) : Math.min(60, circ);
    const symbiosisMastery = Math.min(100, symLinks * 20 + Math.min(40, this.stats.solidReused * 5));
    const ecoEfficiency = Math.min(
      100,
      Math.max(
        10,
        Math.round(
          (this.stats.moneySavedBySymbiosis / Math.max(150, this.stats.moneySavedBySymbiosis + this.stats.disposalFeesPaid + 100)) * 100
        )
      )
    );

    const avgMastery = Math.round((waterMastery + symbiosisMastery + ecoEfficiency) / 3);
    let stars = 1;
    if (avgMastery >= 85 && closedLoop && circ >= 90 && this.stats.disposalFeesPaid <= 150) stars = 5;
    else if (avgMastery >= 65 && (closedLoop || circ >= 50)) stars = 4;
    else if (avgMastery >= 45) stars = 3;
    else if (avgMastery >= 25 || totalProducts >= 3) stars = 2;

    const masteryTitle =
      stars === 5
        ? 'ผู้เชี่ยวชาญนิคมอุตสาหกรรมเชิงนิเวศ (Eco-Symbiosis Master)'
        : stars === 4
        ? 'นักวางผังระบบหมุนเวียนระดับสูง'
        : stars === 3
        ? 'เข้าใจหลักการเชื่อมโยงทรัพยากรได้ดี'
        : stars === 2
        ? 'เริ่มต้นสร้างเครือข่ายอุตสาหกรรมแล้ว'
        : 'เพิ่งเริ่มต้นวางระบบ ลองเชื่อมท่อและสายพานเพิ่มดูนะ';

    const insights = [];
    if (closedLoop) {
      insights.push('ปิดวงจรน้ำสำเร็จ: คุณพิสูจน์แล้วว่าน้ำเสียจากโรงงานอาหารและกระดาษสามารถบำบัดคืนเป็นน้ำดิบได้จริงโดยไม่ต้องพึ่งน้ำธรรมชาติตลอดเวลา');
    } else {
      insights.push('แนวทางพัฒนา: ลองต่อท่อน้ำเสียเข้าโรงงานบำบัดน้ำหรือโรงงานปุ๋ยชีวภาพ แล้วส่งน้ำดิบคืนให้โรงงานน้ำตาลเพื่อปิดวงจรน้ำ 100%');
    }
    if (this.stats.solidReused > 0) {
      insights.push(`สร้างมูลค่าจากของเหลือใช้: คุณนำชานอ้อยและกากอินทรีย์กลับมาผลิตต่อได้ ${this.stats.solidReused} หน่วย ช่วยประหยัดต้นทุนวัตถุดิบใหม่ได้จริง`);
    } else {
      insights.push('แนวทางพัฒนา: ลองเชื่อมโรงงานน้ำตาลเข้ากับโรงงานกระดาษ (ส่งชานอ้อย) หรือโรงงานอาหารเข้ากับปุ๋ยชีวภาพ (ส่งกากอินทรีย์)');
    }
    if (this.stats.disposalFeesPaid === 0 && totalProducts > 0) {
      insights.push('บริหารสมดุลยอดเยี่ยม: ไม่มีของเสียล้นระบบจนต้องจ่ายค่ากำจัดทิ้งตลอดการจำลอง');
    } else if (this.stats.disposalFeesPaid > 0) {
      insights.push(`จุดสังเกตด้านสมดุล: เสียค่าบำบัดของเสียส่วนเกิน ฿${this.stats.disposalFeesPaid} ลองเพิ่มโรงงานบำบัดน้ำหรือขยายเส้นทางรับของเหลือให้สมดุลขึ้น`);
    }

    return {
      stars,
      masteryTitle,
      waterMastery,
      symbiosisMastery,
      ecoEfficiency,
      totalScore,
      totalProducts,
      waterCircularity: circ,
      closedLoop,
      symLinks,
      money: this.money,
      ...this.stats,
      insights,
    };
  }

  _addFloat(gx, gy, text, color) {
    if (this.isTimeSkipping && this.floatingTexts.length >= 10) return;
    this.floatingTexts.push({ x: gx, y: gy, text, color, age: 0, duration: this.isTimeSkipping ? 0.85 : 1.8 });
  }

  pushToast(message, type = 'info') {
    const ttl = type === 'error' ? 5.5 : type === 'success' ? 4.5 : 3.2;
    this.toasts.push({ id: this.nextId++, message, type, ttl });
    if (this.toasts.length > 2) this.toasts.shift();
  }
}
