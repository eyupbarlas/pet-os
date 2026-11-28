// Polska wersja healthypaw.app. Strony prawne to proste wersje na betę, nie ostateczne teksty prawnika.

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

  privacy: {
    title: 'Polityka prywatności',
    description: 'Jakich danych używa HealthyPaw, po co, kto je przetwarza i jakie masz prawa.',
    body: (c) => `
<p class="lead">HealthyPaw jest w zamkniętej becie. Ta informacja prostymi słowami wyjaśnia, jakich danych używa aplikacja i ta strona, po co i co możesz z tym zrobić.</p>

<h2>1. Kim jesteśmy</h2>
<p>HealthyPaw prowadzi ${c.operator}${c.address ? `, ${c.address}` : ''} („my”). Jesteśmy administratorem Twoich danych osobowych. We wszystkich sprawach dotyczących danych napisz na <a href="mailto:${c.privacyEmail}">${c.privacyEmail}</a>.</p>

<h2>2. Jakich danych używamy i po co</h2>
<table>
  <thead><tr><th>Dane</th><th>Po co</th><th>Podstawa prawna</th></tr></thead>
  <tbody>
    <tr><td><strong>Konto:</strong> adres e-mail, nazwa wyświetlana i identyfikator logowania z Apple lub Google, jeśli logujesz się przez nie</td><td>Żeby założyć konto i Cię zalogować</td><td>Umowa (art. 6 ust. 1 lit. b RODO)</td></tr>
    <tr><td><strong>Zwierzęta i opieka:</strong> imiona, gatunek, rasa, data urodzenia, waga, rutyny, odhaczenia, leki, wizyty, szczepienia, kontakt do weterynarza, notatki oraz linki do sklepu z karmą i groomera</td><td>Żeby aplikacja działała dla Ciebie i Twojego domu</td><td>Umowa</td></tr>
    <tr><td><strong>Dom:</strong> kto do niego należy, jaką ma rolę i kto co odhaczył i kiedy</td><td>Żeby domownicy mogli dzielić się opieką i widzieć, kto co zrobił</td><td>Umowa</td></tr>
    <tr><td><strong>Karty opieki:</strong> to, co zdecydujesz się pokazać, w tym do 3 imion i numerów telefonu, oraz liczba otwarć linku</td><td>Żeby opiekun widział dzisiejszą opiekę bez zakładania konta</td><td>Umowa; dla numerów innych osób nasz prawnie uzasadniony interes w umożliwieniu Ci ich udostępnienia, więc zapytaj je najpierw o zgodę</td></tr>
    <tr><td><strong>Ustawienia aplikacji:</strong> język, przypomnienia i godziny ciszy, Twoje wybory dotyczące prywatności</td><td>Żeby aplikacja działała tak, jak ją ustawisz</td><td>Umowa</td></tr>
    <tr><td><strong>Statystyki użycia</strong> (PostHog EU), <strong>tylko jeśli je włączysz</strong></td><td>Żeby sprawdzić, które funkcje pomagają, a które mylą</td><td>Zgoda (art. 6 ust. 1 lit. a RODO); domyślnie wyłączone, zmienisz to w każdej chwili w Ustawieniach</td></tr>
    <tr><td><strong>Raporty o awariach</strong> (Sentry EU), <strong>tylko jeśli je włączysz</strong>; nie zawierają imienia ani e-maila</td><td>Żeby znajdować i naprawiać błędy</td><td>Zgoda; domyślnie wyłączone</td></tr>
    <tr><td><strong>Zbiorcze liczby z usługi</strong>, na przykład ile domów utrzymuje 7-dniową serię albo jak często otwierane są karty opieki</td><td>Żeby sprawdzić, czy HealthyPaw jest przydatny. Patrzymy tylko na sumy, nigdy na jedną osobę, i nikomu ich nie przekazujemy</td><td>Prawnie uzasadniony interes (art. 6 ust. 1 lit. f RODO)</td></tr>
    <tr><td><strong>Logi techniczne</strong> u naszych dostawców, np. adresy IP zapytań</td><td>Żeby usługa była bezpieczna i działała</td><td>Prawnie uzasadniony interes</td></tr>
    <tr><td><strong>Wiadomości, które do nas wysyłasz</strong></td><td>Żeby Ci odpowiedzieć</td><td>Prawnie uzasadniony interes</td></tr>
  </tbody>
</table>
<p>Nie używamy Twojej lokalizacji, zdjęć ani książki adresowej. Nie pokazujemy reklam, nie sprzedajemy danych i nie śledzimy Cię w innych aplikacjach ani na innych stronach. Przypomnienia są planowane na Twoim telefonie, a nie na naszych serwerach.</p>

<h2>3. Ta strona</h2>
<p>healthypaw.app nie używa plików cookie ani analityki i nie ładuje skryptów stron trzecich. Stronę dostarcza Cloudflare, który przetwarza Twój adres IP, żeby ją wyświetlić i chronić przed nadużyciami.</p>

<h2>4. Kto przetwarza dane w naszym imieniu</h2>
<table>
  <thead><tr><th>Dostawca</th><th>Do czego</th><th>Gdzie</th></tr></thead>
  <tbody>
    <tr><td>Supabase</td><td>Baza danych i logowanie</td><td>Frankfurt, Niemcy</td></tr>
    <tr><td>PowerSync</td><td>Synchronizacja danych między telefonami domowników</td><td>Irlandia (UE)</td></tr>
    <tr><td>Resend</td><td>Wysyłka e-maili logowania i dotyczących konta</td><td>Wysyłka z UE; logi e-maili przechowywane w USA</td></tr>
    <tr><td>PostHog</td><td>Statystyki użycia, tylko jeśli je włączysz</td><td>Frankfurt, Niemcy</td></tr>
    <tr><td>Sentry</td><td>Raporty o awariach, tylko jeśli je włączysz</td><td>Niemcy</td></tr>
    <tr><td>Cloudflare</td><td>Ta strona, strony kart opieki, DNS, przekierowanie poczty</td><td>Globalna sieć</td></tr>
    <tr><td>Apple, Google</td><td>Logowanie przez Apple lub Google, dystrybucja aplikacji i testy (TestFlight, Google Play)</td><td>Obowiązują ich własne regulaminy i polityki prywatności</td></tr>
  </tbody>
</table>
<p>Gdy dane trafiają poza Europejski Obszar Gospodarczy, opieramy się na zabezpieczeniach oferowanych przez tych dostawców, takich jak standardowe klauzule umowne UE lub ramy ochrony danych UE-USA (Data Privacy Framework).</p>

<h2>5. Kto widzi Twoje dane</h2>
<ul>
  <li><strong>Twój dom:</strong> każdy domownik widzi zwierzęta, rutyny, wpisy zdrowotne i historię domu, w tym kto odhaczył każde zadanie.</li>
  <li><strong>Każdy, kto ma link do karty opieki</strong>, widzi tę kartę, dopóki ktoś z domu jej nie wyłączy albo nie wymieni linku. Nie umieszczaj na karcie kodów do drzwi ani adresu.</li>
  <li><strong>My:</strong> zaglądamy do konkretnego konta tylko wtedy, gdy prosisz o pomoc, żeby naprawić problem, albo gdy wymaga tego prawo.</li>
</ul>

<h2>6. Jak długo przechowujemy dane</h2>
<p>Przechowujemy dane, dopóki masz konto. Gdy <a href="${c.deleteAccountPath}">usuniesz konto</a>, usuwamy konto, profil, ustawienia, członkostwa w domach, powiązane logowania i Twoje dane na kartach opieki, a także sam dom, jeśli byłeś(-aś) w nim ostatnią osobą. Twoje odhaczenia zostają w historii domu jako „Były domownik”, a to, co dodałeś(-aś) do wspólnego domu, zostaje u pozostałych domowników. Kopie zapasowe bazy są nadpisywane w ciągu 7 dni. Raporty o awariach wygasają po 30 dniach. E-maile do nas przechowujemy tak długo, jak to potrzebne do załatwienia sprawy.</p>

<h2>7. Twoje prawa</h2>
<p>Możesz poprosić nas o kopię swoich danych, ich sprostowanie, usunięcie, ograniczenie przetwarzania, sprzeciw wobec przetwarzania albo przekazanie danych w formacie do przeniesienia. Zgodę na statystyki użycia i raporty o awariach możesz wycofać w każdej chwili w Ustawieniach. Napisz na <a href="mailto:${c.privacyEmail}">${c.privacyEmail}</a>, a odpowiemy w ciągu miesiąca.</p>
<p>Możesz też złożyć skargę do Prezesa Urzędu Ochrony Danych Osobowych (UODO), ul. Stawki 2, 00-193 Warszawa, <a href="https://uodo.gov.pl" rel="noopener">uodo.gov.pl</a>.</p>

<h2>8. Wiek</h2>
<p>HealthyPaw jest dla osób, które ukończyły 16 lat.</p>

<h2>9. Zmiany</h2>
<p>Gdy coś się zmieni, zaktualizujemy tę stronę, a jeśli zmiana będzie dla Ciebie ważna, damy znać w aplikacji.</p>`,
  },

  terms: {
    title: 'Regulamin',
    description: 'Zasady korzystania z bety HealthyPaw.',
    body: (c) => `
<p class="lead">To zasady korzystania z aplikacji i strony HealthyPaw w czasie bety. Staraliśmy się, żeby były krótkie i zrozumiałe.</p>

<h2>1. O regulaminie</h2>
<p>Ten regulamin to umowa między Tobą a ${c.operator}${c.address ? `, ${c.address}` : ''} („my”). Zakładając konto lub korzystając z HealthyPaw, akceptujesz go. Jak traktujemy Twoje dane, wyjaśnia <a href="${c.privacyPath}">polityka prywatności</a>.</p>

<h2>2. Beta</h2>
<p>HealthyPaw to wersja testowa dostępna na zaproszenie i jest bezpłatna. Funkcje będą się zmieniać, coś może przestać działać, a betę możemy wstrzymać lub zakończyć. Jeśli to możliwe, uprzedzimy Cię wcześniej. Ważne dokumenty zdrowotne, na przykład książeczkę szczepień, przechowuj także u weterynarza.</p>

<h2>3. Twoje konto</h2>
<ul>
  <li>Musisz mieć ukończone 16 lat.</li>
  <li>Jedno konto na osobę. Chroń swoje logowanie i daj nam znać, jeśli podejrzewasz, że korzysta z niego ktoś inny.</li>
</ul>

<h2>4. Twoje treści i Twój dom</h2>
<p>To, co wpisujesz, pozostaje Twoje. Pozwalasz nam to przechowywać i pokazywać domownikom oraz osobom, którym udostępnisz kartę opieki, wyłącznie po to, żeby HealthyPaw działał. Odpowiadasz za to, co dodajesz, w tym za imiona i numery telefonu innych osób: zapytaj je najpierw o zgodę.</p>
<p>Właściciel domu zaprasza i usuwa domowników. Każdy domownik widzi i może edytować zwierzęta, rutyny i historię domu.</p>

<h2>5. Karty opieki</h2>
<p>Karta opieki to link, który może otworzyć każdy, kto go ma. Udostępniaj go tylko zaufanym osobom, nie umieszczaj na nim kodów do drzwi ani adresu i wyłącz go, gdy nie jest już potrzebny.</p>

<h2>6. To nie jest porada weterynaryjna</h2>
<p>HealthyPaw pomaga zorganizować opiekę. Nie udziela porad weterynaryjnych i nie zastępuje weterynarza. Przypomnienia zależą od ustawień i baterii telefonu i nie zawsze muszą dotrzeć. W nagłym przypadku dzwoń do weterynarza.</p>

<h2>7. Uczciwe korzystanie</h2>
<p>Nie używaj HealthyPaw do łamania prawa, nękania innych, uzyskiwania dostępu do danych innych domów, przeciążania lub atakowania usługi ani do jej kopiowania. Konta, które to robią, możemy zawiesić.</p>

<h2>8. Linki do innych usług</h2>
<p>Aplikacja może prowadzić do innych serwisów, na przykład sklepu z karmą lub rezerwacji u groomera. Prowadzą je inne firmy na własnych zasadach. W HealthyPaw nic nie kupujesz ani nie rezerwujesz.</p>

<h2>9. Zakończenie korzystania</h2>
<p>Możesz w każdej chwili przestać korzystać z HealthyPaw i <a href="${c.deleteAccountPath}">usunąć konto</a>. Możemy zamknąć konto, które narusza ten regulamin, i powiemy Ci dlaczego.</p>

<h2>10. Nasza odpowiedzialność</h2>
<p>W czasie bety HealthyPaw jest udostępniany w obecnej postaci. Robimy wszystko, żeby działał, a Twoje dane były bezpieczne, ale nie możemy obiecać, że zawsze będzie dostępny i wolny od błędów. W granicach dozwolonych przez prawo nie odpowiadamy za szkody pośrednie ani za dane utracone w czasie bety. Nic w tym regulaminie nie ogranicza Twoich praw konsumenta ani odpowiedzialności, której prawo nie pozwala ograniczyć.</p>

<h2>11. Zmiany regulaminu</h2>
<p>Możemy aktualizować regulamin. Jeśli zmiana będzie ważna, damy znać w aplikacji, zanim zacznie obowiązywać. Jeśli się nie zgadzasz, możesz usunąć konto.</p>

<h2>12. Prawo i kontakt</h2>
<p>Obowiązuje prawo polskie. Jeśli jesteś konsumentem, zachowujesz też ochronę prawa kraju, w którym mieszkasz. Masz pytania? Napisz na <a href="mailto:${c.supportEmail}">${c.supportEmail}</a>.</p>`,
  },
};
