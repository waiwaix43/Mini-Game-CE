// EcoLink Industrial Park — UI & Unified Mouse/Touch Controller (Theme 05)

import {
  RESOURCES,
  PRODUCTS,
  BUILDINGS,
  GRADE_INFO,
  TILE_SIZE,
} from './data.js';
import {
  ICONS,
  RESOURCE_ICON,
  PRODUCT_ICON,
  BUILDING_ICON,
} from './icons.js';
import { SimulationEngine } from './engine.js';
import { GameRenderer3D } from './renderer3d.js';
import { sfx } from './sound.js';

const engine = new SimulationEngine();
engine.paused = true; // Paused while reading the Welcome Briefing
engine.onOrderComplete = () => sfx.orderComplete();
let wasClosedLoop = false;
const canvas = document.getElementById('game-canvas');
const overlayEl = document.getElementById('world-overlay');
const renderer = new GameRenderer3D(canvas, overlayEl, engine);

// Hydrate static SVG icons (zero emojis in UI)
document.getElementById('ico-money').innerHTML = ICONS.money;
document.getElementById('ico-timer').innerHTML = ICONS.timer;
document.getElementById('ico-score').innerHTML = ICONS.score;
document.getElementById('btn-dismiss-guide').innerHTML = ICONS.close;
document.querySelectorAll('[data-svg]').forEach((el) => {
  el.innerHTML = ICONS[el.dataset.svg] || '';
});

// Hydrate Top-Center Visual Resource Legend
const elLegend = document.getElementById('resource-legend');
if (elLegend) {
  elLegend.innerHTML = Object.values(RESOURCES)
    .map(
      (r) =>
        `<span class="rl-item"><span class="rl-dot" style="background:${r.color}">${RESOURCE_ICON[r.id]}</span><span>${r.name}</span></span>`
    )
    .join('');
}

// Welcome Mission Briefing button
const elWelcomeModal = document.getElementById('welcome-modal');
document.getElementById('btn-start-game').addEventListener('click', () => {
  sfx.click();
  elWelcomeModal.classList.add('hidden');
  engine.paused = false;
  updateSpeedButtons();
});

// DOM references
const elMoney = document.getElementById('hud-money');
const elTimer = document.getElementById('hud-timer');
const elCircularity = document.getElementById('hud-circularity');
const elDialArc = document.getElementById('dial-arc');
const elLoopLed = document.getElementById('hud-loop-led');
const elLoopBadge = document.getElementById('hud-loop-badge');
const elFactories = document.getElementById('hud-factories');
const elScore = document.getElementById('hud-score');
const elToasts = document.getElementById('toast-container');
const elInspector = document.getElementById('inspector-panel');
const elToolHint = document.getElementById('tool-hint');
const elConnectPicker = document.getElementById('connect-picker');
const elGuideSteps = document.getElementById('guide-steps');
const elGuideCard = document.getElementById('guide-card');
const elGuideMascotImg = document.getElementById('guide-mascot-img');
const elFnDots = document.getElementById('fn-dots');
const btnMascotAvatar = document.getElementById('btn-mascot-avatar');
const elReopenGuide = document.getElementById('btn-reopen-guide');
const elPeekMascotImg = document.getElementById('peek-mascot-img');
const elPeekStepNum = document.getElementById('peek-step-num');
const elReportModal = document.getElementById('report-modal');
const elHelpModal = document.getElementById('help-modal');
const elTimeSkipOverlay = document.getElementById('timeskip-overlay');
const elTimeSkipFlash = document.getElementById('timeskip-flash');
const elTsMult = document.getElementById('ts-mult');
const elTsBarFill = document.getElementById('ts-bar-fill');
const btnSkipNow = document.getElementById('btn-skip-now');

const btnLegend = document.getElementById('btn-legend');
const btnSound = document.getElementById('btn-sound');
const btnRotate = document.getElementById('btn-rotate');
const btnFit = document.getElementById('btn-fit');
const btnHelp = document.getElementById('btn-help');
const btnFinish = document.getElementById('btn-finish');
const elNsStepNum = document.getElementById('ns-step-num');

if (btnLegend) {
  btnLegend.innerHTML = `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="7.5" cy="7.5" r="2.5"/><circle cx="16.5" cy="7.5" r="2.5"/><circle cx="7.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>`;
  btnLegend.addEventListener('click', (e) => {
    e.stopPropagation();
    sfx.click();
    if (!elLegend) return;
    const isOpen = elLegend.classList.toggle('is-open');
    btnLegend.classList.toggle('active', isOpen);
    btnLegend.setAttribute('aria-expanded', String(isOpen));
  });
  document.addEventListener('pointerdown', (e) => {
    if (!elLegend || !elLegend.classList.contains('is-open')) return;
    if (elLegend.contains(e.target) || btnLegend.contains(e.target)) return;
    elLegend.classList.remove('is-open');
    btnLegend.classList.remove('active');
    btnLegend.setAttribute('aria-expanded', 'false');
  });
}

btnSound.innerHTML = ICONS.soundOn;
btnRotate.innerHTML = ICONS.cycle;
btnFit.innerHTML = ICONS.center;
btnHelp.innerHTML = ICONS.book;

btnSound.addEventListener('click', () => {
  const muted = sfx.toggleMute();
  btnSound.innerHTML = muted ? ICONS.soundOff : ICONS.soundOn;
  if (!muted) sfx.click();
});

// Helper: keep mobile/desktop status banner single-slot so clicking tools never shifts/stacks banners
let guideDismissed = false;
let lastGuideCaseKey = '';

// Preload all 8 mascot poses for smooth, flicker-free cycling
const MASCOT_ALL_POSES = [
  './assets/mascot/mascot-01.png',
  './assets/mascot/mascot-02.png',
  './assets/mascot/mascot-03.png',
  './assets/mascot/mascot-04.png',
  './assets/mascot/mascot-05.png',
  './assets/mascot/mascot-06.png',
  './assets/mascot/mascot-07.png',
  './assets/mascot/mascot-08.png',
];
MASCOT_ALL_POSES.forEach((src) => {
  const img = new Image();
  img.src = src;
});

