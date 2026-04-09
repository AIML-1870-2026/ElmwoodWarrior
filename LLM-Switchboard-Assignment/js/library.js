// ============================================================
// library.js — Prompt Library + Structured Output Validator
// ============================================================

// ---------- In-memory Prompt Library ----------
const PromptLibrary = (() => {
  const items = []; // { id, name, prompt, mode, schema, provider, model, savedAt }
  let nextId = 1;

  function add(entry) {
    const item = { id: nextId++, savedAt: Date.now(), ...entry };
    items.unshift(item);
    return item;
  }
  function remove(id) {
    const i = items.findIndex((x) => x.id === id);
    if (i >= 0) items.splice(i, 1);
  }
  function get(id) { return items.find((x) => x.id === id) || null; }
  function all() { return items.slice(); }
  function count() { return items.length; }

  return { add, remove, get, all, count };
})();

// ---------- Structured Output Validator ----------
// Walks a JSON Schema (object with .properties and optional .required) and
// reports per-field status: matched | missing | wrong-type | extra.
const SchemaValidator = (() => {
  function jsType(v) {
    if (v === null) return "null";
    if (Array.isArray(v)) return "array";
    return typeof v; // string, number, boolean, object
  }

  function typeMatches(expected, actual) {
    if (!expected) return true;
    // expected may be a string or array of strings (JSON Schema allows array)
    const allowed = Array.isArray(expected) ? expected : [expected];
    if (allowed.includes("integer") && actual === "number") return true;
    return allowed.includes(actual);
  }

  // Validate one object level. Returns { rows, score }
  function validate(data, schema) {
    const rows = [];

    if (!schema || typeof schema !== "object") {
      return { rows, matched: 0, total: 0, score: 0, parseError: null };
    }

    const props = schema.properties || {};
    const required = new Set(schema.required || []);
    const dataIsObject = data && typeof data === "object" && !Array.isArray(data);

    let matched = 0;
    let total = 0;

    // Walk each schema-defined property
    Object.keys(props).forEach((key) => {
      const expected = props[key] && props[key].type;
      const path = key;
      total++;

      if (!dataIsObject || !(key in data)) {
        rows.push({
          path,
          status: required.has(key) ? "missing" : "missing-optional",
          expected: expected || "any",
          actual: "—",
          required: required.has(key)
        });
        return;
      }

      const actualType = jsType(data[key]);
      if (!typeMatches(expected, actualType)) {
        rows.push({
          path,
          status: "wrong-type",
          expected: expected || "any",
          actual: actualType,
          required: required.has(key)
        });
      } else {
        matched++;
        rows.push({
          path,
          status: "matched",
          expected: expected || "any",
          actual: actualType,
          required: required.has(key)
        });
      }
    });

    // Detect extra fields not in the schema
    if (dataIsObject) {
      Object.keys(data).forEach((key) => {
        if (!(key in props)) {
          rows.push({
            path: key,
            status: "extra",
            expected: "—",
            actual: jsType(data[key]),
            required: false
          });
        }
      });
    }

    const score = total === 0 ? 100 : Math.round((matched / total) * 100);
    return { rows, matched, total, score, parseError: null };
  }

  // Convenience: parse JSON text and validate
  function validateText(text, schema) {
    try {
      const data = JSON.parse(text);
      return validate(data, schema);
    } catch (e) {
      return { rows: [], matched: 0, total: 0, score: 0, parseError: e.message };
    }
  }

  return { validate, validateText };
})();
