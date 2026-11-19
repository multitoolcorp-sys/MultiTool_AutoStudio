import React from 'react';
import { Camera, Download, Save, FolderOpen, RotateCw, Grid } from 'lucide-react';
import { buildPaintCodeSummary } from '../data/paintCatalog';

export function SceneExportPanel({
  sceneConfig,
  onChangeScene,
  onSelectCamera,
  onCaptureScreenshot,
  onSaveBuild,
  onLoadBuild,
  savedBuilds,
  paint,
  modelId,
  mods
}) {
  const handleExportRecipe = () => {
    const summary = buildPaintCodeSummary(paint);
    const payload = {
      app: 'MultiTool AutoStudio',
      exportedAt: new Date().toISOString(),
      modelId,
      paintCode: summary,
      paintMaterial: paint,
      modifications: mods
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apex-build-${summary.hex.replace('#', '')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="panel-stack">
      <div className="section-card">
        <div className="section-header">
          <span>Iluminación de Estudio</span>
        </div>
        <div className="segmented-row">
          {[
            { id: 'showroom', label: 'Showroom' },
            { id: 'neon', label: 'Neón Night' },
            { id: 'sunset', label: 'Atardecer' }
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              className={`seg-btn ${sceneConfig.theme === t.id ? 'active' : ''}`}
              onClick={() => onChangeScene({ ...sceneConfig, theme: t.id })}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="toggle-list" style={{ marginTop: '12px' }}>
          <label className="switch-row">
            <span className="icon-label">
              <RotateCw size={14} /> Plataforma Giratoria
            </span>
            <input
              type="checkbox"
              checked={sceneConfig.turntable}
              onChange={(e) =>
                onChangeScene({ ...sceneConfig, turntable: e.target.checked })
              }
            />
          </label>
          <label className="switch-row">
            <span className="icon-label">
              <Grid size={14} /> Modo Malla (Wireframe)
            </span>
            <input
              type="checkbox"
              checked={sceneConfig.wireframe}
              onChange={(e) =>
                onChangeScene({ ...sceneConfig, wireframe: e.target.checked })
              }
            />
          </label>
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <span>Ángulos de Cámara</span>
        </div>
        <div className="camera-grid">
          {[
            { id: '3/4', label: '3/4 Clásico' },
            { id: 'front', label: 'Frontal' },
            { id: 'side', label: 'Lateral' },
            { id: 'rear', label: 'Trasera' },
            { id: 'top', label: 'Cenital' }
          ].map((cam) => (
            <button
              key={cam.id}
              type="button"
              className="seg-btn"
              onClick={() => onSelectCamera(cam.id)}
            >
              {cam.label}
            </button>
          ))}
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <span>Exportar y Guardar</span>
        </div>

        <div className="export-actions">
          <button type="button" className="action-btn primary" onClick={onCaptureScreenshot}>
            <Camera size={15} /> Capturar Foto PNG
          </button>
          <button type="button" className="action-btn" onClick={handleExportRecipe}>
            <Download size={15} /> Exportar Ficha de Color (.JSON)
          </button>
          <button type="button" className="action-btn" onClick={onSaveBuild}>
            <Save size={15} /> Guardar Diseño en Navegador
          </button>
        </div>

        {savedBuilds.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <div className="sub-label">Diseños Guardados</div>
            <div className="saved-list">
              {savedBuilds.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className="saved-item"
                  onClick={() => onLoadBuild(b)}
                >
                  <span
                    className="oem-swatch"
                    style={{ backgroundColor: b.paint.color }}
                  />
                  <div>
                    <strong>{b.name}</strong>
                    <span className="mono">{b.date}</span>
                  </div>
                  <FolderOpen size={14} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
