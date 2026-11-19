import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';
import { buildProceduralCar, prepareCustomModel } from '../three/carBuilder';
import { loadCustomCarModel, SUPPORTED_MODEL_EXTENSIONS, getFileExtension } from '../three/modelLoader';
import { renderStickerDataUrl } from '../data/stickerCatalog';

const CAMERA_PRESETS = {
  '3/4': { pos: [-4.4, 2.0, 4.1], target: [0, 0.55, 0] },
  front: { pos: [-5.2, 1.35, 0.01], target: [0, 0.55, 0] },
  side: { pos: [0, 1.25, 5.2], target: [0, 0.55, 0] },
  rear: { pos: [5.2, 1.45, 0.01], target: [0, 0.55, 0] },
  top: { pos: [0.01, 5.6, 0.01], target: [0, 0.4, 0] }
};

const STUDIO_THEMES = {
  showroom: {
    bg: 0x0b0f17,
    fog: 0x0b0f17,
    floor: 0x111827,
    keyColor: 0xffffff,
    keyIntensity: 2.2,
    fillColor: 0x93c5fd,
    fillIntensity: 0.9,
    rimColor: 0xf8fafc
  },
  neon: {
    bg: 0x070412,
    fog: 0x070412,
    floor: 0x0b0818,
    keyColor: 0x22d3ee,
    keyIntensity: 2.0,
    fillColor: 0xf43f5e,
    fillIntensity: 1.4,
    rimColor: 0xa855f7
  },
  sunset: {
    bg: 0x160d0b,
    fog: 0x160d0b,
    floor: 0x1a1210,
    keyColor: 0xfdba74,
    keyIntensity: 2.4,
    fillColor: 0x60a5fa,
    fillIntensity: 0.75,
    rimColor: 0xf97316
  }
};

