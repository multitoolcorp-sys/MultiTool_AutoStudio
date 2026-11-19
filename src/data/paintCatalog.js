export const FINISH_PRESETS = [
  {
    id: 'gloss',
    name: 'Brillante (Gloss)',
    metalness: 0.25,
    roughness: 0.14,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    iridescence: 0.0,
    description: 'Acabado de fábrica con laca transparente de alto brillo.'
  },
  {
    id: 'metallic',
    name: 'Metálico',
    metalness: 0.78,
    roughness: 0.22,
    clearcoat: 0.95,
    clearcoatRoughness: 0.08,
    iridescence: 0.08,
    description: 'Partículas metálicas finas que reflejan la luz del estudio.'
  },
  {
    id: 'pearl',
    name: 'Perlado / Camaleón',
    metalness: 0.6,
    roughness: 0.18,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    iridescence: 1.0,
    description: 'Efecto iridiscente que cambia de tono según el ángulo.'
  },
  {
    id: 'satin',
    name: 'Satinado',
    metalness: 0.45,
    roughness: 0.42,
    clearcoat: 0.28,
    clearcoatRoughness: 0.35,
    iridescence: 0.0,
    description: 'Brillo suave intermedio entre mate y brillante.'
  },
  {
    id: 'matte',
    name: 'Mate (Stealth)',
    metalness: 0.15,
    roughness: 0.78,
    clearcoat: 0.0,
    clearcoatRoughness: 0.9,
    iridescence: 0.0,
    description: 'Superficie antirreflejo estilo wrap militar o stealth.'
  },
  {
    id: 'chrome',
    name: 'Cromo Espejo',
    metalness: 1.0,
    roughness: 0.04,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
    iridescence: 0.12,
    description: 'Reflejo metálico puro tipo espejo.'
  }
];

export const OEM_PAINT_CODES = [
  { code: 'FER-322', brand: 'Ferrari', name: 'Rosso Corsa', hex: '#D40000', finish: 'gloss' },
  { code: 'MAZ-46V', brand: 'Mazda', name: 'Soul Red Crystal', hex: '#9E0B1C', finish: 'metallic' },
  { code: 'POR-M5C', brand: 'Porsche', name: 'Miami Blue', hex: '#00A3E0', finish: 'gloss' },
  { code: 'NIS-TV2', brand: 'Nissan', name: 'Bayside Blue', hex: '#0D47A1', finish: 'metallic' },
  { code: 'NIS-LP2', brand: 'Nissan', name: 'Midnight Purple III', hex: '#3B185F', finish: 'pearl' },
  { code: 'LAM-0102', brand: 'Lamborghini', name: 'Verde Mantis', hex: '#74B72E', finish: 'pearl' },
  { code: 'BMW-C4G', brand: 'BMW M', name: 'Isle of Man Green', hex: '#0B4F3A', finish: 'metallic' },
  { code: 'AUD-LY7C', brand: 'Audi', name: 'Nardo Grey', hex: '#686D73', finish: 'gloss' },
  { code: 'MCL-PAP', brand: 'McLaren', name: 'Papaya Spark', hex: '#FF6A00', finish: 'metallic' },
  { code: 'SUB-02C', brand: 'Subaru', name: 'WR Blue Pearl', hex: '#1B3F8B', finish: 'pearl' },
  { code: 'POR-2D8', brand: 'Porsche', name: 'Acid Yellow', hex: '#E6D800', finish: 'gloss' },
  { code: 'MB-297U', brand: 'Mercedes-AMG', name: 'Selenite Magno', hex: '#494E54', finish: 'matte' },
  { code: 'LAM-0058', brand: 'Lamborghini', name: 'Bianco Isis', hex: '#F2F4F7', finish: 'gloss' },
  { code: 'AUD-LY9B', brand: 'Audi', name: 'Obsidian Stealth', hex: '#141619', finish: 'satin' },
  { code: 'CHV-GBA', brand: 'Corvette', name: 'Rapid Blue', hex: '#0090D4', finish: 'gloss' },
  { code: 'CUS-CHM', brand: 'Custom', name: 'Liquid Titanium', hex: '#B8C2CC', finish: 'chrome' }
];

export function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean.padEnd(6, '0').slice(0, 6);
  const num = parseInt(full, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

export function rgbToHsl(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

export function rgbToCmyk(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const k = 1 - Math.max(rn, gn, bn);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: Math.round(((1 - rn - k) / (1 - k)) * 100),
    m: Math.round(((1 - gn - k) / (1 - k)) * 100),
    y: Math.round(((1 - bn - k) / (1 - k)) * 100),
    k: Math.round(k * 100)
  };
}

export function buildPaintCodeSummary(paint) {
  const rgb = hexToRgb(paint.color);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
  const finishTag = paint.finish.toUpperCase().slice(0, 3);
  const customCode = paint.oemCode || `APX-${finishTag}-${paint.color.replace('#', '').toUpperCase()}`;
  return {
    code: customCode,
    hex: paint.color.toUpperCase(),
    rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
    hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
    cmyk: `C${cmyk.c} M${cmyk.m} Y${cmyk.y} K${cmyk.k}`,
    formula: {
      metalnessPct: Math.round(paint.metalness * 100),
      glossPct: Math.round((1 - paint.roughness) * 100),
      clearcoatPct: Math.round(paint.clearcoat * 100),
      pearlPct: Math.round(paint.iridescence * 100)
    }
  };
}
