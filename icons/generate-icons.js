const fs = require('fs');
const { createCanvas } = require('canvas');

const sizes = [16, 32, 48, 128];

function drawIcon(canvas, size) {
  const ctx = canvas.getContext('2d');
  const scale = size / 128;

  // Background gradient - simulate with solid color for simplicity
  ctx.fillStyle = '#6b78e8';
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2 * 0.94, 0, Math.PI * 2);
  ctx.fill();

  // Draw AI nodes
  ctx.fillStyle = 'white';
  ctx.strokeStyle = 'white';
  ctx.lineWidth = Math.max(1, 4 * scale);
  ctx.lineCap = 'round';

  // Center node
  const centerR = 8 * scale;
  ctx.beginPath();
  ctx.arc(size/2, size/2, centerR, 0, Math.PI * 2);
  ctx.fill();

  const drawNode = (x, y, r) => {
    ctx.beginPath();
    ctx.arc(x * scale, y * scale, r * scale, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawLine = (x1, y1, x2, y2) => {
    ctx.beginPath();
    ctx.moveTo(x1 * scale, y1 * scale);
    ctx.lineTo(x2 * scale, y2 * scale);
    ctx.stroke();
  };

  // Top, Bottom, Left, Right nodes
  drawNode(64, 32, 6);
  drawLine(64, 40, 64, 56);

  drawNode(64, 96, 6);
  drawLine(64, 72, 64, 90);

  drawNode(32, 64, 6);
  drawLine(40, 64, 56, 64);

  drawNode(96, 64, 6);
  drawLine(72, 64, 88, 64);

  // Diagonal nodes
  drawNode(42, 42, 5);
  drawLine(48, 48, 58, 58);

  drawNode(86, 42, 5);
  drawLine(80, 48, 70, 58);

  drawNode(42, 86, 5);
  drawLine(48, 80, 58, 70);

  drawNode(86, 86, 5);
  drawLine(80, 80, 70, 70);
}

sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  drawIcon(canvas, size);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`icon${size}.png`, buffer);
  console.log(`Generated icon${size}.png`);
});

console.log('All icons generated!');
