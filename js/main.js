// =====================================================
// AL QURANUL ACADEMY — shared site behavior
// =====================================================

document.addEventListener('DOMContentLoaded', function () {

  /* ---- Meta Pixel helper (safe no-op if pixel is blocked/missing) ---- */
  function trackFBEvent(eventName, params) {
    if (typeof fbq === 'function') {
      fbq('track', eventName, params || {});
    }
  }

  /* ---- ViewContent: fire automatically on key content pages ---- */
  var currentPage = document.body.getAttribute('data-page');
  var viewContentPages = ['courses', 'course-detail', 'teachers'];
  if (viewContentPages.indexOf(currentPage) !== -1) {
    trackFBEvent('ViewContent', { content_name: currentPage });
  }

  /* ---- Contact: fire on any element tagged data-fb-event="Contact" ---- */
  document.querySelectorAll('[data-fb-event]').forEach(function (el) {
    el.addEventListener('click', function () {
      trackFBEvent(el.getAttribute('data-fb-event'));
    });
  });

  /* ---- Active nav link highlighting ---- */
  var page = document.body.getAttribute('data-nav-active') || document.body.getAttribute('data-page');
  if (page) {
    document.querySelectorAll('a[data-nav]').forEach(function (link) {
      if (link.getAttribute('data-nav') === page) {
        link.classList.add('active');
      }
    });
  }

  /* ---- Mobile menu toggle ---- */
  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      document.body.classList.toggle('nav-open');
    });
    document.querySelectorAll('.mobile-panel a').forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('nav-open');
      });
    });
  }

  /* ---- Accordion (FAQ) ---- */
  document.querySelectorAll('.accordion-item').forEach(function (item) {
    var head = item.querySelector('.accordion-head');
    var body = item.querySelector('.accordion-body');
    if (!head || !body) return;
    head.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');
      // close siblings within same accordion group
      var group = item.closest('.accordion');
      if (group) {
        group.querySelectorAll('.accordion-item.open').forEach(function (other) {
          if (other !== item) {
            other.classList.remove('open');
            other.querySelector('.accordion-body').style.maxHeight = null;
          }
        });
      }
      if (isOpen) {
        item.classList.remove('open');
        body.style.maxHeight = null;
      } else {
        item.classList.add('open');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });

  /* ---- Testimonial slider ---- */
  var slider = document.querySelector('.t-slider');
  if (slider) {
    var track = slider.querySelector('.t-slides');
    var slides = slider.querySelectorAll('.t-slide');
    var dots = slider.querySelectorAll('.t-dot');
    var idx = 0;
    function go(i) {
      idx = (i + slides.length) % slides.length;
      track.style.transform = 'translateX(-' + (idx * 100) + '%)';
      dots.forEach(function (d, di) { d.classList.toggle('active', di === idx); });
    }
    dots.forEach(function (d, di) {
      d.addEventListener('click', function () { go(di); });
    });
    var auto = setInterval(function () { go(idx + 1); }, 5500);
    slider.addEventListener('mouseenter', function () { clearInterval(auto); });
    go(0);
  }

  /* ---- Reveal on scroll ---- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---- Generic form "submit" handling (static demo — used by Admission/Contact) ---- */
  document.querySelectorAll('form[data-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var successBox = form.parentElement.querySelector('.form-success') ||
                        form.querySelector('.form-success');
      if (successBox) {
        successBox.classList.add('show');
        successBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      // Fire the relevant Meta Pixel event for this form's page
      if (currentPage === 'admission') {
        trackFBEvent('Lead');
      } else if (currentPage === 'contact') {
        trackFBEvent('Contact');
      }
      form.reset();
    });
  });

  /* ---- Free Trial form: live submission via Google Apps Script Web App ---- */
  var freeTrialForm = document.getElementById('free-trial-form');
  if (freeTrialForm) {
    var ftSubmitBtn = freeTrialForm.querySelector('button[type="submit"]');
    var ftStatusBox = document.getElementById('free-trial-status');
    var ftOriginalBtnText = ftSubmitBtn ? ftSubmitBtn.textContent : 'Book Free Trial';
    var ftSubmitting = false;
    var ftLoadingTimer = null;

    function ftSetStatus(type, message) {
      if (!ftStatusBox) return;
      ftStatusBox.textContent = message;
      ftStatusBox.classList.add('show');
      if (type === 'error') {
        ftStatusBox.style.background = '#FBEAEA';
        ftStatusBox.style.borderColor = '#D9534F';
        ftStatusBox.style.borderStyle = 'dashed';
        ftStatusBox.style.color = '#9B2C2C';
      } else {
        ftStatusBox.style.background = '';
        ftStatusBox.style.borderColor = '';
        ftStatusBox.style.borderStyle = '';
        ftStatusBox.style.color = '';
      }
      ftStatusBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Simple animated "Sending." / "Sending.." / "Sending..." loading indicator —
    // pure JS, no new CSS, so the visual design stays untouched.
    function ftSetLoading(isLoading) {
      if (!ftSubmitBtn) return;
      ftSubmitBtn.disabled = isLoading;
      ftSubmitBtn.style.opacity = isLoading ? '0.7' : '';
      ftSubmitBtn.style.cursor = isLoading ? 'not-allowed' : '';
      if (isLoading) {
        var dotCount = 0;
        ftSubmitBtn.textContent = 'Sending';
        ftLoadingTimer = setInterval(function () {
          dotCount = (dotCount + 1) % 4;
          ftSubmitBtn.textContent = 'Sending' + '.'.repeat(dotCount);
        }, 400);
      } else {
        if (ftLoadingTimer) { clearInterval(ftLoadingTimer); ftLoadingTimer = null; }
        ftSubmitBtn.textContent = ftOriginalBtnText;
      }
    }

    var DEFAULT_SUCCESS_MSG = 'Thank you! Your free trial request has been received — our team will confirm your class time shortly by WhatsApp or email.';
    var DEFAULT_ERROR_MSG = 'Sorry, something went wrong sending your request. Please try again, or reach us directly on WhatsApp / email.';

    freeTrialForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      // Prevent duplicate submissions while a request is already in flight
      if (ftSubmitting) return;

      // Native validation (required fields, email format, phone pattern, etc.)
      if (!freeTrialForm.checkValidity()) {
        freeTrialForm.reportValidity();
        return;
      }

      // Honeypot check — if this hidden field got filled in, it's almost certainly a bot.
      // Quietly pretend success without sending anything.
      var honey = freeTrialForm.querySelector('input[name="_honey"]');
      if (honey && honey.value) {
        freeTrialForm.reset();
        ftSetStatus('success', DEFAULT_SUCCESS_MSG);
        return;
      }

      ftSubmitting = true;
      ftSetLoading(true);
      if (ftStatusBox) ftStatusBox.classList.remove('show');

      var endpoint = freeTrialForm.getAttribute('data-endpoint');
      var formData = new FormData(freeTrialForm);
      var payload = {};
      formData.forEach(function (value, key) { payload[key] = value; });

      try {
        // NOTE on headers: 'Accept' is safe to set — it's on the CORS
        // "safelisted" header list, so it never triggers a preflight.
        // We deliberately do NOT set 'Content-Type': 'application/json'.
        // Google Apps Script Web Apps don't implement a doOptions()
        // handler, so a real preflight (which a custom Content-Type
        // triggers) gets no CORS response and the browser blocks the
        // whole request — that shows up as a generic "Failed to fetch"
        // network error, not anything Apps Script even sees. Leaving the
        // body as a plain JSON string (default request content type)
        // keeps this a "simple request" that skips preflight entirely;
        // Code.gs still reads it fine via JSON.parse(e.postData.contents).
        var response = await fetch(endpoint, {
          method: 'POST',
          redirect: 'follow',
          headers: { 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error('Server responded with status ' + response.status);
        }

        var result;
        try {
          result = await response.json();
        } catch (parseErr) {
          throw new Error('Received an unreadable response from the server.');
        }

        if (result && result.success === true) {
          freeTrialForm.reset();
          ftSetStatus('success', result.message || DEFAULT_SUCCESS_MSG);
          trackFBEvent('CompleteRegistration', { content_name: 'Free Trial Booking' });

          // Also save to Firebase Realtime Database for the Admin Dashboard.
          // This is purely supplementary — Google Sheets + Gmail (above) is
          // the system of record and has already succeeded at this point,
          // so a Firebase hiccup here must never surface as an error to
          // the visitor or change the message they see.
          if (window.firebaseDB && window.fb) {
            try {
              window.fb.push(window.fb.ref(window.firebaseDB, 'bookings'), {
                bookingId: result.bookingId || '',
                student_name: payload.student_name || '',
                age: payload.age || '',
                country: payload.country || '',
                whatsapp_number: payload.whatsapp_number || '',
                email: payload.email || '',
                teacher_preference: payload.teacher_preference || 'No preference',
                preferred_class_time: payload.preferred_class_time || '',
                message: payload.message || '',
                status: 'Pending',
                read: false,
                createdAt: Date.now(),
                source: 'free-trial-form'
              }).catch(function () { /* supplementary write only — never surfaced to the visitor */ });
            } catch (fbErr) {
              // Silently ignored — see comment above.
            }
          }
        } else if (result && result.success === false) {
          // Show the real reason Apps Script rejected the submission
          // (e.g. a validation message) instead of a generic error.
          ftSetStatus('error', result.error || result.message || DEFAULT_ERROR_MSG);
        } else {
          // Response didn't match the expected { success: true|false, ... } shape
          throw new Error('Unexpected response format from the server.');
        }
      } catch (err) {
        ftSetStatus('error', DEFAULT_ERROR_MSG);
      } finally {
        ftSubmitting = false;
        ftSetLoading(false);
      }
    });
  }

  /* ---- Course / blog detail template population ---- */
  var params = new URLSearchParams(window.location.search);

  if (document.body.getAttribute('data-page') === 'course-detail') {
    var slug = params.get('course') || 'noorani-qaida';
    var c = COURSES[slug] || COURSES['noorani-qaida'];
    fillCourse(c);
  }

  if (document.body.getAttribute('data-page') === 'blog-post') {
    var bslug = params.get('post') || Object.keys(BLOG_POSTS)[0];
    var post = BLOG_POSTS[bslug] || BLOG_POSTS[Object.keys(BLOG_POSTS)[0]];
    fillPost(post);
  }

  /* ---- Contact form: live submission via the SAME Google Apps Script Web
     App used by the Free Trial form (Code.gs routes on the hidden
     form_type field). Mirrors the Free Trial handler's pattern exactly —
     same honeypot check, same loading-dots button state, same
     fetch/JSON/success-error handling — so behavior stays consistent
     across both forms without touching the Free Trial code above. ---- */
  var contactForm = document.getElementById('contact-form');
  if (contactForm) {
    var ctSubmitBtn = contactForm.querySelector('button[type="submit"]');
    var ctStatusBox = document.getElementById('contact-status');
    var ctOriginalBtnText = ctSubmitBtn ? ctSubmitBtn.textContent : 'Send Message';
    var ctSubmitting = false;
    var ctLoadingTimer = null;

    // Best-effort metadata, captured once up front so it never adds delay
    // to the actual submit — falls back to empty values if unavailable.
    var ctBrowserField = document.getElementById('contact-browser-field');
    if (ctBrowserField) { ctBrowserField.value = navigator.userAgent || ''; }
    var ctIpField = document.getElementById('contact-ip-field');
    if (ctIpField && typeof fetch === 'function') {
      fetch('https://api.ipify.org?format=json')
        .then(function (res) { return res.json(); })
        .then(function (data) { if (data && data.ip) { ctIpField.value = data.ip; } })
        .catch(function () { /* IP is optional — silently skip on failure */ });
    }

    var CT_DEFAULT_SUCCESS_MSG = 'Thank you for reaching out! We typically reply within 24 hours by email or WhatsApp.';
    var CT_DEFAULT_ERROR_MSG = 'Sorry, something went wrong sending your message. Please try again, or reach us directly on WhatsApp / email.';

    function ctSetStatus(type, message) {
      if (!ctStatusBox) return;
      ctStatusBox.textContent = message;
      ctStatusBox.classList.add('show');
      if (type === 'error') {
        ctStatusBox.style.background = '#FBEAEA';
        ctStatusBox.style.borderColor = '#D9534F';
        ctStatusBox.style.borderStyle = 'dashed';
        ctStatusBox.style.color = '#9B2C2C';
      } else {
        ctStatusBox.style.background = '';
        ctStatusBox.style.borderColor = '';
        ctStatusBox.style.borderStyle = '';
        ctStatusBox.style.color = '';
      }
      ctStatusBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function ctSetLoading(isLoading) {
      if (!ctSubmitBtn) return;
      ctSubmitBtn.disabled = isLoading;
      ctSubmitBtn.style.opacity = isLoading ? '0.7' : '';
      ctSubmitBtn.style.cursor = isLoading ? 'not-allowed' : '';
      if (isLoading) {
        var dotCount = 0;
        ctSubmitBtn.textContent = 'Sending';
        ctLoadingTimer = setInterval(function () {
          dotCount = (dotCount + 1) % 4;
          ctSubmitBtn.textContent = 'Sending' + '.'.repeat(dotCount);
        }, 400);
      } else {
        if (ctLoadingTimer) { clearInterval(ctLoadingTimer); ctLoadingTimer = null; }
        ctSubmitBtn.textContent = ctOriginalBtnText;
      }
    }

    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      // Prevent duplicate submissions while a request is already in flight
      if (ctSubmitting) return;

      // Native validation (required fields, email format, etc.)
      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }

      // Honeypot check — if this hidden field got filled in, it's almost
      // certainly a bot. Quietly pretend success without sending anything.
      var ctHoney = contactForm.querySelector('input[name="_honey"]');
      if (ctHoney && ctHoney.value) {
        contactForm.reset();
        ctSetStatus('success', CT_DEFAULT_SUCCESS_MSG);
        return;
      }

      ctSubmitting = true;
      ctSetLoading(true);
      if (ctStatusBox) ctStatusBox.classList.remove('show');

      var ctEndpoint = contactForm.getAttribute('data-endpoint');
      var ctFormData = new FormData(contactForm);
      var ctPayload = {};
      ctFormData.forEach(function (value, key) { ctPayload[key] = value; });

      try {
        // Same CORS-safe request shape as the Free Trial form: no custom
        // Content-Type header (Apps Script Web Apps have no doOptions()
        // handler, so a real preflight would be blocked by the browser).
        var ctResponse = await fetch(ctEndpoint, {
          method: 'POST',
          redirect: 'follow',
          headers: { 'Accept': 'application/json' },
          body: JSON.stringify(ctPayload)
        });

        if (!ctResponse.ok) {
          throw new Error('Server responded with status ' + ctResponse.status);
        }

        var ctResult;
        try {
          ctResult = await ctResponse.json();
        } catch (parseErr) {
          throw new Error('Received an unreadable response from the server.');
        }

        if (ctResult && ctResult.success === true) {
          contactForm.reset();
          ctSetStatus('success', ctResult.message || CT_DEFAULT_SUCCESS_MSG);
          trackFBEvent('Contact');

          // Also save to Firebase Realtime Database for the Admin Dashboard
          // (Contact Messages panel) — mirrors the Free Trial dual-write
          // above exactly. Purely supplementary: Apps Script (Sheets+Gmail)
          // has already succeeded at this point, so a Firebase hiccup here
          // must never surface as an error to the visitor.
          if (window.firebaseDB && window.fb) {
            try {
              window.fb.push(window.fb.ref(window.firebaseDB, 'contactMessages'), {
                name: ctPayload.name || '',
                email: ctPayload.email || '',
                subject: ctPayload.subject || '',
                message: ctPayload.message || '',
                read: false,
                createdAt: Date.now(),
                source: 'contact-form'
              }).catch(function () { /* supplementary write only — never surfaced to the visitor */ });
            } catch (fbErr) {
              // Silently ignored — see comment above.
            }
          }
        } else if (ctResult && ctResult.success === false) {
          ctSetStatus('error', ctResult.error || ctResult.message || CT_DEFAULT_ERROR_MSG);
        } else {
          throw new Error('Unexpected response format from the server.');
        }
      } catch (err) {
        ctSetStatus('error', CT_DEFAULT_ERROR_MSG);
      } finally {
        ctSubmitting = false;
        ctSetLoading(false);
      }
    });
  }

  /* ---- Admission form: live submission via the SAME Google Apps Script
     Web App used by Free Trial / Contact (Code.gs routes on
     form_type === 'admission'). Mirrors the Free Trial handler exactly,
     plus: gender field, and a photo rule — photo is REQUIRED, except
     for female students aged 12+, for whom it is optional. The photo
     is compressed in-browser to ~256px JPEG (~20KB data URL) before
     sending, so it fits a Firebase record and an Apps Script payload,
     and it is used ONLY for this student's own ID card. ---- */
  var admissionForm = document.getElementById('admission-form');
  if (admissionForm) {
    var adSubmitBtn = admissionForm.querySelector('button[type="submit"]');
    var adStatusBox = document.getElementById('admission-status');
    var adPhotoInput = document.getElementById('admission-photo');
    var adPhotoPreview = document.getElementById('admission-photo-preview');
    var adOriginalBtnText = adSubmitBtn ? adSubmitBtn.textContent : 'Submit Application';
    var adSubmitting = false;
    var adLoadingTimer = null;
    var adPhotoDataUrl = '';

    function adSetStatus(type, message) {
      if (!adStatusBox) return;
      adStatusBox.textContent = message;
      adStatusBox.style.display = 'block';
      if (type === 'error') {
        adStatusBox.style.background = '#FBEAEA';
        adStatusBox.style.borderColor = '#D9534F';
        adStatusBox.style.borderStyle = 'dashed';
        adStatusBox.style.color = '#9B2C2C';
      } else {
        adStatusBox.style.background = '';
        adStatusBox.style.borderColor = '#0B6B3A';
        adStatusBox.style.borderStyle = 'solid';
        adStatusBox.style.color = '';
      }
      adStatusBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function adSetLoading(isLoading) {
      if (!adSubmitBtn) return;
      adSubmitBtn.disabled = isLoading;
      adSubmitBtn.style.opacity = isLoading ? '0.7' : '';
      adSubmitBtn.style.cursor = isLoading ? 'not-allowed' : '';
      if (isLoading) {
        var dotCount = 0;
        adSubmitBtn.textContent = 'Sending';
        adLoadingTimer = setInterval(function () {
          dotCount = (dotCount + 1) % 4;
          adSubmitBtn.textContent = 'Sending' + '.'.repeat(dotCount);
        }, 400);
      } else {
        if (adLoadingTimer) { clearInterval(adLoadingTimer); adLoadingTimer = null; }
        adSubmitBtn.textContent = adOriginalBtnText;
      }
    }

    function adPhotoRequired() {
      var gender = document.getElementById('admission-gender');
      var ageEl = document.getElementById('admission-age');
      var age = parseInt(ageEl ? ageEl.value : '', 10);
      // Exemption only: female AND age 12 or above. Everyone else: required.
      if (gender && gender.value === 'Female' && !isNaN(age) && age >= 12) return false;
      return true;
    }

    function adCompressPhoto(file) {
      return new Promise(function (resolve, reject) {
        var img = new Image();
        var url = URL.createObjectURL(file);
        img.onload = function () {
          try {
            var max = 256;
            var scale = Math.min(1, max / Math.max(img.width, img.height));
            var w = Math.max(1, Math.round(img.width * scale));
            var h = Math.max(1, Math.round(img.height * scale));
            var canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL('image/jpeg', 0.82));
          } catch (e) { URL.revokeObjectURL(url); reject(e); }
        };
        img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not read photo.')); };
        img.src = url;
      });
    }

    if (adPhotoInput) {
      adPhotoInput.addEventListener('change', function () {
        var f = adPhotoInput.files && adPhotoInput.files[0];
        if (!f) { adPhotoDataUrl = ''; if (adPhotoPreview) adPhotoPreview.style.display = 'none'; return; }
        adCompressPhoto(f).then(function (dataUrl) {
          adPhotoDataUrl = dataUrl;
          if (adPhotoPreview) { adPhotoPreview.src = dataUrl; adPhotoPreview.style.display = 'block'; }
        }).catch(function () { adPhotoDataUrl = ''; });
      });
    }

    var AD_DEFAULT_SUCCESS_MSG = 'Thank you! Your application has been received, and our team will contact you within 24 hours to confirm enrolment.';
    var AD_DEFAULT_ERROR_MSG = 'Sorry, something went wrong sending your application. Please try again, or reach us directly on WhatsApp / email.';

    admissionForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (adSubmitting) return;
      if (!admissionForm.checkValidity()) { admissionForm.reportValidity(); return; }
      var honey = admissionForm.querySelector('input[name="_honey"]');
      if (honey && honey.value) { admissionForm.reset(); adSetStatus('success', AD_DEFAULT_SUCCESS_MSG); return; }
      // Photo rule, enforced in-browser (Apps Script enforces it again server-side).
      if (adPhotoRequired() && !adPhotoDataUrl && !(adPhotoInput && adPhotoInput.files && adPhotoInput.files[0])) {
        adSetStatus('error', 'A student photo is required for the ID card, except for female students aged 12 and above.');
        return;
      }
      adSubmitting = true;
      adSetLoading(true);
      if (adStatusBox) adStatusBox.style.display = 'none';
      var endpoint = admissionForm.getAttribute('data-endpoint');
      var formData = new FormData(admissionForm);
      var payload = {};
      formData.forEach(function (value, key) { payload[key] = value; });
      // Photo file itself is not JSON-serialisable — send the compressed data URL instead.
      delete payload.photo;
      if (adPhotoInput && adPhotoInput.files && adPhotoInput.files[0] && !adPhotoDataUrl) {
        try { adPhotoDataUrl = await adCompressPhoto(adPhotoInput.files[0]); } catch (err) { /* fall through with no photo — server will reject if required */ }
      }
      payload.photo_data_url = adPhotoDataUrl || '';
      payload.photo_provided = adPhotoDataUrl ? 'Yes' : 'No';
      try {
        var response = await fetch(endpoint, {
          method: 'POST',
          redirect: 'follow',
          headers: { 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Server responded with status ' + response.status);
        var result;
        try { result = await response.json(); } catch (parseErr) { throw new Error('Received an unreadable response from the server.'); }
        if (result && result.success === true) {
          admissionForm.reset();
          adPhotoDataUrl = '';
          if (adPhotoPreview) adPhotoPreview.style.display = 'none';
          adSetStatus('success', result.message || AD_DEFAULT_SUCCESS_MSG);
          trackFBEvent('Lead');
          if (window.firebaseDB && window.fb) {
            try {
              window.fb.push(window.fb.ref(window.firebaseDB, 'admissions'), {
                student_name: payload.student_name || '',
                age: payload.age || '',
                gender: payload.gender || '',
                country: payload.country || '',
                guardian_name: payload.guardian_name || '',
                whatsapp_number: payload.whatsapp_number || '',
                email: payload.email || '',
                course: payload.course || '',
                teacher_preference: payload.teacher_preference || 'No preference',
                preferred_class_time: payload.preferred_class_time || '',
                message: payload.message || '',
                photo_data_url: payload.photo_data_url || '',
                photo_provided: payload.photo_provided || 'No',
                status: 'Pending',
                read: false,
                createdAt: Date.now(),
                source: 'admission-form'
              }).catch(function () { /* supplementary write only */ });
            } catch (fbErr) { /* silently ignored */ }
          }
        } else if (result && result.success === false) {
          adSetStatus('error', result.error || result.message || AD_DEFAULT_ERROR_MSG);
        } else {
          throw new Error('Unexpected response format from the server.');
        }
      } catch (err) {
        adSetStatus('error', AD_DEFAULT_ERROR_MSG);
      } finally {
        adSubmitting = false;
        adSetLoading(false);
      }
    });
  }
});