const prefersReducedMotion =
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const mascotAnimator = {
  poses: [
    './assets/mascot/mascot-04.png',
    './assets/mascot/mascot-03.png',
    './assets/mascot/mascot-06.png',
    './assets/mascot/mascot-01.png',
  ],
  poseIdx: 0,
  timer: 0,
  interval: 2.5,
  celebrating: false,
  applyPose(src, animClass = '') {
    const targets = [elGuideMascotImg, elPeekMascotImg];
    for (const el of targets) {
      if (!el) continue;
      el.src = src;
      if (animClass && !prefersReducedMotion) {
        el.classList.remove('is-swapping', 'is-posing');
        void el.offsetWidth;
        el.classList.add(animClass);
      }
    }
  },
  setPoses(poses, celebrate = false) {
    this.poses = Array.isArray(poses) && poses.length > 0 ? poses : [MASCOT_ALL_POSES[3]];
    this.poseIdx = 0;
    this.timer = 0;
    if (celebrate && !prefersReducedMotion) {
      this.celebrating = true;
      this.applyPose('./assets/mascot/mascot-08.png', 'is-swapping');
    } else {
      this.celebrating = false;
      this.applyPose(this.poses[0], celebrate ? 'is-swapping' : '');
    }
  },
  tick(dt) {
    if (prefersReducedMotion || this.poses.length <= 1) return;
    const guideVisible = elGuideCard && !elGuideCard.classList.contains('hidden');
    const peekVisible = elReopenGuide && !elReopenGuide.classList.contains('hidden');
    if (!guideVisible && !peekVisible) return;

    this.timer += dt;
    const targetDuration = this.celebrating ? 1.5 : this.interval;
    if (this.timer < targetDuration) return;

    this.timer = 0;
    if (this.celebrating) {
      this.celebrating = false;
      this.poseIdx = 0;
      this.applyPose(this.poses[0], 'is-posing');
      return;
    }

    this.poseIdx = (this.poseIdx + 1) % this.poses.length;
    this.applyPose(this.poses[this.poseIdx], 'is-posing');
  },
};

function syncBannerVisibility() {
  const toolActive = renderer.activeTool !== 'none';
  const inspectorOpen = !elInspector.classList.contains('hidden');
  const isCompact = window.innerWidth <= 768;
  const allSolved = engine.unlockedInsights.has('all_cases_solved');
  const canShowGuide = !allSolved && !toolActive && !(isCompact && inspectorOpen);
  elGuideCard.classList.toggle('hidden', guideDismissed || !canShowGuide);
  if (elReopenGuide) {
    elReopenGuide.classList.toggle('hidden', !guideDismissed || !canShowGuide);
  }
}

// --- Tool Selection (Click same active tool again or press Esc to cancel) ---
function setTool(toolId) {
  renderer.activeTool = toolId;
  renderer.linkSourceId = null;
  renderer.linkResourceId = null;
  elConnectPicker.classList.add('hidden');
  elConnectPicker.innerHTML = '';

  if (toolId !== 'inspect') {
    renderer.selectedBuildingId = null;
    elInspector.classList.add('hidden');
  }

  document.querySelectorAll('[data-tool]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tool === toolId);
  });

  if (toolId === 'none') {
    elToolHint.classList.add('hidden');
  } else if (toolId === 'inspect') {
    elToolHint.classList.remove('hidden');
    elToolHint.textContent = 'แตะโรงงานเพื่อดูคลัง ปรับสูตร และจัดการเส้นทาง (กดซ้ำเพื่อยกเลิก)';
  } else if (toolId === 'connect') {
    elToolHint.classList.remove('hidden');
    elToolHint.textContent = 'แตะโรงงานต้นทางที่ต้องการส่งทรัพยากรออก (กดซ้ำเพื่อยกเลิก)';
  } else if (toolId === 'demolish') {
    elToolHint.classList.remove('hidden');
    elToolHint.textContent = 'แตะโรงงานหรือเส้นทางที่ต้องการรื้อถอน (คืนงบ 50%) — กดซ้ำเพื่อยกเลิก';
  } else if (toolId.startsWith('build:')) {
    const def = BUILDINGS[toolId.split(':')[1]];
    elToolHint.classList.remove('hidden');
    elToolHint.textContent = `แตะพื้นที่ว่างเพื่อสร้าง${def.name} (฿${def.cost}) — กดซ้ำเพื่อยกเลิก`;
  }
  syncBannerVisibility();
}

document.querySelectorAll('[data-tool]').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (timeSkip.active || timeSkip.finishing) return;
    sfx.click();
    const targetTool = btn.dataset.tool;
    // Clicking the currently active button again cancels it!
    if (renderer.activeTool === targetTool) {
      setTool('none');
    } else {
      setTool(targetTool);
    }
  });
});

window.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!elHelpModal.classList.contains('hidden')) {
    sfx.click();
    elHelpModal.classList.add('hidden');
    return;
  }
  if (renderer.activeTool !== 'none') {
    sfx.click();
    setTool('none');
    return;
  }
  if (!elInspector.classList.contains('hidden')) {
    sfx.click();
    renderer.selectedBuildingId = null;
    elInspector.classList.add('hidden');
  }
});

elHelpModal.addEventListener('click', (e) => {
  if (e.target === elHelpModal) {
    sfx.click();
    elHelpModal.classList.add('hidden');
  }
});

// --- HUD Controls ---
btnRotate.addEventListener('click', () => renderer.rotateCameraStep());
btnFit.addEventListener('click', () => renderer.fitToViewport());
btnHelp.addEventListener('click', () => elHelpModal.classList.remove('hidden'));
document.getElementById('btn-close-help').addEventListener('click', () => elHelpModal.classList.add('hidden'));
function dismissGuideBanner() {
  guideDismissed = true;
  sfx.click();
  syncBannerVisibility();
}
document.getElementById('btn-dismiss-guide').addEventListener('click', dismissGuideBanner);
if (btnMascotAvatar) {
  btnMascotAvatar.addEventListener('click', dismissGuideBanner);
}
if (elReopenGuide) {
  elReopenGuide.addEventListener('click', () => {
    guideDismissed = false;
    sfx.click();
    syncBannerVisibility();
  });
}

