// =====================================================================
// CONTENT — everything here comes from the Grade 2 (202) midterm scope:
// spelling words + weekly sentences L1–7, phonics skills, grammar topics,
// reading terms, and the math topics. Context sentences, clues, grammar
// items, mini-stories and math problems are written to match those topics.
// =====================================================================

// v: s = short vowel, l = long vowel (magic e) · vl = the vowel letter
// ib = blend at the start · fb = Lesson 7 blend at the end
const SPELLING = [
  // Lesson 1 — short a, i
  {w:'dig',  L:1, v:'s', vl:'i', ctx:'The dog likes to dig in the sand.', clue:'to make a hole in the ground', pic:'🐕 🕳️'},
  {w:'list', L:1, v:'s', vl:'i', ctx:'Mom made a list for the store.', clue:'words written one under another', pic:'🗒️ 🛒'},
  {w:'fix',  L:1, v:'s', vl:'i', ctx:'Dad can fix my bike.', clue:'to make something work again', pic:'🔧 🚲'},
  {w:'mask', L:1, v:'s', vl:'a', ctx:'I wear a mask on my face.', clue:'you wear it over your face', pic:'🎭'},
  {w:'flat', L:1, v:'s', vl:'a', ib:'fl', ctx:'My bike tire is flat.', clue:'smooth and not bumpy, like paper', pic:'🛞'},
  {w:'rip',  L:1, v:'s', vl:'i', ctx:'Do not rip the paper.', clue:'to tear something', pic:'📄 ✂️'},
  {w:'glad', L:1, v:'s', vl:'a', ib:'gl', ctx:'I am glad to see you.', clue:'happy', pic:'😊'},
  {w:'sad',  L:1, v:'s', vl:'a', ctx:'The boy is sad.', clue:'not happy', pic:'😢'},
  {w:'jam',  L:1, v:'s', vl:'a', ctx:'I like jam on my bread.', clue:'sweet fruit you spread on bread', pic:'🍓 🍞'},
  {w:'win',  L:1, v:'s', vl:'i', ctx:'We win the game!', clue:'to come first in a game', pic:'🏆'},
  // Lesson 2 — short e, o, u
  {w:'help', L:2, v:'s', vl:'e', ctx:'Can you help me?', clue:'to make a job easier for someone', pic:'🤝'},
  {w:'mud',  L:2, v:'s', vl:'u', ctx:'The pig plays in the mud.', clue:'wet, soft dirt', pic:'🐷 🟤'},
  {w:'hug',  L:2, v:'s', vl:'u', ctx:'I hug my mom.', clue:'to hold someone close with your arms', pic:'🫂'},
  {w:'net',  L:2, v:'s', vl:'e', ctx:'The fish is in the net.', clue:'a bag of string with holes in it', pic:'🐟 🥅'},
  {w:'hot',  L:2, v:'s', vl:'o', ctx:'The soup is hot.', clue:'very, very warm', pic:'🍲 🔥'},
  {w:'plum', L:2, v:'s', vl:'u', ib:'pl', ctx:'A plum is a purple fruit.', clue:'a small purple fruit', pic:'🟣 🍑'},
  {w:'job',  L:2, v:'s', vl:'o', ctx:'My job is to feed the cat.', clue:'work that you do', pic:'🐈 🥣'},
  {w:'rest', L:2, v:'s', vl:'e', ctx:'I rest after school.', clue:'to stop and relax', pic:'🛋️ 😌'},
  {w:'left', L:2, v:'s', vl:'e', fb:'ft', ctx:'Turn left at the park.', clue:'the side that is not right', pic:'⬅️'},
  {w:'spot', L:2, v:'s', vl:'o', ib:'sp', ctx:'The dog has a black spot.', clue:'a small round mark', pic:'🐕 ⚫'},
  // Lesson 3 — long a, i
  {w:'ate',   L:3, v:'l', vl:'a', ctx:'I ate my lunch.', clue:'had food (eat, but yesterday)', pic:'😋 🍽️'},
  {w:'prize', L:3, v:'l', vl:'i', ib:'pr', ctx:'She won a prize.', clue:'something you get for winning', pic:'🏅 🎁'},
  {w:'grape', L:3, v:'l', vl:'a', ib:'gr', ctx:'A grape is small and green.', clue:'a small round fruit that grows in bunches', pic:'🍇'},
  {w:'race',  L:3, v:'l', vl:'a', ctx:'We run a race.', clue:'a game to see who is fastest', pic:'🏃 🏁'},
  {w:'mine',  L:3, v:'l', vl:'i', ctx:'This pencil is mine.', clue:'it belongs to me', pic:'🙋 ✏️'},
  {w:'rake',  L:3, v:'l', vl:'a', ctx:'Dad uses a rake for the leaves.', clue:'a garden tool for leaves', pic:'🍂 🧹'},
  {w:'pile',  L:3, v:'l', vl:'i', ctx:'There is a pile of books.', clue:'many things on top of each other', pic:'📚'},
  {w:'size',  L:3, v:'l', vl:'i', ctx:'What size is your shoe?', clue:'how big or small something is', pic:'👟 📏'},
  {w:'plate', L:3, v:'l', vl:'a', ib:'pl', ctx:'Put the cake on a plate.', clue:'a flat dish for food', pic:'🍰 🍽️'},
  {w:'wipe',  L:3, v:'l', vl:'i', ctx:'Wipe the table, please.', clue:'to clean with a cloth', pic:'🧽'},
  // Lesson 4 — long o, u
  {w:'close', L:4, v:'l', vl:'o', ib:'cl', ctx:'Please close the door.', clue:'to shut', pic:'🚪'},
  {w:'rode',  L:4, v:'l', vl:'o', ctx:'I rode my bike to the park.', clue:'went on a bike or horse (ride, but yesterday)', pic:'🚲'},
  {w:'cute',  L:4, v:'l', vl:'u', ctx:'The puppy is so cute.', clue:'sweet and nice to look at', pic:'🐶'},
  {w:'role',  L:4, v:'l', vl:'o', ctx:'I play the role of a king.', clue:'the part you play in a show', pic:'🤴 🎭'},
  {w:'doze',  L:4, v:'l', vl:'o', ctx:'Grandpa likes to doze in his chair.', clue:'to sleep a little bit', pic:'😴 💤'},
  {w:'rose',  L:4, v:'l', vl:'o', ctx:'A rose is a red flower.', clue:'a flower, often red', pic:'🌹'},
  {w:'mule',  L:4, v:'l', vl:'u', ctx:'The mule carries a heavy bag.', clue:'an animal like a horse with long ears', pic:'🫏'},
  {w:'tune',  L:4, v:'l', vl:'u', ctx:'Sing a happy tune.', clue:'the music of a song', pic:'🎵'},
  {w:'pole',  L:4, v:'l', vl:'o', ctx:'The flag is on a pole.', clue:'a long stick', pic:'🚩'},
  {w:'woke',  L:4, v:'l', vl:'o', ctx:'I woke up at seven.', clue:'stopped sleeping (wake, but yesterday)', pic:'⏰ 🥱'},
  // Lesson 6 — blends with r, l, s
  {w:'clap',  L:6, v:'s', vl:'a', ib:'cl', ctx:'Clap your hands!', clue:'to hit your hands together', pic:'👏'},
  {w:'drag',  L:6, v:'s', vl:'a', ib:'dr', ctx:'Do not drag your bag on the floor.', clue:'to pull something along the ground', pic:'🧳'},
  {w:'glide', L:6, v:'l', vl:'i', ib:'gl', ctx:'The bird can glide in the sky.', clue:'to move smoothly and quietly', pic:'🕊️'},
  {w:'grade', L:6, v:'l', vl:'a', ib:'gr', ctx:'We are in second grade.', clue:'a year in school', pic:'🏫'},
  {w:'last',  L:6, v:'s', vl:'a', ctx:'Z is the last letter.', clue:'at the very end', pic:'🔚'},
  {w:'place', L:6, v:'l', vl:'a', ib:'pl', ctx:'This is a nice place to play.', clue:'a spot or area', pic:'📍'},
  {w:'skin',  L:6, v:'s', vl:'i', ib:'sk', ctx:'The sun is hot on my skin.', clue:'the outside of your body', pic:'✋ ☀️'},
  {w:'stage', L:6, v:'l', vl:'a', ib:'st', ctx:'We sing on the stage.', clue:'where people sing or act in a show', pic:'🎤 🎭'},
  {w:'swim',  L:6, v:'s', vl:'i', ib:'sw', ctx:'Fish can swim.', clue:'to move in water', pic:'🏊'},
  {w:'test',  L:6, v:'s', vl:'e', ctx:'We have a spelling test.', clue:'questions to show what you know', pic:'📝 ✏️'},
  // Lesson 7 — final blends nd, ng, nk, nt, ft, xt, mp
  {w:'bring', L:7, v:'s', vl:'i', ib:'br', fb:'ng', ctx:'Please bring your book.', clue:'to carry something with you', pic:'🎒'},
  {w:'next',  L:7, v:'s', vl:'e', fb:'xt', ctx:'Who is next in line?', clue:'the one right after this', pic:'🧍 ➡️'},
  {w:'camp',  L:7, v:'s', vl:'a', fb:'mp', ctx:'We camp in a tent.', clue:'to sleep outside in a tent', pic:'🏕️'},
  {w:'pond',  L:7, v:'s', vl:'o', fb:'nd', ctx:'Ducks swim in the pond.', clue:'a small lake', pic:'🦆 💧'},
  {w:'drink', L:7, v:'s', vl:'i', ib:'dr', fb:'nk', ctx:'I drink milk.', clue:'to swallow water or milk', pic:'🥛'},
  {w:'sank',  L:7, v:'s', vl:'a', fb:'nk', ctx:'The boat sank in the water.', clue:'went down under the water', pic:'⛵ 🌊'},
  {w:'hunt',  L:7, v:'s', vl:'u', fb:'nt', ctx:'Cats hunt mice.', clue:'to look for and chase', pic:'🐈 🐁'},
  {w:'stamp', L:7, v:'s', vl:'a', ib:'st', fb:'mp', ctx:'Put a stamp on the letter.', clue:'a small sticker you put on a letter', pic:'✉️'},
  {w:'long',  L:7, v:'s', vl:'o', fb:'ng', ctx:'The snake is long.', clue:'not short', pic:'🐍'},
  {w:'stand', L:7, v:'s', vl:'a', ib:'st', fb:'nd', ctx:'Please stand up.', clue:'to be up on your feet', pic:'🧍'},
];
// Lesson 5 reviews ten earlier words
const LESSON5 = ['close','plum','doze','prize','help','race','list','spot','mask','tune'];
const LESSON_SOUNDS = {1:'Short a, i',2:'Short e, o, u',3:'Long a, i',4:'Long o, u',5:'Short & long vowels',6:'Blends with r, l, s',7:'Final blends'};
function wordsOfLesson(L){ return L===5 ? LESSON5.map(w=>SPELLING.find(s=>s.w===w)) : SPELLING.filter(s=>s.L===L); }

