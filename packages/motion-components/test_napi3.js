const { createCanvas } = require('@napi-rs/canvas');
const canvas = createCanvas(100, 100);
const buf1 = canvas.data();
const buf2 = canvas.data();
console.log(buf1 === buf2, buf1.constructor.name, buf1.length);