// --- Live Animated Time Skip Evaluation Controller ---
const timeSkip = {
  active: false,
  finishing: false,
  startElapsed: 0,
  totalRemaining: 0,
  elapsedReal: 0,
  durationReal: 3.6,
  tickAccum: 0,
  finishTimer: null,
  smoothedMult: 1,
};

function startTimeSkip() {
  if (timeSkip.active || timeSkip.finishing) return;

  // In Sandbox mode or if timer already ended, open report immediately
  if (engine.sandboxMode || engine.sessionEnded || engine.timeElapsed >= engine.sessionDuration) {
    updateHUD();
    showReportModal(0);
    return;
  }

  // Lock tools & close inspector while keeping 3D camera orbit/pan active
  setTool('none');
  renderer.selectedBuildingId = null;
  elInspector.classList.add('hidden');
  elHelpModal.classList.add('hidden');

  const rem = Math.max(0, engine.sessionDuration - engine.timeElapsed);
  timeSkip.active = true;
  timeSkip.finishing = false;
  timeSkip.startElapsed = engine.timeElapsed;
  timeSkip.totalRemaining = rem;
  timeSkip.elapsedReal = 0;
  timeSkip.durationReal = Math.min(4.2, Math.max(1.5, 1.5 + rem / 220));
  timeSkip.tickAccum = 0;
  timeSkip.smoothedMult = 1;

  engine.isTimeSkipping = true;
  engine.paused = false;

  document.body.classList.add('is-timeskipping');
  if (elTimeSkipOverlay) elTimeSkipOverlay.classList.remove('hidden');
  if (elTsBarFill) elTsBarFill.style.width = '0%';
  if (elTsMult) elTsMult.textContent = '×1';

  renderer.setTimeSkipVisual(true, 0.35);
  sfx.timeSkipStart();
}

function finishTimeSkip(instant = false) {
  if (!timeSkip.active) return;

  if (instant || !engine.sessionEnded) {
    engine.fastForwardToEnd(timeSkip.totalRemaining);
  } else {
    engine.floatingTexts = [];
    engine.stats.fastForwardedSeconds = Math.round(timeSkip.totalRemaining);
  }

  timeSkip.active = false;
  timeSkip.finishing = true;
  engine.isTimeSkipping = false;

  if (elTsBarFill) elTsBarFill.style.width = '100%';
  if (elTimeSkipOverlay) elTimeSkipOverlay.classList.add('hidden');
  renderer.setTimeSkipVisual(false, 0);

  // Refresh HUD immediately so player sees 00:00 and final numbers settle
  updateHUD();

  if (elTimeSkipFlash) {
    elTimeSkipFlash.classList.remove('fire');
    void elTimeSkipFlash.offsetWidth;
    elTimeSkipFlash.classList.add('fire');
  }
  sfx.timeSkipComplete();

  const delayMs = instant ? 180 : 440;
  const skippedSec = Math.round(timeSkip.totalRemaining);
  timeSkip.finishTimer = setTimeout(() => {
    timeSkip.finishTimer = null;
    timeSkip.finishing = false;
    document.body.classList.remove('is-timeskipping');
    renderer.resetTimeSkipVisual();
    updateHUD();
    showReportModal(skippedSec);
  }, delayMs);
}

function resetTimeSkipState() {
  if (timeSkip.finishTimer) {
    clearTimeout(timeSkip.finishTimer);
    timeSkip.finishTimer = null;
  }
  timeSkip.active = false;
  timeSkip.finishing = false;
  engine.isTimeSkipping = false;
  document.body.classList.remove('is-timeskipping');
  if (elTimeSkipOverlay) elTimeSkipOverlay.classList.add('hidden');
  if (elTimeSkipFlash) elTimeSkipFlash.classList.remove('fire');
  renderer.resetTimeSkipVisual();
}

btnFinish.addEventListener('click', () => {
  sfx.click();
  startTimeSkip();
});

if (btnSkipNow) {
  btnSkipNow.addEventListener('click', () => {
    sfx.click();
    finishTimeSkip(true);
  });
}

document.getElementById('btn-continue-sandbox').addEventListener('click', () => {
  resetTimeSkipState();
  engine.sandboxMode = true;
  engine.sessionEnded = false;
  engine.paused = false;
  elReportModal.classList.add('hidden');
  updateSpeedButtons();
  engine.pushToast('เข้าสู่โหมด Sandbox อิสระแล้ว', 'info');
});

document.getElementById('btn-restart').addEventListener('click', () => {
  resetTimeSkipState();
  engine.reset();
  wasClosedLoop = false;
  renderer.selectedBuildingId = null;
  renderer.linkSourceId = null;
  renderer.linkResourceId = null;
  elInspector.classList.add('hidden');
  elReportModal.classList.add('hidden');
  guideDismissed = false;
  lastGuideCaseKey = '';
  syncBannerVisibility();
  setTool('none');
  updateSpeedButtons();
  renderer.fitToViewport();
});

function updateSpeedButtons() {
  // Pause/speed switches removed from timer HUD
}

// --- Unified 3D Tap & Hover Events (OrbitControls handles Pan/Zoom/Rotate) ---
let downPos = null;
let downButton = 0;
const activePointers = new Set();
let wasMultiTouch = false;

canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

canvas.addEventListener('pointerdown', (e) => {
  activePointers.add(e.pointerId);
  if (activePointers.size > 1) {
    wasMultiTouch = true;
    downPos = null;
    return;
  }
  wasMultiTouch = false;
  downPos = { x: e.clientX, y: e.clientY, id: e.pointerId, type: e.pointerType };
  downButton = e.button;
});

