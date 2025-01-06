1. In primul rand, vom defini toate functionalitile numai in backend.
2. Vom crea rute pentru a afisa date precum lista de prieteni, lista de produse
disponibile/toate(cele care nu-s disponibile)
3. Vom testa cu ajutorul Jest functionalitatile unde este posibil. Rutele le vom
testa cu Postman.
4. Initial, nu vom crea o baza de date, dar dupa ce testam functionalitatile
fara o BD, vom folosi MySql/PostgreSQL sau MariaDB.
5. Entitatile care vor fi stocate in baza de date vor fi: Utilizator, Aliment,
UtilizatorAliment. UtilizatorAliment exista pentru a sparge relatia many to many.
Aceasta tabela contine 3 id-uri: id-ul ei unic cheie primara si id utilizator
si id aliment ca 2 foreign keys.
6. Apoi, vom inlocui in cod unde am hardcodat cu liste/dictionare (unde este cazul)
pentru a folosi baza de date. Dupa fiecare tranzactie reusita vom face commit daca
e nevoie (MariaDB are autocommit) ca sa fie persistente datele atunci cand repornim
aplicatia.
7. Dupa integrarea bazei de date, incepem dezvolatrea interfetei cu utilizatorul.
8. NU vom face register, pentru ca nu este relevant?
9. Vom avea un camp de parola in clasa Utilizator si cand ne logam, avem un drop-
down cu toti utilizatorii si putem alege cine suntem si sa introducem parola.
Parola o sa o stim pentru ca noi am pus-o.
10. Odata intrat in interfata, un utilizator vede un burger menu. In acest menu,
poate alege sa vada lista sa de alimente, sa adauge un aliment nou, sa adauge un
aliment din lista de alimente in cea de alimente disponibile (fara sa-l stearga din
prima). Mai mult, fiecare aliment are o poza.
11. Exista un formular de adaugare alimente unde se face un post catre baza de date.
12. Se pot vedea intr-o interfata de tip SPA in react toate functionalitatile din
backend, doar ca va fi posibilitatea de testare reala a aplicatiei "jucandu-ne"
cu diversele butoane/elemente HTML.
