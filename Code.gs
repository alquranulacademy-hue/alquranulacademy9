/**
 * =====================================================================
 * AL QURANUL ACADEMY — Website backend (Google Apps Script)
 * =====================================================================
 *
 * Handles BOTH website forms through this one Web App deployment,
 * routed by the hidden `form_type` field sent in each request:
 *
 *   • Free Trial form (default / no form_type field):
 *       1. Generates an auto-incrementing, year-scoped Booking ID
 *          (AQA2026-0001, AQA2026-0002, ...).
 *       2. Appends a row to the "Free Trial Bookings" sheet, including
 *          the Booking ID.
 *       3. Emails the admin a premium HTML notification (includes the
 *          Booking ID), subject:
 *          "New Free Trial Booking | Al Quranul Academy"
 *       4. Emails the visitor a premium HTML confirmation — no Booking
 *          ID inside this one — unless they've already had one in the
 *          last 6 hours (see shouldSendAutoReply()), subject:
 *          "Free Trial Request Received | Al Quranul Academy"
 *
 *   • Contact form (form_type === 'contact'):
 *       1. Appends a row to the "Contact Messages" sheet (auto-created,
 *          race-condition-safe — see getOrCreateContactSheet()).
 *       2. Emails the admin a premium HTML notification, subject:
 *          "New Contact Message | Al Quranul Academy"
 *       3. Emails the visitor a premium HTML confirmation (same 6-hour
 *          cooldown), subject:
 *          "Thank You for Contacting Al Quranul Academy"
 *
 * No emoji anywhere in either email — plain text titles only, to avoid
 * the broken "????" characters some Gmail rendering paths produce.
 *
 * All outgoing mail displays as sent "from" SENDER_NAME (Gmail's From
 * display name) while still using this script's actual Gmail address —
 * no separate email account or domain verification required.
 *
 * Both admin notification emails share one template
 * (buildPremiumEmailHtml); both visitor confirmation emails share a
 * second template (buildCustomerEmailHtml) — both reuse the same
 * field-row renderer (buildFieldRowsHtml) and the same green header /
 * white rounded card / gold accent / mobile-responsive visual language.
 *
 * Every response is small JSON the website reads to show the correct
 * success/error message:
 *   { "success": true,  "message": "..." }
 *   { "success": false, "error": "..." }
 *
 * SETUP — see the full step-by-step guide in the chat response, but in short:
 *   1. Create a Google Sheet, open Extensions → Apps Script, paste this file
 *      in as Code.gs.
 *   2. Update NOTIFY_EMAIL and SITE_URL below.
 *   3. Deploy → New deployment → Web app → Execute as "Me", Who has
 *      access "Anyone" → Deploy. Copy the /exec URL.
 *   4. Paste that URL into free-trial.html's and contact.html's
 *      `data-endpoint="..."` attribute.
 * =====================================================================
 */

// ---- CONFIGURE ME -------------------------------------------------
var NOTIFY_EMAIL = 'alquranulacademy@gmail.com'; // where booking notifications are sent
var SHEET_NAME = 'Free Trial Bookings';
var SITE_NAME = 'Al Quranul Academy';
var SITE_URL = 'https://www.alquranulacademy.com'; // used for the email logo + footer link
var SENDER_NAME = 'Al Quranul Academy'; // Gmail "From" display name (address stays NOTIFY_EMAIL's account)
var WHATSAPP_URL = 'https://wa.me/201551426055';
var FACEBOOK_URL = 'https://www.facebook.com/alquranulacademy/';
var AUTO_REPLY_COOLDOWN_SECONDS = 21600; // 6 hours — also CacheService's own maximum

// Shared email design system — one source of truth for both the admin
// notification template and the visitor confirmation template, so they
// stay visually consistent and colors/fonts never drift apart or get
// re-typed in more than one place.
var EMAIL_THEME = {
  green: '#0B6B3A',
  greenDark: '#0B3D26',
  gold: '#E8C96B',
  cream: '#F6F1E6',
  creamLight: '#FBF8F1',
  border: '#EFEAE0',
  ink: '#1F2A24',
  inkSoft: '#4C5F55',
  white: '#FFFFFF',
  fontBody: 'Arial, Helvetica, sans-serif',
  fontHeading: 'Georgia, serif',
  radius: '18px',
  cardWidth: '560px'
};
// ---------------------------------------------------------------------

