// EcoLink Industrial Park — High-Detail Realistic 3D Architectural Factory Models

import * as THREE from 'three';

function shadow(mesh, cast = true, receive = true) {
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  return mesh;
}

function addBox(parent, w, h, d, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  parent.add(shadow(m));
  return m;
}

function addCyl(parent, rt, rb, h, segs, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segs), mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  parent.add(shadow(m));
  return m;
}

// Reusable vertical steel ladder with side rails & rungs
function addLadder(parent, mat, x, y0, y1, z, facingRotY = 0) {
  const g = new THREE.Group();
  const h = y1 - y0;
  addCyl(g, 0.012, 0.012, h, 6, mat, -0.05, y0 + h / 2, 0);
  addCyl(g, 0.012, 0.012, h, 6, mat, 0.05, y0 + h / 2, 0);
  for (let ry = y0 + 0.08; ry < y1 - 0.04; ry += 0.12) {
    addCyl(g, 0.008, 0.008, 0.1, 6, mat, 0, ry, 0, 0, 0, Math.PI / 2);
  }
  g.position.set(x, 0, z);
  g.rotation.y = facingRotY;
  parent.add(g);
}

// Reusable handrail segment
function addRailing(parent, mat, x, y, z, len, rotY = 0) {
  const g = new THREE.Group();
  addCyl(g, 0.01, 0.01, len, 6, mat, 0, 0.11, 0, 0, 0, Math.PI / 2);
  addCyl(g, 0.008, 0.008, len, 6, mat, 0, 0.055, 0, 0, 0, Math.PI / 2);
  const posts = Math.max(2, Math.round(len / 0.22) + 1);
  for (let i = 0; i < posts; i++) {
    const px = -len / 2 + (len * i) / (posts - 1);
    addCyl(g, 0.01, 0.01, 0.12, 6, mat, px, 0.06, 0);
  }
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  parent.add(g);
}

export function createMaterialLibrary(tex) {
  return {
    yard: new THREE.MeshStandardMaterial({ map: tex.concreteYard, roughness: 0.85, metalness: 0.04 }),
    concrete: new THREE.MeshStandardMaterial({ color: '#bfc9ce', roughness: 0.82, metalness: 0.05 }),
    concreteDark: new THREE.MeshStandardMaterial({ color: '#7b8a94', roughness: 0.88 }),
    steelSilo: new THREE.MeshStandardMaterial({
      map: tex.steelSilo,
      roughness: 0.24,
      metalness: 0.82,
    }),
    steelClean: new THREE.MeshStandardMaterial({
      color: '#dce4ec',
      roughness: 0.22,
      metalness: 0.85,
    }),
    darkSteel: new THREE.MeshStandardMaterial({
      color: '#334155',
      roughness: 0.42,
      metalness: 0.68,
    }),
    wallWindows: new THREE.MeshStandardMaterial({
      map: tex.factoryWallWindows,
      roughness: 0.55,
      metalness: 0.12,
    }),
    wallWhite: new THREE.MeshStandardMaterial({
      map: tex.corrugatedWhite,
      roughness: 0.58,
      metalness: 0.12,
    }),
    roofAmber: new THREE.MeshStandardMaterial({
      map: tex.corrugatedAmber,
      roughness: 0.46,
      metalness: 0.3,
    }),
    roofBlue: new THREE.MeshStandardMaterial({
      map: tex.corrugatedBlue,
      roughness: 0.44,
      metalness: 0.35,
    }),
    roofCoral: new THREE.MeshStandardMaterial({
      color: '#be123c',
      roughness: 0.45,
      metalness: 0.22,
    }),
    tealTank: new THREE.MeshStandardMaterial({
      map: tex.corrugatedTeal,
      roughness: 0.3,
      metalness: 0.42,
    }),
    tealDome: new THREE.MeshStandardMaterial({
      color: '#14b8a6',
      roughness: 0.24,
      metalness: 0.45,
    }),
    rollDoor: new THREE.MeshStandardMaterial({
      map: tex.rollDoor,
      roughness: 0.55,
      metalness: 0.35,
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: '#bae6fd',
      roughness: 0.08,
      metalness: 0.1,
      transmission: 0.35,
      transparent: true,
      opacity: 0.85,
    }),
    waterBasin: new THREE.MeshStandardMaterial({
      color: '#0d9488',
      emissive: '#065f5b',
      emissiveIntensity: 0.25,
      roughness: 0.12,
      metalness: 0.3,
      transparent: true,
      opacity: 0.86,
    }),
    warningRed: new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.45 }),
    safetyYellow: new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.5 }),
    paperRoll: new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.65 }),
    kraftBox: new THREE.MeshStandardMaterial({ color: '#b4824c', roughness: 0.85 }),
    caneGold: new THREE.MeshStandardMaterial({ color: '#ca8a04', roughness: 0.82 }),
    leafDark: new THREE.MeshStandardMaterial({ color: '#4d7c0f', roughness: 0.72 }),
    leafBright: new THREE.MeshStandardMaterial({ color: '#84cc16', roughness: 0.68 }),
    bark: new THREE.MeshStandardMaterial({ color: '#6b4f35', roughness: 0.92 }),
    aquaAccent: new THREE.MeshStandardMaterial({
      color: '#2dd4bf',
      emissive: '#0d9488',
      emissiveIntensity: 0.3,
      roughness: 0.25,
      metalness: 0.4,
    }),
  };
}