// Weekly sentences — b = the bold word
const SENTENCES = [
  {L:1, t:'The frogs are jumping around.', b:'are'},
  {L:1, t:'I buy eggs at the store.', b:'buy'},
  {L:1, t:'I like to eat pizza.', b:'eat'},
  {L:1, t:'We sing a fun song.', b:'sing'},
  {L:1, t:'We wash our hands with soap.', b:'wash'},
  {L:2, t:'What is your chore at home?', b:'chore'},
  {L:2, t:'I clean my messy room.', b:'clean'},
  {L:2, t:'I fold my clean clothes.', b:'fold'},
  {L:2, t:'Please grab your backpack.', b:'grab'},
  {L:2, t:'I wash my hands with soap.', b:'soap'},
  {L:3, t:'Did you see that big elephant?', b:'big'},
  {L:3, t:'My cat feels very soft.', b:'feels'},
  {L:3, t:'I give a toy to my friend.', b:'give'},
  {L:3, t:'I fell down and hurt my knee.', b:'hurt'},
  {L:3, t:'We learn English in school.', b:'learn'},
  {L:4, t:'The children play at the park.', b:'children'},
  {L:4, t:'Please clean up your mess.', b:'mess'},
  {L:4, t:'Your mom and dad are parents.', b:'parents'},
  {L:4, t:'Pass the pencil to your friend.', b:'Pass'},
  {L:4, t:'I eat a snack after school.', b:'snack'},
  {L:5, t:'He does his homework every day.', b:'does'},
  {L:5, t:'I have five fish in my fish tank.', b:'five'},
  {L:5, t:'My family lives in a big house.', b:'house'},
  {L:5, t:'I have my own pencil case.', b:'own'},
  {L:5, t:"Yellow is my dad's favorite color.", b:'Yellow'},
  {L:6, t:'This apartment has five floors.', b:'apartment'},
  {L:6, t:'My books are on my desk.', b:'desk'},
  {L:6, t:'My pet is a happy dog.', b:'pet'},
  {L:6, t:'Some people live in a townhouse.', b:'townhouse'},
  {L:6, t:'Grandma knits with soft yarn.', b:'yarn'},
  {L:7, t:'The tired baby sleeps in a crib.', b:'baby'},
  {L:7, t:'They laughed at the funny joke.', b:'funny'},
  {L:7, t:'Ms. Smith is a grown-up.', b:'grown-up'},
  {L:7, t:'A feather is very light.', b:'light'},
  {L:7, t:'We are in second grade this year.', b:'year'},
];
SENTENCES.forEach((s,i)=>s.id='s'+i);


