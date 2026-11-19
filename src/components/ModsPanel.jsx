import React from 'react';
import { Upload, RotateCcw } from 'lucide-react';
import { CAR_MODELS } from '../three/carBuilder';
import { SUPPORTED_MODEL_EXTENSIONS } from '../three/modelLoader';

export function ModsPanel({
  modelId,
  onChangeModel,
  customModelUrl,
  customModelName,
  paintAllCustomMeshes,
  onTogglePaintAllCustom,
  onUploadCustomModel,
  mods,
  onChangeMods
}) {
  const handleModelUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onUploadCustomModel(url, file.name);
  };

  return (
    <div className="panel-stack">
      <div className="section-card">
        <div className="section-header">
          <span>Modelo 3D Base</span>
          {customModelUrl && (
            <button
              type="button"
              className="mini-link"
              onClick={() => onUploadCustomModel(null, null)}
            >
              <RotateCcw size={12} /> Volver a integrados
            </button>
          )}
        </div>

        <div className="model-list">
          {CAR_MODELS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                onUploadCustomModel(null, null);
                onChangeModel(m.id);
              }}
              className={`model-card ${!customModelUrl && modelId === m.id ? 'active' : ''}`}
            >
              <strong>{m.name}</strong>
              <span>{m.subtitle}</span>
            </button>
          ))}
        </div>

        <label className="upload-btn full-width" style={{ marginTop: '10px' }}>
          <Upload size={14} />
          <span>Importar Modelo 3D (.OBJ, .FBX, .GLB, .STL...)</span>
          <input
            type="file"
            accept={SUPPORTED_MODEL_EXTENSIONS.join(',')}
            onChange={handleModelUpload}
            hidden
          />
        </label>
        <p className="helper-text">
          Formatos compatibles: GLB, GLTF, OBJ, FBX, STL, DAE, PLY y 3DS.
        </p>

        {customModelUrl && (
          <div style={{ marginTop: '10px' }}>
            <label className="switch-row">
              <span>Pintar todo el modelo ({customModelName})</span>
              <input
                type="checkbox"
                checked={paintAllCustomMeshes}
                onChange={(e) => onTogglePaintAllCustom(e.target.checked)}
              />
            </label>
          </div>
        )}
      </div>

      <div className="section-card">
        <div className="section-header">
          <span>Aerodinámica y Rines</span>
        </div>

        <div className="sub-label">Alerón Trasero</div>
        <div className="segmented-row">
          {[
            { id: 'none', label: 'Limpio' },
            { id: 'lip', label: 'Lip Carbono' },
            { id: 'gt-wing', label: 'GT Wing' }
          ].map((sp) => (
            <button
              key={sp.id}
              type="button"
              className={`seg-btn ${mods.spoiler === sp.id ? 'active' : ''}`}
              onClick={() => onChangeMods({ ...mods, spoiler: sp.id })}
            >
              {sp.label}
            </button>
          ))}
        </div>

        <div className="sub-label">Diseño de Rines</div>
        <div className="segmented-row">
          {[
            { id: 'sport-5', label: '5 Radios' },
            { id: 'mesh-10', label: '10 Radios' },
            { id: 'deep-dish', label: 'Deep Dish' }
          ].map((rim) => (
            <button
              key={rim.id}
              type="button"
              className={`seg-btn ${mods.rimStyle === rim.id ? 'active' : ''}`}
              onClick={() => onChangeMods({ ...mods, rimStyle: rim.id })}
            >
              {rim.label}
            </button>
          ))}
        </div>

        <div className="dual-color-row">
          <label className="inline-field">
            <span>Color Rines</span>
            <input
              type="color"
              value={mods.rimColor}
              onChange={(e) => onChangeMods({ ...mods, rimColor: e.target.value })}
              className="color-well-sm"
            />
          </label>
          <label className="inline-field">
            <span>Cáliper Freno</span>
            <input
              type="color"
              value={mods.caliperColor}
              onChange={(e) => onChangeMods({ ...mods, caliperColor: e.target.value })}
              className="color-well-sm"
            />
          </label>
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <span>Suspensión y Stance</span>
        </div>
        <div className="sliders-group">
          <label className="slider-row">
            <div>
              <span>Altura de Suspensión</span>
              <span className="mono">{Math.round(mods.rideHeight * 100)} cm</span>
            </div>
            <input
              type="range"
              min="-0.08"
              max="0.09"
              step="0.01"
              value={mods.rideHeight}
              onChange={(e) =>
                onChangeMods({ ...mods, rideHeight: parseFloat(e.target.value) })
              }
            />
          </label>

          <label className="slider-row">
            <div>
              <span>Camber (Inclinación Ruedas)</span>
              <span className="mono">{mods.camber}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={mods.camber}
              onChange={(e) =>
                onChangeMods({ ...mods, camber: parseFloat(e.target.value) })
              }
            />
          </label>

          <label className="slider-row">
            <div>
              <span>Polarizado de Vidrios</span>
              <span className="mono">{Math.round(mods.windowTint * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="0.96"
              step="0.02"
              value={mods.windowTint}
              onChange={(e) =>
                onChangeMods({ ...mods, windowTint: parseFloat(e.target.value) })
              }
            />
          </label>
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <span>Iluminación</span>
        </div>
        <div className="toggle-list">
          <label className="switch-row">
            <span>Faros LED Encendidos</span>
            <input
              type="checkbox"
              checked={mods.headlightsOn}
              onChange={(e) =>
                onChangeMods({ ...mods, headlightsOn: e.target.checked })
              }
            />
          </label>

          <label className="switch-row">
            <span>Neón Inferior (Underglow)</span>
            <input
              type="checkbox"
              checked={mods.underglowEnabled}
              onChange={(e) =>
                onChangeMods({ ...mods, underglowEnabled: e.target.checked })
              }
            />
          </label>

          {mods.underglowEnabled && (
            <label className="inline-field" style={{ marginTop: '6px' }}>
              <span>Color Neón</span>
              <input
                type="color"
                value={mods.underglowColor}
                onChange={(e) =>
                  onChangeMods({ ...mods, underglowColor: e.target.value })
                }
                className="color-well-sm"
              />
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
