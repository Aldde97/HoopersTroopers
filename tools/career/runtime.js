// Loaded synchronously after the game's UI, before the player can choose a career.
(() => {
  const {version, legacy} = window.BM_RELEASE;
  const releasePath = id => '/play/releases/' + encodeURIComponent(id) + '/';
  const revisionOf = game => game.careerRelease ?? legacy;

  function switchForCareer(game, slot) {
    const revision = revisionOf(game);
    if (revision === version) return false;
    if (!/^[a-f0-9]{40}$/.test(revision)) throw Error('Unknown career version.');
    const url = new URL(releasePath(revision), location.origin);
    url.searchParams.set('resume', slot);
    location.assign(url);
    return true;
  }

  const originalNewGame = newGame;
  newGame = function (...args) {
    const result = originalNewGame.apply(this, args);
    G.careerRelease = version;
    return result;
  };

  const originalSave = save;
  save = function () {
    if (G && !G.demo) {
      if (revisionOf(G) !== version) throw Error('This career requires another game version.');
      G.careerRelease = version;
    }
    return originalSave();
  };

  const originalSlotLoad = slDoLoad;
  slDoLoad = async function (id) {
    try {
      const game = JSON.parse(await slotTxt(id));
      if (revisionOf(game) !== version && G && !G.demo) {
        save();
        while (SAVE_BUSY) await new Promise(resolve => setTimeout(resolve, 20));
        if (SAVE_WARNED) throw Error('Save your current career before switching.');
      }
      if (!switchForCareer(game, id)) await originalSlotLoad(id);
    } catch (error) {
      slOpen({t: error.message, bad: true});
    }
  };

  const originalLoad = ACT.load;
  ACT.load = function () {
    const game = loadSave();
    if (!game || !switchForCareer(game, 'single')) originalLoad();
  };

  const originalStart = ACT.startgame;
  ACT.startgame = async function (...args) {
    try {
      const response = await fetch('/play/release.json', {cache: 'no-store'});
      if (!response.ok) throw Error();
      const latest = (await response.json()).version;
      if (latest !== version) {
        location.assign('/play/?new=1');
        return;
      }
      originalStart.apply(this, args);
    } catch {
      toast('Could not check the latest game version. Please try again.');
    }
  };

  const request = new URLSearchParams(location.search);
  if (request.has('resume') || request.has('new')) SAVE_READY.then(async () => {
    history.replaceState(null, '', location.pathname + location.hash);
    splashHide();
    if (request.has('new')) return;
    const slot = request.get('resume');
    if (slot === 'single' && !IDB_OK) ACT.load();
    else await slDoLoad(slot === 'single' ? SLOT_ID : slot);
  });
})();
