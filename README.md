# Julies kokebok

En privat kokebok for Julie og Isak, med norske tekster, pasteller, oppskrifter,
matbilder, favoritter, porsjonsberegning, handleliste og bilde-/tekstimport.

Denne checkouten viderefører den eksisterende Sites-appen som en statisk
React/Vite-app for GitHub Pages. Originalen er fortsatt tilgjengelig på
<https://julies-kokebok.creamyelm32.chatgpt.site> og er ikke endret.

## Offentlig demo

GitHub Pages bygger som standard en demo med `VITE_COOKBOOK_DEMO=1`. Den åpner
kokeboken direkte med eksempeloppskrifter, redigering, bilder, porsjoner og
handleliste. Endringer lever bare mens siden er åpen og forsvinner ved reload;
**Nullstill demo** starter på nytt. Nettimport krever fortsatt en tilkoblet
server; tekst- og bildeimport kan prøves i demoen.

Demoen initialiserer ikke Firebase og laster ikke ekte kontoer eller data.
For en vanlig innloggingsbeskyttet byggversjon utelates demo-variabelen.

## Status

- Utseendet, oppskriftsredigeringen, porsjonsberegningen, handlelisten,
  eksempeloppskriftene og lokal OCR er bevart.
- Bygget fungerer under repositoryets undermappe på GitHub Pages. Fonter,
  favicon og OCR-filer bruker samme grunnsti.
- Serveravhengighetene fra Sites er erstattet med en tydelig backend-kontrakt
  i `lib/backend.ts`. Den er ennå ikke koblet til Firebase.
- E-postinnlogging med Firebase Auth er implementert: opprett passord første
  gang, bruk samme passord senere, bekreft e-post og gjenopprett glemt passord.
  Innloggingen er deaktivert frem til webkonfigurasjon og serverfunksjoner
  er koblet til et valgt Firebase-prosjekt.
- Kontooppslaget og tilgangssjekken sjekker de to godkjente e-postadressene
  på serveren. Verifisert innlogging åpner foreløpig en status for den
  gjenstående datatilkoblingen; oppskrifter og handleliste er ennå ikke koblet
  til Firebase.
- Oppskrifter, handleliste og bilder fra den opprinnelige appen er **ikke**
  migrert. Kildekoden inneholder bare eksempeloppskrifter.
- Nettimport trenger en autentisert serverfunksjon. GitHub Pages kan ikke
  kjøre den gamle serverruten, og nettleserens CORS-regler hindrer direkte
  import fra de fleste oppskriftssider. Tekst- og bildeimport er bevart.

## Lokal forhåndsvisning

Krever Node.js 24 eller nyere:

```sh
npm ci
npm run dev
```

Åpne adressen Vite skriver ut. Legg til `?preview=1` på localhost for å
prøve kokebokgrensesnittet med midlertidige data. Forhåndsvisningen er tydelig
merket. Endringer forsvinner når siden lastes
på nytt. Den er ikke en innlogging og kobler ikke til private data.

## Kontroller

```sh
npm run check
npm test
npm ci --prefix functions
npm --prefix functions run build
npm run test:auth
npm run test:ocr
VITE_COOKBOOK_DEMO=0 npm run build:non-demo
PAGES_BASE_PATH=/julies-cookbook/ VITE_COOKBOOK_DEMO=1 npm run build:demo
```

Testene dekker norsk porsjonsberegning, ingredienser, importparsing,
handlelistegruppering, låst backend, samtidige redigeringer og stabile
ID-er ved gjentatte forsøk. OCR-testen leser en ekte oppskriftsbildefil med
norske og engelske språkfiler fra de installerte pakkene.

Auth-emulatortesten bruker et isolert demoprosjekt og faktisk callable-transport
mellom Firebase-klienten og Auth-/Functions-emulatorene. Kun kompilert kode og
syntetiske eksempeladresser kopieres til en midlertidig mappe; lokale `.env`-filer
og cloud-credentials arves ikke. Firebase CLI er låst i `package-lock.json`.
Functions beholder Node 22 og testes med låst Node 22.23.4 fra
`functions/node_modules/node`. Emulatorens CLI og discovery-prosess får samme
runtime; en midlertidig test-entrypoint avviser feil Node-major. Root-appen og
testklienten beholder Node 24. Dette verifiserer lokal runtime, ikke skydeploy. Testen kontrollerer faktisk
passordopprettelse, e-postbekreftelse, innlogging, feil passord, passordbytte
og kontoer som allerede finnes uten passord. Den leser eller endrer ingen
produksjonskontoer.

## E-post først, passord første gang

1. Brukeren skriver e-postadressen. `emailSignInOptions` undersøker kontoen
   bare hvis adressen er invitert til kokeboken.
