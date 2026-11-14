/*
 * Cyntron-X pairing site.
 *
 * Talks to the pairing server in ../pairing-server.
 *
 * To look at finished states without a server, open:
 *   ?preview=code     pairing code result with a sample code
 *   ?preview=qr       QR tab
 *   ?preview=linked   success screen
 */

/* ============================================================
 * PAIRING SERVER ADDRESS: change this one line when you deploy.
 *
 *   Local:     'http://localhost:8090'
 *   Deployed:  'https://your-pairing-server.onrender.com'
 *
 * No trailing slash. Once the site is on Vercel (https) the
 * server address must be https too, or browsers will block it.
 * ============================================================ */
var API_BASE_URL = 'https://cyntron-x-32qb.onrender.com';

(function () {
  'use strict';

  // name, ISO code, dial code, example national number
  var COUNTRIES = [
    ['Nigeria', 'NG', '234', '801 234 5678'],
    ['Ghana', 'GH', '233', '24 123 4567'],
    ['Kenya', 'KE', '254', '712 345678'],
    ['South Africa', 'ZA', '27', '71 123 4567'],
    ['Cameroon', 'CM', '237', '6 71 23 45 67'],
    ['Uganda', 'UG', '256', '712 345678'],
    ['Tanzania', 'TZ', '255', '621 234 567'],
    ['Egypt', 'EG', '20', '100 123 4567'],
    ['United States', 'US', '1', '201 555 0123'],
    ['Canada', 'CA', '1', '204 555 0123'],
    ['United Kingdom', 'GB', '44', '7400 123456'],
    ['India', 'IN', '91', '81234 56789'],
    ['Pakistan', 'PK', '92', '301 2345678'],
    ['Indonesia', 'ID', '62', '812 3456 789'],
    ['Brazil', 'BR', '55', '11 96123 4567'],
    ['Germany', 'DE', '49', '1512 3456789'],
    ['France', 'FR', '33', '6 12 34 56 78'],
    ['United Arab Emirates', 'AE', '971', '50 123 4567'],
    ['Saudi Arabia', 'SA', '966', '51 234 5678']
  ];

  var $ = function (id) { return document.getElementById(id); };
  var tabs = document.querySelector('.tabs');
  var tabCode = $('tab-code'), tabQr = $('tab-qr');
  var panelCode = $('panel-code'), panelQr = $('panel-qr');
  var form = $('pair-form'), phone = $('phone'), phoneField = $('phone-field');
  var hint = $('phone-hint'), country = $('country');
  var pairBtn = $('pair-btn'), qrBtn = $('qr-btn');
  var result = $('code-result'), codeBox = $('code-box'), timerEl = $('code-timer');
  var notice = $('notice');
  var timerId = null;

  /* ---------- Pairing server ---------- */

  var API = API_BASE_URL.replace(/\/+$/, '');
  var POLL_MS = 3000;
  var HEALTH_MS = 30000;
  var active = null; // the link attempt being watched: { id, mode, timer }

  // Calls the server and returns its JSON. Rejects with an Error whose
  // message is safe to show to the user.
  function api(path, options) {
    var ctrl = new AbortController();
    var kill = setTimeout(function () { ctrl.abort(); }, 45000);
    var opts = options || {};
    opts.signal = ctrl.signal;
    return fetch(API + path, opts)
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (res.ok) return data;
          var err = new Error((data.error && data.error.message) || 'The pairing server returned an error. Try again.');
          err.status = res.status;
          throw err;
        });
      }, function () {
        throw new Error('Cannot reach the pairing server. Check your connection and try again.');
      })
      .finally(function () { clearTimeout(kill); });
  }

  function requestPairingCode(fullNumber) {
    return api('/api/pair', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: fullNumber })
    });
  }

  function requestQrCode() {
    return api('/api/qr', { method: 'POST' });
  }

  // Watches a link attempt until the phone confirms, it expires, or it fails.
  function watch(id, mode) {
    stopWatching();
    var mine = active = { id: id, mode: mode, timer: null };
    function poll() {
      api('/api/session/' + id).then(function (s) {
        if (active !== mine) return;
        if (s.status === 'pending') {
          if (mode === 'qr' && s.qr) showQr(s.qr);
          mine.timer = setTimeout(poll, POLL_MS);
        } else if (s.status === 'linked') {
          stopWatching();
          showLinked();
        } else {
          endAttempt(s.message || 'This link attempt ended. Start again.');
        }
      }, function (err) {
        if (active !== mine) return;
        if (err.status === 404) endAttempt('This link attempt expired. Start again.');
        else mine.timer = setTimeout(poll, POLL_MS); // brief network trouble: keep trying
      });
    }
    mine.timer = setTimeout(poll, POLL_MS);
  }

  function stopWatching() {
    if (active) clearTimeout(active.timer);
    active = null;
  }

  function endAttempt(message) {
    stopWatching();
    resetCode();
    resetQr();
    showNotice(message, true);
  }

  /* ---------- Country picker ---------- */

  function flag(iso) {
    return String.fromCodePoint.apply(null, iso.split('').map(function (c) {
      return 127397 + c.charCodeAt(0);
    }));
  }

  var defaultHint = '';
  function applyCountry() {
    var c = COUNTRIES[country.selectedIndex];
    $('country-flag').textContent = flag(c[1]);
    $('country-dial').textContent = '+' + c[2];
    phone.placeholder = c[3];
    defaultHint = c[1] === 'NG'
      ? 'Leave out the first 0. For 0801 234 5678, type 8012345678.'
      : 'Type the number without the country code or a leading 0.';
    clearError();
  }

  COUNTRIES.forEach(function (c) {
    var o = document.createElement('option');
    o.textContent = c[0] + ' (+' + c[2] + ')';
    country.appendChild(o);
  });
  country.addEventListener('change', applyCountry);
  applyCountry();

  /* ---------- Phone input ---------- */

  function digits() { return phone.value.replace(/\D/g, ''); }

  function showError(msg) {
    phoneField.classList.add('is-invalid');
    phone.setAttribute('aria-invalid', 'true');
    hint.classList.add('is-error');
    hint.textContent = msg;
  }
  function clearError() {
    phoneField.classList.remove('is-invalid');
    phone.removeAttribute('aria-invalid');
    hint.classList.remove('is-error');
    hint.textContent = defaultHint;
  }

  phone.addEventListener('input', function () {
    var clean = phone.value.replace(/[^\d ]/g, '');
    if (clean !== phone.value) phone.value = clean;
    clearError();
    hideNotice();
  });

  function validate() {
    var d = digits();
    if (!d) return 'Enter your WhatsApp number.';
    if (d.charAt(0) === '0') return 'Leave out the first 0.';
    if (d.length < 6 || d.length > 13) return 'That number does not look right. Check it and try again.';
    return '';
  }

  /* ---------- Notice ---------- */

  function showNotice(msg, isError) {
    notice.textContent = msg;
    notice.classList.toggle('is-error', !!isError);
    notice.hidden = false;
  }
  function hideNotice() { notice.hidden = true; }

  function setLoading(btn, on) {
    btn.disabled = on;
    btn.classList.toggle('is-loading', on);
  }

  /* ---------- Tabs ---------- */

  function selectTab(name, focus) {
    var isQr = name === 'qr';
    tabs.dataset.active = name;
    tabCode.classList.toggle('is-active', !isQr);
    tabQr.classList.toggle('is-active', isQr);
    tabCode.setAttribute('aria-selected', String(!isQr));
    tabQr.setAttribute('aria-selected', String(isQr));
    tabCode.tabIndex = isQr ? -1 : 0;
    tabQr.tabIndex = isQr ? 0 : -1;
    panelCode.classList.toggle('is-active', !isQr);
    panelQr.classList.toggle('is-active', isQr);
    hideNotice();
    if (focus) (isQr ? tabQr : tabCode).focus();
  }
  tabCode.addEventListener('click', function () { selectTab('code'); });
  tabQr.addEventListener('click', function () { selectTab('qr'); });
  tabs.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      selectTab(tabs.dataset.active === 'qr' ? 'code' : 'qr', true);
    }
  });

  /* ---------- Pairing code flow ---------- */

  function showCode(code, seconds) {
    codeBox.textContent = '';
    code.split('').forEach(function (ch, i) {
      if (i === 4) codeBox.appendChild(document.createElement('i'));
      var s = document.createElement('span');
      s.textContent = ch;
      codeBox.appendChild(s);
    });
    codeBox.setAttribute('aria-label', 'Pairing code ' + code.split('').join(' '));
    codeBox.dataset.code = code;
    form.hidden = true;
    result.hidden = false;
    startTimer(seconds);
  }

  function startTimer(seconds) {
    clearInterval(timerId);
    var left = seconds;
    function tick() {
      var m = Math.floor(left / 60), s = left % 60;
      timerEl.textContent = m + ':' + (s < 10 ? '0' : '') + s;
      if (left <= 0) {
        endAttempt('That code expired. Request a new one.');
        return;
      }
      left -= 1;
    }
    tick();
    timerId = setInterval(tick, 1000);
  }

  function resetCode() {
    clearInterval(timerId);
    result.hidden = true;
    form.hidden = false;
    hideNotice();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    hideNotice();
    var err = validate();
    if (err) { showError(err); phone.focus(); return; }

    var full = COUNTRIES[country.selectedIndex][2] + digits();
    stopWatching();
    resetQr();
    setLoading(pairBtn, true);
    requestPairingCode(full)
      .then(function (res) {
        showCode(res.code, res.expiresIn || 300);
        watch(res.id, 'code');
      })
      .catch(function (error) { showNotice(error.message, true); })
      .then(function () { setLoading(pairBtn, false); });
  });

  $('reset-btn').addEventListener('click', function () { stopWatching(); resetCode(); phone.focus(); });

  $('copy-btn').addEventListener('click', function () {
    var btn = this, code = codeBox.dataset.code || '';
    var done = function (ok) {
      btn.textContent = ok ? 'Copied' : 'Copy failed';
      setTimeout(function () { btn.textContent = 'Copy code'; }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(function () { done(true); }, function () { done(false); });
    } else {
      done(false);
    }
  });

  /* ---------- QR flow ---------- */

  var qrBox = $('qr-box');
  var qrEmpty = qrBox.innerHTML;
  var qrLabel = qrBtn.querySelector('.btn-label');

  function showQr(src) {
    var img = qrBox.querySelector('img');
    if (!img) {
      img = new Image();
      img.alt = 'WhatsApp linking QR code';
      qrBox.textContent = '';
      qrBox.appendChild(img);
      qrBox.classList.add('has-qr');
    }
    if (img.src !== src) img.src = src;
    qrLabel.textContent = 'Get a new QR code';
  }

  function resetQr() {
    qrBox.innerHTML = qrEmpty;
    qrBox.classList.remove('has-qr');
    qrLabel.textContent = 'Generate QR code';
  }

  qrBtn.addEventListener('click', function () {
    hideNotice();
    stopWatching();
    resetCode();
    setLoading(qrBtn, true);
    requestQrCode()
      .then(function (res) {
        showQr(res.qr);
        watch(res.id, 'qr');
      })
      .catch(function (error) { resetQr(); showNotice(error.message, true); })
      .then(function () { setLoading(qrBtn, false); });
  });

  /* ---------- Linked (success) screen ---------- */

  var linked = $('linked'), panels = document.querySelector('.panels');

  function showLinked() {
    resetCode();
    resetQr();
    tabs.hidden = true;
    panels.hidden = true;
    linked.hidden = false;
    $('again-btn').focus();
  }

  $('again-btn').addEventListener('click', function () {
    linked.hidden = true;
    tabs.hidden = false;
    panels.hidden = false;
    phone.value = '';
    selectTab('code');
  });

  /* ---------- Server status pill ---------- */

  function setStatus(state) {
    var labels = { online: 'Bot online', offline: 'Bot offline', unknown: 'Checking' };
    $('bot-status').dataset.state = state;
    $('bot-status-text').textContent = labels[state];
  }

  function checkHealth() {
    api('/health').then(
      function (d) { setStatus(d.status === 'ok' ? 'online' : 'offline'); },
      function () { setStatus('offline'); }
    );
  }

  /* ---------- Design previews ---------- */

  var preview = new URLSearchParams(location.search).get('preview');
  if (preview === 'code') { showCode('CYNT7X24', 300); showNotice('Design preview. This is a sample code and will not link a device.'); }
  if (preview === 'qr') selectTab('qr');
  if (preview === 'linked') showLinked();

  setStatus('unknown');
  checkHealth();
  setInterval(checkHealth, HEALTH_MS);
})();
