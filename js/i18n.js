/* Al Quranul Academy — bilingual EN / BN (Sir, 2026-10-26).
   English is the DEFAULT. Bengali is opt-in via the EN | বাংলা toggle
   in the header, persisted per device in localStorage ('aqa_lang').
   Scope (standing spec): PUBLIC pages only. The admin dashboard stays
   English, and ALL emails stay English. No Arabic / RTL: Bengali is LTR.
   Method: exact text-node dictionary. Only a text node whose full
   trimmed text matches a dictionary key is swapped, so numbers, emails,
   phone numbers, URLs and country names are never touched. Unmatched
   text stays English — that is the Phase-2 remainder, not a bug.
   Testimonial quotes are deliberately NOT translated (attributed words).
   Privacy / Terms bodies stay English (legal text, needs careful review).
   Course-detail and blog-post bodies are JS-filled from main.js data and
   stay English in Phase 1. */
(function () {
  'use strict';
  var KEY = 'aqa_lang';
  /* QR page (links.html) is ALWAYS English, by Sir's order 2026-10-26:
     it is the page an ID-card QR opens, so it must never inherit a
     stored Bengali choice from another page. */
  var isLinksPage = /links\.html$/.test(window.location.pathname);
  var lang = 'en';
  try { lang = localStorage.getItem(KEY) || 'en'; } catch (e) { lang = 'en'; }
  if (lang !== 'bn' || isLinksPage) lang = 'en';

  var DICT = {
    /* ---------- Nav / footer (all pages) ---------- */
    'Home': 'হোম',
    'About Us': 'আমাদের সম্পর্কে',
    'Courses': 'কোর্সসমূহ',
    'Teachers': 'শিক্ষকবৃন্দ',
    'Free Trial': 'ফ্রি ট্রায়াল',
    'Admission': 'ভর্তি',
    'FAQ': 'সাধারণ প্রশ্ন',
    'Blog': 'ব্লগ',
    'Contact': 'যোগাযোগ',
    'Book Free Trial': 'ফ্রি ট্রায়াল বুক করুন',
    'Book a Free Trial': 'ফ্রি ট্রায়াল বুক করুন',
    'Book Your Free Trial Today': 'আজই আপনার ফ্রি ট্রায়াল বুক করুন',
    'Quick Links': 'দ্রুত লিংক',
    'Get in Touch': 'যোগাযোগ করুন',
    'Learn the Quran correctly with qualified male and female teachers — flexible, one-to-one online classes for children and adults, wherever you are in the world.': 'যোগ্য পুরুষ ও মহিলা শিক্ষকদের সাথে কুরআন সঠিকভাবে শিখুন — শিশু ও প্রাপ্তবয়স্কদের জন্য ফ্লেক্সিবল, ওয়ান-টু-ওয়ান অনলাইন ক্লাস, পৃথিবীর যেখানেই আপনি থাকুন না কেন।',
    '© 2026 Al Quranul Academy. All rights reserved.': '© 2026 আল কুরআনুল একাডেমি। সর্বস্বত্ব সংরক্ষিত।',
    'Privacy Policy': 'গোপনীয়তা নীতি',
    'Terms': 'শর্তাবলি',
    'Frequently Asked Questions': 'সচরাচর জিজ্ঞাসিত প্রশ্ন',
    'Noorani Qaida': 'নূরানী কায়দা',
    'Quran Reading (Nazera)': 'কুরআন পড়া (নাজেরা)',
    'Tajweed': 'তাজউইদ',
    'Hifzul Quran': 'হিফজুল কুরআন',
    'Islamic Studies': 'ইসলামিক স্টাডিজ',
    'Complete Quran & Islamic Studies Programme': 'সম্পূর্ণ কুরআন ও ইসলামিক স্টাডিজ প্রোগ্রাম',
    'Build a complete Islamic foundation — beliefs, worship, Seerah, and character.': 'পূর্ণাঙ্গ ইসলামিক ভিত্তি গড়ুন — বিশ্বাস, ইবাদত, সীরাহ ও চরিত্র।',
    'The full journey in one programme — Qaida, Nazera, Tajweed, Hifz, and Islamic Studies.': 'এক প্রোগ্রামে পুরো যাত্রা — কায়দা, নাজেরা, তাজউইদ, হিফজ ও ইসলামিক স্টাডিজ।',
    'Beliefs, worship, Seerah, and character — a complete Islamic foundation.': 'বিশ্বাস, ইবাদত, সীরাহ ও চরিত্র — পূর্ণাঙ্গ ইসলামিক ভিত্তি।',
    'The full journey — Qaida, Nazera, Tajweed, Hifz, and Islamic Studies in one programme.': 'পুরো যাত্রা — এক প্রোগ্রামে কায়দা, নাজেরা, তাজউইদ, হিফজ ও ইসলামিক স্টাডিজ।',
    'All levels · Age 5+': 'সব স্তর · বয়স ৫+',
    'Al Quranul Academy': 'আল কুরআনুল একাডেমি',
    'Al Quranul': 'আল কুরআনুল',
    'Academy': 'একাডেমি',
    'Learn More': 'আরও জানুন',
    'Enroll Now': 'এখনই ভর্তি হোন',
    'Contact Us': 'যোগাযোগ করুন',
    /* ---------- Home: hero / trust strip ---------- */
    'Trusted Online Quran Education': 'বিশ্বস্ত অনলাইন কুরআন শিক্ষা',
    'Learn the Quran from Home with Qualified Teachers': 'যোগ্য শিক্ষকদের সাথে ঘরে বসে কুরআন শিখুন',
    'Personalised one-to-one Quran classes for children and adults, with flexible schedules built around your family — wherever in the world you call home.': 'শিশু ও প্রাপ্তবয়স্কদের জন্য ব্যক্তিগত ওয়ান-টু-ওয়ান কুরআন ক্লাস, আপনার পরিবারের সাথে মানানসই ফ্লেক্সিবল সময়সূচিসহ — পৃথিবীর যেখানেই আপনি থাকুন না কেন।',
    'View Courses': 'কোর্স দেখুন',
    'Qualified Teachers': 'যোগ্য শিক্ষক',
    'Countries Served': 'দেশে সেবা প্রদান',
    'Live Online Classes': 'লাইভ অনলাইন ক্লাস',
    'Male & Female Teachers': 'পুরুষ ও মহিলা শিক্ষক',
    'Flexible Scheduling': 'ফ্লেক্সিবল সময়সূচি',
    'Progress Tracking': 'অগ্রগতি পর্যবেক্ষণ',
    'One-to-One Classes': 'ওয়ান-টু-ওয়ান ক্লাস',
    'Flexible Schedule': 'ফ্লেক্সিবল সময়সূচি',
    'Interactive Learning': 'ইন্টারঅ্যাক্টিভ শেখা',
    'Friendly Environment': 'বন্ধুত্বপূর্ণ পরিবেশ',
    /* ---------- Home: about preview / courses ---------- */
    'About the Academy': 'একাডেমি সম্পর্কে',
    'Authentic Quran Education, Wherever You Call Home': 'যেখানেই আপনি থাকুন, খাঁটি কুরআন শিক্ষা',
    'Al Quranul Academy was founded to make correct, authentic Quran education accessible to Bangladeshi and Muslim families living abroad — from Dhaka to Doha, London to Los Angeles. We believe every student, young or old, deserves a patient teacher, a personal pace, and a class time that fits real family life.': 'আল কুরআনুল একাডেমি প্রতিষ্ঠিত হয়েছে প্রবাসী বাংলাদেশি ও মুসলিম পরিবারগুলোর কাছে সঠিক, খাঁটি কুরআন শিক্ষা পৌঁছে দিতে — ঢাকা থেকে দোহা, লন্ডন থেকে লস অ্যাঞ্জেলেস পর্যন্ত। আমরা বিশ্বাস করি, ছোট-বড় প্রতিটি শিক্ষার্থী একজন ধৈর্যশীল শিক্ষক, নিজস্ব গতি এবং বাস্তব পারিবারিক জীবনের সাথে মানানসই ক্লাসের সময় পাওয়ার যোগ্য।',
    'Our teaching philosophy is simple: one student, one teacher, one clear path of progress — built on correct pronunciation, real understanding, and genuine care for every learner\'s journey through the Quran.': 'আমাদের শিক্ষাদান দর্শন সহজ: একজন শিক্ষার্থী, একজন শিক্ষক, অগ্রগতির একটি স্পষ্ট পথ — সঠিক উচ্চারণ, বাস্তব বোঝাপড়া এবং কুরআনের পথে প্রতিটি শিক্ষার্থীর যাত্রার প্রতি আন্তরিক যত্নের ওপর গড়া।',
    'Read Our Story': 'আমাদের গল্প পড়ুন',
    'Our Programmes': 'আমাদের প্রোগ্রামসমূহ',
    'Courses for Every Stage of the Journey': 'যাত্রার প্রতিটি ধাপের জন্য কোর্স',
    'From first letters to full memorisation — structured, one-to-one courses guided by qualified teachers.': 'প্রথম অক্ষর থেকে পূর্ণ মুখস্থ পর্যন্ত — যোগ্য শিক্ষকদের পরিচালনায় সুসংগঠিত, ওয়ান-টু-ওয়ান কোর্স।',
    'The essential first step — Arabic letters, sounds and joining rules.': 'প্রথম অপরিহার্য ধাপ — আরবি অক্ষর, উচ্চারণ ও যুক্ত করার নিয়ম।',
    'Read the full Quran fluently, page by page, with correct pronunciation.': 'সঠিক উচ্চারণসহ পৃষ্ঠা ধরে ধরে পুরো কুরআন সাবলীলভাবে পড়ুন।',
    'Master the rules that make recitation correct and beautiful.': 'তিলাওয়াত সঠিক ও সুন্দর করার নিয়মগুলো আয়ত্ত করুন।',
    'Structured memorisation with proven Sabaq–Sabqi–Manzil revision.': 'প্রমাণিত সবক–সবকী–মঞ্জিল রিভিশন পদ্ধতিতে সুসংগঠিত মুখস্থ।',
    '3–6 months': '3–6 মাস',
    '12–24 months': '12–24 মাস',
    '6–12 months': '6–12 মাস',
    'Ongoing': 'চলমান',
    'Beginner': 'প্রাথমিক',
    'Beginner+': 'প্রাথমিক+',
    'Intermediate': 'মধ্যম',
    'All levels': 'সব স্তর',
    /* ---------- Home: why / steps / FAQ preview / CTA ---------- */
    'Why Families Choose Us': 'পরিবারগুলো কেন আমাদের বেছে নেয়',
    'A Learning Experience Built Around Your Child': 'আপনার সন্তানকে কেন্দ্র করে গড়া শেখার অভিজ্ঞতা',
    'Flexible Timing': 'ফ্লেক্সিবল সময়',
    'Choose class times that fit your family across any timezone in the world.': 'পৃথিবীর যেকোনো টাইমজোনে আপনার পরিবারের সাথে মানানসই ক্লাসের সময় বেছে নিন।',
    '20+ experienced male and female teachers, carefully selected and trained.': 'সতর্কভাবে নির্বাচিত ও প্রশিক্ষিত 20+ অভিজ্ঞ পুরুষ ও মহিলা শিক্ষক।',
    'Full teacher attention every session — no shared or group class distractions.': 'প্রতি সেশনে শিক্ষকের পূর্ণ মনোযোগ — কোনো শেয়ার্ড বা গ্রুপ ক্লাসের ব্যঘাত নেই।',
    'Regular reports so parents always know exactly how their child is doing.': 'নিয়মিত রিপোর্ট, যাতে অভিভাবকরা সবসময় জানতে পারেন সন্তান কেমন করছে।',
    'Engaging, screen-friendly teaching methods designed for young learners.': 'ছোট শিক্ষার্থীদের জন্য তৈরি আকর্ষণীয়, স্ক্রিন-বান্ধব শিক্ষাদান পদ্ধতি।',
    'A warm, patient classroom culture where students feel safe to learn.': 'উষ্ণ, ধৈর্যশীল ক্লাসরুম পরিবেশ, যেখানে শিক্ষার্থীরা নিরাপদে শিখতে পারে।',
    'Free Trial Class': 'ফ্রি ট্রায়াল ক্লাস',
    'Meet your teacher and experience a real class before you enrol.': 'ভর্তির আগে আপনার শিক্ষকের সাথে পরিচিত হোন এবং একটি আসল ক্লাসের অভিজ্ঞতা নিন।',
    'How It Works': 'কীভাবে কাজ করে',
    'Your Quran Learning Journey, in Four Steps': 'চার ধাপে আপনার কুরআন শেখার যাত্রা',
    'Reserve a free trial class in less than two minutes.': 'দুই মিনিটেরও কম সময়ে একটি ফ্রি ট্রায়াল ক্লাস বুক করুন।',
    'Meet Your Teacher': 'আপনার শিক্ষকের সাথে পরিচিত হোন',
    'Join a live session and get to know your qualified teacher.': 'একটি লাইভ সেশনে যোগ দিন এবং আপনার যোগ্য শিক্ষকের সাথে পরিচিত হোন।',
    'Start Regular Classes': 'নিয়মিত ক্লাস শুরু করুন',
    'Begin a structured, one-to-one course at your own pace.': 'নিজের গতিতে সুসংগঠিত, ওয়ান-টু-ওয়ান কোর্স শুরু করুন।',
    'Track Your Progress': 'আপনার অগ্রগতি দেখুন',
    'Receive regular updates on fluency, Tajweed, and memorisation.': 'সাবলীলতা, তাজউইদ ও মুখস্থের বিষয়ে নিয়মিত আপডেট পান।',
    'Parent & Student Voices': 'অভিভাবক ও শিক্ষার্থীদের কথা',
    'Trusted by Families Around the World': 'বিশ্বজুড়ে পরিবারগুলোর আস্থা',
    'Common Questions': 'সাধারণ প্রশ্ন',
    'Can adults join the classes?': 'প্রাপ্তবয়স্করা কি ক্লাসে যোগ দিতে পারবেন?',
    'Yes — we welcome learners of every age. Many of our students are adults learning to read the Quran for the first time or refining their Tajweed.': 'হ্যাঁ — আমরা সব বয়সের শিক্ষার্থীকে স্বাগত জানাই। আমাদের অনেক শিক্ষার্থী প্রাপ্তবয়স্ক, যারা প্রথমবার কুরআন পড়তে শিখছেন বা তাজউইদ শুদ্ধ করছেন।',
    'Can I choose a male or female teacher?': 'আমি কি পুরুষ বা মহিলা শিক্ষক বেছে নিতে পারবো?',
    'Absolutely. You can request a male or female teacher for your child or yourself when you book your free trial or enrol.': 'অবশ্যই। ফ্রি ট্রায়াল বুক করার সময় বা ভর্তির সময় আপনি আপনার সন্তান বা নিজের জন্য পুরুষ বা মহিলা শিক্ষক চাইতে পারবেন।',
    'How do one-to-one classes work online?': 'অনলাইনে ওয়ান-টু-ওয়ান ক্লাস কীভাবে হয়?',
    'Each class is a live, private video session between your teacher and student — no shared classrooms, so every minute is focused on your progress.': 'প্রতিটি ক্লাস শিক্ষক ও শিক্ষার্থীর মধ্যে লাইভ, ব্যক্তিগত ভিডিও সেশন — কোনো শেয়ার্ড ক্লাসরুম নেই, তাই প্রতিটি মিনিট আপনার অগ্রগতিতে মনোযোগী।',
    'Is the free trial really free?': 'ফ্রি ট্রায়াল কি সত্যিই ফ্রি?',
    'Yes, completely free with no obligation. It is simply a chance to meet a teacher and experience our teaching style before you decide to enrol.': 'হ্যাঁ, সম্পূর্ণ ফ্রি, কোনো বাধ্যবাধকতা নেই। ভর্তির সিদ্ধান্ত নেওয়ার আগে শিক্ষকের সাথে পরিচিত হওয়া ও আমাদের শিক্ষাদান পদ্ধতি দেখার সুযোগ মাত্র।',
    'View All FAQs': 'সব প্রশ্ন দেখুন',
    'Ready to Begin Your Quran Journey?': 'আপনার কুরআন যাত্রা শুরু করতে প্রস্তুত?',
    'Book your free trial today and meet a qualified teacher — no cost, no obligation.': 'আজই আপনার ফ্রি ট্রায়াল বুক করুন এবং একজন যোগ্য শিক্ষকের সাথে পরিচিত হোন — কোনো খরচ নেই, কোনো বাধ্যবাধকতা নেই।'
  };

  /* ---------- Forms: Free Trial / Admission / Contact ---------- */
  DICT['Book a Completely Free Trial Class'] = 'সম্পূর্ণ ফ্রি ট্রায়াল ক্লাস বুক করুন';
  DICT['Meet a qualified teacher, experience our teaching style, and see if we are the right fit for your family — with no cost and no obligation.'] = 'একজন যোগ্য শিক্ষকের সাথে পরিচিত হোন, আমাদের শিক্ষাদান পদ্ধতি দেখুন, এবং দেখুন আমরা আপনার পরিবারের জন্য সঠিক কিনা — কোনো খরচ ও বাধ্যবাধকতা ছাড়া।';
  DICT['How the Trial Works'] = 'ট্রায়াল কীভাবে হয়';
  DICT['Tell us a little about the student, choose a preferred time and teacher, and we will confirm your free session within 24 hours.'] = 'শিক্ষার্থী সম্পর্কে কিছু জানান, পছন্দের সময় ও শিক্ষক বেছে নিন, আর আমরা 24 ঘণ্টার মধ্যে আপনার ফ্রি সেশন নিশ্চিত করবো।';
  DICT['What Happens During Class'] = 'ক্লাসে কী হয়';
  DICT['Your teacher will assess current reading level, introduce themselves, and teach a short, real lesson so you can see our method in action.'] = 'আপনার শিক্ষক বর্তমান পড়ার স্তর যাচাই করবেন, নিজের পরিচয় দেবেন, এবং একটি ছোট, আসল পাঠ পড়াবেন যাতে আপনি আমাদের পদ্ধতি দেখতে পারেন।';
  DICT['How to Prepare'] = 'কীভাবে প্রস্তুতি নেবেন';
  DICT['Just a quiet space, a stable internet connection, and (if applicable) a Noorani Qaida or Quran copy nearby. Nothing else needed.'] = 'শুধু একটি শান্ত জায়গা, স্থিতিশীল ইন্টারনেট সংযোগ, এবং (প্রযোজ্য হলে) কাছাকাছি একটি নূরানী কায়দা বা কুরআনের কপি। আর কিছু লাগবে না।';
  DICT['Book Your Session'] = 'আপনার সেশন বুক করুন';
  DICT['Free Trial Class Booking'] = 'ফ্রি ট্রায়াল ক্লাস বুকিং';
  DICT['Fill in the form below and our team will confirm your class time by WhatsApp or email.'] = 'নিচের ফর্মটি পূরণ করুন, আমাদের টিম WhatsApp বা ইমেইলের মাধ্যমে আপনার ক্লাসের সময় নিশ্চিত করবে।';
  DICT['Student Name'] = 'শিক্ষার্থীর নাম';
  DICT['Age'] = 'বয়স';
  DICT['Country'] = 'দেশ';
  DICT['WhatsApp Number'] = 'WhatsApp নম্বর';
  DICT['Email'] = 'ইমেইল';
  DICT['Teacher Preference'] = 'শিক্ষক পছন্দ';
  DICT['No preference'] = 'কোনো পছন্দ নেই';
  DICT['Male Teacher'] = 'পুরুষ শিক্ষক';
  DICT['Female Teacher'] = 'মহিলা শিক্ষক';
  DICT['Preferred Class Time'] = 'পছন্দের ক্লাসের সময়';
  DICT['Message (optional)'] = 'মেসেজ (ঐচ্ছিক)';
  DICT['Message'] = 'মেসেজ';
  DICT['Submit Application'] = 'আবেদন জমা দিন';
  DICT['Send Message'] = 'মেসেজ পাঠান';
  DICT['Your Name'] = 'আপনার নাম';
  DICT['Subject'] = 'বিষয়';
  DICT['Send Us a Message'] = 'আমাদের মেসেজ পাঠান';
  DICT['Find Us Online'] = 'অনলাইনে আমাদের খুঁজুন';
  DICT['Serving Students Worldwide'] = 'বিশ্বজুড়ে শিক্ষার্থীদের সেবা';
  DICT['Al Quranul Academy teaches students across France, the UK, Italy, Germany, Canada, the USA, Saudi Arabia, the UAE, Qatar, Oman, Kuwait, Malaysia, Australia, and beyond — entirely online.'] = 'আল কুরআনুল একাডেমি ফ্রান্স, যুক্তরাজ্য, ইতালি, জার্মানি, কানাডা, যুক্তরাষ্ট্র, সৌদি আরব, সংযুক্ত আরব আমিরাত, কাতার, ওমান, কুয়েত, মালয়েশিয়া, অস্ট্রেলিয়া এবং আরও অনেক দেশের শিক্ষার্থীদের সম্পূর্ণ অনলাইনে পড়ায়।';
  DICT['A live map view can be embedded here once a physical office address is confirmed.'] = 'একটি অফিস ঠিকানা নিশ্চিত হলে এখানে একটি লাইভ ম্যাপ যুক্ত করা যাবে।';
  DICT['We Would Love to Hear From You'] = 'আপনার কথা শুনতে আমরা আগ্রহী';
  DICT['Questions about courses, scheduling, or enrolment? Reach out and our team will respond quickly.'] = 'কোর্স, সময়সূচি বা ভর্তি নিয়ে প্রশ্ন? যোগাযোগ করুন, আমাদের টিম দ্রুত উত্তর দেবে।';
  DICT['Enroll at Al Quranul Academy'] = 'আল কুরআনুল একাডেমিতে ভর্তি হোন';
  DICT['Complete the application below to begin regular one-to-one classes. Not sure yet? Book a free trial first.'] = 'নিয়মিত ওয়ান-টু-ওয়ান ক্লাস শুরু করতে নিচের আবেদনটি সম্পূর্ণ করুন। এখনো নিশ্চিত নন? আগে একটি ফ্রি ট্রায়াল বুক করুন।';
  DICT['Gender'] = 'লিঙ্গ';
  DICT['Select gender'] = 'লিঙ্গ নির্বাচন করুন';
  DICT['Female'] = 'মহিলা';
  DICT['Male'] = 'পুরুষ';
  DICT['Guardian Name'] = 'অভিভাবকের নাম';
  DICT['Course'] = 'কোর্স';
  DICT['Select a course'] = 'কোর্স নির্বাচন করুন';
  DICT['Student Photo'] = 'শিক্ষার্থীর ছবি';
  DICT['Prefer to talk first?'] = 'আগে কথা বলতে চান?';
  DICT['Book a free trial class'] = 'ফ্রি ট্রায়াল ক্লাস বুক করুন';
  DICT['or'] = 'অথবা';
  DICT['contact us'] = 'আমাদের সাথে যোগাযোগ করুন';
  DICT['directly.'] = 'সরাসরি।';
  /* Spam-folder note (visible note + success messages) */
  DICT['📧 Didn\'t receive our email? Please check your Spam or Promotions folder on your phone, and mark our email as “Not Spam” so future emails reach your inbox.'] = '📧 আমাদের ইমেইল পাননি? ফোনে Spam বা Promotions ফোল্ডার চেক করুন, এবং আমাদের ইমেইলকে “Not Spam” হিসেবে মার্ক করুন যাতে ভবিষ্যতের ইমেইলগুলো ইনবক্সে আসে।';
  DICT['Submission received successfully. Please check your Spam or Promotions folder on your phone if you do not see our email, and mark it as "Not Spam".'] = 'আবেদন সফলভাবে গৃহীত হয়েছে। আমাদের ইমেইল না পেলে ফোনে Spam বা Promotions ফোল্ডার চেক করুন এবং “Not Spam” হিসেবে মার্ক করুন।';
  DICT['Thank you! Your free trial request has been received — our team will confirm your class time shortly by WhatsApp or email. Please check your Spam or Promotions folder on your phone if you do not see our email, and mark it as "Not Spam".'] = 'ধন্যবাদ! আপনার ফ্রি ট্রায়াল অনুরোধ গৃহীত হয়েছে — আমাদের টিম WhatsApp বা ইমেইলের মাধ্যমে শীঘ্রই আপনার ক্লাসের সময় নিশ্চিত করবে। আমাদের ইমেইল না পেলে ফোনে Spam বা Promotions ফোল্ডার চেক করুন এবং “Not Spam” হিসেবে মার্ক করুন।';
  DICT['Thank you! Your application has been received, and our team will contact you within 24 hours to confirm enrolment. Please check your Spam or Promotions folder on your phone if you do not see our email, and mark it as "Not Spam".'] = 'ধন্যবাদ! আপনার আবেদন গৃহীত হয়েছে, আমাদের টিম 24 ঘণ্টার মধ্যে ভর্তি নিশ্চিত করতে যোগাযোগ করবে। আমাদের ইমেইল না পেলে ফোনে Spam বা Promotions ফোল্ডার চেক করুন এবং “Not Spam” হিসেবে মার্ক করুন।';
  DICT['Thank you for reaching out! We typically reply within 24 hours by email or WhatsApp. Please check your Spam or Promotions folder on your phone if you do not see our email, and mark it as "Not Spam".'] = 'যোগাযোগের জন্য ধন্যবাদ! আমরা সাধারণত 24 ঘণ্টার মধ্যে ইমেইল বা WhatsApp-এ উত্তর দিই। আমাদের ইমেইল না পেলে ফোনে Spam বা Promotions ফোল্ডার চেক করুন এবং “Not Spam” হিসেবে মার্ক করুন।';
  DICT['Sorry, something went wrong sending your request. Please try again, or reach us directly on WhatsApp / email.'] = 'দুঃখিত, আপনার অনুরোধ পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন, অথবা WhatsApp / ইমেইলে সরাসরি যোগাযোগ করুন।';
  DICT['Sorry, something went wrong sending your application. Please try again, or reach us directly on WhatsApp / email.'] = 'দুঃখিত, আপনার আবেদন পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন, অথবা WhatsApp / ইমেইলে সরাসরি যোগাযোগ করুন।';
  DICT['Sorry, something went wrong sending your message. Please try again, or reach us directly on WhatsApp / email.'] = 'দুঃখিত, আপনার মেসেজ পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন, অথবা WhatsApp / ইমেইলে সরাসরি যোগাযোগ করুন।';
  DICT['A student photo is required for the ID card, except for female students aged 12 and above.'] = 'আইডি কার্ডের জন্য শিক্ষার্থীর ছবি আবশ্যক, তবে 12 বছর বা তার বেশি বয়সী মহিলা শিক্ষার্থীদের জন্য ব্যতিক্রম।';
  /* ---------- Placeholders ---------- */
  DICT['e.g. Ibrahim Rahman'] = 'যেমন: ইব্রাহিম রহমান';
  DICT['e.g. 9'] = 'যেমন: 9';
  DICT['e.g. Weekdays, 5–7 PM (your timezone)'] = 'যেমন: সপ্তাহের দিন, বিকেল 5–7টা (আপনার টাইমজোন)';
  DICT['Anything else we should know?'] = 'আর কিছু জানানো দরকার?';
  DICT['Full name'] = 'পূর্ণ নাম';
  DICT['e.g. Question about Tajweed course'] = 'যেমন: তাজউইদ কোর্স নিয়ে প্রশ্ন';
  DICT['How can we help?'] = 'আমরা কীভাবে সাহায্য করতে পারি?';
  /* ---------- About / Courses / FAQ headings ---------- */
  DICT['Our Story, Our Mission, Our Promise to Every Family'] = 'আমাদের গল্প, আমাদের লক্ষ্য, প্রতিটি পরিবারের প্রতি আমাদের প্রতিশ্রুতি';
  DICT['Al Quranul Academy exists to make authentic, correct Quran education accessible — wherever in the world you call home.'] = 'আল কুরআনুল একাডেমি খাঁটি, সঠিক কুরআন শিক্ষা সবার কাছে পৌঁছে দিতে কাজ করে — পৃথিবীর যেখানেই আপনি থাকুন না কেন।';
  DICT['Our Story'] = 'আমাদের গল্প';
  DICT['Built for Families Living Far From Home'] = 'দূরে বসবাসরত পরিবারগুলোর জন্য তৈরি';
  DICT['Our Mission'] = 'আমাদের লক্ষ্য';
  DICT['Our Vision'] = 'আমাদের ভিশন';
  DICT['Our Teaching Method'] = 'আমাদের শিক্ষাদান পদ্ধতি';
  DICT['Structured Progress, Personal Pace'] = 'সুসংগঠিত অগ্রগতি, ব্যক্তিগত গতি';
  DICT['One Student, One Teacher'] = 'একজন শিক্ষার্থী, একজন শিক্ষক';
  DICT['Tracked, Reported Progress'] = 'পর্যবেক্ষিত, রিপোর্টকৃত অগ্রগতি';
  DICT['Correction Before Speed'] = 'গতির আগে সংশোধন';
  DICT['Who We Serve'] = 'আমরা কাদের সেবা দিই';
  DICT['Families Around the World'] = 'বিশ্বজুড়ে পরিবার';
  DICT['Children (4+)'] = 'শিশু (4+)';
  DICT['Teenagers'] = 'কিশোর-কিশোরী';
  DICT['Adults'] = 'প্রাপ্তবয়স্ক';
  DICT['Diaspora Families'] = 'প্রবাসী পরিবার';
  DICT['Why Families Trust Us'] = 'পরিবারগুলো কেন আমাদের বিশ্বাস করে';
  DICT['Sincerity, Excellence, and Real Progress'] = 'আন্তরিকতা, উৎকর্ষতা ও বাস্তব অগ্রগতি';
  DICT['Sincerity'] = 'আন্তরিকতা';
  DICT['Excellence'] = 'উৎকর্ষতা';
  DICT['Authentic Islamic Education'] = 'খাঁটি ইসলামি শিক্ষা';
  DICT['Meet a qualified teacher and experience our teaching style with a completely free trial class.'] = 'একজন যোগ্য শিক্ষকের সাথে পরিচিত হোন এবং সম্পূর্ণ ফ্রি ট্রায়াল ক্লাসে আমাদের শিক্ষাদান পদ্ধতি দেখুন।';
  DICT['Courses for Every Stage of the Quran Journey'] = 'কুরআন যাত্রার প্রতিটি ধাপের জন্য কোর্স';
  DICT['From first Arabic letters to complete memorisation — structured, one-to-one courses guided by qualified teachers.'] = 'প্রথম আরবি অক্ষর থেকে পূর্ণ মুখস্থ পর্যন্ত — যোগ্য শিক্ষকদের পরিচালনায় সুসংগঠিত, ওয়ান-টু-ওয়ান কোর্স।';
  DICT['The first step on the Quran journey — Arabic letters, sounds, and joining rules.'] = 'কুরআন যাত্রার প্রথম ধাপ — আরবি অক্ষর, উচ্চারণ ও যুক্ত করার নিয়ম।';
  DICT['Read the full Quran fluently, word by word, page by page.'] = 'শব্দ ধরে ধরে, পৃষ্ঠা ধরে ধরে পুরো কুরআন সাবলীলভাবে পড়ুন।';
  DICT['Master the rules that make your recitation beautiful and correct.'] = 'আপনার তিলাওয়াত সুন্দর ও সঠিক করার নিয়মগুলো আয়ত্ত করুন।';
  DICT['Memorise the Quran with a structured, supportive revision system.'] = 'সুসংগঠিত, সহায়ক রিভিশন পদ্ধতিতে কুরআন মুখস্থ করুন।';
  DICT['Beginner · Age 4+'] = 'প্রাথমিক · বয়স 4+';
  DICT['Beginner to Intermediate'] = 'প্রাথমিক থেকে মধ্যম';
  DICT['All levels, by placement'] = 'সব স্তর, মূল্যায়ন অনুযায়ী';
  DICT['Not Sure Where to Start?'] = 'কোথা থেকে শুরু করবেন বুঝতে পারছেন না?';
  DICT['Book a Free Trial and We\'ll Recommend a Course'] = 'ফ্রি ট্রায়াল বুক করুন, আমরা একটি কোর্স সুপারিশ করবো';
  DICT['Meet a qualified teacher, get assessed for free, and start on the course that fits your current level.'] = 'একজন যোগ্য শিক্ষকের সাথে পরিচিত হোন, বিনামূল্যে মূল্যায়ন পান, এবং আপনার বর্তমান স্তরের সাথে মানানসই কোর্সে শুরু করুন।';
  DICT['Everything families ask us before booking a free trial or enrolling — if you don\'t see your question here, just contact us.'] = 'ফ্রি ট্রায়াল বুক করার বা ভর্তির আগে পরিবারগুলো যা যা জিজ্ঞেস করে — আপনার প্রশ্ন এখানে না পেলে সরাসরি যোগাযোগ করুন।';
  DICT['General'] = 'সাধারণ';
  DICT['Classes & Teachers'] = 'ক্লাস ও শিক্ষক';
  DICT['Enrolment & Payment'] = 'ভর্তি ও পেমেন্ট';
  DICT['Still Have a Question?'] = 'আরও প্রশ্ন আছে?';
  DICT['Our team is happy to help — reach out directly and we will respond quickly.'] = 'আমাদের টিম সাহায্য করতে প্রস্তুত — সরাসরি যোগাযোগ করুন, আমরা দ্রুত উত্তর দেবো।';
  DICT['How are classes conducted?'] = 'ক্লাস কীভাবে হয়?';
  DICT['All classes are conducted live, online, one-to-one between a qualified teacher and the student, using video call software on a computer, tablet, or phone.'] = 'সব ক্লাস কম্পিউটার, ট্যাবলেট বা ফোনে ভিডিও কলের মাধ্যমে একজন যোগ্য শিক্ষক ও শিক্ষার্থীর মধ্যে লাইভ, অনলাইন, ওয়ান-টু-ওয়ান হয়।';
  DICT['Can adults join?'] = 'প্রাপ্তবয়স্করা কি যোগ দিতে পারবেন?';
  DICT['Yes. We teach students of every age, from young children to adults learning to read or memorise the Quran for the first time.'] = 'হ্যাঁ। আমরা সব বয়সের শিক্ষার্থী পড়াই, ছোট শিশু থেকে শুরু করে প্রথমবার কুরআন পড়তে বা মুখস্থ করতে শেখা প্রাপ্তবয়স্ক পর্যন্ত।';
  DICT['Can kids join?'] = 'শিশুরা কি যোগ দিতে পারবে?';
  DICT['Yes, from age 4 and above, starting with Noorani Qaida to build strong foundations in Arabic letters and pronunciation.'] = 'হ্যাঁ, 4 বছর বয়স থেকে, আরবি অক্ষর ও উচ্চারণের শক্ত ভিত্তি গড়তে নূরানী কায়দা দিয়ে শুরু করে।';
  DICT['Do you provide one-to-one classes?'] = 'আপনারা কি ওয়ান-টু-ওয়ান ক্লাস দেন?';
  DICT['Yes, every class at Al Quranul Academy is one-to-one — no shared or group sessions — so your teacher\'s full attention is on you or your child.'] = 'হ্যাঁ, আল কুরআনুল একাডেমির প্রতিটি ক্লাস ওয়ান-টু-ওয়ান — কোনো শেয়ার্ড বা গ্রুপ সেশন নেই — তাই শিক্ষকের পূর্ণ মনোযোগ আপনার বা আপনার সন্তানের ওপর থাকে।';
  DICT['Can I choose class timings?'] = 'আমি কি ক্লাসের সময় বেছে নিতে পারবো?';
  DICT['Yes, class times are fully flexible and arranged around your timezone and family schedule.'] = 'হ্যাঁ, ক্লাসের সময় সম্পূর্ণ ফ্লেক্সিবল এবং আপনার টাইমজোন ও পারিবারিক সময়সূচির সাথে মানিয়ে ঠিক করা হয়।';
  DICT['Yes, simply let us know your preference when booking a free trial or submitting your admission application.'] = 'হ্যাঁ, ফ্রি ট্রায়াল বুক করার সময় বা ভর্তির আবেদন জমা দেওয়ার সময় আপনার পছন্দ জানিয়ে দিন।';
  DICT['How do payments work?'] = 'পেমেন্ট কীভাবে হয়?';
  DICT['Payment details are shared once your free trial is complete and you decide to enrol; our admissions team will walk you through available plans.'] = 'ফ্রি ট্রায়াল শেষ হলে এবং ভর্তির সিদ্ধান্ত নিলে পেমেন্টের বিস্তারিত জানানো হয়; আমাদের ভর্তি টিম উপলব্ধ প্ল্যানগুলো বুঝিয়ে দেবে।';
  DICT['Can I learn from abroad?'] = 'আমি কি বিদেশ থেকে শিখতে পারবো?';
  DICT['Yes — we teach students across France, the UK, Italy, Germany, Canada, the USA, Saudi Arabia, the UAE, Qatar, Oman, Kuwait, Malaysia, Australia, and beyond.'] = 'হ্যাঁ — আমরা ফ্রান্স, যুক্তরাজ্য, ইতালি, জার্মানি, কানাডা, যুক্তরাষ্ট্র, সৌদি আরব, সংযুক্ত আরব আমিরাত, কাতার, ওমান, কুয়েত, মালয়েশিয়া, অস্ট্রেলিয়া এবং আরও অনেক দেশের শিক্ষার্থী পড়াই।';
  DICT['Yes, completely free with no obligation to continue.'] = 'হ্যাঁ, সম্পূর্ণ ফ্রি, চালিয়ে যাওয়ার কোনো বাধ্যবাধকতা নেই।';
  DICT['How soon can my child start?'] = 'আমার সন্তান কত তাড়াতাড়ি শুরু করতে পারবে?';
  DICT['Right away — after a free trial class, we can typically begin regular classes within the same week, based on your preferred schedule.'] = 'সাথে সাথেই — ফ্রি ট্রায়াল ক্লাসের পর, আপনার পছন্দের সময়সূচি অনুযায়ী সাধারণত একই সপ্তাহের মধ্যে নিয়মিত ক্লাস শুরু করা যায়।';
  DICT['Can I switch courses later?'] = 'আমি কি পরে কোর্স বদলাতে পারবো?';
  DICT['Yes. Many students move from Noorani Qaida into Nazera Quran, and later into Tajweed or Hifz, once ready — your teacher will guide the transition.'] = 'হ্যাঁ। অনেক শিক্ষার্থী প্রস্তুত হলে নূরানী কায়দা থেকে নাজেরা কুরআনে, পরে তাজউইদ বা হিফজে যায় — আপনার শিক্ষক এই পরিবর্তনে পথ দেখাবেন।';
  DICT['What if I want to change teachers?'] = 'আমি যদি শিক্ষক বদলাতে চাই?';
  DICT['You\'re welcome to request a different teacher at any time; we want every student to feel comfortable and confident in their sessions.'] = 'যেকোনো সময় আপনি অন্য শিক্ষক চাইতে পারবেন; আমরা চাই প্রতিটি শিক্ষার্থী তার সেশনে স্বাচ্ছন্দ্য ও আত্মবিশ্বাসী বোধ করুক।';

  DICT['Interactive Lessons'] = 'ইন্টারঅ্যাক্টিভ পাঠ';
  DICT['e.g. 12'] = 'যেমন: 12';
  DICT['If student is a minor'] = 'শিক্ষার্থী অপ্রাপ্তবয়স্ক হলে';
  DICT['e.g. Evenings, GMT+1'] = 'যেমন: সন্ধ্যা, GMT+1';
  DICT['Anything else we should know about the student?'] = 'শিক্ষার্থী সম্পর্কে আর কিছু জানানো দরকার?';
  DICT['Photo is required for the ID card, except for female students aged 12 and above, for whom it is optional. The photo is used only for this student\'s own ID card, never for anyone else.'] = 'আইডি কার্ডের জন্য ছবি আবশ্যক, তবে 12 বছর বা তার বেশি বয়সী মহিলা শিক্ষার্থীদের জন্য ঐচ্ছিক। ছবিটি শুধু এই শিক্ষার্থীর নিজের আইডি কার্ডের জন্য ব্যবহৃত হবে, অন্য কারো জন্য নয়।';

  DICT["Al Quranul Academy began with a simple observation: Bangladeshi and Muslim families living abroad often struggle to find Quran teachers who combine real qualification, patience with children, and scheduling that respects busy, cross-timezone family life."] = "আল কুরআনুল একাডেমি একটি সহজ পর্যবেক্ষণ থেকে শুরু হয়েছে: প্রবাসী বাংলাদেশি ও মুসলিম পরিবারগুলো প্রায়ই এমন কুরআন শিক্ষক খুঁজে পেতে কষ্ট করে, যাদের আসল যোগ্যতা আছে, শিশুদের প্রতি ধৈর্য আছে, এবং ব্যস্ত, ভিন্ন টাইমজোনের পারিবারিক জীবনের সাথে মানানসই সময়সূচি দিতে পারেন।";
  DICT["We set out to build an academy where every class is one-to-one, every teacher is carefully selected, and every family — whether in Dhaka or Doha, Paris or Perth — can access the same standard of authentic Quran education."] = "আমরা এমন একটি একাডেমি গড়তে চেয়েছি, যেখানে প্রতিটি ক্লাস ওয়ান-টু-ওয়ান, প্রতিটি শিক্ষক সতর্কভাবে নির্বাচিত, এবং প্রতিটি পরিবার — ঢাকায় হোক বা দোহায়, প্যারিসে হোক বা পার্থে — একই মানের খাঁটি কুরআন শিক্ষা পেতে পারে।";
  DICT["To make authentic Quran education accessible for children and adults through flexible, one-to-one online classes — regardless of where in the world a family lives."] = "ফ্লেক্সিবল, ওয়ান-টু-ওয়ান অনলাইন ক্লাসের মাধ্যমে শিশু ও প্রাপ্তবয়স্কদের জন্য খাঁটি কুরআন শিক্ষা সহজলভ্য করা — পরিবার পৃথিবীর যেখানেই থাকুক না কেন।";
  DICT["To become one of the most trusted online Quran academies for Bangladeshi and international Muslim families, known for the quality of our teachers and the care behind every class."] = "বাংলাদেশি ও আন্তর্জাতিক মুসলিম পরিবারগুলোর জন্য সবচেয়ে বিশ্বস্ত অনলাইন কুরআন একাডেমিগুলোর একটি হওয়া, শিক্ষকদের মান ও প্রতিটি ক্লাসের পেছনের যত্নের জন্য পরিচিত।";
  DICT["Every course follows a clear, proven structure — but every class is shaped around the individual student in front of the teacher."] = "প্রতিটি কোর্স একটি স্পষ্ট, প্রমাণিত কাঠামো অনুসরণ করে — তবে প্রতিটি ক্লাস শিক্ষকের সামনে থাকা শিক্ষার্থীকে কেন্দ্র করে সাজানো হয়।";
  DICT["No shared classrooms — full attention on your pronunciation, pace, and questions, every single session."] = "কোনো শেয়ার্ড ক্লাসরুম নেই — প্রতিটি সেশনে আপনার উচ্চারণ, গতি ও প্রশ্নের ওপর পূর্ণ মনোযোগ।";
  DICT["Teachers log progress after every class, so parents always know exactly where their child stands."] = "শিক্ষকরা প্রতিটি ক্লাসের পর অগ্রগতি লিখে রাখেন, তাই অভিভাবকরা সবসময় ঠিক জানতে পারেন সন্তান কোথায় দাঁড়িয়ে আছে।";
  DICT["We prioritise correct pronunciation and Tajweed over rushing through material."] = "আমরা দ্রুত শেষ করার চেয়ে সঠিক উচ্চারণ ও তাজউইদকে অগ্রাধিকার দিই।";
  DICT["We proudly teach students across France, the UK, Italy, Germany, Canada, the USA, Saudi Arabia, the UAE, Qatar, Oman, Kuwait, Malaysia, Australia, and beyond."] = "আমরা গর্বের সাথে ফ্রান্স, যুক্তরাজ্য, ইতালি, জার্মানি, কানাডা, যুক্তরাষ্ট্র, সৌদি আরব, সংযুক্ত আরব আমিরাত, কাতার, ওমান, কুয়েত, মালয়েশিয়া, অস্ট্রেলিয়া এবং আরও অনেক দেশের শিক্ষার্থী পড়াই।";
  DICT["Building letters, sounds, and reading habits from the very first class."] = "প্রথম ক্লাস থেকেই অক্ষর, উচ্চারণ ও পড়ার অভ্যাস গড়ে তোলা।";
  DICT["Structured Tajweed and Hifz study that fits around school life."] = "স্কুল জীবনের সাথে মানানসই সুসংগঠিত তাজউইদ ও হিফজ পড়াশোনা।";
  DICT["Learning to read or refine recitation, at any age or starting point."] = "যেকোনো বয়সে বা যেকোনো স্তর থেকে পড়তে শেখা বা তিলাওয়াত শুদ্ধ করা।";
  DICT["Bangladeshi and Muslim families abroad, taught in a language and manner they trust."] = "প্রবাসী বাংলাদেশি ও মুসলিম পরিবার, তাদের বিশ্বস্ত ভাষা ও পদ্ধতিতে পড়ানো হয়।";
  DICT["Every class is taught with genuine care for the student's growth, not just the syllabus."] = "প্রতিটি ক্লাস শুধু সিলেবাসের জন্য নয়, শিক্ষার্থীর বৃদ্ধির প্রতি আন্তরিক যত্ন নিয়ে পড়ানো হয়।";
  DICT["20+ qualified teachers held to a consistent standard of pronunciation and pedagogy."] = "উচ্চারণ ও শিক্ষাদান পদ্ধতির একটি ধারাবাহিক মানে ধরে রাখা 20+ যোগ্য শিক্ষক।";
  DICT["Rooted in correct, traditional methods of Quran instruction, delivered with modern flexibility."] = "কুরআন শিক্ষার সঠিক, ঐতিহ্যবাহী পদ্ধতিতে গভীরভাবে প্রোথিত, আধুনিক নমনীয়তায় পরিবেশিত।";
  DICT["Learn From Qualified Quran Teachers"] = "যোগ্য কুরআন শিক্ষকদের কাছ থেকে শিখুন";
  DICT["20+ experienced male and female teachers, carefully selected for their teaching ability, patience, and commitment to every student's progress."] = "শিক্ষাদান দক্ষতা, ধৈর্য এবং প্রতিটি শিক্ষার্থীর অগ্রগতির প্রতি প্রতিশ্রুতির জন্য সতর্কভাবে নির্বাচিত 20+ অভিজ্ঞ পুরুষ ও মহিলা শিক্ষক।";
  DICT["Our Teachers"] = "আমাদের শিক্ষকবৃন্দ";
  DICT["What Every Teacher Brings to Class"] = "প্রতিটি শিক্ষক ক্লাসে যা নিয়ে আসেন";
  DICT["20+ Qualified Teachers"] = "20+ যোগ্য শিক্ষক";
  DICT["A dedicated team of experienced male and female Quran teachers, passionate about helping students learn correctly."] = "সঠিকভাবে শিখতে শিক্ষার্থীদের সাহায্য করতে আগ্রহী অভিজ্ঞ পুরুষ ও মহিলা কুরআন শিক্ষকদের একটি নিবেদিত দল।";
  DICT["Friendly & Patient"] = "বন্ধুত্বপূর্ণ ও ধৈর্যশীল";
  DICT["A teaching style built for real progress with children and adults alike, without pressure or rush."] = "শিশু ও প্রাপ্তবয়স্ক সবার বাস্তব অগ্রগতির জন্য তৈরি শিক্ষাদান পদ্ধতি, চাপ বা তাড়াহুড়ো ছাড়া।";
  DICT["Personalised Classes"] = "ব্যক্তিগত ক্লাস";
  DICT["One-to-one sessions shaped around each student's current level and pace."] = "প্রতিটি শিক্ষার্থীর বর্তমান স্তর ও গতি অনুযায়ী সাজানো ওয়ান-টু-ওয়ান সেশন।";
  DICT["Class times arranged around your timezone and family routine."] = "আপনার টাইমজোন ও পারিবারিক রুটিনের সাথে মানিয়ে ঠিক করা ক্লাসের সময়।";
  DICT["Engaging online teaching methods designed to hold a young learner's attention."] = "ছোট শিক্ষার্থীর মনোযোগ ধরে রাখার জন্য তৈরি আকর্ষণীয় অনলাইন শিক্ষাদান পদ্ধতি।";
  DICT["Correct Pronunciation Focus"] = "সঠিক উচ্চারণের ওপর গুরুত্ব";
  DICT["Careful, ongoing attention to Makharij and Tajweed from the very first class."] = "প্রথম ক্লাস থেকেই মাখরাজ ও তাজউইদের প্রতি সতর্ক, ধারাবাহিক মনোযোগ।";
  DICT["Choose Your Teacher"] = "আপনার শিক্ষক বেছে নিন";
  DICT["Male or Female — Your Choice"] = "পুরুষ বা মহিলা — আপনার পছন্দ";
  DICT["We know teacher preference matters to many families. Let us know your preference when booking your free trial or admission, and we will match you accordingly."] = "আমরা জানি অনেক পরিবারের কাছে শিক্ষক পছন্দ গুরুত্বপূর্ণ। ফ্রি ট্রায়াল বা ভর্তির সময় আপনার পছন্দ জানিয়ে দিন, আমরা সেই অনুযায়ী মিলিয়ে দেবো।";
  DICT["Male Teachers"] = "পুরুষ শিক্ষক";
  DICT["Experienced in teaching boys and men of all ages, from first letters through Hifz."] = "প্রথম অক্ষর থেকে হিফজ পর্যন্ত সব বয়সের ছেলে ও পুরুষদের পড়ানোর অভিজ্ঞতা।";
  DICT["Female Teachers"] = "মহিলা শিক্ষক";
  DICT["Experienced in teaching girls and women of all ages, in a comfortable, supportive setting."] = "স্বাচ্ছন্দ্যময়, সহায়ক পরিবেশে সব বয়সের মেয়ে ও মহিলাদের পড়ানোর অভিজ্ঞতা।";
  DICT["Meet Your Teacher, Free of Charge"] = "বিনামূল্যে আপনার শিক্ষকের সাথে পরিচিত হোন";
  DICT["Book a free trial class and experience our teaching approach firsthand."] = "একটি ফ্রি ট্রায়াল ক্লাস বুক করুন এবং আমাদের শিক্ষাদান পদ্ধতি নিজে দেখুন।";
  DICT["Class Format"] = "ক্লাসের ধরন";
  DICT["Teacher Choice"] = "শিক্ষক পছন্দ";
  DICT["Quran Learning & Parenting Insights"] = "কুরআন শেখা ও অভিভাবকত্বের ধারণা";
  DICT["Practical articles on Quran learning, Tajweed, Hifz, and raising children with a strong connection to the Quran."] = "কুরআন শেখা, তাজউইদ, হিফজ এবং কুরআনের সাথে দৃঢ় সম্পর্ক গড়ে সন্তান বড় করা নিয়ে ব্যবহারিক লেখা।";
  DICT["Quran Learning"] = "কুরআন শেখা";
  DICT["Parenting"] = "অভিভাবকত্ব";
  DICT["Islamic Education"] = "ইসলামি শিক্ষা";
  DICT["Children"] = "শিশু";
  DICT["Hifz"] = "হিফজ";
  DICT["Ramadan"] = "রমজান";
  DICT["Islamic Lifestyle"] = "ইসলামি জীবনধারা";
  DICT["Why Every Child Should Start With Noorani Qaida"] = "কেন প্রতিটি শিশুর নূরানী কায়দা দিয়ে শুরু করা উচিত";
  DICT["A strong foundation in Arabic letters and sounds makes every stage of the Quran journey easier."] = "আরবি অক্ষর ও উচ্চারণের শক্ত ভিত্তি কুরআন যাত্রার প্রতিটি ধাপ সহজ করে দেয়।";
  DICT["Building a Consistent Quran Routine at Home"] = "বাড়িতে নিয়মিত কুরআন রুটিন গড়া";
  DICT["Consistency matters more than duration. Simple habits parents can build around online classes."] = "সময়কালের চেয়ে নিয়মিততা বেশি গুরুত্বপূর্ণ। অনলাইন ক্লাসের সাথে মানিয়ে অভিভাবকরা গড়তে পারেন এমন সহজ অভ্যাস।";
  DICT["5 Common Tajweed Mistakes and How to Fix Them"] = "5টি সাধারণ তাজউইদ ভুল এবং কীভাবে ঠিক করবেন";
  DICT["From rushed Madd letters to unclear Qalqalah — small, correctable habits that matter."] = "তাড়াহুড়ো করা মদ্দ অক্ষর থেকে অস্পষ্ট কলকলা পর্যন্ত — ছোট, সংশোধনযোগ্য অভ্যাস, যা অনেক গুরুত্বপূর্ণ।";
  DICT["Practical Memorisation Tips for Hifz Students"] = "হিফজ শিক্ষার্থীদের জন্য ব্যবহারিক মুখস্থ টিপস";
  DICT["Sabaq, Sabqi, and Manzil — how structured revision protects what you've already memorised."] = "সবক, সবকী ও মঞ্জিল — সুসংগঠিত রিভিশন কীভাবে আপনার ইতিমধ্যে মুখস্থ করা অংশ রক্ষা করে।";
  DICT["Setting Realistic Quran Goals This Ramadan"] = "এই রমজানে বাস্তবসম্মত কুরআন লক্ষ্য ঠিক করা";
  DICT["Ramadan is a natural motivator — here is how to turn it into a routine that lasts."] = "রমজান একটি স্বাভাবিক অনুপ্রেরণা — এখানে দেখুন কীভাবে এটিকে স্থায়ী রুটিনে পরিণত করবেন।";
  DICT["What to Look for in an Online Quran Academy"] = "একটি অনলাইন কুরআন একাডেমিতে কী দেখবেন";
  DICT["Qualified teachers, one-to-one attention, and real progress tracking to look out for."] = "যোগ্য শিক্ষক, ওয়ান-টু-ওয়ান মনোযোগ এবং বাস্তব অগ্রগতি পর্যবেক্ষণ — যেগুলো দেখে নেবেন।";
  DICT["June 18, 2026"] = "18 জুন, 2026";
  DICT["June 2, 2026"] = "2 জুন, 2026";
  DICT["May 20, 2026"] = "20 মে, 2026";
  DICT["May 6, 2026"] = "6 মে, 2026";
  DICT["April 22, 2026"] = "22 এপ্রিল, 2026";
  DICT["April 8, 2026"] = "8 এপ্রিল, 2026";
  DICT["More Articles"] = "আরও লেখা";
  DICT["Ready to start learning?"] = "শিখতে শুরু করতে প্রস্তুত?";
  DICT["Book a completely free trial class today."] = "আজই সম্পূর্ণ ফ্রি ট্রায়াল ক্লাস বুক করুন।";
  DICT["Category"] = "বিভাগ";
  DICT["Post Title"] = "পোস্টের শিরোনাম";
  DICT["How Al Quranul Academy collects, uses, and protects your information."] = "আল কুরআনুল একাডেমি কীভাবে আপনার তথ্য সংগ্রহ, ব্যবহার ও সুরক্ষা করে।";
  DICT["Al Quranul Academy respects the privacy of every family we work with. Information submitted through our Free Trial, Admission, or Contact forms — such as student name, age, country, and contact details — is used solely to schedule classes, communicate with parents and guardians, and provide our teaching services."] = "আল কুরআনুল একাডেমি আমাদের সাথে কাজ করা প্রতিটি পরিবারের গোপনীয়তাকে সম্মান করে। ফ্রি ট্রায়াল, ভর্তি বা যোগাযোগ ফর্মের মাধ্যমে জমা দেওয়া তথ্য — যেমন শিক্ষার্থীর নাম, বয়স, দেশ ও যোগাযোগের বিবরণ — শুধু ক্লাসের সময় ঠিক করতে, অভিভাবকদের সাথে যোগাযোগ করতে এবং আমাদের শিক্ষাদান সেবা দিতে ব্যবহৃত হয়।";
  DICT["Information We Collect"] = "আমরা যে তথ্য সংগ্রহ করি";
  DICT["We collect the details you voluntarily provide through our forms, including names, ages, countries, WhatsApp numbers, and email addresses, along with course and teacher preferences."] = "আমরা ফর্মের মাধ্যমে আপনার স্বেচ্ছায় দেওয়া বিবরণ সংগ্রহ করি, যার মধ্যে নাম, বয়স, দেশ, WhatsApp নম্বর ও ইমেইল ঠিকানা, সাথে কোর্স ও শিক্ষক পছন্দ অন্তর্ভুক্ত।";
  DICT["How We Use It"] = "আমরা এটি কীভাবে ব্যবহার করি";
  DICT["Your information is used to confirm trial classes, manage enrolment, communicate class schedules, and share progress updates. We do not sell or rent family information to third parties."] = "আপনার তথ্য ট্রায়াল ক্লাস নিশ্চিত করতে, ভর্তি পরিচালনা করতে, ক্লাসের সময়সূচি জানাতে এবং অগ্রগতি আপডেট শেয়ার করতে ব্যবহৃত হয়। আমরা পরিবারের তথ্য তৃতীয় পক্ষের কাছে বিক্রি বা ভাড়া দিই না।";
  DICT["Communication"] = "যোগাযোগ";
  DICT["We may contact you by WhatsApp, email, or phone regarding class scheduling, trial confirmation, and enrolment updates."] = "ক্লাসের সময়সূচি, ট্রায়াল নিশ্চিতকরণ ও ভর্তি আপডেটের বিষয়ে আমরা WhatsApp, ইমেইল বা ফোনে আপনার সাথে যোগাযোগ করতে পারি।";
  DICT["For any privacy-related questions, please reach us at alquranulacademy@gmail.com."] = "গোপনীয়তা সংক্রান্ত যেকোনো প্রশ্নের জন্য অনুগ্রহ করে alquranulacademy@gmail.com-এ যোগাযোগ করুন।";
  DICT["Terms & Conditions"] = "শর্তাবলি";
  DICT["The terms that govern enrolment and use of Al Quranul Academy's services."] = "আল কুরআনুল একাডেমির সেবায় ভর্তি ও ব্যবহার পরিচালনাকারী শর্তাবলি।";
  DICT["Enrolment"] = "ভর্তি";
  DICT["Enrolment in any course begins after a completed admission application and confirmation from our team. A free trial class does not constitute enrolment."] = "যেকোনো কোর্সে ভর্তি সম্পূর্ণ ভর্তি আবেদন ও আমাদের টিমের নিশ্চিতকরণের পর শুরু হয়। একটি ফ্রি ট্রায়াল ক্লাস ভর্তি হিসেবে গণ্য হয় না।";
  DICT["Classes & Scheduling"] = "ক্লাস ও সময়সূচি";
  DICT["All classes are conducted one-to-one, online, at a time mutually agreed between the family and the assigned teacher. Reasonable notice is appreciated for rescheduling requests."] = "সব ক্লাস ওয়ান-টু-ওয়ান, অনলাইনে, পরিবার ও নির্ধারিত শিক্ষকের পারস্পরিক সম্মত সময়ে হয়। সময় বদলানোর অনুরোধের জন্য যুক্তিসঙ্গত আগাম নোটিশ প্রশংসিত।";
  DICT["The free trial class is offered at no cost and with no obligation to enrol. One free trial is available per student."] = "ফ্রি ট্রায়াল ক্লাস বিনামূল্যে দেওয়া হয়, ভর্তির কোনো বাধ্যবাধকতা ছাড়া। প্রতি শিক্ষার্থীর জন্য একটি ফ্রি ট্রায়াল উপলব্ধ।";
  DICT["Conduct"] = "আচরণ";
  DICT["We expect all students and family members to engage respectfully with teachers and staff at all times."] = "আমরা আশা করি সব শিক্ষার্থী ও পরিবারের সদস্যরা সবসময় শিক্ষক ও স্টাফদের সাথে সম্মানজনকভাবে আচরণ করবেন।";
  DICT["Changes to These Terms"] = "এই শর্তাবলিতে পরিবর্তন";
  DICT["Al Quranul Academy may update these terms from time to time; the latest version will always be available on this page."] = "আল কুরআনুল একাডেমি সময়ে সময়ে এই শর্তাবলি আপডেট করতে পারে; সর্বশেষ সংস্করণ সবসময় এই পেজে পাওয়া যাবে।";
  DICT["Learn Quran, Build Character — reach us any of these ways:"] = "কুরআন শিখুন, চরিত্র গড়ুন — যেকোনো মাধ্যমে আমাদের সাথে যোগাযোগ করুন:";
  DICT["Call Us"] = "আমাদের কল করুন";
  DICT["Visit Our Website"] = "আমাদের ওয়েবসাইট দেখুন";
  DICT["Facebook Page"] = "Facebook পেজ";
  DICT["← Back to Home"] = "← হোমে ফিরুন";
  DICT["© 2026 Al Quranul Academy. Learn Quran, Build Character."] = "© 2026 আল কুরআনুল একাডেমি। কুরআন শিখুন, চরিত্র গড়ুন।";
  DICT["Overview"] = "সারসংক্ষেপ";
  DICT["What You'll Learn"] = "আপনি যা শিখবেন";
  DICT["Learning Outcomes"] = "শেখার ফলাফল";
  DICT["By the End of This Course"] = "এই কোর্স শেষে";
  DICT["Who Can Join"] = "কারা যোগ দিতে পারবে";
  DICT["Course FAQs"] = "কোর্স সংক্রান্ত প্রশ্ন";
  DICT["Course Title"] = "কোর্সের শিরোনাম";
  DICT["Course tagline."] = "কোর্সের ট্যাগলাইন।";
  DICT["Thank you! Your free trial request has been received — our team will confirm your class time shortly by WhatsApp or email."] = "ধন্যবাদ! আপনার ফ্রি ট্রায়াল অনুরোধ গৃহীত হয়েছে — আমাদের টিম WhatsApp বা ইমেইলের মাধ্যমে শীঘ্রই আপনার ক্লাসের সময় নিশ্চিত করবে।";
  DICT["Thank you for applying! Your application has been received, and our team will contact you within 24 hours to confirm enrolment."] = "ধন্যবাদ! আপনার আবেদন গৃহীত হয়েছে, আমাদের টিম 24 ঘণ্টার মধ্যে ভর্তি নিশ্চিত করতে যোগাযোগ করবে।";
  DICT["Thank you for reaching out! We typically reply within 24 hours by email or WhatsApp."] = "যোগাযোগের জন্য ধন্যবাদ! আমরা সাধারণত 24 ঘণ্টার মধ্যে ইমেইল বা WhatsApp-এ উত্তর দিই।";

  DICT['4 min read'] = '4 মিনিটের পড়া';
  DICT['5 min read'] = '5 মিনিটের পড়া';
  DICT['6 min read'] = '6 মিনিটের পড়া';
  DICT['3 min read'] = '3 মিনিটের পড়া';

  /* ---------- Engine ---------- */
  var textOriginals = new Map();
  var phOriginals = new Map();

  function translateNode(node) {
    var t = node.data.trim();
    if (!t || !(t in DICT)) return;
    if (!textOriginals.has(node)) textOriginals.set(node, node.data);
    /* Preserve surrounding whitespace: the brand "Al Quranul " ends with a
       space before the accent span — dropping it glued the two Bengali
       words together (Sir, 2026-10-26). */
    var lead = node.data.match(/^\s*/)[0];
    var trail = node.data.match(/\s*$/)[0];
    node.data = lead + DICT[t] + trail;
  }
  function restoreNode(node) {
    if (textOriginals.has(node)) { node.data = textOriginals.get(node); textOriginals.delete(node); }
  }
  function walkAndTranslate(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode;
        if (!p) return NodeFilter.FILTER_REJECT;
        var tag = p.nodeName;
        if (tag === 'SCRIPT' || tag === 'STYLE') return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(translateNode);
  }
  function translatePlaceholders(root) {
    var els = root.querySelectorAll ? root.querySelectorAll('input[placeholder], textarea[placeholder]') : [];
    els.forEach(function (el) {
      var t = (el.placeholder || '').trim();
      if (t && (t in DICT)) {
        if (!phOriginals.has(el)) phOriginals.set(el, el.placeholder);
        el.placeholder = DICT[t];
      }
    });
    if (root.nodeName === 'INPUT' || root.nodeName === 'TEXTAREA') {
      var t2 = (root.placeholder || '').trim();
      if (t2 && (t2 in DICT)) {
        if (!phOriginals.has(root)) phOriginals.set(root, root.placeholder);
        root.placeholder = DICT[t2];
      }
    }
  }
  function restorePlaceholders() {
    phOriginals.forEach(function (orig, el) { el.placeholder = orig; });
    phOriginals.clear();
  }
  function restoreAll() {
    textOriginals.forEach(function (orig, node) { try { node.data = orig; } catch (e) {} });
    textOriginals.clear();
    restorePlaceholders();
  }

  function markToggles() {
    document.querySelectorAll('.lang-toggle button').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-lang') === lang);
      b.setAttribute('aria-pressed', b.getAttribute('data-lang') === lang ? 'true' : 'false');
    });
  }
  function buildToggle() {
    var wrap = document.createElement('div');
    wrap.className = 'lang-toggle';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Language');
    var en = document.createElement('button');
    en.type = 'button'; en.setAttribute('data-lang', 'en'); en.textContent = 'EN';
    var bn = document.createElement('button');
    bn.type = 'button'; bn.setAttribute('data-lang', 'bn'); bn.textContent = 'বাংলা';
    wrap.appendChild(en); wrap.appendChild(bn);
    wrap.addEventListener('click', function (ev) {
      var b = ev.target.closest('button[data-lang]');
      if (!b) return;
      setLang(b.getAttribute('data-lang'));
    });
    return wrap;
  }
  function insertToggles() {
    if (isLinksPage) return;
    var cta = document.querySelector('.nav-cta');
    if (cta && !cta.querySelector('.lang-toggle')) {
      var t = cta.querySelector('.nav-toggle');
      if (t) cta.insertBefore(buildToggle(), t); else cta.appendChild(buildToggle());
    }
    var panel = document.querySelector('.mobile-panel');
    if (panel && !panel.querySelector('.lang-toggle')) {
      panel.insertBefore(buildToggle(), panel.firstChild);
    }
    markToggles();
  }
  function setLang(next) {
    lang = (next === 'bn') ? 'bn' : 'en';
    try { localStorage.setItem(KEY, lang); } catch (e) {}
    applyLang();
  }
  function applyLang() {
    document.documentElement.lang = lang;
    if (lang === 'bn') {
      walkAndTranslate(document.body);
      translatePlaceholders(document.body);
    } else {
      restoreAll();
    }
    markToggles();
  }
  window.aqaLang = function () { return lang; };
  window.aqaApplyLang = applyLang;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { insertToggles(); applyLang(); });
  } else {
    insertToggles(); applyLang();
  }
  /* Dynamic content (Firebase course/blog grids, form status messages):
     translate newly added text nodes while Bengali is active. */
  if (typeof MutationObserver !== 'undefined') {
    var pending = false;
    var obs = new MutationObserver(function (muts) {
      if (lang !== 'bn' || pending) return;
      pending = true;
      setTimeout(function () {
        pending = false;
        muts.forEach(function (m) {
          m.addedNodes.forEach(function (node) {
            if (node.nodeType === 3) translateNode(node);
            else if (node.nodeType === 1) { walkAndTranslate(node); translatePlaceholders(node); }
          });
        });
      }, 0);
    });
    if (document.body) obs.observe(document.body, { childList: true, subtree: true });
    else document.addEventListener('DOMContentLoaded', function () {
      obs.observe(document.body, { childList: true, subtree: true });
    });
  }
})();
