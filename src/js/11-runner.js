// ── COMMAND RUNNER ────────────────────────────────────────────────────────
let toastNextFn = null;

// Jobs started in this tab, so a reload can reattach to work still running
function rememberJob(preId, jobId, lang) {
  try {
    const m = JSON.parse(localStorage.getItem('rnaflow-jobs') || '{}');
    m[preId] = { jobId, lang, at: Date.now() };
    localStorage.setItem('rnaflow-jobs', JSON.stringify(m));
  } catch (e) {}
}
function forgetJob(preId) {
  try {
    const m = JSON.parse(localStorage.getItem('rnaflow-jobs') || '{}');
    delete m[preId];
    localStorage.setItem('rnaflow-jobs', JSON.stringify(m));
  } catch (e) {}
}

async function runCommand(cmd, runBtn, stopBtn, termPanel, stepId, nextInfo, lang, preId) {
  runBtn.className = 'run-btn running';
  runBtn.innerHTML = '<span style="display:inline-block;width:8px;height:8px;background:var(--green);border-radius:50%;animation:pulse 1s infinite;"></span>&nbsp;Running…';
  runBtn.disabled  = true;
  stopBtn.classList.add('show');
  termPanel.classList.add('open');

  const scroll = termPanel.querySelector('.term-scroll');
  scroll.innerHTML = '';

  const addLine = (text, cls) => {
    const d = document.createElement('div');
    d.className = 'term-line' + (cls ? ' ' + cls : '');
    d.textContent = text;
    scroll.appendChild(d);
    scroll.scrollTop = scroll.scrollHeight;
  };

  // Show abbreviated command
  const firstLine = cmd.split('\n')[0].substring(0, 80) + (cmd.length > 80 ? '…' : '');
  addLine((lang === 'r' ? '> ' : '$ ') + firstLine);

  // POST to server
  let jobId;
  try {
    // Install blocks run through /setup: the server builds the env from the
    // pinned file without first activating the env it is about to create
    const setup = SETUP_BLOCKS.includes(preId);
    const res = await fetch(`${SERVER}${setup ? '/setup' : '/run'}`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(setup ? { yaml: envYaml() }
                                 : { cmd, lang: lang || 'bash', label: preId || 'command' })
    });
    if (setup && !res.ok && res.status !== 401) {
      const e = await res.json().catch(() => ({}));
      addLine('❌ ' + (e.detail || e.error || 'Setup could not start'), 'err');
      runBtn.className = 'run-btn failed'; runBtn.innerHTML = '✕ Failed'; runBtn.disabled = false;
      stopBtn.classList.remove('show');
      return;
    }
    if (res.status === 401) {
      addLine('🔑 Not paired with the server — paste its access token.', 'err');
      runBtn.className = 'run-btn failed'; runBtn.innerHTML = '🔑 Pair'; runBtn.disabled = false;
      stopBtn.classList.remove('show');
      setConnected(false);
      promptForToken();
      return;
    }
    jobId = (await res.json()).job_id;
    stopBtn.dataset.jobId = jobId;
    if (preId) rememberJob(preId, jobId, lang);
  } catch(e) {
    addLine('❌ Cannot reach server. Run: python3 rnaflow_server.py', 'err');
    runBtn.className = 'run-btn failed'; runBtn.innerHTML = '✕ Server offline'; runBtn.disabled = false;
    stopBtn.classList.remove('show');
    return;
  }

  return attachToJob(jobId, 0, { runBtn, stopBtn, addLine, stepId, nextInfo, preId });
}

