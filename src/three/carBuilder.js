import * as THREE from 'three';

export const CAR_MODELS = [
  { id: 'gt-coupe', name: 'APEX GT Coupé', subtitle: 'Deportivo Fastback' },
  { id: 'supercar', name: 'Valkyrie V10', subtitle: 'Hiperdeportivo Mid-Engine' },
  { id: 'jdm-tuner', name: 'Kurogane Widebody', subtitle: 'JDM Street Tuner' }
];

const BODY_PROFILES = {
  'gt-coupe': {
    length: 4.45,
    width: 1.88,
    wheelbaseHalf: 1.38,
    trackHalf: 0.9,
    profilePoints: [
      [-2.18, 0.28],
      [-2.22, 0.56],
      [-1.95, 0.72],
      [-1.15, 0.84],
      [-0.45, 1.24],
      [0.58, 1.24],
      [1.58, 0.88],
      [2.16, 0.82],
      [2.22, 0.42],
      [2.05, 0.28]
    ],
    cabinPoints: [
      [-1.02, 0.84],
      [-0.42, 1.21],
      [0.54, 1.21],
      [1.36, 0.88]
    ]
  },
  supercar: {
    length: 4.55,
    width: 1.98,
    wheelbaseHalf: 1.42,
    trackHalf: 0.95,
    profilePoints: [
      [-2.25, 0.24],
      [-2.28, 0.44],
      [-1.85, 0.64],
      [-1.0, 0.78],
      [-0.3, 1.12],
      [0.52, 1.12],
      [1.55, 0.84],
      [2.2, 0.78],
      [2.26, 0.36],
      [2.05, 0.24]
    ],
    cabinPoints: [
      [-0.95, 0.78],
      [-0.28, 1.09],
      [0.48, 1.09],
      [1.18, 0.84]
    ]
  },
  'jdm-tuner': {
    length: 4.38,
    width: 1.94,
    wheelbaseHalf: 1.35,
    trackHalf: 0.94,
    profilePoints: [
      [-2.14, 0.26],
      [-2.18, 0.58],
      [-1.88, 0.74],
      [-1.1, 0.84],
      [-0.48, 1.26],
      [0.55, 1.26],
      [1.18, 0.92],
      [2.08, 0.88],
      [2.15, 0.4],
      [1.98, 0.26]
    ],
    cabinPoints: [
      [-0.98, 0.84],
      [-0.46, 1.23],
      [0.52, 1.23],
      [1.12, 0.92]
    ]
  }
};

function createExtrudedShape(points, depth, bevelSize = 0.08) {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    shape.lineTo(points[i][0], points[i][1]);
  }
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 2,
    bevelSize,
    bevelThickness: bevelSize
  });
  geo.center();
  // ExtrudeGeometry extrudes along Z; rotate so length is along Z or X cleanly.
  // Keeping X = length (front at -X, rear at +X), Y = up, Z = width:
  return geo;
}

