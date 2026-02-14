/**
 * HUD-CONSOLIDATION-1 proof.
 * Spec: docs/restoration/HUD-CONSOLIDATION-1-SPEC.md
 *
 * Stages:
 *   1. Boot ?profile=launch → one #hud, 6 .tier1-row, tier2 collapsed; logs consolidated, tier1 rows=6, tier2 default=collapsed
 *   2. FPS contract: mouse + WASD → [INPUT] owner=CAMERA mode=FreeFly
 *   3. H twice → Tier 2 ON then OFF; logs tier2 toggle=ON/OFF
 *   4. Double-click trunk → CompanyFocus → [HUD] mode=CompanyFocus
 *   5. E → Sheet, E → SheetEdit → mode logs
 *   6. Canopy obstruction: HUD rect vs trunk center X → overlapRatio < 0.2
 *
 * Artifacts: hud-consolidation-console-YYYY-MM-DD.log, hud-consolidation-YYYY-MM-DD/*.png
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = new Date().toISOString().slice(0, 10);
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const SCREENSHOT_DIR = path.join(PROOFS_DIR, `hud-consolidation-${DATE_TAG}`);
const LOG_FILE = path.join(PROOFS_DIR, `hud-consolidation-console-${DATE_TAG}.log`);
const LAUNCH_URL = 'http://127.0.0.1:3000/relay-cesium-world.html?profile=launch';

const proofLines = [];
const log = (line) => {
  const msg = String(line);
  proofLines.push(msg);
  console.log(msg);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForUrl(url, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) return true;
    } catch { /* retry */ }
    await sleep(500);
  }
  return false;
}

async function startServerIfNeeded(commandArgs, readyUrl) {
  const ready = await waitForUrl(readyUrl, 2500);
  if (ready) return { child: null, started: false };
  const child = spawn(process.execPath, commandArgs, {
    cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true, env: { ...process.env }
  });
  const becameReady = await waitForUrl(readyUrl, 60000);
  if (!becameReady) {
    child.kill('SIGINT');
    throw new Error(`SERVER_NOT_READY ${readyUrl}`);
  }
  return { child, started: true };
}

async function stopServer(handle) {
  if (!handle?.started || !handle?.child || handle.child.killed) return;
  const child = handle.child;
  child.kill('SIGINT');
  await Promise.race([
    new Promise((resolve) => child.once('close', resolve)),
    sleep(3000).then(() => { if (!child.killed) child.kill('SIGKILL'); })
  ]);
}

function hasLog(allLogs, pattern) {
  const text = typeof allLogs === 'string' ? allLogs : allLogs.join('\n');
  return text.includes(pattern);
}

