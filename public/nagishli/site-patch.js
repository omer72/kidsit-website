/* kidsit.ai: site wrapper patches, ported from the Bialystok/IKA sites for Nagish Li 3.0 beta (vendor file left untouched):
   - Escape closes the panel from anywhere inside it and returns focus to the trigger
   - clear, localized aria-labels on the trigger / Close button
   - overlay close spans get role=button + tabindex
   - the widget root (after the footer) becomes a labelled region (axe "region")
   - closed panel is inert + aria-hidden (out of the Tab order and the a11y tree); the trigger stays reachable
   - axe fixes inside the panel: +/- spacing controls become labelled buttons, custom colour inputs and the Quick
     Navigation select get labels, no nested interactives
   - colour swatch lists are radiogroups with one Tab stop (roving tabindex); arrow keys move and select; aria-checked
     is read from the widget's real state (data-text-color / data-background-color on <nagishli>), never from clicks;
     the vendor's own Enter/Space handling is kept (no extra key handler)
   - the widget's "Accessibility Statement" links go to this site's own statement page (not the vendor's generic dialog);
     Escape closes any vendor dialog first and returns focus to its opener
   NOTE: do not move the widget's DOM (an earlier tab-order patch re-inserted it after the header and caused a full-page layout shift, CLS ~2). */