/* =====================================================
   Course data (used by courses.html + course-detail.html)
   ===================================================== */
var COURSES = {
  'noorani-qaida': {
    title: 'Noorani Qaida',
    tagline: 'The first step on the Quran journey — Arabic letters, sounds, and joining rules.',
    duration: '3–6 months',
    level: 'Beginner · Age 4+',
    icon: 'book',
    overview: 'Noorani Qaida is where every Quran learner begins. Your child (or you) will learn to recognise the Arabic alphabet, correct pronunciation (makharij) of each letter, and how letters join to form words — the essential foundation for reading the Quran fluently and correctly.',
    outcomes: [
      'Recognise and pronounce all 29 Arabic letters correctly',
      'Understand short and long vowel sounds (harakaat)',
      'Read joined letters and simple words with confidence',
      'Build the foundation needed for Nazera Quran reading'
    ],
    who: 'Children aged 4 and above, and adults who are completely new to reading Arabic script.',
    format: 'One-to-one live online classes, 2–3 sessions per week, 30 minutes per session, with a qualified male or female teacher of your choice.'
  },
  'nazera-quran': {
    title: 'Quran Reading (Nazera)',
    tagline: 'Read the full Quran fluently, word by word, page by page.',
    duration: '12–24 months',
    level: 'Beginner to Intermediate',
    icon: 'open-book',
    overview: 'Nazera Quran builds on Noorani Qaida to take students through the complete Quran, developing fluent, confident reading with correct pronunciation. Students progress page by page under close teacher supervision, with regular revision to strengthen retention.',
    outcomes: [
      'Read the Quran fluently from Surah Al-Fatiha to An-Nas',
      'Apply correct pronunciation as you read',
      'Build daily reading habits with structured revision',
      'Prepare for advanced Tajweed or Hifz study'
    ],
    who: 'Students who have completed Noorani Qaida or already read Arabic script with basic fluency.',
    format: 'One-to-one live online classes, flexible scheduling, with ongoing progress tracking shared with parents.'
  },
  'tajweed': {
    title: 'Tajweed',
    tagline: 'Master the rules that make your recitation beautiful and correct.',
    duration: '6–12 months',
    level: 'Intermediate',
    icon: 'sparkle',
    overview: 'Tajweed is the science of reciting the Quran exactly as it was revealed — correct articulation points, letter characteristics, and rules of elongation, merging, and stopping. This course refines recitation for students who can already read the Quran.',
    outcomes: [
      'Apply Makharij (articulation points) with precision',
      'Understand and apply core Tajweed rules (Noon Sakinah, Meem Sakinah, Madd, Qalqalah and more)',
      'Recite with clarity, rhythm, and correctness',
      'Prepare for Ijazah-track study where desired'
    ],
    who: 'Students who already read the Quran and wish to recite it with full correctness and beauty.',
    format: 'One-to-one live online classes with recitation practice, teacher correction, and recorded feedback.'
  },
  'hifzul-quran': {
    title: 'Hifzul Quran',
    tagline: 'Memorise the Quran with a structured, supportive revision system.',
    duration: 'Ongoing (multi-year)',
    level: 'All levels, by placement',
    icon: 'heart-book',
    overview: 'Our Hifz programme guides students through complete Quran memorisation using proven repetition and revision methods (Sabaq, Sabqi, Manzil). Teachers track each student\'s memorised portion carefully, ensuring accuracy and long-term retention rather than rushed progress.',
    outcomes: [
      'Memorise new portions (Sabaq) with correct Tajweed',
      'Retain and revise previously memorised portions (Manzil)',
      'Build a sustainable daily memorisation routine',
      'Work toward partial or complete Hifz at your own pace'
    ],
    who: 'Students who read the Quran fluently and are ready to commit to a memorisation journey, children or adults.',
    format: 'One-to-one live online classes, daily or several times weekly, with detailed progress reports for parents.'
  }
};