var SHEET_HEADERS = [
  'Booking ID',
  'Submission Date & Time',
  'Student Name',
  'Age',
  'Country',
  'WhatsApp Number',
  'Email',
  'Teacher Preference',
  'Preferred Class Time',
  'Message'
];

/**
 * Handles POST requests from the website's Free Trial form.
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ success: false, error: 'No data received.' });
    }

    var data = JSON.parse(e.postData.contents);

    // Route Contact form submissions to their own handler, added below.
    // Everything from this point down is the original, unmodified
    // Free Trial flow — untouched.
    if (data.form_type === 'contact') {
      return handleContactSubmission(data);
    }

    // Honeypot: if the hidden "_honey" field was filled in, it's a bot.
    // Pretend success without writing anything or sending an email.
    if (data._honey) {
      return jsonResponse({ success: true, message: 'Submission received successfully.' });
    }

    // Basic server-side validation of required fields (defence in depth —
    // the website already validates these, but never trust the client alone).
    var required = ['student_name', 'age', 'country', 'whatsapp_number', 'email'];
    for (var i = 0; i < required.length; i++) {
      if (!data[required[i]] || String(data[required[i]]).trim() === '') {
        return jsonResponse({ success: false, error: 'Missing required field: ' + required[i] });
      }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return jsonResponse({ success: false, error: 'Invalid email address.' });
    }

    var timestamp = new Date();
    var bookingId = getNextBookingId();

    appendToSheet(data, timestamp, bookingId);
    sendNotificationEmail(data, timestamp, bookingId);

    var skipFreeTrialAutoReply = hasRecentAutoReply(data.email);
    console.log('Free Trial submission for ' + data.email + ' — auto-reply ' + (skipFreeTrialAutoReply ? 'SKIPPED (6-hour cooldown active)' : 'attempting now'));
    if (!skipFreeTrialAutoReply) {
      try {
        sendFreeTrialAutoReply(data, timestamp);
        markAutoReplySent(data.email);
        console.log('Free Trial auto-reply SENT successfully to ' + data.email);
      } catch (autoReplyErr) {
        // The Sheet row and admin notification above already succeeded —
        // a problem sending the visitor's confirmation must never turn
        // that into an error response. Logged for the Executions log;
        // NOT marked as sent, so the visitor isn't locked out of a retry.
        console.error('sendFreeTrialAutoReply failed: ' + (autoReplyErr.message || autoReplyErr) + ' | Remaining daily email quota: ' + MailApp.getRemainingDailyQuota());
      }
    }

    return jsonResponse({ success: true, message: 'Submission received successfully.', bookingId: bookingId });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message || String(err) });
  }
}

/**
 * Optional: lets you sanity-check the deployment by visiting the /exec URL
 * directly in a browser (a GET request), instead of submitting the form.
 */
