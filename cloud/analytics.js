(() => {
  if (!window.crypto?.randomUUID || navigator.globalPrivacyControl || navigator.doNotTrack === '1') return;

  const visitId = crypto.randomUUID();
  const isLanding = document.currentScript.dataset.analyticsSurface === 'landing';
  const consentKey = 'bm-replay-consent';
  let consent = false;
  let recorder;
  let pending;
  try { consent = sessionStorage.getItem(consentKey) === 'yes'; } catch {}
  const projectToken = 'phc_rmDaPdjpm4njXfDLVebknzTgU56pSddZ7S6RpaBAFzQS';

  const capture = (event, properties = {}) => {
    const sessionId = consent && recorder?.get_session_id();
    fetch('https://eu.i.posthog.com/i/v0/e/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      keepalive: true,
      body: JSON.stringify({
        api_key: projectToken,
        event,
        distinct_id: sessionId ? recorder.get_distinct_id() : visitId,
        properties: {
          ...properties,
          ...(sessionId ? { $session_id: sessionId } : {}),
          $process_person_profile: false,
          $geoip_disable: true
        }
      })
    }).catch(() => {});
  };

  function startReplay() {
    if (pending) return pending;
    pending = import('https://cdn.jsdelivr.net/npm/posthog-js@1.455.4/+esm')
      .then(({ default: posthog }) => {
        if (!consent) return;
        if (!recorder) {
          posthog.init(projectToken, {
            api_host: 'https://eu.i.posthog.com',
            ui_host: 'https://eu.posthog.com',
            defaults: '2026-05-30',
            persistence: 'sessionStorage',
            person_profiles: 'never',
            disable_geoip: true,
            autocapture: false,
            capture_pageview: false,
            capture_pageleave: false,
            capture_exceptions: false,
            capture_performance: false,
            disable_surveys: true,
            strict_script_versioning: true,
            disable_session_recording: true,
            session_recording: {
              maskAllInputs: true,
              maskTextSelector: isLanding ? null : '*',
              blockSelector: '#bmAuth, #bmMenu, .bmacc, .bmav, input[type="file"], [contenteditable]',
              maskAttributeFn: (name, value) =>
                /^(?:title|aria-label|alt|placeholder|value|data-.*)$/i.test(name) ? '' : value,
              maskCapturedNetworkRequestFn: () => null,
              recordHeaders: false,
              recordBody: false
            },
            enable_recording_console_log: false
          });
          recorder = posthog;
        }
        recorder.startSessionRecording();
      })
      .finally(() => { pending = undefined; });
    return pending;
  }

  // Authentication links can carry credentials in their query or fragment.
  const canReplay = isLanding
    ? !location.hash
    : !location.search && !location.hash;
  if (canReplay) {
    customElements.define('bm-replay-options', class extends HTMLElement {
      connectedCallback() {
        if (this.childElementCount) return;
        this.hidden = false;
        const options = document.createElement('details');
        options.innerHTML = '<summary style="cursor:pointer">Replay privacy</summary>' +
          '<p>Optional session replay sends a masked recording of your screen interactions to PostHog to help improve the game. Your choice applies to this tab.</p>' +
          '<button class="btn sm" type="button"></button> <a style="color:#ffba79" href="/privacy/">Privacy policy</a>' +
          '<p role="status"></p>';
        const button = options.querySelector('button');
        const status = options.querySelector('[role="status"]');
        const update = () => { button.textContent = consent ? 'Turn off replay' : 'Allow replay'; };
        update();
        button.addEventListener('click', async () => {
          consent = !consent;
          try { sessionStorage.setItem(consentKey, consent ? 'yes' : 'no'); } catch {}
          update();
          status.textContent = consent ? 'Starting replay…' : 'Replay is off.';
          if (!consent) {
            recorder?.stopSessionRecording();
            return;
          }
          try {
            await startReplay();
            if (consent) {
              capture('session_replay_enabled');
              status.textContent = 'Replay is enabled for this tab.';
            }
          } catch {
            consent = false;
            try { sessionStorage.removeItem(consentKey); } catch {}
            update();
            status.textContent = 'Replay could not start. Try again.';
          }
        });
        this.append(options);
      }
    });
  }

  const pageEvent = isLanding ? 'landing_page_viewed' : 'game_opened';
  if (consent && canReplay) {
    Promise.race([startReplay(), new Promise(resolve => setTimeout(resolve, 3000))])
      .catch(() => {}).then(() => capture(pageEvent));
  } else {
    capture(pageEvent);
  }

  if (isLanding) {
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
  }
})();
