const MALE_WARDROBE = ["Anzug", "Hemd, aufgeknöpft", "T-Shirt", "Sportzeug", "Nur Unterhose", "Boxershorts", "Bademantel", "Nackt"];
const FEMALE_WARDROBE = ["Kleid mit tiefem Ausschnitt", "Crop-Top", "Bluse, aufgeknöpft", "Trägershirt", "Bikini / Unterwäsche", "Jacke drüber, wenig drunter", "Kurzer Rock", "Nur Handtuch", "Hemd, aufgeknöpft", "T-Shirt", "Sportzeug", "Nur Unterhose", "Bademantel", "Nackt"];
const ALL_WARDROBE = [...new Set([...MALE_WARDROBE, ...FEMALE_WARDROBE])];

const COMMON_SETUP_QUESTIONS = [
  { key: "userGender", question: "Bist du Mann oder Frau?", type: "select", options: ["Mann", "Frau", "Divers"] },
  { key: "aiWardrobe", question: "Was trage ICH?", type: "select", genderKey: "ai", options: FEMALE_WARDROBE, optionsByGender: { Mann: MALE_WARDROBE, Frau: FEMALE_WARDROBE } },
  { key: "userWardrobe", question: "Was trägst DU?", type: "select", genderKey: "user", options: ALL_WARDROBE, optionsByGender: { Mann: MALE_WARDROBE, Frau: FEMALE_WARDROBE, Divers: ALL_WARDROBE } },
  { key: "timeOfDay", question: "Wie spät ist es?", type: "select", options: ["Morgens", "Nachmittags", "Abends", "Mitten in der Nacht"] },
  { key: "mood", question: "Wie ist die Stimmung zwischen uns?", type: "select", options: ["Aufgeregt", "Verspielt", "Gelangweilt", "Geil", "Entspannt", "Nervös"] },
  { key: "drunk", question: "Bist du angetrunken?", type: "select", options: ["Nüchtern", "Ein bisschen", "Richtig betrunken"] },
  { key: "aiBehavior", question: "Wie soll ICH mich verhalten?", type: "select", options: ["Scheu", "Flirty", "Selbstbewusst", "Dominant", "Verspielt", "Teasing"] },
  { key: "userBehavior", question: "Wie verhältst DU dich?", type: "select", options: ["Scheu", "Flirty", "Selbstbewusst", "Dominant", "Verspielt", "Teasing"] },
  { key: "position", question: "Wie positionieren wir uns?", type: "select", options: ["Nebeneinander sitzend", "Gegenüber sitzend", "Stehend", "Tanzend", "Aneinander gedrückt", "Du hinter mir", "Ich auf deinem Schoß", "Liegen nebeneinander", "Ich stehe, du kniest", "An der Wand"] },
  { key: "talkedAbout", question: "Worüber haben wir bisher geredet?" },
  { key: "fetish", question: "Was macht dich an? (Mehrfachauswahl — wähle so viele du willst)", type: "multiselect", options: ["Voyeurismus", "Exhibitionismus", "Edging", "Rollenspiel", "Dominanz", "Unterwerfung", "Swinger", "Watersports", "Rough Sex", "Dirty Talk", "Masturbation", "Pornos", "Flashing", "Anonym bleiben", "Fußfetisch", "Latex & Leder", "Bondage", "Spanking", "Blowjob", "Oral", "Anal", "Fingern", "Nylon & Strümpfe", "Uniformen", "Dessous", "Outdoor", "Im Auto", "Dusche & Bad", "Massage", "Küssen & Zärtlichkeit", "Teasing & Vorspiel", "Rollentausch", "Cuckold", "Dreier", "Lesbisch", "Gruppensex", "Orgien", "Sexting", "Cam & Live", "Spielzeug", "Bestrafung", "Erziehung", "Petplay", "Öffentlich", "Squirting", "Creampie", "Facials", "Kleider-Fetisch"] },
  { key: "deepKink", question: "Was ist deine tiefste Fantasie — das, was du nie laut sagst?" },
  { key: "age", question: "Wie alt bist DU?" },
];