function buildWheel(rimStyle, rimMat, caliperMat, isLeft) {
  const wheelGroup = new THREE.Group();
  const tireRadius = 0.34;
  const tireWidth = 0.25;

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x16181d,
    roughness: 0.82,
    metalness: 0.05
  });

  // Tire
  const tireGeo = new THREE.CylinderGeometry(tireRadius, tireRadius, tireWidth, 36);
  tireGeo.rotateX(Math.PI / 2);
  const tire = new THREE.Mesh(tireGeo, tireMat);
  tire.castShadow = true;
  tire.receiveShadow = true;
  wheelGroup.add(tire);

  // Sidewall bevel ring
  const wallGeo = new THREE.TorusGeometry(tireRadius - 0.055, 0.055, 14, 36);
  const wallOuter = new THREE.Mesh(wallGeo, tireMat);
  wallOuter.position.z = isLeft ? tireWidth * 0.32 : -tireWidth * 0.32;
  wheelGroup.add(wallOuter);

  // Rim barrel
  const barrelGeo = new THREE.CylinderGeometry(0.24, 0.24, tireWidth * 0.86, 32, 1, true);
  barrelGeo.rotateX(Math.PI / 2);
  const barrel = new THREE.Mesh(barrelGeo, rimMat);
  barrel.userData.rim = true;
  wheelGroup.add(barrel);

  // Brake disc
  const discMat = new THREE.MeshStandardMaterial({
    color: 0x9ca3af,
    metalness: 0.85,
    roughness: 0.3
  });
  const discGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.03, 28);
  discGeo.rotateX(Math.PI / 2);
  const disc = new THREE.Mesh(discGeo, discMat);
  wheelGroup.add(disc);

  // Brake caliper
  const caliperGeo = new THREE.BoxGeometry(0.09, 0.14, 0.08);
  const caliper = new THREE.Mesh(caliperGeo, caliperMat);
  caliper.position.set(0.11, 0.06, isLeft ? 0.03 : -0.03);
  caliper.userData.caliper = true;
  wheelGroup.add(caliper);

  // Spokes
  const spokeGroup = new THREE.Group();
  const faceZ = isLeft ? tireWidth * 0.42 : -tireWidth * 0.42;
  const spokeCount = rimStyle === 'mesh-10' ? 10 : rimStyle === 'deep-dish' ? 6 : 5;
  const spokeWidth = rimStyle === 'mesh-10' ? 0.022 : rimStyle === 'deep-dish' ? 0.045 : 0.038;
  const spokeZ = rimStyle === 'deep-dish' ? faceZ * 0.55 : faceZ * 0.92;

  for (let i = 0; i < spokeCount; i++) {
    const angle = (i / spokeCount) * Math.PI * 2;
    const spokeGeo = new THREE.BoxGeometry(spokeWidth, 0.22, 0.025);
    const spoke = new THREE.Mesh(spokeGeo, rimMat);
    spoke.position.set(
      Math.cos(angle) * 0.11,
      Math.sin(angle) * 0.11,
      spokeZ
    );
    spoke.rotation.z = angle - Math.PI / 2;
    spoke.userData.rim = true;
    spokeGroup.add(spoke);
  }

  // Center hub
  const hubGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.04, 20);
  hubGeo.rotateX(Math.PI / 2);
  const hub = new THREE.Mesh(hubGeo, rimMat);
  hub.position.z = spokeZ;
  hub.userData.rim = true;
  spokeGroup.add(hub);

  wheelGroup.add(spokeGroup);
  return wheelGroup;
}

function buildSpoiler(type, bodyMat, carbonMat) {
  const group = new THREE.Group();
  if (type === 'none') return group;

  if (type === 'lip') {
    const lipGeo = new THREE.BoxGeometry(0.16, 0.05, 1.56);
    const lip = new THREE.Mesh(lipGeo, carbonMat);
    lip.position.set(2.08, 0.87, 0);
    lip.rotation.z = 0.22;
    lip.castShadow = true;
    group.add(lip);
    return group;
  }

  // GT Wing
  const wingGeo = new THREE.BoxGeometry(0.32, 0.035, 1.78);
  const wing = new THREE.Mesh(wingGeo, carbonMat);
  wing.position.set(2.12, 1.16, 0);
  wing.rotation.z = 0.12;
  wing.castShadow = true;
  group.add(wing);

  [-0.52, 0.52].forEach((z) => {
    const strutGeo = new THREE.BoxGeometry(0.12, 0.32, 0.035);
    const strut = new THREE.Mesh(strutGeo, carbonMat);
    strut.position.set(2.06, 0.99, z);
    strut.rotation.z = -0.18;
    strut.castShadow = true;
    group.add(strut);
  });

  [-0.89, 0.89].forEach((z) => {
    const plateGeo = new THREE.BoxGeometry(0.38, 0.16, 0.025);
    const plate = new THREE.Mesh(plateGeo, bodyMat);
    plate.position.set(2.12, 1.15, z);
    plate.userData.paintable = true;
    plate.castShadow = true;
    group.add(plate);
  });

  return group;
}

