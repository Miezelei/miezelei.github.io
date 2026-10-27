// Website miezelei.github.io bauen: node build.mjs
// Schreibt alle HTML-Seiten neu. Datenschutz und Impressum kommen aus der App
// (../katzencafe-app/docs/legal/*.md) – dieselben Texte wie in der App, nie hier von Hand ändern.
// Danach in GitHub Desktop committen und pushen.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const LEGAL_DIR = process.env.LEGAL_DIR || path.join(ROOT, "../katzencafe-app/docs/legal");
const SITE = "https://miezelei.github.io";
const SUPPORT_EMAIL = "miezelei.support@gmail.com";
// Sobald die App im Store ist: Link eintragen, dann zeigt die Startseite den Knopf statt „Bald im App Store“
const APP_STORE_URL = ""; // z. B. "https://apps.apple.com/app/id6825818242"

const PATHS = {
  home: { de: "/", en: "/en/" },
  support: { de: "/support/", en: "/en/support/" },
  privacy: { de: "/datenschutz/", en: "/en/privacy/" },
  imprint: { de: "/impressum/", en: "/en/legal-notice/" },
};

const T = {
  de: {
    nav: { home: "Start", support: "Support", privacy: "Datenschutz", imprint: "Impressum" },
    switchLabel: "English",
    switchShort: "EN",
    tagline: "Wort-Rätsel & Katzen-Sudoku",
    footer: "Diese Website setzt keine Cookies und nutzt keine Tracker.",
    skip: "Zum Inhalt springen",
  },
  en: {
    nav: { home: "Home", support: "Support", privacy: "Privacy", imprint: "Legal notice" },
    switchLabel: "Deutsch",
    switchShort: "DE",
    tagline: "Word Puzzle & Cat Sudoku",
    footer: "This website sets no cookies and uses no trackers.",
    skip: "Skip to content",
  },
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Text mit Links: Web-Adressen und E-Mail-Adressen werden anklickbar
function inline(text) {
  return esc(text)
    .replace(/https:\/\/[^\s<]+[^\s<.,;:)]/g, (url) => `<a href="${url}">${url}</a>`)
    .replace(/\b[\w.+-]+@[\w-]+\.[\w.]+\b/g, (mail) => `<a href="mailto:${mail}">${mail}</a>`);
}

// Gleiches einfaches Format wie in der App (src/legal/legalText.js): # ## - > und Absätze
function legalToHtml(markdown) {
  const out = [];
  let para = [];
  let list = [];
  const flushPara = () => {
    if (para.length) out.push(`<p>${para.map(inline).join("<br>")}</p>`);
    para = [];
  };
  const flushList = () => {
    if (list.length) out.push(`<ul>${list.map((li) => `<li>${inline(li)}</li>`).join("")}</ul>`);
    list = [];
  };
  for (const raw of markdown.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushPara();
      flushList();
    } else if (line.startsWith("## ")) {
      flushPara();
      flushList();
      const text = line.slice(3).trim();
      const id = text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      out.push(`<h2 id="${id}">${esc(text)}</h2>`);
    } else if (line.startsWith("# ")) {
      flushPara();
      flushList();
      out.push(`<h1>${esc(line.slice(2).trim())}</h1>`);
    } else if (/^[-*] /.test(line)) {
      flushPara();
      list.push(line.slice(2).trim());
    } else if (line.startsWith(">")) {
      flushPara();
      flushList();
      out.push(`<p class="note">${inline(line.replace(/^>\s?/, ""))}</p>`);
    } else {
      flushList();
      para.push(line.trim());
    }
  }
  flushPara();
  flushList();
  return out.join("\n");
}

