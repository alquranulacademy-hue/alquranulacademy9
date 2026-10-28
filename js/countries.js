// =====================================================
// AL QURANUL ACADEMY — searchable country list
// Sir, 2026-10-26: country must NOT be free-typed any more.
// Every place a country is entered (Free Trial form, Admission
// form, ID Card menu in the dashboard) gets the same searchable
// list: tap the field to see the full scrollable list, or type
// the first letters (e.g. "Ca" -> Canada, Cameroon, Cambodia;
// "US" -> United States, "UK" -> United Kingdom) and tap the
// matching country to fill it in automatically. The input keeps
// its original name/id, so the existing form handlers, Apps
// Script payloads and Firebase records are unchanged — only the
// way the value is picked changes.
// =====================================================
(function () {
  var COUNTRIES = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola',
    'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
    'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin',
    'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria',
    'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'Cape Verde',
    'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo',
    'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti',
    'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea',
    'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon',
    'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea',
    'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hong Kong', 'Hungary', 'Iceland',
    'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan',
    'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia',
    'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
    'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands',
    'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia',
    'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal',
    'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea',
    'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama',
    'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar',
    'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia',
    'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe',
    'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore',
    'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea',
    'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland',
    'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Tonga',
    'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda',
    'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay',
    'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
  ];
  var ALIASES = {
    'us': 'United States', 'usa': 'United States', 'america': 'United States',
    'uk': 'United Kingdom', 'uae': 'United Arab Emirates', 'emirates': 'United Arab Emirates'
  };
  window.COUNTRIES = COUNTRIES;

  function normalizeCountry(value) {
    var v = String(value || '').trim().toLowerCase();
    if (!v) return null;
    if (ALIASES[v]) return ALIASES[v];
    for (var i = 0; i < COUNTRIES.length; i++) {
      if (COUNTRIES[i].toLowerCase() === v) return COUNTRIES[i];
    }
    return null;
  }
  window.normalizeCountry = normalizeCountry;

  function matches(query, country) {
    var q = query.toLowerCase();
    var name = country.toLowerCase();
    if (name.indexOf(q) === 0) return true;
    // Alias match: "US" -> United States, "UK" -> United Kingdom, etc.
    for (var a in ALIASES) {
      if (ALIASES[a] === country && a.indexOf(q) === 0) return true;
    }
    return false;
  }

  function attachCountrySearch(input) {
    if (!input || input.getAttribute('data-country-search')) return;
    input.setAttribute('data-country-search', '1');
    input.setAttribute('autocomplete', 'off');
    var parent = input.parentElement;
    if (parent) parent.style.position = 'relative';
    var list = document.createElement('div');
    list.className = 'country-dropdown';
    list.setAttribute('role', 'listbox');
    if (parent) parent.appendChild(list);
    var activeIndex = -1;

    function render() {
      var q = input.value.trim();
      var filtered = q ? COUNTRIES.filter(function (c) { return matches(q, c); }) : COUNTRIES.slice();
      if (!filtered.length) {
        list.innerHTML = '<div class="country-empty">No country matches — please check the spelling.</div>';
      } else {
        list.innerHTML = filtered.map(function (c, i) {
          return '<button type="button" class="country-option' + (i === activeIndex ? ' active' : '') + '" data-country="' + c.replace(/"/g, '&quot;') + '">' + c + '</button>';
        }).join('');
      }
      list.classList.add('open');
    }
    function hide() { list.classList.remove('open'); activeIndex = -1; }
    function pick(country) {
      input.value = country;
      hide();
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    input.addEventListener('focus', render);
    input.addEventListener('input', function () { activeIndex = -1; render(); });
    input.addEventListener('blur', function () { setTimeout(hide, 150); });
    input.addEventListener('keydown', function (e) {
      var options = list.querySelectorAll('.country-option');
      if (e.key === 'Escape') { hide(); return; }
      if (e.key === 'ArrowDown' && options.length) {
        e.preventDefault();
        activeIndex = Math.min(activeIndex + 1, options.length - 1);
        render();
        var el = list.querySelectorAll('.country-option')[activeIndex];
        if (el) el.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'ArrowUp' && options.length) {
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, 0);
        render();
        var el2 = list.querySelectorAll('.country-option')[activeIndex];
        if (el2) el2.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' && list.classList.contains('open') && activeIndex >= 0) {
        var chosen = list.querySelectorAll('.country-option')[activeIndex];
        if (chosen) { e.preventDefault(); pick(chosen.getAttribute('data-country')); }
      }
    });
    // mousedown (not click) so the pick lands before blur hides the list.
    list.addEventListener('mousedown', function (e) {
      var btn = e.target.closest ? e.target.closest('.country-option') : null;
      if (btn) { e.preventDefault(); pick(btn.getAttribute('data-country')); }
    });
    document.addEventListener('click', function (e) {
      if (e.target !== input && !list.contains(e.target)) hide();
    });
  }
  window.attachCountrySearch = attachCountrySearch;

  function attachAllCountryInputs() {
    document.querySelectorAll('input[name="country"], input#id-card-country').forEach(function (el) {
      attachCountrySearch(el);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachAllCountryInputs);
  } else {
    attachAllCountryInputs();
  }
})();