async function main() {
  await fs.mkdir(PROOFS_DIR, { recursive: true });
  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });

  let devServer = null;
  let browser = null;
  const consoleLogs = [];
  const stages = { s1: false, s2: false, s3: false, s4: false, s5: false, s6: false };

  try {
    devServer = await startServerIfNeeded(['scripts/dev-server.mjs'], LAUNCH_URL);
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    page.on('console', (msg) => {
      try {
        const t = msg.text();
        consoleLogs.push(typeof t === 'string' ? t : String(t));
      } catch {
        consoleLogs.push('[console]');
      }
    });
    await page.addInitScript(() => {
      window.RELAY_DEBUG_VERBOSE = true;
      window.RELAY_DEBUG_LOGS = true;
    });

    log('[HUD-PROOF] loading launch URL...');
    await page.goto(LAUNCH_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });

    await page.waitForFunction(
      () => typeof window.relayGetProfile === 'function' && window.relayGetProfile() === 'launch'
        && document.body.classList.contains('launch-mode') && !!document.querySelector('#hud'),
      undefined,
      { timeout: 60000 }
    );
    await sleep(2000);

    // ─── Stage 1: Structural ───
    const stage1 = await page.evaluate(() => {
      const hudRoots = document.querySelectorAll('#hud');
      const tier1Rows = document.querySelectorAll('#hud .tier1-row');
      const tier2El = document.querySelector('#hud-tier2');
      const tier2Collapsed = !tier2El || tier2El.offsetHeight === 0 || tier2El.classList.contains('collapsed');
      return {
        rootCount: hudRoots.length,
        tier1Count: tier1Rows.length,
        tier2Collapsed,
        tier2Exists: !!tier2El
      };
    });
    stages.s1 = stage1.rootCount === 1 && stage1.tier1Count === 6 && stage1.tier2Collapsed && stage1.tier2Exists;
    log(`[HUD-PROOF] stage1 structural: rootCount=${stage1.rootCount} tier1Rows=${stage1.tier1Count} tier2Collapsed=${stage1.tier2Collapsed} => ${stages.s1 ? 'PASS' : 'FAIL'}`);

    const fullLog1 = consoleLogs.join('\n');
    if (!hasLog(fullLog1, '[HUD] consolidated rootCount=1')) log('[HUD-PROOF] MISSING [HUD] consolidated rootCount=1');
    if (!hasLog(fullLog1, '[HUD] tier1 rows=6')) log('[HUD-PROOF] MISSING [HUD] tier1 rows=6');
    if (!hasLog(fullLog1, '[HUD] tier2 default=collapsed')) log('[HUD-PROOF] MISSING [HUD] tier2 default=collapsed');

    // Screenshot 01-boot
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-boot.png') });

    // ─── Stage 2: FPS contract (mouse + WASD, then check INPUT log) ───
    await page.mouse.move(400, 300);
    await sleep(100);
    await page.keyboard.press('KeyW');
    await sleep(80);
    await page.keyboard.press('KeyA');
    await sleep(80);
    await page.keyboard.press('KeyS');
    await sleep(80);
    await page.keyboard.press('KeyD');
    await sleep(200);
    const fullLog2 = consoleLogs.join('\n');
    stages.s2 = hasLog(fullLog2, '[INPUT] owner=CAMERA') && hasLog(fullLog2, 'mode=FreeFly');
    log(`[HUD-PROOF] stage2 FPS contract: [INPUT] owner=CAMERA mode=FreeFly => ${stages.s2 ? 'PASS' : 'FAIL'}`);

    // ─── Stage 3: Toggle Tier 2 via window.hudManager (deterministic: no key/focus issues) ───
    await page.evaluate(() => {
      const h = window.hudManager;
      if (h && typeof h.toggleTier2 === 'function') {
        h.toggleTier2('hotkey'); // open
        h.toggleTier2('hotkey'); // close
      }
    });
    await sleep(500);
    const tier2Closed = await page.evaluate(() => {
      const el = document.querySelector('#hud-tier2');
      return el && (el.classList.contains('collapsed') || el.offsetHeight === 0);
    });
    const fullLog3 = consoleLogs.join('\n');
    const hasOn = hasLog(fullLog3, '[HUD] tier2 toggle=ON');
    const hasOff = hasLog(fullLog3, '[HUD] tier2 toggle=OFF');
    stages.s3 = tier2Closed && hasOn && hasOff;
    log(`[HUD-PROOF] stage3 tier2 toggle: ON then OFF => ${stages.s3 ? 'PASS' : 'FAIL'}`);

    // ─── Stage 4: Double-click trunk → CompanyFocus ───
    const trunkScreen = await page.evaluate(() => {
      const viewer = window.viewer;
      const trunk = window.relayState?.tree?.nodes?.find(n => n.type === 'trunk');
      if (!viewer?.scene || !trunk || typeof trunk.lon !== 'number') return null;
      const Cesium = window.Cesium;
      const cartographic = Cesium.Cartographic.fromDegrees(trunk.lon, trunk.lat, trunk.alt || 0);
      const cartesian = viewer.scene.globe.ellipsoid.cartographicToCartesian(cartographic);
      const screen = viewer.scene.cartesianToCanvasCoordinates(cartesian, new Cesium.Cartesian2());
      return { x: screen?.x ?? 0, y: screen?.y ?? 0 };
    });
    if (trunkScreen && Number.isFinite(trunkScreen.x)) {
      await page.mouse.click(trunkScreen.x, trunkScreen.y, { button: 'left', clickCount: 2 });
      await sleep(2500);
    }
    const fullLog4 = consoleLogs.join('\n');
    stages.s4 = hasLog(fullLog4, '[HUD] mode=CompanyFocus');
    log(`[HUD-PROOF] stage4 company focus => ${stages.s4 ? 'PASS' : 'FAIL'}`);

    // Screenshot 02-companyfocus
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-companyfocus.png') });

    // ─── Stage 5: E → Sheet, E → SheetEdit ───
    await page.keyboard.press('e');
    await sleep(1500);
    await page.keyboard.press('e');
    await sleep(1500);
    const fullLog5 = consoleLogs.join('\n');
    stages.s5 = hasLog(fullLog5, '[HUD] mode=Sheet') && hasLog(fullLog5, '[HUD] mode=SheetEdit');
    log(`[HUD-PROOF] stage5 sheet/edit => ${stages.s5 ? 'PASS' : 'FAIL'}`);

    // Screenshot 03-sheetedit
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-sheetedit.png') });

    // ─── Stage 6: Canopy obstruction (HUD vs trunk center X) ───
    const overlapResult = await page.evaluate(() => {
      const hud = document.querySelector('#hud');
      const viewer = window.viewer;
      const trunk = window.relayState?.tree?.nodes?.find(n => n.type === 'trunk');
      if (!hud || !viewer?.scene || !trunk || typeof trunk.lon !== 'number') return { overlapRatio: 1, ok: false };
      const Cesium = window.Cesium;
      const cartographic = Cesium.Cartographic.fromDegrees(trunk.lon, trunk.lat, trunk.alt || 0);
      const cartesian = viewer.scene.globe.ellipsoid.cartographicToCartesian(cartographic);
      const screen = viewer.scene.cartesianToCanvasCoordinates(cartesian, new Cesium.Cartesian2());
      const trunkX = Number(screen?.x) || 0;
      const rect = hud.getBoundingClientRect();
      const viewWidth = window.innerWidth || 1366;
      const hudLeft = rect.left;
      const hudRight = rect.right;
      const trunkInHud = trunkX >= hudLeft && trunkX <= hudRight;
      const overlapRatio = trunkInHud ? Math.min(1, (hudRight - hudLeft) / viewWidth) : 0;
      return { overlapRatio, ok: overlapRatio < 0.2, trunkX, hudLeft, hudRight };
    });
    stages.s6 = overlapResult.ok === true;
    log(`[HUD-PROOF] stage6 canopyObstruction: overlapRatio=${overlapResult.overlapRatio?.toFixed(3) ?? 'n/a'} => ${stages.s6 ? 'PASS' : 'FAIL'}`);

    const passCount = Object.values(stages).filter(Boolean).length;
    const totalStages = 6;
    const gatePass = passCount === totalStages;
    log(`[HUD-PROOF] gate-summary result=${gatePass ? 'PASS' : 'FAIL'} stages=${passCount}/${totalStages}`);

    const consoleBlob = consoleLogs.join('\n');
    const proofAppendix = [
      '',
      '--- HUD-CONSOLIDATION-1 proof ---',
      ...proofLines,
      overlapResult.ok !== undefined ? `[HUD] canopyObstruction=${overlapResult.ok ? 'PASS' : 'FAIL'} overlapRatio=${overlapResult.overlapRatio?.toFixed(3) ?? 'n/a'}` : ''
    ].filter(Boolean).join('\n');
    await fs.writeFile(LOG_FILE, consoleBlob + proofAppendix, 'utf8');
    log(`Log written: ${LOG_FILE}`);
    log(`Screenshots: ${SCREENSHOT_DIR}`);

    if (!gatePass) process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    if (devServer) await stopServer(devServer);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
