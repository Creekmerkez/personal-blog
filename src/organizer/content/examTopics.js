// The owner's 20 topics for the exam "Zkouška z českého jazyka a českých reálií".
// They are put into the Zkouška tab once, on its first visit, and from then on
// they are the owner's own, editable copy (stored with the rest of the data).
// One sentence per line.

const topic = (number, title, text) => ({ id: `exam-${number}`, number, title, text: text.trim() });

export const EXAM_TOPICS = [
  topic(1, 'Moje rodina', `
Moje rodina není velká.
Mám manžela a syna.
Bydlíme spolu v Praze.
Můj syn chodí do školky.
Je veselý a rád si hraje.
Můj manžel pracuje v Praze.
Já také pracuji v Praze.
Ve volném čase jsme často spolu.
Rádi chodíme na procházky a na výlety.
O víkendu někdy jezdíme mimo Prahu.
Máme se rádi a rádi spolu trávíme čas.
`),
  topic(2, 'Bydlení', `
Bydlím v Praze v bytě.
Náš byt není velký, ale je útulný.
Máme obývací pokoj, ložnici a kuchyň.
Máme také koupelnu a malý balkon.
V obývacím pokoji máme pohovku a televizi.
V kuchyni často vaříme.
Moje ložnice je klidná a světlá.
V okolí máme obchody a restaurace.
Blízko je také park.
Bydlím tady ráda, protože je tu všechno blízko.
`),
  topic(3, 'Práce a studium', `
Pracuji v Praze.
Moje práce je zajímavá.
Pracuji od pondělí do pátku.
Do práce většinou jezdím tramvají.
Pracuji několik hodin denně.
Někdy mám hodně práce.
Někdy je práce klidnější.
Mám ráda svoje kolegy.
Ve volném čase se také učím česky.
Čeština není jednoduchá, ale baví mě.
Chci mluvit česky lépe.
`),
  topic(4, 'Volný čas a koníčky', `
Ve volném čase ráda sportuji.
Dvakrát týdně chodím cvičit.
Také ráda běhám.
Někdy chodím na dlouhé procházky.
Ráda poslouchám hudbu.
Večer se dívám na filmy nebo seriály.
Ráda také čtu knihy.
O víkendu ráda trávím čas s rodinou.
Někdy jdeme do restaurace.
Když je hezké počasí, chodíme ven.
Volný čas je pro mě velmi důležitý.
`),
  topic(5, 'Každodenní život', `
Každý den vstávám ráno.
Nejdříve si udělám snídani.
Potom se připravím do práce.
Do práce jezdím tramvají.
Pracuji od pondělí do pátku.
Po práci jdu někdy nakoupit.
Doma připravím večeři.
Večer uklízím nebo odpočívám.
Někdy se učím česky.
Před spaním si čtu nebo se dívám na film.
O víkendu mám více času na rodinu.
`),
  topic(6, 'Nakupování', `
Nakupuji několikrát týdně.
Nejčastěji nakupuji potraviny.
Chodím do supermarketu nebo na trh.
Kupujeme ovoce, zeleninu, mléko a pečivo.
Také kupuji ryby a vejce.
Před nákupem si často udělám seznam.
Snažím se kupovat čerstvé potraviny.
Někdy nakupuji také oblečení.
Ráda se podívám na nové věci.
Porovnávám ceny v různých obchodech.
Když je něco drahé, počkám na slevu.
`),
  topic(7, 'Jídlo a restaurace', `
Mám ráda zdravé a dobré jídlo.
Ráda jím zeleninu a ovoce.
Také mám ráda ryby a vejce.
Ráno většinou snídám doma.
K obědu si dávám něco teplého.
Večer máme většinou lehkou večeři.
Někdy chodím s rodinou do restaurace.
Ráda zkouším nová jídla.
V restauraci si často objednám rybu nebo těstoviny.
K jídlu si dám vodu nebo něco nealkoholického.
Po dobrém jídle si ráda dám kávu.
`),
  topic(8, 'Cestování a dovolená', `
Ráda cestuji a poznávám nová místa.
Na dovolenou jezdím nejraději k moři.
Mám ráda teplé počasí.
Ráda plavu a odpočívám na pláži.
Také ráda poznávám místní města.
Před cestou si připravím všechny věci.
Zkontroluji také doklady a letenky.
Na dovolené ráda ochutnávám místní jídlo.
Často fotím zajímavá místa.
Na dovolené si hlavně chci odpočinout.
Po dovolené se ráda vracím domů.
`),
  topic(9, 'Zdraví', `
Zdraví je pro mě velmi důležité.
Snažím se zdravě jíst.
Každý den piju dost vody.
Dvakrát týdně cvičím.
Také chodím na procházky.
Snažím se dostatečně spát.
Když jsem nemocná, zůstanu doma.
Když mám problém, jdu k lékaři.
Pravidelně chodím na preventivní prohlídky.
Myslím si, že pohyb je pro zdraví důležitý.
Také je důležité odpočívat.
`),
  topic(10, 'Počasí a roční období', `
V České republice máme čtyři roční období.
Na jaře se otepluje a všechno začíná kvést.
V létě je většinou teplo a slunečno.
Mám ráda letní počasí.
Na podzim se ochlazuje a často prší.
Na podzim jsou také krásně barevné stromy.
V zimě bývá zima a někdy sněží.
Nemám ráda velmi studené počasí.
Každé roční období má něco hezkého.
Nejraději mám jaro a léto.
`),
  topic(11, 'Doprava', `
V Praze používám hlavně městskou dopravu.
Nejčastěji jezdím tramvají.
Někdy jedu také metrem nebo autobusem.
Městská doprava je velmi pohodlná.
Většinou nemusím dlouho čekat.
Když je hezké počasí, chodím pěšky.
Na delší cestu používám vlak nebo autobus.
Když jedu autem, někdy je problém s parkováním.
V centru Prahy bývá hodně aut.
Proto mám raději veřejnou dopravu.
`),
  topic(12, 'Město a služby', `
Bydlím v Praze.
Praha je velké a krásné město.
Je tady mnoho obchodů a restaurací.
Máme tady také školy, nemocnice a lékárny.
V centru je mnoho turistů.
Ráda chodím do parků.
V Praze je také mnoho muzeí a divadel.
Ve městě používám hlavně tramvaj a metro.
Někdy je v centru velký provoz.
Přesto se mi Praha líbí, protože je tady všechno blízko.
`),
  topic(13, 'Kultura a média', `
Ve volném čase ráda sleduji filmy a seriály.
Někdy chodím do kina.
Ráda poslouchám hudbu.
Také ráda čtu knihy.
Zajímá mě česká kultura.
Někdy navštívím muzeum nebo výstavu.
Doma často používám internet.
Čtu zprávy a hledám zajímavé informace.
Sociální sítě používám také.
Snažím se ale netrávit na internetu příliš mnoho času.
`),
  topic(14, 'Sport', `
Sport je součástí mého života.
Dvakrát týdně chodím na silový trénink.
Také dvakrát týdně běhám.
Obvykle běhám asi třicet minut.
Někdy cvičím také doma.
Sport mi pomáhá udržovat se v kondici.
Po cvičení se cítím dobře.
Ráda také chodím na dlouhé procházky.
Nemám ráda celý den jen sedět doma.
Myslím si, že pohyb je důležitý pro zdraví.
`),
  topic(15, 'Příroda a životní prostředí', `
Mám ráda přírodu.
Ráda chodím do lesa nebo do parku.
Ve volném čase chodím na procházky.
Myslím si, že bychom měli chránit životní prostředí.
Je důležité třídit odpad.
Snažím se používat méně plastů.
Také nechci zbytečně plýtvat vodou.
Když je to možné, používám veřejnou dopravu.
Je důležité udržovat přírodu čistou.
Každý člověk může pro přírodu něco udělat.
I malé změny jsou podle mě důležité.
`),
  topic(16, 'Technologie a internet', `
Technologie používám každý den.
Mám chytrý telefon a počítač.
Telefon používám hlavně na komunikaci.
Často píšu zprávy a telefonuji.
Na internetu hledám informace.
Používám také e-mail.
Někdy nakupuji přes internet.
Internet mi pomáhá také při učení češtiny.
Technologie nám mohou hodně usnadnit život.
Je ale důležité dávat si pozor na osobní údaje.
Neměli bychom být na internetu celý den.
`),
  topic(17, 'Přátelé a vztahy', `
Přátelé jsou pro mě velmi důležití.
Mám několik dobrých přátel.
Ráda s nimi trávím volný čas.
Někdy jdeme společně do restaurace.
Jindy jdeme na procházku nebo na kávu.
S přáteli si často povídáme.
Můžeme si navzájem pomoci.
Dobrý přítel by měl být upřímný.
Je důležité umět poslouchat druhé.
Myslím si, že dobré vztahy potřebují čas a důvěru.
`),
  topic(18, 'Plány do budoucna', `
Do budoucna mám několik plánů.
Chci se dobře naučit česky.
Chci mluvit česky bez velkých problémů.
Také bych chtěla více cestovat.
Ráda bych poznala nová místa.
Chci mít dost času na rodinu.
Také chci pokračovat ve sportu.
Chtěla bych mít zdravý a klidný život.
V budoucnu bych se chtěla také naučit něco nového.
Myslím si, že je důležité mít nějaké cíle.
`),
  topic(19, 'Život v České republice', `
Žiji v České republice a bydlím v Praze.
Praha se mi líbí.
Je to krásné a zajímavé město.
V České republice se mi líbí příroda.
Mám ráda také česká města a hrady.
Čeština je pro mě důležitá.
Každý den se snažím česky mluvit.
Někdy je čeština těžká.
Postupně ale rozumím více a více.
Ráda poznávám český život a kulturu.
Chtěla bych se tady cítit jako doma.
`),
  topic(20, 'Důležité události a zážitky', `
Jedním z mých hezkých zážitků byla dovolená u moře.
Jela jsem tam s rodinou.
Bylo krásné počasí.
Každý den jsme chodili na pláž.
Hodně jsme plavali a odpočívali.
Navštívili jsme také několik zajímavých míst.
Ochutnali jsme místní jídlo.
Udělali jsme mnoho fotografií.
Byli jsme spolu a měli jsme se moc dobře.
Na tuto dovolenou často vzpomínám.
Doufám, že se tam někdy znovu vrátíme.
`),
];
