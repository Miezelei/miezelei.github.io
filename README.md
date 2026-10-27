# miezelei.github.io

Website der App **Miezelei** (Wort-Rätsel & Katzen-Sudoku): Startseite, Support, Datenschutz, Impressum – Deutsch und
Englisch. Reines HTML/CSS, keine Cookies, keine Tracker, keine externen Schriften. Veröffentlicht über GitHub Pages.

| Seite | Deutsch | Englisch |
|---|---|---|
| Start (Marketing-URL) | https://miezelei.github.io/ | https://miezelei.github.io/en/ |
| Support | https://miezelei.github.io/support/ | https://miezelei.github.io/en/support/ |
| Datenschutz | https://miezelei.github.io/datenschutz/ | https://miezelei.github.io/en/privacy/ |
| Impressum | https://miezelei.github.io/impressum/ | https://miezelei.github.io/en/legal-notice/ |
| AdMob | https://miezelei.github.io/app-ads.txt | |

## Ändern

Alle Seiten erzeugt `node build.mjs` (Texte der Start- und Support-Seite stehen im Skript). Datenschutz und Impressum
kommen aus der App: `../katzencafe-app/docs/legal/*.md` – dort ändern, in der App `npm run rechtstexte`, hier
`node build.mjs`. So sind App und Website immer gleich. Danach in GitHub Desktop committen und pushen.

Sobald die App im App Store ist: `APP_STORE_URL` in `build.mjs` eintragen und neu bauen.

`app-ads.txt` nennt die AdMob-Publisher-ID (aus der App-ID `ca-app-pub-7722005794830246~…`). `.nojekyll` sorgt dafür,
dass GitHub Pages die Dateien unverändert ausliefert.