function doGet(e) {
  return ContentService
    .createTextOutput('Al Quranul Academy Free Trial API is running. Send a POST request to book a trial.')
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Appends the submission as a new row, creating the sheet with headers
 * the first time it runs.
 */
function appendToSheet(data, timestamp, bookingId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(SHEET_HEADERS);
    sheet.getRange(1, 1, 1, SHEET_HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  sheet.appendRow([
    bookingId,
    formatDate(timestamp),
    data.student_name || '',
    data.age || '',
    data.country || '',
    data.whatsapp_number || '',
    data.email || '',
    data.teacher_preference || 'No preference',
    data.preferred_class_time || '',
    data.message || ''
  ]);
}

/**
 * Sends a premium HTML email notification to NOTIFY_EMAIL for a new
 * Free Trial booking.
 */
function sendNotificationEmail(data, timestamp, bookingId) {
  var subject = 'New Free Trial Booking | Al Quranul Academy';
  var dateStr = formatDate(timestamp);
  var datePart = dateStr.split(' ')[0];
  var timePart = dateStr.split(' ')[1] || '';
  var sheetUrl = SpreadsheetApp.getActiveSpreadsheet().getUrl();

  var rows = [
    ['Booking ID', bookingId],
    ['Student Name', data.student_name],
    ['Age', data.age],
    ['Country', data.country],
    ['WhatsApp Number', data.whatsapp_number],
    ['Email', data.email],
    ['Teacher Preference', data.teacher_preference || 'No preference'],
    ['Preferred Class Time', data.preferred_class_time || 'Not specified'],
    ['Message', data.message || '—'],
    ['Date', datePart],
    ['Time', timePart]
  ];

  var htmlBody = buildPremiumEmailHtml({
    headerTitle: 'New Free Trial Booking',
    headerSubtitle: 'A student has requested a free trial class.',
    rows: rows,
    footerNote: 'Reply to the student/parent directly by WhatsApp or email to confirm their class time.',
    replyTo: data.email,
    sheetUrl: sheetUrl
  });

  var plainBody =
    'New Free Trial Booking — ' + SITE_NAME + '\n\n' +
    rows.map(function (r) { return r[0] + ': ' + (r[1] || ''); }).join('\n') +
    '\n\nReply to the student/parent directly by WhatsApp or email to confirm their class time.' +
    '\n\nOpen Google Sheet: ' + sheetUrl;

  GmailApp.sendEmail(NOTIFY_EMAIL, subject, plainBody, { htmlBody: htmlBody, name: SENDER_NAME });
}

function formatDate(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
}

/**
 * Shared field-row renderer — used by both buildPremiumEmailHtml (admin
 * notifications) and buildCustomerEmailHtml (visitor confirmations) so
 * this markup exists in exactly one place.
 */
function buildFieldRowsHtml(rows) {
  return rows.map(function (r, i) {
    var isLast = i === rows.length - 1;
    return '' +
      '<div class="aqa-field" style="padding:14px 28px;' + (isLast ? '' : 'border-bottom:1px solid ' + EMAIL_THEME.border + ';') + '">' +
        '<div style="font-size:11.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:' + EMAIL_THEME.green + ';margin-bottom:4px;">' + escapeHtml(r[0]) + '</div>' +
        '<div style="font-size:15px;color:' + EMAIL_THEME.ink + ';line-height:1.6;word-break:break-word;">' + escapeHtml(String(r[1] || '—')) + '</div>' +
      '</div>';
  }).join('');
}

/**
 * One shared responsive stylesheet for BOTH templates. Gmail (the
 * client this project targets) supports a <style> block in the email
 * body, unlike some other clients — this is the one piece of CSS that
 * can't be done purely inline, since @media queries have no inline
 * equivalent. Both templates' classes are covered here, harmlessly
 * unused by whichever template a given class doesn't apply to.
 */
function buildEmailResponsiveStyle() {
  return '' +
    '<style>' +
      '@media only screen and (max-width:480px){' +
        '.aqa-card{border-radius:12px !important;}' +
        '.aqa-header{padding:22px 20px !important;}' +
        '.aqa-field{padding:12px 18px !important;}' +
        '.aqa-body{padding:20px !important;}' +
        '.aqa-btn{display:block !important;width:100% !important;margin:8px 0 !important;box-sizing:border-box;}' +
      '}' +
    '</style>';
}

/**
 * Shared header — logo, "AL QURANUL ACADEMY" eyebrow, title, subtitle.
 * Previously duplicated (byte-for-byte identical) between the admin and
 * visitor templates; now built in exactly one place.
 */
function buildEmailHeaderHtml(headerTitle, headerSubtitle) {
  var logoUrl = SITE_URL + '/assets/logo.png';
  return '' +
    '<div class="aqa-header" style="background:' + EMAIL_THEME.green + ';padding:28px 28px 24px;text-align:center;">' +
      '<img src="' + logoUrl + '" width="52" height="52" alt="' + SITE_NAME + '" style="display:block;margin:0 auto 14px;border-radius:10px;">' +
      '<div style="color:' + EMAIL_THEME.gold + ';font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px;">' + escapeHtml(SITE_NAME) + '</div>' +
      '<h1 style="margin:0;color:' + EMAIL_THEME.white + ';font-size:20px;font-family:' + EMAIL_THEME.fontHeading + ';">' + escapeHtml(headerTitle) + '</h1>' +
      '<p style="margin:8px 0 0;color:' + EMAIL_THEME.gold + ';font-size:13px;font-weight:500;line-height:1.5;">' + escapeHtml(headerSubtitle) + '</p>' +
    '</div>';
}

/**
 * Shared button row — a Gmail-safe <table> layout (not flexbox/grid,
 * which many email clients ignore), 2 or 3 buttons wide, stacking full
 * width on mobile via the .aqa-btn rule above. `style` is 'solid'
 * (filled green) or 'outline' (filled gold) — used for both the admin
 * template's Reply/Open Sheet buttons and the visitor template's Visit
 * Website/WhatsApp/Email buttons.
 */
function buildEmailButtonRowHtml(buttons) {
  var cells = buttons.map(function (btn) {
    var solid = btn.style !== 'outline';
    var bg = solid ? EMAIL_THEME.green : EMAIL_THEME.gold;
    var color = solid ? EMAIL_THEME.white : EMAIL_THEME.greenDark;
    return '' +
      '<td style="padding:4px;">' +
        '<a class="aqa-btn" href="' + btn.href + '" style="display:block;text-align:center;background:' + bg + ';color:' + color + ';text-decoration:none;font-weight:700;font-size:13.5px;padding:12px 16px;border-radius:9px;">' + escapeHtml(btn.label) + '</a>' +
      '</td>';
  }).join('');
  return '<table role="presentation" style="width:100%;border-collapse:collapse;"><tr>' + cells + '</tr></table>';
}

/**
 * Shared footer — a small Website/Email/Facebook/WhatsApp link row plus
 * the dark green copyright bar. Used identically by both templates now
 * (previously the admin template only showed a bare website link, with
 * no copyright line — this brings both templates onto the same footer).
 */
function buildEmailFooterHtml() {
  var links = [
    { label: 'Website', href: SITE_URL },
    { label: 'Email', href: 'mailto:' + NOTIFY_EMAIL },
    { label: 'Facebook', href: FACEBOOK_URL },
    { label: 'WhatsApp', href: WHATSAPP_URL }
  ];
  var linksHtml = links.map(function (link) {
    return '<a href="' + link.href + '" style="color:' + EMAIL_THEME.green + ';text-decoration:none;font-weight:700;font-size:12.5px;margin:0 6px;">' + escapeHtml(link.label) + '</a>';
  }).join('<span style="color:#D8D0BC;">&bull;</span>');

  return '' +
    '<div style="padding:20px 28px;background:' + EMAIL_THEME.creamLight + ';border-top:1px solid ' + EMAIL_THEME.border + ';text-align:center;">' +
      linksHtml +
    '</div>' +
    '<div style="padding:16px 28px;background:' + EMAIL_THEME.green + ';text-align:center;">' +
      '<p style="margin:0;font-size:12.5px;color:' + EMAIL_THEME.gold + ';font-weight:700;letter-spacing:.03em;">' + SITE_NAME + '</p>' +
      '<p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.7);">&copy; ' + new Date().getFullYear() + ' ' + SITE_NAME + '</p>' +
    '</div>';
}

/**
 * Wraps the card content in a full, minimal HTML document — needed to
 * declare color-scheme meta tags for dark mode. Rather than maintain a
 * second, largely-untested dark color palette, this deliberately opts
 * the email OUT of automatic dark-mode re-coloring (content="light"):
 * Gmail/Apple Mail's auto-dark-mode inversion is well known to mangle
 * carefully chosen brand colors (e.g. inverting the green header into
 * something off-brand). Declaring "light" tells supporting clients this
 * card is intentionally designed and should render as-is — the card
 * itself (white on cream, dark green header) already reads cleanly
 * whether the surrounding Gmail chrome is in light or dark mode, since
 * it doesn't rely on transparent backgrounds anywhere.
 */
function wrapEmailDocument(cardHtml) {
  return '' +
    '<!DOCTYPE html><html><head>' +
      '<meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
      '<meta name="color-scheme" content="light">' +
      '<meta name="supported-color-schemes" content="light">' +
      buildEmailResponsiveStyle() +
    '</head><body style="margin:0;padding:0;background:' + EMAIL_THEME.cream + ';">' +
      '<div style="font-family:' + EMAIL_THEME.fontBody + ';background:' + EMAIL_THEME.cream + ';padding:32px 16px;">' +
        '<div class="aqa-card" style="max-width:' + EMAIL_THEME.cardWidth + ';margin:0 auto;background:' + EMAIL_THEME.white + ';border-radius:' + EMAIL_THEME.radius + ';overflow:hidden;border:1px solid ' + EMAIL_THEME.border + ';box-shadow:0 10px 32px rgba(11,107,58,0.14);">' +
          cardHtml +
        '</div>' +
      '</div>' +
    '</body></html>';
}

/**
 * Shared premium email template — used by both the Free Trial and
 * Contact ADMIN notification emails so they stay visually consistent
 * and the markup lives in exactly one place. No emoji anywhere, per
 * the plain-text-title requirement — the header shows only the logo,
 * title and subtitle.
 *
 * config: {
 *   headerTitle, headerSubtitle,
 *   rows: [[label, value], ...],
 *   footerNote, replyTo, sheetUrl
 * }
 */
function buildPremiumEmailHtml(config) {
  var fieldsHtml = buildFieldRowsHtml(config.rows);
  var replyHref = config.replyTo ? ('mailto:' + config.replyTo) : ('mailto:' + NOTIFY_EMAIL);

  var cardHtml = '' +
    buildEmailHeaderHtml(config.headerTitle, config.headerSubtitle) +
    '<div style="padding:8px 0;">' + fieldsHtml + '</div>' +
    '<div style="padding:20px 28px 6px;">' +
      '<p style="margin:0 0 14px;font-size:13px;color:' + EMAIL_THEME.inkSoft + ';line-height:1.6;">' + escapeHtml(config.footerNote) + '</p>' +
      buildEmailButtonRowHtml([
        { label: 'Reply', href: replyHref, style: 'solid' },
        { label: 'Open Google Sheet', href: config.sheetUrl, style: 'outline' }
      ]) +
    '</div>' +
    buildEmailFooterHtml();

  return wrapEmailDocument(cardHtml);
}

/**
 * Generates the next sequential Booking ID for the current year, in the
 * format AQA2026-0001, AQA2026-0002, ... — resetting to 0001 each new
 * year (a separate counter is kept per year in Script Properties, so
 * this survives across executions and keeps counting up correctly).
 * Wrapped in a lock (same pattern already used by
 * getOrCreateContactSheet below) so two near-simultaneous Free Trial
 * submissions can never receive the same number.
 */
function getNextBookingId() {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var year = new Date().getFullYear();
    var propKey = 'LAST_BOOKING_NUMBER_' + year;
    var props = PropertiesService.getScriptProperties();
    var last = parseInt(props.getProperty(propKey) || '0', 10);
    var next = last + 1;
    props.setProperty(propKey, String(next));
    return 'AQA' + year + '-' + padBookingNumber(next);
  } finally {
    lock.releaseLock();
  }
}

function padBookingNumber(num) {
  var str = String(num);
  while (str.length < 4) { str = '0' + str; }
  return str;
}

/**
 * Spam protection for the auto-reply (confirmation) emails only — the
 * admin notification and Sheet row are never affected by this.
 *
 * Split into a check (hasRecentAutoReply) and a mark (markAutoReplySent)
 * called separately, so the 6-hour cooldown only actually starts once a
 * send has been CONFIRMED successful — not merely attempted. Marking
 * before confirming success was a real bug: if a send ever failed for
 * any transient reason (Gmail quota, a hiccup), the visitor would get
 * nothing AND be silently locked out of every retry for 6 hours, since
 * the cooldown had already been marked as used.
 *
 * CacheService is a perfect fit here: entries expire on their own after
 * AUTO_REPLY_COOLDOWN_SECONDS (its own maximum is exactly 6 hours), so
 * there's nothing to clean up over time.
 */
function hasRecentAutoReply(email) {
  if (!email) return true; // no email to send to — treat as "already sent" so we never try
  var cache = CacheService.getScriptCache();
  return !!cache.get('autoreply_' + String(email).toLowerCase().trim());
}

function markAutoReplySent(email) {
  if (!email) return;
  var cache = CacheService.getScriptCache();
  cache.put('autoreply_' + String(email).toLowerCase().trim(), '1', AUTO_REPLY_COOLDOWN_SECONDS);
}

/**
 * Shared template for VISITOR-facing confirmation emails (auto-replies) —
 * composed from the exact same shared components as buildPremiumEmailHtml
 * (buildEmailHeaderHtml, buildEmailButtonRowHtml, buildEmailFooterHtml,
 * wrapEmailDocument), so both templates share one design system with zero
 * duplicated wrapper/header/footer markup. Its own content area only:
 * a greeting, an optional Booking ID badge, and a Visit Website /
 * WhatsApp / Email button row (vs. the admin template's Reply / Open
 * Google Sheet buttons).
 *
 * config: {
 *   headerTitle, headerSubtitle,
 *   greetingParagraphs: [string, ...],
 *   bookingId (optional),
 *   rows: [[label, value], ...]
 * }
 */
function buildCustomerEmailHtml(config) {
  var greetingHtml = (config.greetingParagraphs || []).map(function (p) {
    return '<p style="margin:0 0 14px;font-size:14.5px;color:' + EMAIL_THEME.ink + ';line-height:1.7;">' + escapeHtml(p) + '</p>';
  }).join('');

  var bookingBadgeHtml = config.bookingId
    ? '<div style="margin:4px 0 20px;text-align:center;">' +
        '<span style="display:inline-block;background:' + EMAIL_THEME.green + ';color:' + EMAIL_THEME.gold + ';font-weight:700;font-size:14px;letter-spacing:.04em;padding:10px 22px;border-radius:100px;">Booking ID: ' + escapeHtml(config.bookingId) + '</span>' +
      '</div>'
    : '';

  var fieldsHtml = buildFieldRowsHtml(config.rows);

  var cardHtml = '' +
    buildEmailHeaderHtml(config.headerTitle, config.headerSubtitle) +
    '<div class="aqa-body" style="padding:26px 28px 6px;">' +
      greetingHtml +
      bookingBadgeHtml +
    '</div>' +
    '<div style="padding:8px 0;">' + fieldsHtml + '</div>' +
    '<div style="padding:20px 28px 6px;">' +
      buildEmailButtonRowHtml([
        { label: 'Visit Website', href: SITE_URL, style: 'solid' },
        { label: 'WhatsApp', href: WHATSAPP_URL, style: 'outline' },
        { label: 'Email', href: 'mailto:' + NOTIFY_EMAIL, style: 'solid' }
      ]) +
    '</div>' +
    buildEmailFooterHtml();

  return wrapEmailDocument(cardHtml);
}

/**
 * Sends the Free Trial visitor confirmation (auto-reply). Called from
 * doPost above, only when shouldSendAutoReply(data.email) is true.
 * Deliberately does NOT receive or reference bookingId anywhere — the
 * Booking ID must never appear in the visitor-facing email, only in the
 * Sheet, Firebase, the Admin Dashboard, and the admin notification.
 */
function sendFreeTrialAutoReply(data, timestamp) {
  var subject = 'Free Trial Request Received | Al Quranul Academy';

  var rows = [
    ['Student Name', data.student_name],
    ['Age', data.age],
    ['Country', data.country],
    ['Email', data.email],
    ['WhatsApp Number', data.whatsapp_number],
    ['Teacher Preference', data.teacher_preference || 'No preference'],
    ['Preferred Class Time', data.preferred_class_time || 'Not specified']
  ];

  var htmlBody = buildCustomerEmailHtml({
    headerTitle: 'Free Trial Request Received',
    headerSubtitle: 'Your request has been received successfully.',
    greetingParagraphs: [
      'Dear Parent / Guardian,',
      'Thank you for choosing Al Quranul Academy for your child\'s Quran learning journey.',
      'We have successfully received your Free Trial request.',
      'Our admissions team will contact you shortly via WhatsApp or Email to schedule your class.',
      'You can typically expect a response within 6 hours.',
      'Please keep your phone available so we can reach you promptly.'
    ],
    rows: rows
  });

  var plainBody =
    'Dear Parent / Guardian,\n\n' +
    'Thank you for choosing Al Quranul Academy for your child\'s Quran learning journey.\n' +
    'We have successfully received your Free Trial request.\n' +
    'Our admissions team will contact you shortly via WhatsApp or Email to schedule your class.\n' +
    'You can typically expect a response within 6 hours.\n' +
    'Please keep your phone available so we can reach you promptly.\n\n' +
    rows.map(function (r) { return r[0] + ': ' + (r[1] || ''); }).join('\n') +
    '\n\nVisit Website: ' + SITE_URL +
    '\nEmail: ' + NOTIFY_EMAIL +
    '\nFacebook: ' + FACEBOOK_URL +
    '\nWhatsApp: ' + WHATSAPP_URL;

  GmailApp.sendEmail(data.email, subject, plainBody, { htmlBody: htmlBody, name: SENDER_NAME, replyTo: NOTIFY_EMAIL });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// =====================================================================
// CONTACT FORM — reuses this same Apps Script Web App, the same
// Spreadsheet, and the same Gmail notification flow as the Free Trial
// form above. Nothing above this line was changed; jsonResponse(),
// formatDate(), escapeHtml() and NOTIFY_EMAIL are reused as-is rather
// than duplicated.
// =====================================================================

var CONTACT_SHEET_NAME = 'Contact Messages';
var CONTACT_SHEET_HEADERS = [
  'Date',
  'Time',
  'Name',
  'Email',
  'Subject',
  'Message',
  'Country',
  'Browser',
  'IP'
];

/**
 * Handles Contact form submissions (routed here from doPost above when
 * data.form_type === 'contact').
 */
function handleContactSubmission(data) {
  // Honeypot — same pattern as the Free Trial handler.
  if (data._honey) {
    return jsonResponse({ success: true, message: 'Message received successfully.' });
  }

  var required = ['name', 'email', 'message'];
  for (var i = 0; i < required.length; i++) {
    if (!data[required[i]] || String(data[required[i]]).trim() === '') {
      return jsonResponse({ success: false, error: 'Missing required field: ' + required[i] });
    }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return jsonResponse({ success: false, error: 'Invalid email address.' });
  }

  var timestamp = new Date();

  // The sheet write and the email are now independent of each other: a
  // problem in one is logged (Apps Script → Executions log) rather than
  // silently preventing the other from running, and appendContactToSheet
  // always executes exactly as required.
  var sheetError = null;
  try {
    appendContactToSheet(data, timestamp);
  } catch (err) {
    sheetError = err;
    console.error('appendContactToSheet failed: ' + (err.message || err));
  }

  sendContactNotificationEmail(data, timestamp);

  var skipContactAutoReply = hasRecentAutoReply(data.email);
  console.log('Contact submission for ' + data.email + ' — auto-reply ' + (skipContactAutoReply ? 'SKIPPED (6-hour cooldown active)' : 'attempting now'));
  if (!skipContactAutoReply) {
    try {
      sendContactAutoReply(data, timestamp);
      markAutoReplySent(data.email);
      console.log('Contact auto-reply SENT successfully to ' + data.email);
    } catch (autoReplyErr) {
      // The Sheet row and admin notification above already succeeded —
      // a problem sending the visitor's confirmation must never turn
      // that into an error response. Logged for the Executions log;
      // NOT marked as sent, so the visitor isn't locked out of a retry.
      console.error('sendContactAutoReply failed: ' + (autoReplyErr.message || autoReplyErr) + ' | Remaining daily email quota: ' + MailApp.getRemainingDailyQuota());
    }
  }

  if (sheetError) {
    // The email still went out, but flag the Sheet problem rather than
    // silently returning success — this should be extremely rare now
    // that the sheet-creation race condition is fixed below, but if it
    // ever happens for an unrelated reason (e.g. a genuine Sheets outage)
    // it must not look like nothing went wrong.
    return jsonResponse({ success: false, error: 'Message emailed, but saving to the sheet failed: ' + (sheetError.message || sheetError) });
  }

  return jsonResponse({ success: true, message: 'Message received successfully.' });
}

/**
 * Appends the message as a new row in its own "Contact Messages" sheet
 * (separate from "Free Trial Bookings"), creating it with headers the
 * first time it runs.
 *
 * Uses a script lock around the get-or-create step to eliminate a real
 * race condition: if two submissions arrived at nearly the same moment
 * before this sheet existed yet, both could see getSheetByName() return
 * null and both try to insertSheet() the same name — the second call
 * would throw "A sheet with this name already exists", aborting that
 * request entirely. The lock serializes this step, and the catch below
 * self-heals by re-fetching the sheet if creation ever does collide.
 */
function appendContactToSheet(data, timestamp) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateContactSheet(ss);

  var dateTimeStr = formatDate(timestamp); // reuses the existing helper, unchanged
  var spaceIndex = dateTimeStr.indexOf(' ');
  var datePart = spaceIndex === -1 ? dateTimeStr : dateTimeStr.substring(0, spaceIndex);
  var timePart = spaceIndex === -1 ? '' : dateTimeStr.substring(spaceIndex + 1);

  sheet.appendRow([
    datePart,
    timePart,
    data.name || '',
    data.email || '',
    data.subject || '(No subject)',
    data.message || '',
    data.country || '',
    data.browser || '',
    data.ip || ''
  ]);
}

/**
 * Gets the "Contact Messages" sheet, creating it (with headers) if this
 * is the very first Contact submission — safely, even under concurrent
 * requests. Scoped to Contact only; Free Trial's own appendToSheet()
 * above is untouched.
 */
function getOrCreateContactSheet(ss) {
  var sheet = ss.getSheetByName(CONTACT_SHEET_NAME);
  if (sheet) return sheet;

  var lock = LockService.getScriptLock();
  lock.waitLock(10000); // up to 10s — creation itself takes well under a second
  try {
    // Re-check after acquiring the lock: another concurrent execution may
    // have already created it while we were waiting.
    sheet = ss.getSheetByName(CONTACT_SHEET_NAME);
    if (sheet) return sheet;

    try {
      sheet = ss.insertSheet(CONTACT_SHEET_NAME);
      sheet.appendRow(CONTACT_SHEET_HEADERS);
      sheet.getRange(1, 1, 1, CONTACT_SHEET_HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
      return sheet;
    } catch (createErr) {
      // Self-heal: if creation failed because it already exists (a
      // collision that slipped past the lock, or was created a moment
      // ago), just use the now-existing sheet instead of failing.
      sheet = ss.getSheetByName(CONTACT_SHEET_NAME);
      if (sheet) return sheet;
      throw createErr; // genuinely unexpected — let the caller see it
    }
  } finally {
    lock.releaseLock();
  }
}

/**
 * Sends a premium HTML email notification for a new Contact form
 * message. Displays ONLY Name, Email, Subject, Message, Date and Time —
 * form_type, browser, ip and the honeypot are captured in the sheet for
 * record-keeping but are intentionally never shown in this email.
 */
function sendContactNotificationEmail(data, timestamp) {
  var subject = 'New Contact Message | Al Quranul Academy';
  var dateStr = formatDate(timestamp);
  var datePart = dateStr.split(' ')[0];
  var timePart = dateStr.split(' ')[1] || '';
  var sheetUrl = SpreadsheetApp.getActiveSpreadsheet().getUrl();

  var rows = [
    ['Name', data.name],
    ['Email', data.email],
    ['Subject', data.subject || '(No subject)'],
    ['Message', data.message],
    ['Date', datePart],
    ['Time', timePart]
  ];

  var htmlBody = buildPremiumEmailHtml({
    headerTitle: 'New Contact Message',
    headerSubtitle: 'Someone has sent you a message through your website.',
    rows: rows,
    footerNote: 'Reply directly to continue the conversation.',
    replyTo: data.email,
    sheetUrl: sheetUrl
  });

  var plainBody =
    'New Contact Message — ' + SITE_NAME + '\n\n' +
    rows.map(function (r) { return r[0] + ': ' + (r[1] || ''); }).join('\n') +
    '\n\nReply directly to continue the conversation.' +
    '\n\nOpen Google Sheet: ' + sheetUrl;

  GmailApp.sendEmail(NOTIFY_EMAIL, subject, plainBody, { htmlBody: htmlBody, name: SENDER_NAME });
}

/**
 * Sends the Contact visitor confirmation (auto-reply). Called from
 * handleContactSubmission above, only when
 * shouldSendAutoReply(data.email) is true. No Ticket ID is generated —
 * only the Free Trial confirmation gets a Booking ID.
 */
function sendContactAutoReply(data, timestamp) {
  var subject = 'Thank You for Contacting Al Quranul Academy';

  var rows = [
    ['Name', data.name],
    ['Email', data.email],
    ['Subject', data.subject || '(No subject)'],
    ['Message', data.message]
  ];

  var htmlBody = buildCustomerEmailHtml({
    headerTitle: 'Message Received',
    headerSubtitle: 'Thank you for reaching out to Al Quranul Academy.',
    greetingParagraphs: [
      'Dear Visitor,',
      'Thank you for contacting Al Quranul Academy.',
      'We have successfully received your message.',
      'Our team will review your inquiry and reply within 6 hours.',
      'If your matter is urgent, please contact us through WhatsApp.'
    ],
    rows: rows
  });

  var plainBody =
    'Dear Visitor,\n\n' +
    'Thank you for contacting Al Quranul Academy.\n' +
    'We have successfully received your message.\n' +
    'Our team will review your inquiry and reply within 6 hours.\n' +
    'If your matter is urgent, please contact us through WhatsApp.\n\n' +
    rows.map(function (r) { return r[0] + ': ' + (r[1] || ''); }).join('\n') +
    '\n\nVisit Website: ' + SITE_URL +
    '\nEmail: ' + NOTIFY_EMAIL +
    '\nFacebook: ' + FACEBOOK_URL +
    '\nWhatsApp: ' + WHATSAPP_URL;

  GmailApp.sendEmail(data.email, subject, plainBody, { htmlBody: htmlBody, name: SENDER_NAME, replyTo: NOTIFY_EMAIL });
}
