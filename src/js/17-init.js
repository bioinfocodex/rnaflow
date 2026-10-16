// ── INIT ─────────────────────────────────────────────────────────────────
renderEnvBlocks();        // install / fix commands from the pinned environment
restoreConfig();          // bring back the saved project before first render
applyMethod();            // fills in the method blurb, dims align-only steps
applyDataSource();        // shows the right data-source panel, then updateAll()
updateAll();
setTimeout(buildAllRunButtons, 300);
restoreMode();
restoreEnv();
// Reattach to any job this tab started that is still running server-side
setTimeout(resumeJobs, 1200);

// Auto-detect OS and pre-fill server instructions for HTML mode
const detectedOS = autoDetectOS();
const desktopOsMap = { mac: 'mac-app', win: 'win-app', linux: 'linux-app' };
const desktopTarget = desktopOsMap[detectedOS] || 'mac-app';
const desktopTab = document.querySelector('#os-tabs-desktop .os-tab[onclick*="' + desktopTarget + '"]');
if (desktopTab) showOSDesktop(desktopTarget, desktopTab);

// Restore how preference (desktop vs html)
let savedHow;
try { savedHow = localStorage.getItem('rnaflow-how'); } catch(e) {}
showHow(savedHow === 'html' ? 'html' : 'desktop', null);

// Show correct env sub-panel for current env
selectEnv(currentEnv || 'local');

