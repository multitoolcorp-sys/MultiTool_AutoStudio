export const STICKER_TEMPLATES = [
  { id: 'racing-stripes', name: 'Franjas Racing', category: 'Líneas' },
  { id: 'number-plate', name: 'Número Dorsal', category: 'Competición' },
  { id: 'apex-badge', name: 'APEX Motorsport', category: 'Marcas' },
  { id: 'turbo-badge', name: 'TURBO SPEC', category: 'Marcas' },
  { id: 'checkered', name: 'Bandera Cuadros', category: 'Competición' },
  { id: 'lightning', name: 'Rayo Drift', category: 'Gráficos' },
  { id: 'drift-arrow', name: 'Flecha Tow', category: 'Competición' },
  { id: 'star-emblem', name: 'Estrella GT', category: 'Gráficos' }
];

/**
 * Generates a crisp 512x512 transparent canvas data URL for a built-in sticker.
 */
export function renderStickerDataUrl(templateId, color = '#ffffff', customText = '77') {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);

  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;

  switch (templateId) {
    case 'racing-stripes': {
      ctx.fillRect(156, 20, 76, 472);
      ctx.fillRect(280, 20, 76, 472);
      ctx.fillRect(128, 20, 14, 472);
      ctx.fillRect(370, 20, 14, 472);
      break;
    }
    case 'number-plate': {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(64, 96, 384, 320, 36);
      ctx.fill();
      ctx.lineWidth = 14;
      ctx.strokeStyle = color;
      ctx.stroke();

      ctx.fillStyle = '#111827';
      ctx.font = '900 200px Orbitron, Arial Black, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((customText || '77').slice(0, 3), 256, 266);
      break;
    }
    case 'apex-badge': {
      ctx.beginPath();
      ctx.moveTo(40, 256);
      ctx.lineTo(130, 140);
      ctx.lineTo(472, 140);
      ctx.lineTo(382, 372);
      ctx.lineTo(40, 372);
      ctx.closePath();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fill();
      ctx.lineWidth = 10;
      ctx.strokeStyle = color;
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = '800 84px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('APEX', 256, 234);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '700 32px Inter, sans-serif';
      ctx.fillText('MOTORSPORT', 256, 312);
      break;
    }
    case 'turbo-badge': {
      ctx.save();
      ctx.translate(256, 256);
      ctx.transform(1, 0, -0.22, 1, 0, 0);
      ctx.fillStyle = color;
      ctx.font = '900 98px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TURBO', 0, -24);
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 44px Orbitron, sans-serif';
      ctx.fillText('TWIN-SCROLL', 0, 52);
      ctx.restore();
      break;
    }
    case 'checkered': {
      const cols = 6;
      const rows = 4;
      const cell = 64;
      const startX = (size - cols * cell) / 2;
      const startY = (size - rows * cell) / 2;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.fillStyle = (r + c) % 2 === 0 ? color : '#111827';
          ctx.fillRect(startX + c * cell, startY + r * cell, cell, cell);
        }
      }
      break;
    }
    case 'lightning': {
      ctx.beginPath();
      ctx.moveTo(295, 36);
      ctx.lineTo(120, 275);
      ctx.lineTo(245, 275);
      ctx.lineTo(195, 476);
      ctx.lineTo(395, 225);
      ctx.lineTo(265, 225);
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      break;
    }
    case 'drift-arrow': {
      ctx.beginPath();
      ctx.moveTo(60, 210);
      ctx.lineTo(290, 210);
      ctx.lineTo(290, 125);
      ctx.lineTo(456, 256);
      ctx.lineTo(290, 387);
      ctx.lineTo(290, 302);
      ctx.lineTo(60, 302);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 44px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TOW', 200, 258);
      break;
    }
    case 'star-emblem': {
      const spikes = 5;
      const outerRadius = 190;
      const innerRadius = 82;
      let rot = (Math.PI / 2) * 3;
      const step = Math.PI / spikes;
      ctx.beginPath();
      ctx.moveTo(256, 256 - outerRadius);
      for (let i = 0; i < spikes; i++) {
        ctx.lineTo(256 + Math.cos(rot) * outerRadius, 256 + Math.sin(rot) * outerRadius);
        rot += step;
        ctx.lineTo(256 + Math.cos(rot) * innerRadius, 256 + Math.sin(rot) * innerRadius);
        rot += step;
      }
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = 12;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      break;
    }
    default: {
      ctx.beginPath();
      ctx.arc(256, 256, 170, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
  return canvas.toDataURL('image/png');
}
