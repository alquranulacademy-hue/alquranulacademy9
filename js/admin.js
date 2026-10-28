// =====================================================================
// AL QURANUL ACADEMY — Admin Dashboard logic
// =====================================================================
// Runs on both admin-login.html and admin-dashboard.html. Each section
// below checks for the DOM elements it needs before doing anything, so
// this one file safely covers both pages.
// =====================================================================

(function () {

  function showToast(message, isError) {
    var toast = document.getElementById('admin-toast');
    if (!toast) { return; }
    toast.textContent = message;
    toast.classList.toggle('error', !!isError);
    toast.classList.add('show');
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(function () { toast.classList.remove('show'); }, 4000);
  }

  function slugify(text) {
    return String(text || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function objectToEntries(obj) {
    // Returns [{ id, ...record }, ...] from a Firebase snapshot object
    if (!obj) return [];
    return Object.keys(obj).map(function (id) {
      var entry = obj[id] || {};
      entry.id = id;
      return entry;
    });
  }

  // ---------------------------------------------------------------------
  // Shared detail-panel building blocks — used by both openBookingDetail
  // and openMessageDetail (Bookings tab / Contact Messages tab) so this
  // markup and behavior exists in exactly one place, not duplicated per
  // panel.
  // ---------------------------------------------------------------------
  function detailIconSvg(path) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + path + '</svg>';
  }
  var DETAIL_ICONS = {
    id: detailIconSvg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h4"/><path d="M7 13h7"/>'),
    calendar: detailIconSvg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M3 10h18"/>'),
    user: detailIconSvg('<path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/>'),
    flag: detailIconSvg('<path d="M4 21V4"/><path d="M4 4h13l-2.5 4L17 12H4"/>'),
    whatsapp: detailIconSvg('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'),
    mail: detailIconSvg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'),
    book: detailIconSvg('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z"/>'),
    clock: detailIconSvg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>'),
    message: detailIconSvg('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'),
    status: detailIconSvg('<circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.3 2.3 4.7-4.8"/>'),
    subject: detailIconSvg('<path d="M4 6h16"/><path d="M4 12h10"/><path d="M4 18h7"/>')
  };

  function copyToClipboard(text, btn) {
    if (!text) return;
    var done = function () {
      if (!btn) return;
      var original = btn.innerHTML;
      btn.classList.add('copied');
      btn.innerHTML = detailIconSvg('<path d="M20 6L9 17l-5-5"/>');
      setTimeout(function () { btn.classList.remove('copied'); btn.innerHTML = original; }, 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () { showToast('Could not copy to clipboard.', true); });
    } else {
      // Fallback for browsers without the async Clipboard API
      var temp = document.createElement('textarea');
      temp.value = text;
      temp.style.position = 'fixed';
      temp.style.opacity = '0';
      document.body.appendChild(temp);
      temp.select();
      try { document.execCommand('copy'); done(); } catch (e) { showToast('Could not copy to clipboard.', true); }
      document.body.removeChild(temp);
    }
  }

  /**
   * Builds one field row (icon + label + value) for a detail panel.
   * opts:
   *   iconKey    — key into DETAIL_ICONS
   *   label      — field label text
   *   value      — field value (may be empty/undefined)
   *   copy       — if true, adds a copy-to-clipboard button next to the value
   *   linkHref   — if set, renders the value as a clickable link to this URL
   *   emptyText  — text shown when value is empty (default 'Not provided')
   */
  function buildDetailField(opts) {
    var value = opts.value;
    var isEmpty = value === undefined || value === null || value === '';
    var emptyText = opts.emptyText || 'Not provided';
    var icon = DETAIL_ICONS[opts.iconKey] || DETAIL_ICONS.status;

    var valueHtml;
    if (isEmpty) {
      valueHtml = escapeHtml(emptyText);
    } else if (opts.badgeClass) {
      valueHtml = '<span class="' + opts.badgeClass + '">' + escapeHtml(value) + '</span>';
    } else if (opts.linkHref) {
      valueHtml = '<a class="detail-link" href="' + opts.linkHref + '">' + escapeHtml(value) + '</a>';
    } else {
      valueHtml = escapeHtml(value);
    }

    var copyBtnHtml = (opts.copy && !isEmpty)
      ? '<button type="button" class="detail-copy-btn" data-copy-value="' + escapeHtml(value) + '" aria-label="Copy ' + escapeHtml(opts.label) + '" title="Copy ' + escapeHtml(opts.label) + '">' + detailIconSvg('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>') + '</button>'
      : '';

    return '' +
      '<div class="detail-field">' +
        '<div class="detail-field-icon">' + icon + '</div>' +
        '<div class="detail-field-body">' +
          '<div class="detail-field-label">' + escapeHtml(opts.label) + '</div>' +
          '<div class="detail-field-value' + (isEmpty ? ' is-empty' : '') + '">' +
            '<span class="detail-field-value-row">' + valueHtml + copyBtnHtml + '</span>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  // Wires up every [data-copy-value] button inside a freshly-rendered
  // detail panel — call this once after setting a panel's innerHTML.
  function wireCopyButtons(container) {
    container.querySelectorAll('[data-copy-value]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        copyToClipboard(btn.getAttribute('data-copy-value'), btn);
      });
    });
  }

  // Builds a rounded initial-letter avatar for a detail panel header.
  function initialsAvatarHtml(name) {
    var initial = (String(name || '?').trim().charAt(0) || '?').toUpperCase();
    return '<div class="detail-header-avatar">' + escapeHtml(initial) + '</div>';
  }

  // Builds a wa.me link from a user-typed WhatsApp number, stripping any
  // formatting characters (+, spaces, dashes, parens) — returns null if
  // nothing usable is left, so callers can fall back to plain text.
  function whatsappLinkFor(number) {
    var digits = String(number || '').replace(/[^0-9]/g, '');
    return digits ? ('https://wa.me/' + digits) : null;
  }

  function friendlyAuthError(err) {
    var code = (err && err.code) || '';
    if (code.indexOf('user-not-found') !== -1 || code.indexOf('wrong-password') !== -1 || code.indexOf('invalid-credential') !== -1) {
      return 'Incorrect email or password.';
    }
    if (code.indexOf('too-many-requests') !== -1) {
      return 'Too many attempts. Please wait a moment and try again.';
    }
    if (code.indexOf('invalid-email') !== -1) {
      return 'Please enter a valid email address.';
    }
    if (code.indexOf('network-request-failed') !== -1) {
      return 'Network error — please check your connection and try again.';
    }
    return 'Sign-in failed. Please try again.';
  }

  function firebaseNotConfigured() {
    return !window.firebaseAuth || !window.firebaseDB || !window.fb;
  }

  // =====================================================================
  // LOGIN PAGE
  // =====================================================================
  var loginForm = document.getElementById('admin-login-form');
  if (loginForm) {
    var loginErrorBox = document.getElementById('login-error');
    var loginBtn = document.getElementById('login-btn');

    function showLoginError(msg) {
      if (!loginErrorBox) return;
      loginErrorBox.textContent = msg;
      loginErrorBox.classList.add('show');
    }

    if (firebaseNotConfigured()) {
      showLoginError('Firebase is not configured yet. Add your project config in js/firebase.js, then reload this page.');
      loginForm.querySelectorAll('input, button').forEach(function (el) { el.disabled = true; });
    } else {
      // Already signed in? Skip straight to the dashboard.
      window.fb.onAuthStateChanged(window.firebaseAuth, function (user) {
        if (user) { window.location.href = 'admin-dashboard.html'; }
      });

      loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        loginErrorBox.classList.remove('show');

        var email = document.getElementById('login-email').value.trim();
        var password = document.getElementById('login-password').value;
        if (!email || !password) return;

        loginBtn.disabled = true;
        loginBtn.textContent = 'Signing in…';

        window.fb.signInWithEmailAndPassword(window.firebaseAuth, email, password)
          .then(function () {
            window.location.href = 'admin-dashboard.html';
          })
          .catch(function (err) {
            showLoginError(friendlyAuthError(err));
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign In';
          });
      });
    }
  }

  // =====================================================================
  // DASHBOARD PAGE
  // =====================================================================
  var adminBody = document.getElementById('admin-body');
  if (!adminBody) return; // Not on the dashboard page — nothing else to do.

  if (firebaseNotConfigured()) {
    adminBody.style.display = 'block';
    adminBody.innerHTML = '<div style="max-width:520px;margin:80px auto;text-align:center;padding:0 20px;">' +
      '<h2>Firebase Not Configured</h2>' +
      '<p>Add your project config in <code>js/firebase.js</code>, redeploy, and reload this page to access the dashboard.</p>' +
      '<a href="index.html" class="btn btn-outline-dark">Back to Website</a></div>';
    return;
  }

  var auth = window.firebaseAuth;
  var db = window.firebaseDB;
  var fbfns = window.fb;
  var ref = fbfns.ref, get = fbfns.get, set = fbfns.set, push = fbfns.push,
      update = fbfns.update, remove = fbfns.remove, onValue = fbfns.onValue;

  // ---- Auth guard ----
  fbfns.onAuthStateChanged(auth, function (user) {
    if (!user) {
      window.location.href = 'admin-login.html';
      return;
    }
    document.getElementById('admin-user-email').textContent = user.email || 'Admin';
    adminBody.style.display = 'block';
    initDashboard();
  });

  var logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      fbfns.signOut(auth).then(function () { window.location.href = 'admin-login.html'; });
    });
  }

  var dashboardInitialized = false;
  function initDashboard() {
    if (dashboardInitialized) return; // onAuthStateChanged can fire more than once
    dashboardInitialized = true;

    initTabs();
    initBookings();
    initContactMessages();
    initAdmissions();
    initCourses();
    initBlog();
    initNotices();
    initOverlayClosers();
    initNotifications();
  }

  // ---------------------------------------------------------------------
  // Tabs
  // ---------------------------------------------------------------------
  function initTabs() {
    document.querySelectorAll('.admin-tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.admin-tab-btn').forEach(function (b) { b.classList.remove('active'); });
        document.querySelectorAll('.admin-panel').forEach(function (p) { p.classList.remove('active'); });
        btn.classList.add('active');
        document.getElementById('panel-' + btn.getAttribute('data-tab')).classList.add('active');
        // Mobile menu drawer: picking a section closes the drawer.
        document.body.classList.remove('admin-menu-open');
      });
    });
    // Mobile menu drawer (Sir, 2026-10-26): ☰ Menu opens the side
    // drawer, backdrop tap or Escape closes it. On desktop the
    // button is hidden by CSS, so this is a no-op there.
    var menuBtn = document.getElementById('admin-menu-btn');
    var menuBackdrop = document.getElementById('admin-menu-backdrop');
    if (menuBtn) {
      menuBtn.addEventListener('click', function () {
        document.body.classList.toggle('admin-menu-open');
      });
    }
    if (menuBackdrop) {
      menuBackdrop.addEventListener('click', function () {
        document.body.classList.remove('admin-menu-open');
      });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') document.body.classList.remove('admin-menu-open');
    });
  }

  function initOverlayClosers() {
    document.querySelectorAll('[data-close]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.getElementById(btn.getAttribute('data-close')).classList.remove('show');
      });
    });
    document.querySelectorAll('.admin-form-overlay').forEach(function (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) overlay.classList.remove('show');
      });
    });
    // Keyboard accessibility: Escape closes whichever overlay is open.
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      document.querySelectorAll('.admin-form-overlay.show').forEach(function (overlay) {
        overlay.classList.remove('show');
      });
    });
    // Mobile overlay scroll lock (Sir, 2026-10-26, item 4): while ANY
    // dashboard overlay is open, the page behind must not scroll or
    // show through — the overlay is the only scrollable sheet. This
    // watches every overlay's class, so it covers detail, approve,
    // ID-card and form overlays without touching their open code.
    if (typeof MutationObserver === 'function') {
      var syncBodyLock = function () {
        document.body.style.overflow = document.querySelector('.admin-form-overlay.show') ? 'hidden' : '';
      };
      var lockObserver = new MutationObserver(syncBodyLock);
      document.querySelectorAll('.admin-form-overlay').forEach(function (overlay) {
        lockObserver.observe(overlay, { attributes: true, attributeFilter: ['class'] });
      });
    }
  }

  // ---------------------------------------------------------------------
  // BOOKINGS
  // ---------------------------------------------------------------------
  var bookingsCache = [];

  // Shared by Bookings and Contact Messages so the unread indicator is
  // built in exactly one place rather than duplicated per table.
  function unreadDotHtml(isUnread) {
    return isUnread ? '<span class="msg-unread-dot"></span>' : '';
  }

  function initBookings() {
    var tbody = document.getElementById('bookings-tbody');
    var searchInput = document.getElementById('booking-search');
    var statusFilter = document.getElementById('booking-status-filter');
    var exportBtn = document.getElementById('export-bookings-btn');

    onValue(ref(db, 'bookings'), function (snap) {
      bookingsCache = objectToEntries(snap.val());
      bookingsCache.sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
      renderBookings();
      renderNotifications(); // keep the bell's badge/list in sync with any change here
    }, function () {
      tbody.innerHTML = '<tr class="admin-empty-row"><td colspan="5">Could not load bookings. Check your connection and Firebase security rules.</td></tr>';
    });

    function renderBookings() {
      var term = (searchInput.value || '').toLowerCase().trim();
      var status = statusFilter.value;

      var rows = bookingsCache.filter(function (b) {
        if (status && b.status !== status) return false;
        if (!term) return true;
        var haystack = [b.bookingId, b.student_name, b.email, b.whatsapp_number, b.country].join(' ').toLowerCase();
        return haystack.indexOf(term) !== -1;
      });

      if (!rows.length) {
        tbody.innerHTML = '<tr class="admin-empty-row"><td colspan="5">No bookings match your search.</td></tr>';
        return;
      }

      tbody.innerHTML = rows.map(function (b) {
        var dateStr = b.createdAt ? new Date(b.createdAt).toLocaleString() : '—';
        var status = b.status || 'Pending';
        var isUnread = b.read !== true;
        return '<tr class="' + (isUnread ? 'msg-unread' : '') + '" data-booking-row="' + b.id + '">' +
          '<td class="cell-nowrap" data-label="Booking ID"><strong>' + escapeHtml(b.bookingId || '—') + '</strong></td>' +
          '<td class="cell-nowrap" data-label="Date">' + unreadDotHtml(isUnread) + escapeHtml(dateStr) + '</td>' +
          '<td data-label="Student">' + escapeHtml(b.student_name) + '</td>' +
          '<td data-label="Status"><select data-booking-id="' + b.id + '" class="booking-status-select">' +
            ['Pending', 'Contacted', 'Admitted', 'Cancelled'].map(function (s) {
              return '<option value="' + s + '"' + (s === status ? ' selected' : '') + '>' + s + '</option>';
            }).join('') +
          '</select></td>' +
          '<td data-label="Actions">' +
            '<div class="action-btns">' +
              '<button class="btn btn-outline-dark btn-sm" data-view-booking="' + b.id + '" type="button">View Details</button>' +
              '<button class="btn btn-outline-dark btn-sm" data-toggle-booking-read="' + b.id + '" type="button">' + (isUnread ? 'Mark Read' : 'Mark Unread') + '</button>' +
              '<button class="btn btn-sm btn-danger" data-delete-booking="' + b.id + '" type="button">Delete</button>' +
            '</div>' +
          '</td>' +
        '</tr>';
      }).join('');

      tbody.querySelectorAll('[data-view-booking]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          openBookingDetail(btn.getAttribute('data-view-booking'));
        });
      });

      tbody.querySelectorAll('[data-toggle-booking-read]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-toggle-booking-read');
          var booking = bookingsCache.find(function (b) { return b.id === id; });
          update(ref(db, 'bookings/' + id), { read: !(booking && booking.read === true) })
            .catch(function () { showToast('Could not update booking. Please try again.', true); });
        });
      });

      tbody.querySelectorAll('.booking-status-select').forEach(function (sel) {
        sel.addEventListener('change', function () {
          var id = sel.getAttribute('data-booking-id');
          update(ref(db, 'bookings/' + id), { status: sel.value })
            .then(function () { showToast('Booking marked as ' + sel.value + '.'); })
            .catch(function () { showToast('Could not update status. Please try again.', true); });
        });
      });

      tbody.querySelectorAll('[data-delete-booking]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-delete-booking');
          if (!confirm('Delete this booking permanently? This cannot be undone.')) return;
          remove(ref(db, 'bookings/' + id))
            .then(function () {
              // Instant removal — the onValue listener above will also
              // re-fire from Firebase, but updating the local cache and
              // re-rendering immediately means there's no visible delay
              // or page reload while waiting for that round-trip.
              bookingsCache = bookingsCache.filter(function (b) { return b.id !== id; });
              renderBookings();
              showToast('Booking deleted.');
            })
            .catch(function () { showToast('Could not delete booking. Please try again.', true); });
        });
      });
    }

    searchInput.addEventListener('input', renderBookings);
    statusFilter.addEventListener('change', renderBookings);

    exportBtn.addEventListener('click', function () {
      var term = (searchInput.value || '').toLowerCase().trim();
      var status = statusFilter.value;
      var rows = bookingsCache.filter(function (b) {
        if (status && b.status !== status) return false;
        if (!term) return true;
        var haystack = [b.bookingId, b.student_name, b.email, b.whatsapp_number, b.country].join(' ').toLowerCase();
        return haystack.indexOf(term) !== -1;
      });

      if (!rows.length) { showToast('No bookings to export.', true); return; }

      var headers = ['Booking ID', 'Date', 'Student Name', 'Age', 'Country', 'WhatsApp Number', 'Email', 'Teacher Preference', 'Preferred Class Time', 'Message', 'Status'];
      var csvRows = [headers.join(',')];
      rows.forEach(function (b) {
        var dateStr = b.createdAt ? new Date(b.createdAt).toISOString() : '';
        var line = [b.bookingId || '', dateStr, b.student_name, b.age, b.country, b.whatsapp_number, b.email, b.teacher_preference, b.preferred_class_time, b.message, b.status || 'Pending']
          .map(function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; })
          .join(',');
        csvRows.push(line);
      });

      var blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'free-trial-bookings-' + new Date().toISOString().slice(0, 10) + '.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    // "View Details" — professional profile-card layout: large header
    // (avatar + name + status badge), then every field icon-led and
    // vertically spaced, instead of a table. Email and WhatsApp are
    // clickable and have a copy button; status renders as a badge.
    function openBookingDetail(id) {
      var b = bookingsCache.find(function (x) { return x.id === id; });
      if (!b) return;
      var dateStr = b.createdAt ? new Date(b.createdAt).toLocaleString() : '—';
      var status = b.status || 'Pending';
      // M-01: badge class must never be built from a raw stored value —
      // only these four known statuses may reach a class name.
      var safeStatus = (['Pending', 'Contacted', 'Admitted', 'Cancelled'].indexOf(status) !== -1) ? status : 'Pending';
      var waLink = whatsappLinkFor(b.whatsapp_number);

      var headerHtml = '' +
        '<div class="detail-header">' +
          initialsAvatarHtml(b.student_name) +
          '<div class="detail-header-text">' +
            '<div class="detail-header-title">' + escapeHtml(b.student_name || 'Free Trial Booking') + '</div>' +
            '<span class="status-badge status-' + safeStatus + '">' + escapeHtml(status) + '</span>' +
          '</div>' +
        '</div>';

      var fieldsHtml = [
        buildDetailField({ iconKey: 'id', label: 'Booking ID', value: b.bookingId }),
        buildDetailField({ iconKey: 'calendar', label: 'Booking Date', value: dateStr }),
        buildDetailField({ iconKey: 'user', label: 'Student Name', value: b.student_name }),
        buildDetailField({ iconKey: 'user', label: 'Age', value: b.age }),
        buildDetailField({ iconKey: 'flag', label: 'Country', value: b.country }),
        buildDetailField({ iconKey: 'whatsapp', label: 'WhatsApp Number', value: b.whatsapp_number, copy: true, linkHref: waLink }),
        buildDetailField({ iconKey: 'mail', label: 'Email', value: b.email, copy: true, linkHref: b.email ? ('mailto:' + encodeURIComponent(b.email)) : null }),
        buildDetailField({ iconKey: 'book', label: 'Teacher Preference', value: b.teacher_preference, emptyText: 'No preference' }),
        buildDetailField({ iconKey: 'clock', label: 'Preferred Class Time', value: b.preferred_class_time }),
        buildDetailField({ iconKey: 'message', label: 'Student Message', value: b.message }),
        buildDetailField({ iconKey: 'status', label: 'Current Status', value: status, badgeClass: 'status-badge status-' + safeStatus })
      ].join('');

      var body = document.getElementById('booking-detail-body');
      body.innerHTML = headerHtml + '<div class="detail-list">' + fieldsHtml + '</div>';
      wireCopyButtons(body);
      document.getElementById('booking-detail-overlay').classList.add('show');
    }

    // Jump here from a notification click: switch to this tab, flash-highlight
    // the row so it's easy to find, and open the full detail view directly.
    window.__openBooking = function (id) {
      document.querySelector('.admin-tab-btn[data-tab="bookings"]').click();
      setTimeout(function () {
        var row = tbody.querySelector('[data-booking-row="' + id + '"]');
        if (row) {
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
          row.style.transition = 'background .3s ease';
          row.style.background = '#FDF3D6';
          setTimeout(function () { row.style.background = ''; }, 1800);
        }
        openBookingDetail(id);
      }, 50);
    };
  }

  // ---------------------------------------------------------------------
  // CONTACT MESSAGES — mirrors the Bookings panel above exactly (search,
  // delete-with-confirmation, export CSV), reading from the
  // 'contactMessages' Firebase node instead of 'bookings'.
  // ---------------------------------------------------------------------
  var contactMessagesCache = [];

  function initContactMessages() {
    var tbody = document.getElementById('contact-messages-tbody');
    var searchInput = document.getElementById('contact-message-search');
    var viewFilter = document.getElementById('contact-message-view-filter');
    var exportBtn = document.getElementById('export-contact-messages-btn');

    onValue(ref(db, 'contactMessages'), function (snap) {
      contactMessagesCache = objectToEntries(snap.val());
      contactMessagesCache.sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
      renderContactMessages();
      renderNotifications(); // keep the bell's badge/list in sync with any change here
    }, function () {
      tbody.innerHTML = '<tr class="admin-empty-row"><td colspan="5">Could not load messages. Check your connection and Firebase security rules.</td></tr>';
    });

    function filteredMessages() {
      var term = (searchInput.value || '').toLowerCase().trim();
      var view = viewFilter.value; // 'active' | 'archived' | 'all'

      return contactMessagesCache.filter(function (m) {
        var archived = !!m.archived;
        if (view === 'active' && archived) return false;
        if (view === 'archived' && !archived) return false;
        if (!term) return true;
        var haystack = [m.name, m.email, m.subject].join(' ').toLowerCase();
        return haystack.indexOf(term) !== -1;
      });
    }

    // Shared actions — called from both the table row buttons and the
    // "View Details" panel's own action row, so this logic exists once.
    function toggleMessageRead(id) {
      var msg = contactMessagesCache.find(function (m) { return m.id === id; });
      update(ref(db, 'contactMessages/' + id), { read: !(msg && msg.read === true) })
        .catch(function () { showToast('Could not update message. Please try again.', true); });
    }

    function toggleMessageArchive(id) {
      var msg = contactMessagesCache.find(function (m) { return m.id === id; });
      update(ref(db, 'contactMessages/' + id), { archived: !(msg && msg.archived) })
        .then(function () { showToast(msg && msg.archived ? 'Message unarchived.' : 'Message archived.'); })
        .catch(function () { showToast('Could not update message. Please try again.', true); });
    }

    function deleteMessageWithConfirm(id) {
      if (!confirm('Delete this message permanently? This cannot be undone.')) return;
      remove(ref(db, 'contactMessages/' + id))
        .then(function () {
          contactMessagesCache = contactMessagesCache.filter(function (m) { return m.id !== id; });
          renderContactMessages();
          renderNotifications();
          var overlay = document.getElementById('message-detail-overlay');
          if (overlay) overlay.classList.remove('show'); // close the panel if it was open on this message
          showToast('Message deleted.');
        })
        .catch(function () { showToast('Could not delete message. Please try again.', true); });
    }

    function renderContactMessages() {
      var rows = filteredMessages();

      if (!rows.length) {
        tbody.innerHTML = '<tr class="admin-empty-row"><td colspan="5">No messages match your search.</td></tr>';
        return;
      }

      tbody.innerHTML = rows.map(function (m) {
        var dateStr = m.createdAt ? new Date(m.createdAt).toLocaleString() : '—';
        var isUnread = m.read !== true;
        var rowClasses = (isUnread ? 'msg-unread ' : '') + (m.archived ? 'msg-archived' : '');
        var statusHtml = m.archived
          ? '<span class="archive-badge">Archived</span>'
          : (isUnread ? '<span class="status-badge status-Pending">Unread</span>' : '<span class="status-badge status-Admitted">Read</span>');

        return '<tr class="' + rowClasses.trim() + '" data-message-row="' + m.id + '">' +
          '<td class="cell-nowrap" data-label="Date">' + unreadDotHtml(isUnread) + escapeHtml(dateStr) + '</td>' +
          '<td data-label="Name">' + escapeHtml(m.name) + '</td>' +
          '<td class="cell-wrap" data-label="Subject">' + escapeHtml(m.subject) + '</td>' +
          '<td data-label="Status">' + statusHtml + '</td>' +
          '<td data-label="Actions">' +
            '<div class="action-btns">' +
              '<button class="btn btn-outline-dark btn-sm" data-view-message="' + m.id + '" type="button">View Details</button>' +
              '<a class="btn btn-outline-dark btn-sm" href="mailto:' + encodeURIComponent(m.email || '') + '?subject=' + encodeURIComponent('Re: ' + (m.subject || 'Your message to Al Quranul Academy')) + '">Reply</a>' +
              '<button class="btn btn-outline-dark btn-sm" data-toggle-read="' + m.id + '" type="button">' + (isUnread ? 'Mark Read' : 'Mark Unread') + '</button>' +
              '<button class="btn btn-outline-dark btn-sm" data-toggle-archive="' + m.id + '" type="button">' + (m.archived ? 'Unarchive' : 'Archive') + '</button>' +
              '<button class="btn btn-sm btn-danger" data-delete-message="' + m.id + '" type="button">Delete</button>' +
            '</div>' +
          '</td>' +
        '</tr>';
      }).join('');

      tbody.querySelectorAll('[data-view-message]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          openMessageDetail(btn.getAttribute('data-view-message'));
        });
      });

      tbody.querySelectorAll('[data-toggle-read]').forEach(function (btn) {
        btn.addEventListener('click', function () { toggleMessageRead(btn.getAttribute('data-toggle-read')); });
      });

      tbody.querySelectorAll('[data-toggle-archive]').forEach(function (btn) {
        btn.addEventListener('click', function () { toggleMessageArchive(btn.getAttribute('data-toggle-archive')); });
      });

      tbody.querySelectorAll('[data-delete-message]').forEach(function (btn) {
        btn.addEventListener('click', function () { deleteMessageWithConfirm(btn.getAttribute('data-delete-message')); });
      });
    }

    searchInput.addEventListener('input', renderContactMessages);
    viewFilter.addEventListener('change', renderContactMessages);

    exportBtn.addEventListener('click', function () {
      var rows = filteredMessages();
      if (!rows.length) { showToast('No messages to export.', true); return; }

      var headers = ['Date', 'Name', 'Email', 'Subject', 'Message', 'Read', 'Archived'];
      var csvRows = [headers.join(',')];
      rows.forEach(function (m) {
        var dateStr = m.createdAt ? new Date(m.createdAt).toISOString() : '';
        var line = [dateStr, m.name, m.email, m.subject, m.message, m.read === true ? 'Read' : 'Unread', m.archived ? 'Archived' : 'Active']
          .map(function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; })
          .join(',');
        csvRows.push(line);
      });

      var blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'contact-messages-' + new Date().toISOString().slice(0, 10) + '.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    // "View Details" — shows every message field vertically, in the same
    // spirit as the Bookings detail panel, instead of cramming it all
    // into the table.
    // "View Details" — same profile-card layout as the Bookings panel
    // (shared header/field/copy-button building blocks above), plus a
    // Reply / Archive / Delete action row so every message action is
    // reachable from inside the detail panel too, not just the table row.
    function openMessageDetail(id) {
      var m = contactMessagesCache.find(function (x) { return x.id === id; });
      if (!m) return;
      var dateStr = m.createdAt ? new Date(m.createdAt).toLocaleString() : '—';
      var isUnread = m.read !== true;
      var statusText = m.archived ? 'Archived' : 'Active';
      var statusBadgeClass = m.archived ? 'archive-badge' : 'status-badge status-Admitted';
      var readText = isUnread ? 'Unread' : 'Read';
      var readBadgeClass = isUnread ? 'status-badge status-Pending' : 'status-badge status-Admitted';

      var headerHtml = '' +
        '<div class="detail-header">' +
          initialsAvatarHtml(m.name) +
          '<div class="detail-header-text">' +
            '<div class="detail-header-title">' + escapeHtml(m.name || 'Contact Message') + '</div>' +
            '<span class="' + readBadgeClass + '">' + escapeHtml(readText) + '</span>' +
          '</div>' +
        '</div>';

      var fieldsHtml = [
        buildDetailField({ iconKey: 'id', label: 'Message ID', value: m.id }),
        buildDetailField({ iconKey: 'calendar', label: 'Date', value: dateStr }),
        buildDetailField({ iconKey: 'user', label: 'Sender Name', value: m.name }),
        buildDetailField({ iconKey: 'mail', label: 'Email', value: m.email, copy: true, linkHref: m.email ? ('mailto:' + encodeURIComponent(m.email)) : null }),
        buildDetailField({ iconKey: 'subject', label: 'Subject', value: m.subject }),
        buildDetailField({ iconKey: 'message', label: 'Message', value: m.message }),
        buildDetailField({ iconKey: 'status', label: 'Status', value: statusText, badgeClass: statusBadgeClass }),
        buildDetailField({ iconKey: 'status', label: 'Read / Unread', value: readText, badgeClass: readBadgeClass })
      ].join('');

      var replyHref = 'mailto:' + encodeURIComponent(m.email || '') + '?subject=' + encodeURIComponent('Re: ' + (m.subject || 'Your message to Al Quranul Academy'));
      var actionsHtml = '' +
        '<div class="detail-actions">' +
          '<a class="btn btn-outline-dark btn-sm" href="' + replyHref + '">Reply</a>' +
          '<button class="btn btn-outline-dark btn-sm" type="button" data-detail-archive-message="' + m.id + '">' + (m.archived ? 'Unarchive' : 'Archive') + '</button>' +
          '<button class="btn btn-sm btn-danger" type="button" data-detail-delete-message="' + m.id + '">Delete</button>' +
        '</div>';

      var body = document.getElementById('message-detail-body');
      body.innerHTML = headerHtml + '<div class="detail-list">' + fieldsHtml + '</div>' + actionsHtml;
      wireCopyButtons(body);

      var archiveBtn = body.querySelector('[data-detail-archive-message]');
      if (archiveBtn) {
        archiveBtn.addEventListener('click', function () { toggleMessageArchive(id); });
      }

      var deleteBtn = body.querySelector('[data-detail-delete-message]');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', function () { deleteMessageWithConfirm(id); });
      }

      document.getElementById('message-detail-overlay').classList.add('show');
    }

    // Jump here from a notification click: switch to this tab, filter to
    // show every message (in case it's archived), then flash-highlight
    // the row so it's easy to find, and open the full detail view directly.
    window.__openContactMessage = function (id) {
      document.querySelector('.admin-tab-btn[data-tab="contact-messages"]').click();
      viewFilter.value = 'all';
      renderContactMessages();
      setTimeout(function () {
        var row = tbody.querySelector('[data-message-row="' + id + '"]');
        if (row) {
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
          row.style.transition = 'background .3s ease';
          row.style.background = '#FDF3D6';
          setTimeout(function () { row.style.background = ''; }, 1800);
        }
        openMessageDetail(id);
      }, 50);
    };
  }


  // ---------------------------------------------------------------------
  // ADMISSIONS — mirrors Bookings exactly (search, status filter, CSV,
  // detail panel, delete-with-confirmation), reading from the
  // 'admissions' Firebase node. Plus Approve: assigns a Student ID and
  // an Admission Date (= approval date, today), renders the final
  // ID-card theme in an overlay for admin review, generates a PNG in
  // the admin's browser with html2canvas, and posts it to Apps Script
  // (form_type='admission_approve') so the confirmation email carries
  // the ID card as an attachment. The RTDB record is marked Admitted
  // ONLY after Apps Script returns success — if the Apps Script
  // deployment has not been updated yet, Approve shows the error and
  // the record stays Pending, so it can be retried after deployment.
  // Photo rule: a card uses ONLY this student's own admission photo;
  // when no photo was provided (female 12+ exemption only), the card
  // shows the silhouette placeholder, never another person's photo.
  // ---------------------------------------------------------------------
  var admissionsCache = [];
  var ADMISSIONS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwtFpH8MFgxfNEqe2fCuQopJVC2kKAA3FWCmbrf-1iEXfd14YXGxVOJe2oGhNPHXzkx/exec';
  var LINKS_QR_B64 = "iVBORw0KGgoAAAANSUhEUgAAAzQAAAM0AQAAAABFCVraAAADPUlEQVR42u3dQY4UMQwF0IgL5P63rBsUEiPUie1ELGCkhFcLxEBNvUUv6rcTO+39lutpHA6Hw+FwOBwOh8PhcDgcDofD4XA4HA6Hw+Fw/genxat/3THd0uf7plvqB3w5P9r3XBwOh8PhcP7CFV7+VRb4lQDGv/Xif3v9APmAw+FwOJzz88Hnm3+KAe8YCD6pYP8A+YDD4XA4nOvywVgcmG4eVxVymJAPOBwOh8O5Px/kfxs3HMgHHA6Hw+HcnQ/Sj1P9YHrlt7iH0v4DDofD4XAuzAfh6sXiwf6P/AD5gMPhcDico/PBqgPy933P2MkQVhBC6SA/xefD4XA4HM6h+SC3MaauhUVmSCsN8ck+Hw6Hw+FwjswHn7pAqBVs2hTafEtbjUOQDzgcDofDOb1+UA0/qjLDWD946jlK8gGHw+FwONfUD3arBamd4UmJIq05yAccDofD4RycD9Jo5arTMS4ezFWDJh9wOBwOh3NRPqje+72eqlz3LzzzwoN8wOFwOBzOZflgeTjjZr5yq9sZ5AMOh8PhcE7NB/XhCq1YgqjmK3+elw9ukg84HA6Hwzk6H4zv+OnlnyYtt9TdUM9hlg84HA6Hwzk4H6Q9BIsmhuWCQt0WKR9wOBwOh3N0/SBMTQxTD3radZC6G0LFQf2Aw+FwOJzz88G7iQbV1INqdkJYbpAPOBwOh8O5Jh+0sRpQ705YNjQ+VWXC58PhcDgczpH5IFQN0kEKT3GIY0v7D6olCPmAw+FwOJxr6gdhHMKf1RSsL3A4HA6Hc1c+eNIxzvv5SGGTYl1OkA84HA6Hwzk4Hyy//udpBuPvLh8qH3A4HA6Hc0P94N0e3bgbcxDWIcxX5nA4HA7nmvpBuPJcg3RWY0+bFaoDouUDDofD4XDOzQc9DUGo1xxCf2NYjAgBQz7gcDgcDuf0fBCqAZvBSYutB3UlQT7gcDgcDueefFCf27zsZcwHO8oHHA6Hw+HcmQ/Scc9xuMH8POc7czgcDodzWT6o9x+01RCEt9iz2PQ3cjgcDodzUT4IVy+6GnMTQ3WL+gGHw+FwOJfkg395PRwOh8PhcDgcDofD4XA4HA6Hw+FwOBwOh8PhcO51fgKBQuafmYfPuAAAAABJRU5ErkJggg==";

  // Admission-fee payment status (Sir, 2026-10-27): a record is Paid
  // ONLY when Sir explicitly marked it Paid; every other record —
  // including all old records without this field — counts as Unpaid.
  // No amount field, by Sir's decision: Paid/Unpaid only.
  function paymentStatusOf(a) { return (a && a.payment_status === 'paid') ? 'paid' : 'unpaid'; }
  function paymentBadgeHtml(a) {
    return paymentStatusOf(a) === 'paid'
      ? '<span class="status-badge pay-paid">Paid</span>'
      : '<span class="status-badge pay-unpaid">Unpaid</span>';
  }

  function initAdmissions() {
    var tbody = document.getElementById('admissions-tbody');
    var searchInput = document.getElementById('admission-search');
    var statusFilter = document.getElementById('admission-status-filter');
    var paymentFilter = document.getElementById('admission-payment-filter');
    var exportBtn = document.getElementById('export-admissions-btn');
    if (!tbody) return;

    onValue(ref(db, 'admissions'), function (snap) {
      admissionsCache = objectToEntries(snap.val());
      admissionsCache.sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
      renderAdmissions();
    }, function () {
      tbody.innerHTML = '<tr class="admin-empty-row"><td colspan="5">Could not load admissions. Check your connection and Firebase security rules.</td></tr>';
    });

    function filteredAdmissions() {
      var term = (searchInput.value || '').toLowerCase().trim();
      var status = statusFilter.value;
      var payment = paymentFilter ? paymentFilter.value : '';
      return admissionsCache.filter(function (a) {
        if (status && a.status !== status) return false;
        if (payment && paymentStatusOf(a) !== payment) return false;
        if (!term) return true;
        var haystack = [a.student_name, a.email, a.whatsapp_number, a.country, a.course, a.student_id].join(' ').toLowerCase();
        return haystack.indexOf(term) !== -1;
      });
    }

    function renderAdmissions() {
      var rows = filteredAdmissions();
      if (!rows.length) {
        tbody.innerHTML = '<tr class="admin-empty-row"><td colspan="5">No admissions match your search.</td></tr>';
        return;
      }
      tbody.innerHTML = rows.map(function (a) {
        var dateStr = a.createdAt ? new Date(a.createdAt).toLocaleString() : '—';
        var isUnread = a.read !== true;
        var safeStatus = ['Pending', 'Contacted', 'Admitted', 'Cancelled'].indexOf(a.status) !== -1 ? a.status : 'Pending';
        return '<tr data-admission-row="' + a.id + '">' +
          '<td class="cell-nowrap" data-label="Date">' + unreadDotHtml(isUnread) + escapeHtml(dateStr) + '</td>' +
          '<td data-label="Student">' + escapeHtml(a.student_name) + (a.student_id ? '<br><small>' + escapeHtml(a.student_id) + '</small>' : '') + '</td>' +
          '<td data-label="Course">' + escapeHtml(a.course) + '</td>' +
          '<td data-label="Status"><span class="status-badge status-' + safeStatus + '">' + escapeHtml(safeStatus) + '</span><br>' + paymentBadgeHtml(a) + '</td>' +
          '<td data-label="Actions"><div class="action-btns">' +
            '<button class="btn btn-outline-dark btn-sm" data-view-admission="' + a.id + '" type="button">View Details</button>' +
            (safeStatus !== 'Admitted' ? '<button class="btn btn-primary btn-sm" data-approve-admission="' + a.id + '" type="button">Approve</button>' : '<button class="btn btn-primary btn-sm" data-id-card-admission="' + a.id + '" type="button">ID Card</button>') +
            '<button class="btn btn-outline-dark btn-sm" data-toggle-read-admission="' + a.id + '" type="button">' + (isUnread ? 'Mark Read' : 'Mark Unread') + '</button>' +
            '<button class="btn btn-sm btn-danger" data-delete-admission="' + a.id + '" type="button">Delete</button>' +
          '</div></td></tr>';
      }).join('');
      tbody.querySelectorAll('[data-view-admission]').forEach(function (btn) {
        btn.addEventListener('click', function () { openAdmissionDetail(btn.getAttribute('data-view-admission')); });
      });
      tbody.querySelectorAll('[data-approve-admission]').forEach(function (btn) {
        btn.addEventListener('click', function () { openAdmissionApprove(btn.getAttribute('data-approve-admission')); });
      });
      tbody.querySelectorAll('[data-id-card-admission]').forEach(function (btn) {
        btn.addEventListener('click', function () { openIdCardMenu(btn.getAttribute('data-id-card-admission')); });
      });
      tbody.querySelectorAll('[data-toggle-read-admission]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var a = admissionsCache.find(function (x) { return x.id === btn.getAttribute('data-toggle-read-admission'); });
          update(ref(db, 'admissions/' + btn.getAttribute('data-toggle-read-admission')), { read: !(a && a.read === true) })
            .catch(function () { showToast('Could not update admission. Please try again.', true); });
        });
      });
      tbody.querySelectorAll('[data-delete-admission]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (!confirm('Delete this admission permanently? This cannot be undone.')) return;
          remove(ref(db, 'admissions/' + btn.getAttribute('data-delete-admission')))
            .then(function () { showToast('Admission deleted.'); })
            .catch(function () { showToast('Could not delete admission. Please try again.', true); });
        });
      });
    }

    searchInput.addEventListener('input', renderAdmissions);
    statusFilter.addEventListener('change', renderAdmissions);
    if (paymentFilter) paymentFilter.addEventListener('change', renderAdmissions);

    exportBtn.addEventListener('click', function () {
      var rows = filteredAdmissions();
      if (!rows.length) { showToast('No admissions to export.', true); return; }
      var headers = ['Date', 'Student Name', 'Age', 'Gender', 'Country', 'Guardian', 'WhatsApp', 'Email', 'Course', 'Teacher Preference', 'Preferred Class Time', 'Message', 'Photo Provided', 'Student ID', 'Admission Date', 'Status', 'Payment Status'];
      var csvRows = [headers.join(',')];
      rows.forEach(function (a) {
        var line = [a.createdAt ? new Date(a.createdAt).toISOString() : '', a.student_name, a.age, a.gender, a.country, a.guardian_name, a.whatsapp_number, a.email, a.course, a.teacher_preference, a.preferred_class_time, a.message, a.photo_provided, a.student_id, a.admission_date, a.status, paymentStatusOf(a) === 'paid' ? 'Paid' : 'Unpaid']
          .map(function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }).join(',');
        csvRows.push(line);
      });
      var blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      var url = URL.createObjectURL(blob);
      var aEl = document.createElement('a'); aEl.href = url;
      aEl.download = 'admissions-' + new Date().toISOString().slice(0, 10) + '.csv';
      document.body.appendChild(aEl); aEl.click(); document.body.removeChild(aEl); URL.revokeObjectURL(url);
    });

    function openAdmissionDetail(id) {
      var a = admissionsCache.find(function (x) { return x.id === id; });
      if (!a) return;
      var dateStr = a.createdAt ? new Date(a.createdAt).toLocaleString() : '—';
      var photoHtml = a.photo_data_url
        ? '<img src="' + a.photo_data_url + '" alt="Student photo" style="max-width:180px;border-radius:8px;border:2px solid #0B6B3A;">'
        : '<p class="small">No photo provided (female 12+ exemption, or photo missing). The ID card will use the silhouette placeholder instead — never another student\'s photo.</p>';
      var headerHtml = '<div class="detail-header">' + initialsAvatarHtml(a.student_name) +
        '<div class="detail-header-text"><div class="detail-header-title">' + escapeHtml(a.student_name || 'Admission') + '</div>' +
        '<span class="status-badge status-' + (['Pending', 'Contacted', 'Admitted', 'Cancelled'].indexOf(a.status) !== -1 ? a.status : 'Pending') + '">' + escapeHtml(a.status || 'Pending') + '</span></div></div>';
      var fieldsHtml = [
        buildDetailField({ iconKey: 'calendar', label: 'Submitted', value: dateStr }),
        buildDetailField({ iconKey: 'user', label: 'Student Name', value: a.student_name }),
        buildDetailField({ iconKey: 'calendar', label: 'Age', value: a.age }),
        buildDetailField({ iconKey: 'user', label: 'Gender', value: a.gender }),
        buildDetailField({ iconKey: 'flag', label: 'Country', value: a.country }),
        buildDetailField({ iconKey: 'user', label: 'Guardian Name', value: a.guardian_name }),
        buildDetailField({ iconKey: 'whatsapp', label: 'WhatsApp', value: a.whatsapp_number, copy: true, linkHref: whatsappLinkFor(a.whatsapp_number) }),
        buildDetailField({ iconKey: 'mail', label: 'Email', value: a.email, copy: true, linkHref: a.email ? ('mailto:' + encodeURIComponent(a.email)) : null }),
        buildDetailField({ iconKey: 'book', label: 'Course', value: a.course }),
        buildDetailField({ iconKey: 'user', label: 'Teacher Preference', value: a.teacher_preference }),
        buildDetailField({ iconKey: 'clock', label: 'Preferred Class Time', value: a.preferred_class_time }),
        buildDetailField({ iconKey: 'message', label: 'Message', value: a.message }),
        buildDetailField({ iconKey: 'id', label: 'Student ID', value: a.student_id }),
        buildDetailField({ iconKey: 'calendar', label: 'Admission Date', value: a.admission_date }),
        buildDetailField({ iconKey: 'id', label: 'Payment Status', value: paymentStatusOf(a) === 'paid' ? 'Paid' : 'Unpaid' })
      ].join('');
      var actionsHtml = '<div class="detail-actions">' +
        (a.status !== 'Admitted' ? '<button class="btn btn-primary btn-sm" type="button" data-detail-approve="' + a.id + '">Approve</button>' : '<button class="btn btn-primary btn-sm" type="button" data-detail-id-card="' + a.id + '">ID Card</button>') +
        (paymentStatusOf(a) === 'paid'
          ? '<button class="btn btn-outline-dark btn-sm" type="button" data-detail-unpaid="' + a.id + '">Mark Unpaid</button>'
          : '<button class="btn btn-primary btn-sm" type="button" data-detail-paid="' + a.id + '">Mark Paid</button>') +
        '<span id="admission-payment-status" class="small" style="margin-left:8px;"></span></div>';
      var body = document.getElementById('admission-detail-body');
      body.innerHTML = headerHtml + '<div class="detail-list">' + fieldsHtml + '</div>' +
        '<div style="margin-top:16px;"><strong>Student Photo</strong><br>' + photoHtml + '</div>' + actionsHtml;
      wireCopyButtons(body);
      var approveBtn = body.querySelector('[data-detail-approve]');
      if (approveBtn) approveBtn.addEventListener('click', function () { openAdmissionApprove(id); });
      var idCardBtn = body.querySelector('[data-detail-id-card]');
      if (idCardBtn) idCardBtn.addEventListener('click', function () { openIdCardMenu(id); });
      var paidBtn = body.querySelector('[data-detail-paid]');
      if (paidBtn) paidBtn.addEventListener('click', function () { setAdmissionPayment(id, true); });
      var unpaidBtn = body.querySelector('[data-detail-unpaid]');
      if (unpaidBtn) unpaidBtn.addEventListener('click', function () { setAdmissionPayment(id, false); });
      document.getElementById('admission-detail-overlay').classList.add('show');
    }

    function nextStudentId() {
      var year = new Date().getFullYear();
      var admitted = admissionsCache.filter(function (x) { return x.status === 'Admitted' && x.student_id; }).length;
      var n = admitted + 1;
      var str = String(n); while (str.length < 4) str = '0' + str;
      return 'AQA' + year + '-' + str;
    }

    function formatCardDate(d) {
      return d.getDate() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + d.getFullYear();
    }

    /* ---- ID card PNG fix (Sir, 2026-10-26): the emailed PNG did NOT
       match the approved final frame. (1) PHOTO DISTORTION: the preview
       used <img width=100% height=100% object-fit:cover> in a 340x270
       box, and html2canvas stretches instead of cropping, so a round
       test photo came out as a wide oval — a real face would look
       squashed. Fix: cropPhotoForCard() centre-crops the photo to the
       exact 340:270 box aspect on a canvas BEFORE it ever reaches the
       card, so the <img> in the card is already box-shaped and needs
       no object-fit at all. (2) NO-PHOTO: the card showed a big
       initial letter; the approved frame uses a silhouette placeholder
       — fixed here. (3) FONTS: the approved frame uses Playfair
       Display (title/footer) and Poppins (fields); the dashboard now
       loads both from Google Fonts and the card uses them, with a
       document.fonts.ready wait before every html2canvas capture.
       (4) ICONS: field icons are the approved SVG icons, not letters.
       (5) Banner/tagline/contact icon now match the final frame. */
    function cropPhotoForCard(src) {
      return new Promise(function (resolve) {
        if (!src) { resolve(''); return; }
        var img = new Image();
        img.onload = function () {
          try {
            var targetW = 680, targetH = 540, targetAspect = targetW / targetH;
            var srcAspect = img.width / img.height, sw, sh, sx, sy;
            if (srcAspect > targetAspect) { sh = img.height; sw = sh * targetAspect; sx = (img.width - sw) / 2; sy = 0; }
            else { sw = img.width; sh = sw / targetAspect; sx = 0; sy = (img.height - sh) / 2; }
            var c = document.createElement('canvas'); c.width = targetW; c.height = targetH;
            c.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
            resolve(c.toDataURL('image/jpeg', 0.92));
          } catch (e) { resolve(src); }
        };
        img.onerror = function () { resolve(src); };
        img.src = src;
      });
    }
    function fontsReady() {
      // Wait for Playfair/Poppins to load before capturing, but never
      // block the capture for more than 1.5s if fonts fail to load.
      try {
        if (document.fonts && document.fonts.ready) {
          return Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 1500); })]);
        }
      } catch (e) {}
      return Promise.resolve();
    }
    var CARD_ICONS = {
      NAME: '<svg viewBox="0 0 24 24" style="width:26px;height:26px;"><circle cx="12" cy="8" r="4" fill="#fff"/><path d="M4 20 Q12 12 20 20 Z" fill="#fff"/></svg>',
      AGE: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" style="width:26px;height:26px;"><rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/></svg>',
      COURSE: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" style="width:26px;height:26px;"><path d="M4 5 Q12 2 20 5 L20 19 Q12 16 4 19 Z"/><line x1="12" y1="3" x2="12" y2="17"/></svg>',
      COUNTRY: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" style="width:26px;height:26px;"><circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M12 3 Q7 12 12 21 Q17 12 12 3"/></svg>',
      'STUDENT ID': '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" style="width:26px;height:26px;"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8" cy="11" r="2" fill="#fff" stroke="none"/><line x1="13" y1="9" x2="19" y2="9"/><line x1="13" y1="13" x2="19" y2="13"/></svg>',
      'ADMISSION DATE': '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" style="width:26px;height:26px;"><rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/></svg>'
    };
    function idCardPreviewHtml(a, studentId, admissionDate, photoSrc) {
      var photoInner;
      if (photoSrc) {
        // Already cropped to the 340x270 box aspect — no object-fit, so
        // html2canvas cannot stretch it.
        photoInner = '<img src="' + photoSrc + '" style="width:100%;height:100%;display:block;">';
      } else if (a.photo_data_url) {
        photoInner = '<img src="' + a.photo_data_url + '" style="width:100%;height:100%;display:block;">';
      } else {
        // Approved silhouette placeholder (final frame), never an initial.
        photoInner = '<svg viewBox="0 0 200 200" style="width:175px;height:175px;"><ellipse cx="100" cy="65" rx="45" ry="50" fill="#111"/><path d="M20 200 Q20 120 100 120 Q180 120 180 200 Z" fill="#111"/><rect x="20" y="170" width="160" height="12" rx="6" fill="#111"/><rect x="20" y="190" width="110" height="12" rx="6" fill="#111"/></svg>';
      }
      function fieldRow(label, value) {
        var wide = label === 'ADMISSION DATE' ? '200px' : '170px';
        return '<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">' +
          '<div style="width:44px;height:44px;background:#032c0e;color:#fff;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' + (CARD_ICONS[label] || '') + '</div>' +
          '<div style="width:' + wide + ';font-size:20px;font-weight:800;font-family:\'Poppins\',Arial,Helvetica,sans-serif;color:#032c0e;flex-shrink:0;">' + escapeHtml(label) + '</div><div style="font-size:20px;font-weight:800;color:#032c0e;">:</div>' +
          '<div style="flex:1;border-bottom:2px dotted #888;padding-bottom:6px;font-size:22px;font-weight:500;font-family:\'Poppins\',Arial,Helvetica,sans-serif;color:#111;min-height:30px;">' + escapeHtml(value || '—') + '</div></div>';
      }
      return '<div id="id-card-preview" style="width:1000px;height:739px;background:#fff;border:4px solid #032c0e;border-radius:28px;overflow:hidden;position:relative;font-family:\'Poppins\',Arial,Helvetica,sans-serif;">' +
        '<div style="height:22px;background:#032c0e;"></div>' +
        '<div style="display:flex;align-items:center;gap:18px;padding:10px 30px 0 30px;">' +
          '<img src="assets/logo.png" style="width:170px;height:auto;" alt="Al Quranul Academy logo">' +
          '<div style="flex:1;text-align:center;"><div style="font-size:54px;font-weight:900;font-family:\'Playfair Display\',Georgia,serif;color:#032c0e;line-height:1;letter-spacing:1px;">AL QURANUL</div>' +
          '<div style="font-size:54px;font-weight:900;font-family:\'Playfair Display\',Georgia,serif;color:#0a7a2e;line-height:1;letter-spacing:1px;">ACADEMY</div>' +
          '<div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-top:8px;color:#032c0e;font-size:20px;"><span style="width:60px;height:2px;background:#c9a227;"></span><span>Learn Quran, Build Character</span><span style="width:60px;height:2px;background:#c9a227;"></span></div></div></div>' +
        '<div style="display:flex;gap:26px;padding:16px 30px 0 30px;">' +
          '<div style="width:340px;flex-shrink:0;">' +
            '<div style="width:340px;height:270px;border:8px solid #0b5a2a;border-radius:20px;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#f2f2f2;">' + photoInner + '</div>' +
            '<svg viewBox="0 0 340 46" preserveAspectRatio="none" style="width:340px;height:46px;margin-top:12px;"><polygon points="0,23 18,0 322,0 340,23 322,46 18,46" fill="#032c0e" stroke="#c9a227" stroke-width="2"/><text x="170" y="30" text-anchor="middle" fill="#fff" font-size="20" font-weight="800" letter-spacing="2" font-family="Poppins, Arial, sans-serif">◆ STUDENT ID CARD ◆</text></svg>' +
            '<div style="margin-top:14px;border:2px solid #c9a227;border-radius:12px;padding:10px 14px;display:flex;gap:12px;align-items:center;"><div style="width:48px;height:48px;background:#032c0e;color:#fff;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg viewBox="0 0 24 24" fill="#fff" style="width:28px;height:28px;"><path d="M6 3 Q4 5 6 8 L9 11 Q10 13 8 15 L6 17 Q5 20 8 21 Q12 22 16 18 L19 15 Q21 13 20 10 L18 7 Q17 5 15 6 L13 8 Q12 9 13 10 L15 12 Q14 14 12 14 Q10 14 9 12 L7 10 Q6 9 7 8 L9 6 Q10 4 8 3 Z"/></svg></div><div><b style="font-size:17px;font-family:\'Poppins\',Arial,Helvetica,sans-serif;color:#032c0e;">CONTACT</b><br><span style="font-size:19px;font-family:\'Poppins\',Arial,Helvetica,sans-serif;font-weight:700;color:#032c0e;">+20 155 1426055</span></div></div>' +
          '</div>' +
          '<div style="flex:1;">' +
            fieldRow('NAME', a.student_name) + fieldRow('AGE', a.age ? (a.age + ' years') : '') + fieldRow('COURSE', a.course) + fieldRow('COUNTRY', a.country) + fieldRow('STUDENT ID', studentId) + fieldRow('ADMISSION DATE', admissionDate) +
            '<div style="display:flex;align-items:center;gap:10px;margin:8px 0 12px 0;"><div style="flex:1;height:1px;background:#bbb;"></div><div style="color:#c9a227;font-size:16px;">◆</div><div style="flex:1;height:1px;background:#bbb;"></div></div>' +
            '<div style="display:flex;justify-content:flex-end;align-items:center;gap:16px;"><img src="data:image/png;base64,' + LINKS_QR_B64 + '" style="width:120px;height:120px;border:2px solid #c9a227;border-radius:12px;padding:6px;background:#fff;"><div style="font-size:20px;font-weight:700;font-family:\'Poppins\',Arial,Helvetica,sans-serif;color:#032c0e;line-height:1.4;">Scan to<br>contact us<br>↩</div></div>' +
          '</div>' +
        '</div>' +
        '<div style="position:absolute;left:0;bottom:0;width:100%;height:82px;"><svg viewBox="0 0 1000 82" preserveAspectRatio="none" style="position:absolute;left:0;bottom:0;width:100%;height:82px;"><path d="M0,28 Q250,4 500,28 T1000,28 L1000,82 L0,82 Z" fill="#032c0e" stroke="#c9a227" stroke-width="3"/></svg>' +
        '<div style="position:absolute;left:0;bottom:12px;width:100%;display:flex;align-items:center;justify-content:center;gap:16px;color:#fff;font-size:20px;font-weight:700;font-family:\'Playfair Display\',Georgia,serif;"><span style="color:#c9a227;">🌐</span><span>Al Quranul Academy</span><span style="width:28px;height:28px;background:#1877F2;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;">F</span></div></div>' +
      '</div>';
    }

    /* ---- Admission-fee payment toggle (Sir, 2026-10-27). Paid/Unpaid
       only — no amount field, by Sir's decision. ID Card is NOT gated
       on payment (Sir: unpaid students get ID cards too), so this
       function touches nothing but payment_status. Mark Paid on an
       Admitted record sends the payment-complete email via Apps
       Script (form_type='admission_payment') BEFORE the RTDB write,
       so a failed email leaves the record Unpaid and retryable;
       Mark Paid on a Pending record only writes RTDB (the approve
       email will carry the payment line); Mark Unpaid never emails. */
    function setAdmissionPayment(id, paid) {
      var a = admissionsCache.find(function (x) { return x.id === id; });
      if (!a) return;
      var statusEl = document.getElementById('admission-payment-status');
      function writePaid() {
        return update(ref(db, 'admissions/' + id), { payment_status: 'paid', paidAt: Date.now() })
          .then(function () { if (statusEl) statusEl.textContent = 'Marked Paid.'; showToast('Marked Paid.'); openAdmissionDetail(id); })
          .catch(function () { showToast('Could not update payment status. Please try again.', true); });
      }
      if (!paid) {
        update(ref(db, 'admissions/' + id), { payment_status: 'unpaid' })
          .then(function () { if (statusEl) statusEl.textContent = 'Marked Unpaid.'; showToast('Marked Unpaid.'); openAdmissionDetail(id); })
          .catch(function () { showToast('Could not update payment status. Please try again.', true); });
        return;
      }
      if (a.status !== 'Admitted') { writePaid(); return; }
      if (statusEl) statusEl.textContent = 'Sending payment-complete email…';
      fetch(ADMISSIONS_ENDPOINT, { method: 'POST', redirect: 'follow', headers: { 'Accept': 'application/json' }, body: JSON.stringify({
        form_type: 'admission_payment',
        student_name: a.student_name || '',
        email: a.email || '',
        course: a.course || '',
        student_id: a.student_id || ''
      }) })
        .then(function (res) { if (!res.ok) throw new Error('Server responded with status ' + res.status); return res.json(); })
        .then(function (result) {
          if (!result || result.success !== true) throw new Error((result && (result.error || result.message)) || 'Apps Script did not confirm the payment email. The record is still Unpaid.');
          return writePaid();
        })
        .catch(function (err) {
          if (statusEl) statusEl.textContent = 'Payment email failed: ' + (err && err.message ? err.message : err) + ' The record is still Unpaid, so you can retry.';
          showToast('Payment email failed. Please try again.', true);
        });
    }

    /* ---- NEW Approve flow (Sir, 2026-10-26, CORRECTED 2026-10-26):
       Approve does NOT show the ID card preview, and — Sir's explicit
       correction — it does NOT send the ID card either. It only
       confirms, assigns Student ID + Admission Date (= today), sends
       the congratulations/confirmation email WITH NO attachment, and
       marks the record Admitted. The ID card goes ONLY in a second,
       separate email, when Sir clicks "Send ID Card by Email" in the
       ID Card menu (that flow still posts the PNG, so Apps Script
       attaches it there and only there). Implementation: Approve
       posts admission_approve with NO id_card_png_base64 field at
       all, and Apps Script branches on the presence of that field —
       no PNG = congratulations email, no attachment; PNG present =
       ID-card email with attachment. */
    function openAdmissionApprove(id) {
      var a = admissionsCache.find(function (x) { return x.id === id; });
      if (!a) return;
      var studentId = a.student_id || nextStudentId();
      var admissionDate = formatCardDate(new Date());
      var body = document.getElementById('admission-approve-body');
      body.innerHTML = '<p>Approve <strong>' + escapeHtml(a.student_name || '') + '</strong>?</p>' +
        '<p class="small">Payment status: <strong>' + (paymentStatusOf(a) === 'paid' ? 'Paid' : 'Unpaid') + '</strong>.' +
        (paymentStatusOf(a) === 'paid' ? ' The confirmation email will say the admission fee payment is complete.' : ' The confirmation email will say the admission fee is still pending.') + '</p>' +
        '<p class="small">This will assign <strong>' + escapeHtml(studentId) + '</strong> and Admission Date <strong>' + escapeHtml(admissionDate) + '</strong> (today), mark this record Admitted, and send the congratulations/confirmation email <strong>without the ID card</strong>. The ID card will be sent separately, in a second email, only when you click <strong>Send ID Card by Email</strong> in the ID Card menu.</p>' +
        '<div id="admission-approve-status" class="small" style="margin-top:12px;"></div>' +
        '<button class="btn btn-primary btn-block" type="button" id="admission-confirm-approve-btn" style="margin-top:12px;">Confirm Approve &amp; Send Confirmation Email</button>';
      document.getElementById('admission-approve-overlay').classList.add('show');
      document.getElementById('admission-confirm-approve-btn').addEventListener('click', function () {
        var btn = this;
        var statusEl = document.getElementById('admission-approve-status');
        // Unpaid-approve warning (Sir, 2026-10-27): approving with the
        // fee unpaid is allowed, but Sir must confirm it knowingly —
        // the student then gets the fee-pending email, not a surprise.
        if (paymentStatusOf(a) !== 'paid' && !confirm('This student\'s admission fee is still unpaid. Approve anyway? The student will receive an email saying the admission fee is still pending.')) return;
        btn.disabled = true; btn.textContent = 'Sending confirmation…';
        // No ID card PNG is generated or posted here — deliberately.
        var payload = {
          form_type: 'admission_approve',
          student_name: a.student_name || '',
          email: a.email || '',
          course: a.course || '',
          country: a.country || '',
          student_id: studentId,
          admission_date: admissionDate,
          payment_status: paymentStatusOf(a)
        };
        fetch(ADMISSIONS_ENDPOINT, { method: 'POST', redirect: 'follow', headers: { 'Accept': 'application/json' }, body: JSON.stringify(payload) })
          .then(function (res) { if (!res.ok) throw new Error('Server responded with status ' + res.status); return res.json(); })
          .then(function (result) {
            if (!result || result.success !== true) throw new Error((result && (result.error || result.message)) || 'Apps Script did not confirm the approval. The record has NOT been marked Admitted.');
            return update(ref(db, 'admissions/' + id), { status: 'Admitted', student_id: studentId, admission_date: admissionDate, approvedAt: Date.now(), read: true });
          })
          .then(function () {
            statusEl.textContent = 'Approved. Confirmation email (without ID card) sent to ' + (a.email || '') + '. Use the ID Card button beside this record to send the ID card in a separate email.';
            showToast('Admission approved and confirmation email sent.');
            setTimeout(function () { btn.disabled = false; btn.textContent = 'Confirm Approve & Send Confirmation Email'; document.getElementById('admission-approve-overlay').classList.remove('show'); }, 900);
          })
          .catch(function (err) {
            statusEl.textContent = 'Approve failed: ' + (err && err.message ? err.message : err) + ' The record has NOT been marked Admitted, so you can retry.';
            showToast('Approve failed. Please try again.', true);
            btn.disabled = false; btn.textContent = 'Confirm Approve & Send Confirmation Email';
          });
      });
    }

    /* ---- ID Card menu (Sir, 2026-10-26): appears ONLY beside Admitted
       records, after approval. Opens an editable ID-card form: every
       field on the card (Name, Age, Course, Country, Student ID,
       Admission Date) is prefilled from the record and can be edited
       manually — the preview updates live as you type. Photo is always
       this student's own admission photo, or the silhouette placeholder
       when no photo was provided (female 12+ exemption) — never another
       student's photo. Download PNG gives the card directly to the
       student (e.g. via WhatsApp); Send by Email re-sends the card
       with the edited details and saves those edits back to the
       record. Download alone does NOT change the record. */
    function openIdCardMenu(id) {
      var a = admissionsCache.find(function (x) { return x.id === id; });
      if (!a) return;
      if (a.status !== 'Admitted') {
        showToast('Approve this admission first, then use the ID Card button.', true);
        return;
      }
      var body = document.getElementById('id-card-body');
      body.innerHTML = '<p class="small">Edit any field below — the ID card preview updates live. <strong>Download PNG</strong> gives the card directly to the student and does not change the record. <strong>Send ID Card by Email</strong> sends the edited card by email and saves the edited fields back to this record.</p>' +
        '<div class="form-row">' +
          '<div class="field"><label>Name</label><input type="text" id="id-card-name" value="' + escapeHtml(a.student_name || '') + '"></div>' +
          '<div class="field"><label>Age</label><input type="text" id="id-card-age" value="' + escapeHtml(a.age || '') + '"></div>' +
        '</div>' +
        '<div class="form-row">' +
          '<div class="field"><label>Course</label><input type="text" id="id-card-course" value="' + escapeHtml(a.course || '') + '"></div>' +
          '<div class="field"><label>Country</label><input type="text" id="id-card-country" value="' + escapeHtml(a.country || '') + '" placeholder="Search country…" autocomplete="off"></div>' +
        '</div>' +
        '<div class="form-row">' +
          '<div class="field"><label>Student ID</label><input type="text" id="id-card-student-id" value="' + escapeHtml(a.student_id || '') + '"></div>' +
          '<div class="field"><label>Admission Date</label><input type="text" id="id-card-admission-date" value="' + escapeHtml(a.admission_date || '') + '"></div>' +
        '</div>' +
        '<p class="small">Photo: ' + (a.photo_data_url ? 'this student\'s own admission photo.' : 'no photo provided — the card shows the silhouette placeholder, never another student\'s photo.') + '</p>' +
        '<div style="overflow-x:auto;"><div id="id-card-preview-wrap"></div></div>' +
        '<div id="id-card-status" class="small" style="margin-top:12px;"></div>' +
        '<button class="btn btn-outline-dark btn-block" type="button" id="id-card-download-btn" style="margin-top:12px;">Download ID Card PNG</button>' +
        '<button class="btn btn-primary btn-block" type="button" id="id-card-send-btn" style="margin-top:12px;">Send ID Card by Email</button>';
      document.getElementById('id-card-overlay').classList.add('show');
      function editedRecord() {
        return {
          student_name: document.getElementById('id-card-name').value,
          age: document.getElementById('id-card-age').value,
          course: document.getElementById('id-card-course').value,
          country: document.getElementById('id-card-country').value,
          student_id: document.getElementById('id-card-student-id').value,
          admission_date: document.getElementById('id-card-admission-date').value,
          photo_data_url: a.photo_data_url || ''
        };
      }
      var croppedPhotoSrc = '';
      var cropReady = cropPhotoForCard(a.photo_data_url || '').then(function (src) { croppedPhotoSrc = src; return src; });
      function renderIdPreview() {
        var e = editedRecord();
        var wrap = document.getElementById('id-card-preview-wrap');
        if (!wrap) return;
        wrap.innerHTML = idCardPreviewHtml(e, e.student_id, e.admission_date, croppedPhotoSrc);
        var cardEl2 = document.getElementById('id-card-preview');
        if (wrap && cardEl2) {
          var avail = wrap.clientWidth || window.innerWidth;
          var scale = Math.min(1, avail / 1000);
          cardEl2.style.transform = 'scale(' + scale + ')';
          cardEl2.style.transformOrigin = 'top left';
          wrap.style.height = (739 * scale) + 'px';
        }
      }
      ['id-card-name', 'id-card-age', 'id-card-course', 'id-card-country', 'id-card-student-id', 'id-card-admission-date'].forEach(function (fid) {
        document.getElementById(fid).addEventListener('input', renderIdPreview);
      });
      // Searchable country list (Sir, 2026-10-26) — same list as the
      // public forms. Admin may still type a custom value here and
      // save it; the public forms enforce the list, the menu does not.
      if (typeof attachCountrySearch === 'function') {
        attachCountrySearch(document.getElementById('id-card-country'));
      }
      renderIdPreview();
      // Once the cropped photo is ready, re-render so the preview (and
      // any Download/Send capture from it) uses the undistorted photo.
      cropReady.then(function () { renderIdPreview(); });
      document.getElementById('id-card-download-btn').addEventListener('click', function () {
        var btn = this, statusEl = document.getElementById('id-card-status');
        if (typeof html2canvas !== 'function') { statusEl.textContent = 'ID card generator (html2canvas) is not loaded. Please reload the dashboard and try again.'; return; }
        btn.disabled = true; btn.textContent = 'Generating…';
        Promise.all([cropReady, fontsReady()]).then(function () {
          renderIdPreview();
          var cardEl = document.getElementById('id-card-preview');
          return html2canvas(cardEl, { scale: 2 });
        }).then(function (canvas) {
          var link = document.createElement('a');
          link.download = 'Al-Quranul-Academy-ID-Card-' + String(editedRecord().student_id || a.student_id || '').replace(/[^A-Za-z0-9-]/g, '') + '.png';
          link.href = canvas.toDataURL('image/png');
          document.body.appendChild(link); link.click(); document.body.removeChild(link);
          statusEl.textContent = 'ID card PNG downloaded. The record was not changed.';
          btn.disabled = false; btn.textContent = 'Download ID Card PNG';
        }).catch(function (err) {
          statusEl.textContent = 'Download failed: ' + (err && err.message ? err.message : err);
          btn.disabled = false; btn.textContent = 'Download ID Card PNG';
        });
      });
      document.getElementById('id-card-send-btn').addEventListener('click', function () {
        var btn = this, statusEl = document.getElementById('id-card-status');
        if (typeof html2canvas !== 'function') { statusEl.textContent = 'ID card generator (html2canvas) is not loaded. Please reload the dashboard and try again.'; return; }
        btn.disabled = true; btn.textContent = 'Sending…';
        var e = editedRecord();
        Promise.all([cropReady, fontsReady()]).then(function () {
          renderIdPreview();
          var cardEl = document.getElementById('id-card-preview');
          return html2canvas(cardEl, { scale: 2 });
        }).then(function (canvas) {
          var png = canvas.toDataURL('image/png');
          var payload = {
            form_type: 'admission_approve',
            student_name: e.student_name || '',
            email: a.email || '',
            course: e.course || '',
            country: e.country || '',
            student_id: e.student_id || '',
            admission_date: e.admission_date || '',
            id_card_png_base64: png
          };
          return fetch(ADMISSIONS_ENDPOINT, { method: 'POST', redirect: 'follow', headers: { 'Accept': 'application/json' }, body: JSON.stringify(payload) })
            .then(function (res) { if (!res.ok) throw new Error('Server responded with status ' + res.status); return res.json(); })
            .then(function (result) {
              if (!result || result.success !== true) throw new Error((result && (result.error || result.message)) || 'Apps Script did not confirm the ID card email.');
              return update(ref(db, 'admissions/' + id), { student_name: e.student_name, age: e.age, course: e.course, country: e.country, student_id: e.student_id, admission_date: e.admission_date });
            });
        }).then(function () {
          statusEl.textContent = 'ID card sent by email to ' + (a.email || '') + ', and the edited fields were saved to this record.';
          showToast('ID card sent by email.');
          btn.disabled = false; btn.textContent = 'Send ID Card by Email';
        }).catch(function (err) {
          statusEl.textContent = 'Send failed: ' + (err && err.message ? err.message : err) + ' The record was not changed.';
          showToast('ID card send failed. Please try again.', true);
          btn.disabled = false; btn.textContent = 'Send ID Card by Email';
        });
      });
    }

    window.__openAdmission = function (id) {
      document.querySelector('.admin-tab-btn[data-tab="admissions"]').click();
      setTimeout(function () { openAdmissionDetail(id); }, 50);
    };
  }

  // ---------------------------------------------------------------------
  // NOTIFICATION BELL — aggregates unread Free Trial bookings and unread,
  // non-archived Contact messages (read !== true on either; archived
  // Contact messages are excluded so they disappear from active
  // notifications without being deleted), reusing bookingsCache /
  // contactMessagesCache already populated by initBookings() /
  // initContactMessages() above rather than fetching anything twice.
  // renderNotifications() is called from both of those onValue callbacks
  // so the bell always reflects live Firebase state with no page reload.
  // ---------------------------------------------------------------------
  function initNotifications() {
    var bellBtn = document.getElementById('notif-bell-btn');
    var dropdown = document.getElementById('notif-dropdown');
    var markAllBtn = document.getElementById('notif-mark-all-read');
    if (!bellBtn || !dropdown) return;

    bellBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });
    document.addEventListener('click', function (e) {
      if (dropdown.classList.contains('show') && !dropdown.contains(e.target) && e.target !== bellBtn) {
        dropdown.classList.remove('show');
      }
    });

    markAllBtn.addEventListener('click', function () {
      var updates = {};
      bookingsCache.forEach(function (b) { if (b.read !== true) updates['bookings/' + b.id + '/read'] = true; });
      contactMessagesCache.forEach(function (m) { if (m.read !== true) updates['contactMessages/' + m.id + '/read'] = true; });
      if (!Object.keys(updates).length) return;
      update(ref(db), updates)
        .then(function () { showToast('All notifications marked as read.'); })
        .catch(function () { showToast('Could not update notifications. Please try again.', true); });
    });

    renderNotifications();
  }

  function renderNotifications() {
    var badge = document.getElementById('notif-badge');
    var list = document.getElementById('notif-list');
    if (!badge || !list) return; // bell not in the DOM yet on first cache population — safe no-op

    var bookingNotifs = bookingsCache.map(function (b) {
      return {
        type: 'Free Trial', kind: 'booking', id: b.id,
        title: b.student_name || 'New booking',
        meta: b.createdAt ? new Date(b.createdAt).toLocaleString() : '',
        createdAt: b.createdAt || 0,
        unread: b.read !== true
      };
    });
    var messageNotifs = contactMessagesCache
      .filter(function (m) { return !m.archived; }) // archived items must disappear from active notifications
      .map(function (m) {
        return {
          type: 'Contact', kind: 'message', id: m.id,
          title: m.name || 'New message',
          meta: m.createdAt ? new Date(m.createdAt).toLocaleString() : '',
          createdAt: m.createdAt || 0,
          unread: m.read !== true
        };
      });

    var all = bookingNotifs.concat(messageNotifs).sort(function (a, b) { return b.createdAt - a.createdAt; });
    var unreadCount = all.filter(function (n) { return n.unread; }).length;

    badge.textContent = unreadCount > 99 ? '99+' : String(unreadCount);
    badge.style.display = unreadCount > 0 ? 'flex' : 'none';

    var recent = all.slice(0, 15); // most recent 15 keeps the dropdown short and scannable
    if (!recent.length) {
      list.innerHTML = '<div class="notif-empty">No notifications yet.</div>';
      return;
    }

    list.innerHTML = recent.map(function (n) {
      return '<a class="notif-item' + (n.unread ? ' unread' : '') + '" data-notif-kind="' + n.kind + '" data-notif-id="' + n.id + '" href="javascript:void(0)">' +
        '<div class="notif-item-top">' +
          (n.unread ? '<span class="notif-item-dot"></span>' : '') +
          '<span class="notif-item-type">' + n.type + '</span>' +
        '</div>' +
        '<div class="notif-item-title">' + escapeHtml(n.title) + '</div>' +
        '<div class="notif-item-meta">' + escapeHtml(n.meta) + '</div>' +
      '</a>';
    }).join('');

    list.querySelectorAll('[data-notif-id]').forEach(function (el) {
      el.addEventListener('click', function () {
        var kind = el.getAttribute('data-notif-kind');
        var id = el.getAttribute('data-notif-id');
        var node = kind === 'booking' ? 'bookings' : 'contactMessages';

        update(ref(db, node + '/' + id), { read: true }).catch(function () { /* non-critical */ });

        document.getElementById('notif-dropdown').classList.remove('show');
        if (kind === 'booking' && typeof window.__openBooking === 'function') {
          window.__openBooking(id);
        } else if (kind === 'message' && typeof window.__openContactMessage === 'function') {
          window.__openContactMessage(id);
        }
      });
    });
  }

  // ---------------------------------------------------------------------
  // COURSES
  // ---------------------------------------------------------------------
  var coursesCache = [];

  function initCourses() {
    var listEl = document.getElementById('courses-list');
    var overlay = document.getElementById('course-form-overlay');
    var form = document.getElementById('course-form');

    onValue(ref(db, 'courses'), function (snap) {
      coursesCache = objectToEntries(snap.val());
      coursesCache.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
      renderCourses();
    }, function () {
      listEl.innerHTML = '<p class="small">Could not load courses. Check your connection and Firebase security rules.</p>';
    });

    function renderCourses() {
      if (!coursesCache.length) {
        listEl.innerHTML = '<p class="small">No courses yet — click "+ Add Course" to create one.</p>';
        return;
      }
      listEl.innerHTML = coursesCache.map(function (c) {
        return '<div class="admin-item-card">' +
          '<div class="admin-item-info">' +
            '<h4>' + escapeHtml(c.title) + ' <span class="pub-badge ' + (c.published ? 'pub-yes">Published' : 'pub-no">Draft') + '</span></h4>' +
            '<p>' + escapeHtml(c.tagline || '') + ' &middot; ' + escapeHtml(c.duration || '') + ' &middot; slug: ' + escapeHtml(c.slug || '') + '</p>' +
          '</div>' +
          '<div class="admin-item-actions">' +
            '<button class="btn btn-outline-dark btn-sm" data-edit-course="' + c.id + '" type="button">Edit</button>' +
            '<button class="btn btn-outline-dark btn-sm" data-toggle-course="' + c.id + '" type="button">' + (c.published ? 'Unpublish' : 'Publish') + '</button>' +
            '<button class="btn btn-sm btn-danger" data-delete-course="' + c.id + '" type="button">Delete</button>' +
          '</div>' +
        '</div>';
      }).join('');

      listEl.querySelectorAll('[data-edit-course]').forEach(function (btn) {
        btn.addEventListener('click', function () { openCourseForm(btn.getAttribute('data-edit-course')); });
      });
      listEl.querySelectorAll('[data-toggle-course]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-toggle-course');
          var course = coursesCache.find(function (c) { return c.id === id; });
          update(ref(db, 'courses/' + id), { published: !(course && course.published) })
            .then(function () { showToast('Course updated.'); })
            .catch(function () { showToast('Could not update course.', true); });
        });
      });
      listEl.querySelectorAll('[data-delete-course]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-delete-course');
          if (!confirm('Delete this course permanently? This cannot be undone.')) return;
          remove(ref(db, 'courses/' + id))
            .then(function () { showToast('Course deleted.'); })
            .catch(function () { showToast('Could not delete course.', true); });
        });
      });
    }

    function openCourseForm(id) {
      form.reset();
      document.getElementById('course-image-preview').classList.remove('show');
      document.getElementById('course-image-url').value = '';
      if (id) {
        var c = coursesCache.find(function (x) { return x.id === id; });
        if (!c) return;
        document.getElementById('course-form-title').textContent = 'Edit Course';
        document.getElementById('course-id').value = c.id;
        document.getElementById('course-title').value = c.title || '';
        document.getElementById('course-slug').value = c.slug || '';
        document.getElementById('course-tagline').value = c.tagline || '';
        document.getElementById('course-icon').value = c.icon || 'book';
        document.getElementById('course-order').value = c.order || 0;
        document.getElementById('course-duration').value = c.duration || '';
        document.getElementById('course-level').value = c.level || '';
        document.getElementById('course-overview').value = c.overview || '';
        document.getElementById('course-outcomes').value = Array.isArray(c.outcomes) ? c.outcomes.join('\n') : '';
        document.getElementById('course-who').value = c.who || '';
        document.getElementById('course-format').value = c.format || '';
        document.getElementById('course-published').checked = !!c.published;
        if (c.image) {
          document.getElementById('course-image-url').value = c.image;
          var prev = document.getElementById('course-image-preview');
          prev.src = c.image;
          prev.classList.add('show');
        }
      } else {
        document.getElementById('course-form-title').textContent = 'Add Course';
        document.getElementById('course-id').value = '';
        document.getElementById('course-order').value = coursesCache.length;
      }
      overlay.classList.add('show');
    }

    document.getElementById('add-course-btn').addEventListener('click', function () { openCourseForm(null); });

    var titleInput = document.getElementById('course-title');
    var slugInput = document.getElementById('course-slug');
    titleInput.addEventListener('blur', function () {
      if (!slugInput.value) slugInput.value = slugify(titleInput.value);
    });

    setupImageUpload('course-image-input', 'course-image-preview', 'course-upload-progress', 'course-image-url', 'course-slug');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var id = document.getElementById('course-id').value;
      var slug = slugify(document.getElementById('course-slug').value);
      if (!slug) { showToast('Please enter a valid slug.', true); return; }

      var data = {
        title: document.getElementById('course-title').value.trim(),
        slug: slug,
        tagline: document.getElementById('course-tagline').value.trim(),
        icon: document.getElementById('course-icon').value,
        order: parseInt(document.getElementById('course-order').value, 10) || 0,
        duration: document.getElementById('course-duration').value.trim(),
        level: document.getElementById('course-level').value.trim(),
        overview: document.getElementById('course-overview').value.trim(),
        outcomes: document.getElementById('course-outcomes').value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean),
        who: document.getElementById('course-who').value.trim(),
        format: document.getElementById('course-format').value.trim(),
        published: document.getElementById('course-published').checked,
        image: document.getElementById('course-image-url').value || null,
        updatedAt: Date.now()
      };

      var saveBtn = document.getElementById('course-save-btn');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving…';

      var savePromise = id ? update(ref(db, 'courses/' + id), data) : push(ref(db, 'courses'), data);
      savePromise
        .then(function () {
          overlay.classList.remove('show');
          showToast('Course saved.');
        })
        .catch(function () {
          showToast('Could not save course. Please try again.', true);
        })
        .finally(function () {
          saveBtn.disabled = false;
          saveBtn.textContent = 'Save Course';
        });
    });
  }

  // ---------------------------------------------------------------------
  // BLOG POSTS
  // ---------------------------------------------------------------------
  var blogCache = [];

  function initBlog() {
    var listEl = document.getElementById('blog-list');
    var overlay = document.getElementById('blog-form-overlay');
    var form = document.getElementById('blog-form');

    onValue(ref(db, 'blogPosts'), function (snap) {
      blogCache = objectToEntries(snap.val());
      blogCache.sort(function (a, b) { return (b.timestamp || 0) - (a.timestamp || 0); });
      renderBlog();
    }, function () {
      listEl.innerHTML = '<p class="small">Could not load blog posts. Check your connection and Firebase security rules.</p>';
    });

    function renderBlog() {
      if (!blogCache.length) {
        listEl.innerHTML = '<p class="small">No blog posts yet — click "+ Add Blog Post" to create one.</p>';
        return;
      }
      listEl.innerHTML = blogCache.map(function (p) {
        return '<div class="admin-item-card">' +
          '<div class="admin-item-info">' +
            '<h4>' + escapeHtml(p.title) + ' <span class="pub-badge ' + (p.published ? 'pub-yes">Published' : 'pub-no">Draft') + '</span></h4>' +
            '<p>' + escapeHtml(p.category || '') + ' &middot; ' + escapeHtml(p.date || '') + ' &middot; slug: ' + escapeHtml(p.slug || '') + '</p>' +
          '</div>' +
          '<div class="admin-item-actions">' +
            '<button class="btn btn-outline-dark btn-sm" data-edit-blog="' + p.id + '" type="button">Edit</button>' +
            '<button class="btn btn-outline-dark btn-sm" data-toggle-blog="' + p.id + '" type="button">' + (p.published ? 'Unpublish' : 'Publish') + '</button>' +
            '<button class="btn btn-sm btn-danger" data-delete-blog="' + p.id + '" type="button">Delete</button>' +
          '</div>' +
        '</div>';
      }).join('');

      listEl.querySelectorAll('[data-edit-blog]').forEach(function (btn) {
        btn.addEventListener('click', function () { openBlogForm(btn.getAttribute('data-edit-blog')); });
      });
      listEl.querySelectorAll('[data-toggle-blog]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-toggle-blog');
          var post = blogCache.find(function (p) { return p.id === id; });
          update(ref(db, 'blogPosts/' + id), { published: !(post && post.published) })
            .then(function () { showToast('Blog post updated.'); })
            .catch(function () { showToast('Could not update blog post.', true); });
        });
      });
      listEl.querySelectorAll('[data-delete-blog]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-delete-blog');
          if (!confirm('Delete this blog post permanently? This cannot be undone.')) return;
          remove(ref(db, 'blogPosts/' + id))
            .then(function () { showToast('Blog post deleted.'); })
            .catch(function () { showToast('Could not delete blog post.', true); });
        });
      });
    }

    function openBlogForm(id) {
      form.reset();
      document.getElementById('blog-image-preview').classList.remove('show');
      document.getElementById('blog-image-url').value = '';
      form.dataset.existingTimestamp = '';
      if (id) {
        var p = blogCache.find(function (x) { return x.id === id; });
        if (!p) return;
        document.getElementById('blog-form-title').textContent = 'Edit Blog Post';
        document.getElementById('blog-id').value = p.id;
        document.getElementById('blog-title').value = p.title || '';
        document.getElementById('blog-slug').value = p.slug || '';
        document.getElementById('blog-category').value = p.category || '';
        document.getElementById('blog-date').value = p.date || '';
        document.getElementById('blog-read').value = p.read || '';
        document.getElementById('blog-excerpt').value = p.excerpt || '';
        document.getElementById('blog-body').value = Array.isArray(p.body) ? p.body.join('\n\n') : '';
        document.getElementById('blog-published').checked = !!p.published;
        form.dataset.existingTimestamp = p.timestamp || '';
        if (p.image) {
          document.getElementById('blog-image-url').value = p.image;
          var prev = document.getElementById('blog-image-preview');
          prev.src = p.image;
          prev.classList.add('show');
        }
      } else {
        document.getElementById('blog-form-title').textContent = 'Add Blog Post';
        document.getElementById('blog-id').value = '';
      }
      overlay.classList.add('show');
    }

    document.getElementById('add-blog-btn').addEventListener('click', function () { openBlogForm(null); });

    var btitleInput = document.getElementById('blog-title');
    var bslugInput = document.getElementById('blog-slug');
    btitleInput.addEventListener('blur', function () {
      if (!bslugInput.value) bslugInput.value = slugify(btitleInput.value);
    });

    setupImageUpload('blog-image-input', 'blog-image-preview', 'blog-upload-progress', 'blog-image-url', 'blog-slug');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var id = document.getElementById('blog-id').value;
      var slug = slugify(document.getElementById('blog-slug').value);
      if (!slug) { showToast('Please enter a valid slug.', true); return; }

      var data = {
        title: document.getElementById('blog-title').value.trim(),
        slug: slug,
        category: document.getElementById('blog-category').value.trim(),
        date: document.getElementById('blog-date').value.trim(),
        read: document.getElementById('blog-read').value.trim(),
        excerpt: document.getElementById('blog-excerpt').value.trim(),
        body: document.getElementById('blog-body').value.split(/\n\s*\n/).map(function (s) { return s.trim(); }).filter(Boolean),
        published: document.getElementById('blog-published').checked,
        image: document.getElementById('blog-image-url').value || null,
        timestamp: form.dataset.existingTimestamp ? parseInt(form.dataset.existingTimestamp, 10) : Date.now(),
        updatedAt: Date.now()
      };

      var saveBtn = document.getElementById('blog-save-btn');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving…';

      var savePromise = id ? update(ref(db, 'blogPosts/' + id), data) : push(ref(db, 'blogPosts'), data);
      savePromise
        .then(function () {
          overlay.classList.remove('show');
          showToast('Blog post saved.');
        })
        .catch(function () {
          showToast('Could not save blog post. Please try again.', true);
        })
        .finally(function () {
          saveBtn.disabled = false;
          saveBtn.textContent = 'Save Blog Post';
        });
    });
  }

  // ---------------------------------------------------------------------
  // NOTICES
  // ---------------------------------------------------------------------
  var noticesCache = [];

  function initNotices() {
    var listEl = document.getElementById('notices-list');
    var overlay = document.getElementById('notice-form-overlay');
    var form = document.getElementById('notice-form');

    onValue(ref(db, 'notices'), function (snap) {
      noticesCache = objectToEntries(snap.val());
      noticesCache.sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
      renderNotices();
    }, function () {
      listEl.innerHTML = '<p class="small">Could not load notices. Check your connection and Firebase security rules.</p>';
    });

    function renderNotices() {
      if (!noticesCache.length) {
        listEl.innerHTML = '<p class="small">No notices yet — click "+ Add Notice" to publish one.</p>';
        return;
      }
      listEl.innerHTML = noticesCache.map(function (n) {
        var dateStr = n.createdAt ? new Date(n.createdAt).toLocaleDateString() : '';
        return '<div class="admin-item-card">' +
          '<div class="admin-item-info">' +
            '<h4>' + (n.active ? '<span class="pub-badge pub-yes">Active</span>' : '<span class="pub-badge pub-no">Inactive</span>') + '</h4>' +
            '<p>' + escapeHtml(n.text) + '</p>' +
            '<p style="margin-top:4px;">' + escapeHtml(dateStr) + '</p>' +
          '</div>' +
          '<div class="admin-item-actions">' +
            '<button class="btn btn-outline-dark btn-sm" data-toggle-notice="' + n.id + '" type="button">' + (n.active ? 'Deactivate' : 'Activate') + '</button>' +
            '<button class="btn btn-sm btn-danger" data-delete-notice="' + n.id + '" type="button">Delete</button>' +
          '</div>' +
        '</div>';
      }).join('');

      listEl.querySelectorAll('[data-toggle-notice]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-toggle-notice');
          var notice = noticesCache.find(function (n) { return n.id === id; });
          update(ref(db, 'notices/' + id), { active: !(notice && notice.active) })
            .then(function () { showToast('Notice updated.'); })
            .catch(function () { showToast('Could not update notice.', true); });
        });
      });
      listEl.querySelectorAll('[data-delete-notice]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-delete-notice');
          if (!confirm('Delete this notice permanently?')) return;
          remove(ref(db, 'notices/' + id))
            .then(function () { showToast('Notice deleted.'); })
            .catch(function () { showToast('Could not delete notice.', true); });
        });
      });
    }

    document.getElementById('add-notice-btn').addEventListener('click', function () {
      form.reset();
      document.getElementById('notice-active').checked = true;
      overlay.classList.add('show');
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var text = document.getElementById('notice-text').value.trim();
      if (!text) return;

      var saveBtn = document.getElementById('notice-save-btn');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving…';

      push(ref(db, 'notices'), {
        text: text,
        active: document.getElementById('notice-active').checked,
        createdAt: Date.now()
      })
        .then(function () {
          overlay.classList.remove('show');
          showToast('Notice saved.');
        })
        .catch(function () {
          showToast('Could not save notice. Please try again.', true);
        })
        .finally(function () {
          saveBtn.disabled = false;
          saveBtn.textContent = 'Save Notice';
        });
    });
  }

  // ---------------------------------------------------------------------
  // Shared image upload helper (Firebase Storage)
  // ---------------------------------------------------------------------
  function setupImageUpload(inputId, previewId, progressId, urlFieldId, slugFieldId) {
    var input = document.getElementById(inputId);
    var preview = document.getElementById(previewId);
    var progress = document.getElementById(progressId);
    var urlField = document.getElementById(urlFieldId);

    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (!file) return;

      if (!window.firebaseStorage) {
        showToast('Firebase Storage is not set up for this project — enable it in the Firebase Console to upload images.', true);
        input.value = '';
        return;
      }

      var slugEl = document.getElementById(slugFieldId);
      var namePart = slugify(slugEl ? slugEl.value : '') || 'image';
      var path = 'uploads/' + namePart + '-' + Date.now() + '-' + file.name.replace(/\s+/g, '-');

      progress.classList.add('show');
      progress.textContent = 'Uploading…';

      var storageReference = fbfns.storageRef(window.firebaseStorage, path);
      fbfns.uploadBytes(storageReference, file)
        .then(function (snapshot) { return fbfns.getDownloadURL(snapshot.ref); })
        .then(function (url) {
          urlField.value = url;
          preview.src = url;
          preview.classList.add('show');
          progress.classList.remove('show');
          showToast('Image uploaded.');
        })
        .catch(function () {
          progress.classList.remove('show');
          showToast('Image upload failed. Please try again.', true);
        });
    });
  }

})();
