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
      });
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
      tbody.innerHTML = '<tr class="admin-empty-row"><td colspan="12">Could not load bookings. Check your connection and Firebase security rules.</td></tr>';
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
        tbody.innerHTML = '<tr class="admin-empty-row"><td colspan="12">No bookings match your search.</td></tr>';
        return;
      }

      tbody.innerHTML = rows.map(function (b) {
        var dateStr = b.createdAt ? new Date(b.createdAt).toLocaleString() : '—';
        var status = b.status || 'Pending';
        var isUnread = b.read !== true;
        return '<tr class="' + (isUnread ? 'msg-unread' : '') + '" data-booking-row="' + b.id + '">' +
          '<td class="cell-nowrap"><strong>' + escapeHtml(b.bookingId || '—') + '</strong></td>' +
          '<td class="cell-nowrap">' + unreadDotHtml(isUnread) + escapeHtml(dateStr) + '</td>' +
          '<td>' + escapeHtml(b.student_name) + '</td>' +
          '<td>' + escapeHtml(b.age) + '</td>' +
          '<td>' + escapeHtml(b.country) + '</td>' +
          '<td>' + escapeHtml(b.whatsapp_number) + '</td>' +
          '<td class="cell-wrap">' + escapeHtml(b.email) + '</td>' +
          '<td>' + escapeHtml(b.teacher_preference) + '</td>' +
          '<td>' + escapeHtml(b.preferred_class_time) + '</td>' +
          '<td style="max-width:220px;">' + escapeHtml(b.message) + '</td>' +
          '<td><select data-booking-id="' + b.id + '" class="booking-status-select">' +
            ['Pending', 'Contacted', 'Admitted', 'Cancelled'].map(function (s) {
              return '<option value="' + s + '"' + (s === status ? ' selected' : '') + '>' + s + '</option>';
            }).join('') +
          '</select></td>' +
          '<td style="white-space:nowrap;">' +
            '<button class="btn btn-outline-dark btn-sm" data-toggle-booking-read="' + b.id + '" type="button" style="margin-right:6px;">' + (isUnread ? 'Mark Read' : 'Mark Unread') + '</button>' +
            '<button class="btn btn-sm" style="background:#FBEAEA;color:#9B2C2C;" data-delete-booking="' + b.id + '" type="button">Delete</button>' +
          '</td>' +
        '</tr>';
      }).join('');

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

    // Jump here from a notification click: switch to this tab, then
    // flash-highlight the row so it's easy to find.
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
      tbody.innerHTML = '<tr class="admin-empty-row"><td colspan="7">Could not load messages. Check your connection and Firebase security rules.</td></tr>';
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

    function renderContactMessages() {
      var rows = filteredMessages();

      if (!rows.length) {
        tbody.innerHTML = '<tr class="admin-empty-row"><td colspan="7">No messages match your search.</td></tr>';
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
          '<td class="cell-nowrap">' + unreadDotHtml(isUnread) + escapeHtml(dateStr) + '</td>' +
          '<td>' + escapeHtml(m.name) + '</td>' +
          '<td class="cell-wrap">' + escapeHtml(m.email) + '</td>' +
          '<td>' + escapeHtml(m.subject) + '</td>' +
          '<td style="max-width:260px;">' + escapeHtml(m.message) + '</td>' +
          '<td>' + statusHtml + '</td>' +
          '<td style="white-space:nowrap;">' +
            '<a class="btn btn-outline-dark btn-sm" href="mailto:' + encodeURIComponent(m.email || '') + '?subject=' + encodeURIComponent('Re: ' + (m.subject || 'Your message to Al Quranul Academy')) + '" style="margin-right:6px;">Reply</a>' +
            '<button class="btn btn-outline-dark btn-sm" data-toggle-read="' + m.id + '" type="button" style="margin-right:6px;">' + (isUnread ? 'Mark Read' : 'Mark Unread') + '</button>' +
            '<button class="btn btn-outline-dark btn-sm" data-toggle-archive="' + m.id + '" type="button" style="margin-right:6px;">' + (m.archived ? 'Unarchive' : 'Archive') + '</button>' +
            '<button class="btn btn-sm" style="background:#FBEAEA;color:#9B2C2C;" data-delete-message="' + m.id + '" type="button">Delete</button>' +
          '</td>' +
        '</tr>';
      }).join('');

      tbody.querySelectorAll('[data-toggle-read]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-toggle-read');
          var msg = contactMessagesCache.find(function (m) { return m.id === id; });
          update(ref(db, 'contactMessages/' + id), { read: !(msg && msg.read === true) })
            .catch(function () { showToast('Could not update message. Please try again.', true); });
        });
      });

      tbody.querySelectorAll('[data-toggle-archive]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-toggle-archive');
          var msg = contactMessagesCache.find(function (m) { return m.id === id; });
          update(ref(db, 'contactMessages/' + id), { archived: !(msg && msg.archived) })
            .then(function () { showToast(msg && msg.archived ? 'Message unarchived.' : 'Message archived.'); })
            .catch(function () { showToast('Could not update message. Please try again.', true); });
        });
      });

      tbody.querySelectorAll('[data-delete-message]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-delete-message');
          if (!confirm('Delete this message permanently? This cannot be undone.')) return;
          remove(ref(db, 'contactMessages/' + id))
            .then(function () {
              contactMessagesCache = contactMessagesCache.filter(function (m) { return m.id !== id; });
              renderContactMessages();
              renderNotifications();
              showToast('Message deleted.');
            })
            .catch(function () { showToast('Could not delete message. Please try again.', true); });
        });
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

    // Jump here from a notification click: switch to this tab, filter to
    // show every message (in case it's archived), then flash-highlight
    // the row so it's easy to find.
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
      }, 50);
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
            '<button class="btn btn-sm" style="background:#FBEAEA;color:#9B2C2C;" data-delete-course="' + c.id + '" type="button">Delete</button>' +
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
            '<button class="btn btn-sm" style="background:#FBEAEA;color:#9B2C2C;" data-delete-blog="' + p.id + '" type="button">Delete</button>' +
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
            '<button class="btn btn-sm" style="background:#FBEAEA;color:#9B2C2C;" data-delete-notice="' + n.id + '" type="button">Delete</button>' +
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
