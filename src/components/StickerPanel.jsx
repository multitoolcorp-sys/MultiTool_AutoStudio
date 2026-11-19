import React from 'react';
import { Crosshair, Trash2, Upload, RotateCcw } from 'lucide-react';
import { STICKER_TEMPLATES, renderStickerDataUrl } from '../data/stickerCatalog';

export function StickerPanel({
  stickerPlacementMode,
  onTogglePlacement,
  activeStickerTemplate,
  onChangeTemplate,
  activeStickerColor,
  onChangeColor,
  activeStickerText,
  onChangeText,
  activeStickerCustomUrl,
  onUploadCustomSticker,
  stickers,
  onUpdateSticker,
  onRemoveSticker,
  onClearStickers
}) {
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onUploadCustomSticker(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="panel-stack">
      <div className="section-card">
        <button
          type="button"
          onClick={onTogglePlacement}
          className={`primary-toggle-btn ${stickerPlacementMode ? 'active' : ''}`}
        >
          <Crosshair size={16} />
          {stickerPlacementMode
            ? 'Modo Colocar ACTIVO — Haz clic en el auto 3D'
            : 'Activar Modo Colocar Sticker en el Auto'}
        </button>
        <p className="helper-text">
          Cuando está activo, apunta sobre cualquier parte de la carrocería 3D y haz clic para proyectar el vinilo.
        </p>
      </div>

      <div className="section-card">
        <div className="section-header">
          <span>Biblioteca de Stickers</span>
          {activeStickerCustomUrl && (
            <button
              type="button"
              className="mini-link"
              onClick={() => onUploadCustomSticker(null)}
            >
              Usar plantilla
            </button>
          )}
        </div>

        <div className="sticker-grid">
          {STICKER_TEMPLATES.map((tpl) => {
            const preview = renderStickerDataUrl(tpl.id, activeStickerColor, activeStickerText);
            const isSelected = !activeStickerCustomUrl && activeStickerTemplate === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => {
                  onUploadCustomSticker(null);
                  onChangeTemplate(tpl.id);
                }}
                className={`sticker-tile ${isSelected ? 'active' : ''}`}
              >
                <img src={preview} alt={tpl.name} />
                <span>{tpl.name}</span>
              </button>
            );
          })}
        </div>

        <div className="sticker-config-row">
          <label className="inline-field">
            <span>Color Vinilo</span>
            <input
              type="color"
              value={activeStickerColor}
              onChange={(e) => onChangeColor(e.target.value)}
              className="color-well-sm"
            />
          </label>

          {activeStickerTemplate === 'number-plate' && (
            <label className="inline-field">
              <span>Dorsal</span>
              <input
                type="text"
                maxLength={3}
                value={activeStickerText}
                onChange={(e) => onChangeText(e.target.value)}
                className="text-input mono"
                style={{ width: '76px' }}
              />
            </label>
          )}

          <label className="upload-btn">
            <Upload size={14} />
            <span>Subir PNG/SVG</span>
            <input type="file" accept="image/*" onChange={handleFileChange} hidden />
          </label>
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <span>Capas Aplicadas ({stickers.length})</span>
          {stickers.length > 0 && (
            <button type="button" className="mini-danger" onClick={onClearStickers}>
              <RotateCcw size={12} /> Limpiar
            </button>
          )}
        </div>

        {stickers.length === 0 ? (
          <p className="helper-text">
            Aún no hay stickers en el auto. Activa el modo colocar y haz clic sobre el capó, puertas o techo.
          </p>
        ) : (
          <div className="layers-list">
            {stickers.map((st, idx) => (
              <div key={st.id} className="layer-item">
                <div className="layer-top">
                  <img src={st.dataUrl} alt={st.label} className="layer-thumb" />
                  <div className="layer-title">
                    <strong>
                      #{idx + 1} · {st.label}
                    </strong>
                    <span className="mono">{st.meshName}</span>
                  </div>
                  <button
                    type="button"
                    className="icon-btn-danger"
                    onClick={() => onRemoveSticker(st.id)}
                    title="Eliminar sticker"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="layer-sliders">
                  <label>
                    <span>Tamaño</span>
                    <input
                      type="range"
                      min="0.18"
                      max="1.8"
                      step="0.02"
                      value={st.scale}
                      onChange={(e) =>
                        onUpdateSticker(st.id, { scale: parseFloat(e.target.value) })
                      }
                    />
                  </label>
                  <label>
                    <span>Rotación</span>
                    <input
                      type="range"
                      min="-3.14"
                      max="3.14"
                      step="0.05"
                      value={st.rotationZ || 0}
                      onChange={(e) =>
                        onUpdateSticker(st.id, { rotationZ: parseFloat(e.target.value) })
                      }
                    />
                  </label>
                  <label>
                    <span>Opacidad</span>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={st.opacity ?? 1}
                      onChange={(e) =>
                        onUpdateSticker(st.id, { opacity: parseFloat(e.target.value) })
                      }
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
