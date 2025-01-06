Vom implementa urmatoarele functionalitati:

1. O metoda de creare lista alimente, ce va contine alimente pe care le adaug in
lista, ca utilizator.
2. O metoda de editare a listei (adaugare, stergere, editare aliment existent)
3. Vom avea o clasa Produs/Aliment, iar lista va fi o lista de Produs/Aliment.
4. Vor fi mai multe categorii de alimente. Vom crea un "enum" cu Object.freeze
ce va contine diverse categorii de mancare (de exemplu: healthy/unhealthy/protein-
rich, vegan etc)
5. Unul dintre atributele clasei Aliment va fi data de expirare. Clasa va pune
la dispozitie o metoda de calcul a numarului de zile ramase pana la expirare, iar
cand numarul de zile este mai mic de 2, utilizatorul va fi notificat. Notificarea
va fi de fapt un array sau o lista de string in interiorul clasei Utilizator (vezi
punctul 8). 
6. Pun la dispozitie o metoda de a marca un produs ca fiind disponibil spre consum
de catre alt utilizator.
7. Alimentele care sunt marcate ca si disponibile vor fi salvate intr-o alta lista
de Produs/Aliment.
8. Cream o clasa de Utilizator si de asemenea o clasa mai mare ce va contine o
lista de utilizatori, aceasta clasa numindu-se GrupDePrieteni. Alternativ,
in loc sa cream o alta clasa, putem sa tinem o lista de Utilizator pe care o vom
numi Prieteni in interiorul clasei Utilizator. Definim un alt obiect cu valoare
ce va fi tot un "enum", dar care se poate modifica in timp. Acest enum va contine
diferitele tipuri de prieteni. Adica, vegetarian, carnivor, iubitor de zacusca etc.
Acest enum va fi un alt atribut al clasei utilizator.
9. Am o lista in clasa Utilizator de prieteni invitati sa vada alimentele care
sunt disponibile. Asta inseamna ca in clasa Utilizator voi avea un atribut care
este un dictionar. Dictionarul va fi compus din lista de prieteni ca si chei
si valorea posibila in dreptul fiecarui prieten va fi ori, "M-A INVITAT SA
VIZIONEZ LISTA DE ALIMENTE DISPONIBILE" sau "NU M-A INVITAT SA VIZIONEZ LISTA DE
ALIMENTE DISPONIBILE". In caz ca am fost invitati, avem acces la o alta metoda
din interiorul clasei Utilizator, si anume metoda getListOfAvailableFood, care
primeste ca parametru un String (unul dintre cele 2 stringuri de mai sus). In caz
ca am fost invitati, putem trece mai departe, altfel se iese din metoda.
10. Cand un utilizator da claimed unui produs se muta din lista
de alimente disponibile a utilizatorului in care e in lista de alimente
(nedisponibile) a utilizatorului care a dat claim.
11. Adaugare buton de share on instagram care va crea o postare cu o poza (sau
mai multe in functie de numarul de alimente disponibile) pe Instagram respectiv
Facebook. Poate sa fie Text pe facebook, dar poate sa fie si poza ca pe Instagram.
