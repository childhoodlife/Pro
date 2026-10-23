export type Language = 'en' | 'bn';

export interface Translations {
  appName: string;
  appEdition: string;
  appSubtitle: string;
  playNow: string;
  practiceAI: string;
  twoPlayer: string;
  gameModes: string;
  penFightTitle: string;
  penFightSub: string;
  dotsBoxesTitle: string;
  dotsBoxesSub: string;
  katakutiTitle: string;
  katakutiSub: string;
  fruitSliceTitle: string;
  fruitSliceSub: string;
  bottleSmashTitle: string;
  bottleSmashSub: string;
  chessTitle: string;
  chessSub: string;
  settings: string;
  instructions: string;
  statistics: string;
  soundFX: string;
  voiceCoach: string;
  voiceCoachSub: string;
  listenRules: string;
  childhoodSong: string;
  childhoodSongSub: string;
  vibration: string;
  theme: string;
  language: string;
  vintageRetro: string;
  vintageRetroSub: string;
  themes: {
    vintage_nostalgia: string;
    golden_school: string;
    notebook: string;
    grid: string;
    wood: string;
    blackboard: string;
  };
  difficulties: {
    easy: string;
    medium: string;
    hard: string;
  };
  penFight: {
    choosePen: string;
    penMods: string;
    capPosition: string;
    springTuning: string;
    gripWrap: string;
    caps: {
      back: string;
      front: string;
      none: string;
    };
    springs: {
      normal: string;
      tight: string;
    };
    grips: {
      bare: string;
      rubber: string;
    };
    dragAndFlick: string;
    turn: string;
    p1Turn: string;
    p2Turn: string;
    aiTurn: string;
    power: string;
    angle: string;
    round: string;
    targetScore: string;
    ringOutText: string;
    hitText: string;
    fellOffDesk: string;
    winsMatch: string;
    playAgain: string;
    rematch: string;
    backToMenu: string;
    weight: string;
    speed: string;
    friction: string;
    modeDeskKnockout: string;
    modeInkDurability: string;
    safeDisclaimer: string;
  };
  dotsBoxes: {
    gridSize: string;
    p1Score: string;
    p2Score: string;
    boxesLeft: string;
    extraTurn: string;
    undo: string;
    restart: string;
    gameOver: string;
    winner: string;
    draw: string;
    completedBoxes: string;
  };
  stats: {
    title: string;
    totalPlayed: string;
    pfWins: string;
    pfRingouts: string;
    dbWins: string;
    dbBoxesCaptured: string;
    resetStats: string;
  };
  rules: {
    title: string;
    listenSpoken: string;
    pfRulesHeader: string;
    pfRule1: string;
    pfRule2: string;
    pfRule3: string;
    pfRule4: string;
    dbRulesHeader: string;
    dbRule1: string;
    dbRule2: string;
    dbRule3: string;
    dbRule4: string;
    katakutiHeader: string;
    katakutiRule1: string;
    katakutiRule2: string;
    chessHeader: string;
    chessRule1: string;
    chessRule2: string;
    chessRule3: string;
    chessRule4: string;
  };
  androidExport: {
    title: string;
    subtitle: string;
    installPWA: string;
    installed: string;
    exportAndroidStudio: string;
    composeCode: string;
    manifestCode: string;
    copyCode: string;
    copied: string;
    buildApkSteps: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: "Childhood Life",
    appEdition: "Unique System · Edition 2.0",
    appSubtitle: "Nostalgic Schoolyard Pen & Notebook Games with Voice Rules & Physics",
    playNow: "Play Now",
    practiceAI: "Practice vs AI",
    twoPlayer: "2 Player (Pass & Play)",
    gameModes: "Game Modes",
    penFightTitle: "Pen Fight",
    penFightSub: "Tabletop battle with school pens on the desk",
    dotsBoxesTitle: "Dots and Boxes",
    dotsBoxesSub: "Classic notebook grid line & box capturing",
    katakutiTitle: "Katakuti & SOS",
    katakutiSub: "Backpage notebook Tic-Tac-Toe and SOS game",
    fruitSliceTitle: "Fruit Slice",
    fruitSliceSub: "Slice school fruits with pen blade, reach 100 to win",
    bottleSmashTitle: "Bottle Smash",
    bottleSmashSub: "Slingshot pebble target shooting, reach 100 to win",
    chessTitle: "International Chess",
    chessSub: "Authentic 8x8 royal board, smart tactics & checkmate",
    settings: "Settings",
    instructions: "Rules & Lore",
    statistics: "Match Records",
    soundFX: "Sound Effects",
    voiceCoach: "Voice Referee & Rules Narrator",
    voiceCoachSub: "Speaks aloud game rules and match commentary",
    listenRules: "Listen to Rules Aloud",
    childhoodSong: "Childhood Melodies",
    childhoodSongSub: "Nostalgic school days melody playing in background",
    vibration: "Haptic Vibration",
    theme: "Table Theme",
    language: "Language",
    vintageRetro: "Vintage 90s Classroom Edition",
    vintageRetroSub: "Authentic retro ruled notebook paper & vintage classroom desk",
    themes: {
      vintage_nostalgia: "90s Ruled Notebook (Vintage)",
      golden_school: "Golden Teak Desk (Heritage)",
      notebook: "Ruled Notebook",
      grid: "Graph Paper",
      wood: "School Desk",
      blackboard: "Chalkboard",
    },
    difficulties: {
      easy: "Easy (Casual)",
      medium: "Medium (Smart)",
      hard: "Hard (Master)",
    },
    penFight: {
      choosePen: "Select Your Pen",
      penMods: "Pen Tuning & Modifications",
      capPosition: "Cap Position",
      springTuning: "Spring Tension",
      gripWrap: "Grip Wrap",
      caps: {
        back: "Cap on Back (Balanced)",
        front: "Cap on Nib (Heavy Punch)",
        none: "No Cap (Fast Speed)",
      },
      springs: {
        normal: "Standard Spring",
        tight: "Tight Spring (+Power)",
      },
      grips: {
        bare: "Standard Plastic",
        rubber: "Rubber Band (+Grip)",
      },
      dragAndFlick: "Drag back & release to flick!",
      turn: "'s Turn",
      p1Turn: "Player 1's Turn",
      p2Turn: "Player 2's Turn",
      aiTurn: "Computer is aiming...",
      power: "Power",
      angle: "Angle",
      round: "Round",
      targetScore: "First to",
      ringOutText: "Fell Off Desk!",
      hitText: "Direct Collision!",
      fellOffDesk: "fell off the school desk!",
      winsMatch: "wins the match!",
      playAgain: "Next Round",
      rematch: "Play Rematch",
      backToMenu: "Back to School Bag",
      weight: "Weight",
      speed: "Flick Speed",
      friction: "Desk Grip",
      modeDeskKnockout: "Table Knockout (Ring-Out)",
      modeInkDurability: "Ink Durability (HP Mode)",
      safeDisclaimer: "Safe virtual simulation of classic schoolroom pen games.",
    },
    dotsBoxes: {
      gridSize: "Grid Size",
      p1Score: "Player 1",
      p2Score: "Player 2",
      boxesLeft: "Boxes Left",
      extraTurn: "Extra Turn! Box captured!",
      undo: "Undo Move",
      restart: "Restart Game",
      gameOver: "Match Finished!",
      winner: "Winner",
      draw: "It's a Tie!",
      completedBoxes: "Boxes Made",
    },
    stats: {
      title: "Schoolyard Records",
      totalPlayed: "Total Matches Played",
      pfWins: "Pen Fight Victories",
      pfRingouts: "Desk Knockouts (Ring-Outs)",
      dbWins: "Dots & Boxes Victories",
      dbBoxesCaptured: "Total Boxes Captured",
      resetStats: "Clear All Records",
    },
    rules: {
      title: "Game Rules & Lore",
      listenSpoken: "Listen with Voice Coach",
      pfRulesHeader: "Pen Fight (কলমে কলমের যুদ্ধ)",
      pfRule1: "Each player places their pen on opposite sides of the classroom desk.",
      pfRule2: "Take turns flicking your pen by dragging backwards to set angle and power.",
      pfRule3: "Collision: Direct hits transfer momentum and spin the opponent's pen.",
      pfRule4: "Victory: Push the opponent's pen completely off the desk edge to score a knockout!",
      dbRulesHeader: "Dots and Boxes (বক্স বানানোর খেলা)",
      dbRule1: "Players take turns connecting two unjoined adjacent dots horizontally or vertically.",
      dbRule2: "When a player draws the 4th side of a 1x1 box, they score a point and capture that box.",
      dbRule3: "Bonus: Every time you complete a box, you immediately earn an extra turn!",
      dbRule4: "The game ends when all boxes are drawn. The player with the most boxes wins!",
      katakutiHeader: "Katakuti & SOS (কাটাকুটি ও এস-ও-এস)",
      katakutiRule1: "Classic 3x3 Tic-Tac-Toe: Match 3 X or O symbols in a straight row.",
      katakutiRule2: "SOS Grid: Place S or O in empty cells to form the word S-O-S in any direction.",
      chessHeader: "International Chess (আন্তর্জাতিক দাবা)",
      chessRule1: "Real 8x8 battlefield with 16 White & 16 Black pieces following global FIDE rules.",
      chessRule2: "Pawns advance forward; Knights leap in 'L' shape; Bishops slide diagonals; Rooks patrol rows and columns; Queen controls all lines.",
      chessRule3: "Protect your King at all costs. Check must be escaped immediately by moving, blocking, or capturing.",
      chessRule4: "Deliver Checkmate by cornering the enemy King with no legal escape moves to achieve grandmaster victory!",
    },
    androidExport: {
      title: "Android APK & Studio Project",
      subtitle: "Run as an Android App or compile in Android Studio",
      installPWA: "Install on Android (1-Tap PWA)",
      installed: "Already Installed on Device",
      exportAndroidStudio: "Android Studio & Jetpack Compose Code",
      composeCode: "MainActivity.kt (Jetpack Compose)",
      manifestCode: "AndroidManifest.xml",
      copyCode: "Copy Code",
      copied: "Copied to clipboard!",
      buildApkSteps: "How to Build APK in Android Studio:",
    },
  },
  bn: {
    appName: "চাইল্ডহুড লাইফ (Childhood Life)",
    appEdition: "ইউনিক সিস্টেম · সংস্করণ ২.০",
    appSubtitle: "স্কুলের বেঞ্চ ও খাতার পাতায় শৈশবের সোনালী দিন · ভয়েস রুলস ও ফিজিক্স",
    playNow: "শুরু করুন",
    practiceAI: "কম্পিউটারের সাথে খেলুন",
    twoPlayer: "২ জন বন্ধু (পাস অ্যান্ড প্লে)",
    gameModes: "খেলার ধরন",
    penFightTitle: "কলমে কলমের যুদ্ধ",
    penFightSub: "স্কুল বেঞ্চের টেবিলটপ পেন ফাইট যুদ্ধ",
    dotsBoxesTitle: "বক্স বানানোর খেলা",
    dotsBoxesSub: "বিন্দু জুড়ে খাতার পাতায় বক্স দখল",
    katakutiTitle: "কাটাকুটি ও এস-ও-এস",
    katakutiSub: "খাতার শেষ পৃষ্ঠার কাটাকুটি ও এস-ও-এস খেলা",
    fruitSliceTitle: "ফল কাটা খেলা",
    fruitSliceSub: "কলমের ব্লেড দিয়ে মৌসুমি ফল কাটা, ১০০ করলে জয়",
    bottleSmashTitle: "বোতল ভাঙ্গা খেলা",
    bottleSmashSub: "গুলতি দিয়ে নিশানা করে কাঁচের বোতল ভাঙ্গা, ১০০ করলে জয়",
    chessTitle: "আন্তর্জাতিক দাবা",
    chessSub: "আসল ৮x৮ কাঠের বোর্ড, রাজকীয় চাল ও কিস্তিমাত",
    settings: "সেটিংস",
    instructions: "খেলার নিয়ম",
    statistics: "রেকর্ড খাতা",
    soundFX: "শব্দ প্রভাব (সাউন্ড)",
    voiceCoach: "ভয়েস রেফারি ও নিয়ম কথক",
    voiceCoachSub: "মুখে নিয়মাবলী বলে দিবে এবং ম্যাচে কমেন্ট্রি করবে",
    listenRules: "মুখে নিয়ম শুনুন (ভয়েস)",
    childhoodSong: "শৈশবের মিষ্টি গান",
    childhoodSongSub: "খেলা চলার সময় ব্যাকগ্রাউন্ডে নস্টালজিক সুর বাজবে",
    vibration: "কম্পন (ভাইব্রেশন)",
    theme: "টেবিল থিম",
    language: "ভাষা (Language)",
    vintageRetro: "পুরাতন ক্লাসরুম সংস্করণ (Vintage 90s)",
    vintageRetroSub: "গেম চলাকালে ৯০-এর দশকের রুলটানা খাতা ও আসল কাঠের বেঞ্চের আবহ",
    themes: {
      vintage_nostalgia: "৯০-এর ক্লাসরুমের খাতা (নস্টালজিক)",
      golden_school: "সোনালী কাঠের বেঞ্চ (হেরিটেজ)",
      notebook: "রুলটানা খাতা",
      grid: "গ্রাফ খাতা",
      wood: "কাঠের স্কুল বেঞ্চ",
      blackboard: "কালো চক বোর্ড",
    },
    difficulties: {
      easy: "সহজ (নবাগত)",
      medium: "মাঝারি (চালাক)",
      hard: "কঠিন (ওস্তাদ)",
    },
    penFight: {
      choosePen: "আপনার পছন্দের কলম বাছুন",
      penMods: "কলম টিউনিং ও মডিফিকেশন",
      capPosition: "ক্যাপের অবস্থান",
      springTuning: "ভেতরের স্প্রিং টাইট",
      gripWrap: "গ্রিপে রবার ব্যান্ড",
      caps: {
        back: "ক্যাপ পেছনে (ভারসাম্য)",
        front: "ক্যাপ মুখে (জোরদার ধাক্কা)",
        none: "ক্যাপ ছাড়া (অতিরিক্ত গতি)",
      },
      springs: {
        normal: "স্ট্যান্ডার্ড স্প্রিং",
        tight: "টাইট স্প্রিং (+১৫% পাওয়ার)",
      },
      grips: {
        bare: "সাধারণ প্লাস্টিক",
        rubber: "রবার ব্যান্ড গ্রিপ (+বেঞ্চ গ্রিপ)",
      },
      dragAndFlick: "টেনে ধরে ছেড়ে দিন আর ছুড়ুন!",
      turn: "এর চাল",
      p1Turn: "খেলোয়াড় ১ এর চাল",
      p2Turn: "খেলোয়াড় ২ এর চাল",
      aiTurn: "কম্পিউটার নিশানা তাক করছে...",
      power: "শক্তি",
      angle: "কোণ",
      round: "রাউন্ড",
      targetScore: "লক্ষ্য স্কোর",
      ringOutText: "বেঞ্চ থেকে পড়ে গেছে!",
      hitText: "জোরদার ধাক্কা!",
      fellOffDesk: "বেঞ্চের কিনারা দিয়ে নিচে পড়ে গেছে!",
      winsMatch: "ম্যাচ জয়ী হয়েছে!",
      playAgain: "পরের রাউন্ড",
      rematch: "আবার খেলুন",
      backToMenu: "স্কুল ব্যাগে ফিরুন",
      weight: "ওজন",
      speed: "ছুঁড়ার গতি",
      friction: "বেঞ্চে গ্রিপ",
      modeDeskKnockout: "বেঞ্চ থেকে ফেলে দেওয়া (নকআউট)",
      modeInkDurability: "কালির শক্তি (এইচপি মোড)",
      safeDisclaimer: "স্কুলবেঞ্চের শৈশবের খেলার সম্পূর্ণ নিরাপদ ভার্চুয়াল সিমুলেশন।",
    },
    dotsBoxes: {
      gridSize: "গ্রিডের মাপ",
      p1Score: "খেলোয়াড় ১",
      p2Score: "খেলোয়াড় ২",
      boxesLeft: "অবশিষ্ট বক্স",
      extraTurn: "দারুণ! বক্স পূরণ হওয়ায় বোনাস চাল!",
      undo: "চাল ফিরিয়ে নিন",
      restart: "নতুন করে শুরু",
      gameOver: "খেলা সমাপ্ত!",
      winner: "বিজয়ী",
      draw: "ম্যাচ ড্র হয়েছে!",
      completedBoxes: "তৈরি করা বক্স",
    },
    stats: {
      title: "স্কুলের রেকর্ড খাতা",
      totalPlayed: "মোট খেলা ম্যাচ",
      pfWins: "পেন ফাইটে জয়",
      pfRingouts: "টেবিল থেকে ফেলে দেওয়া জয়",
      dbWins: "বক্স খেলায় জয়",
      dbBoxesCaptured: "মোট সংগৃহীত বক্স",
      resetStats: "রেকর্ড মুছে ফেলুন",
    },
    rules: {
      title: "খেলার নিয়মাবলী",
      listenSpoken: "ভয়েস কোচের মুখে শুনুন",
      pfRulesHeader: "কলমে কলমের যুদ্ধ (Pen Fight)",
      pfRule1: "দুই খেলোয়াড় স্কুল বেঞ্চের দুই প্রান্তে নিজ নিজ কলম স্থাপন করবে।",
      pfRule2: "নিজের চালে কলমের পেছনে আঙুল দিয়ে টেনে শক্তি ও দিক নির্ধারণ করে ছুড়ুন।",
      pfRule3: "ধাক্কা লাগলে বাস্তবসম্মত পদার্থবিজ্ঞান অনুযায়ী প্রতিপক্ষের কলম ঘুরবে ও সরবে।",
      pfRule4: "প্রতিপক্ষের কলম বেঞ্চের কিনারা দিয়ে নিচে ফেলে দিলেই রাউন্ডে জয় লাভ করবেন!",
      dbRulesHeader: "বক্স বানানোর খেলা (Dots & Boxes)",
      dbRule1: "খাতার পাতায় পাশাপাশি দুটি বিন্দুর মাঝে দাগ টেনে সংযুক্ত করুন।",
      dbRule2: "যে খেলোয়াড় একটি ১x১ বক্সের চতুর্থ বা শেষ বাহুটি পূরণ করবে, বক্সটি তার নামে জমা হবে।",
      dbRule3: "যেকোনো বক্স দখল করার সাথে সাথে সেই খেলোয়াড় একটি অতিরিক্ত বোনাস চাল পাবে!",
      dbRule4: "সবগুলো বক্স পূর্ণ হলে খেলা শেষ হবে এবং যে সর্বাধিক বক্স পাবে সে বিজয়ী হবে।",
      katakutiHeader: "কাটাকুটি ও এস-ও-এস (Katakuti & SOS)",
      katakutiRule1: "খাতার শেষ পৃষ্ঠায় ৩x৩ ঘরে ক্রস (X) ও শূন্য (O) দিয়ে সোজা লাইনে ৩টি মেলান।",
      katakutiRule2: "এস-ও-এস খেলায় গ্রিডে S বা O বসিয়ে যেকোনো দিকে S-O-S মিলিয়ে পয়েন্ট অর্জন করুন।",
      chessHeader: "আন্তর্জাতিক দাবা (International Chess)",
      chessRule1: "আন্তর্জাতিক FIDE নিয়মে আসল ৮x৮ যুদ্ধক্ষেত্রে ১৬টি সাদা ও ১৬টি কালো গুটি নিয়ে খেলা।",
      chessRule2: "বোড়ে সোজা এক ঘর এগোয়; ঘোড়া 'L' আকারে লাফিয়ে চলে; গজ কোণাকুণি চলে; নৌকা সোজাসুজি চলে; মন্ত্রী সব দিকে যেতে পারে।",
      chessRule3: "রাজাকে সব মূল্যে রক্ষা করুন। বিপক্ষ আক্রমণ করলে 'কিস্ত' হবে, অবিলম্বে রাজাকে নিরাপদ ঘরে সরাতে হবে।",
      chessRule4: "শত্রু রাজাকে এমনভাবে ঘেরাও করুন যাতে কোনো পালানোর পথ না থাকে, একেই বলে 'কিস্তিমাত' বা চেকমেট!",
    },
    androidExport: {
      title: "অ্যান্ড্রয়েড APK ও স্টুডিও প্রোজেক্ট",
      subtitle: "ফোনে ইন্সটল করুন অথবা অ্যান্ড্রয়েড স্টুডিওতে বিল্ড করুন",
      installPWA: "অ্যান্ড্রয়েড ফোনে সরাসরি ইন্সটল (১-ট্যাপ)",
      installed: "ডিভাইসে ইন্সটল করা আছে",
      exportAndroidStudio: "অ্যান্ড্রয়েড স্টুডিও ও Jetpack Compose কোড",
      composeCode: "MainActivity.kt (Jetpack Compose)",
      manifestCode: "AndroidManifest.xml",
      copyCode: "কোড কপি করুন",
      copied: "কপি সম্পন্ন হয়েছে!",
      buildApkSteps: "অ্যান্ড্রয়েড স্টুডিওতে APK বিল্ড করার উপায়:",
    },
  },
};
