import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const args = process.argv.slice(2);
const [url, outPath, wArg, hArg, formatArg] = args;
if (!url || !outPath) {
  console.error("Usage: node fast_web_capture.mjs <url> <outPath> [width] [height] [format]");
  process.exit(1);
}

const isMobile =
  formatArg === "9:16" ||
  formatArg === "mobile" ||
  (wArg && parseInt(wArg, 10) < 600);
const isSquare = formatArg === "1:1" || formatArg === "square";

let width = isMobile ? 390 : isSquare ? 800 : 1440;
if (wArg && !isNaN(parseInt(wArg, 10)) && parseInt(wArg, 10) > 0) {
  width = parseInt(wArg, 10);
}

let height = isMobile ? 1800 : isSquare ? 1600 : 1800;
if (hArg && !isNaN(parseInt(hArg, 10)) && parseInt(hArg, 10) > 0) {
  height = parseInt(hArg, 10);
}

const findBinary = (dir) => {
  if (!fs.existsSync(dir)) return null;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isFile() && /^chrome-headless-shell(\.exe)?$/.test(e.name)) return p;
    if (e.isDirectory()) {
      const hit = findBinary(p);
      if (hit) return hit;
    }
  }
  return null;
};

const searchDirs = [
  path.join(os.homedir(), ".cache", "puppeteer"),
  path.join(os.homedir(), ".cache", "remotion"),
  path.join(os.homedir(), ".remotion"),
];

let bin = null;
for (const dir of searchDirs) {
  bin = findBinary(dir);
  if (bin) break;
}

if (!bin) {
  console.error("Chrome headless shell binary not found");
  process.exit(1);
}

const profile = fs.mkdtempSync(path.join(os.tmpdir(), "ai-web-cap-"));
const flags = [
  "--remote-debugging-pipe",
  "--no-first-run",
  "--hide-scrollbars",
  "--mute-audio",
  "--no-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  `--window-size=${width},${height}`,
  `--user-data-dir=${profile}`,
  "about:blank"
];

const proc = spawn(bin, flags, { stdio: ["ignore", "ignore", "pipe", "pipe", "pipe"] });
let id = 0, buf = "";
const waiting = new Map(), listeners = [];

proc.stdio[4].on("data", (d) => {
  buf += d.toString();
  let i;
  while ((i = buf.indexOf("\0")) >= 0) {
    const msg = JSON.parse(buf.slice(0, i));
    buf = buf.slice(i + 1);
    if (msg.id && waiting.has(msg.id)) {
      const [ok, fail] = waiting.get(msg.id);
      waiting.delete(msg.id);
      msg.error ? fail(new Error(msg.error.message)) : ok(msg.result);
    } else listeners.forEach((l) => l(msg));
  }
});

const send = (method, params = {}, sessionId) => new Promise((ok, fail) => {
  waiting.set(++id, [ok, fail]);
  proc.stdio[3].write(JSON.stringify({ id, method, params, sessionId }) + "\0");
});

const once = (method, sessionId, ms) => new Promise((ok) => {
  const l = (m) => { if (m.method === method && (!sessionId || m.sessionId === sessionId)) done(true); };
  const timer = setTimeout(() => done(false), ms);
  const done = (v) => { clearTimeout(timer); listeners.splice(listeners.indexOf(l), 1); ok(v); };
  listeners.push(l);
});

async function run() {
  try {
    const { targetId } = await send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
    const s = (m, p) => send(m, p, sessionId);

    await s("Page.enable");
    await s("Network.enable");

    if (isMobile) {
      await s("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: 2,
        mobile: true,
        hasTouch: true
      });
      await s("Network.setUserAgentOverride", {
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1"
      });
    } else {
      await s("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: 1.5,
        mobile: false
      });
      await s("Network.setUserAgentOverride", {
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      });
    }

    // Navigate with a 6-second timeout race
    const navPromise = s("Page.navigate", { url });
    const domPromise = once("Page.domContentEventFired", sessionId, 5000);
    await Promise.race([navPromise, new Promise((r) => setTimeout(r, 6000))]);
    await Promise.race([domPromise, new Promise((r) => setTimeout(r, 4000))]);

    // Give 1.5s for initial layout
    await new Promise((r) => setTimeout(r, 1500));

    // Suppress cookie banners
    await s("Runtime.evaluate", {
      expression: `(() => {
        const css = document.createElement('style');
        css.textContent = '#onetrust-consent-sdk, .cookie-banner, [id*="cookie" i] { display: none !important; }';
        document.head && document.head.appendChild(css);
      })()`
    });

    const { data } = await s("Page.captureScreenshot", { format: "png" });
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, Buffer.from(data, "base64"));
    console.log("SUCCESS:" + fs.statSync(outPath).size);
  } catch (err) {
    console.error("FAIL:", err.message);
    process.exit(1);
  } finally {
    proc.kill();
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
  }
}

run();
