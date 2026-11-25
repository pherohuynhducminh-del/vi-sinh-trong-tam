(() => {
  if (new URLSearchParams(parent.location.search).get('diagnostics') !== '1') return;
  const panel = document.createElement('details');
  panel.style.cssText = 'margin:12px;padding:12px;border:1px solid var(--line);border-radius:12px';
  const title = document.createElement('summary');
  title.textContent = 'Chẩn đoán Clinical Quiz';
  const refresh = document.createElement('button');
  refresh.textContent = 'Cập nhật chẩn đoán';
  const report = document.createElement('textarea');
  report.readOnly = true;
  report.rows = 15;
  report.style.width = '100%';
  report.setAttribute('aria-label', 'Báo cáo trạng thái có thể sao chép');
  function snapshot() {
    let sessionBank = null;
    try { sessionBank = parent.sessionStorage.getItem('clinical_quiz_bank'); } catch {}
    let storageAvailable = true;
    try { localStorage.getItem(STORAGE); } catch { storageAvailable = false; }
    report.value = JSON.stringify({
      build: '3B.1',
      bank: !IS_VS ? 'hs' : STRATEGIC ? 'focus' : 'vs',
      selectedBank: parent.document.querySelector('#stage iframe')?.title,
      sessionBank: ['focus', 'vs', 'hs'].includes(sessionBank) ? sessionBank : null,
      iframe: window !== parent,
      mode: S.mode,
      screen: ['home', 'setup', 'running'].find(name => document.body.classList.contains('session-' + name)),
      currentId: S.current,
      bankSize: QUESTIONS.length,
      activeSize: activeIds().length,
      visibleSize: filteredIds().length,
      sessionSize: S.session?.length ?? 0,
      previousDisabled: $('prevBtn').disabled,
      nextDisabled: $('nextBtn').disabled,
      searchActive: Boolean($('search').value),
      topicFilterActive: $('topicFilter').value !== 'all',
      formatFilter: $('formatFilter').value,
      progressFilter: $('filter').value,
      storageAvailable,
      ...window.quizNavigationDiagnostics?.()
    }, null, 2);
  }
  panel.addEventListener('toggle', () => { if (panel.open) snapshot(); });
  refresh.onclick = snapshot;
  panel.append(title, refresh, report);
  const footer = document.createElement('footer');
  footer.append(panel);
  document.body.append(footer);
  snapshot();
})();