// VOCAB words (Lessons 4–7 printouts). Tested for MEANING only, with pictures.
const VOCAB = [
  {w:'children', L:4, pic:'🧒 👧', s:'s15'}, {w:'mess', L:4, pic:'🧦 🧸', s:'s16'}, {w:'parents', L:4, pic:'👨‍👩‍👧', s:'s17'}, {w:'pass', L:4, pic:'🤲 ✏️', s:'s18'}, {w:'snack', L:4, pic:'🍪', s:'s19'},
  {w:'five', L:5, pic:'🖐️', s:'s21'}, {w:'house', L:5, pic:'🏠', s:'s22'}, {w:'own', L:5, pic:'🙋 🎒', s:'s23'}, {w:'yellow', L:5, pic:'🟡 🍌', s:'s24'},
  {w:'apartment', L:6, pic:'🏢', s:'s25'}, {w:'desk', L:6, pic:'📚 🪑', s:'s26'}, {w:'pet', L:6, pic:'🐕 🏠', s:'s27'}, {w:'townhouse', L:6, pic:'🏘️', s:'s28'}, {w:'yarn', L:6, pic:'🧶', s:'s29'},
  {w:'baby', L:7, pic:'👶', s:'s30'}, {w:'funny', L:7, pic:'😂', s:'s31'}, {w:'grown-up', L:7, pic:'🧑‍💼', s:'s32'}, {w:'light', L:7, pic:'🪶', s:'s33'}, {w:'year', L:7, pic:'📅', s:'s34'},
];

