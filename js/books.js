// Books library (Al Quranul Academy).
// HOW TO ADD A BOOK: append one entry to BOOKS below with the repo path
// or link of its PDF in `file`. While `file` is null the card shows
// "Coming soon" and no dead link is rendered. Categories are the tabs;
// a new category only needs one entry in CATS + the matching books.
// Titles are kept exactly as given (Arabic titles are never translated
// by i18n.js because they match no dictionary key).
// AZHAR TITLING RULE (Sir, 2026-10-29): `title` is the series main
// title, `sub` is the book's own first-page line (الكتاب + المستوى).
(function () {
  var CATS = [
    { id: 'all', label: 'All Books' },
    { id: 'azhar', label: 'Al-Azhar Books' },
    { id: 'quran', label: 'Quran' },
    { id: 'hadith', label: 'Hadith' },
    { id: 'qaida', label: 'Noorani Qaida' }
  ];

  var AZHAR_MAIN = 'لتعليم اللغة العربية للناطقين بغيرها';
  var BOOKS = [
    { title: AZHAR_MAIN, sub: 'الكتاب الأول — المستوى المبتدئ الأول', cat: 'azhar', size: '17.7 MB', file: 'books/azhar-kitab-1.pdf', cover: 'books/covers/azhar-kitab-1.jpg' },
    { title: AZHAR_MAIN, sub: 'الكتاب الثاني — المستوى المبتدئ الثاني', cat: 'azhar', size: '20.4 MB', file: 'books/azhar-kitab-2.pdf', cover: 'books/covers/azhar-kitab-2.jpg' },
    { title: AZHAR_MAIN, sub: 'الكتاب الثالث — المستوى المتوسط الأول', cat: 'azhar', size: '21.0 MB', file: 'books/azhar-kitab-3.pdf', cover: 'books/covers/azhar-kitab-3.jpg' },
    { title: AZHAR_MAIN, sub: 'الكتاب الرابع — المستوى المتوسط الثاني', cat: 'azhar', size: '16.7 MB', file: 'books/azhar-kitab-4.pdf', cover: 'books/covers/azhar-kitab-4.jpg' },
    { title: AZHAR_MAIN, sub: 'الكتاب الخامس — المستوى المتقدم الأول', cat: 'azhar', size: '17.5 MB', file: 'books/azhar-kitab-5.pdf', cover: 'books/covers/azhar-kitab-5.jpg' },
    { title: AZHAR_MAIN, sub: 'الكتاب السادس — المستوى المتقدم الثاني', cat: 'azhar', size: '19.1 MB', file: 'books/azhar-kitab-6.pdf', cover: 'books/covers/azhar-kitab-6.jpg' },
    { title: 'নাদিয়া আমপারা', cat: 'quran', size: '9.0 MB', file: 'books/nadia-ampara.pdf', cover: 'books/covers/nadia-ampara.jpg' },
    { title: 'Madani Qa\'idah', cat: 'qaida', size: '5.3 MB', file: 'books/madani-qaidah.pdf', cover: 'books/covers/madani-qaidah.jpg' },
    { title: 'কায়দায়ে নাদিয়াতুল কুরআন', cat: 'qaida', size: '3.0 MB', file: 'books/qaida-nadiatul-quran.pdf', cover: 'books/covers/qaida-nadiatul-quran.jpg' },
    { title: 'নূরানী পদ্ধতিতে কুরআন শিক্ষা', cat: 'qaida', size: '20.4 MB', file: 'books/nurani-poddhotite-quran-shikkha.pdf', cover: 'books/covers/nurani-poddhotite-quran-shikkha.jpg' },
    { title: 'কায়দায়ে বিসমিল্লাহ্‌', cat: 'qaida', size: '2.1 MB', file: 'books/qaida-bismillah.pdf', cover: 'books/covers/qaida-bismillah.jpg' }
  ];

  // Covers: repo books carry their first-page image in `cover`.
  // Dashboard-added books may carry a `cover` link. Otherwise a Drive
  // link gets Drive's automatic thumbnail (works for ordinary-size
  // files; Drive makes no thumbnail for very large files, and then
  // the onerror fallback leaves the book emoji). The emoji stays
  // behind the image, so a failed cover never shows a broken icon.
  // COVER_BY_TITLE covers dashboard-added books whose file lives
  // elsewhere (e.g. the 30 Para, Drive-linked but with a repo cover).
  var COVER_BY_TITLE = {
    'তিরিশ পারা কুরআন': 'books/covers/quran-30-para.jpg'
  };
  function coverFor(b) {
    if (b.cover) return b.cover;
    if (COVER_BY_TITLE[b.title]) return COVER_BY_TITLE[b.title];
    if (b.file) {
      var m = String(b.file).match(/drive\.google\.com\/file\/d\/([^\/\?#]+)/);
      if (m) return 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w400';
    }
    return null;
  }

  // Exposed for the dashboard (admin-dashboard.html includes this file):
  // the dashboard lists these built-in books with Hide/Show controls.
  // The public page below filters this list against the database, so
  // this reference always keeps the full list, hidden books included.
  window.AQA_BOOKS = BOOKS;

  function catLabel(id) {
    for (var i = 0; i < CATS.length; i++) {
      if (CATS[i].id === id) return CATS[i].label;
    }
    return id;
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }

  var tabsEl = document.getElementById('book-tabs');
  var gridEl = document.getElementById('books-grid');
  var emptyEl = document.getElementById('books-empty');
  if (!tabsEl || !gridEl) return;

  var active = 'all';
  try {
    var q = new URLSearchParams(window.location.search).get('cat');
    if (q && catLabel(q) !== q) active = q;
  } catch (e) { /* keep 'all' */ }

  function renderTabs() {
    tabsEl.innerHTML = '';
    CATS.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'book-tab' + (c.id === active ? ' active' : '');
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', c.id === active ? 'true' : 'false');
      b.textContent = c.label;
      b.addEventListener('click', function () {
        active = c.id;
        renderTabs();
        renderGrid();
      });
      tabsEl.appendChild(b);
    });
  }

  function renderGrid() {
    var list = active === 'all' ? BOOKS : BOOKS.filter(function (b) { return b.cat === active; });
    gridEl.innerHTML = '';
    if (emptyEl) emptyEl.hidden = list.length > 0;
    list.forEach(function (b) {
      var card = document.createElement('article');
      card.className = 'card book-card';
      var actions = b.file
        ? '<a class="btn btn-primary btn-sm" href="' + esc(b.file) + '" target="_blank" rel="noopener">Read</a>'
          + '<a class="btn btn-sm book-download" href="' + esc(b.file) + '" download>Download</a>'
        : '<button class="btn btn-sm" type="button" disabled>Coming soon</button>';
      var cover = coverFor(b);
      card.innerHTML =
        '<div class="book-cover" aria-hidden="true">\uD83D\uDCD6'
        + (cover ? '<img src="' + esc(cover) + '" alt="" loading="lazy" onerror="this.remove()">' : '')
        + '</div>'
        + '<h3>' + esc(b.title) + '</h3>'
        + (b.sub ? '<p class="book-sub">' + esc(b.sub) + '</p>' : '')
        + '<p class="book-cat">' + esc(catLabel(b.cat)) + '</p>'
        + (b.size ? '<p class="book-size">' + esc(b.size) + '</p>' : '')
        + '<div class="book-actions">' + actions + '</div>';
      gridEl.appendChild(card);
    });
  }

  // The grid stays hidden until the first render, so a book hidden from
  // the dashboard never flashes on load while the database is read.
  tabsEl.style.visibility = 'hidden';
  gridEl.style.visibility = 'hidden';
  var rendered = false;
  function renderAll() {
    if (rendered) return;
    rendered = true;
    tabsEl.style.visibility = '';
    gridEl.style.visibility = '';
    renderTabs();
    renderGrid();
  }

  // Dashboard-added books (RTDB `books` node) override/extend the list
  // above, deduplicated by exact title: re-uploading a built-in book
  // from the dashboard activates its Read/Download buttons instead of
  // showing it twice. Records with hidden:true hide that title from
  // this public page (a file-less record hides a built-in book; a
  // record with a file hides itself). Hidden books stay visible in the
  // dashboard, where Show brings them back. If Firebase is unavailable,
  // the built-in list stays.
  function mergeRtdbBooks() {
    if (!window.firebaseDB || !window.fb || !window.fb.get || !window.fb.ref) { renderAll(); return; }
    window.fb.get(window.fb.ref(window.firebaseDB, 'books')).then(function (snap) {
      var val = snap.val();
      if (val) {
        var hiddenTitles = {};
        Object.keys(val).forEach(function (id) {
          var r = val[id];
          if (r && r.title && r.hidden === true) hiddenTitles[r.title] = true;
        });
        if (Object.keys(hiddenTitles).length) {
          BOOKS = BOOKS.filter(function (b) { return !hiddenTitles[b.title]; });
        }
        Object.keys(val).forEach(function (id) {
          var r = val[id];
          if (!r || !r.title || !r.file || r.hidden === true) return;
          var found = null;
          for (var i = 0; i < BOOKS.length; i++) {
            if (BOOKS[i].title === r.title) { found = BOOKS[i]; break; }
          }
          if (found) {
            found.file = r.file;
            if (r.size) found.size = r.size;
            if (r.cat) found.cat = r.cat;
            if (r.cover) found.cover = r.cover;
          } else if (r.cat) {
            var nb = { title: r.title, cat: r.cat, size: r.size || '', file: r.file };
            if (r.cover) nb.cover = r.cover;
            BOOKS.push(nb);
          }
        });
      }
      renderAll();
    }).catch(function () { renderAll(); });
  }
  if (window.firebaseDB) {
    mergeRtdbBooks();
  } else {
    window.addEventListener('firebase-ready', mergeRtdbBooks, { once: true });
  }
  setTimeout(renderAll, 1000);
})();