function fillCourse(c) {
  document.querySelectorAll('[data-c-title]').forEach(function (el) { el.textContent = c.title; });
  document.querySelectorAll('[data-c-tagline]').forEach(function (el) { el.textContent = c.tagline; });
  document.querySelectorAll('[data-c-duration]').forEach(function (el) { el.textContent = c.duration; });
  document.querySelectorAll('[data-c-level]').forEach(function (el) { el.textContent = c.level; });
  document.querySelectorAll('[data-c-overview]').forEach(function (el) { el.textContent = c.overview; });
  document.querySelectorAll('[data-c-who]').forEach(function (el) { el.textContent = c.who; });
  document.querySelectorAll('[data-c-format]').forEach(function (el) { el.textContent = c.format; });
  var outList = document.querySelector('[data-c-outcomes]');
  if (outList) {
    outList.innerHTML = '';
    var CHECK_SVG_NS = 'http://www.w3.org/2000/svg';
    c.outcomes.forEach(function (o) {
      var li = document.createElement('li');
      var svg = document.createElementNS(CHECK_SVG_NS, 'svg');
      svg.setAttribute('class', 'check');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('width', '18');
      svg.setAttribute('height', '18');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '2.5');
      var path = document.createElementNS(CHECK_SVG_NS, 'path');
      path.setAttribute('d', 'M20 6L9 17l-5-5');
      svg.appendChild(path);
      var span = document.createElement('span');
      span.textContent = o; // safe — never interpreted as HTML, even if o came from Firebase
      li.appendChild(svg);
      li.appendChild(span);
      outList.appendChild(li);
    });
  }
  document.title = c.title + ' Course — Al Quranul Academy';
}