canvas.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'touch') return;
  const rect = canvas.getBoundingClientRect();
  const world = renderer.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
  renderer.pointerWorld = world;
  renderer.hoverTile = renderer.worldToTile(world.x, world.y);
});

canvas.addEventListener('pointercancel', (e) => {
  activePointers.delete(e.pointerId);
  if (downPos && downPos.id === e.pointerId) downPos = null;
  if (activePointers.size === 0) wasMultiTouch = false;
});

canvas.addEventListener('pointerup', (e) => {
  activePointers.delete(e.pointerId);
  if (wasMultiTouch) {
    if (activePointers.size === 0) wasMultiTouch = false;
    downPos = null;
    return;
  }
  if (!downPos || downPos.id !== e.pointerId) return;
  const moved = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
  const pointerType = downPos.type;
  downPos = null;
  const tapSlop = pointerType === 'touch' ? 14 : 8;
  if (moved > tapSlop) return; // Was a camera pan/orbit drag, not a tap

  const rect = canvas.getBoundingClientRect();
  const world = renderer.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);

  // Quick right-click inspects building directly
  if (downButton === 2) {
    if (timeSkip.active || timeSkip.finishing) return;
    const { gx, gy } = renderer.worldToTile(world.x, world.y);
    const b = engine.getBuildingAt(gx, gy);
    if (b) {
      setTool('inspect');
      renderer.selectedBuildingId = b.id;
      renderInspector();
    }
    return;
  }

  if (timeSkip.active || timeSkip.finishing) return;
  handleCanvasTap(world, pointerType);
});

function renderConnectPicker(sourceBuilding) {
  const def = BUILDINGS[sourceBuilding.typeId];
  const allOutputs = [...def.outputsWater, ...def.outputsSolid];
  elConnectPicker.innerHTML = `
    <span class="cp-label">เลือกทรัพยากรจาก${def.shortName}:</span>
    ${allOutputs
      .map((resId) => {
        const res = RESOURCES[resId];
        const picked = renderer.linkSourceId === sourceBuilding.id && renderer.linkResourceId === resId;
        return `<button class="cp-btn ${picked ? 'picked' : ''}" data-cp-res="${resId}" style="--res-col:${res.color}">
          <span class="cp-dot" style="background:${res.color}">${RESOURCE_ICON[resId]}</span>
          <span>${res.name}</span>
        </button>`;
      })
      .join('')}
    <button class="cp-cancel" id="btn-cp-cancel">ยกเลิก</button>
  `;
  elConnectPicker.classList.remove('hidden');

  elConnectPicker.querySelectorAll('[data-cp-res]').forEach((btn) => {
    btn.addEventListener('click', () => {
      sfx.click();
      const resId = btn.dataset.cpRes;
      if (renderer.linkSourceId === sourceBuilding.id && renderer.linkResourceId === resId) {
        renderer.linkResourceId = null;
        elToolHint.textContent = `เลือกชนิดทรัพยากรจาก${def.shortName}ด้านล่าง เพื่อเชื่อมต่อไปยังโรงงานปลายทาง`;
      } else {
        renderer.linkSourceId = sourceBuilding.id;
        renderer.linkResourceId = resId;
        const r = RESOURCES[resId];
        elToolHint.textContent = `กำลังส่ง "${r.name}" จาก${def.shortName} — คลิกโรงงานปลายทางที่เหมาะสม`;
      }
      renderConnectPicker(sourceBuilding);
    });
  });

  document.getElementById('btn-cp-cancel').addEventListener('click', () => {
    sfx.click();
    renderer.linkSourceId = null;
    renderer.linkResourceId = null;
    elConnectPicker.classList.add('hidden');
    elToolHint.textContent = 'โหมดเชื่อมเส้นทาง: คลิกโรงงานต้นทางที่ต้องการส่งทรัพยากรออก (กดซ้ำหรือ Esc เพื่อยกเลิก)';
  });
}

function armConnectFromBuilding(b) {
  const def = BUILDINGS[b.typeId];
  const allOutputs = [...def.outputsWater, ...def.outputsSolid];
  if (allOutputs.length === 0) {
    sfx.error();
    engine.pushToast(`${def.shortName} ไม่มีผลพลอยได้หรือทรัพยากรส่งออก`, 'error');
    return;
  }
  sfx.click();
  renderer.linkSourceId = b.id;
  if (allOutputs.length === 1) {
    renderer.linkResourceId = allOutputs[0];
    elConnectPicker.classList.add('hidden');
    const r = RESOURCES[allOutputs[0]];
    elToolHint.classList.remove('hidden');
    elToolHint.textContent = `กำลังส่ง "${r.name}" จาก${def.shortName} — คลิกโรงงานปลายทางที่เหมาะสม`;
  } else {
    renderer.linkResourceId = null;
    elToolHint.classList.remove('hidden');
    elToolHint.textContent = `เลือกชนิดทรัพยากรจาก${def.shortName}ด้านล่าง แล้วคลิกโรงงานปลายทาง`;
    renderConnectPicker(b);
  }
}

