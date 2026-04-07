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