2. En ny konto får **Opprett passord** og **Bekreft passord**. Passordet må ha
   minst 12 tegn. Firebase Auth håndterer lagringen; appen legger aldri
   passordet i localStorage, logger eller konfigurasjonsfiler.
3. Brukeren bekrefter e-postadressen med Firebase sin e-postlenke før
   innloggingen godkjennes av `validateCookbookAccess`.
4. Neste gang vises **Passord** og **Logg inn**. **Glemt passord** sender
   en lenke for å velge et nytt passord.
5. En eksisterende konto uten passord, for eksempel fra Google, får en
   e-postlenke for å opprette passord uten å lage en ekstra konto.

Vanlige besøkende kan ikke slå opp vilkårlige kontoer. Løsningen bruker ikke
`fetchSignInMethodsForEmail`, som ikke gir pålitelige førstegangsoppslag når
Firebase sin beskyttelse mot e-postoppslag er aktivert.

For aktivering: kopier `.env.example` til en lokal `.env` og fyll inn
webkonfigurasjonen. Et fremtidig innloggingsbygg må få alle fire `VITE_FIREBASE_*` verdier.
Det offentlige Pages-demobygget skal aldri få disse verdiene.
Dette er offentlige Firebase-webverdier, ikke tjenestekontonøkler.
Tilgangslisten `COOKBOOK_EMAILS` ligger i en ignorert `functions/.env` lokalt;
en nedlastet kildekodepakke inneholder bare `functions/.env.example` og må
få de to avtalte adressene før serverfunksjonene deployes.

Aktiver e-post/passord i Firebase Auth, sett prosjektets passordpolicy til
minst 12 tegn og legg til det valgte frontend-domenet som godkjent domene for
e-postlenker. Behold prosjektets eksisterende godkjente domener. Firebase sin
innebygde side håndterer bekreftelses- og tilbakestillingslenkene og sender
brukeren tilbake til kokeboken. Deploy `auth` og `functions:cookbook-auth`
med `npx --no-install firebase deploy --project <prosjekt-id> --only auth,functions:cookbook-auth`
etter at prosjekt og konto er valgt. Serverfunksjonene ligger i `europe-west1`.
Cloud Functions krever at prosjektet støtter funksjonsdeploy, vanligvis Blaze.

## GitHub Pages

Canonical enterprise-repository er <https://github.com/larry-software/julies-cookbook>.
Repoet ble overført fra `larrycaw/julies-cookbook` med samme historikk og repo-ID.
Den tidligere demo-adressen var `https://larrycaw.github.io/julies-cookbook/`.
Ny Pages-publisering og adresse er ikke verifisert; midlertidig nedetid er akseptert.

Arbeidsflyten `.github/workflows/pages.yml` bygger demo på push til `main` eller
manuell kjøring og sender `dist/` til `gh-pages`. Grunnstien følger repo-navnet.
PR-kontrollene publiserer ikke. Før neste publisering må Pages-kilde,
rettigheter, signering og valgt adresse verifiseres under den nye organisasjonen.

Det eksisterende `npm run publish:github` peker nå til enterprise-repoet og
forsøker en normal push av gjeldende commit til `main`. Det er ikke PR-flyten
og skal bare brukes etter en egen releasebeslutning som tillater dette.
Readiness-arbeid leveres via signert feature-branch og draft-PR, uten deploy.
E-postinnlogging og felles lagring trenger fortsatt et valgt Firebase-prosjekt.

## Gjenstående Firebase-arbeid

Før inngangen åpnes, må et valgt Firebase-prosjekt være tilgjengelig gjennom
en autentisert CLI eller MCP-forbindelse. Live prosjekt og autorisert tilgang er ikke valgt i denne leveransen.

1. Opprett eller velg Firebase-prosjekt og webapp; hent webkonfigurasjonen.
2. Identifiser databasens utgave før valg av SDK og implementering av adapter.
3. Aktiver e-post/passord, deploy innloggingsfunksjonene og legg
   det valgte frontend-domenet til autoriserte domener. Legg også til `localhost`
   ved lokal testing.
4. Implementer en adapter for `CookbookBackend` med privat felles lagring,
   bilder, versjonskontroll og idempotente handlelisteoperasjoner.
5. Håndhev de to avtalte e-postkontoene og bekreftet e-post i backendens sikkerhetsregler.
   En sjekk i grensesnittet alene gir ingen beskyttelse.
6. Koble innloggingsstatus til adapteren. Ved utlogging eller tilbakekalt
   tilgang må abonnenter, bilder og privat klienttilstand fjernes.
