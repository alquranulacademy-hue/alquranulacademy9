// =====================================================================
// AL QURANUL ACADEMY — public site Firebase hydration
// =====================================================================
// Loads AFTER main.js on purpose: main.js already fills every page with
// working static content (course/blog details from its own COURSES /
// BLOG_POSTS objects, plus the four static course cards and six static
// blog cards baked into courses.html / blog.html at build time).
//
// This file's only job is to *optionally upgrade* that static content
// with live data from Firebase Realtime Database, if and when it's
// available — so:
//   • If Firebase isn't configured yet, or the network request fails,
//     or there's simply no data yet in the database — nothing changes.
//     The page looks and behaves exactly as it did before Firebase
//     existed.
//   • If an admin has added/edited/published content in the dashboard,
//     visitors see the fresh version, seamlessly, once Firebase answers.
// =====================================================================

(function () {
  var db = window.firebaseDB;
  var fbfns = window.fb;

  if (!db || !fbfns) {
    // Firebase not configured / failed to init — static content (already
    // rendered by main.js and the pre-built HTML) stays exactly as is.
    return;
  }

  var ref = fbfns.ref, get = fbfns.get, query = fbfns.query,
      orderByChild = fbfns.orderByChild, equalTo = fbfns.equalTo;

  var currentPage = document.body.getAttribute('data-page');

  // Small icon set matching the ones used at build time (css/generate.py
  // LICONS) so admin-added courses render with the same visual style.
  var ICONS = {
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z"/></svg>',
    'book-open': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5h6a3 3 0 0 1 3 3v11a2.5 2.5 0 0 0-2.5-2.5H2z"/><path d="M22 5h-6a3 3 0 0 0-3 3v11a2.5 2.5 0 0 1 2.5-2.5H22z"/></svg>',
    sparkle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 5.3L19 10l-5.1 1.7L12 17l-1.9-5.3L5 10l5.1-1.7z"/><path d="M19 3l.6 1.7L21 5l-1.4.6L19 7l-.6-1.4L17 5l1.4-.3z"/></svg>',
    'heart-book': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z"/><path d="M9.5 6.8c1.1-1.3 3.4-.4 3 1.3-.3 1.3-2 2.3-3 3-1-.7-2.7-1.7-3-3-.4-1.7 1.9-2.6 3-1.3z"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.7" fill="currentColor"/></svg>'
  };
  function iconSvg(key) { return ICONS[key] || ICONS.book; }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Elements injected after DOMContentLoaded miss main.js's scroll-reveal
  // IntersectionObserver setup — mark them visible immediately so nothing
  // ever gets stuck invisible waiting on an observer that already ran.
  function markVisible(container) {
    container.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  function objectToArray(obj) {
    if (!obj) return [];
    if (Array.isArray(obj)) return obj.filter(Boolean);
    return Object.keys(obj).map(function (k) { return obj[k]; });
  }

  // ------------------------------------------------------------------
  // 1. Site notice bar (every page)
  // ------------------------------------------------------------------
  function loadNotice() {
    var bar = document.getElementById('site-notice');
    var textEl = document.getElementById('site-notice-text');
    var closeBtn = document.getElementById('site-notice-close');
    if (!bar || !textEl) return;

    get(ref(db, 'notices')).then(function (snap) {
      if (!snap.exists()) return;
      var notices = objectToArray(snap.val()).filter(function (n) { return n && n.active; });
      if (!notices.length) return;

      notices.sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
      var notice = notices[0];
      var dismissKey = 'aqa_notice_dismissed_' + (notice.id || notice.createdAt || notice.text);

      if (sessionStorage.getItem(dismissKey)) return;

      textEl.textContent = notice.text || '';
      bar.style.display = 'block';

      if (closeBtn) {
        closeBtn.addEventListener('click', function () {
          bar.style.display = 'none';
          try { sessionStorage.setItem(dismissKey, '1'); } catch (e) { /* ignore */ }
        });
      }
    }).catch(function () { /* stay hidden — no notice shown on error */ });
  }

  // ------------------------------------------------------------------
  // 2. Courses listing (courses.html)
  // ------------------------------------------------------------------
  function courseCardHtml(c) {
    var slug = encodeURIComponent(c.slug || '');
    return '' +
      '<div class="card course-card reveal">' +
        '<div class="icon-badge">' + iconSvg(c.icon) + '</div>' +
        '<h3>' + escapeHtml(c.title) + '</h3>' +
        '<p>' + escapeHtml(c.tagline || c.description || '') + '</p>' +
        '<div class="course-meta">' +
          '<span>' + iconSvg('clock') + escapeHtml(c.duration || '') + '</span>' +
          '<span>' + iconSvg('target') + escapeHtml(c.level || '') + '</span>' +
        '</div>' +
        '<div style="display:flex;gap:12px;flex-wrap:wrap;">' +
          '<a href="course-detail.html?course=' + slug + '" class="btn btn-outline-dark btn-sm">Learn More</a>' +
          '<a href="admission.html" class="btn btn-primary btn-sm">Enroll Now</a>' +
        '</div>' +
      '</div>';
  }

  function loadCoursesGrid() {
    var grid = document.getElementById('courses-grid');
    if (!grid) return;

    get(ref(db, 'courses')).then(function (snap) {
      if (!snap.exists()) return;
      var courses = objectToArray(snap.val()).filter(function (c) { return c && c.published && c.slug && c.title; });
      if (!courses.length) return;

      courses.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
      grid.innerHTML = courses.map(courseCardHtml).join('');
      markVisible(grid);
    }).catch(function () { /* keep the static cards already on the page */ });
  }

  // ------------------------------------------------------------------
  // 3. Blog listing (blog.html)
  // ------------------------------------------------------------------
  function blogCardHtml(p) {
    var slug = encodeURIComponent(p.slug || '');
    return '' +
      '<a href="blog-post.html?post=' + slug + '" class="card reveal" style="display:block;">' +
        '<span class="tag-pill">' + escapeHtml(p.category || '') + '</span>' +
        '<h3 style="font-size:19px;">' + escapeHtml(p.title) + '</h3>' +
        '<p>' + escapeHtml(p.excerpt || '') + '</p>' +
        '<div class="small" style="font-weight:700;">' + escapeHtml(p.date || '') + '</div>' +
      '</a>';
  }

  function loadBlogGrid() {
    var grid = document.getElementById('blog-grid');
    if (!grid) return;

    get(ref(db, 'blogPosts')).then(function (snap) {
      if (!snap.exists()) return;
      var posts = objectToArray(snap.val()).filter(function (p) { return p && p.published && p.slug && p.title; });
      if (!posts.length) return;

      posts.sort(function (a, b) { return (b.timestamp || 0) - (a.timestamp || 0); });
      grid.innerHTML = posts.map(blogCardHtml).join('');
      markVisible(grid);
    }).catch(function () { /* keep the static cards already on the page */ });
  }

  // ------------------------------------------------------------------
  // 4. Single course detail (course-detail.html) — upgrades the static
  //    content main.js already filled in, only if Firebase has a
  //    published match for the requested slug.
  // ------------------------------------------------------------------
  function loadCourseDetail() {
    if (typeof window.fillCourse !== 'function') return;
    var params = new URLSearchParams(window.location.search);
    var slug = params.get('course');
    if (!slug) return;

    get(query(ref(db, 'courses'), orderByChild('slug'), equalTo(slug))).then(function (snap) {
      if (!snap.exists()) return;
      var match = objectToArray(snap.val())[0];
      if (!match || !match.published) return;

      window.fillCourse({
        title: match.title,
        tagline: match.tagline,
        duration: match.duration,
        level: match.level,
        overview: match.overview,
        outcomes: objectToArray(match.outcomes),
        who: match.who,
        format: match.format
      });
    }).catch(function () { /* keep the static course content already filled in */ });
  }

  // ------------------------------------------------------------------
  // 5. Single blog post (blog-post.html) — same upgrade pattern
  // ------------------------------------------------------------------
  function loadBlogPost() {
    if (typeof window.fillPost !== 'function') return;
    var params = new URLSearchParams(window.location.search);
    var slug = params.get('post');
    if (!slug) return;

    get(query(ref(db, 'blogPosts'), orderByChild('slug'), equalTo(slug))).then(function (snap) {
      if (!snap.exists()) return;
      var match = objectToArray(snap.val())[0];
      if (!match || !match.published) return;

      window.fillPost({
        title: match.title,
        category: match.category,
        date: match.date,
        read: match.read,
        body: objectToArray(match.body)
      });
    }).catch(function () { /* keep the static post content already filled in */ });
  }

  // ------------------------------------------------------------------
  loadNotice();
  if (currentPage === 'courses') loadCoursesGrid();
  if (currentPage === 'blog') loadBlogGrid();
  if (currentPage === 'course-detail') loadCourseDetail();
  if (currentPage === 'blog-post') loadBlogPost();
})();
