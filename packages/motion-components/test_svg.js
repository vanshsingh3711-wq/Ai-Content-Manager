const { createCanvas, loadImage } = require('@napi-rs/canvas');
const fs = require('fs');

async function test() {
  const canvas = createCanvas(300, 700);
  const ctx = canvas.getContext('2d');
  
  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 700" width="300" height="700">
    <circle cx="150" cy="150" r="100" fill="red" />
  </svg>`;
  
  const img = await loadImage(Buffer.from(svgString));
  ctx.drawImage(img, 0, 0);
  
  fs.writeFileSync('test_svg.png', canvas.toBuffer('image/png'));
  console.log('done');
}
test();
