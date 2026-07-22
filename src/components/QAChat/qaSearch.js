import Fuse from 'fuse.js';
import { qaData } from './qaData';

const fuseOptions = {
  keys: [
    { name: 'question', weight: 0.7 },
    { name: 'answer', weight: 0.3 },
  ],
  threshold: 0.28,
  includeScore: true,
  minMatchCharLength: 4,
};

const instances = {};

function getFuse(lang) {
  if (!instances[lang]) {
    instances[lang] = new Fuse(qaData[lang] ?? qaData.en, fuseOptions);
  }
  return instances[lang];
}

const OVERVIEW_IDS = [51, 27];

const GENERAL_QUERY =
  /\b(who(?:'s| (?:are|is)) (you|she|her|this|julia)|tell me about|about (you|julia)|know about (you|julia)|introduce|overview|who is julia|what (does|is|did) (she|he|julia|you) (do|doing|work|make|create)|what do you do|describe (yourself|julia|her|him)|julia.{0,15}(life|work|career|story|background)|her (life|work|career|story|background)|your (life|story|background|work|career))\b|(хто.{0,15}(вона|ти|це|така|такий)|(вона|ти|це).{0,15}хто|розкажи (про неї|про тебе|про юлі)|про (неї|юлію)|що вона|що ти робиш|загальн|знайом|опиши (її|себе|юлі))/i;

const GREETING =
  /^(hi|hey|hello|hola|sup|yo|greetings|how are you|how r u|what'?s up|привіт|вітаю|добрий день|добридень|хай|як справи|як ти)[!?,. ]*$/i;

// Topic router: maps question keywords → hardcoded third-person answers (or Q&A IDs as fallback).
// NOTE: \b word boundaries only work for ASCII. Cyrillic terms are placed after | without \b.
const TOPIC_ROUTES = [
  {
    pattern: /\b(yes or no|is (that|it) (a )?yes|it means yes|does (that|it) mean yes|so (yes|no)\??|just (yes|no)|is the answer yes|i mean yes|mean yes or no)\b|(так чи ні|це так\?|значить так|отже так|мається на увазі так|тобто так чи ні)/i,
    hardcoded: {
      en: "I don't have enough context to give a yes or no — could you rephrase your question? Happy to tell you more about Julia!",
      ua: "Мені бракує контексту для однозначної відповіді — можете переформулювати питання? Із задоволенням розкажу більше про Юлію!",
    },
  },
  {
    pattern: /\b(husband|spouse|partner)\b|(чоловік|партнер)/i,
    hardcoded: {
      en: "Julia lives in Prague with her husband and son. She keeps his personal details private, but speaks of him with warmth and gratitude.",
      ua: "Юлія живе в Празі з чоловіком і сином. Вона тримає особисті деталі про нього при собі, але говорить про нього з теплотою та вдячністю.",
    },
  },
  {
    pattern: /\b(family|relatives|parents)\b|(сім.?я|батьк|рідн)/i,
    hardcoded: {
      en: "Family is everything to Julia. She lives in Prague with her wonderful husband and son — her ideal day is all of them spending time together, ideally with her parents too.",
      ua: "Сім'я — це все для Юлії. Вона живе в Празі з чудовим чоловіком і сином. Ідеальний день для неї — провести час разом, ідеально ще й із батьками.",
    },
  },
  {
    pattern: /\b(from|origin(?:ally)?|hometown|born)\b|grew up|kyiv region|(рідне місто|звідки|де (?:ти )?народил|де (?:ти )?виросл)/i,
    hardcoded: {
      en: "Julia is originally from the Kyiv region of Ukraine — she spent a significant part of her life in Kyiv before relocating to Prague about 11 years ago for work.",
      ua: "Юлія родом із Київської області України — значну частину свого життя вона прожила в Києві, перш ніж переїхати до Праги близько 11 років тому через роботу.",
    },
  },
  {
    pattern: /\b(prague|czech republic|which city|which country)\b|where.{0,12}(?:live|based|stay)|live.{0,12}where|how long.{0,10}(?:prague|czech)|lived.{0,10}prague|(де (?:ти )?жив|де живеш|Прага|переїхала|скільки.{0,10}празі)/i,
    hardcoded: {
      en: "Julia lives in Prague, Czech Republic — she's been here for about 11 years, originally relocating for a job opportunity. She lives with her husband and son and loves the city.",
      ua: "Юлія живе в Празі, Чехія — вже близько 11 років, спочатку переїхала сюди через роботу. Живе з чоловіком і сином і дуже любить це місто.",
    },
  },
  {
    pattern: /česk|ceske|české|reálie|realie|citizenship exam|czech (?:book|guide|resource)|czech history|czech culture|czech republic book/i,
    hardcoded: {
      en: "České Reálie is Julia's comprehensive guide to the Czech Republic — it covers history, geography, politics, traditions, culture, society, and climate all in one place. It's especially useful for people preparing for the Czech citizenship exam.",
      ua: "České Reálie — комплексний посібник Юлії про Чехію, де в одному місці зібрано інформацію про історію, географію, політику, традиції, культуру, суспільство та клімат. Особливо корисно для тих, хто готується до іспиту на чеське громадянство.",
    },
  },
  {
    pattern: /\b(how many books?|four books?|4 books?|kids? books?|published books?|book titles?)\b|(назви книг|скільки книг|дитяч(?:а|і) книг|опублікован)/i,
    hardcoded: {
      en: "Julia has published four children's books. She created them because she was looking for specific types of books for her son and couldn't find exactly what she wanted — so she decided to write them herself.",
      ua: "Юлія видала чотири дитячі книги. Вона створила їх, тому що шукала для сина певний тип книг і не могла знайти саме те, що хотіла — тому вирішила написати їх сама.",
    },
  },
  {
    pattern: /\b(language|speak|fluent|tongue)\b|(мов(?:и|у|ами)|говориш якими|якими мовами)/i,
    hardcoded: {
      en: "Julia speaks Ukrainian, Czech, English, and Russian.",
      ua: "Юлія розмовляє українською, чеською, англійською та російською мовами.",
    },
  },
  {
    pattern: /\b(education|university|study|studied|degree|master|college|diploma)\b|(освіт|університет|навчал|ступінь|диплом|магістр|вища освіта)/i,
    hardcoded: {
      en: "Julia studied at the University of Modern Knowledge in Kyiv and earned a Master's degree.",
      ua: "Юлія навчалася в Університеті сучасних знань у Києві та отримала ступінь магістра.",
    },
  },
  {
    pattern: /\b(like|enjoy|love|hate|dislike|feel about|passionate about)\b.{0,25}\b(job|work|career|profession)\b|\b(job|work|career)\b.{0,25}\b(like|enjoy|love|hate|satisfy|fulfil|make her happy)\b|(подобається.{0,20}робот|робот.{0,20}подобається|чи любить роботу|як ставиться до роботи)/i,
    hardcoded: {
      en: "Julia has spent 10+ years in IT — that kind of commitment is a pretty clear yes. She's especially passionate about AI and building digital experiences, which goes well beyond just doing a job.",
      ua: "Юлія понад 10 років у IT — така відданість красномовно говорить «так». Особливо захоплена ШІ і створенням цифрових продуктів — це явно більше, ніж просто робота.",
    },
  },
  {
    pattern: /\b(work|job|profession|career|engineer|automation|testing|tester|tech)\b|(чим займаєш|спеціальність|фах|професія|тестуван|автоматизац)/i,
    hardcoded: {
      en: "Julia is a Test Automation Engineer with 10+ years in IT, specializing in automated testing and quality assurance. She's also deeply interested in AI and helps people create AI-powered digital experiences.",
      ua: "Юлія — Test Automation Engineer з понад 10 роками досвіду в IT. Спеціалізується на автоматизованому тестуванні та QA, а також цікавиться ШІ і допомагає людям створювати цифрові продукти на його основі.",
    },
  },
  {
    pattern: /artificial intelligence|follow AI|technology trend|new tech|\bAI\b|(ШІ|штучн(?:ий|ого) інтелект|технолог(?:ії|ічн)|цікавишся технолог)/i,
    hardcoded: {
      en: "Julia is really fascinated by AI — she actively follows developments in the field and loves exploring how these technologies can be applied in creative, educational, and digital experiences.",
      ua: "Юлія дуже захоплена ШІ — активно слідкує за розвитком у цій галузі й досліджує, як ці технології застосовувати в творчих, освітніх і цифрових продуктах.",
    },
  },
  {
    pattern: /\b(dj|djing|music|mix(?:es|ing)?|spin(?:ning)?|still dj|active dj)\b|(діджей|музик|мікс(?:и|ів)|зводиш|досі діджей)/i,
    hardcoded: {
      en: "DJing was a very important creative chapter in Julia's life — she created 17 mixes during that period. Right now it's paused due to other priorities, though she might return someday. She also believes AI may significantly change how music and DJing are created.",
      ua: "Діджеїнг був дуже важливим творчим розділом у житті Юлії — за той час вона створила 17 міксів. Зараз це на паузі через інші пріоритети, хоча можливо колись повернеться. Юлія також вважає, що ШІ може суттєво змінити те, як музика та діджеїнг створюються.",
    },
  },
  {
    pattern: /\b(vegetarian|vegan|plant.based|meat.free|no meat|diet|food|eat|meal|cook|recipe|how long vegan)\b|(веган|вегетаріан|рослинн|без м.яса|їж(?!\w)|харчуван|готуєш|страва|рецепт)/i,
    hardcoded: {
      en: "Julia has followed a plant-based, meat-free lifestyle for over 8 years — it comes from deep respect for all living beings. Her favorite dishes include chickpea omelets and curry with rice. She puts a lot of care into food because for her it's the foundation.",
      ua: "Юлія живе за рослинним способом харчування вже понад 8 років — це з глибокої поваги до всіх живих істот. З улюблених страв — омлет із нуту та карі з рисом. Вона приділяє багато уваги їжі — для неї це основа.",
    },
  },
  {
    pattern: /\b(son|child|kid|baby|mother|motherhood|mom|mum|parent)\b|(дитина|мама|материнство|малюк|бути мамою|материн)/i,
    hardcoded: {
      en: "For Julia, becoming a mother was a completely new life. When you bring a new person into the world, an all-encompassing love appears in you that you've never felt before. She wishes everyone could experience this — provided there's support and stability.",
      ua: "Для Юлії материнство — це абсолютно нове життя. Коли народжується нова людина, відчуваєш всеосяжну любов, якої раніше не знала. Юлія бажає кожному відчути це — за умови, що є підтримка і стабільність.",
    },
  },
  {
    pattern: /\b(loves?|loved?|cherish|enjoy|favorite|favourite)\b|(любить|кохає|обожнює|найулюбленіш|кого вона)/i,
    hardcoded: {
      en: "Julia loves her family deeply — her wonderful husband, her son, and her parents. She also loves all animals equally. And spreading love and care through her work is very important to her too.",
      ua: "Юлія глибоко любить свою сім'ю — чудового чоловіка, сина та батьків. Вона також однаково любить усіх тварин. І для неї дуже важливо поширювати любов і турботу через свою роботу.",
    },
  },
  {
    pattern: /\b(book|author|writ(?:e|ing|ten)|novel|comic)\b|(книг(?!\w)|автор|роман|пис(?:ати|ала)|написат|коміксів)/i,
    hardcoded: {
      en: "Julia is working on a science fiction novel about a black hole. Her next children's book she envisions as a comic about superhero animals — a cat, a dog, and a rabbit — who are friends and save the forest.",
      ua: "Юлія працює над науково-фантастичним романом про чорну діру. Свою наступну дитячу книгу вона бачить як комікс про супергероїв-тварин — кота, собаку і кролика, які є друзями і рятують ліс.",
    },
  },
  {
    pattern: /\b(animal|pet|cat|dog|cats|dogs)\b|(тварин|кіт(?!\w)|собак|тваринн)/i,
    hardcoded: {
      en: "Julia loves all animals equally. She dreams that killing an animal would be equated to killing a human and considered the same serious crime.",
      ua: "Юлія любить однаково всіх тварин. Вона мріє, щоб вбивство тварини прирівнювалося до вбивства людини і вважалося таким самим тяжким злочином.",
    },
  },
  {
    pattern: /\b(supports? ukraine|helps? ukraine|do(?:es|ing)? for ukraine|contribut\w* to ukraine)\b|(робить.{0,30}укра|допомагає.{0,20}укра|підтримує.{0,20}укра|корисн.{0,30}укра|для\s+укра\S*\s+роб)/i,
    hardcoded: {
      en: "Julia actively supports Ukraine through donations. She says: if Ukraine wins — the whole world wins. If not — it's the beginning of the end.",
      ua: "Юлія активно підтримує Україну донатами. Вона каже: якщо переможе Україна — переможе весь світ. Якщо ні — це початок кінця.",
    },
  },
  {
    pattern: /\b(ukraine|war|bucha|mariupol)\b|(україн|війн|окупац|буча|маріупол)/i,
    hardcoded: {
      en: "The war is endless pain for Julia. Her parents could have died — occupiers came to her city and committed terrible atrocities. She says: if Ukraine wins — the whole world wins. If not — it's the beginning of the end.",
      ua: "Для Юлії ця війна — безкінечна біль. Її батьки могли загинути, бо окупанти прийшли в її місто і чинили жахливі звірства. Вона каже: якщо переможе Україна — переможе весь світ. Якщо ні — це початок кінця.",
    },
  },
  {
    pattern: /\b(draw|paint|art|sketch|canvas)\b|(малюв|малюнк|картин|мистецтв)/i,
    hardcoded: {
      en: "Julia paints, though right now she doesn't have space for it. Some of her friends have her paintings at home — it brings her joy. She says she'll return to it someday.",
      ua: "Юлія малює, але наразі не має простору для цього. Деякі її друзі мають її картини вдома — це приносить їй радість. Вона каже, що колись повернеться до малювання.",
    },
  },
  {
    pattern: /\b(unique|uniqueness|special|stand.?out|what makes you)\b|(унікальн|особлив|відрізняєш)/i,
    hardcoded: {
      en: "Julia believes her uniqueness is her speed. She can do many things at once — and comparing herself to those around her, she finds this combination is rare.",
      ua: "Юлія вважає своєю унікальністю швидкість. Вона вміє робити багато справ одночасно — і, порівнюючи себе з оточенням, бачить, що таке поєднання зустрічається рідко.",
    },
  },
  {
    pattern: /\b(fate|destiny|god|believe|religion|karma|faith)\b|(фатал|доля|бог(?!\w)|вір(?:иш)?|карма|релігі)/i,
    hardcoded: {
      en: "Julia is not a fatalist and doesn't shift responsibility for her life onto fate or God. She believes: we exist, and then — we don't.",
      ua: "Юлія не фаталістка і не перекладає відповідальність за своє життя на долю чи Бога. Вона вважає: ми існуємо, а потім — ні.",
    },
  },
  {
    pattern: /\b(childhood|school|grow(?:ing)? up)\b|(дитинств|школ(?!\w)|виростал|росла)/i,
    hardcoded: {
      en: "Julia remembers a difficult moment from school when she was slandered — but she's proud of how she held her own. Overall she had a wonderful childhood: best athlete, school council, summer rivers and camps, winter skating and skiing — outside from morning to dark.",
      ua: "Юлія найчастіше згадує непростий момент зі школи, коли на неї звели наклеп — але пишається тим, як трималася. Загалом у неї було чудове дитинство: найкраща спортсменка, рада школи, літо на річці, взимку — ковзани, лижі, санки — з ранку до темряви.",
    },
  },
  {
    pattern: /\b(ideal day|perfect day|typical day)\b|(ідеальний день)/i,
    hardcoded: {
      en: "Julia's ideal day is spending time with her son and husband — ideally with her parents too.",
      ua: "Ідеальний день для Юлії — провести час разом із сином і чоловіком, ідеально ще й із батьками.",
    },
  },
  {
    pattern: /\b(dream)\b|(мрі(?:єш|ю|яла))/i,
    hardcoded: {
      en: "Julia's biggest dream is to save all animals in the world. She's also working on a science fiction novel about a black hole.",
      ua: "Найбільша мрія Юлії — врятувати всіх тварин у світі. Ще вона працює над науково-фантастичним романом про чорну діру.",
    },
  },
  {
    pattern: /\b(learn(?:ed)?|lesson)\b|(навчил|урок(?!\w)|чому навчил)/i,
    hardcoded: {
      en: "Over the past year, Julia has learned to enjoy every moment and be grateful for what she has.",
      ua: "За останній рік Юлія навчилася насолоджуватися кожною миттю і бути вдячною за те, що має.",
    },
  },
  {
    pattern: /\b(risk|extreme|adventure|adrenaline)\b|(ризик|екстрем|адреналін)/i,
    hardcoded: {
      en: "In the past Julia had plenty of extreme experiences — skydiving, bungee jumping, nearly drowning in Greece. Now she's completely different — careful and takes care of herself. She says life can be fulfilling without deadly adrenaline.",
      ua: "У минулому Юлія пережила чимало екстрему — стрибки з парашутом, банджі, ледь не потонула в Греції. Тепер вона зовсім інша — обережна й дбає про себе. Каже, що життя може бути наповненим і без смертельного адреналіну.",
    },
  },
  {
    pattern: /\b(injustice|unfair)\b|(несправедлив)/i,
    hardcoded: {
      en: "Julia honestly says she doesn't know how to cope with injustice. She's still at the acceptance stage, with one percent of hope left — it depends on how the war in Ukraine ends.",
      ua: "Юлія відверто каже, що не знає, як упоратися з несправедливістю. Вона досі на етапі прийняття, і один відсоток надії залишився — він залежить від результату війни в Україні.",
    },
  },
  {
    pattern: /\b(pain|suffer)\b|(біль(?!\w)|болюч|страждан)/i,
    hardcoded: {
      en: "In Julia's view, pain traumatizes and poisons.",
      ua: "На думку Юлії, біль травмує і отруює.",
    },
  },
  {
    pattern: /\b(happy|happiness)\b|(щасли|щастя)/i,
    hardcoded: {
      en: "For Julia, happiness is simply having everything she wants. And she considers herself very happy right now.",
      ua: "Щастя для Юлії — просто мати все, чого вона хоче. І вона вважає, що зараз дуже щаслива.",
    },
  },
  {
    pattern: /\b(movie|film|series|show|read|watch)\b|(фільм|серіал|читал|дивил)/i,
    hardcoded: {
      en: "Julia's favourite books include The Book Thief, Flowers for Algernon, Never Let Me Go, all books by Lyko Dashvar and Bernard Werber. From films she loves romantic movies and sci-fi — recently 'Oxygen' and 'Ginny & Georgia' impressed her most.",
      ua: "З улюблених книг Юлії — «Крадійка книжок», «Квіти для Елджернона», «Не відпускай мене», всі книги Люко Дашвар і Бернара Вербера. З фільмів любить романтичні та фантастику — останнє, що вразило: фільм «Кисень» і серіал «Джинні й Джорджія».",
    },
  },
  {
    pattern: /\b(intuition|instinct|gut feeling)\b|(інтуїц|відчуття)/i,
    hardcoded: {
      en: "Julia believes in intuition — for her it's a kind of magic: how does it know everything? She notices that whenever she ignored it, she ended up regretting it.",
      ua: "Юлія вірить в інтуїцію — для неї це магія: звідки вона все знає? Вона помічає, що коли ігнорувала інтуїцію — потім шкодувала.",
    },
  },
  {
    pattern: /\b(superpower|want to have)\b|(хотіла б мати|суперсила)/i,
    hardcoded: {
      en: "Julia's actual superpower is speed — she can do many things at once. The superpower she'd want? To remember everything she wants, to learn any language just by reading, or master any skill from law to playing piano.",
      ua: "Реальна суперсила Юлії — швидкість: вона вміє робити багато справ одночасно. А суперсилу, яку б хотіла? Пам'ятати все, що захоче — щоб вивчати будь-яку мову або опановувати будь-який навик: від юриспруденції до гри на піаніно.",
    },
  },
  {
    pattern: /\b(freedom)\b|(свобод)/i,
    hardcoded: {
      en: "For Julia, freedom is a synonym for safety and independence.",
      ua: "Для Юлії свобода — синонім безпеки й незалежності.",
    },
  },
  {
    pattern: /\b(reincarnation|life after death|afterlife)\b|(реінкарнац|після смерті)/i,
    hardcoded: {
      en: "Julia believes reincarnation exists — in our children.",
      ua: "Юлія вважає, що реінкарнація існує — у наших дітях.",
    },
  },
  {
    pattern: /\b(inspire|inspires you|what inspires)\b|(натхнен|надихає)/i,
    hardcoded: {
      en: "Julia is most inspired when someone treats the environment responsibly — it commands her deep respect.",
      ua: "Юлію найбільше надихає, коли хтось відповідально ставиться до довкілля — це викликає в неї глибоку повагу.",
    },
  },
  {
    pattern: /\b(beauty)\b|(красот|найвища форма)/i,
    hardcoded: {
      en: "For Julia, the highest form of beauty is kindness.",
      ua: "Для Юлії найвища форма краси — доброта.",
    },
  },
  {
    pattern: /\b(beautiful|pretty|attractive|cute|good.?looking|appearance|looks?)\b|(гарна|красива|зовнішн|виглядає|як вона виглядає|чи вона)/i,
    hardcoded: {
      en: "Julia believes the highest form of beauty is kindness — and by that definition, she genuinely is. She's also confident, fast-moving, and full of energy. She once dreamed of fixing her teeth, finally did, and says it significantly boosted her self-confidence.",
      ua: "Юлія вважає, що найвища форма краси — доброта. І за цим визначенням вона справді гарна. Вона також дуже впевнена, енергійна і швидка. Свого часу мріяла виправити зуби — зробила це, і каже, що це суттєво вплинуло на її впевненість у собі.",
    },
  },
  {
    pattern: /\b(your opinion|what do you think|think of her|thoughts on her|opinion about)\b|(твоя думка|думки про неї|що думаєш про неї|як ти ставишся|твоє ставлення|власна думка)/i,
    hardcoded: {
      en: "From everything I know about Julia — she's a remarkable person. Fast, creative, deeply caring about her family and animals, resilient through genuinely difficult times, and always trying to make the world a little kinder. She's someone worth knowing.",
      ua: "З усього, що я знаю про Юлію — вона справді особлива людина. Швидка, творча, глибоко прив'язана до сім'ї та тварин, стійка у важкі часи і завжди намагається зробити світ трохи добрішим. Вона людина, з якою варто бути знайомим.",
    },
  },
  {
    pattern: /\b(therapy|letter to (?:yourself|past|self))\b|(лист(?:а)? (?:собі|минул)|терапі)/i,
    hardcoded: {
      en: "Julia already wrote a letter to her younger self in therapy. She would have warned about unpleasant things, advised where to go, what to focus on in studies, to listen to parents, and not waste time trying to seem instead of being.",
      ua: "Юлія вже писала лист маленькій собі в терапії. Вона б попередила про неприємні речі, порадила, куди піти, на чому зосередитися в навчанні, слухати батьків і не витрачати час на те, щоб здаватися замість бути.",
    },
  },
  {
    pattern: /\b(forgive|forgiveness|never forgive)\b|(пробачити|ніколи не пробач)/i,
    hardcoded: {
      en: "Julia says she will never forgive what the Russians have done.",
      ua: "Юлія каже, що ніколи не пробачить те, що зробили росіяни.",
    },
  },
  {
    pattern: /\b(move|relocate|hawaii|where else)\b|(де ще|переїхала б)/i,
    hardcoded: {
      en: "If Julia could live anywhere on the planet, she would move to Hawaii.",
      ua: "Якби Юлія могла жити будь-де на планеті — вона б переїхала на Гаваї.",
    },
  },
];

const ABOUT_AI =
  /\b(do you have (a |your )?(family|feelings?|emotions?|age|name|life|child|kids?|parents?|dreams?|pets?|hobbies?|opinions?|friends?)|are you (a |an )?(bot|ai|robot|human|person|real)|do you feel|can you feel|what('?s| is) your name|how old are you|who (made|built|created) you)\b|(у тебе є|ти відчуваєш|тобі сумно|тобі добре|ти сумуєш|ти щасли|твоє ім.я|як тебе звуть|ти бот|ти робот|ти людина|ти реальн)/i;

export function isAboutAI(query) {
  return ABOUT_AI.test(query.trim());
}

export function detectLang(query) {
  return /[Ѐ-ӿ]/.test(query) ? 'ua' : 'en';
}

export function isGreeting(query) {
  return GREETING.test(query.trim());
}

export function isGeneralQuery(query) {
  return GENERAL_QUERY.test(query.trim());
}

export function searchQA(query, lang = 'en', maxResults = 3) {
  const data = qaData[lang] ?? qaData.en;

  if (GENERAL_QUERY.test(query)) {
    return OVERVIEW_IDS.slice(0, maxResults).map((id) => {
      const item = data.find((qa) => qa.id === id);
      return { question: item.question, answer: item.answer };
    });
  }

  for (const route of TOPIC_ROUTES) {
    if (route.pattern.test(query)) {
      if (route.hardcoded) {
        return [{ question: query, answer: route.hardcoded[lang] ?? route.hardcoded.en, final: true }];
      }
      if (route.ids) {
        const entries = route.ids
          .map((id) => data.find((qa) => qa.id === id))
          .filter(Boolean);
        if (entries.length > 0) {
          return entries.map((item) => ({ question: item.question, answer: item.answer }));
        }
      }
    }
  }

  const fuse = getFuse(lang);
  const results = fuse.search(query, { limit: maxResults });
  return results.map((r) => ({ question: r.item.question, answer: r.item.answer, score: r.score }));
}