// Meanings for the bold words (Library). "are" and "does" are helper words, so they stay out.
const BOLD_MEANINGS = {
  buy:['to get something with money','🛒'], eat:['to put food in your mouth','🍕'], sing:['to make music with your voice','🎶'],
  wash:['to clean with water','🚿'], chore:['a small job at home','🧹'], clean:['not dirty','✨'], fold:['to bend paper or cloth over','👕'],
  grab:['to take quickly with your hand','✊'], soap:['you wash your hands with it','🫧'], big:['very large','🐘'],
  feels:['how something seems when you touch it','🐈'], give:['to let someone have something','🎁'], hurt:['to feel pain','🤕'],
  learn:['to find out new things','🧠'], children:['more than one child','🧒'], mess:['things all over the place, not tidy','🗑️'],
  parents:['a mom and a dad','👨‍👩‍👧'], pass:['to hand something to the next person','🤲'], snack:['a little food between meals','🍪'],
  five:['the number 5','✋'], house:['a building where a family lives','🏠'], own:['just for you, not shared','🔑'],
  yellow:['the color of a banana','🍌'], apartment:['a home in a tall building with many floors','🏢'],
  desk:['a table where you write and study','🪑'], pet:['an animal that lives with you','🐕'],
  townhouse:['a house joined to other houses in a row','🏘️'], yarn:['soft thread for knitting','🧶'], baby:['a very young child','👶'],
  funny:['it makes you laugh','😂'], 'grown-up':['an adult, not a child','🧑'], light:['not heavy','🪶'], year:['twelve months','📅'],
};
// Pairs too close in meaning to share one memory board
const CONFUSABLE = [['mine','own'],['give','pass'],['wash','clean'],['wash','soap'],['wipe','clean'],['big','long'],['glad','funny'],['dig','rake'],['eat','ate'],['rest','doze'],['help','fix'],['parents','grown-up'],['baby','children'],['jam','plum'],['grape','plum'],['soap','wipe']];

