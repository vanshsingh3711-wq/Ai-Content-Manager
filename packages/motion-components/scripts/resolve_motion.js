"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var resolver_1 = require("../src/motion/resolver");
require("../src/motion/compositions/index");
require("../src/motion/patterns/index");
require("../src/motion/patterns/blurReveal");
require("../src/motion/patterns/exitFade");
// Usage: npx tsx resolve_motion.ts <props_json>
var propsJson = process.argv[2] || '{}';
var props;
try {
    props = JSON.parse(propsJson);
}
catch (e) {
    console.error("Invalid JSON:", e);
    process.exit(1);
}
// Convert AI props into a MotionIntent
var type = props.type || 'hero_reveal';
var targets = props.targets || { text: 'text-1' };
var personality = props.personality || 'premium';
// Dummy Scene that maps targets to elements
var elements = Object.values(targets).map(function (id) { return ({ id: String(id), type: 'text' }); });
var mockScene = {
    id: 'dynamic-scene',
    elements: elements
};
var intent = {
    type: type,
    targets: targets,
    personality: personality,
    durationInFrames: props.durationInFrames || 90
};
try {
    var result = (0, resolver_1.resolveMotionIntents)(mockScene, [intent]);
    if (result.diagnostics.length > 0) {
        console.error("Diagnostics:", result.diagnostics);
    }
    // Output just the JSON string to stdout
    console.log(JSON.stringify(result.scene.elements));
}
catch (err) {
    console.error("Resolution Failed:", err.message);
    process.exit(1);
}
