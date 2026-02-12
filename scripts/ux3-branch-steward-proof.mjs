import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-11';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `ux3-branch-steward-proof-console-${DATE_TAG}.log`);
const APP_URL = 'http://localhost:3000/relay-cesium-world.html';

const lines = [];
const log = (line) => {
  const msg = String(line);
  lines.push(msg);
  // eslint-disable-next-line no-console
  console.log(msg);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForServer(url, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) return true;
    } catch {
      // retry
    }
    await sleep(500);
  }
  return false;
}

async function startDevServer() {
  const child = spawn(process.execPath, ['scripts/dev-server.mjs'], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
  });
  const ready = await waitForServer(APP_URL, 60000);
  if (!ready) {
    child.kill('SIGINT');
    throw new Error('DEV_SERVER_NOT_READY');
  }
  return child;
}

async function stopDevServer(child) {
  if (!child || child.killed) return;
  child.kill('SIGINT');
  await Promise.race([
    new Promise((resolve) => child.once('close', resolve)),
    sleep(3000).then(() => {
      if (!child.killed) child.kill('SIGKILL');
    })
  ]);
}

async function runUx3Scenario(page, suffix = 'A') {
  return page.evaluate((tag) => {
    const hash = (value) => {
      const src = JSON.stringify(value);
      let h = 0x811c9dc5;
      for (let i = 0; i < src.length; i += 1) {
        h ^= src.charCodeAt(i);
        h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
      }
      return `0x${(h >>> 0).toString(16).padStart(8, '0')}`;
    };

    const modules = (window.relayUX3ListModules?.() || []);
    const moduleWithRoutes = modules
      .map((m) => ({ module: m, config: window.relayUX3GetConfig?.(m.moduleId) }))
      .filter((x) => Array.isArray(x.config?.routeFieldSources) && x.config.routeFieldSources.length > 0);
    const preferred = moduleWithRoutes.find(x => x.module.moduleId === 'MFG');
    const selected = preferred || moduleWithRoutes[0] || null;
    const targetModule = selected?.module || null;
    if (!targetModule) return { ok: false, reason: 'UX3_NO_MODULES' };

    const beforeConfig = selected?.config || window.relayUX3GetConfig(targetModule.moduleId);
    if (!beforeConfig || !beforeConfig.branchId) return { ok: false, reason: 'UX3_CONFIG_MISSING' };
    const routeUpdate = (beforeConfig.routeFieldSources || []).find(r => String(r.routeId || '').startsWith('mfg.'))
      || beforeConfig.routeFieldSources?.[0]
      || null;
    if (!routeUpdate) return { ok: false, reason: 'UX3_ROUTE_SOURCE_MISSING' };

    const routeFieldId = Object.keys(routeUpdate.fields || {})[0];
    if (!routeFieldId) return { ok: false, reason: 'UX3_ROUTE_FIELD_MISSING' };
    const updatedSource = `${routeFieldId}_ux3_alias`;

    const nextConfig = JSON.parse(JSON.stringify(beforeConfig));
    const editableRoute = (nextConfig.routeFieldSources || []).find(r => r.routeId === routeUpdate.routeId);
    editableRoute.fields[routeFieldId] = updatedSource;
    const kpis = Array.isArray(nextConfig.kpiBindings) ? nextConfig.kpiBindings.slice() : [];
    kpis.push({
      metric: `ux3.proof.${tag.toLowerCase()}`,
      metricId: `ux3.proof.${tag.toLowerCase()}`,
      sheetId: 'MFG.ProductionSummary',
      cell: 'B4'
    });
    nextConfig.kpiBindings = kpis;

    const proposed = window.relayUX3ProposeConfigEdit({ config: nextConfig }, {
      summary: `UX-3 proof ${targetModule.moduleId} ${tag}`,
      changesetRef: `UX3-PROOF:${tag}`
    });
    if (!proposed?.ok) return { ok: false, reason: `UX3_PROPOSE_FAILED:${proposed?.reason || 'UNKNOWN'}` };

    const committed = window.relayUX3CommitLatest({});
    if (!committed?.ok) return { ok: false, reason: `UX3_COMMIT_FAILED:${committed?.reason || 'UNKNOWN'}` };

    const afterConfig = window.relayUX3GetConfig(targetModule.moduleId);
    const afterRoute = (afterConfig?.routeFieldSources || []).find(r => r.routeId === routeUpdate.routeId) || null;
    const routeApplied = String(afterRoute?.fields?.[routeFieldId] || '') === updatedSource;
    const kpiApplied = Array.isArray(afterConfig?.kpiBindings) && afterConfig.kpiBindings.some((k) => String(k?.metric || k?.metricId || '') === `ux3.proof.${tag.toLowerCase()}`);

    const artifacts = window.relayGetArtifactsForObject?.(String(afterConfig?.branchId || '')) || { snapshots: [], commits: [] };
    const hasPropose = (artifacts.snapshots || []).some(s => s.type === 'PROPOSE');
    const hasCommit = (artifacts.commits || []).some(c => String(c.proposalId || '') === String(proposed.proposalId || ''));
    const configHash = hash({
      moduleId: afterConfig?.moduleId || null,
      branchId: afterConfig?.branchId || null,
      routeId: routeUpdate.routeId,
      routeFieldId,
      routeFieldSource: afterRoute?.fields?.[routeFieldId] || null,
      kpiMetricPresent: kpiApplied
    });

    return {
      ok: routeApplied && kpiApplied && hasPropose && hasCommit,
      moduleId: targetModule.moduleId,
      branchId: String(afterConfig?.branchId || ''),
      proposalId: String(proposed.proposalId || ''),
      commitId: String(committed.commitId || ''),
      routeId: routeUpdate.routeId,
      routeFieldId,
      updatedSource,
      routeApplied,
      kpiApplied,
      hasPropose,
      hasCommit,
      configHash
    };
  }, suffix);
}