function handleCanvasTap(world, pointerType = 'mouse') {
  const { gx, gy } = renderer.worldToTile(world.x, world.y);
  const tool = renderer.activeTool;

  // Neutral camera/view mode: tap a building to inspect directly, tap empty ground to close
  if (tool === 'none') {
    const b = engine.getBuildingAt(gx, gy);
    if (b) {
      sfx.click();
      renderer.selectedBuildingId = b.id;
      renderInspector();
    } else if (renderer.selectedBuildingId) {
      renderer.selectedBuildingId = null;
      elInspector.classList.add('hidden');
      syncBannerVisibility();
    }
    return;
  }

  if (tool.startsWith('build:')) {
    const typeId = tool.split(':')[1];
    const res = engine.placeBuilding(typeId, gx, gy);
    if (!res.ok) {
      sfx.error();
      engine.pushToast(res.reason, 'error');
    } else {
      sfx.placeBuilding();
    }
    return;
  }

  if (tool === 'demolish') {
    const b = engine.getBuildingAt(gx, gy);
    if (b) {
      const res = engine.demolishBuilding(b.id);
      if (!res.ok) {
        sfx.error();
        engine.pushToast(res.reason, 'error');
      } else {
        sfx.demolish();
      }
      if (renderer.selectedBuildingId === b.id) {
        renderer.selectedBuildingId = null;
        renderer.linkSourceId = null;
        elInspector.classList.add('hidden');
      }
      return;
    }
    const nearLink = findNearestLink(world.x, world.y, pointerType === 'touch' ? 0.72 : 0.45);
    if (nearLink) {
      sfx.demolish();
      engine.demolishLink(nearLink.id);
    }
    return;
  }

  // SEPARATED INSPECT MODE: strictly view details, change recipe modes, manage links
  if (tool === 'inspect') {
    const b = engine.getBuildingAt(gx, gy);
    if (!b) {
      renderer.selectedBuildingId = null;
      elInspector.classList.add('hidden');
      return;
    }
    sfx.click();
    renderer.selectedBuildingId = b.id;
    renderInspector();
    return;
  }

  // SEPARATED CONNECT MODE: pick source factory → pick resource → click target factory
  if (tool === 'connect') {
    const b = engine.getBuildingAt(gx, gy);
    if (!b) {
      renderer.linkSourceId = null;
      renderer.linkResourceId = null;
      elConnectPicker.classList.add('hidden');
      elToolHint.textContent = 'โหมดเชื่อมเส้นทาง: คลิกโรงงานต้นทางที่ต้องการส่งทรัพยากรออก (กดซ้ำหรือ Esc เพื่อยกเลิก)';
      return;
    }

    // If a source + resource is armed and player clicked a different factory → create link!
    if (renderer.linkSourceId && renderer.linkResourceId && renderer.linkSourceId !== b.id) {
      const res = engine.createSpecificLink(renderer.linkSourceId, b.id, renderer.linkResourceId);
      if (res.ok) {
        if (RESOURCES[renderer.linkResourceId].category === 'water') sfx.connectPipe();
        else sfx.connectRoad();
        renderer.linkSourceId = null;
        renderer.linkResourceId = null;
        elConnectPicker.classList.add('hidden');
        elToolHint.textContent = 'เชื่อมต่อสำเร็จ! คลิกโรงงานต้นทางถัดไป หรือกดปุ่มเชื่อมซ้ำเพื่อยกเลิก';
        return;
      } else if (!res.alreadyLinked) {
        sfx.error();
        engine.pushToast(res.reason, 'error');
        // Keep resource armed so player can try another target factory immediately
        return;
      } else {
        engine.pushToast(res.reason, 'info');
        return;
      }
    }

    // Clicking the same source factory again clears selection
    if (renderer.linkSourceId === b.id) {
      sfx.click();
      renderer.linkSourceId = null;
      renderer.linkResourceId = null;
      elConnectPicker.classList.add('hidden');
      elToolHint.textContent = 'โหมดเชื่อมเส้นทาง: คลิกโรงงานต้นทางที่ต้องการส่งทรัพยากรออก (กดซ้ำหรือ Esc เพื่อยกเลิก)';
      return;
    }

    armConnectFromBuilding(b);
  }
}

