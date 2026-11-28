// Polityka prywatności i regulamin (polski). Proste wersje na betę, oparte na szablonach Termify od Eyupa,
// ale przepisane tak, by zgadzały się z tym, co HealthyPaw faktycznie robi (bez reklam, sprzedaży danych, płatności i haseł).
// Bez weryfikacji prawnika. Przed publicznym startem do przejrzenia.

export const privacy = {
  title: 'Polityka prywatności',
  description: 'Jakich danych używa HealthyPaw, po co, kto je przetwarza i jakie masz prawa.',
  body: (c) => `
<p class="lead">HealthyPaw jest w zamkniętej becie. Ta informacja prostymi słowami wyjaśnia, jakich danych osobowych używa aplikacja i ta strona, po co, kto jeszcze się nimi zajmuje i co możesz z tym zrobić. Dotyczy aplikacji HealthyPaw oraz strony healthypaw.app (razem: „Usługa”). Nie obejmuje innych stron, do których prowadzimy linki.</p>

<h2>1. Kim jesteśmy</h2>
<p>HealthyPaw prowadzi ${c.operator}${c.address ? `, ${c.address}` : ''} („my”). Jesteśmy administratorem Twoich danych osobowych w rozumieniu RODO i mamy siedzibę w Polsce. We wszystkich sprawach dotyczących danych napisz na <a href="mailto:${c.privacyEmail}">${c.privacyEmail}</a>.</p>

<h2>2. Użyte pojęcia</h2>
<ul>
  <li><strong>Dane osobowe:</strong> każda informacja, która pozwala Cię zidentyfikować lub da się z Tobą powiązać, na przykład adres e-mail albo imię.</li>
  <li><strong>Dom:</strong> grupa osób, które wspólnie opiekują się tymi samymi zwierzętami w HealthyPaw.</li>
  <li><strong>Karta opieki:</strong> link w przeglądarce, który pokazuje codzienną opiekę nad pupilem każdemu, kto go ma.</li>
  <li><strong>Urządzenie:</strong> Twój telefon lub inne urządzenie, na którym otwierasz aplikację albo tę stronę.</li>
</ul>

<h2>3. Jakich danych używamy i po co</h2>
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
<p>Nie musisz podawać nam niczego ponad to, co jest w tabeli. Bez adresu e-mail albo logowania przez Apple lub Google nie możemy założyć Ci konta.</p>

<h2>4. Czego nie robimy</h2>
<ul>
  <li>Żadnych reklam, sieci reklamowych, remarketingu ani reklam dopasowanych do zainteresowań.</li>
  <li>Nie sprzedajemy ani nie wynajmujemy Twoich danych i nie przekazujemy ich partnerom marketingowym.</li>
  <li>Żadnych płatności ani danych karty: beta jest bezpłatna i w aplikacji nic się nie kupuje.</li>
  <li>Żadnych haseł. Logujesz się przez Apple, Google albo jednorazowy kod wysłany e-mailem.</li>
  <li>Żadnego dostępu do lokalizacji, zdjęć, mikrofonu, aparatu ani książki adresowej.</li>
  <li>Żadnych zautomatyzowanych decyzji, które miałyby wobec Ciebie skutki prawne lub podobnie istotne.</li>
</ul>

<h2>5. E-mail</h2>
<p>Piszemy do Ciebie tylko w sprawie konta: kody logowania, potwierdzenie usunięcia konta i odpowiedzi na Twoje wiadomości. Nie wysyłamy newsletterów ani wiadomości marketingowych. Jeśli to się kiedyś zmieni, najpierw poprosimy o Twoją zgodę i będziesz mógł(-ła) odmówić.</p>

<h2>6. Ta strona, pliki cookie i dane na urządzeniu</h2>
<p>healthypaw.app nie ustawia plików cookie, nie ma analityki i nie ładuje skryptów stron trzecich. Stronę dostarcza Cloudflare, który przetwarza Twój adres IP, żeby ją wyświetlić i chronić przed nadużyciami.</p>
<p>Aplikacja zapisuje na telefonie Twoją sesję logowania i ustawienia oraz kopię danych Twojego domu, żeby działać offline. To jest potrzebne do działania aplikacji, a usuniesz to, wylogowując się, usuwając aplikację albo konto.</p>

<h2>7. Kto przetwarza dane w naszym imieniu</h2>
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
<p>Ci dostawcy działają na nasze polecenie i mogą używać Twoich danych tylko po to, żeby świadczyć nam swoją usługę.</p>

<h2>8. Kto widzi Twoje dane</h2>
<ul>
  <li><strong>Twój dom:</strong> każdy domownik widzi zwierzęta, rutyny, wpisy zdrowotne i historię domu, w tym kto odhaczył każde zadanie.</li>
  <li><strong>Każdy, kto ma link do karty opieki</strong>, widzi tę kartę, dopóki ktoś z domu jej nie wyłączy albo nie wymieni linku. Nie umieszczaj na karcie kodów do drzwi ani adresu.</li>
  <li><strong>My:</strong> zaglądamy do konkretnego konta tylko wtedy, gdy prosisz o pomoc, żeby naprawić problem, albo gdy wymaga tego prawo.</li>
  <li><strong>Organy:</strong> możemy ujawnić dane, jeśli prawo zobowiązuje nas do tego sąd lub organ albo gdy jest to konieczne do ochrony czyjegoś bezpieczeństwa lub naszych praw.</li>
  <li><strong>Następca:</strong> jeśli sprzedamy lub przekażemy HealthyPaw, dane mogą trafić do nowego operatora, który musi przestrzegać tej polityki. Powiadomimy Cię o tym wcześniej.</li>
</ul>

<h2>9. Przekazywanie poza UE</h2>
<p>Większość danych zostaje w UE. Resend przechowuje logi e-maili w USA, a Cloudflare dostarcza stronę z serwerów na całym świecie. Gdy dane opuszczają Europejski Obszar Gospodarczy, opieramy się na zabezpieczeniach takich jak standardowe klauzule umowne UE lub ramy ochrony danych UE-USA (Data Privacy Framework). Szczegóły podamy na prośbę.</p>

<h2>10. Jak długo przechowujemy dane</h2>
<p>Przechowujemy dane, dopóki masz konto. Gdy <a href="${c.deleteAccountPath}">usuniesz konto</a>, usuwamy konto, profil, ustawienia, członkostwa w domach, powiązane logowania i Twoje dane na kartach opieki, a także sam dom, jeśli byłeś(-aś) w nim ostatnią osobą. Twoje odhaczenia zostają w historii domu jako „Były domownik”, a to, co dodałeś(-aś) do wspólnego domu, zostaje u pozostałych domowników. Kopie zapasowe bazy są nadpisywane w ciągu 7 dni. Raporty o awariach wygasają po 30 dniach. E-maile do nas przechowujemy tak długo, jak to potrzebne do załatwienia sprawy, a potem je usuwamy.</p>

<h2>11. Jak chronimy dane</h2>
<p>Dane są szyfrowane podczas przesyłania, dostęp do nich ograniczamy do tego, czego każda osoba potrzebuje, a każdy dom widzi tylko własne dane. Żaden system nie jest w pełni bezpieczny, więc nie możemy obiecać, że nigdy nic się nie stanie. Jeśli naruszenie ochrony danych może stwarzać dla Ciebie ryzyko, powiadomimy Ciebie i polski organ ochrony danych zgodnie z prawem.</p>

<h2>12. Twoje prawa</h2>
<p>Na podstawie RODO możesz poprosić nas o kopię danych, ich sprostowanie, usunięcie, ograniczenie przetwarzania, przekazanie w formacie do przeniesienia oraz wnieść sprzeciw wobec przetwarzania opartego na naszym prawnie uzasadnionym interesie. Zgodę na statystyki użycia i raporty o awariach możesz wycofać w każdej chwili w Ustawieniach, co nie wpływa na to, co działo się wcześniej. Napisz na <a href="mailto:${c.privacyEmail}">${c.privacyEmail}</a>. Możemy poprosić Cię o potwierdzenie tożsamości, a odpowiemy w ciągu miesiąca.</p>
<p>Możesz też złożyć skargę do Prezesa Urzędu Ochrony Danych Osobowych (UODO), ul. Stawki 2, 00-193 Warszawa, <a href="https://uodo.gov.pl" rel="noopener">uodo.gov.pl</a>, albo do organu w swoim kraju UE.</p>

<h2>13. Dzieci</h2>
<p>HealthyPaw jest dla osób, które ukończyły 16 lat. Nie zbieramy świadomie danych osób młodszych. Jeśli uważasz, że dziecko podało nam dane osobowe, napisz do nas, a je usuniemy.</p>

<h2>14. Linki do innych stron</h2>
<p>Aplikacja może prowadzić do innych serwisów, na przykład sklepu z karmą lub rezerwacji u groomera. Mają one własne polityki prywatności i nie odpowiadamy za nie. Ta polityka przestaje obowiązywać, gdy opuszczasz HealthyPaw.</p>

<h2>15. Zmiany</h2>
<p>Gdy coś się zmieni, zaktualizujemy tę stronę, a jeśli zmiana będzie dla Ciebie ważna, damy znać w aplikacji. Data na górze pokazuje najnowszą wersję.</p>`,
};

