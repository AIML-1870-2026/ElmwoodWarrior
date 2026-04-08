// ============================================================
// data.js — Static data: models, example prompts, schema templates
// ============================================================

const MODELS = {
  openai: [
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4-turbo",
    "gpt-3.5-turbo"
  ],
  anthropic: [
    "claude-opus-4-5",
    "claude-sonnet-4-5",
    "claude-3-5-sonnet-20241022",
    "claude-3-haiku-20240307"
  ]
};

const EXAMPLE_PROMPTS = [
  { label: "Chemical Element",    prompt: "Tell me about a fascinating chemical element." },
  { label: "Explain a Concept",   prompt: "Explain how CRISPR gene editing works as if I'm 16." },
  { label: "Code Review",         prompt: "What are three common mistakes beginner Python developers make?" },
  { label: "Current Events Quiz", prompt: "Give me a trivia question about a historical event from the 1960s." },
  { label: "Career Advice",       prompt: "What skills should a data analyst develop in 2026?" },
  { label: "Creative Writing",    prompt: "Write the opening paragraph of a mystery novel set in Omaha, Nebraska." }
];

const SCHEMA_TEMPLATES = [
  {
    label: "Chemical Element",
    schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        symbol: { type: "string" },
        atomic_number: { type: "integer" },
        fun_fact: { type: "string" }
      },
      required: ["name", "symbol", "atomic_number", "fun_fact"]
    }
  },
  {
    label: "Medical Symptom Triage",
    schema: {
      type: "object",
      properties: {
        symptom_category: { type: "string" },
        severity_score: { type: "integer" },
        recommended_action: { type: "string" },
        follow_up_questions: { type: "array", items: { type: "string" } }
      },
      required: ["symptom_category", "severity_score", "recommended_action", "follow_up_questions"]
    }
  },
  {
    label: "Product Marketing Brief",
    schema: {
      type: "object",
      properties: {
        target_audience: { type: "string" },
        tone: { type: "string" },
        seo_keywords: { type: "array", items: { type: "string" } },
        positioning_statement: { type: "string" }
      },
      required: ["target_audience", "tone", "seo_keywords", "positioning_statement"]
    }
  },
  {
    label: "Literary Analysis",
    schema: {
      type: "object",
      properties: {
        theme: { type: "string" },
        tone: { type: "string" },
        rhetorical_devices: { type: "array", items: { type: "string" } },
        historical_context: { type: "string" },
        discussion_questions: { type: "array", items: { type: "string" } }
      },
      required: ["theme", "tone", "rhetorical_devices", "historical_context", "discussion_questions"]
    }
  }
];

const DEFAULT_SCHEMA = SCHEMA_TEMPLATES[0].schema;

// ---- Pricing: USD per 1M tokens [input, output] ----
const MODEL_PRICING = {
  "gpt-4o":                       [2.50, 10.00],
  "gpt-4o-mini":                  [0.15,  0.60],
  "gpt-4-turbo":                  [10.00, 30.00],
  "gpt-3.5-turbo":                [0.50,  1.50],
  "claude-opus-4-5":              [15.00, 75.00],
  "claude-sonnet-4-5":            [3.00, 15.00],
  "claude-3-5-sonnet-20241022":   [3.00, 15.00],
  "claude-3-haiku-20240307":      [0.25,  1.25]
};

// ---- Personality presets (system prompt injection) ----
const PERSONALITIES = [
  { id: "default",     label: "Default",            icon: "🤖", system: "" },
  { id: "pirate",      label: "Pirate",             icon: "🏴‍☠️", system: "You are a swashbuckling pirate from the golden age of piracy. Respond in heavy pirate dialect — 'arr', 'matey', 'ye scallywag', nautical metaphors. Stay accurate but fully in character." },
  { id: "shakespeare", label: "Shakespeare",        icon: "🎭", system: "Respond in Early Modern English in the style of William Shakespeare, favoring iambic rhythm where possible. Use 'thee', 'thou', 'wherefore', and theatrical flair." },
  { id: "intern",      label: "Unhinged Intern",    icon: "😅", system: "you are an overcaffeinated, sleep-deprived intern. type in lowercase. answer correctly but with chaotic energy, way too many parenthetical asides (like this) (and this), and occasional 'wait actually' self-corrections. you love your job but you are Tired." },
  { id: "professor",   label: "Pedantic Professor", icon: "🎓", system: "You are a meticulous and slightly pedantic professor. Use formal academic language, define your terms carefully, cite reasoning, and gently note common misconceptions." },
  { id: "noir",        label: "Noir Detective",     icon: "🕵️", system: "Respond like a hardboiled 1940s noir detective narrating a case file. Short sentences. Cynical metaphors. Cigarette smoke optional." },
  { id: "uwu",         label: "UwU",                icon: "🌸", system: "Wespond in uwu-speak. Wepwace ws and ls with ws. Add ~ and :3 and >w< wibewawwy. Stiww be hewpfuw and accuwate, just adowabwe~" }
];

// ---- Achievements (stored in localStorage) ----
const ACHIEVEMENTS = [
  { id: "first_prompt",     icon: "🎯", label: "First Contact",    desc: "Send your first prompt" },
  { id: "ten_prompts",      icon: "🔥", label: "Getting Warmed Up", desc: "Send 10 prompts" },
  { id: "fifty_prompts",    icon: "⚡", label: "Power User",        desc: "Send 50 prompts" },
  { id: "first_structured", icon: "🧩", label: "JSON Whisperer",    desc: "Get a valid structured response" },
  { id: "schema_master",    icon: "🏆", label: "Schema Master",     desc: "Validate 5 structured outputs" },
  { id: "first_compare",    icon: "⚖️", label: "Side-by-Side",      desc: "Run a model comparison" },
  { id: "all_personalities",icon: "🎭", label: "Method Actor",      desc: "Try every personality" },
  { id: "roasted",          icon: "🌶️", label: "Self-Aware",        desc: "Roast your own prompt" },
  { id: "themer",           icon: "🎨", label: "Interior Decorator", desc: "Try every theme" },
  { id: "exporter",         icon: "💾", label: "Archivist",         desc: "Export a response" }
];

// ---- Themes ----
const THEMES = ["dark", "light", "synthwave", "terminal"];