7. Flytt nettimport til en autentisert funksjon med samme målbegrensninger,
   tidsgrenser og størrelsesgrenser som originalen.
8. Test at begge kontoene kan lese og redigere, at andre kontoer avvises,
   og at samtidige redigeringer gir konflikt. Migrer eksisterende data bare
   etter at ny privat lagring er verifisert.

Ikke legg tjenestekontonøkler, CLI-tokens eller private oppskrifter i Git.

## Kvalitetsport og enterprise-overføring

`quality.yml` kjører på pull requests og hovedgrenen, og gjenbrukes av Pages.
Den har kun lesetilgang og kjører TypeScript, enhetstester, Auth/Functions,
OCR og tre bygg: ukonfigurert inngang, syntetisk konfigurert inngang og demo.
Kun demoartefakten brukes av eksisterende Pages-publisering. Node og Actions
har faste versjoner; CLI og avhengigheter installeres med `npm ci`.

Bygget avviser ukjente demoflagg, ufullstendig Firebase-konfigurasjon og enhver
Firebase-konfigurasjon i demo. Ferdige JavaScript-chunks kontrolleres: demo
skal ikke inneholde Auth/Firebase, og vanlig bygg skal ikke inneholde
sample-data eller demo-backend. Ukonfigurert vanlig bygg forblir låst.
Dette er ikke en produksjonsklar backend eller en browser-E2E-test.

Enterprise-overføringen til `larry-software/julies-cookbook` er verifisert;
repo-ID er `1418153196`. Origin og publisher-destinasjonen er oppdatert.
Midlertidig nedetid for offentlig demo er akseptert; gammel Pages-adresse
trenger ikke bevares av hensyn til kontinuitet. Før eventuell publisering:

- Verifiser Pages-adresse, `gh-pages`-kilde, Actions-rettigheter og enterprise
  signerings-/grenregler før første publisering. Repo-navnbasert grunnsti
  følger med automatisk. Ingen live Firebase/Auth-domener er endret.
- Oppdater CORS-listen i `functions/src/index.ts`, Auth-domener og testens
  returadresse når faktisk produksjons-/demo-adresse er valgt. Et repo-transfer
  er ikke i seg selv en Firebase-domeneendring.
- Gjør kvalitetssjekken påkrevd etter at den har kjørt i enterprise-repoet.
  Lokal grønn status beviser ikke at GitHub-hostede jobber har kjørt.

Neste backend-leveranse trenger valgt Firebase-prosjekt/databaseutgave,
kostnadsramme og adresse. Implementer privat adapter og database-/Storage-regler
med emulatorbaserte tilgangs- og konflikttester før varige bilder, migrering
og verifisert produksjonsdeploy. Demo skal fortsatt kun inneholde eksempeldata.

### Oppdatering av testverktøy

Oppdater Node-patchversjonene og Firebase CLI i en egen PR. Verifiser upstream
versjon/engine-krav, regenerer berørte låsefiler og kjør hele kvalitetsporten.
Ved Actions-oppdateringer verifiser commit mot upstream-tag før pinnen endres.
Runtime-vakten skal beholdes når Functions-versjonen endres.

### Utstående akseptansekriterier i CIR-143

Denne leveransen bygger en innloggingsfrontend; ekte database/backend er ikke
ferdig. CIR-143 kan ikke lukkes før følgende er levert og verifisert:

1. Browser-E2E på isolerte data, inkludert UI og nettverksisolasjon. Nåværende
   integrasjonstest dekker Auth/callables, ikke full nettleserflyt.
2. Eget release-/produksjonsbygg som avviser helt manglende konfigurasjon og
   feil målmiljø. Det nåværende ukonfigurerte ikke-demo-bygget er bevisst låst
   og er kun et testartefakt; det er ikke releasegodkjenning.
3. Avhengighets- og hemmelighetsskanning som CI-kontroller.
4. Eksplisitte staging-/produksjonsmiljøer og godkjente tilganger, med minste
   nødvendige deployrettigheter og kontroll av prosjekt/region/domene.
5. Dokumentert og testet rekkefølge for regler, indekser, funksjoner og frontend,
   samt tilbakeføring til kjent commit.
6. Godkjent release, faktisk utrulling til enterprise-mål, verifisert publisert
   commit og smoke-test på den ekte ikke-demo-adressen.
7. GitHub-hostet kjøring av kvalitetsporten etter overføring og nødvendige
   påkrevde checks i enterprise-repoets grenregler.

Separat backendarbeid må levere privat adapter, database-/Storage-regler,
varige bilder, autorisert import, korrekt utlogging/tilbakekalling og migrering.
Et grønt frontendbygg erstatter ingen av disse leveransene.