// ---------------- GRAMMAR (one machine per lesson topic) ----------------
const GRAMMAR = {
  1:{ name:'Sentence Stamper', topic:'Statements, questions and commands',
      help:'Tells? Asks? Or tells you to do it?',
      items:[
        ['We are in second grade','S'],['Are you tired','Q'],['Close the door','C'],['Please clean your room','C'],
        ['My cat feels very soft','S'],['Do you like jam','Q'],["Don't run in the classroom",'C'],['Where is my pencil','Q'],
        ['The baby sleeps in a crib','S'],['Wash your hands','C'],['Can you swim','Q'],['I have a pet dog','S'],
        ['What is your chore at home','Q'],['Pass the pencil to your friend','C'],['The soup is hot','S'],['Bring your book','C'],
      ]},
  2:{ name:'Not Lever', topic:'The verb be: positive and negative',
      help:'I am. He is. We are.',
      items:[
        {k:'be', t:'I ___ glad.', a:'am'}, {k:'be', t:'She ___ my sister.', a:'is'}, {k:'be', t:'They ___ children.', a:'are'},
        {k:'be', t:'We ___ in second grade.', a:'are'}, {k:'be', t:'The soup ___ hot.', a:'is'}, {k:'be', t:'You ___ my friend.', a:'are'},
        {k:'be', t:'It ___ a cute pet.', a:'is'}, {k:'be', t:'My parents ___ at home.', a:'are'}, {k:'be', t:'I ___ in my room.', a:'am'},
        {k:'be', t:'The plate ___ flat.', a:'is'},
        {k:'not', t:'He is a doctor.'}, {k:'not', t:'We are tired.'}, {k:'not', t:'I am sad.'}, {k:'not', t:'They are at the pond.'},
        {k:'not', t:'It is hot.'}, {k:'not', t:'She is in the kitchen.'}, {k:'not', t:'You are late.'}, {k:'not', t:'The pond is big.'},
      ]},
  3:{ name:'Question Flipper', topic:'The verb be: yes/no questions',
      help:'Move am, is, are to the front!',
      items:[
        {k:'flip', t:'She is a nurse.'}, {k:'flip', t:'They are at the park.'}, {k:'flip', t:'He is in second grade.'},
        {k:'flip', t:'It is your desk.'}, {k:'flip', t:'You are glad.'}, {k:'flip', t:'The baby is tired.'},
        {k:'flip', t:'We are late.'}, {k:'flip', t:'The plums are on the plate.'},
        {k:'ans', q:'Is he your dad?', a:'Yes, he is.', o:['Yes, he are.','Yes, he am.']},
        {k:'ans', q:'Are they children?', a:'Yes, they are.', o:['Yes, they is.','Yes, they am.']},
        {k:'ans', q:'Are you sad?', a:'No, I am not.', o:['No, I is not.','No, I are not.']},
        {k:'ans', q:'Is it a pet?', a:'No, it is not.', o:['No, it are not.','No, it am not.']},
        {k:'ans', q:'Is the soup hot?', a:'Yes, it is.', o:['Yes, it are.','Yes, it am.']},
        {k:'ans', q:'Are we in second grade?', a:'Yes, we are.', o:['Yes, we is.','Yes, we am.']},
      ]},
  4:{ name:'Copy Machine', topic:'Singular and plural nouns',
      help:'cat → cats. box → boxes. child → children.',
      items:[
        ['cat','cats',['cates','cat']],['plum','plums',['plumes','plum']],['box','boxes',['boxs','boxies']],['bus','buses',['buss','busies']],
        ['dish','dishes',['dishs','dishies']],['baby','babies',['babys','babyes']],['cherry','cherries',['cherrys','cherryes']],
        ['child','children',['childs','childes']],['man','men',['mans','manes']],['foot','feet',['foots','footes']],
        ['tooth','teeth',['tooths','toothes']],['mouse','mice',['mouses','mousies']],['fish','fish',['fishs','fishies']],
        ['grape','grapes',['grapies','grape']],['desk','desks',['deskes','desk']],['bench','benches',['benchs','benchies']],
        ['pet','pets',['petes','pet']],['plate','plates',['platies','plate']],
      ]},
  5:{ name:'Sorting Jars', topic:'Count and non-count nouns',
      help:'Can you count it? one egg, two eggs!',
      items:[
        ['apple','C','🍎'],['egg','C','🥚'],['pencil','C','✏️'],['book','C','📘'],['plum','C','🟣'],['grape','C','🍇'],
        ['desk','C','🪑'],['cat','C','🐈'],['plate','C','🍽️'],['house','C','🏠'],['toy','C','🧸'],['frog','C','🐸'],
        ['water','N','💧'],['milk','N','🥛'],['juice','N','🧃'],['rice','N','🍚'],['bread','N','🍞'],['sugar','N','🧂'],
        ['soap','N','🫧'],['yarn','N','🧶'],['sand','N','🏖️'],['mud','N','🟤'],['jam','N','🍓'],['homework','N','📒'],
      ]},
  6:{ name:'Label Maker', topic:'Articles: a, an, the',
      help:'a desk. an egg. the sun.',
      items:[
        ['I have ___ pet.','a'],['This is ___ apartment.','an'],['I see ___ elephant.','an'],['She eats ___ egg.','an'],
        ['He lives in ___ townhouse.','a'],['I need ___ umbrella.','an'],['Look at ___ sun!','the'],['___ moon is bright tonight.','The'],
        ['I have ___ orange.','an'],['This is ___ desk.','a'],['There is ___ owl in the tree.','an'],['___ sky is blue.','The'],
        ['He has ___ plum.','a'],['I want ___ ice cream.','an'],['She rode ___ mule.','a'],['We camp in ___ tent.','a'],
      ]},
  7:{ name:'Some-or-Any Scale', topic:'Adjectives of quantity: some and any',
      help:'some = telling. any = asking or not.',
      items:[
        ['I have ___ milk.','some'],['Do you have ___ jam?','any'],["I don't have ___ pets.",'any'],['There are ___ plums on the plate.','some'],
        ['Are there ___ grapes?','any'],['We have ___ yarn.','some'],["She doesn't have ___ soap.",'any'],['Is there ___ juice?','any'],
        ['I want ___ water.','some'],["There aren't ___ eggs.",'any'],['He has ___ toys.','some'],["We don't have ___ homework.",'any'],
        ['Mom buys ___ bread.','some'],['Are there ___ frogs in the pond?','any'],
      ]},
};

