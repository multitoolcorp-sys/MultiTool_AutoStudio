import React, { useState } from 'react';
import { Copy, Check, Sparkles, Search } from 'lucide-react';
import {
  FINISH_PRESETS,
  OEM_PAINT_CODES,
  buildPaintCodeSummary
} from '../data/paintCatalog';

export function PaintPanel({ paint, onChangePaint }) {
  const [search, setSearch] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);

  const summary = buildPaintCodeSummary(paint);

  const copyValue = (key, value) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const applyFinish = (preset) => {
    onChangePaint({
      ...paint,
      finish: preset.id,
      metalness: preset.metalness,
      roughness: preset.roughness,
      clearcoat: preset.clearcoat,
      clearcoatRoughness: preset.clearcoatRoughness,
      iridescence: preset.iridescence
    });
  };

  const applyOem = (oem) => {
    const preset = FINISH_PRESETS.find((f) => f.id === oem.finish) || FINISH_PRESETS[0];
    onChangePaint({
      color: oem.hex,
      oemCode: `${oem.code} (${oem.brand} ${oem.name})`,
      finish: preset.id,
      metalness: preset.metalness,
      roughness: preset.roughness,
      clearcoat: preset.clearcoat,
      clearcoatRoughness: preset.clearcoatRoughness,
      iridescence: preset.iridescence
    });
  };

  const filteredOem = OEM_PAINT_CODES.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.brand.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="panel-stack">
      <div className="section-card">
        <div className="section-header">
          <span>Mezclador de Color</span>
          <span className="badge-mono">{summary.hex}</span>
        </div>

        <div className="color-picker-row">
          <input
            type="color"
            value={paint.color}
            onChange={(e) =>
              onChangePaint({ ...paint, color: e.target.value, oemCode: null })
            }
            className="color-well"
            aria-label="Selector de color"
          />
          <div className="hex-input-wrap">
            <label>Código HEX</label>
            <input
              type="text"
              value={paint.color.toUpperCase()}
              onChange={(e) => {
                const val = e.target.value;
                if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                  onChangePaint({ ...paint, color: val, oemCode: null });
                }
              }}
              className="text-input mono"
            />
          </div>
        </div>

        <div className="code-grid">
          {[
            { label: 'Código Pintura', key: 'code', val: summary.code },
            { label: 'HEX', key: 'hex', val: summary.hex },
            { label: 'RGB', key: 'rgb', val: summary.rgb },
            { label: 'HSL', key: 'hsl', val: summary.hsl },
            { label: 'CMYK', key: 'cmyk', val: summary.cmyk }
          ].map((row) => (
            <button
              key={row.key}
              type="button"
              className="code-chip"
              onClick={() => copyValue(row.key, row.val)}
              title="Clic para copiar"
            >
              <div>
                <span className="code-label">{row.label}</span>
                <span className="code-val">{row.val}</span>
              </div>
              {copiedKey === row.key ? (
                <Check size={14} className="text-emerald" />
              ) : (
                <Copy size={14} className="text-muted" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <span>Acabado de Pintura</span>
          <Sparkles size={14} className="text-cyan" />
        </div>
        <div className="finish-grid">
          {FINISH_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyFinish(preset)}
              className={`finish-btn ${paint.finish === preset.id ? 'active' : ''}`}
            >
              {preset.name}
            </button>
          ))}
        </div>

        <div className="sliders-group">
          <label className="slider-row">
            <div>
              <span>Metalizado</span>
              <span className="mono">{Math.round(paint.metalness * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={paint.metalness}
              onChange={(e) =>
                onChangePaint({ ...paint, metalness: parseFloat(e.target.value) })
              }
            />
          </label>

          <label className="slider-row">
            <div>
              <span>Rugosidad (Mate ↔ Brillo)</span>
              <span className="mono">{Math.round(paint.roughness * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.02"
              max="0.95"
              step="0.01"
              value={paint.roughness}
              onChange={(e) =>
                onChangePaint({ ...paint, roughness: parseFloat(e.target.value) })
              }
            />
          </label>

          <label className="slider-row">
            <div>
              <span>Laca Transparente (Clearcoat)</span>
              <span className="mono">{Math.round(paint.clearcoat * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={paint.clearcoat}
              onChange={(e) =>
                onChangePaint({ ...paint, clearcoat: parseFloat(e.target.value) })
              }
            />
          </label>

          <label className="slider-row">
            <div>
              <span>Efecto Perlado / Camaleón</span>
              <span className="mono">{Math.round(paint.iridescence * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={paint.iridescence}
              onChange={(e) =>
                onChangePaint({ ...paint, iridescence: parseFloat(e.target.value) })
              }
            />
          </label>
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <span>Catálogo Códigos OEM</span>
          <span className="badge-mono">{filteredOem.length}</span>
        </div>

        <div className="search-box">
          <Search size={14} />
          <input
            type="text"
            placeholder="Buscar Ferrari, LP2, Azul..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="oem-list">
          {filteredOem.map((oem) => (
            <button
              key={oem.code}
              type="button"
              className="oem-item"
              onClick={() => applyOem(oem)}
            >
              <span
                className="oem-swatch"
                style={{ backgroundColor: oem.hex }}
              />
              <div className="oem-meta">
                <strong>
                  {oem.brand} · {oem.name}
                </strong>
                <span className="mono">
                  {oem.code} · {oem.hex} · {oem.finish.toUpperCase()}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