async function main() {
  await fs.mkdir(PROOFS_DIR, { recursive: true });
  let server = null;
  let browser = null;
  try {
    server = await startDevServer();
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(
      () => typeof window.relayUX3ListModules === 'function'
        && typeof window.relayUX3GetConfig === 'function'
        && typeof window.relayUX3ProposeConfigEdit === 'function'
        && typeof window.relayUX3CommitLatest === 'function'
        && (() => {
          try {
            if ((window.relayUX3ListModules()?.length || 0) <= 0) return false;
            const mods = window.relayUX3ListModules();
            return mods.some((m) => {
              const cfg = window.relayUX3GetConfig?.(m.moduleId);
              return Array.isArray(cfg?.routeFieldSources) && cfg.routeFieldSources.length > 0;
            });
          } catch {
            return false;
          }
        })(),
      undefined,
      { timeout: 120000 }
    );

    const runA = await runUx3Scenario(page, 'A');
    if (!runA.ok) throw new Error(runA.reason || 'UX3_SCENARIO_A_FAIL');
    log(`[UX3] propose result=PASS module=${runA.moduleId} proposalId=${runA.proposalId}`);
    log(`[UX3] commit result=PASS module=${runA.moduleId} commitId=${runA.commitId} proposalId=${runA.proposalId}`);
    log(`[UX3] config-apply result=${runA.routeApplied && runA.kpiApplied ? 'PASS' : 'FAIL'} branch=${runA.branchId} route=${runA.routeId} field=${runA.routeFieldId}`);
    log(`[UX3] artifact-link result=${runA.hasPropose && runA.hasCommit ? 'PASS' : 'FAIL'} objectId=${runA.branchId} proposalId=${runA.proposalId}`);

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(
      () => typeof window.relayUX3ProposeConfigEdit === 'function'
        && typeof window.relayUX3CommitLatest === 'function'
        && (() => {
          try {
            if ((window.relayUX3ListModules()?.length || 0) <= 0) return false;
            const mods = window.relayUX3ListModules();
            return mods.some((m) => {
              const cfg = window.relayUX3GetConfig?.(m.moduleId);
              return Array.isArray(cfg?.routeFieldSources) && cfg.routeFieldSources.length > 0;
            });
          } catch {
            return false;
          }
        })(),
      undefined,
      { timeout: 120000 }
    );
    const runB = await runUx3Scenario(page, 'A');
    if (!runB.ok) throw new Error(runB.reason || 'UX3_SCENARIO_B_FAIL');
    const deterministic = runA.configHash === runB.configHash;
    log(`[UX3] determinism result=${deterministic ? 'PASS' : 'FAIL'} hashA=${runA.configHash} hashB=${runB.configHash}`);

    const pass = !!(runA.routeApplied && runA.kpiApplied && runA.hasPropose && runA.hasCommit && deterministic);
    log(`[UX3] gate-summary result=${pass ? 'PASS' : 'FAIL'}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    if (!pass) process.exitCode = 2;
  } catch (err) {
    log(`[REFUSAL] reason=UX3_PROOF_FAILED detail=${String(err?.message || err)}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    process.exitCode = 2;
  } finally {
    if (browser) await browser.close();
    if (server) await stopDevServer(server);
  }
}

await main();
