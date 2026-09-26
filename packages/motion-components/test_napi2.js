const { createCanvas } = require('@napi-rs/canvas');
const canvas = createCanvas(100, 100);
console.log(typeof canvas.data);