// ---------------- DETECTIVE (reading terms) ----------------
// [c:...] character, [s:...] setting
const STORIES = [
  {title:'The Lost Mask', author:'Kim Chen', color:'#EF5B4C', text:'[c:Mia] and her dog [c:Spot] play [s:at the pond]. Mia\'s mask falls in the mud! Spot digs and digs. He finds it! Mia is glad. She gives Spot a big hug.'},
  {title:'A Funny Night at Camp', author:'Ben Ross', color:'#3E9B5C', text:'[c:Tom] and [c:Grandpa] camp [s:in the woods]. Grandpa tells a funny joke. Tom laughs and laughs. At night, they sing a happy tune by the fire.'},
  {title:'Sam Wins the Race', author:'Lily Wang', color:'#FFC94A', text:'[c:Sam] the mule likes to race. Today the race is [s:at the farm]. Sam runs and runs. He wins a prize! It is a big pile of grapes.'},
  {title:'The Yellow Yarn', author:'Amy Park', color:'#7A5BA6', text:'[c:Grandma] knits with yellow yarn [s:in her apartment]. Her cat [c:Bo] grabs the yarn and runs! Now there is a big mess. Grandma and Bo clean it up.'},
  {title:'Swim Day', author:'Leo Lin', color:'#3B8FC4', text:'It is a hot day. [c:Ana] and her [c:dad] go [s:to the pool]. Ana can swim fast. Dad claps his hands. Then they drink cold juice.'},
  {title:'The Class Show', author:'Sue Ho', color:'#E8833A', text:'[c:Max] and [c:Jen] are in second grade. They sing on the stage [s:at school]. Max plays the role of a king. All the parents clap!'},
  {title:'The Baby Bird', author:'Nina Wu', color:'#4CA7A0', text:'A [c:baby bird] sits in a nest [s:by Lucy\'s house]. It is very light. [c:Lucy] gives it a little drink. The next day, the bird can glide!'},
];
const TERMS = [
  {term:'title', def:'the name of the story'},
  {term:'author', def:'the person who wrote the story'},
  {term:'character', def:'a person or animal in the story'},
  {term:'setting', def:'where and when the story happens'},
];