export const CarViewport = forwardRef(function CarViewport(
  {
    modelId,
    customModelUrl,
    customModelName,
    paintAllCustomMeshes,
    paint,
    mods,
    stickers,
    stickerPlacementMode,
    activeStickerTemplate,
    activeStickerColor,
    activeStickerText,
    activeStickerCustomUrl,
    sceneConfig,
    selectedPartName,
    transformMode,
    partOverrides,
    onPlaceSticker,
    onSelectPart,
    onPartsLoaded,
    onDropModelFile,
    onDropStickerFile,
    onModelError
  },
  ref
) {
  const containerRef = useRef(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const stateRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    transformControls: null,
    selectionBox: null,
    carContainer: null,
    decalsGroup: null,
    bodyMat: null,
    glassMat: null,
    rimMat: null,
    caliperMat: null,
    trimMat: null,
    lights: {},
    floorMesh: null,
    cursorMesh: null,
    turntable: false
  });

  const interactionPropsRef = useRef({});
  interactionPropsRef.current = {
    stickerPlacementMode,
    activeStickerTemplate,
    activeStickerColor,
    activeStickerText,
    activeStickerCustomUrl,
    onPlaceSticker,
    onSelectPart
  };

  useImperativeHandle(ref, () => ({
    setCameraPreset(presetId) {
      const preset = CAMERA_PRESETS[presetId];
      const { camera, controls } = stateRef.current;
      if (!preset || !camera || !controls) return;
      camera.position.set(...preset.pos);
      controls.target.set(...preset.target);
      controls.update();
    },
    captureScreenshot() {
      const { renderer, scene, camera } = stateRef.current;
      if (!renderer || !scene || !camera) return null;
      renderer.render(scene, camera);
      return renderer.domElement.toDataURL('image/png');
    }
  }));

  // Initialize Three.js Scene once
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0f17);
    scene.fog = new THREE.FogExp2(0x0b0f17, 0.045);

    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(-4.4, 2.0, 4.1);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.style.touchAction = 'none';
    container.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    scene.environment = pmrem.fromScene(roomEnv, 0.04).texture;
    roomEnv.dispose();

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 0.25;
    controls.maxDistance = 40;
    controls.maxPolarAngle = Math.PI - 0.05;
    controls.enablePan = true;
    controls.screenSpacePanning = true;
    controls.zoomSpeed = 1.25;
    controls.target.set(0, 0.55, 0);

    const transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.setSize(0.75);
    transformControls.addEventListener('dragging-changed', (event) => {
      controls.enabled = !event.value;
    });
    scene.add(transformControls.getHelper());

    const selectionBox = new THREE.BoxHelper(new THREE.Object3D(), 0x22d3ee);
    selectionBox.visible = false;
    scene.add(selectionBox);

    // Studio floor + subtle grid
    const floorGeo = new THREE.CircleGeometry(18, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.32,
      metalness: 0.45
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    const ringGeo = new THREE.RingGeometry(2.6, 2.66, 72);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.005;
    scene.add(ring);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(-5, 7, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 22;
    keyLight.shadow.camera.left = -4;
    keyLight.shadow.camera.right = 4;
    keyLight.shadow.camera.top = 4;
    keyLight.shadow.camera.bottom = -4;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.9);
    fillLight.position.set(5, 3, -4);
    scene.add(fillLight);

    const rimLight = new THREE.SpotLight(0xf8fafc, 3.0, 18, Math.PI / 4, 0.6);
    rimLight.position.set(4, 5, 4);
    scene.add(rimLight);

    // Shared materials
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: 0xd40000,
      metalness: 0.25,
      roughness: 0.14,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      iridescence: 0.0,
      iridescenceIOR: 1.6
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      metalness: 0.1,
      roughness: 0.06,
      transparent: true,
      opacity: 0.65,
      clearcoat: 1.0
    });

    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      metalness: 0.88,
      roughness: 0.2
    });

    const caliperMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      metalness: 0.4,
      roughness: 0.3
    });

    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.35,
      roughness: 0.48
    });

    const carContainer = new THREE.Group();
    scene.add(carContainer);

    const decalsGroup = new THREE.Group();
    scene.add(decalsGroup);

    // Laser cursor ring for sticker placement
    const cursorGeo = new THREE.RingGeometry(0.11, 0.14, 32);
    const cursorMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      side: THREE.DoubleSide,
      depthTest: false,
      transparent: true,
      opacity: 0.9
    });
    const cursorMesh = new THREE.Mesh(cursorGeo, cursorMat);
    cursorMesh.visible = false;
    scene.add(cursorMesh);

    stateRef.current = {
      scene,
      camera,
      renderer,
      controls,
      transformControls,
      selectionBox,
      carContainer,
      decalsGroup,
      bodyMat,
      glassMat,
      rimMat,
      caliperMat,
      trimMat,
      lights: { keyLight, fillLight, rimLight },
      floorMesh,
      cursorMesh,
      turntable: false
    };

    // Raycaster for hover + click-to-place stickers / select parts
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const getCarHit = (clientX, clientY, onlyPaintable = true) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const targets = [];
      carContainer.traverse((obj) => {
        if (obj.isMesh && obj.visible && (!onlyPaintable || obj.userData.paintable)) {
          targets.push(obj);
        }
      });
      const hits = raycaster.intersectObjects(targets, false);
      return hits[0] || null;
    };

    const handlePointerMove = (e) => {
      if (!interactionPropsRef.current.stickerPlacementMode) {
        cursorMesh.visible = false;
        return;
      }
      const hit = getCarHit(e.clientX, e.clientY, true);
      if (hit && hit.face) {
        const normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
        cursorMesh.visible = true;
        cursorMesh.position.copy(hit.point).addScaledVector(normal, 0.015);
        const target = hit.point.clone().add(normal);
        cursorMesh.lookAt(target);
      } else {
        cursorMesh.visible = false;
      }
    };

    let downPos = { x: 0, y: 0 };
    const handlePointerDown = (e) => {
      downPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e) => {
      if (transformControls.dragging) return;
      const props = interactionPropsRef.current;
      const dist = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
      if (dist > 6) return; // Ignore orbit drags

      if (!props.stickerPlacementMode) {
        const hit = getCarHit(e.clientX, e.clientY, false);
        if (props.onSelectPart) {
          props.onSelectPart(hit ? hit.object.name || null : null);
        }
        return;
      }

      const hit = getCarHit(e.clientX, e.clientY, true);
      if (!hit || !hit.face) return;

      const normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
      const dummy = new THREE.Object3D();
      dummy.position.copy(hit.point);
      dummy.lookAt(hit.point.clone().add(normal));

      const dataUrl =
        props.activeStickerCustomUrl ||
        renderStickerDataUrl(
          props.activeStickerTemplate,
          props.activeStickerColor,
          props.activeStickerText
        );

      props.onPlaceSticker({
        meshName: hit.object.name || 'car-body-main',
        position: hit.point.toArray(),
        orientation: [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z],
        scale: 0.65,
        rotationZ: 0,
        opacity: 1,
        dataUrl,
        label: props.activeStickerCustomUrl ? 'Sticker Personalizado' : props.activeStickerTemplate
      });
    };

    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (stateRef.current.turntable) {
        carContainer.rotation.y += 0.004;
        decalsGroup.rotation.y += 0.004;
      }
      if (selectionBox.visible) {
        selectionBox.update();
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      transformControls.dispose();
      controls.dispose();
      pmrem.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Rebuild Car when modelId, customModelUrl, or structural mods change
  useEffect(() => {
    const { carContainer, bodyMat, glassMat, rimMat, caliperMat, trimMat, transformControls, selectionBox } =
      stateRef.current;
    if (!carContainer) return;

    transformControls?.detach();
    if (selectionBox) selectionBox.visible = false;

    while (carContainer.children.length > 0) {
      carContainer.remove(carContainer.children[0]);
    }

    const notifyParts = () => {
      if (!onPartsLoaded) return;
      const seen = new Set();
      const parts = [];
      let idx = 0;
      carContainer.traverse((obj) => {
        if (!obj.isMesh) return;
        if (!obj.name) obj.name = `pieza-${idx}`;
        idx += 1;
        if (seen.has(obj.name)) return;
        seen.add(obj.name);
        parts.push({ name: obj.name });
      });
      onPartsLoaded(parts);
    };

    if (customModelUrl && customModelName) {
      let cancelled = false;
      loadCustomCarModel(customModelUrl, customModelName, bodyMat)
        .then((loaded) => {
          if (cancelled) return;
          const prepared = prepareCustomModel(loaded, bodyMat, glassMat, paintAllCustomMeshes);
          carContainer.add(prepared);
          notifyParts();
        })
        .catch((err) => {
          if (cancelled) return;
          console.error('Error loading custom 3D model:', err);
          if (onModelError) {
            onModelError(err?.message || `No se pudo cargar "${customModelName}"`);
          }
          const fallback = buildProceduralCar(
            modelId,
            { bodyMat, glassMat, rimMat, caliperMat, trimMat },
            mods
          );
          carContainer.add(fallback);
          notifyParts();
        });
      return () => {
        cancelled = true;
      };
    } else {
      const car = buildProceduralCar(
        modelId,
        { bodyMat, glassMat, rimMat, caliperMat, trimMat },
        mods
      );
      carContainer.add(car);
      notifyParts();
    }
  }, [
    modelId,
    customModelUrl,
    customModelName,
    paintAllCustomMeshes,
    mods.spoiler,
    mods.rimStyle,
    mods.rideHeight,
    mods.camber,
    mods.headlightsOn,
    mods.underglowEnabled,
    mods.underglowColor
  ]);

  // Update Paint & Material properties in real-time without rebuilding geometry
  useEffect(() => {
    const { bodyMat, glassMat, rimMat, caliperMat } = stateRef.current;
    if (!bodyMat) return;

    bodyMat.color.set(paint.color);
    bodyMat.metalness = paint.metalness;
    bodyMat.roughness = paint.roughness;
    bodyMat.clearcoat = paint.clearcoat;
    bodyMat.clearcoatRoughness = paint.clearcoatRoughness;
    bodyMat.iridescence = paint.iridescence;
    bodyMat.wireframe = sceneConfig.wireframe;
    bodyMat.needsUpdate = true;

    glassMat.opacity = mods.windowTint;
    glassMat.needsUpdate = true;

    rimMat.color.set(mods.rimColor);
    caliperMat.color.set(mods.caliperColor);
  }, [paint, mods.windowTint, mods.rimColor, mods.caliperColor, sceneConfig.wireframe]);

  // Update Studio Theme & Turntable
  useEffect(() => {
    const { scene, floorMesh, lights } = stateRef.current;
    if (!scene) return;
    const theme = STUDIO_THEMES[sceneConfig.theme] || STUDIO_THEMES.showroom;
    scene.background.setHex(theme.bg);
    scene.fog.color.setHex(theme.fog);
    floorMesh.material.color.setHex(theme.floor);
    lights.keyLight.color.setHex(theme.keyColor);
    lights.keyLight.intensity = theme.keyIntensity;
    lights.fillLight.color.setHex(theme.fillColor);
    lights.fillLight.intensity = theme.fillIntensity;
    lights.rimLight.color.setHex(theme.rimColor);
    stateRef.current.turntable = sceneConfig.turntable;
  }, [sceneConfig.theme, sceneConfig.turntable]);

  // Rebuild Decals / Stickers on the car body
  useEffect(() => {
    const { carContainer, decalsGroup } = stateRef.current;
    if (!carContainer || !decalsGroup) return;

    while (decalsGroup.children.length > 0) {
      const child = decalsGroup.children[0];
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
      decalsGroup.remove(child);
    }

    if (!stickers.length) return;

    const loader = new THREE.TextureLoader();
    const paintables = [];
    carContainer.traverse((obj) => {
      if (obj.isMesh && obj.userData.paintable) {
        paintables.push(obj);
      }
    });

    if (!paintables.length) return;

    // Reset rotation momentarily so world matrices align with decal coordinates
    const savedRotY = carContainer.rotation.y;
    carContainer.rotation.y = 0;
    carContainer.updateMatrixWorld(true);

    stickers.forEach((sticker) => {
      const targetMesh =
        paintables.find((m) => m.name === sticker.meshName) || paintables[0];
      if (!targetMesh) return;

      const pos = new THREE.Vector3(...sticker.position);
      const euler = new THREE.Euler(
        sticker.orientation[0],
        sticker.orientation[1],
        sticker.orientation[2] + (sticker.rotationZ || 0)
      );
      const size = new THREE.Vector3(sticker.scale, sticker.scale, 0.55);

      const decalGeo = new DecalGeometry(targetMesh, pos, euler, size);
      const tex = loader.load(sticker.dataUrl);
      tex.colorSpace = THREE.SRGBColorSpace;

      const decalMat = new THREE.MeshStandardMaterial({
        map: tex,
        transparent: true,
        opacity: sticker.opacity ?? 1,
        depthTest: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        roughness: 0.25,
        metalness: 0.1
      });

      const decalMesh = new THREE.Mesh(decalGeo, decalMat);
      decalsGroup.add(decalMesh);
    });

    carContainer.rotation.y = savedRotY;
    decalsGroup.rotation.y = savedRotY;
  }, [stickers, modelId, customModelUrl, mods.rideHeight]);

  // Sync selected part highlight & 3D TransformControls gizmo
  useEffect(() => {
    const { carContainer, transformControls, selectionBox } = stateRef.current;
    if (!carContainer || !transformControls || !selectionBox) return;

    let target = null;
    if (selectedPartName) {
      carContainer.traverse((obj) => {
        if (!target && obj.isMesh && obj.name === selectedPartName) {
          target = obj;
        }
      });
    }

    if (target) {
      selectionBox.setFromObject(target);
      selectionBox.visible = true;
      if (transformMode && transformMode !== 'select') {
        transformControls.setMode(transformMode);
        transformControls.attach(target);
      } else {
        transformControls.detach();
      }
    } else {
      selectionBox.visible = false;
      transformControls.detach();
    }
  }, [selectedPartName, transformMode, modelId, customModelUrl]);

  // Apply per-part visibility & custom color overrides
  useEffect(() => {
    const { carContainer, bodyMat } = stateRef.current;
    if (!carContainer || !bodyMat) return;

    carContainer.traverse((obj) => {
      if (!obj.isMesh || !obj.name) return;
      const ov = partOverrides?.[obj.name];

      if (!obj.userData.baseMaterial) {
        obj.userData.baseMaterial = obj.material;
      }

      obj.visible = ov?.visible !== false;

      if (ov?.color) {
        if (!obj.userData.overrideMaterial) {
          obj.userData.overrideMaterial = bodyMat.clone();
        }
        obj.userData.overrideMaterial.color.set(ov.color);
        obj.userData.overrideMaterial.metalness = bodyMat.metalness;
        obj.userData.overrideMaterial.roughness = bodyMat.roughness;
        obj.userData.overrideMaterial.clearcoat = bodyMat.clearcoat;
        obj.material = obj.userData.overrideMaterial;
      } else if (obj.userData.baseMaterial) {
        obj.material = obj.userData.baseMaterial;
      }
    });
  }, [partOverrides, paint, modelId, customModelUrl]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;

    const ext = getFileExtension(file.name);
    if (SUPPORTED_MODEL_EXTENSIONS.includes(ext)) {
      onDropModelFile?.(file);
      return;
    }

    if (file.type.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.svg', '.webp'].includes(ext)) {
      const reader = new FileReader();
      reader.onload = () => {
        onDropStickerFile?.(reader.result);
      };
      reader.readAsDataURL(file);
      return;
    }

    onModelError?.(`Archivo no reconocido: ${file.name}`);
  };

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`viewport-canvas ${stickerPlacementMode ? 'cursor-crosshair' : ''} ${
        isDraggingFile ? 'drag-active' : ''
      }`}
    >
      {isDraggingFile && (
        <div className="drop-overlay">
          <span>Suelta aquí tu Modelo 3D (.GLB, .OBJ, .FBX, .STL) o Sticker (.PNG/.SVG)</span>
        </div>
      )}
    </div>
  );
});
