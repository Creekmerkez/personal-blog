// Places to go with the son, for Son → Places. Built into the app like the
// games: public places only, nothing private. `mine` marks the owner's own
// list (from Google Tasks), the rest are suggestions. Prague, or a day trip
// from it. Opening hours and prices change, so they are left out on purpose:
// the Maps and website buttons have the current ones.
//
// group: one of PLACE_GROUPS. travel: rough time by car from central Prague.

export const PLACE_GROUPS = [
  { id: 'play', label: 'Ігрові центри та батути', emoji: '🧗' },
  { id: 'museums', label: 'Музеї та виставки', emoji: '🏛️' },
  { id: 'animals', label: 'Тварини й динозаври', emoji: '🦒' },
  { id: 'outdoor', label: 'Парки та майданчики в Празі', emoji: '🌳' },
  { id: 'water', label: 'Вода й купання', emoji: '💦' },
  { id: 'trips', label: 'Поїздка на день', emoji: '🚗' },
  { id: 'check', label: 'З вашого списку: уточнити', emoji: '❓' },
];

export const PLACES = [
  // Play centres
  { id: 'toboga-fantasy', emoji: '🛝', name: 'TOBOGA Fantasy', area: 'Praha 5 – Zličín, Skandinávská 5a', group: 'play', what: 'Великий критий парк: гірки, лабіринти, тюбінг без снігу, скеледром, окрема зона для найменших. Вхід у шкарпетках.', site: 'https://toboga.cz/en/praha', mine: true },
  { id: 'superland', emoji: '🎠', name: 'Superland', area: 'Praha 5 – OC Galerie Butovice', group: 'play', what: 'Критий розважальний парк на цілий день у торговому центрі.', site: 'https://www.slevomat.cz/akce/2205854-zabavni-park-superland-oc-butovice-celodenni-vstup', mine: true },
  { id: 'zirafa', emoji: '🦒', name: 'FunPark Žirafa', area: 'Čestlice (південно-східний край Праги)', group: 'play', what: 'Один з найбільших дитячих парків: понад 90 атракціонів, величезна лазанка, 9D-кіно. Окремі зони для 0–3 і 3+ років. Безкоштовна парковка, автобус 328 від метро Opatov.', site: 'https://zirafapraha.cz', mine: true },
  { id: 'tanzania-park', emoji: '🦁', name: 'Tanzania Park', area: 'Praha 15 – Horní Měcholupy', group: 'play', what: 'Дитячий критий центр у стилі сафарі: близько 30 атракціонів.', mine: true },
  { id: 'majaland', emoji: '🐝', name: 'Majaland Praha', area: 'POP Airport, Tuchoměřice (біля аеропорту)', group: 'play', what: 'Критий парк атракціонів у світі бджілки Майї: каруселі, маленькі американські гірки. Працює в будь-яку погоду.', mine: true },
  { id: 'jump-family-zlicin', emoji: '🤸', name: 'JUMP FAMILY Zličín', area: 'Praha 5 – Metropole Zličín', group: 'play', what: 'Батутний парк з окремою частиною для молодших дітей.', mine: true },
  { id: 'zona-v-pohybu-kbely', emoji: '🏃', name: 'Zóna v pohybu Kbely', area: 'Praha 19 – Kbely', group: 'play', what: 'Рухова зона: батути, лазіння, перешкоди.', site: 'https://kbely.zonavpohybu.cz', mine: true },
  { id: 'place2play', emoji: '🧩', name: 'Place2play', area: 'Praha 1 – U Půjčovny 4 (біля Hlavní nádraží)', group: 'play', what: 'Ігрова для спільної гри з батьками: сенсорна, рольова, творча й рухова кімнати. Варто бронювати.', mine: true },
  { id: 'time-out-chodov', emoji: '🧸', name: 'Time Out – dětský koutek', area: 'Praha 4 – Westfield Chodov', group: 'play', what: 'Дитячий куток на два поверхи: нагорі гра з батьками (до 3 років), внизу присмотр (3–12 років). Схоже, це ваш «Chodov 2 rooms».', mine: true },
  { id: 'time-out-letnany', emoji: '🧸', name: 'Time Out – dětský koutek', area: 'Praha 18 – OC Letňany', group: 'play', what: 'Дитячий куток у торговому центрі Letňany.', mine: true },
  { id: 'monkeys-gym', emoji: '🐒', name: "Monkey's Gym", area: 'Praha: Chodov, Ruzyně, Stodůlky, Libeň', group: 'play', what: 'Дитячий спортзал і заняття з руху для малюків від 6 місяців до 7 років.', mine: true },
  { id: 'atrium-flora', emoji: '🛍️', name: 'Dětský koutek – Atrium Flora', area: 'Praha 3 – Flora', group: 'play', what: 'Дитячий куток у торговому центрі: коли треба зайти по справах разом.', mine: true },
  { id: 'palladium', emoji: '🏠', name: 'Dětský koutek – Palladium', area: 'Praha 1 – náměstí Republiky', group: 'play', what: 'Дитячий куток з будиночками в торговому центрі Palladium.', mine: true },
  { id: 'pojd-si-hrat', emoji: '🍳', name: 'Hernička Pojď si hrát', area: 'Praha 4 – Krč, Štúrova 12 (Modrý pavilon)', group: 'play', what: 'Затишна ігрова з кав’ярнею для малюків і дошкільнят: кухоньки, гірки, лісовий лабіринт. Символічний вхід, у шкарпетках.', site: 'https://hernickapojdsihrat.cz', mine: true },
  { id: 'family-nest', emoji: '☕', name: 'Family Nest Café', area: 'Praha 5 – Smíchov, Grafická 7a', group: 'play', what: 'Сімейна кав’ярня з дитячою зоною і майстер-класами. Мало місця для візочка.', mine: true },
  { id: 'ikea-smaland', emoji: '🟨', name: 'IKEA – Småland', area: 'IKEA Zličín або Černý Most', group: 'play', what: 'Безкоштовна дитяча ігрова, поки батьки ходять магазином (за віком і зростом).', mine: true },
  { id: 'kreativni-malovani', emoji: '🎨', name: 'Kreativní malování', area: 'Praha', group: 'play', what: 'Творчі заняття з малювання, бувають разові вечірні й нічні акції.', site: 'https://www.kreativni-malovani.cz/jednorazove-akce-noc/', mine: true },
  { id: 'hamleys', emoji: '🎪', name: 'Hamleys Praha', area: 'Praha 1 – Na Příkopě', group: 'play', what: 'Великий магазин іграшок з каруселлю й зонами, де можна погратися.' },

  // Museums
  { id: 'kralovstvi-zeleznic', emoji: '🚂', name: 'Království železnic', area: 'Praha 5 – Smíchov', group: 'museums', what: 'Величезні макети залізниць і міст, поїзди їздять, можна натискати кнопки.', mine: true },
  { id: 'ntm', emoji: '🚗', name: 'Národní technické muzeum', area: 'Praha 7 – Letná', group: 'museums', what: 'Справжні паровози, машини, літаки. Поруч Národní zemědělské muzeum: можна обидва за один день.', mine: true },
  { id: 'nzm', emoji: '🚜', name: 'Národní zemědělské muzeum', area: 'Praha 7 – Letná', group: 'museums', what: 'Трактори, тварини, ферма; на даху сад з видом на Прагу. Поруч технічний музей.', mine: true },
  { id: 'narodni-muzeum', emoji: '🦴', name: 'Národní muzeum', area: 'Praha 1 – Václavské náměstí', group: 'museums', what: 'Скелети, тварини, мінерали; часто є виставки й програми для дітей.', mine: true },
  { id: 'signal-space', emoji: '✨', name: 'SIGNAL SPACE', area: 'Praha', group: 'museums', what: 'Світлові інтерактивні інсталяції: світло реагує на рух. Квитки онлайн.', site: 'https://www.signalspace.com/buy-tickets', mine: true },
  { id: 'galaxie', emoji: '🪐', name: 'Kulturní stanice Galaxie', area: 'Praha 11 – Háje, Arkalycká 4', group: 'museums', what: 'Колишній кінотеатр, тепер культурний центр: вистави, майстерні, бувають програми для дітей. Відкритий тимчасово, перевірте програму.', mine: true },
  { id: 'planetarium', emoji: '🔭', name: 'Planetárium Praha', area: 'Praha 7 – Stromovka', group: 'museums', what: 'Зоряне небо під куполом, вистави для дітей. Поруч парк Stromovka.' },
  { id: 'muzeum-mhd', emoji: '🚋', name: 'Muzeum MHD', area: 'Praha 6 – Střešovice', group: 'museums', what: 'Старі трамваї й автобуси в депо. Сезонне (весна–осінь, вихідні).', season: 'Весна–осінь' },
  { id: 'stefanikova-hvezdarna', emoji: '🌙', name: 'Štefánikova hvězdárna', area: 'Praha 1 – Petřín', group: 'museums', what: 'Обсерваторія на Петршині: подивитися на Сонце чи Місяць у телескоп.' },

  // Animals and dinosaurs
  { id: 'zoo-praha', emoji: '🦒', name: 'Zoo Praha', area: 'Praha 7 – Troja', group: 'animals', what: 'Один із найкращих зоопарків Європи: павільйони, крісельна дорога, дитячий зоокуток, майданчики.', mine: true },
  { id: 'morsky-svet', emoji: '🐠', name: 'Mořský svět', area: 'Praha 7 – Výstaviště Holešovice', group: 'animals', what: 'Морський акваріум: риби, акули, корали. Під дахом.', mine: true },
  { id: 'svet-meduz', emoji: '🪼', name: 'Svět medúz + Jellyjake park', area: 'Praha 4 – OC Arkády Pankrác', group: 'animals', what: 'Виставка медуз, а на даху дитячий парк з лазанками й батутами.', mine: true },
  { id: 'krtkuv-svet', emoji: '🐹', name: 'Krtkův svět', area: 'Praha 15 – Horní Měcholupy', group: 'animals', what: 'Дерев’яний парк серед дерев: близько 30 атракціонів, мотузки, батути, міні-зоо з козами. Відгуки змішані.', mine: true },
  { id: 'dinolive', emoji: '🦖', name: 'DinoLive', area: 'Praha 6 – Divoká Šárka', group: 'animals', what: 'Парк рухомих динозаврів просто неба, поруч майданчики й купальня Džbán.', season: 'Тепла пора року', mine: true },
  { id: 'dinopark-praha', emoji: '🦕', name: 'DinoPark Praha', area: 'Praha 9 – дах OC Galerie Harfa', group: 'animals', what: 'Динозаври на даху торгового центру, палеомайданчик, 4D-кіно.', season: 'Весна–осінь', mine: true },
  { id: 'toulcuv-dvur', emoji: '🐐', name: 'Toulcův dvůr', area: 'Praha 10 – Hostivař', group: 'animals', what: 'Міська ферма: кози, вівці, коні, кури; простір побігати. Поруч Hostivařská přehrada.' },
  { id: 'botanicka-troja', emoji: '🦋', name: 'Botanická zahrada – Fata Morgana', area: 'Praha 7 – Troja', group: 'animals', what: 'Тропічна оранжерея; щовесни там виставка живих метеликів. Поруч Zoo Praha. Метелики замість закритої Papilonia.' },

  // Parks and playgrounds in Prague
  { id: 'detsky-ostrov', emoji: '🏝️', name: 'Dětský ostrov', area: 'Praha 5 – острів на Влтаві біля Národní divadlo', group: 'outdoor', what: 'Острів з майданчиками для різного віку, біля води. Безкоштовно.', mine: true },
  { id: 'u-draka', emoji: '🐉', name: 'Hřiště U Draka – Riegrovy sady', area: 'Praha 2 – Vinohrady', group: 'outdoor', what: 'Майданчик з великим мотузковим драконом, гойдалки, пісочниця.', mine: true },
  { id: 'malesicky-park', emoji: '🌳', name: 'Malešický park', area: 'Praha 10 – Malešice', group: 'outdoor', what: 'Великий тихий парк для прогулянок і пікніка.', mine: true },
  { id: 'lannova', emoji: '🧊', name: 'Hřiště v parku Lannova', area: 'Praha 1 – Lannova (біля Florenc)', group: 'outdoor', what: 'Оновлений у 2025 майданчик: будиночок у вигляді кубика Рубіка, улюблена піраміда, пісочниця під навісом, карусель.', mine: true },
  { id: 'petrin', emoji: '🚠', name: 'Petřín', area: 'Praha 1 – Malá Strana', group: 'outdoor', what: 'Фунікулер нагору, дзеркальний лабіринт, оглядова вежа, парки.' },
  { id: 'stromovka', emoji: '🦆', name: 'Stromovka', area: 'Praha 7 – Holešovice', group: 'outdoor', what: 'Найбільший парк Праги: качки, майданчики, велосипед і самокат. Поруч Planetárium і Mořský svět.' },
  { id: 'pitkovicke-rybniky', emoji: '🐸', name: 'Park Pitkovické rybníky', area: 'Praha 22 – Pitkovice', group: 'outdoor', what: 'Новий парк зі ставками, майданчиком і місцем для вогнища.' },
  { id: 'winter-wonderland', emoji: '❄️', name: 'Winter Wonderland Praha', area: 'Praha 18 – Letňany (місце перевірте щороку)', group: 'outdoor', what: 'Зимовий світловий парк: сотні казкових інсталяцій, каруселі, дитячий потяг, гірки.', season: 'Зима (приблизно листопад–січень)', mine: true },

  // Water
  { id: 'aquapalace', emoji: '🌊', name: 'Aquapalace Praha', area: 'Čestlice (південно-східний край Праги)', group: 'water', what: 'Великий аквапарк: гірки, хвилі, дитячий басейн.', mine: true },
  { id: 'sutka', emoji: '🏊', name: 'Aquacentrum Šutka', area: 'Praha 8 – Kobylisy', group: 'water', what: 'Басейн з гірками й дитячою частиною.', mine: true },
  { id: 'jedenactka', emoji: '🐳', name: 'Jedenáctka VS', area: 'Praha 11 – Chodov (метро Chodov / Opatov)', group: 'water', what: 'Спорткомплекс з дитячим плавальним центром і ігровим куточком.', mine: true },
  { id: 'radotin', emoji: '🏊', name: 'Bazén a Biotop Radotín', area: 'Praha 16 – Radotín', group: 'water', what: 'Критий басейн (при школі, відкритий і для всіх), а влітку природне купалище Biotop без хлору: частина для неплавців, дитячі атракції.', mine: true },
  { id: 'zlute-lazne', emoji: '🏖️', name: 'Žluté lázně', area: 'Praha 4 – Podolí, біля Влтави', group: 'water', what: 'Літній «пляж» на березі: пісок, майданчики, кафе.', season: 'Літо', mine: true },
  { id: 'hostivarska-prehrada', emoji: '🚣', name: 'Hostivařská přehrada', area: 'Praha 10 – Hostivař', group: 'water', what: 'Водосховище з купанням, пляжами й лісом. Поруч ферма Toulcův dvůr.', season: 'Літо', mine: true },
  { id: 'lhotka', emoji: '🐸', name: 'Koupací biotop Lhotka', area: 'Praha 4 – Lhotka (біля Novodvorská)', group: 'water', what: 'Природне озеро-купалище без хлору, з 2025 року є мілка зона для дітей. Краще їхати громадським транспортом: мало парковки.', season: 'Літо', mine: true },

  // Day trips
  { id: 'babylon-liberec', emoji: '🎢', name: 'Centrum Babylon Liberec', area: 'Liberec', travel: '~1 год 15 хв', group: 'trips', what: 'Аквапарк, луна-парк і iQPARK під одним дахом. Можна з ночівлею, але й за день встигнете.', mine: true },
  { id: 'iqlandia', emoji: '🔬', name: 'iQLANDIA', area: 'Liberec', travel: '~1 год 15 хв', group: 'trips', what: 'Науковий центр: усе можна чіпати й пробувати. У Ліберці ще Zoo Liberec і Ještěd.' },
  { id: 'zoo-liberec', emoji: '🐘', name: 'Zoo Liberec', area: 'Liberec', travel: '~1 год 15 хв', group: 'trips', what: 'Найстаріший зоопарк Чехії, компактний, добре для малюків.' },
  { id: 'mirakulum', emoji: '🏰', name: 'Mirakulum', area: 'Milovice', travel: '~45 хв', group: 'trips', what: 'Великий дерев’яний парк: вежі, тунелі, гірки, тварини. Можна на весь день.', season: 'Весна–осінь', mine: true },
  { id: 'fajnpark', emoji: '🐰', name: 'Fajnpark Hopsalkov', area: 'Chlumec nad Cidlinou', travel: '~1 год', group: 'trips', what: 'Дитячий парк з атракціонами й майданчиками.', site: 'https://www.kudyznudy.cz/aktivity/fajnpark-hopsalkov-chlumec-nad-cidlinou', mine: true },
  { id: 'machovo-jezero', emoji: '⛵', name: 'Máchovo jezero', area: 'Doksy', travel: '~1 год 15 хв', group: 'trips', what: 'Велике озеро з піщаними пляжами, кораблики, прогулянки.', season: 'Літо', mine: true },
  { id: 'lhota', emoji: '🏝️', name: 'Přírodní koupaliště Lhota', area: 'Lhota u Dřís', travel: '~40 хв', group: 'trips', what: 'Природне озеро з піском, пологим заходом у воду й майданчиками.', season: 'Літо', mine: true },
  { id: 'safari-park', emoji: '🦓', name: 'Safari Park Dvůr Králové', area: 'Dvůr Králové nad Labem', travel: '~1 год 45 хв', group: 'trips', what: 'Африканські тварини, сафарі-автобусом або своїм авто. На весь день.' },
  { id: 'plzen', emoji: '🦖', name: 'Zoo + DinoPark Plzeň', area: 'Plzeň', travel: '~1 год', group: 'trips', what: 'Зоопарк і парк динозаврів поруч, один квиток. У Пльзені ще науковий центр Techmania.' },
  { id: 'zoo-chleby', emoji: '🦜', name: 'Zoo Chleby', area: 'Chleby u Nymburka', travel: '~50 хв', group: 'trips', what: 'Невеликий затишний зоопарк, ідеально для малюків.' },
  { id: 'jeleni-homole', emoji: '🦌', name: 'Zoopark Jeleni Homole', area: 'біля Dobříš', travel: '~45 хв', group: 'trips', what: 'Контактний зоопарк з оленями: на вході дають корм, тварини їдять з рук. Можливо, це ваш «парк з оленями».', mine: true },
  { id: 'obora-zleby', emoji: '🦌', name: 'Obora Žleby', area: 'Žleby, біля Čáslav', travel: '~1 год 15 хв', group: 'trips', what: 'Обора з білими оленями біля замку Žleby, годування й показ хижих птахів. Близько 30 хв, можна поєднати із замком. Або, можливо, ваш «парк з оленями» – саме цей.', mine: true },
  { id: 'loucen', emoji: '🌀', name: 'Labyrinty Loučeň', area: 'Zámek Loučeň', travel: '~45 хв', group: 'trips', what: 'Парк лабіринтів біля замку: дітям дуже подобається шукати вихід.', season: 'Весна–осінь' },
  { id: 'karlstejn', emoji: '🏰', name: 'Hrad Karlštejn', area: 'Karlštejn', travel: '~40 хв (або поїздом)', group: 'trips', what: 'Справжній замок на пагорбі. Дорога вгору – вже пригода.' },
  { id: 'koneprusy', emoji: '🦇', name: 'Koněpruské jeskyně', area: 'Koněprusy, біля Бероуна', travel: '~45 хв', group: 'trips', what: 'Печери зі сталактитами, екскурсія близько години. Можна поєднати з Karlštejn.', season: 'Весна–осінь' },
  { id: 'stezka-korunami', emoji: '🌲', name: 'Stezka korunami stromů Krkonoše', area: 'Janské Lázně', travel: '~2 год', group: 'trips', what: 'Стежка серед верхівок дерев і вежа зі спіральним спуском. Можна з візочком.' },

  // From the owner's list, not clear yet: tell Claude which place you meant.
  { id: 'detsky-hrad', emoji: '🏰', name: 'Dětský hrad (venku)', area: 'Praha?', group: 'check', what: 'Не знайшла місця з такою назвою. Якщо згадаєте район або що там було, напишіть.', mine: true },
  { id: 'slany', emoji: '❓', name: 'Slaný', area: 'Slaný', travel: '~40 хв', group: 'check', what: 'Що саме у Слані?', mine: true },
];

/** A Google Maps search, so every place has a working link without a stored address. */
export const mapsUrl = (place) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name}, ${place.area.replace(/\?/g, '')}`)}`;