(function () {
  // kidsit.ai routes both languages under a prefix: /he/... and /en/... (anything else, e.g. a 404, falls back to <html lang>).
  function curLang() { var m = location.pathname.match(/^\/(he|en)(\/|$)/); return m ? m[1] : (document.documentElement.lang === 'he' ? 'he' : 'en') }
  var lang = curLang()
  var LS = { he: { menu: 'תפריט נגישות', open: 'פתיחת תפריט הנגישות', close: 'סגירת תפריט הנגישות', lang: 'בחירת שפה' },
    en: { menu: 'Accessibility menu', open: 'Open accessibility menu', close: 'Close accessibility menu', lang: 'Choose language' } }
  var LX = function (dir, title) { return lang === 'he' ? (dir === 'more' ? 'הגדלה: ' : 'הקטנה: ') + title : (dir === 'more' ? 'Increase ' : 'Decrease ') + title }
  var L = LS[lang]
  // NG-1: Next.js switches HE <-> EN client-side, so the language is re-read from the URL whenever it is used.
  function syncLang() { lang = curLang(); L = LS[lang] }
  function statementUrl() { return '/' + curLang() + '/accessibility' } // the site's own statement page
  /** role=button + tabindex + Enter/Space for vendor spans that only have an aria-label. */
  function asButton(list) { for (var i = 0; i < list.length; i++) { var el = list[i]; el.setAttribute('role', 'button'); if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0')
    if (!el.__bv) { el.__bv = 1; el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.click() } }) } } }
  function q(id) { return document.getElementById(id) }
  function isOpen() { var w = q('NagishLiWidget'); return !!(w && /nagishli-widget-show/.test(w.className)) }
  function fix() {
    syncLang()
    var c = q('NagishLiCloseBtn'), t = document.querySelector('#NagishLiTrigger .nagishli-trigger-icon')
    if (c && c.getAttribute('aria-label') !== L.close) c.setAttribute('aria-label', L.close)
    if (t) { var want = L.open; if (t.getAttribute('aria-label') !== want) t.setAttribute('aria-label', want); t.setAttribute('aria-expanded', String(isOpen())) }
    var lc = q('NagishLiLangChooser'); if (lc && lc.getAttribute('aria-label') !== L.lang) lc.setAttribute('aria-label', L.lang)
    asButton(document.querySelectorAll('[data-nagishli-toggle]:not([role])'))
    // The widget root sits after the footer, outside every landmark (axe "region"): make it a labelled region.
    var root = document.querySelector('nagishli'); if (root && !root.hasAttribute('role')) { root.setAttribute('role', 'region'); root.setAttribute('aria-label', L.menu) }
    if (t && !t.__bvKey) { t.__bvKey = 1; t.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Spacebar') e.preventDefault() }); t.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); if (!isOpen()) t.click() } }) }
    if (c && !c.__bvKey) { c.__bvKey = 1; c.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Spacebar') e.preventDefault() }); c.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); c.click(); var t2 = document.querySelector('#NagishLiTrigger .nagishli-trigger-icon'); if (t2) t2.focus() } }) }
    // Overlay close spans carry an aria-label without a role (axe aria-prohibited-attr): make them real buttons.
    asButton(document.querySelectorAll('.nagishli-overlay-content-close:not([role])'))
    // L8: the vendor's credit links use http:// (localize.co.il times out over http); point them at https.
    var cr = document.querySelectorAll('nagishli a[href^="http://"]')
    for (var h = 0; h < cr.length; h++) cr[h].setAttribute('href', cr[h].getAttribute('href').replace(/^http:/, 'https:'))
    syncInert(); fixControls()
  }
  /** Text of the option row an element belongs to (e.g. "Line Spacing"), from the vendor's .nagishli-item-title. */
  function rowTitle(el) {
    var h = el.closest('.nagishli-option-holder, .nagishli-option, li'); var tt = null
    while (h && !(tt = h.querySelector('.nagishli-item-title'))) h = h.parentElement && h.parentElement.closest('.nagishli-option-holder, .nagishli-option, li')
    return tt ? tt.textContent.trim() : ''
  }
  function setAttr(el, k, v) { if (el.getAttribute(k) !== v) el.setAttribute(k, v) }
  function swatches(ul) { return Array.prototype.filter.call(ul.children, function (li) { return li.hasAttribute('data-nagishli-color') && !li.querySelector('input') }) }
  // B26: radio keyboard model. Arrows move to the next/previous swatch and select it (the vendor's arrow handling only
  // moved focus); RTL swaps left/right. Enter/Space stay with the vendor.
  document.addEventListener('keydown', function (e) {
    var li = e.target && e.target.closest && e.target.closest('#NagishLiWidget .nagishli-custom-colors-panel > li[role="radio"]'); if (!li) return
    var k = e.key, rtl = getComputedStyle(li.parentElement).direction === 'rtl', d = 0
    if (k === 'ArrowDown' || k === (rtl ? 'ArrowLeft' : 'ArrowRight')) d = 1; else if (k === 'ArrowUp' || k === (rtl ? 'ArrowRight' : 'ArrowLeft')) d = -1
    else if (k === 'Home') d = 'first'; else if (k === 'End') d = 'last'; else return
    e.preventDefault(); e.stopImmediatePropagation()
    var list = swatches(li.parentElement), i = list.indexOf(li)
    var nx = d === 'first' ? list[0] : d === 'last' ? list[list.length - 1] : list[(i + d + list.length) % list.length]
    if (!nx || nx === li) return
    setAttr(li, 'tabindex', '-1'); setAttr(nx, 'tabindex', '0'); nx.focus(); if (nx.getAttribute('aria-checked') !== 'true') nx.click()
  }, true)
  function trig() { return document.querySelector('#NagishLiTrigger .nagishli-trigger-icon') }
  function overlayOpen() { var o = q('NagishLiOverlay'); return !!(o && /nagishli-overlay-show/.test(o.className)) }
  /** B21: while closed, the panel is only moved off-screen; take it out of the Tab order and the a11y tree. */
  var wasOpen = false
  function syncInert() {
    var w = q('NagishLiWidget'); if (!w) return
    var t = trig(), open = isOpen()
    if (t && w.contains(t)) return // never hide the trigger (not the case in 3.0b, but stay safe)
    if (open) { if (w.hasAttribute('inert')) w.removeAttribute('inert'); if (w.hasAttribute('aria-hidden')) w.removeAttribute('aria-hidden') }
    else {
      if (wasOpen && t && w.contains(document.activeElement)) t.focus() // closed via the Close button: hand focus back
      if (!w.hasAttribute('inert')) w.setAttribute('inert', ''); setAttr(w, 'aria-hidden', 'true')
    }
    wasOpen = open
  }
  /** B22/B25/B26: ARIA fixes for controls inside the panel (vendor markup and handlers left in place; attributes only). */
  function fixControls() {
    var w = q('NagishLiWidget'); if (!w) return
    var root = document.querySelector('nagishli')
    // +/- spacing counters: <span tabindex aria-label="Add"> without a role -> labelled buttons.
    var pm = w.querySelectorAll('[data-nagishli-counter]')
    for (var i = 0; i < pm.length; i++) { var b = pm[i], title = rowTitle(b)
      setAttr(b, 'role', 'button') /* vendor already handles Enter/Space here: no extra key handler (it would double-step) */; if (title) setAttr(b, 'aria-label', LX(b.getAttribute('data-nagishli-counter') === 'subtract' ? 'less' : 'more', title)) }
    // Colour swatches: <ul><li role=button> (button isn't allowed on li) -> a radiogroup of radios with one Tab stop.
    // The vendor toggles a colour on click/Enter/Space and records the active one on <nagishli data-text-color="red"> /
    // data-background-color, so aria-checked (and the roving tabindex) are derived from that, never from click events.
    var lists = w.querySelectorAll('.nagishli-custom-colors-panel')
    for (var j = 0; j < lists.length; j++) { var ul = lists[j]; setAttr(ul, 'role', 'radiogroup'); var gt = rowTitle(ul); if (gt) setAttr(ul, 'aria-label', gt)
      var holder = ul.closest('[data-nagishli-type="custom-colors"]'), kind = holder && holder.getAttribute('data-nagishli-value')
      var cur = root && kind ? root.getAttribute('data-' + kind + '-color') : null
      var radios = swatches(ul), stop = null
      for (var k = 0; k < ul.children.length; k++) { var li = ul.children[k], inp = li.querySelector('input')
        if (inp) { // custom colour: the <input type=color> is the control; the li must not be interactive around it
          var lab = li.getAttribute('aria-label'); if (lab) { setAttr(inp, 'aria-label', lab); li.removeAttribute('aria-label') }
          setAttr(li, 'role', 'none') } }
      for (var r = 0; r < radios.length; r++) { var on = !!cur && cur === radios[r].getAttribute('data-nagishli-color')
        setAttr(radios[r], 'role', 'radio'); setAttr(radios[r], 'aria-checked', String(on)); if (on) stop = radios[r] }
      if (!stop) stop = radios.filter(function (x) { return x === document.activeElement })[0] || radios[0]
      for (var r2 = 0; r2 < radios.length; r2++) setAttr(radios[r2], 'tabindex', radios[r2] === stop ? '0' : '-1') }
    // Unlabelled form controls (Quick Navigation <select>, etc.): use the row title.
    var ctl = w.querySelectorAll('select:not([aria-label]), input:not([type=hidden]):not([aria-label])')
    for (var n2 = 0; n2 < ctl.length; n2++) { var el = ctl[n2]; if (el.labels && el.labels.length) continue; var tl = rowTitle(el); if (tl) el.setAttribute('aria-label', tl) }
    // B23: the statement links are links to this site's statement page, not dialog openers.
    var st = document.querySelectorAll('nagishli [data-nagishli-overlay="accessibility_statement"]')
    for (var s = 0; s < st.length; s++) { setAttr(st[s], 'role', 'link'); if (st[s].hasAttribute('aria-haspopup')) st[s].removeAttribute('aria-haspopup') }
  }
  // B23: intercept the vendor's "Accessibility Statement" (panel footer + Info & Settings tab) before its own handlers.
  function stmt(e) {
    var el = e.target && e.target.closest && e.target.closest('nagishli [data-nagishli-overlay="accessibility_statement"]'); if (!el) return
    if (e.type !== 'click' && e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return
    e.preventDefault(); e.stopImmediatePropagation(); if (e.type !== 'keyup') location.href = statementUrl()
  }
  document.addEventListener('click', stmt, true); document.addEventListener('keydown', stmt, true); document.addEventListener('keyup', stmt, true)
  // B24: remember which control opened a vendor dialog, and hand focus back to it when the dialog closes.
  var opener = null
  document.addEventListener('click', function (e) { var o = e.target && e.target.closest && e.target.closest('nagishli [data-nagishli-overlay]'); if (o) opener = o }, true)
  document.addEventListener('keydown', function (e) { var o = e.target && e.target.closest && e.target.closest('nagishli [data-nagishli-overlay]'); if (o && (e.key === 'Enter' || e.key === ' ')) opener = o }, true)
  function backToOpener() { setTimeout(function () { var f = opener && document.contains(opener) && !opener.closest('[inert]') ? opener : (isOpen() ? q('NagishLiCloseBtn') : trig()); if (f) f.focus() }, 0) }
  document.addEventListener('click', function (e) { if (e.target && e.target.closest && e.target.closest('#NagishLiOverlay .nagishli-overlay-content-close')) backToOpener() })
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return
    if (overlayOpen()) { // B24: a vendor dialog is open on top of the panel: close only the dialog
      var oc = document.querySelector('#NagishLiOverlay .nagishli-overlay-content-close'); if (!oc) return
      e.preventDefault(); e.stopPropagation(); oc.click(); backToOpener(); return }
    if (!isOpen()) return
    var c = q('NagishLiCloseBtn'); if (!c) return
    e.preventDefault(); e.stopPropagation(); c.click()
    var t = document.querySelector('#NagishLiTrigger .nagishli-trigger-icon'); if (t) t.focus()
  }, true)
  // B22 contrast: the vendor gives inactive option labels a transparent 4-way text-shadow "stroke", which makes
  // contrast checkers measure the shadow against a guessed background. Drop it except on enabled options (white text
  // with a real black stroke), and use the kidsit brand ink #26265E for the label text (13.8:1 on the white panel).
  ;(function () { var st = document.createElement('style'); st.setAttribute('data-nagishli-patch', '')
    st.textContent = '#NagishLiWidget .nagishli-item-title:not(.nagishli-option-enabled *){text-shadow:none!important;color:#26265E!important}' +
      // L7: the vendor footer shows a microphone icon for voice commands, a feature this beta doesn't have (marked N/A).
      '#NagishLiVoiceCommands{display:none!important}'
    document.head.appendChild(st) })()
  var n = 0, iv = setInterval(function () { fix(); if (q('NagishLiCloseBtn') && ++n > 20) clearInterval(iv) }, 250)
  new MutationObserver(function () { fix() }).observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['class', 'aria-label', 'href', 'data-text-color', 'data-background-color'], childList: true })
})()