function findNearestLink(wx, wy, maxDist) {
  let best = null;
  let bestD = maxDist;
  for (const link of engine.links) {
    const pts = link.path;
    for (let i = 1; i < pts.length; i++) {
      const d = distToSegment(wx, wy, pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
      if (d < bestD) {
        bestD = d;
        best = link;
      }
    }
  }
  return best;
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

// --- Factory Inspector Panel ---
function renderInspector() {
  const b = engine.buildings.find((x) => x.id === renderer.selectedBuildingId);
  if (!b) {
    elInspector.classList.add('hidden');
    syncBannerVisibility();
    return;
  }
  const def = BUILDINGS[b.typeId];
  elInspector.classList.remove('hidden');
  syncBannerVisibility();

  const inLinks = engine.links.filter((l) => l.toId === b.id);
  const outLinks = engine.links.filter((l) => l.fromId === b.id);

  const acceptList = [...def.acceptsWater, ...def.acceptsSolid]
    .map(
      (r) =>
        `<span class="chip" style="border-color:${RESOURCES[r].color}"><span style="color:${RESOURCES[r].color}">${RESOURCE_ICON[r]}</span>${RESOURCES[r].name} (<b class="mono" data-in-buf="${r}">${b.inBuf[r] || 0}</b>)</span>`
    )
    .join('') || '<span class="muted">ไม่มี</span>';

  const allOutputs = [...def.outputsWater, ...def.outputsSolid];
  const outputChips = allOutputs
    .map(
      (r) =>
        `<span class="chip" style="border-color:${RESOURCES[r].color}"><span style="color:${RESOURCES[r].color}">${RESOURCE_ICON[r]}</span>${RESOURCES[r].name} (<b class="mono" data-out-buf="${r}">${b.outBuf[r] || 0}</b>)</span>`
    )
    .join('') || '<span class="muted">ไม่มีผลพลอยได้ส่งออก</span>';

  const progPct = b.producing ? Math.min(100, Math.round((b.progress / b.cycleDuration) * 100)) : 0;

  const modeHtml =
    def.modes && def.modes.length > 1
      ? `<div class="insp-section">
          <div class="insp-label">รูปแบบการผลิต</div>
          <div class="mode-list">
            ${def.modes
              .map(
                (m) => `
              <button class="mode-btn ${b.mode === m.id ? 'active' : ''}" data-mode="${m.id}">
                <strong>${m.label}</strong>
                <small>${m.desc}</small>
              </button>`
              )
              .join('')}
          </div>
        </div>`
      : '';

  const linksHtml = [...inLinks, ...outLinks]
    .map((l) => {
      const otherId = l.fromId === b.id ? l.toId : l.fromId;
      const other = engine.buildings.find((x) => x.id === otherId);
      const dir = l.fromId === b.id ? 'ส่งต่อไปยัง' : 'รับมาจาก';
      const res = RESOURCES[l.resource];
      return `<div class="link-row">
        <span>${dir} <b>${other ? BUILDINGS[other.typeId].shortName : ''}</b> (${res.name})</span>
        <button class="btn-mini-del" data-unlink="${l.id}">ยกเลิก</button>
      </div>`;
    })
    .join('');

  elInspector.dataset.buildingId = String(b.id);
  elInspector.dataset.linkCount = String(inLinks.length + outLinks.length);
  elInspector.innerHTML = `
    <div class="insp-header">
      <div class="insp-title">
        <span class="insp-icon">${BUILDING_ICON[b.typeId]}</span>
        <div>
          <h3>${def.name}</h3>
          <div class="insp-status" id="insp-live-status">${b.statusText}</div>
        </div>
      </div>
      <button class="btn-icon-close" id="btn-close-insp" aria-label="ปิดหน้าต่าง">${ICONS.close}</button>
    </div>
    <p class="insp-desc">${def.description}</p>
    ${
      def.mainProduct
        ? `<div class="insp-meta">
            <span>ผลิตภัณฑ์หลัก: <b>${PRODUCTS[def.mainProduct].name}</b></span>
            <span>ยอดผลิตสะสม: <b class="mono" id="insp-live-produced">${b.totalProduced}</b></span>
          </div>
          <div class="insp-prog-wrap">
            <div class="insp-prog-head"><span>ความคืบหน้ารอบผลิต</span><b class="mono" id="insp-live-pct">${progPct}%</b></div>
            <div class="insp-prog-track"><div class="insp-prog-fill" id="insp-live-bar" style="width:${progPct}%"></div></div>
          </div>`
        : ''
    }
    <div class="insp-section">
      <div class="insp-label">วัตถุดิบคงคลัง (ขาเข้า)</div>
      <div class="chip-row">${acceptList}</div>
    </div>
    <div class="insp-section">
      <div class="insp-label">ผลพลอยได้ / ทรัพยากรส่งออก (ขาออก)</div>
      <div class="chip-row">${outputChips}</div>
      ${
        allOutputs.length > 0
          ? `<button class="btn-connect-shortcut" id="btn-insp-connect">${ICONS.connect}<span>เชื่อมเส้นทางส่งออกจากโรงงานนี้</span></button>`
          : ''
      }
    </div>
    ${modeHtml}
    ${
      linksHtml
        ? `<div class="insp-section">
            <div class="insp-label">เส้นทางเชื่อมโยงปัจจุบัน</div>
            <div class="link-list">${linksHtml}</div>
          </div>`
        : ''
    }
    ${
      def.demolishable
        ? `<button class="btn-danger-full" id="btn-demolish-selected">${ICONS.demolish}<span>รื้อถอนโรงงาน (คืนงบ ฿${Math.round(def.cost * 0.5)})</span></button>`
        : ''
    }
  `;

  document.getElementById('btn-close-insp').addEventListener('click', () => {
    renderer.selectedBuildingId = null;
    elInspector.classList.add('hidden');
    syncBannerVisibility();
  });

  const btnInspConn = document.getElementById('btn-insp-connect');
  if (btnInspConn) {
    btnInspConn.addEventListener('click', () => {
      setTool('connect');
      armConnectFromBuilding(b);
    });
  }

  elInspector.querySelectorAll('[data-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      engine.setBuildingMode(b.id, btn.dataset.mode);
      renderInspector();
    });
  });

  elInspector.querySelectorAll('[data-unlink]').forEach((btn) => {
    btn.addEventListener('click', () => {
      engine.demolishLink(Number(btn.dataset.unlink));
      renderInspector();
    });
  });

  const btnDem = document.getElementById('btn-demolish-selected');
  if (btnDem) {
    btnDem.addEventListener('click', () => {
      engine.demolishBuilding(b.id);
      renderer.selectedBuildingId = null;
      elInspector.classList.add('hidden');
    });
  }
}

