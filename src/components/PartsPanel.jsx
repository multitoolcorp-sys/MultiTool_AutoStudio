import React, { useState } from 'react';
import {
  MousePointer,
  Move,
  RotateCw,
  Maximize2,
  Eye,
  EyeOff,
  RotateCcw,
  Search
} from 'lucide-react';

export function PartsPanel({
  partsList,
  selectedPartName,
  onSelectPart,
  transformMode,
  onChangeTransformMode,
  partOverrides,
  onUpdatePartOverride,
  onResetAllParts
}) {
  const [search, setSearch] = useState('');

  const selectedOverride = selectedPartName ? partOverrides[selectedPartName] || {} : {};
  const filteredParts = partsList.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="panel-stack">
      <div className="section-card">
        <div className="section-header">
          <span>Manipulación 3D (Drag & Drop)</span>
          {selectedPartName && (
            <button
              type="button"
              className="mini-link"
              onClick={() => onSelectPart(null)}
            >
              Deseleccionar
            </button>
          )}
        </div>

        <p className="helper-text" style={{ marginTop: 0, marginBottom: '10px' }}>
          Haz clic sobre cualquier pieza del auto 3D o elígela abajo para moverla, rotarla, ocultarla o pintarla por separado.
        </p>

        <div className="gizmo-grid">
          {[
            { id: 'select', label: 'Seleccionar', icon: MousePointer },
            { id: 'translate', label: 'Mover', icon: Move },
            { id: 'rotate', label: 'Rotar', icon: RotateCw },
            { id: 'scale', label: 'Escalar', icon: Maximize2 }
          ].map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                type="button"
                className={`seg-btn gizmo-btn ${transformMode === mode.id ? 'active' : ''}`}
                onClick={() => onChangeTransformMode(mode.id)}
              >
                <Icon size={14} />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedPartName ? (
        <div className="section-card">
          <div className="section-header">
            <span>Pieza: {selectedPartName}</span>
            <button
              type="button"
              className="mini-link"
              onClick={() =>
                onUpdatePartOverride(selectedPartName, {
                  visible: !(selectedOverride.visible !== false)
                })
              }
            >
              {selectedOverride.visible === false ? (
                <>
                  <EyeOff size={13} /> Oculta
                </>
              ) : (
                <>
                  <Eye size={13} /> Visible
                </>
              )}
            </button>
          </div>

          <div className="dual-color-row" style={{ marginBottom: '10px' }}>
            <label className="inline-field">
              <span>Color Propio</span>
              <input
                type="color"
                value={selectedOverride.color || '#ffffff'}
                onChange={(e) =>
                  onUpdatePartOverride(selectedPartName, { color: e.target.value })
                }
                className="color-well-sm"
              />
            </label>

            {selectedOverride.color && (
              <button
                type="button"
                className="mini-danger"
                onClick={() =>
                  onUpdatePartOverride(selectedPartName, { color: undefined })
                }
              >
                Usar pintura base
              </button>
            )}
          </div>

          <label className="switch-row">
            <span>Mostrar esta pieza</span>
            <input
              type="checkbox"
              checked={selectedOverride.visible !== false}
              onChange={(e) =>
                onUpdatePartOverride(selectedPartName, { visible: e.target.checked })
              }
            />
          </label>
        </div>
      ) : (
        <div className="section-card">
          <p className="helper-text" style={{ marginTop: 0 }}>
            Ninguna pieza seleccionada. Haz clic en el capó, rines, alerón, vidrios o cualquier parte del modelo 3D.
          </p>
        </div>
      )}

      <div className="section-card">
        <div className="section-header">
          <span>Partes del Modelo ({partsList.length})</span>
          {Object.keys(partOverrides).length > 0 && (
            <button type="button" className="mini-danger" onClick={onResetAllParts}>
              <RotateCcw size={12} /> Resetear
            </button>
          )}
        </div>

        <div className="search-box">
          <Search size={14} />
          <input
            type="text"
            placeholder="Filtrar pieza..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="oem-list">
          {filteredParts.map((part) => {
            const ov = partOverrides[part.name] || {};
            const isSelected = selectedPartName === part.name;
            return (
              <div
                key={part.name}
                className={`part-row ${isSelected ? 'active' : ''}`}
              >
                <button
                  type="button"
                  className="part-select-btn"
                  onClick={() => onSelectPart(part.name)}
                >
                  <span
                    className="part-dot"
                    style={{
                      backgroundColor: ov.color || 'rgba(6, 182, 212, 0.5)'
                    }}
                  />
                  <span className="part-name">{part.name}</span>
                </button>
                <button
                  type="button"
                  className="icon-btn-subtle"
                  onClick={() =>
                    onUpdatePartOverride(part.name, {
                      visible: !(ov.visible !== false)
                    })
                  }
                  title={ov.visible === false ? 'Mostrar' : 'Ocultar'}
                >
                  {ov.visible === false ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
