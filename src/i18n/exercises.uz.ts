import type { ExerciseDictionary } from './types';

export const exercisesUz: ExerciseDictionary = {
  'warmup.circles': "Bo'g'imlarni yuqoridan pastga aylantirish",
  'warmup.squats': "Og'irliksiz cho'kkalash",
  'warmup.lunges': 'Har bir oyoqqa oldinga qadam',
  'warmup.bridges': "Dumba ko'prigi",
  'warmup.hang': "Yelkalar bo'shashgan holda turnikda osilish",
  'warmup.wrists': 'Bilaklarni aylantirish va barmoqlarni siqish',

  'workout.warmup': 'Isinish',
  'workout.warmup.hint':
    "Isinishni o'tkazib bo'lmaydi: «keyingisi» tugmasi taymer tugagach ochiladi. Tartib yuqoridan pastga — bo'yin, yelka, tirsak, bilak, tos, tizza, oyoq panjasi.",
  'workout.mon': 'Sakrash va oyoqlar',
  'workout.tue': 'Turnik va yugurish',
  'workout.wed': "Qo'l bukish va qorin mushaklari",
  'workout.thu': 'Turnik va sayr',
  'workout.fri': "Cho'zilish va yurish",
  'workout.sat': "O'lchovlar va doiraviy mashq",
  'workout.sun': 'Tiklanish',
  'workout.level.beginner': 'Daraja: beshtadan kam tortilish',
  'workout.level.intermediate': "Daraja: beshtadan to'qqiztagacha tortilish",
  'workout.level.advanced': "Daraja: o'nta va undan ko'p",
  'workout.note.deload':
    'Yengillashtirilgan hafta: hajm 40 foizga qisqardi. Bu rejaning bir qismi, yon berish emas.',
  'workout.note.deloadSoon':
    'Yengillashtirilgan hafta {days} kundan keyin boshlanadi: hajm 40 foizga tushadi.',
  'workout.note.reduced':
    'Yuklama 10 foizga kamaytirildi. Kamaygan mashqlar soni: {count}. Sabab — ketma-ket ikkita bajarilmagan yondashuv.',
  'workout.note.landings':
    "Shu hafta qo'nishlar: {done}, bugun {planned} rejalashtirilgan, chegara {budget}. Sakrash qismini qisqartirgan ma'qul.",

  'safety.arm':
    "Armrestling: murabbiysiz va to'liq isinishsiz stol ortida maksimal kurash yo'q — tirsak va yelka jarohati aynan isinmagan qo'l bilan keskin kuch berishda bo'ladi. Bu yerda faqat izometriya va panja ustida ish.",
  'safety.plyo':
    "Sakrash: tizza bukilgan holda butun tovon bilan yumshoq qo'nish, faqat qattiq bo'lmagan yuzada. Tizza og'risa, sakrab cho'kkalash oddiy cho'kkalashga almashtiriladi.",
  'safety.pain':
    "Keskin og'riq — yondashuvni to'xtatish. «O'tkazib yuborish» ni bosing: mashq jurnalda belgilanadi.",

  'ex.jumpSquats': "Sakrab cho'kkalash",
  'ex.jumpSquats.hint':
    "Tizzalar oyoq panjasi chizig'i bo'ylab boradi, qo'nish yumshoq — panjadan tovonga. Sakrash balandligi tusha boshlasa, yondashuv tugadi.",
  'ex.tuckJumps': "Tizzalarni ko'krakka tortib sakrash",
  'ex.tuckJumps.hint':
    "Tizza ko'krakka tortiladi, ko'krak tizzaga emas. Bel tik, qo'nish yarim cho'kkalashga.",
  'ex.bulgarianSplit': 'Bolgar qadamlari, orqa oyoq stulda',
  'ex.bulgarianSplit.hint':
    "Og'irlik oldingi tovonda, tizza panjadan oshib ketmaydi. Tana biroz oldinga — shunda dumba ko'proq ishlaydi.",
  'ex.calfRaises': "Panja uchida ko'tarilish",
  'ex.calfRaises.hint':
    "To'liq amplituda: pastda cho'zilish, tepada bir soniya pauza. Tana bilan tebranmang.",
  'ex.plank': 'Planka',
  'ex.plank.hint':
    "Tos ichkariga burilgan, belda egilish yo'q. Tos pastga cho'ka boshlasa, yondashuv tugadi — chidashning ma'nosi yo'q.",

  'ex.australianPullups': 'Avstraliyacha tortilish',
  'ex.australianPullups.hint':
    "Tana tovondan boshgacha bir chiziq, ko'krak turnik yoki stol chetiga tegadi. Turnik qancha past bo'lsa, shuncha og'ir.",
  'ex.negativePullups': 'Negativ tortilish',
  'ex.negativePullups.hint':
    'Yuqori nuqtaga chiqib, besh soniya nazorat bilan pastga tushish. Aynan ekssentrika birinchi toza takrorgacha tez olib boradi.',
  'ex.scapularPullups': 'Kurak tortilishlari',
  'ex.scapularPullups.hint':
    "Qo'llar tik qoladi, faqat kuraklar ishlaydi: pastga tushirib, qaytarish. Harakat qisqa, 5–10 santimetr.",
  'ex.deadHang': "Tik qo'llarda osilish",
  'ex.deadHang.hint':
    "Yelka quloqqa botmaydi, bosh barmoq turnikni o'raydi. Panja siljiy boshlaguncha osilib turing.",
  'ex.flexedHang': "Bukilgan qo'llarda osilish",
  'ex.flexedHang.hint':
    'Tirsaklar 90 daraja atrofida, tebranishsiz. Armrestling uchun asosiy izometriya: qimirlamay ushlash.',
  'ex.towelHang': 'Sochiqda osilish',
  'ex.towelHang.hint':
    'Sochiq turnik ustidan tashlanadi, ikkala uchidan ushlanadi. Panja butunlay ketishidan oldin tushing.',
  'ex.pullups': 'Tortilish',
  'ex.pullups.hint':
    "Silkinishsiz va tebranishsiz, pastda qo'llar to'liq tik. Faqat toza takrorlar sanaladi.",
  'ex.weightedPullups': "Og'irlik bilan tortilish",
  'ex.weightedPullups.hint':
    "Og'irlik o'nta toza takror tebranishsiz chiqqandagina qo'shiladi. 2,5 kg dan boshlang.",

  'ex.jumpLunges': 'Sakrab qadam almashish',
  'ex.jumpLunges.hint': "Oyoqlar havoda almashadi, qo'nish yumshoq, orqa tizza polga urilmaydi.",
  'ex.kickSwings': 'Zarbani taqlid qiluvchi sekin siltashlar',
  'ex.kickSwings.hint':
    'Amplituda va tos burilishi ustida ish, keskinliksiz. Tayanch oyoq biroz bukilgan, tana orqaga ketmaydi.',
  'ex.pistolAssisted': "Tayanch bilan bir oyoqda cho'kkalash",
  'ex.pistolAssisted.hint':
    "Tayanchni faqat muvozanat uchun ushlang. Tizza panja chizig'ida, tovon ko'tarilmaydi.",
  'ex.singleLegBridge': "Bir oyoqda tosni ko'tarish",
  'ex.singleLegBridge.hint':
    "Tos bo'sh oyoq tomonga og'maydi. Tepada bir soniya pauza, dumba siqilgan.",
  'ex.sidePlank': 'Yon planka',
  'ex.sidePlank.hint': 'Tana bir chiziq, tos pastga tushmaydi, yelka aniq tirsak ustida.',
  'ex.ballControl': 'Koptok bilan ish: nazorat',
  'ex.ballControl.hint':
    'Qabul qilish, egallash, devorga ikkala oyoq bilan qisqa uzatma. Koptokka emas, oldinga qarang.',
  'ex.ballStrikes': 'Zarba texnikasi',
  'ex.ballStrikes.hint':
    "Tayanch oyoq koptok yonida, uruvchi oyoq panjasi cho'zilgan, tana koptok ustida. Kuch boldir siltashidan emas, tos burilishidan chiqadi.",

  'ex.pushupLadder': "Zinapoya bo'yicha qo'l bukish",
  'ex.pushupLadder.hint':
    'Yondashuvlar orasidagi dam takrorlar soniga teng (soniyada). Tirsaklar 45 daraja, tana bir chiziq.',
  'ex.diamondPushups': "Tor ushlashda qo'l bukish",
  'ex.diamondPushups.hint':
    "Kaftlar ko'krak ostida, bosh va ko'rsatkich barmoqlar uchburchak hosil qiladi. Tirsaklar tana bo'ylab.",
  'ex.pausePushups': "Pastda pauza bilan qo'l bukish",
  'ex.pausePushups.hint':
    "Pastda ikki soniya, polga tegmasdan; keyin tos tushmagan holda tekis ko'tarilish.",
  'ex.hangingLegRaises': "Osilib oyoq ko'tarish",
  'ex.hangingLegRaises.hint':
    "Panja ushlamasa — yotib oyoq ko'tarish, uch marta o'n ikkitadan. Tebranish bilan emas, pres bilan ko'taring.",
  'ex.bicycleCrunches': '«Velosiped» burilishlari',
  'ex.bicycleCrunches.hint':
    "Sekin, bel polga bosilgan. Tirsak tizzaga bo'yin bilan emas, tana burilishi bilan boradi.",
  'ex.hollowHold': 'Yotib «qayiq» holati',
  'ex.hollowHold.hint':
    "Bel polga bosilgani — eng asosiysi. Ko'tarilib ketsa, qo'l va oyoqni balandroq ushlang.",

  'ex.longJumpTest': 'Joyidan uzunlikka sakrash',
  'ex.longJumpTest.hint':
    "Besh urinish, eng yaxshisi yoziladi. O'lchov chiziqdan tovon tekkan eng yaqin nuqtagacha.",
  'ex.verticalJumpTest': 'Devor yonida tepaga sakrash',
  'ex.verticalJumpTest.hint':
    "Besh urinish. Natija — turgan holda cho'zilgan qo'l belgisi bilan sakrashdagi eng yuqori nuqta orasidagi farq.",
  'ex.pullupsTest': 'Maksimal tortilish',
  'ex.pullupsTest.hint':
    'Bitta yondashuv toliqqancha, tebranishsiz. Natija dastur darajasini avtomatik almashtiradi.',
  'ex.pushupsTest': "Maksimal qo'l bukish",
  'ex.pushupsTest.hint':
    "Bitta yondashuv toliqqancha, tana bir chiziq. Ko'krak mushtga tekkanda takror sanaladi.",
  'ex.stretching': "Cho'zilish",
  'ex.stretching.hint': 'Sakrab-sakrab emas, har bir holat 30 soniya, nafas tekis.',

  'ex.circuit': 'Doira',
  'ex.circuit.hint':
    "To'rt doira ketma-ket, 90 soniya dam faqat doiralar orasida. Doira ichida pauza yo'q.",
  'ex.circuit.pullups': 'Tortilish yoki avstraliyacha',
  'ex.circuit.pushups': "Qo'l bukish",
  'ex.circuit.jumpSquats': "Sakrab cho'kkalash",
  'ex.circuit.legRaises': "Oyoq ko'tarish",
  'ex.cooldown': "Yakuniy qism va cho'zilish",
  'ex.cooldown.hint': "Puls pastga, nafas tekis, bugun ishlagan hamma joyni cho'zing.",

  'ex.mobilityHips': 'Tos harakatchanligi',
  'ex.mobilityHips.hint':
    "Sekin tos aylanalari, kaptar holati, son ochilishi. Og'riqsiz, faqat tortishish.",
  'ex.mobilityShoulders': 'Yelka harakatchanligi',
  'ex.mobilityShoulders.hint':
    "Sochiq bilan aylantirish, qo'l aylanalari, eshik kesakisida ko'krakni cho'zish.",
  'ex.hamstringStretch': "Son orqa yuzasini cho'zish",
  'ex.hamstringStretch.hint': 'Bel tik, egilish beldan emas, tosdan boshlanadi.',
  'ex.calfStretch': "Boldirni cho'zish",
  'ex.calfStretch.hint': 'Tovon polga bosilgan, tizza tik; keyin tizza bukilgan holda takrorlang.',
  'ex.chestStretch': "Ko'krakni cho'zish",
  'ex.chestStretch.hint': "Bilak eshik kesakisida, tana qo'ldan buriladi. Har tomonga 45 soniya.",
  'ex.forearmStretch': "Bilaklarni cho'zish",
  'ex.forearmStretch.hint':
    "Kaft polda, barmoqlar o'zingizga qaragan, og'irlik asta o'tkaziladi. Panja kunidan keyin shart.",
  'ex.breathing': 'Nafas mashqlari',
  'ex.breathing.hint':
    '4 ga nafas olish, 4 ga ushlash, 8 ga chiqarish. Qorin bilan nafas, yelka qimirlamaydi.',
  'ex.shower': 'Dush',
  'ex.shower.hint': "Mashg'ulot yakunlandi. Keyingisi jadval bo'yicha.",
  'ex.run': 'Yengil yugurish',
  'ex.run.hint':
    'Suhbat tezligi: nafas qisilmasdan butun jumlani ayta olasiz. Oyoq tana ostiga tushadi, oldinga emas.',
  'ex.walk': 'Yurish',
  'ex.walk.hint':
    "Tez qadam, bel tik, qo'llar ishlaydi. Bu pauza emas, mashg'ulotning qismi: telefonsiz.",
};