function readLegal(doc, lang) {
  const file = path.join(LEGAL_DIR, `${doc}.${lang}.md`);
  if (!fs.existsSync(file)) throw new Error(`Rechtstext fehlt: ${file}`);
  const text = fs.readFileSync(file, "utf8");
  if (/PLATZHALTER|PLACEHOLDER|\[PRÜFEN/.test(text)) throw new Error(`${file} enthält noch Platzhalter`);
  return text;
}

function page({ lang, key, title, description, body, mainClass = "" }) {
  const t = T[lang];
  const other = lang === "de" ? "en" : "de";
  const nav = ["home", "support", "privacy", "imprint"]
    .map((k) => `<a href="${PATHS[k][lang]}"${k === key ? ' aria-current="page"' : ""}>${t.nav[k]}</a>`)
    .join("");
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#FFF6EC">
<link rel="canonical" href="${SITE}${PATHS[key][lang]}">
<link rel="alternate" hreflang="de" href="${SITE}${PATHS[key].de}">
<link rel="alternate" hreflang="en" href="${SITE}${PATHS[key].en}">
<link rel="icon" type="image/png" href="/assets/img/favicon-64.png">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="stylesheet" href="/assets/style.css">
</head>
<body>
<a class="skip" href="#inhalt">${t.skip}</a>
<header class="top">
  <a class="brand" href="${PATHS.home[lang]}"><img src="/assets/img/favicon-64.png" alt="" width="36" height="36"><span>Miezelei</span></a>
  <nav aria-label="${lang === "de" ? "Hauptmenü" : "Main menu"}">${nav}</nav>
  <a class="lang" href="${PATHS[key][other]}" hreflang="${other}" lang="${other}" aria-label="${t.switchLabel}">${t.switchShort}</a>
</header>
<main id="inhalt" class="${mainClass}">
${body}
</main>
<footer>
  <p><a href="${PATHS.support[lang]}">${t.nav.support}</a> · <a href="${PATHS.privacy[lang]}">${t.nav.privacy}</a> · <a href="${PATHS.imprint[lang]}">${t.nav.imprint}</a></p>
  <p>© 2026 Alexander Rolff · Miezelei · ${t.footer}</p>
</footer>
</body>
</html>
`;
}

// --- Startseite ---------------------------------------------------------------------------------
const HOME = {
  de: {
    title: "Miezelei – Wort-Rätsel & Katzen-Sudoku",
    description: "Tägliches Wort-Rätsel, Katzen sammeln, Café einrichten – plus Katzen-Sudoku und Knäuelei. Kostenlos für iPhone und iPad.",
    lead: "Zwölf Katzen mit eigenem Charakter warten auf dich: Löse jeden Tag ein neues Wort-Rätsel, richte dein Café ein und sammle Katzen – ganz in deinem Tempo.",
    soon: "Bald im App Store",
    store: "Im App Store laden",
    facts: "Kostenlos spielbar · Deutsch und Englisch · iPhone und iPad",
    bubble: "Hallo, ich bin Bisou!",
    bisouAlt: "Bisou, eine weiße Katze, sitzt und schaut freundlich",
    features: [
      ["🧩", "Tägliches Wort-Rätsel", "Errate das Wort des Tages mit fünf Buchstaben in sechs Versuchen. Kein Zeitdruck, die Farben helfen dir."],
      ["☕", "Dein eigenes Café", "Mit jedem Rätsel verdienst du Münzen, richtest Möbel ein und schaltest den Garten frei. Deine Katzen verdienen weiter, auch wenn du gerade nicht spielst."],
      ["🐾", "Katzen mit Persönlichkeit", "Adoptiere Katzen im Tierheim, streichle und trainiere sie. Seltene und legendäre Katzen gibt es für deine Rätsel-Serie."],
      ["🧶", "Zwei Arcade-Spiele", "Katzen-Sudoku mit Katzen statt Zahlen und Knäuelei, das gemütliche Woll-Sortierspiel – mit Hunderten Leveln."],
    ],
    shotsTitle: "Ein Blick in die Miezelei",
    shots: [["02-album", "Das Katzen-Album"], ["03-tagesraetsel", "Das Tagesrätsel"], ["05-katzen-sudoku", "Ein Level im Katzen-Sudoku"], ["06-knaeuelei", "Ein Level in der Knäuelei"]],
    fairTitle: "Freundlich und fair",
    fair: [
      "Kostenlos gut spielbar: Bezahlen macht schneller, sperrt aber nichts exklusiv frei.",
      "Kein Konto nötig – dein Spielstand bleibt auf deinem Gerät.",
      "Keine Werbung im Tagesrätsel und keine Banner.",
    ],
  },
  en: {
    title: "Miezelei – Word Puzzle & Cat Sudoku",
    description: "A daily word puzzle, cats to collect, a café to decorate – plus Cat Sudoku and Yarn Sort. Free for iPhone and iPad.",
    lead: "Twelve cats with their own personalities are waiting for you: solve a new word puzzle every day, decorate your café and collect cats – all at your own pace.",
    soon: "Coming soon to the App Store",
    store: "Download on the App Store",
    facts: "Free to play · English and German · iPhone and iPad",
    bubble: "Hi, I'm Bisou!",
    bisouAlt: "Bisou, a white cat, sitting and looking friendly",
    features: [
      ["🧩", "Daily word puzzle", "Guess the five-letter word of the day in six tries. No time pressure – the colours help you along."],
      ["☕", "Your own café", "Every puzzle earns you coins to furnish your café and unlock the garden. Your cats keep earning even while you're away."],
      ["🐾", "Cats with personality", "Adopt cats from the shelter, pet them and train them. Rare and legendary cats reward your puzzle streak."],
      ["🧶", "Two arcade games", "Cat Sudoku with cats instead of numbers, and Yarn Sort, the cosy wool-sorting game – with hundreds of levels."],
    ],
    shotsTitle: "A peek inside Miezelei",
    shots: [["02-album", "The cat album"], ["03-tagesraetsel", "The daily puzzle"], ["05-katzen-sudoku", "A Cat Sudoku level"], ["06-knaeuelei", "A Yarn Sort level"]],
    fairTitle: "Friendly and fair",
    fair: [
      "Fully enjoyable for free: paying makes things faster but never locks content away.",
      "No account needed – your progress stays on your device.",
      "No ads in the daily puzzle and no banners.",
    ],
  },
};

function homeBody(lang) {
  const h = HOME[lang];
  const cta = APP_STORE_URL
    ? `<a class="button" href="${APP_STORE_URL}">${h.store}</a>`
    : `<span class="button soon" aria-disabled="true">${h.soon}</span>`;
  return `<section class="hero">
  <div class="hero-text">
    <p class="eyebrow">${T[lang].tagline}</p>
    <h1><img class="hero-icon" src="/assets/img/icon-512.png" alt="" width="72" height="72">Miezelei</h1>
    <p class="lead">${h.lead}</p>
    <p class="cta">${cta}</p>
    <p class="facts">${h.facts}</p>
  </div>
  <figure class="hero-cat">
    <span class="bubble">${h.bubble}</span>
    <img src="/assets/img/bisou.png" alt="${esc(h.bisouAlt)}" width="520" height="508">
  </figure>
</section>
<section class="features">
${h.features.map(([icon, title, text]) => `  <article class="card"><span class="icon" aria-hidden="true">${icon}</span><h2>${title}</h2><p>${text}</p></article>`).join("\n")}
</section>
<section class="shots">
  <h2>${h.shotsTitle}</h2>
  <div class="shot-row">
${h.shots.map(([file, alt]) => `    <img src="/assets/img/${lang}-${file}.jpg" alt="${esc(alt)}" width="414" height="900" loading="lazy">`).join("\n")}
  </div>
</section>
<section class="card fair">
  <h2>${h.fairTitle}</h2>
  <ul>${h.fair.map((f) => `<li>${f}</li>`).join("")}</ul>
</section>`;
}

// --- Support ------------------------------------------------------------------------------------
const MAIL = `<a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>`;
const SUPPORT = {
  de: {
    title: "Support – Miezelei",
    description: "Hilfe zu Miezelei: Käufe wiederherstellen, Daten löschen, Werbefrei-Paket und Kontakt.",
    h1: "Support",
    intro: `Fragen, Probleme oder Ideen? Schreib uns an ${MAIL}. Am einfachsten geht das in der App im Profil über „Feedback senden“ – dann sind App-Version und Gerät schon dabei.`,
    faq: [
      ["Wie stelle ich meine Käufe wieder her?",
        "Öffne im Café den Shop (Tasche oben oder auf die Münzen tippen) und tippe unten auf „Käufe wiederherstellen“. Nutze dieselbe Apple-ID wie beim Kauf. Wiederhergestellt werden die dauerhaften Käufe: das Werbefrei-Paket und aus dem Starter-Paket der Café-Platz mit dem Kronleuchter. Münzen, Leckerlis und Baumaterial sind Verbrauchsartikel und lassen sich nicht wiederherstellen."],
      ["Mein Kauf ist nicht angekommen.",
        "Schließe die App ganz und öffne sie wieder: Offene Käufe werden beim Start gutgeschrieben. Wartet ein Kauf noch auf Bestätigung (z. B. bei einer Kaufanfrage in der Familienfreigabe), kommt er, sobald er bestätigt ist. Hilft das nicht, schreib uns. Rückerstattungen kann nur Apple vornehmen: <a href=\"https://reportaproblem.apple.com\">reportaproblem.apple.com</a>."],
      ["Was bringt das Werbefrei-Paket?",
        "Es schaltet die Werbung ab, die in den Arcade-Spielen nach jedem zweiten Level kommt, und schenkt dir einmalig 1.000 Münzen. Freiwillige Werbung gegen Belohnung (z. B. für einen Tipp) kannst du weiter nutzen – sie kommt nur, wenn du sie selbst antippst. Im Tagesrätsel gibt es ohnehin nie Werbung."],
      ["Wie lösche ich meine Daten?",
        "In der App im Profil unter Rechtliches: „Meine Daten löschen“. Das löscht deinen Spielstand auf dem Gerät und – falls du bei der Bestenliste mitmachst – auch Spielernamen, Freunde und Einträge auf dem Server. Hast du die App schon gelöscht, schreib uns mit deinem Spielernamen oder Freundes-Code, dann löschen wir die Daten auf dem Server für dich. Mehr dazu in der <a href=\"/datenschutz/\">Datenschutzerklärung</a>."],
      ["Ich habe ein neues Handy. Ist mein Spielstand weg?",
        "Dein Spielstand liegt nur auf deinem Gerät, ein Konto gibt es nicht. Richtest du das neue Gerät aus einem Backup oder per Übertragung vom alten Gerät ein, kommt der Spielstand in der Regel mit. Dauerhafte Käufe holst du über „Käufe wiederherstellen“ zurück."],
      ["Ich habe mich beim Geburtsjahr vertippt.",
        "Kein Problem: Im Profil unter Rechtliches kannst du dein Alter jederzeit neu angeben."],
    ],
    contactTitle: "Kontakt",
    contact: `E-Mail: ${MAIL}<br>Bitte nenne dein Gerät und, falls du bei der Bestenliste mitmachst, deinen Freundes-Code. Wir antworten so schnell wir können.`,
  },
  en: {
    title: "Support – Miezelei",
    description: "Help with Miezelei: restoring purchases, deleting your data, the Ad-Free Pack and contact.",
    h1: "Support",
    intro: `Questions, problems or ideas? Write to us at ${MAIL}. The easiest way is “Send feedback” in your profile in the app – that already includes the app version and your device.`,
    faq: [
      ["How do I restore my purchases?",
        "Open the shop in the café (the bag at the top, or tap your coins) and tap “Restore purchases” at the bottom. Use the same Apple ID you bought with. Permanent purchases are restored: the Ad-Free Pack and, from the Starter Pack, the extra café spot with the chandelier. Coins, treats and building material are consumables and cannot be restored."],
      ["My purchase didn't arrive.",
        "Close the app completely and open it again: pending purchases are credited on start. If a purchase is still waiting for approval (e.g. Ask to Buy in Family Sharing), it arrives as soon as it's approved. If that doesn't help, write to us. Refunds can only be issued by Apple: <a href=\"https://reportaproblem.apple.com\">reportaproblem.apple.com</a>."],
      ["What does the Ad-Free Pack do?",
        "It turns off the ads that appear in the arcade games after every second level and gives you a one-time bonus of 1,000 coins. You can still watch optional ads for rewards (e.g. a hint) – they only play when you tap them. The daily puzzle never has ads anyway."],
      ["How do I delete my data?",
        "In the app, in your profile under Legal: “Delete my data”. This deletes your progress on your device and – if you joined the leaderboard – your player name, friends and entries on the server. If you've already deleted the app, write to us with your player name or friend code and we'll delete the server data for you. More in the <a href=\"/en/privacy/\">privacy policy</a>."],
      ["I have a new phone. Is my progress gone?",
        "Your progress is stored only on your device; there is no account. If you set up your new device from a backup or by transferring from your old device, your progress usually comes along. Permanent purchases come back via “Restore purchases”."],
      ["I entered the wrong year of birth.",
        "No problem: you can enter your age again at any time in your profile under Legal."],
    ],
    contactTitle: "Contact",
    contact: `Email: ${MAIL}<br>Please mention your device and, if you joined the leaderboard, your friend code. We'll reply as soon as we can.`,
  },
};

