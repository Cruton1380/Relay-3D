import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const DATE_TAG = '2026-02-13';
const PROOFS_DIR = path.join(ROOT, 'archive', 'proofs');
const LOG_FILE = path.join(PROOFS_DIR, `restore-full-parity-console-${DATE_TAG}.log`);
const WORLD_URL = 'http://127.0.0.1:3000/relay-cesium-world.html?profile=world';
const PROOF_URL = 'http://127.0.0.1:3000/relay-cesium-world.html?profile=proof';
const GLOBE_STATUS_URL = 'http://127.0.0.1:4020/api/globe/weather/status';

const lines = [];
const log = (line) => {
  const msg = String(line);
  lines.push(msg);
  // eslint-disable-next-line no-console
  console.log(msg);
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForUrl(url, timeoutMs = 60000) {
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

async function startServerIfNeeded(commandArgs, readyUrl, env = {}) {
  const ready = await waitForUrl(readyUrl, 2500);
  if (ready) return { child: null, started: false };
  const child = spawn(process.execPath, commandArgs, {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
    env: { ...process.env, ...env }
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
    sleep(3000).then(() => {
      if (!child.killed) child.kill('SIGKILL');
    })
  ]);
}

async function runNodeScript(scriptPath, timeoutMs = 900000) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [scriptPath], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      env: { ...process.env }
    });
    let output = '';
    child.stdout.on('data', (d) => { output += String(d); });
    child.stderr.on('data', (d) => { output += String(d); });
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve({ ok: false, output: `${output}\nTIMEOUT` });
    }, timeoutMs);
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ ok: code === 0, output, code });
    });
  });
}