// Comprehension questions for the Detective's stories: [question, answer, wrong, wrong]
const STORY_QS = {
  'The Lost Mask': [['What fell in the mud?', 'the mask', 'the dog', 'the pond'], ['Who found the mask?', 'Spot', 'Mia', 'Mom'], ['How does Mia feel at the end?', 'glad', 'sad', 'tired'], ['What does Mia give Spot?', 'a big hug', 'a snack', 'a mask']],
  'A Funny Night at Camp': [['Who tells a funny joke?', 'Grandpa', 'Tom', 'Mom'], ['Where do they camp?', 'in the woods', 'at school', 'in a house'], ['What do they do at night?', 'sing by the fire', 'swim in the pond', 'go to the store']],
  'Sam Wins the Race': [['What kind of animal is Sam?', 'a mule', 'a dog', 'a frog'], ['What does Sam win?', 'a pile of grapes', 'a big plum', 'a red rose'], ['Where is the race?', 'at the farm', 'at the pond', 'at school']],
  'The Yellow Yarn': [['What does Grandma knit with?', 'yellow yarn', 'red jam', 'a stamp'], ['Who grabs the yarn?', 'Bo the cat', 'Grandma', 'a baby'], ['What happens at the end?', 'They clean up the mess', 'They go to camp', 'Bo wins a prize']],
  'Swim Day': [['What is the weather like?', 'hot', 'cold', 'rainy'], ['Who claps his hands?', 'Dad', 'Ana', 'a dog'], ['What do they drink?', 'cold juice', 'hot soup', 'milk']],
  'The Class Show': [['Where do Max and Jen sing?', 'on the stage', 'at the pond', 'in a tent'], ['What role does Max play?', 'a king', 'a mule', 'a doctor'], ['Who claps at the end?', 'the parents', 'the frogs', 'Grandpa']],
  'The Baby Bird': [['Where is the nest?', "by Lucy's house", 'at the farm', 'in the pond'], ['What does Lucy give the bird?', 'a little drink', 'some yarn', 'a stamp'], ['What can the bird do the next day?', 'glide', 'swim', 'sing on a stage']],
};

export { VOCAB, STORY_QS, SPELLING, LESSON5, LESSON_SOUNDS, wordsOfLesson, SENTENCES, BOLD_MEANINGS, CONFUSABLE, GRAMMAR, STORIES, TERMS };
