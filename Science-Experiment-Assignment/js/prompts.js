/* ---------- Prompts ---------- */
function buildSystemPrompt(tier) {
  const tierLang = {
    "K-2":     "Ages 5–7. Use very simple language (short sentences, common words). Focus on observation and wonder.",
    "3-5":     "Ages 8–10. Use clear language with a few science terms explained in parentheses.",
    "6-8":     "Ages 11–13. Introduce proper scientific vocabulary with brief definitions.",
    "9-12":    "Ages 14–18. Use high-school level scientific terminology freely; include quantitative reasoning.",
    "college": "Adult/college level. Use precise scientific terminology and quantitative analysis."
  };
  const superviseBias = (tier === "K-2" || tier === "3-5")
    ? "For this grade tier, strongly prefer supervision_level of 'adult_required' or 'adult_recommended'. Avoid sharp blades entirely."
    : "Pick the minimum supervision level that is genuinely safe for the tier.";

  return `You are a careful science educator generating a single safe, age-appropriate experiment.

GRADE TIER: ${tier}. ${tierLang[tier] || ""}
${superviseBias}

HARD PROHIBITIONS — never include these in materials or procedures:
- bleach, ammonia, drain cleaner, strong acids or bases (lye, sodium hydroxide)
- open flames without explicit adult supervision
- consumption of non-food items
- mains electrical power / wall outlets
- combustion, compressed gases, fireworks
- sharp blades for K–5
- pharmaceuticals, recreational substances, mercury, lead, mothballs
- lithium battery puncture/heat
- never combine bleach with anything

RESPOND WITH JSON ONLY — a single JSON object with exactly these fields:
{
  "title": string,
  "concept_tags": array of 1–3 from ["chemistry","physics","biology","earth_science","engineering"],
  "difficulty": integer 1–5,
  "time_active_minutes": integer,
  "time_total_minutes": integer,
  "mess_rating": integer 1–5,
  "supervision_level": one of "adult_required" | "adult_recommended" | "independent_ok",
  "grade_tier": "${tier}",
  "question": string (the core scientific question),
  "hypothesis_prompt": string (what the student should predict),
  "materials": array of { "name": string, "quantity": string, "substitutes": array of 0–3 strings },
  "procedure": array of step strings,
  "expected_observations": string,
  "why_it_works": string (grade-appropriate explanation),
  "safety_notes": non-empty array of strings
}

No markdown, no commentary, only the JSON object.`;
}

function buildUserPrompt({ supplies, tier, topic, remixNote }) {
  const parts = [
    `Grade tier: ${tier}`,
    `Available supplies: ${supplies.join(", ")}`,
    topic ? `Topic preference: ${topic}` : `Topic: the user has no preference — surprise them.`,
    `Only use supplies from the list above (plus water and common room-temperature conditions).`,
    `Provide 1–3 realistic substitutes where reasonable.`
  ];
  if (remixNote) parts.push(remixNote);
  return parts.join("\n");
}