async function main() {
  await fs.mkdir(PROOFS_DIR, { recursive: true });
  let devServer = null;
  let globeServer = null;
  let browser = null;
  try {
    devServer = await startServerIfNeeded(['scripts/dev-server.mjs'], WORLD_URL);
    globeServer = await startServerIfNeeded(
      ['scripts/globe-services-server.mjs'],
      GLOBE_STATUS_URL,
      { GLOBE_SERVICES_PORT: '4020', GLOBE_WEATHER_MODE: 'fixture' }
    );

    browser = await chromium.launch({ headless: true });

    // 1) Profile isolation.
    const proofPage = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    await proofPage.goto(PROOF_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await proofPage.waitForFunction(
      () => typeof window.relayGetProfile === 'function'
        && window.relayGetProfile() === 'proof'
        && typeof window.relayApplyImageryMode === 'function'
        && typeof window.relayWeatherAdd === 'function'
        && typeof window.relayTopographyApply === 'function'
        && typeof window.relayLoadWorldDataset === 'function',
      undefined,
      { timeout: 120000 }
    );
    const proofLocks = await proofPage.evaluate(async () => {
      const imagery = window.relayApplyImageryMode('satellite');
      const weather = window.relayWeatherAdd('clouds');
      const topo = window.relayTopographyApply('contour-data');
      const dataset = await window.relayLoadWorldDataset();
      return { imagery, weather, topo, dataset };
    });
    const proofLockPass =
      proofLocks?.imagery?.reason === 'PROFILE_LOCKED_PROOF' &&
      proofLocks?.weather?.reason === 'PROFILE_LOCKED_PROOF' &&
      proofLocks?.topo?.reason === 'PROFILE_LOCKED_PROOF' &&
      proofLocks?.dataset?.reason === 'PROFILE_LOCKED_PROOF';

    const worldPage = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    const worldLogs = [];
    worldPage.on('console', (msg) => worldLogs.push(msg.text()));
    await worldPage.goto(WORLD_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await worldPage.waitForFunction(
      () => typeof window.relayGetProfile === 'function'
        && window.relayGetProfile() === 'world'
        && typeof window.relayApplyImageryMode === 'function'
        && typeof window.relayWeatherAdd === 'function'
        && typeof window.relayTopographyApply === 'function'
        && typeof window.relayLoadWorldDataset === 'function',
      undefined,
      { timeout: 120000 }
    );

    const worldAllowed = await worldPage.evaluate(async () => {
      const imagery = window.relayApplyImageryMode('satellite');
      const weather = window.relayWeatherAdd('clouds');
      const topo = window.relayTopographyApply('contour-data');
      const dataset = await window.relayLoadWorldDataset();
      // restore back
      const weatherClear = window.relayWeatherClear();
      const topoClear = window.relayTopographyClear();
      const imageryBack = window.relayApplyImageryMode('osm');
      return { imagery, weather, topo, dataset, weatherClear, topoClear, imageryBack };
    });
    const worldAllowPass =
      worldAllowed?.imagery?.ok === true &&
      worldAllowed?.weather?.ok === true &&
      worldAllowed?.topo?.ok === true &&
      worldAllowed?.dataset?.ok === true;
    const profileIsolationPass = proofLockPass && worldAllowPass;
    log(`[PARITY] profileIsolation result=${profileIsolationPass ? 'PASS' : 'FAIL'}`);

    // 2) Globe restored stack continuity.
    const globeStack = await worldPage.evaluate(async () => {
      const weatherTypes = window.relayListWeatherTypes?.() || [];
      const topoModes = window.relayListTopographyModes?.() || [];
      const dataset = await window.relayLoadWorldDataset();
      const boundaryStatus = (typeof window.getBoundaryStatus === 'function') ? window.getBoundaryStatus() : 'UNKNOWN';
      const weatherAdd = window.relayWeatherAdd?.('clouds');
      const topoApply = window.relayTopographyApply?.('contour-data');
      return {
        weatherTypesCount: weatherTypes.length,
        topoModesCount: topoModes.length,
        datasetOk: dataset?.ok === true && Number(dataset?.anchors || 0) > 0,
        boundaryStatus,
        weatherOk: weatherAdd?.ok === true,
        topoOk: topoApply?.ok === true
      };
    });
    const globeStackPass =
      globeStack.datasetOk === true &&
      (globeStack.boundaryStatus === 'ACTIVE' || globeStack.boundaryStatus === 'DEGRADED') &&
      globeStack.weatherOk === true &&
      globeStack.topoOk === true &&
      Number(globeStack.weatherTypesCount || 0) > 0 &&
      Number(globeStack.topoModesCount || 0) > 0;
    log(`[PARITY] globeStack result=${globeStackPass ? 'PASS' : 'FAIL'}`);

    // 3) Boundary editor governance chain.
    const boundaryResult = await worldPage.evaluate(() => {
      // valid chain
      window.relayBoundaryCancel();
      const start = window.relayBoundaryStartDraft('PARITY-BOUNDARY', { branchId: 'branch.operations' }, 'Parity boundary');
      if (!start?.ok) return { ok: false, reason: 'START_FAILED' };
      window.relayBoundaryAddVertex(34.01, 31.01);
      window.relayBoundaryAddVertex(34.02, 31.01);
      window.relayBoundaryAddVertex(34.015, 31.02);
      const propose = window.relayBoundaryPropose({ user: 'parity-proof', summary: 'Parity boundary propose' });
      if (!propose?.ok) return { ok: false, reason: 'PROPOSE_FAILED', propose };
      const commit = window.relayBoundaryCommit({ user: 'parity-proof' });
      if (!commit?.ok) return { ok: false, reason: 'COMMIT_FAILED', commit };

      // invalid geometry refusal path
      window.relayBoundaryCancel();
      const badStart = window.relayBoundaryStartDraft('PARITY-BAD', null, 'Bad geometry');
      if (!badStart?.ok) return { ok: false, reason: 'BAD_START_FAILED' };
      window.relayBoundaryAddVertex(34.1, 31.1);
      const bad = window.relayBoundaryPropose({ user: 'parity-proof' });
      window.relayBoundaryCancel();
      const invalidRefusal = bad?.ok === false && bad?.reason === 'BOUNDARY_INVALID_GEOMETRY';

      return {
        ok: true,
        proposeOk: propose.ok === true,
        commitOk: commit.ok === true,
        hashMatch: String(propose.geometryHash || '') === String(commit.geometryHash || ''),
        invalidRefusal
      };
    });
    const boundaryPass = boundaryResult?.ok === true &&
      boundaryResult.proposeOk === true &&
      boundaryResult.commitOk === true &&
      boundaryResult.hashMatch === true &&
      boundaryResult.invalidRefusal === true;
    log(`[PARITY] boundaryEditor result=${boundaryPass ? 'PASS' : 'FAIL'}`);

    // 4) Voting UI surface + rails.
    const votingResult = await worldPage.evaluate(() => {
      const voters = [
        { id: 'user.manager1', scope: 'zone.avgol.ops', role: 'manager', authorityRef: 'policy.governance.v2' },
        { id: 'user.steward1', scope: 'zone.avgol.ops', role: 'steward', authorityRef: 'policy.governance.v2' },
        { id: 'user.finance1', scope: 'zone.avgol.ops', role: 'finance', authorityRef: 'policy.governance.v2' }
      ];
      const topics = [
        { id: 'parity.pres', title: 'Presentation Policy', type: 'presentation', policyRef: 'local:HUD-PARAMS-v0', scope: 'zone.avgol.ops', cadence: 'event', state: 'DRAFT' },
        { id: 'parity.gov', title: 'Governance Policy', type: 'governance', scope: 'zone.avgol.ops', cadence: 'weekly', requiredRoles: ['manager', 'steward', 'finance'], authorityRefs: ['policy.governance.v2'], state: 'DRAFT' },
        { id: 'parity.locked', title: 'Locked vote', type: 'governance', scope: 'zone.avgol.ops', cadence: 'weekly', requiredRoles: ['manager'], authorityRefs: ['policy.governance.v2'], state: 'DRAFT' }
      ];
      window.relayVoteUiSeedTopics(topics);
      const laneA = window.relayVoteUiGetLane();
      window.relayVoteUiStartTopic('parity.pres', { voters, frozenAt: '2026-02-13T12:00:00.000Z' });
      const pCast = window.relayVoteUiCast({ topicId: 'parity.pres', voterId: 'user.manager1', decision: 'APPROVE', role: 'manager' });

      window.relayVoteUiStartTopic('parity.gov', { voters, frozenAt: '2026-02-13T12:01:00.000Z' });
      const panel = window.relayVoteUiGetPanelState();
      const snapshotIdA = panel?.eligibility?.snapshotId || null;
      const gCastA = window.relayVoteUiCast({ topicId: 'parity.gov', voterId: 'user.manager1', decision: 'APPROVE', role: 'manager' });
      const gCastB = window.relayVoteUiCast({ topicId: 'parity.gov', voterId: 'user.steward1', decision: 'APPROVE', role: 'steward' });
      const invalidBefore = (window.relayVoteUiGetRawState()?.ballots || []).length;
      const invalid = window.relayVoteUiCast({ topicId: 'parity.gov', voterId: 'user.not.eligible', decision: 'APPROVE', role: 'manager' });
      const invalidAfter = (window.relayVoteUiGetRawState()?.ballots || []).length;
      const stageLocked = window.relayVoteUiCast({ topicId: 'parity.locked', voterId: 'user.manager1', decision: 'APPROVE', role: 'manager' });
      const close = window.relayVoteUiCloseGovernance('parity.gov', { commitId: 'commit.parity.vote' });

      // determinism lane
      const runDet = () => {
        window.relayVoteUiSeedTopics(topics);
        window.relayVoteUiStartTopic('parity.pres', { voters, frozenAt: '2026-02-13T12:10:00.000Z' });
        window.relayVoteUiCast({ topicId: 'parity.pres', voterId: 'user.manager1', decision: 'APPROVE', role: 'manager' });
        window.relayVoteUiStartTopic('parity.gov', { voters, frozenAt: '2026-02-13T12:11:00.000Z' });
        window.relayVoteUiCast({ topicId: 'parity.gov', voterId: 'user.manager1', decision: 'APPROVE', role: 'manager' });
        window.relayVoteUiCast({ topicId: 'parity.gov', voterId: 'user.steward1', decision: 'APPROVE', role: 'steward' });
        window.relayVoteUiCloseGovernance('parity.gov', { commitId: 'commit.parity.det' });
        return window.relayVoteUiDeterminismDigest();
      };
      const digestA = runDet();
      const digestB = runDet();

      return {
        laneBuilt: Array.isArray(laneA) && laneA.length >= 2,
        presentationCast: pCast?.ok === true,
        governanceCast: gCastA?.ok === true && gCastB?.ok === true,
        eligibilityFrozen: !!snapshotIdA,
        invalidNoMutation: invalid?.ok === false && invalid?.reason === 'VOTE_ELIGIBILITY_MISMATCH' && invalidBefore === invalidAfter,
        stageLocked: stageLocked?.ok === false && stageLocked?.reason === 'STAGE_LOCKED',
        governanceClose: close?.ok === true,
        deterministic: digestA === digestB
      };
    });
    const votingPass = votingResult?.laneBuilt && votingResult?.presentationCast && votingResult?.governanceCast &&
      votingResult?.eligibilityFrozen && votingResult?.invalidNoMutation &&
      votingResult?.stageLocked && votingResult?.governanceClose && votingResult?.deterministic;
    log(`[PARITY] votingSurface result=${votingPass ? 'PASS' : 'FAIL'}`);

    // 5) HUD policy visibility + layer switching stability.
    const hudResult = await worldPage.evaluate(async () => {
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const hud = document.getElementById('hud');
      const meta = window.relayGetHudPolicyMeta ? window.relayGetHudPolicyMeta() : null;
      if (typeof window.relayRefreshHudNow === 'function') window.relayRefreshHudNow();
      await wait(200);
      const textA = String(hud?.innerText || '');

      const branch = (window.relayState?.tree?.nodes || []).find((n) => n.type === 'branch');
      let modeSwitchOk = false;
      if (branch?.id && typeof window.relayEnterBranchWalk === 'function' && typeof window.relayExitBranchWalk === 'function') {
        const enter = await window.relayEnterBranchWalk(branch.id);
        if (typeof window.relayRefreshHudNow === 'function') window.relayRefreshHudNow();
        await wait(250);
        const textB = String(hud?.innerText || '');
        await window.relayExitBranchWalk();
        modeSwitchOk = enter?.ok === true && textB.includes('BranchWalk');
      }
      return {
        meta,
        policyVisible: textA.includes('local:HUD-PARAMS-v0') && textA.includes('HUD-PARAMS-v0'),
        modeSwitchOk
      };
    });
    const hudPass = hudResult?.meta?.policyRef === 'local:HUD-PARAMS-v0' &&
      hudResult?.meta?.paramsVersion === 'HUD-PARAMS-v0' &&
      hudResult?.policyVisible === true &&
      hudResult?.modeSwitchOk === true;
    log(`[PARITY] hudPolicy result=${hudPass ? 'PASS' : 'FAIL'}`);

    // 6) Movement continuity.
    await worldPage.waitForFunction(
      () => Array.isArray(window.filamentRenderer?.timeboxCubes)
        && window.filamentRenderer.timeboxCubes.length > 0,
      undefined,
      { timeout: 120000 }
    );
    const movementResult = await worldPage.evaluate(async () => {
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const branches = (window.relayState?.tree?.nodes || [])
        .filter((n) => n.type === 'branch')
        .sort((a, b) => String(a.id).localeCompare(String(b.id)));

      // preset travel
      const presets = window.relayListCameraPresets ? window.relayListCameraPresets() : [];
      const preset = presets[0]?.presetId || null;
      const presetOut = preset ? await window.relayApplyCameraPreset(preset) : { ok: false };

      // branch walk
      let branchOut = { ok: false, branchId: null };
      for (const b of branches) {
        // eslint-disable-next-line no-await-in-loop
        const enter = await window.relayEnterBranchWalk(b.id);
        // eslint-disable-next-line no-await-in-loop
        await wait(120);
        // eslint-disable-next-line no-await-in-loop
        const st = window.relayGetBranchWalkState?.() || {};
        // eslint-disable-next-line no-await-in-loop
        const next = await window.relayBranchWalkNext();
        // eslint-disable-next-line no-await-in-loop
        const prev = await window.relayBranchWalkPrev();
        // eslint-disable-next-line no-await-in-loop
        const exit = await window.relayExitBranchWalk();
        const ok = enter?.ok === true &&
          Array.isArray(st.path) &&
          st.path.length >= 2 &&
          next?.ok === true &&
          prev?.ok === true &&
          exit?.ok === true &&
          exit?.selectionPreserved === true &&
          exit?.lodPreserved === true;
        if (ok) {
          branchOut = { ok: true, branchId: b.id };
          break;
        }
      }

      // filament ride (robust target selection; no behavior changes)
      const cubes = Array.isArray(window.filamentRenderer?.timeboxCubes) ? window.filamentRenderer.timeboxCubes : [];
      let rideOut = { ok: false, firstCell: cubes[0]?.cellId || null };
      for (const cube of cubes.slice(0, 12)) {
        const cellId = cube?.cellId || null;
        if (!cellId) continue;
        // eslint-disable-next-line no-await-in-loop
        const enter = await window.relayEnterFilamentRide(cellId);
        if (enter?.ok !== true) continue;
        // eslint-disable-next-line no-await-in-loop
        await wait(100);
        // eslint-disable-next-line no-await-in-loop
        const next = await window.relayFilamentRideNext();
        // eslint-disable-next-line no-await-in-loop
        const prev = await window.relayFilamentRidePrev();
        // eslint-disable-next-line no-await-in-loop
        const exit = await window.relayExitFilamentRide();
        const ok = next?.ok === true && prev?.ok === true && exit?.ok === true && exit?.selectionPreserved === true && exit?.lodPreserved === true;
        rideOut = { ok, cellId };
        if (ok) break;
      }

      // focus enter/exit restore (use proven targets from D-Lens proofs)
      let focusOut = { ok: false, target: null };
      const findAnyMatchId = () => {
        const sheets = (window.relayState?.tree?.nodes || []).filter((n) => n.type === 'sheet' && n.metadata?.isMatchSheet);
        for (const sheet of sheets) {
          const schema = sheet.metadata?.schema || [];
          const matchCol = schema.findIndex((c) => c.id === 'matchId' || c.name === 'matchId');
          if (matchCol < 0) continue;
          const cell = (sheet.cellData || []).find((c) => c.col === matchCol && Number(c.row) > 0 && String(c.value || c.display || '').trim());
          if (cell) return String(cell.value || cell.display);
        }
        return null;
      };
      const matchId = findAnyMatchId();
      const focusTargets = [
        matchId ? { id: matchId, type: 'match' } : { type: 'match', sheetId: 'P2P.ThreeWayMatch', row: 1 },
        'P2P.ThreeWayMatch',
        'P2P.ThreeWayMatch.cell.1.1'
      ];
      for (const t of focusTargets) {
        // eslint-disable-next-line no-await-in-loop
        const enter = await window.relayEnterFocus(t);
        // eslint-disable-next-line no-await-in-loop
        await wait(120);
        // eslint-disable-next-line no-await-in-loop
        const exit = await window.relayExitFocus();
        const ok = enter?.ok === true && exit?.ok === true && exit?.selectionPreserved === true && exit?.lodPreserved === true;
        if (ok) {
          focusOut = { ok: true, target: t };
          break;
        }
      }

      return {
        presetOk: presetOut?.ok === true,
        branchOk: branchOut.ok === true,
        rideOk: rideOut.ok === true,
        focusOk: focusOut.ok === true,
        detail: {
          presetOut,
          branchOut,
          rideOut,
          focusOut,
          branchCount: branches.length
        }
      };
    });
    const movementPass = movementResult?.presetOk && movementResult?.branchOk && movementResult?.rideOk && movementResult?.focusOk;
    log(`[PARITY] movementContinuity result=${movementPass ? 'PASS' : 'FAIL'}`);
    if (!movementPass) {
      log(`[PARITY] movement detail=${JSON.stringify(movementResult?.detail || {})}`);
    }

    // 7) Regression rails.
    const osv = await runNodeScript('scripts/osv1-full-system-proof.mjs');
    const osvPass = osv.output.includes('[OSV1] gate-summary result=PASS');
    log(`[PARITY] osv1 result=${osvPass ? 'PASS' : 'FAIL'}`);
    if (!osvPass) log(`[PARITY] osv1 detail=${String(osv.output || '').slice(0, 500)}`);

    const headless = await runNodeScript('scripts/headless-tier1-parity.mjs');
    const headlessPass = headless.output.includes('[HEADLESS] golden-compare facts=MATCH matches=MATCH summaries=MATCH kpis=MATCH packets=MATCH ledger=MATCH');
    log(`[PARITY] headlessParity result=${headlessPass ? 'PASS' : 'FAIL'}`);
    if (!headlessPass) log(`[PARITY] headless detail=${String(headless.output || '').slice(0, 500)}`);

    const requiredVoteLogs =
      worldLogs.some((x) => x.includes('[VOTE] type=presentation')) &&
      worldLogs.some((x) => x.includes('[VOTE] type=governance scope=')) &&
      worldLogs.some((x) => x.includes('[VOTE] eligibilitySnapshot id=')) &&
      worldLogs.some((x) => x.includes('[REFUSAL] stageLocked'));

    const gate = profileIsolationPass &&
      globeStackPass &&
      boundaryPass &&
      votingPass &&
      hudPass &&
      movementPass &&
      osvPass &&
      headlessPass &&
      requiredVoteLogs;

    log(`[PARITY] gate-summary result=${gate ? 'PASS' : 'FAIL'}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    if (!gate) process.exitCode = 2;
  } catch (err) {
    log(`[REFUSAL] reason=RESTORE_PARITY_BLOCKER_RUNTIME detail=${String(err?.message || err)}`);
    await fs.writeFile(LOG_FILE, `${lines.join('\n')}\n`, 'utf8');
    process.exitCode = 2;
  } finally {
    if (browser) await browser.close();
    if (globeServer) await stopServer(globeServer);
    if (devServer) await stopServer(devServer);
  }
}

await main();