/* =====================================================
   Blog data (used by blog.html + blog-post.html)
   ===================================================== */
var BLOG_POSTS = {
  'why-start-noorani-qaida': {
    title: 'Why Every Child Should Start With Noorani Qaida',
    category: 'Quran Learning',
    date: 'June 18, 2026',
    read: '4 min read',
    excerpt: 'A strong foundation in Arabic letters and sounds makes every stage of the Quran journey easier. Here\'s why skipping Qaida often backfires.',
    body: [
      'Many parents are eager for their child to begin "reading Quran" straight away, but rushing past the foundational stage often creates gaps that surface later — mispronounced letters, hesitant reading, and low confidence.',
      'Noorani Qaida exists precisely to prevent this. It isolates each Arabic letter and sound so a student can master pronunciation before combining letters into words. Think of it as learning individual musical notes before playing a full piece.',
      'At Al Quranul Academy, our teachers spend real time on this stage, correcting small pronunciation habits early rather than letting them become permanent. Students who complete Qaida properly move through Nazera reading noticeably faster and with far more confidence.',
      'If your child is just beginning their Quran journey, our Free Trial Class is the easiest way to see this approach in action — book a session and meet a qualified teacher today.'
    ]
  },
  'parenting-quran-routine': {
    title: 'Building a Consistent Quran Routine at Home',
    category: 'Parenting',
    date: 'June 2, 2026',
    read: '5 min read',
    excerpt: 'Consistency matters more than duration. Simple habits parents can build around their child\'s online Quran classes.',
    body: [
      'One of the most common questions we hear from parents is: "How do I keep my child motivated between classes?" The answer usually isn\'t more class time — it\'s a small, consistent daily routine.',
      'Set a fixed, short daily slot (10–15 minutes) for revision, ideally right after or before an existing habit like breakfast or bedtime. Predictability removes the daily negotiation over "when."',
      'Keep revision light and encouraging. The goal at home is reinforcement, not new teaching — that\'s what the one-to-one class is for. Celebrate small wins, like a correctly pronounced letter or a fluently read line.',
      'Stay in touch with your child\'s teacher. At Al Quranul Academy, teachers share regular progress notes so you always know exactly what to reinforce at home.'
    ]
  },
  'tajweed-common-mistakes': {
    title: '5 Common Tajweed Mistakes and How to Fix Them',
    category: 'Tajweed',
    date: 'May 20, 2026',
    read: '6 min read',
    excerpt: 'From rushed Madd letters to unclear Qalqalah — small, correctable habits that make a big difference in recitation.',
    body: [
      'Tajweed mistakes are rarely about a lack of knowledge — they\'re usually about habits formed early and never corrected. Here are five we see most often, and how a teacher helps fix them.',
      'Shortened Madd letters: elongation rules are often rushed under time pressure. Slowing down deliberately during practice, not just during recitation, retrains the habit.',
      'Unclear Qalqalah: the "bounce" on letters like Qaf and Ba needs to be distinct but not exaggerated. Recorded practice with teacher feedback is the fastest fix.',
      'Merging Noon Sakinah incorrectly: Ikhfa, Idgham, and Iqlab each require a different treatment — repetition with a teacher listening live catches this quickly.',
      'Inconsistent articulation points (Makharij): small drifts in where a letter is pronounced compound over time without correction.',
      'Reciting for speed over accuracy: our teachers deliberately slow students down in early Tajweed study — correctness always comes first.'
    ]
  },
  'hifz-memorisation-tips': {
    title: 'Practical Memorisation Tips for Hifz Students',
    category: 'Hifz',
    date: 'May 6, 2026',
    read: '5 min read',
    excerpt: 'Sabaq, Sabqi, and Manzil — how structured revision protects what you\'ve already memorised.',
    body: [
      'Memorising the Quran is as much about revision as it is about learning new verses. The traditional Sabaq–Sabqi–Manzil system exists for exactly this reason.',
      'Sabaq is your new daily portion — kept small enough to memorise with excellent accuracy rather than rushed volume.',
      'Sabqi is recent revision — the last week or so of newly memorised portions, revised until they\'re fully secure before moving to long-term revision.',
      'Manzil is long-term revision — cycling back through everything memorised so far, on a rotation, so nothing is ever left untouched for too long.',
      'Our Hifz teachers structure every session around this system and track it closely, so progress is steady, accurate, and — most importantly — permanent.'
    ]
  },
  'ramadan-quran-goals': {
    title: 'Setting Realistic Quran Goals This Ramadan',
    category: 'Ramadan',
    date: 'April 22, 2026',
    read: '4 min read',
    excerpt: 'Ramadan is a natural motivator — here\'s how to turn that motivation into a routine that lasts beyond the month.',
    body: [
      'Ramadan often sparks a burst of motivation to "finally" commit to Quran learning. The challenge is turning that spark into a habit that survives beyond the month.',
      'Start smaller than you think you need to. A realistic, sustainable daily goal — even five extra minutes of reading — beats an ambitious plan abandoned by day ten.',
      'Anchor the new habit to an existing one, such as directly after a daily prayer, so it doesn\'t rely on willpower alone.',
      'Use your one-to-one class as the checkpoint. Your teacher can help set a Ramadan goal that\'s ambitious but realistic for your current level, and help you carry it forward afterward.'
    ]
  },
  'choosing-online-academy': {
    title: 'What to Look for in an Online Quran Academy',
    category: 'Islamic Education',
    date: 'April 8, 2026',
    read: '5 min read',
    excerpt: 'Qualified teachers, one-to-one attention, and real progress tracking — the questions worth asking before you enrol.',
    body: [
      'With so many online Quran academies available, it can be difficult for parents to know what actually matters. A few questions cut through the noise quickly.',
      'Are classes truly one-to-one, or shared among several students? Individual attention is what allows a teacher to catch and correct small pronunciation habits early.',
      'Are teachers formally qualified, and can you choose a male or female teacher based on your family\'s preference?',
      'Is there a genuine free trial that lets you meet the actual teacher before committing, rather than a generic sample video?',
      'Is progress tracked and shared with parents regularly, so you always know exactly where your child stands?',
      'At Al Quranul Academy, the answer to all of the above is yes — and the best way to see it is to book a free trial class.'
    ]
  }
};

function fillPost(p) {
  document.querySelectorAll('[data-p-title]').forEach(function (el) { el.textContent = p.title; });
  document.querySelectorAll('[data-p-category]').forEach(function (el) { el.textContent = p.category; });
  document.querySelectorAll('[data-p-date]').forEach(function (el) { el.textContent = p.date; });
  document.querySelectorAll('[data-p-read]').forEach(function (el) { el.textContent = p.read; });
  var bodyEl = document.querySelector('[data-p-body]');
  if (bodyEl) {
    bodyEl.innerHTML = '';
    p.body.forEach(function (para) {
      var el = document.createElement('p');
      el.textContent = para;
      bodyEl.appendChild(el);
    });
  }
  document.title = p.title + ' — Al Quranul Academy Blog';
}
