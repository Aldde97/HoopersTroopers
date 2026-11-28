(() => {
  if (!window.crypto?.randomUUID || navigator.globalPrivacyControl || navigator.doNotTrack === '1') return;

  // A fresh identifier for each page load. No account or save data is sent.
  const visitId = crypto.randomUUID();
  const projectToken = 'phc_rmDaPdjpm4njXfDLVebknzTgU56pSddZ7S6RpaBAFzQS';

  window.BM_ANALYTICS = (event) => {
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
          $process_person_profile: false,
          $geoip_disable: true
        }
      })
    }).catch(() => {});
  };

  window.BM_ANALYTICS('game_opened');
})();
