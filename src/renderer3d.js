// EcoLink Industrial Park — Realistic 3D Three.js Renderer (Theme 05 Daylight Eco-Industrial)

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  GRID_COLS,
  GRID_ROWS,
  RIVER_COLS,
  RESOURCES,
  BUILDINGS,
} from './data.js';
import { RESOURCE_ICON } from './icons.js';
import { createTextures } from './textures.js';
import {
  createMaterialLibrary,
  buildRealisticFactory,
  buildRealisticTree,
} from './models3d.js';

const GRADE_COLORS = {
  A: '#15803d',
  B: '#0284c7',
  C: '#d97706',
};

export class GameRenderer3D {
  constructor(canvas, overlayEl, engine) {
    this.canvas = canvas;
    this.overlayEl = overlayEl;
    this.engine = engine;
    this.animTime = 0;

    this.hoverTile = null;
    this.activeTool = 'none';
    this.selectedBuildingId = null;
    this.linkSourceId = null;
    this.linkResourceId = null;
    this.pointerWorld = null;

    // Time-Skip 3D time-lapse state
    this.timeSkipActive = false;
    this.timeSkipIntensity = 0; // 0..1 target intensity
    this._timeSkipBlend = 0; // smoothed 0..1 visual blend
    this._timeSkipCycle = 0; // sun/sky day-night phase
    this._baseFov = 38;
    this._baseSkyColor = new THREE.Color('#c7e6df');
    this._baseSunColor = new THREE.Color('#fff8ec');
    this._baseHemiSky = new THREE.Color('#f0fdfa');
    this._baseHemiGround = new THREE.Color('#5c8276');
    this._tmpColorA = new THREE.Color();
    this._tmpColorB = new THREE.Color();
    this._skyPalette = [
      { sky: new THREE.Color('#c7e6df'), sun: new THREE.Color('#fff8ec'), hemiSky: new THREE.Color('#f0fdfa'), sunInt: 2.3, hemiInt: 0.95 }, // Bright Day
      { sky: new THREE.Color('#f5c99b'), sun: new THREE.Color('#ff9d5c'), hemiSky: new THREE.Color('#ffedd5'), sunInt: 2.0, hemiInt: 0.82 }, // Golden Sunset
      { sky: new THREE.Color('#27425c'), sun: new THREE.Color('#7dd3fc'), hemiSky: new THREE.Color('#64748b'), sunInt: 0.95, hemiInt: 0.58 }, // Cool Twilight
      { sky: new THREE.Color('#f7d9b5'), sun: new THREE.Color('#ffd391'), hemiSky: new THREE.Color('#fef3c7'), sunInt: 1.95, hemiInt: 0.85 }, // Crisp Dawn
    ];

    // Scene & Warm Sunlit Eco-Park Atmosphere
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#c7e6df');
    this.scene.fog = new THREE.Fog('#c7e6df', 44, 96);
    this.clouds = [];

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.04;

    // Environment reflection map for realistic metallic silos, pipes & glass
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.65;
    pmrem.dispose();

    // Textures & Material Library
    this.textures = createTextures();
    this.mats = createMaterialLibrary(this.textures);

    // Camera & City-Builder OrbitControls
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.5, 110);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI * 0.43;
    this.controls.minPolarAngle = Math.PI * 0.14;
    this.controls.minDistance = 6.5;
    this.controls.maxDistance = 30;
    this.controls.screenSpacePanning = false;
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.PAN,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.ROTATE,
    };
    this.controls.touches = {
      ONE: THREE.TOUCH.PAN,
      TWO: THREE.TOUCH.DOLLY_ROTATE,
    };

    this.raycaster = new THREE.Raycaster();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    this.buildingMeshes = new Map();
    this.linkMeshes = new Map();
    this.packetMeshes = new Map();
    this.labelEls = new Map();
    this.linkLabelEls = new Map();
    this.floatEls = new Map();

    // Placement Ghost Preview
    this.ghostGroup = new THREE.Group();
    this.ghostGroup.visible = false;
    this.ghostBox = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 1.05, 1.9),
      new THREE.MeshStandardMaterial({
        color: '#0d9488',
        transparent: true,
        opacity: 0.38,
        roughness: 0.35,
      })
    );
    this.ghostBox.position.y = 0.525;
    this.ghostGroup.add(this.ghostBox);
    this.scene.add(this.ghostGroup);

    const prevGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(),
      new THREE.Vector3(),
    ]);
    this.previewLine = new THREE.Line(
      prevGeo,
      new THREE.LineBasicMaterial({ color: '#0d9488', linewidth: 2 })
    );
    this.previewLine.visible = false;
    this.scene.add(this.previewLine);

    this._setupLights();
    this._buildTerrain();
    this.resize();
    this.fitToViewport();
  }

  _setupLights() {
    this.hemiLight = new THREE.HemisphereLight('#f0fdfa', '#5c8276', 0.95);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight('#fff8ec', 2.3);
    this.sunLight.position.set(16, 23, 14);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.camera.near = 4;
    this.sunLight.shadow.camera.far = 60;
    this.sunLight.shadow.camera.left = -14;
    this.sunLight.shadow.camera.right = 14;
    this.sunLight.shadow.camera.top = 12;
    this.sunLight.shadow.camera.bottom = -12;
    this.sunLight.shadow.bias = -0.0004;
    this.sunLight.shadow.normalBias = 0.028;
    this.scene.add(this.sunLight);

    this.fillLight = new THREE.DirectionalLight('#5eead4', 0.48);
    this.fillLight.position.set(-12, 9, -8);
    this.scene.add(this.fillLight);
  }

  setTimeSkipVisual(active, intensity = 0) {
    this.timeSkipActive = active;
    this.timeSkipIntensity = active ? Math.max(0, Math.min(1, intensity)) : 0;
  }

  resetTimeSkipVisual() {
    this.timeSkipActive = false;
    this.timeSkipIntensity = 0;
    this._timeSkipBlend = 0;
    this._timeSkipCycle = 0;
    this.scene.background.copy(this._baseSkyColor);
    if (this.scene.fog) this.scene.fog.color.copy(this._baseSkyColor);
    if (this.sunLight) {
      this.sunLight.position.set(16, 23, 14);
      this.sunLight.color.copy(this._baseSunColor);
      this.sunLight.intensity = 2.3;
    }
    if (this.hemiLight) {
      this.hemiLight.color.copy(this._baseHemiSky);
      this.hemiLight.intensity = 0.95;
    }
    if (this.camera.fov !== this._baseFov) {
      this.camera.fov = this._baseFov;
      this.camera.updateProjectionMatrix();
    }
  }

  _buildTerrain() {
    const group = new THREE.Group();

    // 1. Textured Eco-Industrial Park Terrain Slab
    const landW = GRID_COLS - RIVER_COLS;
    const landGeo = new THREE.BoxGeometry(landW, 1.0, GRID_ROWS);
    const landMat = new THREE.MeshStandardMaterial({
      map: this.textures.grassTerrain,
      roughness: 0.9,
      metalness: 0.02,
    });
    const landMesh = new THREE.Mesh(landGeo, landMat);
    landMesh.position.set(RIVER_COLS + landW / 2, -0.5, GRID_ROWS / 2);
    landMesh.receiveShadow = true;
    group.add(landMesh);

    // Architectural Dark-Teal Diorama Cutaway Plinth
    const skirtGeo = new THREE.BoxGeometry(GRID_COLS + 0.16, 0.58, GRID_ROWS + 0.16);
    const skirtMat = new THREE.MeshStandardMaterial({
      color: '#064e4b',
      roughness: 0.82,
    });
    const skirt = new THREE.Mesh(skirtGeo, skirtMat);
    skirt.position.set(GRID_COLS / 2, -1.06, GRID_ROWS / 2);
    group.add(skirt);

    // Subtle Architectural Plot Grid Lines
    const gridVerts = [];
    for (let x = RIVER_COLS; x <= GRID_COLS; x++) {
      gridVerts.push(x, 0.012, 0, x, 0.012, GRID_ROWS);
    }
    for (let z = 0; z <= GRID_ROWS; z++) {
      gridVerts.push(RIVER_COLS, 0.012, z, GRID_COLS, 0.012, z);
    }
    const gridGeo = new THREE.BufferGeometry();
    gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(gridVerts, 3));
    group.add(
      new THREE.LineSegments(
        gridGeo,
        new THREE.LineBasicMaterial({ color: '#065f5b', transparent: true, opacity: 0.12 })
      )
    );

    // 2. Recessed Flowing 3D River with Animated Scrolling Water Texture
    const bed = new THREE.Mesh(
      new THREE.BoxGeometry(RIVER_COLS, 0.4, GRID_ROWS),
      new THREE.MeshStandardMaterial({ color: '#043836', roughness: 0.92 })
    );
    bed.position.set(RIVER_COLS / 2, -0.78, GRID_ROWS / 2);
    bed.receiveShadow = true;
    group.add(bed);

    const waterGeo = new THREE.PlaneGeometry(RIVER_COLS, GRID_ROWS, 8, 24);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      map: this.textures.riverTex,
      roughness: 0.14,
      metalness: 0.35,
      transparent: true,
      opacity: 0.9,
    });
    this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterMesh.position.set(RIVER_COLS / 2, -0.2, GRID_ROWS / 2);
    this.waterMesh.receiveShadow = true;
    group.add(this.waterMesh);

    // 3. Detailed Concrete Quay Wall + Riverside Steel Guardrails & Eco Lamp Posts
    const quay = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.68, GRID_ROWS),
      this.mats.concrete
    );
    quay.position.set(RIVER_COLS, -0.25, GRID_ROWS / 2);
    quay.receiveShadow = true;
    quay.castShadow = true;
    group.add(quay);

    // Promenade concrete walkway edge
    const walk = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.03, GRID_ROWS),
      this.mats.concreteDark
    );
    walk.position.set(RIVER_COLS + 0.16, 0.015, GRID_ROWS / 2);
    walk.receiveShadow = true;
    group.add(walk);

    // Riverside safety bollards & modern park street lamps (avoiding Water Intake zone z=4..6)
    for (const lz of [0.8, 2.6, 7.4, 9.2]) {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.03, 0.72, 8),
        this.mats.darkSteel
      );
      pole.position.set(RIVER_COLS + 0.18, 0.36, lz);
      pole.castShadow = true;
      group.add(pole);

      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.025, 0.04),
        this.mats.darkSteel
      );
      arm.position.set(RIVER_COLS + 0.1, 0.72, lz);
      group.add(arm);

      const lamp = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.025, 0.05),
        new THREE.MeshStandardMaterial({ color: '#fef9c3', emissive: '#fef08a', emissiveIntensity: 0.6 })
      );
      lamp.position.set(RIVER_COLS + 0.04, 0.7, lz);
      group.add(lamp);
    }

    // 4. Concrete Access Avenue along North Perimeter + EcoLink 05 Entrance Arch
    const roadW = GRID_COLS - RIVER_COLS - 0.4;
    const road = new THREE.Mesh(
      new THREE.BoxGeometry(roadW, 0.035, 0.72),
      new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.88 })
    );
    road.position.set(RIVER_COLS + roadW / 2 + 0.18, 0.018, 0.38);
    road.receiveShadow = true;
    group.add(road);

    // Crisp white road lane dashes
    const dashMat = new THREE.MeshBasicMaterial({ color: '#f8fafc' });
    for (let dx = RIVER_COLS + 0.7; dx < GRID_COLS - 0.5; dx += 0.9) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.05), dashMat);
      dash.position.set(dx, 0.02, 0.38);
      group.add(dash);
    }

    // Architectural Eco-Park Entrance Gate on the east end of the avenue
    for (const gz of [0.06, 0.7]) {
      const pillar = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.62, 0.12),
        this.mats.tealTank
      );
      pillar.position.set(GRID_COLS - 0.55, 0.31, gz);
      pillar.castShadow = true;
      group.add(pillar);
    }
    const archBeam = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.14, 0.84),
      this.mats.tealDome
    );
    archBeam.position.set(GRID_COLS - 0.55, 0.64, 0.38);
    archBeam.castShadow = true;
    group.add(archBeam);

    // 5. Layered Realistic Park Trees & Hedges along perimeter
    const treeSpots = [
      [15.45, 1.35, 1.05], [15.5, 2.25, 0.82], [15.45, 8.55, 0.92], [15.4, 9.45, 1.12],
      [2.65, 9.52, 1.02], [4.2, 9.56, 0.86], [6.4, 9.54, 0.96], [9.2, 9.56, 0.88],
      [11.6, 9.54, 1.06], [13.8, 9.55, 0.9], [15.5, 5.2, 0.94],
    ];
    for (const [tx, tz, sc] of treeSpots) {
      const tree = buildRealisticTree(this.mats, sc);
      tree.position.set(tx, 0, tz);
      group.add(tree);
    }

    // 6. Soft Drifting Low-Poly Daylight Clouds in Distant Sky
    const cloudMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 1,
      transparent: true,
      opacity: 0.72,
    });
    const cloudConfigs = [
      [-2, 3.6, -2.8, 0.9],
      [6, 4.2, -3.5, 1.1],
      [14, 3.8, -3.0, 0.95],
      [19, 3.4, 2.5, 0.85],
    ];
    for (const [cx, cy, cz, sc] of cloudConfigs) {
      const cg = new THREE.Group();
      for (const [ox, oy, oz, r] of [
        [0, 0, 0, 0.95],
        [-0.85, -0.1, 0.1, 0.68],
        [0.9, -0.08, -0.1, 0.72],
        [0.2, 0.35, 0, 0.62],
      ]) {
        const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), cloudMat);
        puff.position.set(ox, oy, oz);
        cg.add(puff);
      }
      cg.position.set(cx, cy, cz);
      cg.scale.setScalar(sc);
      this.scene.add(cg);
      this.clouds.push(cg);
    }

    this.scene.add(group);
  }

  fitToViewport() {
    const rect = this.canvas.getBoundingClientRect();
    const aspect = rect.width > 0 && rect.height > 0 ? rect.width / rect.height : 16 / 9;

    const isPortraitOrNarrow = aspect < 1.25;
    const isShortLandscape = rect.height > 0 && rect.height < 520 && aspect >= 1.25;

    const cx = isPortraitOrNarrow ? GRID_COLS / 2 - 0.1 : GRID_COLS / 2 + 0.4;
    const cz = isShortLandscape ? GRID_ROWS / 2 + 0.85 : GRID_ROWS / 2 + 0.2;

    // Adapt camera distance so the entire Eco-Park (including river pump station) fits cleanly
    let distScale = 1.0;
    if (isPortraitOrNarrow) {
      distScale = Math.min(3.4, Math.max(1.05, 1.68 / Math.max(aspect, 0.42)));
    } else if (isShortLandscape) {
      distScale = 1.18;
    }

    this.controls.maxDistance = Math.max(36, 18 * distScale * 1.5);
    this.controls.target.set(cx, 0.1, cz);
    this.camera.position.set(
      cx + (isPortraitOrNarrow ? 1.1 : 2.0) * distScale,
      11.8 * distScale,
      cz + 12.2 * distScale
    );
    this.controls.update();
  }

  rotateCameraStep() {
    const offset = this.camera.position.clone().sub(this.controls.target);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 4);
    this.camera.position.copy(this.controls.target).add(offset);
    this.controls.update();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    this.camera.aspect = rect.width / rect.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(rect.width, rect.height, false);
  }

  screenToWorld(sx, sy) {
    const rect = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      (sx / rect.width) * 2 - 1,
      -(sy / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    const hit = new THREE.Vector3();
    const ok = this.raycaster.ray.intersectPlane(this.groundPlane, hit);
    if (!ok) return { x: -999, y: -999 };
    return { x: hit.x, y: hit.z };
  }

  worldToTile(wx, wz) {
    return { gx: Math.floor(wx), gy: Math.floor(wz) };
  }

  _createLinkMesh(link) {
    const group = new THREE.Group();
    const res = RESOURCES[link.resource];
    const y = link.kind === 'pipe' ? 0.34 : 0.14;
    const pts = link.path.map((p) => new THREE.Vector3(p.x, y, p.y));

    if (link.kind === 'pipe') {
      // Realistic industrial pipeline: colored sight-core + metallic flanges & H-frame pipe stanchions
      const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.08);
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 40, 0.085, 12, false),
        new THREE.MeshStandardMaterial({
          color: res.color,
          emissive: res.color,
          emissiveIntensity: 0.16,
          roughness: 0.25,
          metalness: 0.55,
        })
      );
      tube.castShadow = true;
      tube.receiveShadow = true;
      group.add(tube);

      // Metallic flange rings & H-frame steel support stanchions at bends/midpoints
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1];
        const b = pts[i];
        const len = a.distanceTo(b);
        if (len < 0.2) continue;
        const mid = a.clone().add(b).multiplyScalar(0.5);

        // Steel support leg + base plate
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.025, 0.032, y, 8),
          this.mats.darkSteel
        );
        post.position.set(mid.x, y / 2, mid.z);
        post.castShadow = true;
        group.add(post);

        const base = new THREE.Mesh(
          new THREE.BoxGeometry(0.14, 0.03, 0.14),
          this.mats.concreteDark
        );
        base.position.set(mid.x, 0.015, mid.z);
        group.add(base);

        // Bolted stainless collar flange
        const collar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.115, 0.115, 0.05, 12),
          this.mats.steelClean
        );
        collar.position.copy(mid);
        collar.lookAt(b);
        collar.rotateX(Math.PI / 2);
        collar.castShadow = true;
        group.add(collar);
      }
    } else {
      // Realistic steel-framed industrial conveyor belt with side rails & support legs
      const railMat = this.mats.darkSteel;
      const beltMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.85 });
      const accentMat = new THREE.MeshStandardMaterial({ color: res.color, roughness: 0.45 });

      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1];
        const b = pts[i];
        const dist = a.distanceTo(b);
        if (dist < 0.05) continue;
        const mid = a.clone().add(b).multiplyScalar(0.5);

        const segGroup = new THREE.Group();
        segGroup.position.copy(mid);
        segGroup.lookAt(b);

        // Belt bed
        const belt = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, dist + 0.14), beltMat);
        belt.castShadow = true;
        belt.receiveShadow = true;
        segGroup.add(belt);

        // Left & right steel side rails
        for (const rx of [-0.135, 0.135]) {
          const rail = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.11, dist + 0.16), railMat);
          rail.position.set(rx, 0.02, 0);
          rail.castShadow = true;
          segGroup.add(rail);
        }

        // Center resource stripe
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.068, dist + 0.08), accentMat);
        segGroup.add(stripe);

        // Support stanchion under midpoint
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.24, y, 0.05), railMat);
        leg.position.set(0, -y / 2, 0);
        segGroup.add(leg);

        group.add(segGroup);
      }
    }

    this.scene.add(group);
    return group;
  }

  _syncScene() {
    // 1. Sync Buildings
    const aliveBIds = new Set(this.engine.buildings.map((b) => b.id));
    for (const [id, entry] of this.buildingMeshes) {
      if (!aliveBIds.has(id)) {
        this.scene.remove(entry.group);
        this.buildingMeshes.delete(id);
        const lbl = this.labelEls.get(id);
        if (lbl) {
          lbl.remove();
          this.labelEls.delete(id);
        }
      }
    }
    for (const b of this.engine.buildings) {
      if (!this.buildingMeshes.has(b.id)) {
        const entry = buildRealisticFactory(b, this.mats);
        this.scene.add(entry.group);
        this.buildingMeshes.set(b.id, entry);
      }
    }

    // 2. Sync Links
    const aliveLIds = new Set(this.engine.links.map((l) => l.id));
    for (const [id, mesh] of this.linkMeshes) {
      if (!aliveLIds.has(id)) {
        this.scene.remove(mesh);
        this.linkMeshes.delete(id);
        const ll = this.linkLabelEls.get(id);
        if (ll) {
          ll.remove();
          this.linkLabelEls.delete(id);
        }
      }
    }
    for (const l of this.engine.links) {
      if (!this.linkMeshes.has(l.id)) {
        this.linkMeshes.set(l.id, this._createLinkMesh(l));
      }
    }

    // 3. Sync Moving 3D Packets
    const alivePackets = new Set(this.engine.packets);
    for (const [p, mesh] of this.packetMeshes) {
      if (!alivePackets.has(p)) {
        this.scene.remove(mesh);
        this.packetMeshes.delete(p);
      }
    }
    for (const p of this.engine.packets) {
      let mesh = this.packetMeshes.get(p);
      const link = this.engine.links.find((l) => l.id === p.linkId);
      if (!link) continue;
      if (!mesh) {
        const res = RESOURCES[p.resource];
        if (link.kind === 'pipe') {
          mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.13, 14, 14),
            new THREE.MeshStandardMaterial({
              color: res.color,
              emissive: res.color,
              emissiveIntensity: 0.65,
              roughness: 0.15,
              metalness: 0.2,
            })
          );
        } else {
          // Strapped bale / industrial bin
          mesh = new THREE.Group();
          const box = new THREE.Mesh(
            new THREE.BoxGeometry(0.22, 0.16, 0.22),
            new THREE.MeshStandardMaterial({ color: res.color, roughness: 0.72 })
          );
          box.castShadow = true;
          mesh.add(box);
          const strap = new THREE.Mesh(
            new THREE.BoxGeometry(0.23, 0.04, 0.23),
            this.mats.darkSteel
          );
          mesh.add(strap);
        }
        this.scene.add(mesh);
        this.packetMeshes.set(p, mesh);
      }
      const pos = this._pointOnPath(link.path, p.t);
      mesh.position.set(pos.x, link.kind === 'pipe' ? 0.36 : 0.26, pos.y);
    }
  }

  _updateOverlayLabels() {
    const rect = this.canvas.getBoundingClientRect();
    const tmp = new THREE.Vector3();

    for (const b of this.engine.buildings) {
      let el = this.labelEls.get(b.id);
      if (!el) {
        el = document.createElement('div');
        el.className = 'world-label';
        this.overlayEl.appendChild(el);
        this.labelEls.set(b.id, el);
      }

      const labelY = b.typeId === 'water_intake' ? 1.35 : b.typeId === 'sugar' ? 2.05 : 1.55;
      tmp.set(b.gx + b.size / 2, labelY, b.gy + b.size / 2);
      tmp.project(this.camera);

      if (tmp.z > 1) {
        el.style.display = 'none';
        continue;
      }
      const sx = (tmp.x * 0.5 + 0.5) * rect.width;
      const sy = (-tmp.y * 0.5 + 0.5) * rect.height;
      el.style.display = 'flex';
      el.style.transform = `translate(-50%, -100%) translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px)`;

      const def = BUILDINGS[b.typeId];
      const ratio = b.producing ? Math.min(100, Math.round((b.progress / b.cycleDuration) * 100)) : 0;
      const grade = b.producing && b.activeRecipe ? b.activeRecipe.grade : null;
      const bufs = Object.entries(b.inBuf)
        .filter(([, v]) => v > 0)
        .slice(0, 3)
        .map(
          ([r, v]) =>
            `<span class="wl-buf" style="background:${RESOURCES[r].color}"><span class="wl-buf-ico">${RESOURCE_ICON[r]}</span>${v}</span>`
        )
        .join('');

      // No auto-spoiler target hints: players use their own Industrial Symbiosis knowledge!
      el.innerHTML = `
        <div class="wl-head">
          <span class="wl-name">${def.shortName}</span>
          ${grade ? `<span class="wl-grade" style="background:${GRADE_COLORS[grade]}">${grade}</span>` : ''}
        </div>
        ${
          b.typeId !== 'water_intake'
            ? `<div class="wl-bar"><div class="wl-fill" style="width:${ratio}%;background:${grade ? GRADE_COLORS[grade] : '#0d9488'}"></div></div>`
            : ''
        }
        ${bufs ? `<div class="wl-bufs">${bufs}</div>` : ''}
      `;
    }

    // Clear Color-Coded Resource Badges at the midpoint of every Pipe & Conveyor
    for (const l of this.engine.links) {
      let el = this.linkLabelEls.get(l.id);
      if (!el) {
        const res = RESOURCES[l.resource];
        el = document.createElement('div');
        el.className = 'pipe-tag';
        el.style.borderColor = res.color;
        el.innerHTML = `<span class="pt-dot" style="background:${res.color}">${RESOURCE_ICON[l.resource]}</span><span>${res.name}</span>`;
        this.overlayEl.appendChild(el);
        this.linkLabelEls.set(l.id, el);
      }
      const labelT = l.kind === 'pipe' ? 0.38 : 0.64;
      const mid = this._pointOnPath(l.path, labelT);
      tmp.set(mid.x, l.kind === 'pipe' ? 0.56 : 0.34, mid.y);
      tmp.project(this.camera);
      if (tmp.z > 1) {
        el.style.display = 'none';
      } else {
        const sx = (tmp.x * 0.5 + 0.5) * rect.width;
        const sy = (-tmp.y * 0.5 + 0.5) * rect.height;
        el.style.display = 'inline-flex';
        el.style.transform = `translate(-50%, -50%) translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px)`;
      }
    }

    const aliveFloats = new Set(this.engine.floatingTexts);
    for (const [f, el] of this.floatEls) {
      if (!aliveFloats.has(f)) {
        el.remove();
        this.floatEls.delete(f);
      }
    }
    for (const f of this.engine.floatingTexts) {
      let el = this.floatEls.get(f);
      if (!el) {
        el = document.createElement('div');
        el.className = 'world-float';
        el.textContent = f.text;
        el.style.color = f.color === '#fde047' ? '#b45309' : f.color === '#4ade80' ? '#15803d' : f.color;
        this.overlayEl.appendChild(el);
        this.floatEls.set(f, el);
      }
      tmp.set(f.x, 1.75 + f.age * 0.9, f.y);
      tmp.project(this.camera);
      const sx = (tmp.x * 0.5 + 0.5) * rect.width;
      const sy = (-tmp.y * 0.5 + 0.5) * rect.height;
      el.style.opacity = String(Math.max(0, 1 - f.age / f.duration));
      el.style.transform = `translate(-50%, -50%) translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px)`;
    }
  }

  render(dt) {
    // Smoothly blend Time-Skip visual intensity
    const targetBlend = this.timeSkipActive ? Math.max(0.25, this.timeSkipIntensity) : 0;
    const lerpRate = this.timeSkipActive ? 7.5 : 5.5;
    this._timeSkipBlend += (targetBlend - this._timeSkipBlend) * Math.min(1, dt * lerpRate);
    if (!this.timeSkipActive && this._timeSkipBlend < 0.005) {
      this._timeSkipBlend = 0;
    }

    const visualSpeed = 1 + this._timeSkipBlend * 11;
    this.animTime += dt * (1 + this._timeSkipBlend * 4.5);
    this.controls.update();
    this._syncScene();

    // Time-Lapse Sun, Sky & Subtle FOV Warp during Time Skip
    if (this._timeSkipBlend > 0.001) {
      this._timeSkipCycle += dt * (1.2 + this._timeSkipBlend * 2.8);
      const pal = this._skyPalette;
      const phase = ((this._timeSkipCycle % pal.length) + pal.length) % pal.length;
      const idxA = Math.floor(phase);
      const idxB = (idxA + 1) % pal.length;
      const frac = phase - idxA;

      this._tmpColorA.copy(pal[idxA].sky).lerp(pal[idxB].sky, frac);
      this.scene.background.copy(this._baseSkyColor).lerp(this._tmpColorA, this._timeSkipBlend);
      if (this.scene.fog) this.scene.fog.color.copy(this.scene.background);

      if (this.sunLight) {
        const sunAngle = this._timeSkipCycle * (Math.PI / 2);
        const cx = 8;
        const cz = 5;
        const sx = cx + Math.cos(sunAngle) * 18;
        const sy = 10 + Math.abs(Math.sin(sunAngle)) * 16;
        const sz = cz + Math.sin(sunAngle) * 15;
        this.sunLight.position.set(
          16 + (sx - 16) * this._timeSkipBlend,
          23 + (sy - 23) * this._timeSkipBlend,
          14 + (sz - 14) * this._timeSkipBlend
        );
        this._tmpColorB.copy(pal[idxA].sun).lerp(pal[idxB].sun, frac);
        this.sunLight.color.copy(this._baseSunColor).lerp(this._tmpColorB, this._timeSkipBlend);
        const targetSunInt = pal[idxA].sunInt + (pal[idxB].sunInt - pal[idxA].sunInt) * frac;
        this.sunLight.intensity = 2.3 + (targetSunInt - 2.3) * this._timeSkipBlend;
      }

      if (this.hemiLight) {
        this._tmpColorB.copy(pal[idxA].hemiSky).lerp(pal[idxB].hemiSky, frac);
        this.hemiLight.color.copy(this._baseHemiSky).lerp(this._tmpColorB, this._timeSkipBlend);
        const targetHemiInt = pal[idxA].hemiInt + (pal[idxB].hemiInt - pal[idxA].hemiInt) * frac;
        this.hemiLight.intensity = 0.95 + (targetHemiInt - 0.95) * this._timeSkipBlend;
      }

      const targetFov = this._baseFov + this._timeSkipBlend * 3.8;
      if (Math.abs(this.camera.fov - targetFov) > 0.02) {
        this.camera.fov = targetFov;
        this.camera.updateProjectionMatrix();
      }
    } else if (this.camera.fov !== this._baseFov) {
      this.resetTimeSkipVisual();
    }

    // Animate river current flow & drifting sky clouds
    if (this.textures.riverTex) {
      this.textures.riverTex.offset.y -= dt * 0.22 * visualSpeed;
    }
    for (const c of this.clouds) {
      c.position.x += dt * 0.28 * visualSpeed;
      if (c.position.x > 26) c.position.x = -10;
    }

    // Animate buildings (pop-in, selection rings, turbines/fans/agitators, steam)
    for (const b of this.engine.buildings) {
      const entry = this.buildingMeshes.get(b.id);
      if (!entry) continue;

      if (entry.spawnAge < 0.24) {
        entry.spawnAge = Math.min(0.24, entry.spawnAge + dt);
        const s = 0.72 + 0.28 * (entry.spawnAge / 0.24);
        entry.group.scale.set(s, s, s);
      }

      const isSelected = b.id === this.selectedBuildingId;
      const isSource = b.id === this.linkSourceId;

      if (isSelected || isSource) {
        entry.ring.visible = true;
        entry.ring.material.color.set(isSource ? '#d97706' : '#065f5b');
        const pulse = 1 + Math.sin(this.animTime * 5) * 0.035;
        entry.ring.scale.set(pulse, pulse, 1);
      } else {
        entry.ring.visible = false;
      }

      const rotorSpeed = (b.typeId === 'water_intake' || b.producing ? 3.4 : 0.4) * (1 + this._timeSkipBlend * 5.5);
      for (const r of entry.rotors) {
        r.rotation.y += dt * rotorSpeed;
      }

      for (const puff of entry.steamPuffs) {
        puff.visible = b.producing;
        if (b.producing) {
          const t = (this.animTime * 0.5 + puff.userData.phase) % 1;
          puff.position.set(
            puff.userData.baseX + t * 0.34,
            puff.userData.baseY + t * 0.95,
            puff.userData.baseZ - t * 0.16
          );
          const sc = 0.55 + t * 1.25;
          puff.scale.set(sc, sc, sc);
          puff.material.opacity = 0.65 * (1 - t);
        }
      }
    }

    // Placement ghost preview
    if (this.activeTool.startsWith('build:') && this.hoverTile) {
      const typeId = this.activeTool.split(':')[1];
      const def = BUILDINGS[typeId];
      const check = this.engine.canPlaceBuilding(typeId, this.hoverTile.gx, this.hoverTile.gy);
      this.ghostGroup.visible = true;
      this.ghostGroup.position.set(
        this.hoverTile.gx + def.size / 2,
        0,
        this.hoverTile.gy + def.size / 2
      );
      this.ghostBox.material.color.set(check.ok ? '#0d9488' : '#dc2626');
    } else {
      this.ghostGroup.visible = false;
    }

    // Connection preview line colored by the SPECIFIC leftover resource the player picked!
    if (this.linkSourceId && this.linkResourceId && this.pointerWorld && this.activeTool === 'connect') {
      const src = this.engine.buildings.find((b) => b.id === this.linkSourceId);
      if (src) {
        const resColor = RESOURCES[this.linkResourceId]?.color || '#0d9488';
        this.previewLine.visible = true;
        this.previewLine.material.color.set(resColor);
        const arr = this.previewLine.geometry.attributes.position.array;
        arr[0] = src.gx + src.size / 2;
        arr[1] = 0.45;
        arr[2] = src.gy + src.size / 2;
        arr[3] = this.pointerWorld.x;
        arr[4] = 0.45;
        arr[5] = this.pointerWorld.y;
        this.previewLine.geometry.attributes.position.needsUpdate = true;
      }
    } else {
      this.previewLine.visible = false;
    }

    this.renderer.render(this.scene, this.camera);
    this._updateOverlayLabels();
  }

  _pointOnPath(path, t) {
    let total = 0;
    const segs = [];
    for (let i = 1; i < path.length; i++) {
      const d = Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
      segs.push(d);
      total += d;
    }
    let target = total * Math.max(0, Math.min(1, t));
    for (let i = 0; i < segs.length; i++) {
      if (target <= segs[i] || i === segs.length - 1) {
        const ratio = segs[i] === 0 ? 0 : target / segs[i];
        return {
          x: path[i].x + (path[i + 1].x - path[i].x) * ratio,
          y: path[i].y + (path[i + 1].y - path[i].y) * ratio,
        };
      }
      target -= segs[i];
    }
    return path[0];
  }
}