export function buildRealisticTree(mats, scale = 1) {
  const g = new THREE.Group();
  addCyl(g, 0.035, 0.065, 0.36, 8, mats.bark, 0, 0.18, 0);
  // Subtle soil/mulch ring
  addCyl(g, 0.14, 0.16, 0.03, 10, mats.concreteDark, 0, 0.015, 0);
  // Layered organic canopy clusters
  const spheres = [
    [0, 0.46, 0, 0.22, mats.leafDark],
    [-0.12, 0.42, 0.09, 0.15, mats.leafDark],
    [0.13, 0.43, -0.07, 0.16, mats.leafBright],
    [0.02, 0.59, 0.04, 0.16, mats.leafBright],
    [-0.08, 0.54, -0.08, 0.13, mats.leafDark],
  ];
  for (const [x, y, z, r, mat] of spheres) {
    const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), mat);
    leaf.position.set(x, y, z);
    g.add(shadow(leaf));
  }
  g.scale.setScalar(scale);
  return g;
}

export function buildRealisticFactory(b, mats) {
  const group = new THREE.Group();
  const rotors = [];
  const steamPuffs = [];

  // 1. Detailed Industrial Concrete Foundation Pad + Curb Trim
  addBox(group, 1.92, 0.08, 1.92, mats.concreteDark, 0, 0.04, 0);
  addBox(group, 1.86, 0.06, 1.86, mats.yard, 0, 0.09, 0);

  // Corner yellow steel safety bollards
  for (const bx of [-0.84, 0.84]) {
    for (const bz of [-0.84, 0.84]) {
      addCyl(group, 0.022, 0.024, 0.14, 8, mats.safetyYellow, bx, 0.18, bz);
    }
  }

  // Selection / Connection target ring
  const ringGeo = new THREE.RingGeometry(1.06, 1.17, 40);
  ringGeo.rotateX(-Math.PI / 2);
  const ring = new THREE.Mesh(
    ringGeo,
    new THREE.MeshBasicMaterial({
      color: '#065f5b',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
    })
  );
  ring.position.y = 0.03;
  ring.visible = false;
  group.add(ring);

  // 2. Per-Factory Detailed Architecture
  if (b.typeId === 'water_intake') {
    // Riverside Intake Concrete Pier + Pump House + Twin Turbines + Suction Manifold
    addBox(group, 1.28, 0.56, 1.38, mats.wallWindows, 0.14, 0.4, 0);
    // Deep teal cornice & steel coping roof
    addBox(group, 1.34, 0.08, 1.44, mats.tealTank, 0.14, 0.72, 0);
    addBox(group, 1.18, 0.06, 1.28, mats.concrete, 0.14, 0.78, 0);

    // Rooftop safety railings
    addRailing(group, mats.darkSteel, 0.14, 0.81, 0.62, 1.14, 0);
    addRailing(group, mats.darkSteel, 0.14, 0.81, -0.62, 1.14, 0);

    // Control room skylight bay
    addBox(group, 0.42, 0.24, 0.62, mats.concrete, 0.44, 0.92, 0);
    addBox(group, 0.44, 0.14, 0.52, mats.glass, 0.44, 0.94, 0);

    // Twin centrifugal pump housings + spinning turbines + suction pipes into river
    for (const dz of [-0.34, 0.34]) {
      addCyl(group, 0.22, 0.24, 0.18, 20, mats.darkSteel, -0.1, 0.89, dz);
      addCyl(group, 0.18, 0.18, 0.06, 16, mats.waterBasin, -0.1, 0.97, dz);

      const rotorGroup = new THREE.Group();
      rotorGroup.position.set(-0.1, 1.0, dz);
      addBox(rotorGroup, 0.3, 0.035, 0.055, mats.aquaAccent, 0, 0, 0);
      addBox(rotorGroup, 0.055, 0.035, 0.3, mats.aquaAccent, 0, 0, 0);
      addCyl(rotorGroup, 0.05, 0.05, 0.08, 10, mats.steelClean, 0, 0.01, 0);
      group.add(rotorGroup);
      rotors.push(rotorGroup);

      // Flanged suction pipe angling into river
      addCyl(group, 0.075, 0.075, 0.72, 12, mats.steelClean, -0.64, 0.24, dz, 0, 0, Math.PI / 3);
      addCyl(group, 0.11, 0.11, 0.04, 12, mats.darkSteel, -0.5, 0.32, dz, 0, 0, Math.PI / 3);
      // Outlet flange pipe on right side
      addCyl(group, 0.065, 0.065, 0.32, 12, mats.steelClean, 0.78, 0.34, dz, 0, 0, Math.PI / 2);
      addCyl(group, 0.095, 0.095, 0.035, 12, mats.tealTank, 0.88, 0.34, dz, 0, 0, Math.PI / 2);
    }
  } else if (b.typeId === 'sugar') {
    // HERO CARD-05 SILHOUETTE: Boiler Hall + Twin Brushed Stainless Silos + Overhead Pipes + Smokestack
    // Main boiler & refinery hall
    addBox(group, 0.92, 0.68, 1.34, mats.wallWindows, -0.34, 0.46, 0.08);
    // Steel exterior I-beam pilasters
    for (const pz of [-0.52, -0.1, 0.32, 0.7]) {
      addBox(group, 0.96, 0.68, 0.045, mats.darkSteel, -0.34, 0.46, pz);
    }
    // Pitched corrugated amber roof + ridge monitor vent
    addBox(group, 0.56, 0.06, 1.4, mats.roofAmber, -0.58, 0.88, 0.08, 0, 0, 0.32);
    addBox(group, 0.56, 0.06, 1.4, mats.roofAmber, -0.1, 0.88, 0.08, 0, 0, -0.32);
    addBox(group, 0.22, 0.16, 1.15, mats.darkSteel, -0.34, 1.0, 0.08);
    addBox(group, 0.28, 0.04, 1.2, mats.roofAmber, -0.34, 1.09, 0.08);

    // Front loading dock roll-up door + sugarcane intake hopper
    addBox(group, 0.34, 0.34, 0.04, mats.rollDoor, -0.42, 0.29, 0.76);
    addBox(group, 0.34, 0.24, 0.26, mats.darkSteel, 0.02, 0.24, 0.72);
    addBox(group, 0.28, 0.14, 0.2, mats.caneGold, 0.02, 0.36, 0.72);

    // Twin Tall Brushed Stainless Steel Silos (Card 05 Iconic Silos!)
    for (const dz of [-0.38, 0.32]) {
      // Steel structural legs
      for (const ang of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
        addCyl(
          group,
          0.022,
          0.026,
          0.26,
          6,
          mats.darkSteel,
          0.46 + Math.cos(ang) * 0.24,
          0.25,
          dz + Math.sin(ang) * 0.24
        );
      }
      // Conical hopper bottom
      addCyl(group, 0.32, 0.09, 0.22, 20, mats.steelClean, 0.46, 0.34, dz);
      // Main riveted stainless cylinder
      addCyl(group, 0.32, 0.32, 1.08, 24, mats.steelSilo, 0.46, 0.99, dz);
      // Structural steel band rings
      addCyl(group, 0.335, 0.335, 0.03, 24, mats.darkSteel, 0.46, 0.72, dz);
      addCyl(group, 0.335, 0.335, 0.03, 24, mats.darkSteel, 0.46, 1.25, dz);
      // Conical roof cap + breather vent
      addCyl(group, 0.06, 0.33, 0.16, 20, mats.steelClean, 0.46, 1.6, dz);
      addCyl(group, 0.045, 0.045, 0.1, 10, mats.darkSteel, 0.46, 1.71, dz);
    }

    // Elevated steel catwalk + handrails + vertical access ladder between silos
    addBox(group, 0.2, 0.04, 0.82, mats.darkSteel, 0.46, 1.54, -0.03);
    addRailing(group, mats.steelClean, 0.56, 1.56, -0.03, 0.76, Math.PI / 2);
    addRailing(group, mats.steelClean, 0.36, 1.56, -0.03, 0.76, Math.PI / 2);
    addLadder(group, mats.darkSteel, 0.8, 0.12, 1.54, 0.32, Math.PI / 2);

    // Overhead stainless process pipe connecting boiler hall to silos
    addCyl(group, 0.045, 0.045, 0.75, 10, mats.steelClean, 0.06, 1.22, -0.38, 0, 0, Math.PI / 2);
    addCyl(group, 0.045, 0.045, 0.75, 10, mats.steelClean, 0.06, 1.22, 0.32, 0, 0, Math.PI / 2);

    // Tall Industrial Smokestack with red/white safety bands + rising steam
    addCyl(group, 0.09, 0.14, 1.65, 16, mats.concrete, -0.62, 0.94, -0.56);
    addCyl(group, 0.102, 0.108, 0.15, 16, mats.warningRed, -0.62, 1.52, -0.56);
    addCyl(group, 0.096, 0.1, 0.12, 16, mats.paperRoll, -0.62, 1.38, -0.56);
    addCyl(group, 0.105, 0.095, 0.06, 16, mats.darkSteel, -0.62, 1.78, -0.56);

    for (let i = 0; i < 4; i++) {
      const puff = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.12, 1),
        new THREE.MeshStandardMaterial({ color: '#f8fafc', transparent: true, opacity: 0.7, roughness: 1 })
      );
      puff.userData = { phase: i / 4, baseX: -0.62, baseZ: -0.56, baseY: 1.85 };
      group.add(puff);
      steamPuffs.push(puff);
    }
  } else if (b.typeId === 'food') {
    // Hygienic Modern Food Processing Plant + Stainless Steam Kettles + Cooling Fans + Loading Bay
    addBox(group, 1.46, 0.66, 1.06, mats.wallWindows, 0, 0.45, 0.18);
    // Clean coral architectural fascia + cantilevered canopy
    addBox(group, 1.52, 0.14, 1.12, mats.roofCoral, 0, 0.84, 0.18);
    addBox(group, 1.42, 0.05, 1.02, mats.wallWhite, 0, 0.92, 0.18);

    // Cantilevered front loading canopy + twin roll-up doors + pallets
    addBox(group, 0.92, 0.05, 0.24, mats.roofCoral, -0.15, 0.56, 0.8);
    addBox(group, 0.34, 0.34, 0.04, mats.rollDoor, -0.36, 0.29, 0.72);
    addBox(group, 0.34, 0.34, 0.04, mats.rollDoor, 0.06, 0.29, 0.72);
    // Shipping crate pallets
    addBox(group, 0.22, 0.16, 0.18, mats.kraftBox, 0.52, 0.2, 0.76);
    addBox(group, 0.18, 0.12, 0.16, mats.kraftBox, 0.52, 0.34, 0.76);

    // Rooftop glass monitor skylight + 2 spinning HVAC cooling fans
    addBox(group, 0.62, 0.14, 0.34, mats.darkSteel, -0.26, 0.98, 0.18);
    addBox(group, 0.58, 0.1, 0.3, mats.glass, -0.26, 1.01, 0.18);
    for (const dz of [-0.02, 0.36]) {
      addBox(group, 0.34, 0.14, 0.32, mats.steelClean, 0.4, 0.99, dz);
      const fan = new THREE.Group();
      fan.position.set(0.4, 1.07, dz);
      addBox(fan, 0.22, 0.02, 0.04, mats.darkSteel, 0, 0, 0);
      addBox(fan, 0.04, 0.02, 0.22, mats.darkSteel, 0, 0, 0);
      group.add(fan);
      rotors.push(fan);
    }

    // Rear stainless-steel steam blanching kettles on elevated service deck
    addBox(group, 1.32, 0.12, 0.5, mats.darkSteel, 0, 0.18, -0.62);
    for (const dx of [-0.38, 0.38]) {
      addCyl(group, 0.24, 0.24, 0.74, 20, mats.steelSilo, dx, 0.6, -0.6);
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2),
        mats.steelClean
      );
      dome.position.set(dx, 0.97, -0.6);
      group.add(shadow(dome));
      // Insulated steam pipe bridge into main hall
      addCyl(group, 0.04, 0.04, 0.45, 10, mats.roofCoral, dx, 0.85, -0.35, Math.PI / 2, 0, 0);
    }
    // Connecting manifold bar
    addCyl(group, 0.035, 0.035, 0.8, 10, mats.steelClean, 0, 1.12, -0.6, 0, 0, Math.PI / 2);
  } else if (b.typeId === 'paper') {
    // Authentic 3-Bay Sawtooth-Roofed Paper Mill + External Pulper Vat + Stacked Jumbo Paper Rolls
    addBox(group, 1.06, 0.64, 1.44, mats.wallWindows, -0.32, 0.44, 0);

    // 3 Architectural Sawtooth Roof Bays (sloped corrugated cobalt + glazed vertical skylight)
    for (let i = 0; i < 3; i++) {
      const bz = -0.46 + i * 0.46;
      // Vertical north-light glass facade
      addBox(group, 1.04, 0.3, 0.05, mats.glass, -0.32, 0.91, bz - 0.19);
      addBox(group, 1.08, 0.04, 0.06, mats.darkSteel, -0.32, 1.06, bz - 0.19);
      // Sloped corrugated cobalt steel roof deck
      addBox(group, 1.1, 0.05, 0.52, mats.roofBlue, -0.32, 0.91, bz + 0.03, 0.58, 0, 0);
      // Side gable steel trim
      addBox(group, 0.04, 0.28, 0.44, mats.wallWhite, -0.84, 0.88, bz);
      addBox(group, 0.04, 0.28, 0.44, mats.wallWhite, 0.2, 0.88, bz);
    }

    // External Cylindrical Pulper Vat + Rotating Agitator Arm (back-right)
    addCyl(group, 0.28, 0.3, 0.64, 20, mats.steelSilo, 0.54, 0.44, -0.44);
    addCyl(group, 0.24, 0.24, 0.04, 18, mats.waterBasin, 0.54, 0.74, -0.44);
    const agitator = new THREE.Group();
    agitator.position.set(0.54, 0.78, -0.44);
    addBox(agitator, 0.44, 0.03, 0.045, mats.darkSteel, 0, 0, 0);
    addCyl(agitator, 0.04, 0.04, 0.14, 10, mats.roofBlue, 0, 0.04, 0);
    group.add(agitator);
    rotors.push(agitator);
    addLadder(group, mats.darkSteel, 0.84, 0.12, 0.76, -0.44, Math.PI / 2);

    // Overhead fiber feed pipe from pulper to mill
    addCyl(group, 0.045, 0.045, 0.46, 10, mats.steelClean, 0.34, 0.72, -0.44, 0, 0, Math.PI / 2);

    // Covered Paper Roll Storage Yard (front-right) with stacked jumbo white rolls + kraft boxes
    addBox(group, 0.58, 0.04, 0.72, mats.darkSteel, 0.55, 0.74, 0.36);
    for (const sx of [0.28, 0.8]) {
      for (const sz of [0.04, 0.68]) {
        addCyl(group, 0.022, 0.022, 0.62, 6, mats.darkSteel, sx, 0.43, sz);
      }
    }
    for (const [rx, ry, rz] of [
      [0.44, 0.26, 0.22],
      [0.66, 0.26, 0.22],
      [0.55, 0.45, 0.22],
    ]) {
      addCyl(group, 0.11, 0.11, 0.32, 16, mats.paperRoll, rx, ry, rz, Math.PI / 2, 0, 0);
      addCyl(group, 0.035, 0.035, 0.33, 10, mats.kraftBox, rx, ry, rz, Math.PI / 2, 0, 0);
    }
    addBox(group, 0.24, 0.18, 0.2, mats.kraftBox, 0.44, 0.21, 0.58);
    addBox(group, 0.2, 0.15, 0.18, mats.kraftBox, 0.68, 0.195, 0.58);
  } else if (b.typeId === 'fertilizer') {
    // CARD 05 SIGNATURE: Twin Anaerobic Bioreactor Domes + Bio-Filter Clarifier Basin + Bagging Shed
    for (const dx of [-0.42, 0.36]) {
      // Main deep-teal riveted cylindrical bioreactor tank
      addCyl(group, 0.36, 0.38, 0.78, 24, mats.tealTank, dx, 0.51, -0.26);
      // Stainless steel reinforcement hoops
      addCyl(group, 0.38, 0.38, 0.035, 24, mats.steelClean, dx, 0.36, -0.26);
      addCyl(group, 0.375, 0.375, 0.035, 24, mats.steelClean, dx, 0.72, -0.26);
      // Geodesic/ribbed dome cap
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(0.36, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        mats.tealDome
      );
      dome.position.set(dx, 0.9, -0.26);
      group.add(shadow(dome));
      // Top pressure relief valve cap
      addCyl(group, 0.06, 0.08, 0.1, 10, mats.steelClean, dx, 1.28, -0.26);
    }

    // Steel interconnecting catwalk + safety rails + access ladder
    addBox(group, 0.88, 0.045, 0.24, mats.darkSteel, -0.03, 0.92, -0.26);
    addRailing(group, mats.steelClean, -0.03, 0.94, -0.14, 0.78, 0);
    addRailing(group, mats.steelClean, -0.03, 0.94, -0.38, 0.78, 0);
    addLadder(group, mats.steelClean, -0.8, 0.12, 0.92, -0.26, -Math.PI / 2);

    // Overhead stainless water-recovery pipe curving down to front basin
    addCyl(group, 0.045, 0.045, 0.76, 10, mats.steelClean, -0.03, 1.08, -0.26, 0, 0, Math.PI / 2);
    addCyl(group, 0.045, 0.045, 0.65, 10, mats.steelClean, -0.03, 0.75, 0.05, Math.PI / 4, 0, 0);

    // Front Biological Reed-Bed / Clean Water Clarifier Basin (shows wastewater → clean raw water!)
    addBox(group, 1.02, 0.24, 0.56, mats.concrete, -0.28, 0.24, 0.5);
    addBox(group, 0.9, 0.05, 0.44, mats.waterBasin, -0.28, 0.34, 0.5);

    // Lush botanical reed/bio-filter clusters lining the clarifier edge
    for (let i = 0; i < 5; i++) {
      const bx = -0.66 + i * 0.19;
      const bush = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.11, 1),
        i % 2 === 0 ? mats.leafDark : mats.leafBright
      );
      bush.position.set(bx, 0.39, 0.74);
      group.add(shadow(bush));
    }

    // Compact Bio-Fertilizer Bagging & Dispatch Shed (front-right)
    addBox(group, 0.5, 0.42, 0.56, mats.wallWhite, 0.56, 0.33, 0.5);
    addBox(group, 0.54, 0.07, 0.6, mats.tealTank, 0.56, 0.57, 0.5);
    addBox(group, 0.24, 0.26, 0.04, mats.rollDoor, 0.56, 0.25, 0.79);
  } else if (b.typeId === 'treatment') {
    // Dedicated Water Treatment Plant: Twin Circular Concrete Clarifier Basins + Rotating Skimmer Bridges + Filtration Control House
    for (const dx of [-0.42, 0.42]) {
      // Concrete circular basin wall
      addCyl(group, 0.4, 0.42, 0.34, 24, mats.concrete, dx, 0.29, 0.26);
      // Clean turquoise-blue water surface
      addCyl(group, 0.35, 0.35, 0.04, 22, mats.waterBasin, dx, 0.44, 0.26);
      // Central concrete baffle column
      addCyl(group, 0.07, 0.08, 0.44, 12, mats.concreteDark, dx, 0.34, 0.26);

      // Rotating steel clarifier skimmer bridge
      const bridge = new THREE.Group();
      bridge.position.set(dx, 0.5, 0.26);
      addBox(bridge, 0.72, 0.04, 0.08, mats.steelClean, 0, 0, 0);
      addBox(bridge, 0.72, 0.06, 0.02, mats.roofBlue, 0, 0.05, 0.035);
      addBox(bridge, 0.72, 0.06, 0.02, mats.roofBlue, 0, 0.05, -0.035);
      group.add(bridge);
      rotors.push(bridge);
    }

    // Rear Filtration & UV Control House
    addBox(group, 1.38, 0.58, 0.64, mats.wallWindows, 0, 0.41, -0.46);
    addBox(group, 1.44, 0.08, 0.7, mats.roofBlue, 0, 0.74, -0.46);
    // Stainless filter pressure vessels on rooftop
    for (const vx of [-0.36, 0, 0.36]) {
      addCyl(group, 0.1, 0.1, 0.28, 14, mats.steelSilo, vx, 0.9, -0.46);
    }
    // Connecting stainless pipe manifold from control house to both clarifiers
    addCyl(group, 0.04, 0.04, 0.88, 10, mats.steelClean, 0, 0.62, -0.1, 0, 0, Math.PI / 2);
  }

  group.position.set(b.gx + b.size / 2, 0, b.gy + b.size / 2);
  return { group, ring, rotors, steamPuffs, typeId: b.typeId, spawnAge: 0 };
}
