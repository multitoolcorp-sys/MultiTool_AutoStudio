import React, { useState, useRef, useEffect } from 'react';
import {
  Palette,
  Sticker,
  Wrench,
  Sliders,
  Camera,
  Layers,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { CarViewport } from './components/CarViewport';
import { PaintPanel } from './components/PaintPanel';
import { StickerPanel } from './components/StickerPanel';
import { PartsPanel } from './components/PartsPanel';
import { ModsPanel } from './components/ModsPanel';
import { SceneExportPanel } from './components/SceneExportPanel';
import { buildPaintCodeSummary } from './data/paintCatalog';

const INITIAL_PAINT = {
  color: '#00A3E0',
  oemCode: 'POR-M5C (Porsche Miami Blue)',
  finish: 'gloss',
  metalness: 0.25,
  roughness: 0.14,
  clearcoat: 1.0,
  clearcoatRoughness: 0.05,
  iridescence: 0.0
};

const INITIAL_MODS = {
  spoiler: 'gt-wing',
  rimStyle: 'sport-5',
  rimColor: '#e5e7eb',
  caliperColor: '#ef4444',
  rideHeight: 0,
  camber: 1.5,
  windowTint: 0.65,
  headlightsOn: true,
  underglowEnabled: false,
  underglowColor: '#06b6d4'
};

const STORAGE_KEY = 'apex_customs_3d_builds_v1';

export default function App() {
  const viewportRef = useRef(null);
  const [activeTab, setActiveTab] = useState('paint');
  const [modelId, setModelId] = useState('gt-coupe');
  const [customModelUrl, setCustomModelUrl] = useState(null);
  const [customModelName, setCustomModelName] = useState(null);
  const [paintAllCustomMeshes, setPaintAllCustomMeshes] = useState(false);
  const [paint, setPaint] = useState(INITIAL_PAINT);
  const [mods, setMods] = useState(INITIAL_MODS);
  const [stickers, setStickers] = useState([]);

  // Sticker tool state
  const [stickerPlacementMode, setStickerPlacementMode] = useState(false);
  const [activeStickerTemplate, setActiveStickerTemplate] = useState('racing-stripes');
  const [activeStickerColor, setActiveStickerColor] = useState('#ffffff');
  const [activeStickerText, setActiveStickerText] = useState('77');
  const [activeStickerCustomUrl, setActiveStickerCustomUrl] = useState(null);

  // Part selection & 3D Transform state
  const [partsList, setPartsList] = useState([]);
  const [selectedPartName, setSelectedPartName] = useState(null);
  const [transformMode, setTransformMode] = useState('select');
  const [partOverrides, setPartOverrides] = useState({});

  // Scene state
  const [sceneConfig, setSceneConfig] = useState({
    theme: 'showroom',
    turntable: false,
    wireframe: false
  });
  const [mobileExpanded3D, setMobileExpanded3D] = useState(false);

  const [savedBuilds, setSavedBuilds] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = (msg) => setToast(msg);

  const handlePlaceSticker = (decalData) => {
    setStickers((prev) => [
      ...prev,
      { ...decalData, id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }
    ]);
    showToast('Sticker aplicado en el modelo 3D');
  };

  const handleUpdateSticker = (id, patch) => {
    setStickers((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const handleRemoveSticker = (id) => {
    setStickers((prev) => prev.filter((s) => s.id !== id));
  };

  const handleUpdatePartOverride = (partName, patch) => {
    setPartOverrides((prev) => ({
      ...prev,
      [partName]: { ...(prev[partName] || {}), ...patch }
    }));
  };

  const handleDropModelFile = (file) => {
    const url = URL.createObjectURL(file);
    setCustomModelUrl(url);
    setCustomModelName(file.name);
    setSelectedPartName(null);
    setPartOverrides({});
    showToast(`Cargando modelo: ${file.name}`);
  };

  const handleDropStickerFile = (dataUrl) => {
    setActiveStickerCustomUrl(dataUrl);
    setStickerPlacementMode(true);
    setActiveTab('stickers');
    showToast('Sticker cargado — haz clic en el auto para pegarlo');
  };

  const handleCaptureScreenshot = () => {
    const dataUrl = viewportRef.current?.captureScreenshot();
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `apex-customs-${paint.color.replace('#', '')}.png`;
    a.click();
    showToast('Captura PNG guardada');
  };

  const handleSaveBuild = () => {
    const summary = buildPaintCodeSummary(paint);
    const entry = {
      id: `build-${Date.now()}`,
      name: `${modelId.toUpperCase()} · ${summary.hex}`,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelId,
      paint,
      mods,
      stickers
    };
    const next = [entry, ...savedBuilds].slice(0, 8);
    setSavedBuilds(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      showToast('Diseño guardado en el navegador');
    } catch {
      showToast('Diseño guardado en sesión');
    }
  };

  const handleLoadBuild = (build) => {
    setCustomModelUrl(null);
    setCustomModelName(null);
    setModelId(build.modelId);
    setPaint(build.paint);
    setMods(build.mods);
    setStickers(build.stickers || []);
    showToast(`Cargado: ${build.name}`);
  };

  const paintSummary = buildPaintCodeSummary(paint);

  return (
    <div className={`app-shell ${mobileExpanded3D ? 'mobile-expanded-3d' : ''}`}>
      {/* Main 3D Viewport */}
      <main className="viewport-area">
        <header className="top-hud">
          <div className="brand-block">
            <img src="/icon.png" alt="MultiTool AutoStudio" className="brand-icon-img" />
            <div>
              <h1>MultiTool AutoStudio</h1>
              <span className="brand-sub">
                {customModelName ? `Modelo: ${customModelName}` : 'Pintura, Stickers & Modificación 3D'}
              </span>
            </div>
          </div>

          <div className="hud-right">
            <div className="active-paint-pill">
              <span className="swatch-dot" style={{ backgroundColor: paint.color }} />
              <span className="mono">{paintSummary.code}</span>
            </div>

            <div className="quick-cam-group">
              {['3/4', 'front', 'side', 'rear'].map((cam) => (
                <button
                  key={cam}
                  type="button"
                  className="hud-btn"
                  onClick={() => viewportRef.current?.setCameraPreset(cam)}
                >
                  {cam.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="hud-btn accent"
              onClick={handleCaptureScreenshot}
              title="Capturar imagen PNG"
            >
              <Camera size={15} />
              <span className="hide-mobile">Foto</span>
            </button>

            <button
              type="button"
              className="hud-btn mobile-only"
              onClick={() => {
                setMobileExpanded3D((v) => !v);
                setTimeout(() => window.dispatchEvent(new Event('resize')), 60);
              }}
              title={mobileExpanded3D ? 'Mostrar controles' : 'Expandir 3D'}
            >
              {mobileExpanded3D ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
          </div>
        </header>

        <CarViewport
          ref={viewportRef}
          modelId={modelId}
          customModelUrl={customModelUrl}
          customModelName={customModelName}
          paintAllCustomMeshes={paintAllCustomMeshes}
          paint={paint}
          mods={mods}
          stickers={stickers}
          stickerPlacementMode={stickerPlacementMode}
          activeStickerTemplate={activeStickerTemplate}
          activeStickerColor={activeStickerColor}
          activeStickerText={activeStickerText}
          activeStickerCustomUrl={activeStickerCustomUrl}
          sceneConfig={sceneConfig}
          selectedPartName={selectedPartName}
          transformMode={transformMode}
          partOverrides={partOverrides}
          onPlaceSticker={handlePlaceSticker}
          onSelectPart={(name) => {
            setSelectedPartName(name);
          }}
          onPartsLoaded={setPartsList}
          onDropModelFile={handleDropModelFile}
          onDropStickerFile={handleDropStickerFile}
          onModelError={(msg) => showToast(msg)}
        />

        {stickerPlacementMode && (
          <div className="floating-banner">
            <span>Modo Sticker Activo: Haz clic sobre la carrocería para pegarlo</span>
            <button type="button" onClick={() => setStickerPlacementMode(false)}>
              Salir
            </button>
          </div>
        )}

        {!stickerPlacementMode && selectedPartName && (
          <div className="floating-banner part-pill">
            <span>Pieza seleccionada: {selectedPartName}</span>
            <button type="button" onClick={() => setActiveTab('parts')}>
              Editar
            </button>
            <button type="button" onClick={() => setSelectedPartName(null)}>
              ✕
            </button>
          </div>
        )}

        <div className="controls-hint">
          Arrastra modelos 3D o stickers aquí · Clic en pieza para seleccionar · Rueda = Zoom libre
        </div>

        {toast && <div className="toast-pill">{toast}</div>}
      </main>

      {/* Right Studio Sidebar */}
      <aside className="studio-sidebar">
        <nav className="sidebar-tabs" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
          {[
            { id: 'paint', label: 'Pintura', icon: Palette },
            { id: 'stickers', label: 'Stickers', icon: Sticker },
            { id: 'parts', label: 'Partes', icon: Layers },
            { id: 'mods', label: '3D / Mods', icon: Wrench },
            { id: 'scene', label: 'Escena', icon: Sliders }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id !== 'stickers' && stickerPlacementMode) {
                    setStickerPlacementMode(false);
                  }
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-content">
          {activeTab === 'paint' && (
            <PaintPanel paint={paint} onChangePaint={setPaint} />
          )}

          {activeTab === 'stickers' && (
            <StickerPanel
              stickerPlacementMode={stickerPlacementMode}
              onTogglePlacement={() => setStickerPlacementMode((v) => !v)}
              activeStickerTemplate={activeStickerTemplate}
              onChangeTemplate={setActiveStickerTemplate}
              activeStickerColor={activeStickerColor}
              onChangeColor={setActiveStickerColor}
              activeStickerText={activeStickerText}
              onChangeText={setActiveStickerText}
              activeStickerCustomUrl={activeStickerCustomUrl}
              onUploadCustomSticker={setActiveStickerCustomUrl}
              stickers={stickers}
              onUpdateSticker={handleUpdateSticker}
              onRemoveSticker={handleRemoveSticker}
              onClearStickers={() => setStickers([])}
            />
          )}

          {activeTab === 'parts' && (
            <PartsPanel
              partsList={partsList}
              selectedPartName={selectedPartName}
              onSelectPart={setSelectedPartName}
              transformMode={transformMode}
              onChangeTransformMode={setTransformMode}
              partOverrides={partOverrides}
              onUpdatePartOverride={handleUpdatePartOverride}
              onResetAllParts={() => {
                setPartOverrides({});
                setSelectedPartName(null);
              }}
            />
          )}

          {activeTab === 'mods' && (
            <ModsPanel
              modelId={modelId}
              onChangeModel={setModelId}
              customModelUrl={customModelUrl}
              customModelName={customModelName}
              paintAllCustomMeshes={paintAllCustomMeshes}
              onTogglePaintAllCustom={setPaintAllCustomMeshes}
              onUploadCustomModel={(url, name) => {
                setCustomModelUrl(url);
                setCustomModelName(name);
                if (name) showToast(`Cargando modelo: ${name}`);
              }}
              mods={mods}
              onChangeMods={setMods}
            />
          )}

          {activeTab === 'scene' && (
            <SceneExportPanel
              sceneConfig={sceneConfig}
              onChangeScene={setSceneConfig}
              onSelectCamera={(id) => viewportRef.current?.setCameraPreset(id)}
              onCaptureScreenshot={handleCaptureScreenshot}
              onSaveBuild={handleSaveBuild}
              onLoadBuild={handleLoadBuild}
              savedBuilds={savedBuilds}
              paint={paint}
              modelId={modelId}
              mods={mods}
            />
          )}
        </div>
      </aside>
    </div>
  );
}
