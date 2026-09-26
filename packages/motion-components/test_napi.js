const { createCanvas } = require('@napi-rs/canvas');
const canvas = createCanvas(100, 100);
console.log(Object.keys(canvas.__proto__));
