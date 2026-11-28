// Polska wersja healthypaw.app. Strony prawne to proste wersje na betę, nie ostateczne teksty prawnika.

import { privacy, terms } from './pl.legal.mjs';

export default {
  lang: 'pl',
  ogLocale: 'pl_PL',
  paths: {
    home: '/pl/',
    privacy: '/pl/prywatnosc',
    terms: '/pl/regulamin',
    contact: '/pl/kontakt',
    deleteAccount: '/pl/usun-konto',
  },
  ui: {
    menu: 'Menu',
    skip: 'Przejdź do treści',
    nav: { features: 'Funkcje', how: 'Jak to działa', faq: 'Pytania', contact: 'Kontakt' },
    getApp: 'Pobierz aplikację',
    switchTo: 'English',
    switchLabel: 'This page in English',
    comingSoon: 'Wkrótce',
    downloadOn: 'Pobierz z',
    getItOn: 'Pobierz z',
    appStore: 'App Store',
    googlePlay: 'Google Play',
    footerTagline: 'Codzienna opieka nad pupilem, dzielona przez cały dom.',
    footerProduct: 'Produkt',
    footerLegal: 'Informacje prawne',
    footerHelp: 'Pomoc',
    privacy: 'Polityka prywatności',
    terms: 'Regulamin',
    deleteAccount: 'Usuń konto',
    contact: 'Kontakt',
    madeIn: 'Zrobione w Warszawie dla psów, kotów i ich ludzi.',
    updated: 'Ostatnia aktualizacja',
    todo: 'do uzupełnienia',
    notFoundTitle: 'Nie ma takiej strony',
    notFoundBody: 'Ta strona gdzieś się zawieruszyła. Wróćmy na start.',
    notFoundCta: 'Wróć na stronę główną',
  },

  home: {
    title: 'HealthyPaw: codzienna opieka nad pupilem, razem',
    description:
      'Wspólna lista codziennej opieki nad psem lub kotem. Spacery, posiłki i leki na jednej liście, odhaczane przez cały dom, z serią dni, zdrowiem i kartą opieki dla opiekuna.',
    eyebrow: 'Codzienna opieka, razem',
    h1: 'Każdy spacer, posiłek i lek na jednej liście',
    lead:
      'HealthyPaw to wspólna lista codziennej opieki nad psem lub kotem. Odhacz zadanie, a cały dom od razu to widzi. Nikt nie nakarmi kota dwa razy i nikt nie zapomni o wieczornej tabletce.',
    heroNote: 'Za darmo w becie · iPhone i Android · po polsku i po angielsku',
    heroAlt: 'Ekran Dziś: dzień Luny, 2 z 6 zadań zrobione i 12 dni serii',

    problemTitle: 'Brzmi znajomo?',
    bubbles: ['„Karmiłeś ją już?”', '„Tabletka była rano czy wieczorem?”', '„Czekaj, kto z nim wyszedł?”'],
    problemAnswer: 'HealthyPaw odpowiada na wszystkie trzy, zanim ktoś zdąży zapytać.',

    featuresTitle: 'Wszystko, czego potrzebuje dzień pupila',
    features: [
      {
        img: '02-household',
        kicker: 'Dom',
        title: 'Dzielcie się opieką całym domem',
        body:
          'Zaproś partnera, dzieci albo współlokatorów linkiem. Wszyscy widzą te same zwierzaki i tę samą listę, a przy każdym odhaczeniu widać, kto i kiedy to zrobił.',
        points: ['„Zrobione przez Annę, 8:12”', 'Działa offline, synchronizuje się później', 'Jedna wspólna seria dla każdego pupila'],
        alt: 'Zapraszanie domownika do domu w aplikacji',
      },
      {
        img: '03-streak',
        kicker: 'Seria',
        title: 'Budujcie serię razem',
        body:
          'Dzień się liczy, gdy każdy posiłek, lek i spacer jest odhaczony. Świętujcie 7, 14, 30 i 100 dni. Zabiegany dzień? Dwie przepustki w miesiącu chronią serię. Bez wyrzutów sumienia.',
        points: ['Kamienie milowe do świętowania', 'Przepustki na zabiegane dni', 'Dni odpoczynku, kiedy trzeba'],
        alt: '12-dniowa seria Luny z postępem tygodnia i kamieniami milowymi',
      },
      {
        img: '04-health',
        kicker: 'Zdrowie',
        title: 'Zdrowie pupila w kieszeni',
        body:
          'Leki z dawkami i harmonogramem same trafiają na codzienną listę. Wizyty u weterynarza i szczepienia są w jednym miejscu, z przypomnieniem przed kolejnym terminem.',
        points: ['Leki jako codzienne zadania', 'Szczepienia i kolejne terminy', 'Numer do weterynarza jednym dotknięciem'],
        alt: 'Ekran zdrowia z lekami, szczepieniami i wizytami',
      },
      {
        img: '05-care-card',
        kicker: 'Karta opieki',
        title: 'Karta opieki dla opiekuna',
        body:
          'Wyjeżdżasz? Wyślij jeden link z dzisiejszą rutyną, lekami, porcjami jedzenia i kontaktem do weterynarza. Otwiera się w każdej przeglądarce, bez aplikacji i konta, a wyłączysz go w każdej chwili.',
        points: ['Opiekun nie potrzebuje aplikacji', 'Ty decydujesz, co jest na karcie', 'Wyłączasz ją jednym dotknięciem'],
        alt: 'Tworzenie karty opieki Luny dla opiekuna',
      },
    ],

    extrasTitle: 'Zrobione dla prawdziwych domów',
    extras: [
      { icon: 'paw', title: 'Psy i koty', body: 'Rutyny dopasowane do gatunku: spacery dla psów, świeża woda i kuweta dla kotów.' },
      { icon: 'bell', title: 'Delikatne przypomnienia', body: 'Włączasz je dla wybranych zadań, z własnymi godzinami ciszy. Najwyżej jedno przypomnienie o serii dziennie.' },
      { icon: 'wifi', title: 'Działa offline', body: 'Odhaczaj w windzie albo w piwnicy. Wszystko zsynchronizuje się, gdy wrócisz do sieci.' },
      { icon: 'lock', title: 'Prywatnie od początku', body: 'Bez reklam i bez sprzedawania danych. Statystyki użycia są wyłączone, dopóki ich nie włączysz.' },
      { icon: 'globe', title: 'Po polsku i po angielsku', body: 'Cała aplikacja, karta opieki i każde przypomnienie w obu językach.' },
      { icon: 'heart', title: 'Za darmo w becie', body: 'Wszystko w HealthyPaw jest bezpłatne, dopóki testujemy je razem.' },
    ],
    catAlt: 'Ekran Dziś dla kota z posiłkami, świeżą wodą i kuwetą',

    howTitle: 'Gotowe w dwie minuty',
    steps: [
      { title: 'Dodaj pupila', body: 'Imię, pies czy kot i kilka szczegółów. Rozsądna codzienna rutyna jest gotowa od razu.' },
      { title: 'Zaproś domowników', body: 'Wyślij link osobom, z którymi dzielisz opiekę.' },
      { title: 'Odhaczajcie razem', body: 'Wszyscy widzą, co już zrobione. Utrzymujcie serię dzień po dniu.' },
    ],

    downloadTitle: 'Wkrótce na iPhone’a i Androida',
    downloadTitleLive: 'Pobierz HealthyPaw na telefon',
    downloadBody:
      'HealthyPaw jest teraz w małej, zamkniętej becie w Warszawie. Chcesz być jednym z pierwszych domów, które go przetestują? Napisz do nas, a wyślemy Ci zaproszenie.',
    betaCta: 'Poproś o zaproszenie do bety',
    betaSubject: 'Zaproszenie do bety HealthyPaw',

    faqTitle: 'Najczęstsze pytania',
    faq: [
      { q: 'Ile kosztuje HealthyPaw?', a: 'W czasie bety jest za darmo. Jeśli to się kiedyś zmieni, powiemy o tym z dużym wyprzedzeniem.' },
      { q: 'Dla jakich zwierząt jest aplikacja?', a: 'Na razie dla psów i kotów, z rutynami dopasowanymi do każdego z nich. Inne gatunki mogą dojść później.' },
      { q: 'Czy opiekun potrzebuje aplikacji?', a: 'Nie. Karta opieki to link, który otwiera się w każdej przeglądarce. Możesz go wyłączyć w każdej chwili.' },
      {
        q: 'Gdzie są przechowywane moje dane?',
        a: 'W UE, w Supabase we Frankfurcie. Nie sprzedajemy danych i nie ma reklam. Szczegóły znajdziesz w <a href="{privacy}">polityce prywatności</a>.',
      },
      {
        q: 'Jak usunąć konto?',
        a: 'W aplikacji: Ustawienia, Konto, Usuń konto. Albo postępuj według kroków na <a href="{deleteAccount}">tej stronie</a>.',
      },
    ],
  },

  contact: {
    title: 'Kontakt',
    description: 'Skontaktuj się z zespołem HealthyPaw.',
    lead: 'Jesteśmy małym zespołem i czytamy każdą wiadomość. Zwykle odpowiadamy w ciągu dwóch dni roboczych.',
    cards: [
      { title: 'Pomoc i opinie', body: 'Pytania o aplikację, błąd, pomysł albo zaproszenie do bety.', key: 'support' },
      { title: 'Prywatność i Twoje dane', body: 'Dostęp do danych, ich poprawienie lub usunięcie i wszystko z polityki prywatności.', key: 'privacy' },
    ],
    deleteHint: 'Chcesz usunąć konto? <a href="{deleteAccount}">Zobacz, jak to zrobić</a>.',
    postal: 'Adres korespondencyjny',
  },

  deleteAccount: {
    title: 'Usuń konto HealthyPaw',
    description: 'Jak usunąć konto HealthyPaw i co dzieje się z Twoimi danymi.',
    body: ({ privacyEmail, privacyPath }) => `
<h2>W aplikacji (najszybciej)</h2>
<ol>
  <li>Otwórz HealthyPaw i przejdź do <strong>Ustawień</strong>.</li>
  <li>Stuknij <strong>Konto</strong>, a potem <strong>Usuń konto</strong>.</li>
  <li>Potwierdź. Jeśli logujesz się przez Apple, Apple poprosi o jeszcze jedno potwierdzenie.</li>
</ol>
<p>Konto zostanie usunięte od razu, a my wyślemy krótkiego e-maila z potwierdzeniem.</p>

<h2>Bez aplikacji</h2>
<p>Napisz na <a href="mailto:${privacyEmail}?subject=Usu%C5%84%20moje%20konto">${privacyEmail}</a> <strong>z adresu e-mail przypisanego do konta</strong>, z tematem „Usuń moje konto”. Usuniemy konto w ciągu 30 dni, zwykle w ciągu kilku dni, i potwierdzimy to w odpowiedzi.</p>
<p>Jeśli logujesz się przez Apple i wybrałeś(-aś) „Ukryj mój e-mail”, adres konta to adres przekierowania widoczny w ustawieniach Apple ID w sekcji „Zaloguj się, używając Apple”. Napisz ze swojego adresu i podaj ten adres przekierowania albo skorzystaj z aplikacji.</p>

<h2>Co usuwamy</h2>
<ul>
  <li>Twoje konto, profil, powiązane logowania i ustawienia.</li>
  <li>Twoje członkostwo we wszystkich domach.</li>
  <li>Twoje imię i numer telefonu na kartach opieki.</li>
  <li>Jeśli jesteś ostatnią osobą w domu: cały dom, jego zwierzęta i wszystkie ich dane.</li>
  <li>Statystyki użycia powiązane z kontem, jeśli były włączone.</li>
</ul>

<h2>Co zostaje</h2>
<ul>
  <li>Twoje odhaczenia zostają w historii domu jako „Były domownik”, żeby seria i historia pozostałych osób miały sens.</li>
  <li>To, co dodałeś(-aś) do wspólnego domu, na przykład notatki o pupilu, wpisy zdrowotne i nazwy zadań, zostaje u pozostałych domowników.</li>
  <li>Kopie zapasowe bazy danych są nadpisywane w ciągu 7 dni.</li>
</ul>
<p>Więcej w <a href="${privacyPath}">polityce prywatności</a>.</p>`,
  },

  privacy,
  terms,
};