export function buildProceduralCar(modelId, materials, options) {
  const spec = BODY_PROFILES[modelId] || BODY_PROFILES['gt-coupe'];
  const root = new THREE.Group();
  root.userData.isProceduralCar = true;

  const { bodyMat, glassMat, rimMat, caliperMat, trimMat } = materials;

  // Main body shell
  const bodyGeo = createExtrudedShape(spec.profilePoints, spec.width - 0.18, 0.09);
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  bodyMesh.position.y = 0.72;
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  bodyMesh.userData.paintable = true;
  bodyMesh.name = 'car-body-main';
  root.add(bodyMesh);

  // Widebody fender flares for JDM Tuner or Supercar
  const flareWidth = modelId === 'jdm-tuner' ? 0.12 : 0.06;
  [
    [-spec.wheelbaseHalf, spec.trackHalf],
    [-spec.wheelbaseHalf, -spec.trackHalf],
    [spec.wheelbaseHalf, spec.trackHalf],
    [spec.wheelbaseHalf, -spec.trackHalf]
  ].forEach(([x, z], idx) => {
    const archGeo = new THREE.CylinderGeometry(0.42, 0.42, flareWidth, 24, 1, false, 0, Math.PI);
    archGeo.rotateX(Math.PI / 2);
    archGeo.rotateY(Math.PI / 2);
    const arch = new THREE.Mesh(archGeo, bodyMat);
    arch.position.set(x, 0.36, z > 0 ? z + 0.01 : z - 0.01);
    arch.userData.paintable = true;
    arch.castShadow = true;
    arch.name = `fender-${idx}`;
    root.add(arch);
  });

  // Glass Cabin
  const cabinGeo = createExtrudedShape(spec.cabinPoints, spec.width - 0.36, 0.04);
  const cabinMesh = new THREE.Mesh(cabinGeo, glassMat);
  cabinMesh.position.set(0.06, 1.03, 0);
  cabinMesh.userData.glass = true;
  cabinMesh.name = 'cabina-vidrios';
  cabinMesh.castShadow = true;
  root.add(cabinMesh);

  // Side mirrors
  [-spec.width * 0.52, spec.width * 0.52].forEach((z, idx) => {
    const mirrorGeo = new THREE.BoxGeometry(0.16, 0.09, 0.15);
    const mirror = new THREE.Mesh(mirrorGeo, bodyMat);
    mirror.position.set(-0.78, 0.9, z);
    mirror.userData.paintable = true;
    mirror.name = idx === 0 ? 'espejo-der' : 'espejo-izq';
    mirror.castShadow = true;
    root.add(mirror);
  });

  // Front splitter & Rear diffuser
  const splitterGeo = new THREE.BoxGeometry(0.32, 0.04, spec.width + 0.06);
  const splitter = new THREE.Mesh(splitterGeo, trimMat);
  splitter.position.set(-spec.length * 0.49, 0.22, 0);
  splitter.name = 'splitter-frontal';
  splitter.castShadow = true;
  root.add(splitter);

  const diffuserGeo = new THREE.BoxGeometry(0.28, 0.12, spec.width - 0.1);
  const diffuser = new THREE.Mesh(diffuserGeo, trimMat);
  diffuser.position.set(spec.length * 0.48, 0.27, 0);
  diffuser.name = 'difusor-trasero';
  diffuser.castShadow = true;
  root.add(diffuser);

  // Exhaust tips
  [-0.58, -0.44, 0.44, 0.58].forEach((z) => {
    const pipeGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.14, 16);
    pipeGeo.rotateZ(Math.PI / 2);
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.95, roughness: 0.15 });
    const pipe = new THREE.Mesh(pipeGeo, pipeMat);
    pipe.position.set(spec.length * 0.51, 0.25, z);
    root.add(pipe);
  });

  // Headlights (front is -X)
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xdbeafe,
    emissiveIntensity: options.headlightsOn ? 2.4 : 0.15,
    roughness: 0.1
  });
  [-0.64, 0.64].forEach((z) => {
    const hlGeo = new THREE.BoxGeometry(0.12, 0.07, 0.34);
    const hl = new THREE.Mesh(hlGeo, headMat);
    hl.position.set(-spec.length * 0.48, 0.55, z);
    hl.userData.headlight = true;
    root.add(hl);
  });

  // Taillights (rear is +X)
  const tailMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: options.headlightsOn ? 2.2 : 0.4,
    roughness: 0.2
  });
  const tlGeo = new THREE.BoxGeometry(0.08, 0.065, spec.width - 0.26);
  const tl = new THREE.Mesh(tlGeo, tailMat);
  tl.position.set(spec.length * 0.49, 0.68, 0);
  tl.userData.taillight = true;
  root.add(tl);

  // Spoiler
  const spoiler = buildSpoiler(options.spoiler, bodyMat, trimMat);
  spoiler.name = 'car-spoiler';
  root.add(spoiler);

  // Underglow
  if (options.underglowEnabled) {
    const glowMat = new THREE.MeshBasicMaterial({
      color: options.underglowColor,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });
    const glowPlane = new THREE.Mesh(new THREE.PlaneGeometry(spec.length * 0.86, spec.width * 0.96), glowMat);
    glowPlane.rotation.x = -Math.PI / 2;
    glowPlane.position.y = 0.03;
    glowPlane.userData.underglow = true;
    root.add(glowPlane);
  }

  // Wheels group (kept separate from body suspension height)
  const wheelsGroup = new THREE.Group();
  wheelsGroup.name = 'wheels-group';
  const camberRad = THREE.MathUtils.degToRad(options.camber || 0);

  const wheelPositions = [
    { x: -spec.wheelbaseHalf, z: spec.trackHalf, left: true },
    { x: -spec.wheelbaseHalf, z: -spec.trackHalf, left: false },
    { x: spec.wheelbaseHalf, z: spec.trackHalf, left: true },
    { x: spec.wheelbaseHalf, z: -spec.trackHalf, left: false }
  ];

  wheelPositions.forEach((wp, idx) => {
    const w = buildWheel(options.rimStyle, rimMat, caliperMat, wp.left);
    w.name = `rueda-${idx + 1}`;
    w.traverse((child) => {
      if (child.isMesh && !child.name) {
        child.name = `rueda-${idx + 1}-${child.userData.rim ? 'rin' : child.userData.caliper ? 'caliper' : 'llanta'}`;
      }
    });
    w.position.set(wp.x, 0.34, wp.z);
    w.rotation.x = wp.left ? -camberRad : camberRad;
    wheelsGroup.add(w);
  });

  // Apply suspension ride height offset to body only (wheels stay on floor y=0.34)
  root.position.y = options.rideHeight || 0;
  const wrapper = new THREE.Group();
  wrapper.add(root);
  wrapper.add(wheelsGroup);
  return wrapper;
}