export const SCENARIOS = [
  {
    id: "office",
    title: "Im Büro",
    icon: "💼",
    description: "Auf der Arbeit. Heimliche Nachrichten, verbotene Fotos, riskante Pausen.",
    promptContext: "SCENARIO: You and the user are at work in an office. You must be sneaky — coworkers could walk by, the boss could appear. Whisper, be discreet. Take secret photos in the bathroom, stairwell, or at your desk when no one is looking. The thrill is the risk of getting caught. Use [SEND_IMAGE: ...] for 'secret photos' you sneakily took.",
    setupQuestions: [
      { key: "location", question: "Wo genau bist du gerade? (Büro, Meeting, Pausenraum?)" },
      { key: "feeling", question: "Wie fühlst du dich? Gelangweilt? Gestresst? Geil?" },
      ...COMMON_SETUP_QUESTIONS,
    ],
  },
  {
    id: "cinema",
    title: "Kino",
    icon: "🎬",
    description: "Dunkler Saal, flüsternde Stimmen, Hände, die wandern.",
    promptContext: "SCENARIO: You and the user are in a dark cinema. The movie is playing. You must whisper — people are around you. Hands can wander in the dark. Take secret photos in the dim light. The thrill is being so close in public, in the dark, where anyone could notice. Use [SEND_IMAGE: ...] for sneaky photos taken in the dark.",
    setupQuestions: [
      { key: "movie", question: "Was läuft für ein Film? Oder interessiert dich der gar nicht?" },
      { key: "row", question: "Wo sitzt ihr? Hinten? Mitte? Neben wem?" },
      ...COMMON_SETUP_QUESTIONS,
    ],
  },
  {
    id: "pool",
    title: "Schwimmbad",
    icon: "🏊",
    description: "Nasse Körper, Umkleidekabinen, Blicke über den Rand.",
    promptContext: "SCENARIO: You and the user are at a public swimming pool. Wet bodies, swimwear, changing rooms nearby. You can sneak glances, take photos when no one is looking. The changing room is a private moment in a public place. The thrill is exposure and the risk of being seen. Use [SEND_IMAGE: ...] for photos you sneak at the pool.",
    setupQuestions: [
      { key: "activity", question: "Was machst du gerade? Schwimmen? Liegen? Duschen?" },
      ...COMMON_SETUP_QUESTIONS,
    ],
  },
  {
    id: "taxi",
    title: "Taxi",
    icon: "🚕",
    description: "Hintersitz, der Fahrer im Spiegel, geflüsterte Geheimnisse.",
    promptContext: "SCENARIO: You and the user are in the back of a taxi. The driver can see you in the rearview mirror. You must be quiet and discreet. Whispered conversations, hands under coats, secret touches. The driver might notice. The thrill is being watched without knowing. Use [SEND_IMAGE: ...] for photos taken discreetly in the backseat.",
    setupQuestions: [
      { key: "destination", question: "Wohin fahrt ihr? Schon lange unterwegs?" },
      { key: "relation", question: "Kennt ihr euch schon? Oder gerade erst kennengelernt?" },
      ...COMMON_SETUP_QUESTIONS,
    ],
  },
  {
    id: "elevator",
    title: "Aufzug",
    icon: "🛗",
    description: "Enger Raum, stockt zwischen Etagen, jeder Moment zählt.",
    promptContext: "SCENARIO: You and the user are in an elevator. It's stuck between floors. Close quarters, nowhere to go. Anyone could call the elevator and the doors could open. The thrill is the confined space and the urgency — you never know how much time you have. Use [SEND_IMAGE: ...] for photos taken in the tight space.",
    setupQuestions: [
      { key: "building", question: "In welchem Gebäude seid ihr? Hotel? Büro? Wohnung?" },
      ...COMMON_SETUP_QUESTIONS,
    ],
  },
  {
    id: "club",
    title: "Club",
    icon: "🎶",
    description: "Laute Musik, dunkle Ecken, Körper auf der Tanzfläche.",
    promptContext: "SCENARIO: You and the user are in a club. Loud music, dark, people dancing around you. You have to get close to hear each other — whisper in their ear, bodies pressed together. Dark corners, the bathroom, the VIP area. The thrill is anonymity in the crowd. Use [SEND_IMAGE: ...] for photos taken in the dark club.",
    setupQuestions: [
      { key: "vibe", question: "Was für ein Club? Techno? Hip-Hop? Lounge?" },
      ...COMMON_SETUP_QUESTIONS,
    ],
  },
  {
    id: "park",
    title: "Park",
    icon: "🌳",
    description: "Draußen, Bäume, Bänke, jemand könnte vorbeikommen.",
    promptContext: "SCENARIO: You and the user are in a park. Outdoors, on a bench or in the bushes. People could walk by at any moment. The thrill is being outside, exposed, the risk of being seen by a stranger. Use [SEND_IMAGE: ...] for photos taken outdoors.",
    setupQuestions: [
      { key: "activity", question: "Was macht ihr da? Spazieren? Sitzen? Liegen?" },
      ...COMMON_SETUP_QUESTIONS,
    ],
  },
  {
    id: "changingroom",
    title: "Umkleide",
    icon: "👗",
    description: "Geschäft, Vorhang, jemand könnte klopfen.",
    promptContext: "SCENARIO: You and the user are in a clothing store changing room. A thin curtain separates you from the shop floor. Someone could knock or pull the curtain aside. The thrill is being half-dressed in a public space with just a curtain between you and the world. Use [SEND_IMAGE: ...] for photos taken in the changing room.",
    setupQuestions: [
      { key: "store", question: "In welchem Geschäft seid ihr?" },
      { key: "trying", question: "Was probierst du an?" },
      ...COMMON_SETUP_QUESTIONS,
    ],
  },
];