// Stream a job from `fromIndex`. The server replays everything already
// produced, so reattaching after a page reload loses nothing.
function attachToJob(jobId, fromIndex, ui) {
  const { runBtn, stopBtn, addLine, stepId, nextInfo, preId } = ui;
  return new Promise(resolve => {
    let idx = fromIndex || 0;
    const es = new EventSource(authUrl(`/output/${jobId}`, { from: idx }));

    es.onmessage = e => {
      const msg = JSON.parse(e.data);
      if (typeof msg.index === 'number') idx = msg.index;

      if (msg.type === 'output') {
        msg.data.split('\n').forEach(l => { if (l) addLine(l); });
      }
      if (msg.type === 'done') {
        es.close();
        stopBtn.classList.remove('show');
        if (preId) forgetJob(preId);
        if (msg.exit_code === 0) {
          addLine('✅ Completed successfully', 'done-ok');
          runBtn.className = 'run-btn success';
          runBtn.innerHTML = '✅ Done';
          runBtn.disabled  = false;
          if (stepId) markDone(stepId);
          if (nextInfo) showToast('Step complete!', nextInfo[0], nextInfo[1]);
        } else if (msg.exit_code === -1) {
          addLine('⏹ Stopped', 'err');
          runBtn.className = 'run-btn'; runBtn.innerHTML = '▶ Run'; runBtn.disabled = false;
        } else if (msg.exit_code === 78) {
          addLine('❌ The conda environment is missing — run the Install Tools step first.', 'done-err');
          runBtn.className = 'run-btn failed';
          runBtn.innerHTML = '✕ No env';
          runBtn.disabled  = false;
        } else {
          addLine(`❌ Failed (exit ${msg.exit_code}) — check output above`, 'done-err');
          runBtn.className = 'run-btn failed';
          runBtn.innerHTML = '✕ Failed';
          runBtn.disabled  = false;
        }
        resolve();
      }
    };

    es.onerror = () => {
      es.close();
      addLine('⚠ Connection dropped — retrying…', 'err');
      // The job keeps running server-side; pick up exactly where we left off
      setTimeout(() => attachToJob(jobId, idx, ui).then(resolve), 2000);
    };
  });
}

// After a reload, reattach to anything this tab started that may still be live
async function resumeJobs() {
  let m;
  try { m = JSON.parse(localStorage.getItem('rnaflow-jobs') || '{}'); } catch (e) { return; }
  const entries = Object.entries(m);
  if (!entries.length || !connected) return;

  let live = [];
  try {
    const r = await fetch(`${SERVER}/jobs`, { headers: authHeaders() });
    if (!r.ok) return;
    live = (await r.json()).jobs || [];
  } catch (e) { return; }

  entries.forEach(([preId, rec]) => {
    const job = live.find(j => j.id === rec.jobId);
    if (!job) { forgetJob(preId); return; }
    const pre = document.getElementById(preId);
    const block = pre && pre.closest('.code-block');
    if (!block) return;
    const runBtn  = block.querySelector('.run-btn');
    const stopBtn = block.querySelector('.stop-btn');
    const panel   = block.querySelector('.term-panel');
    if (!runBtn || !panel) return;

    const scroll = panel.querySelector('.term-scroll');
    panel.classList.add('open');
    scroll.innerHTML = '';
    const addLine = (text, cls) => {
      const d = document.createElement('div');
      d.className = 'term-line' + (cls ? ' ' + cls : '');
      d.textContent = text;
      scroll.appendChild(d);
      scroll.scrollTop = scroll.scrollHeight;
    };
    addLine(`↻ Reattached to job ${rec.jobId} (${job.status})`);

    if (job.status === 'running' || job.status === 'queued') {
      runBtn.className = 'run-btn running';
      runBtn.innerHTML = '<span style="display:inline-block;width:8px;height:8px;background:var(--green);border-radius:50%;animation:pulse 1s infinite;"></span>&nbsp;Running…';
      runBtn.disabled = true;
      stopBtn.classList.add('show');
      stopBtn.dataset.jobId = rec.jobId;
    }
    const info = STEP_MAP[preId] || {};
    attachToJob(rec.jobId, 0, {
      runBtn, stopBtn, addLine,
      stepId: info.step, nextInfo: info.next, preId
    });
  });
}

