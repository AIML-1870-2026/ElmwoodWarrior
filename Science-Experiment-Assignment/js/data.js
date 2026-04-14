/* ---------- Supplies library ---------- */
const SUPPLIES = {
  "Kitchen": [
    "baking soda","vinegar","salt","sugar","cornstarch","food coloring","dish soap",
    "vegetable oil","lemon juice","eggs","milk","flour","yeast","coffee filters",
    "ziplock bags","paper cups","paper towels","aluminum foil","plastic wrap"
  ],
  "Bathroom": [
    "hydrogen peroxide (3%)","rubbing alcohol","Epsom salt","cotton balls",
    "cotton swabs","toothpaste","shampoo","mouthwash"
  ],
  "Craft / Office": [
    "white paper","colored paper","construction paper","scotch tape","masking tape",
    "duct tape","safety scissors","white glue","glue stick","markers","crayons",
    "string","yarn","rubber bands","paperclips","balloons","straws","popsicle sticks","pipe cleaners"
  ],
  "Garage / Tools": [
    "magnets","AA batteries","9V battery","copper wire","LEDs","nails","screws",
    "sandpaper","ruler","measuring cups","thermometer"
  ],
  "Outdoors / Natural": [
    "leaves","rocks","soil","sand","water","ice","sticks","pinecones"
  ]
};

const SUPPLY_HINTS = {
  "baking soda": "White powder; reacts with acids to make CO₂.",
  "vinegar": "Mild acetic acid; classic pairing with baking soda.",
  "hydrogen peroxide (3%)": "Brown-bottle bathroom strength only. Never stronger.",
  "rubbing alcohol": "Flammable — keep far from flames.",
  "magnets": "Fridge magnets or craft magnets work well.",
  "9V battery": "The rectangular one. Never short the terminals.",
  "food coloring": "A few drops go a long way."
};

/* ---------- Blocklist ---------- */
const BLOCKLIST_PHRASES = [
  "bleach", "ammonia", "drain cleaner", "lye", "sodium hydroxide",
  "mercury", "lead nitrate", "mothball", "gasoline", "lighter fluid",
  "pool chlorine", "chlorine tablet", "mains power", "120v outlet",
  "220v outlet", "wall outlet", "lithium battery", "puncture battery"
];
const BLOCKLIST_COMBOS = [
  ["bleach","ammonia"],
  ["bleach","vinegar"],
  ["bleach","rubbing alcohol"],
  ["bleach","alcohol"],
  ["hydrogen peroxide","vinegar","heat"]
];

function safetyScan(exp) {
  const text = JSON.stringify(exp).toLowerCase();
  for (const p of BLOCKLIST_PHRASES) {
    if (text.includes(p)) return `blocked phrase: "${p}"`;
  }
  for (const combo of BLOCKLIST_COMBOS) {
    if (combo.every(w => text.includes(w))) return `blocked combo: ${combo.join(" + ")}`;
  }
  return null;
}

/* ---------- Schema validator ---------- */
function validateExperiment(exp) {
  if (!exp || typeof exp !== "object") return "not an object";
  const req = ["title","concept_tags","difficulty","time_active_minutes","time_total_minutes",
               "mess_rating","supervision_level","grade_tier","question","hypothesis_prompt",
               "materials","procedure","expected_observations","why_it_works","safety_notes"];
  for (const f of req) if (!(f in exp)) return `missing field: ${f}`;
  if (!Array.isArray(exp.materials) || exp.materials.length === 0) return "materials empty";
  if (!Array.isArray(exp.procedure) || exp.procedure.length === 0) return "procedure empty";
  if (!Array.isArray(exp.safety_notes)) return "safety_notes not array";
  if (!Array.isArray(exp.concept_tags)) return "concept_tags not array";
  return null;
}