function supportBody(lang) {
  const s = SUPPORT[lang];
  return `<div class="page">
<h1>${s.h1}</h1>
<p class="lead">${s.intro}</p>
<div class="faq">
${s.faq.map(([q, a], i) => `<details${i === 0 ? " open" : ""}><summary>${q}</summary><p>${a}</p></details>`).join("\n")}
</div>
<section class="card contact">
  <img src="/assets/img/bisou.png" alt="" width="104" height="102">
  <div><h2>${s.contactTitle}</h2><p>${s.contact}</p></div>
</section>
</div>`;
}

// --- Seiten schreiben ---------------------------------------------------------------------------
function write(urlPath, html) {
  const file = path.join(ROOT, urlPath, "index.html");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  console.log("✔", path.relative(ROOT, file));
}

for (const lang of ["de", "en"]) {
  write(PATHS.home[lang], page({ lang, key: "home", title: HOME[lang].title, description: HOME[lang].description, body: homeBody(lang), mainClass: "home" }));
  write(PATHS.support[lang], page({ lang, key: "support", title: SUPPORT[lang].title, description: SUPPORT[lang].description, body: supportBody(lang) }));
  const privacy = readLegal("datenschutz", lang);
  write(PATHS.privacy[lang], page({
    lang, key: "privacy",
    title: (lang === "de" ? "Datenschutzerklärung" : "Privacy policy") + " – Miezelei",
    description: lang === "de" ? "Datenschutzerklärung für die App Miezelei und miezelei.github.io." : "Privacy policy for the Miezelei app and miezelei.github.io.",
    body: `<article class="page legal">\n${legalToHtml(privacy)}\n</article>`,
  }));
  const imprint = readLegal("impressum", lang);
  write(PATHS.imprint[lang], page({
    lang, key: "imprint",
    title: (lang === "de" ? "Impressum" : "Legal notice") + " – Miezelei",
    description: lang === "de" ? "Impressum der App Miezelei." : "Legal notice for the Miezelei app.",
    body: `<article class="page legal">\n${legalToHtml(imprint)}\n</article>`,
  }));
}

// Fehlerseite (GitHub Pages zeigt sie bei unbekannten Adressen) – zweisprachig, weil die Sprache unbekannt ist
fs.writeFileSync(path.join(ROOT, "404.html"), page({
  lang: "de", key: "home", title: "Seite nicht gefunden – Miezelei", description: "Diese Seite gibt es nicht.",
  body: `<div class="page notfound">
<img src="/assets/img/bisou-schlaeft.png" alt="" width="300" height="238">
<h1>Diese Seite schläft gerade.</h1>
<p>Hier gibt es leider nichts. <a href="/">Zur Startseite</a></p>
<p lang="en">This page doesn't exist. <a href="/en/">Go to the home page</a></p>
</div>`,
}));
console.log("✔ 404.html");
