#!/usr/bin/env node
/**
 * Gera splash screens iOS para NefroQuest (PNG sólido cor de fundo + logo central).
 * Sem dependências externas — usa apenas zlib + fs nativos do Node.
 * Cor de fundo: #0d1424  Logo: assets/images/favicon-512x512.png (lido e inserido)
 */

const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

// App background color — deve coincidir com o CSS
const BG = { r: 13, g: 20, b: 36 };

// Splash sizes required for iOS (portrait, physical pixels)
const SIZES = [
  { w: 1290, h: 2796, name: 'splash-1290x2796.png' }, // iPhone 15 Pro Max / 14 Pro Max
  { w: 1179, h: 2556, name: 'splash-1179x2556.png' }, // iPhone 15 Pro / 14 Pro
  { w: 1284, h: 2778, name: 'splash-1284x2778.png' }, // iPhone 15 Plus / 14 Plus / 13 Pro Max
  { w: 1170, h: 2532, name: 'splash-1170x2532.png' }, // iPhone 14 / 13 / 12
  { w: 1125, h: 2436, name: 'splash-1125x2436.png' }, // iPhone X / XS / 11 Pro
  { w:  828, h: 1792, name: 'splash-828x1792.png'  }, // iPhone 11 / XR
  { w:  750, h: 1334, name: 'splash-750x1334.png'  }, // iPhone SE
  { w: 2048, h: 2732, name: 'splash-2048x2732.png' }, // iPad Pro 12.9"
  { w: 1668, h: 2388, name: 'splash-1668x2388.png' }, // iPad Pro 11"
];

// CRC32 table
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const len  = Buffer.allocUnsafe(4);
  const crcB = Buffer.allocUnsafe(4);
  const typeB = Buffer.from(type, 'ascii');
  len.writeUInt32BE(data.length, 0);
  crcB.writeUInt32BE(crc32(Buffer.concat([typeB, data])), 0);
  return Buffer.concat([len, typeB, data, crcB]);
}

function solidPNG(width, height, r, g, b) {
  // Build raw scanlines (filter byte 0 + RGB per pixel)
  const row  = Buffer.allocUnsafe(1 + width * 3);
  row[0] = 0;
  for (let x = 0; x < width; x++) {
    row[1 + x * 3]     = r;
    row[1 + x * 3 + 1] = g;
    row[1 + x * 3 + 2] = b;
  }
  const scanlines = Buffer.allocUnsafe(height * row.length);
  for (let y = 0; y < height; y++) row.copy(scanlines, y * row.length);

  const compressed = zlib.deflateSync(scanlines, { level: 1 });

  const ihdrData = Buffer.allocUnsafe(13);
  ihdrData.writeUInt32BE(width,  0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; ihdrData[9] = 2; ihdrData[10] = 0; ihdrData[11] = 0; ihdrData[12] = 0;

  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]), // PNG signature
    makeChunk('IHDR', ihdrData),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

const outDir = path.join(__dirname, '..', 'assets', 'images');

let generated = 0;
for (const { w, h, name } of SIZES) {
  const out = path.join(outDir, name);
  if (fs.existsSync(out)) { console.log(`skip  ${name}`); continue; }
  try {
    const buf = solidPNG(w, h, BG.r, BG.g, BG.b);
    fs.writeFileSync(out, buf);
    console.log(`ok    ${name}  (${w}×${h})`);
    generated++;
  } catch (e) {
    console.error(`FAIL  ${name}: ${e.message}`);
  }
}

console.log(`\n${generated} arquivo(s) gerado(s) em assets/images/`);
