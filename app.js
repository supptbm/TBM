/* ==========================================================================
   TBM Maintenance — app logic
   1. Bilingual engine (AR default, RTL) — no localStorage, state in memory + URL hash
   2. FAQ accordion (keyboard accessible)
   3. Quote form validation + success state + WhatsApp fallback
   4. Contact links built from SITE_CONFIG
   5. Mobile nav + scroll reveal
   ========================================================================== */
(function () {
  'use strict';

  var CFG = window.SITE_CONFIG;
  var DICT = window.SITE_I18N;
  var FAQ = window.SITE_FAQ;
  var html = document.documentElement;

  /* in-memory language state (sandboxed previews block localStorage) */
  var lang = 'ar';

  /* ---------------------------------------------------------------- utils */
  function t(key) {
    var table = DICT[lang] || {};
    return table[key] !== undefined ? table[key] : (DICT.en[key] || '');
  }

  function digits(str) {
    return (str || '').replace(/[^\d+]/g, '');
  }

  /* -------------------------------------------------- contact link wiring */
  function wireContacts(extraText) {
    var telHref = 'tel:' + digits(CFG.contact.phoneDial);
    document.querySelectorAll('[data-tel-link]').forEach(function (el) {
      el.setAttribute('href', telHref);
    });
    var msg =
      extraText ||
      (lang === 'ar'
        ? 'السلام عليكم، محتاج خدمة صيانة من ' + CFG.brand.ar.full + '.'
        : 'Hello, I would like to request a maintenance service from ' + CFG.brand.en.full + '.');
    var waHref = 'https://wa.me/' + CFG.contact.whatsappNumber + '?text=' + encodeURIComponent(msg);
    document.querySelectorAll('[data-wa-link]').forEach(function (el) {
      el.setAttribute('href', waHref);
    });
    document.querySelectorAll('a[href^="mailto:"]').forEach(function (el) {
      el.setAttribute('href', 'mailto:' + CFG.contact.email);
      if (el.textContent.indexOf('@') > -1) el.textContent = CFG.contact.email;
    });
  }

  function wirePhoneText() {
    document.querySelectorAll('a[data-tel-link][dir="ltr"], a[data-wa-link][dir="ltr"]').forEach(function (el) {
      el.textContent = CFG.contact.phoneDisplay;
    });
  }

  /* ------------------------------------------------------------ FAQ build */
  function buildFaq() {
    var list = document.getElementById('faq-list');
    if (!list) return;
    list.innerHTML = '';
    (FAQ[lang] || []).forEach(function (item, i) {
      var wrap = document.createElement('div');
      wrap.className = 'faq__item';

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'faq__q';
      btn.id = 'faq-q-' + i;
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-controls', 'faq-a-' + i);
      btn.innerHTML =
        '<span>' +
        item.q.replace(/&/g, '&amp;').replace(/</g, '&lt;') +
        '</span><svg class="faq__sign" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';

      var panel = document.createElement('div');
      panel.className = 'faq__a';
      panel.id = 'faq-a-' + i;
      panel.setAttribute('role', 'region');
      panel.setAttribute('aria-labelledby', btn.id);
      var inner = document.createElement('div');
      var p = document.createElement('p');
      p.textContent = item.a;
      inner.appendChild(p);
      panel.appendChild(inner);

      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        list.querySelectorAll('.faq__item').forEach(function (it) {
          it.classList.remove('is-open');
          it.querySelector('.faq__q').setAttribute('aria-expanded', 'false');
        });
        if (!open) {
          wrap.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });

      wrap.appendChild(btn);
      wrap.appendChild(panel);
      list.appendChild(wrap);
    });
  }

  /* --------------------------------------------------------- apply i18n */
  function applyLang(next, updateHash) {
    lang = next === 'en' ? 'en' : 'ar';
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.title = t('html.title');

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var val = t(el.getAttribute('data-i18n'));
      if (val) el.textContent = val;
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach(function (el) {
      var val = t(el.getAttribute('data-i18n-aria-label'));
      if (val) el.setAttribute('aria-label', val);
    });
    document.querySelectorAll('[data-brand-name]').forEach(function (el) {
      el.textContent = CFG.brand[lang].short;
    });
    document.querySelectorAll('.brand').forEach(function (el) {
      el.setAttribute('aria-label', CFG.brand[lang].full);
    });
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });

    document.querySelectorAll('.lang__btn').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang));
    });

    buildFaq();
    wireContacts();
    wirePhoneText();
    clearErrors();

    if (updateHash) {
      var newHash = '#' + lang;
      if (location.hash !== newHash) history.replaceState(null, '', newHash);
    }
  }

  /* ------------------------------------------------------------ mobile nav */
  var nav = document.getElementById('primary-nav');
  var navToggle = document.getElementById('nav-toggle');
  function closeNav() {
    nav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
  navToggle.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', closeNav);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNav();
  });

  /* ------------------------------------------------------------ lang buttons */
  document.querySelectorAll('.lang__btn').forEach(function (b) {
    b.addEventListener('click', function () {
      applyLang(b.getAttribute('data-lang'), true);
      closeNav();
    });
  });

  /* ------------------------------------------------------------ form logic */
  var form = document.getElementById('quote-form');
  var success = document.getElementById('form-success');
  var waSend = document.getElementById('wa-send');
  var resetBtn = document.getElementById('form-reset');

  function setError(name, key) {
    var box = form.querySelector('[data-error-for="' + name + '"]');
    var input = form.elements[name];
    if (box) box.textContent = key ? t(key) : '';
    if (input) {
      if (key) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    }
  }

  function clearErrors() {
    if (!form) return;
    ['name', 'phone', 'email', 'service', 'area'].forEach(function (n) {
      setError(n, null);
    });
  }

  function validate() {
    var ok = true;
    var f = form.elements;
    var name = f.name.value.trim();
    var phone = digits(f.phone.value);
    var email = f.email.value.trim();

    if (name.length < 3) { setError('name', 'err.name'); ok = false; } else setError('name', null);

    // Accept 01xxxxxxxxx, +201xxxxxxxxx, 00201xxxxxxxxx, 201xxxxxxxxx
    var local = phone.replace(/^\+/, '').replace(/^00/, '').replace(/^20/, '').replace(/^0/, '');
    if (!/^1[0125]\d{8}$/.test(local)) { setError('phone', 'err.phone'); ok = false; }
    else setError('phone', null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setError('email', 'err.email'); ok = false; }
    else setError('email', null);

    if (!f.service.value) { setError('service', 'err.service'); ok = false; } else setError('service', null);
    if (!f.area.value) { setError('area', 'err.area'); ok = false; } else setError('area', null);

    return ok;
  }

  function labelOf(select) {
    var opt = select.options[select.selectedIndex];
    return opt ? opt.textContent.trim() : '';
  }

  function buildWaMessage() {
    var f = form.elements;
    var L = lang === 'ar'
      ? { h: 'طلب عرض سعر — ' + CFG.brand.ar.full, n: 'الاسم', p: 'الهاتف', e: 'البريد', s: 'الخدمة', a: 'المنطقة', m: 'التفاصيل' }
      : { h: 'Quote request — ' + CFG.brand.en.full, n: 'Name', p: 'Phone', e: 'Email', s: 'Service', a: 'Area', m: 'Details' };
    var lines = [
      L.h,
      L.n + ': ' + f.name.value.trim(),
      L.p + ': ' + f.phone.value.trim(),
      L.e + ': ' + f.email.value.trim(),
      L.s + ': ' + labelOf(f.service),
      L.a + ': ' + labelOf(f.area),
    ];
    var msg = f.message.value.trim();
    if (msg) lines.push(L.m + ': ' + msg);
    return lines.join('\n');
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) {
        var firstBad = form.querySelector('[aria-invalid="true"]');
        if (firstBad) firstBad.focus();
        return;
      }
      waSend.setAttribute(
        'href',
        'https://wa.me/' + CFG.contact.whatsappNumber + '?text=' + encodeURIComponent(buildWaMessage())
      );
      success.hidden = false;
      success.querySelector('h3').setAttribute('tabindex', '-1');
      success.querySelector('h3').focus();
    });

    form.addEventListener('input', function (e) {
      var n = e.target.name;
      if (n && form.querySelector('[data-error-for="' + n + '"]')) setError(n, null);
    });

    resetBtn.addEventListener('click', function () {
      form.reset();
      clearErrors();
      success.hidden = true;
      form.elements.name.focus();
    });
  }

  /* --------------------------------------------------------- scroll reveal */
  var revealTargets = document.querySelectorAll(
    '.section__head, .svc, .why, .step, .plan, .sector-grid li, .tst, .faq, .form, .quote__aside'
  );
  if ('IntersectionObserver' in window) {
    revealTargets.forEach(function (el) { el.classList.add('reveal'); });
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );
    revealTargets.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------ blueprint */
  document.querySelectorAll('#services, #process, .hero').forEach(function (el) {
    el.classList.add('blueprint');
  });

  /* ---------------------------------------------------------------- boot */
  window.addEventListener('hashchange', function () {
    var h = (location.hash || '').replace('#', '').toLowerCase();
    if (h === 'en' || h === 'ar') applyLang(h, false);
  });

  var initial = (location.hash || '').replace('#', '').toLowerCase();
  applyLang(initial === 'en' ? 'en' : 'ar', false);
})();