// --- HUD Refresh ---
let uiAccum = 0;
function updateHUD() {
  elMoney.textContent = `฿${Math.round(engine.money).toLocaleString()}`;
  elScore.textContent = `${Math.round(engine.score).toLocaleString()}`;

  if (engine.sandboxMode) {
    elTimer.textContent = 'Sandbox';
  } else {
    const rem = Math.max(0, Math.ceil(engine.sessionDuration - engine.timeElapsed));
    const m = Math.floor(rem / 60);
    const s = rem % 60;
    elTimer.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  const circ = engine.getWaterCircularity();
  const closed = engine.hasActiveClosedWaterLoop();
  if (closed && !wasClosedLoop) {
    sfx.closedLoop();
    engine.pushToast('ปิดวงจรน้ำสำเร็จ! ระบบเริ่มหมุนเวียนน้ำกลับคืนแล้ว', 'success');
  }
  wasClosedLoop = closed;
  elCircularity.textContent = `${circ}%`;
  const circumference = 157.08;
  elDialArc.style.strokeDashoffset = String(circumference * (1 - circ / 100));
  elDialArc.classList.toggle('closed', closed);
  elLoopLed.className = closed ? 'led-indicator closed' : 'led-indicator';
  elLoopBadge.textContent = closed ? 'ปิดวงจรน้ำ 100%' : 'ระบบน้ำเปิด';
  elLoopBadge.className = closed ? 'loop-text closed' : 'loop-text open';

  // Update 5-factory coverage in top-left plaque & count badges on build keys
  const factoryTypes = ['sugar', 'food', 'paper', 'fertilizer', 'treatment'];
  let builtDistinct = 0;
  for (const ft of factoryTypes) {
    const cnt = engine.buildings.filter((b) => b.typeId === ft).length;
    if (cnt > 0) builtDistinct++;
    const badge = document.querySelector(`[data-bcount="${ft}"]`);
    if (badge) {
      badge.textContent = `×${cnt}`;
      badge.classList.toggle('hidden', cnt === 0);
    }
  }
  if (elFactories) {
    elFactories.textContent = `โรงงาน ${builtDistinct}/5`;
  }

  elToasts.innerHTML = engine.toasts
    .map((t) => `<div class="toast toast-${t.type}">${t.message}</div>`)
    .join('');

  if (!engine.unlockedInsights.has('all_cases_solved')) {
    const hasHotToFood = engine.links.some((l) => {
      const t = engine.buildings.find((b) => b.id === l.toId);
      return l.resource === 'hot_water' && t && t.typeId === 'food';
    });
    const hasBagasseToPaper = engine.links.some((l) => {
      const t = engine.buildings.find((b) => b.id === l.toId);
      return l.resource === 'bagasse' && t && t.typeId === 'paper';
    });
    const hasOrgToFert = engine.links.some((l) => {
      const t = engine.buildings.find((b) => b.id === l.toId);
      return l.resource === 'organic_waste' && t && t.typeId === 'fertilizer';
    });
    const hasWasteToTreatment = engine.links.some((l) => {
      const t = engine.buildings.find((b) => b.id === l.toId);
      return l.resource === 'wastewater' && t && t.typeId === 'treatment';
    });
    const hasClosed = engine.hasActiveClosedWaterLoop();
    const cases = [
      {
        done: hasHotToFood,
        poses: [
          './assets/mascot/mascot-04.png',
          './assets/mascot/mascot-03.png',
          './assets/mascot/mascot-06.png',
          './assets/mascot/mascot-01.png',
        ],
        text: 'ปัญหาเวลาผลิตช้า: โรงงานอาหารต้มลวกช้า (12 วิ) — เชื่อม "น้ำร้อน" จากโรงงานน้ำตาลเพื่อลดเวลาเหลือ 8 วิ',
      },
      {
        done: hasBagasseToPaper,
        poses: [
          './assets/mascot/mascot-05.png',
          './assets/mascot/mascot-06.png',
          './assets/mascot/mascot-04.png',
          './assets/mascot/mascot-02.png',
        ],
        text: 'ปัญหาต้นทุนเยื่อไม้แพง (฿45/รอบ): เชื่อม "ชานอ้อย" จากโรงงานน้ำตาลไปโรงงานกระดาษแทนเยื่อไม้ใหม่',
      },
      {
        done: hasOrgToFert,
        poses: [
          './assets/mascot/mascot-06.png',
          './assets/mascot/mascot-04.png',
          './assets/mascot/mascot-05.png',
          './assets/mascot/mascot-08.png',
        ],
        text: 'ปัญหาปุ๋ยคุณภาพต่ำ (เกรด C): เชื่อม "กากอินทรีย์" และ "น้ำเสีย" เข้าโรงงานปุ๋ยชีวภาพเพื่อยกระดับเป็นเกรด A',
      },
      {
        done: hasWasteToTreatment,
        poses: [
          './assets/mascot/mascot-07.png',
          './assets/mascot/mascot-05.png',
          './assets/mascot/mascot-06.png',
          './assets/mascot/mascot-04.png',
        ],
        text: 'ปัญหาน้ำเสียเกินกำลังปุ๋ยชีวภาพ: สร้าง "โรงงานบำบัดน้ำ" รับน้ำเสียส่วนเกินเพื่อกรองคืนเป็นน้ำดิบสะอาด (6 วิ)',
      },
      {
        done: hasClosed,
        poses: [
          './assets/mascot/mascot-02.png',
          './assets/mascot/mascot-08.png',
          './assets/mascot/mascot-03.png',
          './assets/mascot/mascot-04.png',
        ],
        text: 'ปิดวงจรน้ำ 100%: ส่ง "น้ำดิบ" ที่บำบัดแล้วจากโรงงานบำบัดน้ำและปุ๋ยชีวภาพกลับไปโรงงานน้ำตาล',
      },
    ];
    const nextIdx = cases.findIndex((c) => !c.done);
    if (nextIdx === -1) {
      engine.unlockedInsights.add('all_cases_solved');
      engine.score += 300;
      sfx.closedLoop();
      engine.pushToast('ยอดเยี่ยม! ใช้งานครบทั้ง 5 โรงงานและแก้โจทย์ครบ 5 เคสแล้ว (+300 คะแนน)', 'success');
      lastGuideCaseKey = 'done';
      syncBannerVisibility();
    } else {
      const caseKey = `${nextIdx}:${cases.map((c) => (c.done ? '1' : '0')).join('')}`;
      if (caseKey !== lastGuideCaseKey) {
        const prevIdx = lastGuideCaseKey ? Number(lastGuideCaseKey.split(':')[0]) : -1;
        lastGuideCaseKey = caseKey;
        const activeCase = cases[nextIdx];
        elNsStepNum.textContent = `เคสปัญหา ${nextIdx + 1}/5`;
        elGuideSteps.textContent = activeCase.text;
        if (elPeekStepNum) elPeekStepNum.textContent = `เคส ${nextIdx + 1}/5`;
        const didAdvanceCase = prevIdx !== -1 && prevIdx !== nextIdx;
        mascotAnimator.setPoses(activeCase.poses, didAdvanceCase);
        if (elFnDots) {
          const dots = elFnDots.children;
          for (let i = 0; i < dots.length; i++) {
            dots[i].classList.toggle('done', Boolean(cases[i] && cases[i].done));
            dots[i].classList.toggle('active', i === nextIdx);
          }
        }
      }
    }
  }

  // Update open inspector values in-place (zero button detachment)
  if (renderer.selectedBuildingId && !elInspector.classList.contains('hidden')) {
    const b = engine.buildings.find((x) => x.id === renderer.selectedBuildingId);
    if (!b) {
      elInspector.classList.add('hidden');
    } else {
      const linkCount = engine.links.filter((l) => l.fromId === b.id || l.toId === b.id).length;
      if (
        elInspector.dataset.buildingId !== String(b.id) ||
        elInspector.dataset.linkCount !== String(linkCount)
      ) {
        renderInspector();
      } else {
        const st = document.getElementById('insp-live-status');
        if (st) st.textContent = b.statusText;
        const pr = document.getElementById('insp-live-produced');
        if (pr) pr.textContent = String(b.totalProduced);
        const pct = b.producing ? Math.min(100, Math.round((b.progress / b.cycleDuration) * 100)) : 0;
        const pctEl = document.getElementById('insp-live-pct');
        if (pctEl) pctEl.textContent = `${pct}%`;
        const barEl = document.getElementById('insp-live-bar');
        if (barEl) barEl.style.width = `${pct}%`;
        elInspector.querySelectorAll('[data-in-buf]').forEach((el) => {
          el.textContent = String(b.inBuf[el.dataset.inBuf] || 0);
        });
        elInspector.querySelectorAll('[data-out-buf]').forEach((el) => {
          el.textContent = String(b.outBuf[el.dataset.outBuf] || 0);
        });
      }
    }
  }

  if (
    engine.sessionEnded &&
    !engine.sandboxMode &&
    !timeSkip.active &&
    !timeSkip.finishing &&
    elReportModal.classList.contains('hidden')
  ) {
    showReportModal();
  }
}

function showReportModal(simulatedSeconds = 0) {
  const rep = engine.getEvaluationReport();
  document.getElementById('report-mastery-title').textContent = rep.masteryTitle;
  document.getElementById('report-stars').innerHTML = Array.from({ length: 5 }, (_, i) =>
    i < rep.stars ? ICONS.starFull : ICONS.starEmpty
  ).join('');
  document.getElementById('report-score').textContent = rep.totalScore.toLocaleString();

  document.getElementById('m-water-val').textContent = `${rep.waterMastery}%`;
  document.getElementById('m-water-fill').style.width = `${rep.waterMastery}%`;
  document.getElementById('m-sym-val').textContent = `${rep.symbiosisMastery}%`;
  document.getElementById('m-sym-fill').style.width = `${rep.symbiosisMastery}%`;
  document.getElementById('m-eco-val').textContent = `${rep.ecoEfficiency}%`;
  document.getElementById('m-eco-fill').style.width = `${rep.ecoEfficiency}%`;

  document.getElementById('report-circ').textContent = `${rep.waterCircularity}%`;
  document.getElementById('report-saved').textContent = `฿${rep.moneySavedBySymbiosis.toLocaleString()}`;
  document.getElementById('report-orders').textContent = `${rep.totalProducts} ชิ้น`;
  document.getElementById('report-solid').textContent = `${rep.solidReused} หน่วย`;

  const breakdownEl = document.getElementById('report-factory-breakdown');
  if (breakdownEl && rep.productsMade) {
    const items = [
      ['น้ำตาล', rep.productsMade.sugar || 0],
      ['อาหาร', rep.productsMade.food || 0],
      ['กล่อง', rep.productsMade.box || 0],
      ['ปุ๋ยชีวภาพ', rep.productsMade.fertilizer || 0],
      ['น้ำรีไซเคิล', rep.productsMade.reclaimed_water || 0],
    ];
    breakdownEl.innerHTML = items
      .map(([name, val]) => `<div class="rb-pill"><span>${name}</span><b class="mono">${val}</b></div>`)
      .join('');
  }

  document.getElementById('report-insights').innerHTML = rep.insights
    .map((txt) => `<li>${txt}</li>`)
    .join('');
  elReportModal.classList.remove('hidden');
}

// --- Main Loop ---
let lastTime = performance.now();
function loop(now) {
  const dt = Math.min(0.1, (now - lastTime) / 1000);
  lastTime = now;

  if (timeSkip.active) {
    timeSkip.elapsedReal += dt;
    const u = Math.min(1, timeSkip.elapsedReal / timeSkip.durationReal);
    // Smooth ramp-up & crisp landing curve
    const eased = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
    const targetElapsed = timeSkip.startElapsed + timeSkip.totalRemaining * eased;
    const simDelta = Math.max(0, targetElapsed - engine.timeElapsed);

    engine.advanceSimulatedTime(simDelta, dt);

    const rawMult = dt > 0.001 ? simDelta / dt : 1;
    timeSkip.smoothedMult += (rawMult - timeSkip.smoothedMult) * 0.25;

    const bell = Math.sin(u * Math.PI);
    renderer.setTimeSkipVisual(true, 0.32 + bell * 0.68);

    if (elTsMult) elTsMult.textContent = `×${Math.max(1, Math.round(timeSkip.smoothedMult))}`;
    if (elTsBarFill) elTsBarFill.style.width = `${(u * 100).toFixed(1)}%`;

    timeSkip.tickAccum += dt;
    const tickInterval = 0.145 - bell * 0.06;
    if (timeSkip.tickAccum >= tickInterval) {
      timeSkip.tickAccum = 0;
      sfx.timeSkipTick(bell);
    }

    renderer.render(dt);
    updateHUD();

    if (u >= 1 || engine.sessionEnded) {
      finishTimeSkip(false);
    }
  } else {
    engine.update(dt);
    renderer.render(dt);
    mascotAnimator.tick(dt);

    uiAccum += dt;
    if (uiAccum >= 0.2) {
      uiAccum = 0;
      updateHUD();
    }
  }

  requestAnimationFrame(loop);
}

function handleViewportResize(refit = false) {
  renderer.resize();
  if (refit) renderer.fitToViewport();
}

window.addEventListener('resize', () => handleViewportResize(false));
window.addEventListener('orientationchange', () => {
  setTimeout(() => handleViewportResize(true), 140);
});
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => handleViewportResize(false));
}

renderer.resize();
renderer.fitToViewport();
setTool('none');
updateSpeedButtons();
updateHUD();
requestAnimationFrame(loop);
