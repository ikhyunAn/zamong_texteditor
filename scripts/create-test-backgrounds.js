const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Create test background images for development
const backgrounds = [
  { name: 'stage_1.png', color: '#FFE5E5', text: 'Stage 1' },
  { name: 'stage_2.png', color: '#E5F3FF', text: 'Stage 2' },
  { name: 'stage_3.png', color: '#E5FFE5', text: 'Stage 3' },
  { name: 'stage_4.png', color: '#FFF5E5', text: 'Stage 4' }
];

const width = 900;
const height = 1600;

// Ensure backgrounds directory exists
const bgDir = path.join(__dirname, '..', 'public', 'backgrounds');
if (!fs.existsSync(bgDir)) {
  fs.mkdirSync(bgDir, { recursive: true });
}

backgrounds.forEach((bg) => {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fill background
  ctx.fillStyle = bg.color;
  ctx.fillRect(0, 0, width, height);

  // Add border
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  // Add text
  ctx.fillStyle = '#999';
  ctx.font = '48px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(bg.text, width / 2, height / 2);
  ctx.font = '24px Arial';
  ctx.fillText('Test Background', width / 2, height / 2 + 60);
  ctx.fillText(`${width} × ${height}px`, width / 2, height / 2 + 100);

  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(bgDir, bg.name), buffer);
  console.log(`Created ${bg.name}`);
});

console.log('Test backgrounds created successfully!');