export const terms = {
  title: 'Regulamin',
  description: 'Zasady korzystania z HealthyPaw.',
  body: (c) => `
<p class="lead">To zasady korzystania z aplikacji i strony HealthyPaw, w czasie bety i po niej. Staraliśmy się, żeby były krótkie i zrozumiałe.</p>

<h2>1. O regulaminie</h2>
<p>Ten regulamin to umowa między Tobą a ${c.operator}${c.address ? `, ${c.address}` : ''} („my”). Zakładając konto lub korzystając z HealthyPaw, akceptujesz go. Jeśli się nie zgadzasz, nie korzystaj z Usługi. Jak traktujemy Twoje dane, wyjaśnia <a href="${c.privacyPath}">polityka prywatności</a>.</p>

<h2>2. Użyte pojęcia</h2>
<ul>
  <li><strong>Usługa:</strong> aplikacja HealthyPaw, strona healthypaw.app i wszystko, co udostępniamy przez nie.</li>
  <li><strong>Dom:</strong> grupa osób wspólnie opiekujących się tymi samymi zwierzętami.</li>
  <li><strong>Karta opieki:</strong> link w przeglądarce, który pokazuje codzienną opiekę nad pupilem każdemu, kto go ma.</li>
  <li><strong>Twoje treści:</strong> wszystko, co wpisujesz, na przykład zwierzęta, rutyny, wpisy zdrowotne, notatki i dane kontaktowe.</li>
</ul>

<h2>3. Licencja na korzystanie z aplikacji</h2>
<p>Udzielamy Ci osobistej, niewyłącznej, nieprzenoszalnej i odwoływalnej licencji na instalowanie i używanie aplikacji na własnych urządzeniach, do opieki nad zwierzętami Twojego domu, na zasadach tego regulaminu.</p>

<h2>4. Beta</h2>
<p>HealthyPaw to wersja testowa dostępna na zaproszenie i jest bezpłatna. Funkcje będą się zmieniać, coś może przestać działać, a betę możemy wstrzymać lub zakończyć. Jeśli to możliwe, uprzedzimy Cię wcześniej. Ważne dokumenty zdrowotne, na przykład książeczkę szczepień, przechowuj także u weterynarza.</p>

<h2>5. Twoje konto</h2>
<ul>
  <li>Musisz mieć ukończone 16 lat.</li>
  <li>Jedno konto na osobę. Chroń swoje logowanie i daj nam znać, jeśli podejrzewasz, że korzysta z niego ktoś inny.</li>
  <li>Podawaj prawdziwe dane, na przykład działający adres e-mail.</li>
</ul>

<h2>6. Twoje treści i Twój dom</h2>
<p>Twoje treści pozostają Twoje. Pozwalasz nam je przechowywać i pokazywać domownikom oraz osobom, którym udostępnisz kartę opieki, wyłącznie po to, żeby HealthyPaw działał. Odpowiadasz za to, co dodajesz, w tym za imiona i numery telefonu innych osób: zapytaj je najpierw o zgodę.</p>
<p>Właściciel domu zaprasza i usuwa domowników. Każdy domownik widzi i może edytować zwierzęta, rutyny i historię domu.</p>

<h2>7. Karty opieki</h2>
<p>Karta opieki to link, który może otworzyć każdy, kto go ma. Udostępniaj go tylko zaufanym osobom, nie umieszczaj na nim kodów do drzwi ani adresu i wyłącz go, gdy nie jest już potrzebny.</p>

<h2>8. Czego nie wolno robić</h2>
<p>Nie używaj HealthyPaw do łamania prawa, nękania innych ani do uzyskiwania dostępu do danych innych domów. Nie przeciążaj i nie atakuj usługi oraz nie kopiuj jej, nie odsprzedawaj, nie wynajmuj ani nie udzielaj dalszych licencji. Nie dekompiluj aplikacji i nie próbuj wydobyć jej kodu źródłowego, chyba że prawo daje Ci takie uprawnienie. Nie usuwaj naszych informacji o prawach autorskich ani znaków. Konta, które łamią te zasady, możemy zawiesić.</p>

<h2>9. To nie jest porada weterynaryjna</h2>
<p>HealthyPaw pomaga zorganizować opiekę. Nie udziela porad weterynaryjnych i nie zastępuje weterynarza. Przypomnienia zależą od ustawień i baterii telefonu i nie zawsze muszą dotrzeć. W nagłym przypadku dzwoń do weterynarza.</p>

<h2>10. Pomysły i opinie</h2>
<p>Jeśli wyślesz nam sugestie, pozwalasz nam użyć ich do ulepszania HealthyPaw bez wynagrodzenia i bez wskazywania Ciebie jako autora. Zachowujesz własne prawa do nich, a Twoich danych osobowych nie opublikujemy razem z nimi.</p>

<h2>11. Linki do innych usług</h2>
<p>Aplikacja może prowadzić do innych serwisów, na przykład sklepu z karmą lub rezerwacji u groomera. Prowadzą je inne firmy na własnych zasadach i z własnymi politykami prywatności. W HealthyPaw nic nie kupujesz ani nie rezerwujesz, a my nie odpowiadamy za te usługi.</p>

<h2>12. Apple i Google</h2>
<p>Jeśli pobierasz aplikację z App Store lub Google Play, do pobrania stosują się także ich regulaminy. Apple i Google nie odpowiadają za HealthyPaw, jego wsparcie ani za roszczenia z nim związane. Ten regulamin to umowa między Tobą a nami.</p>

<h2>13. Aktualizacje i zmiany usługi</h2>
<p>Możemy aktualizować aplikację poprawkami i ulepszeniami oraz dodawać, zmieniać lub usuwać funkcje. Aktualizacje są częścią aplikacji i podlegają temu regulaminowi. Postaramy się uprzedzić Cię, zanim usuniemy coś, na czym polegasz.</p>

<h2>14. Nasze prawa</h2>
<p>Aplikacja, nazwa i logo HealthyPaw, projekt i oprogramowanie należą do nas lub naszych licencjodawców i są chronione prawem autorskim oraz prawem znaków towarowych. Ten regulamin nie daje Ci ich własności. Jeśli uważasz, że coś w HealthyPaw narusza Twoje prawa autorskie, napisz na <a href="mailto:${c.supportEmail}">${c.supportEmail}</a>, podając, czego to dotyczy, gdzie to widziałeś(-aś), swoje dane kontaktowe oraz oświadczenie, że jesteś właścicielem praw lub działasz w jego imieniu, a my to sprawdzimy.</p>

<h2>15. Zakończenie</h2>
<p>Możesz w każdej chwili przestać korzystać z HealthyPaw i <a href="${c.deleteAccountPath}">usunąć konto</a>. Możemy zawiesić lub zamknąć konto, które poważnie lub wielokrotnie narusza ten regulamin, i powiemy Ci dlaczego, chyba że prawo nam tego zabrania. Możemy też zakończyć Usługę; jeśli to zrobimy, damy Ci rozsądny czas i możliwość zabrania tego, co dla Ciebie ważne.</p>

<h2>16. Nasza odpowiedzialność</h2>
<p>Świadczymy HealthyPaw z należytą starannością, ale w czasie bety jest on udostępniany „tak, jak jest”. Nie możemy obiecać, że zawsze będzie dostępny, wolny od błędów ani odpowiedni do konkretnego celu. W granicach dozwolonych przez prawo nie odpowiadamy za szkody pośrednie, takie jak utracone korzyści, ani za dane utracone w czasie bety. Odpowiadamy w pełnym zakresie tam, gdzie prawo nie pozwala ograniczyć odpowiedzialności, na przykład za winę umyślną lub rażące niedbalstwo albo za śmierć lub uszkodzenie ciała z naszej winy. Nic w tym regulaminie nie odbiera Ci praw konsumenta.</p>

<h2>17. Zmiany regulaminu</h2>
<p>Możemy aktualizować regulamin, na przykład gdy zmieni się Usługa. Jeśli zmiana będzie ważna, damy znać w aplikacji co najmniej 14 dni przed jej wejściem w życie. Jeśli po tym czasie nadal korzystasz z HealthyPaw, akceptujesz nowy regulamin. Jeśli się nie zgadzasz, możesz usunąć konto.</p>

<h2>18. Pozostałe postanowienia</h2>
<p>Jeśli jakaś część regulaminu okaże się nieważna, pozostałe nadal obowiązują. Jeśli nie skorzystamy od razu z jakiegoś prawa, nie znaczy to, że z niego rezygnujemy. Ten regulamin i polityka prywatności to całość umowy między Tobą a nami dotyczącej Usługi.</p>

<h2>19. Prawo, reklamacje i kontakt</h2>
<p>Obowiązuje prawo polskie. Jeśli jesteś konsumentem, zachowujesz też ochronę wynikającą z bezwzględnie obowiązujących przepisów kraju, w którym mieszkasz, i możesz dochodzić roszczeń przed sądem tego kraju lub polskim. Jeśli coś pójdzie nie tak, napisz najpierw do nas na <a href="mailto:${c.supportEmail}">${c.supportEmail}</a>, a postaramy się to naprawić. Konsumenci w Polsce mogą też uzyskać bezpłatną pomoc miejskiego lub powiatowego rzecznika konsumentów oraz Urzędu Ochrony Konkurencji i Konsumentów (UOKiK).</p>`,
};