export function prepareCustomModel(scene, bodyMat, glassMat, paintAllMeshes = false) {
  let validMeshCount = 0;
  scene.traverse((child) => {
    if (!child.isMesh || !child.geometry) return;
    const pos = child.geometry.attributes.position;
    if (!pos || pos.count === 0) return;

    let hasInvalid = false;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
        pos.setXYZ(i, 0, 0, 0);
        hasInvalid = true;
      }
    }
    if (hasInvalid) {
      pos.needsUpdate = true;
    }
    child.geometry.computeBoundingBox();
    child.geometry.computeBoundingSphere();
    validMeshCount += 1;
  });

  if (validMeshCount === 0) {
    throw new Error('El modelo 3D no contiene mallas válidas.');
  }

  const box = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const maxDim = Math.max(size.x, size.y, size.z);
  if (box.isEmpty() || !Number.isFinite(maxDim) || maxDim <= 0) {
    throw new Error('El modelo 3D tiene dimensiones inválidas o vacías.');
  }
  const scale = 4.4 / maxDim;
  scene.scale.setScalar(scale);

  box.setFromObject(scene);
  box.getCenter(center);
  scene.position.x -= center.x;
  scene.position.z -= center.z;
  scene.position.y -= box.min.y;

  let meshIdx = 0;
  scene.traverse((child) => {
    if (!child.isMesh) return;
    if (child.geometry && !child.geometry.attributes.normal) {
      child.geometry.computeVertexNormals();
    }
    if (!child.name) {
      child.name = `custom-part-${meshIdx}`;
    }
    meshIdx += 1;

    child.castShadow = true;
    child.receiveShadow = true;

    if (paintAllMeshes) {
      child.material = bodyMat;
      child.userData.paintable = true;
      return;
    }

    const name = child.name.toLowerCase();
    if (
      name.includes('glass') ||
      name.includes('window') ||
      name.includes('windshield') ||
      name.includes('vidrio') ||
      name.includes('cristal')
    ) {
      child.material = glassMat;
      child.userData.glass = true;
    } else if (
      name.includes('tire') ||
      name.includes('tyre') ||
      name.includes('wheel') ||
      name.includes('rim') ||
      name.includes('brake') ||
      name.includes('llanta') ||
      name.includes('rueda')
    ) {
      if (!child.material) {
        child.material = new THREE.MeshStandardMaterial({
          color: 0x18181b,
          roughness: 0.75,
          metalness: 0.15
        });
      }
    } else {
      child.material = bodyMat;
      child.userData.paintable = true;
    }
  });

  return scene;
}
