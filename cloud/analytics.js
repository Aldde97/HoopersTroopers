(() => {
  if (!window.crypto?.randomUUID || navigator.globalPrivacyControl || navigator.doNotTrack === '1') return;

  // A fresh identifier for each page load. No account or save data is sent.
  const visitId = crypto.randomUUID();
  const projectToken = 'phc_rmDaPdjpm4njXfDLVebknzTgU56pSddZ7S6RpaBAFzQS';

  const capture = (event, properties = {}) => {
    fetch('https://eu.i.posthog.com/i/v0/e/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      keepalive: true,
      body: JSON.stringify({
        api_key: projectToken,
        event,
        distinct_id: visitId,
        properties: {
          ...properties,
          $process_person_profile: false,
          $geoip_disable: true
        }
      })
    }).catch(() => {});
  };

  if (document.currentScript.dataset.analyticsSurface === 'landing') {
    capture('landing_page_viewed');
    const trackPlay = (event) => {
      const link = event.target.closest('a[data-play-placement]');
      if (link) capture('play_clicked', { placement: link.dataset.playPlacement });
    };
    document.addEventListener('click', trackPlay);
    document.addEventListener('auxclick', (event) => {
      if (event.button === 1) trackPlay(event);
    });
  } else {
    window.BM_ANALYTICS = capture;
    capture('game_opened');
  }
})();
