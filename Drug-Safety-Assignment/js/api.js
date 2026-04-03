// api.js — OpenFDA API layer with caching and rate-limit handling

const cache = new Map();
const BASE = 'https://api.fda.gov';

async function fetchCached(url) {
  if (cache.has(url)) return cache.get(url);
  const res = await fetch(url);
  if (res.status === 429) throw new Error('RATE_LIMIT');
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API_ERROR_${res.status}`);
  const data = await res.json();
  cache.set(url, data);
  return data;
}

/**
 * Search for drugs by name (autocomplete).
 */
export async function searchDrugs(query) {
  const q = encodeURIComponent(query);
  const url = `${BASE}/drug/label.json?search=(openfda.brand_name:${q}*+openfda.generic_name:${q}*)&limit=10`;
  try {
    const data = await fetchCached(url);
    if (!data || !data.results) return [];
    const seen = new Set();
    const results = [];
    for (const r of data.results) {
      const ofd = r.openfda || {};
      const generic = (ofd.generic_name || [])[0];
      if (!generic) continue;
      const key = generic.toUpperCase();
      if (seen.has(key)) continue;
      seen.add(key);
      results.push({
        genericName: generic.toUpperCase(),
        brandNames: (ofd.brand_name || []).map(b => b.toUpperCase()),
        pharmClass: (ofd.pharm_class_epc || [])[0] || '',
        productType: (ofd.product_type || [])[0] || '',
        route: (ofd.route || [])[0] || '',
      });
    }
    return results;
  } catch (e) {
    if (e.message === 'RATE_LIMIT') throw e;
    return [];
  }
}

/**
 * Fetch the best label for a drug.
 */
export async function fetchLabel(genericName) {
  const url = `${BASE}/drug/label.json?search=openfda.generic_name.exact:"${encodeURIComponent(genericName)}"&limit=5`;
  try {
    const data = await fetchCached(url);
    if (!data || !data.results || data.results.length === 0) return null;
    // Pick label with most populated fields
    let best = data.results[0];
    let bestScore = 0;
    const importantFields = ['boxed_warning', 'warnings', 'warnings_and_cautions', 'adverse_reactions',
      'drug_interactions', 'contraindications', 'indications_and_usage', 'dosage_and_administration'];
    for (const label of data.results) {
      let score = 0;
      for (const f of importantFields) {
        if (label[f] && label[f].length) score++;
      }
      if (label.effective_time) score += 0.5;
      if (score > bestScore) { bestScore = score; best = label; }
    }
    return best;
  } catch (e) {
    if (e.message === 'RATE_LIMIT') throw e;
    return null;
  }
}

/**
 * Fetch top adverse reactions (up to 1000).
 */
export async function fetchTopReactions(genericName) {
  const url = `${BASE}/drug/event.json?search=patient.drug.openfda.generic_name.exact:"${encodeURIComponent(genericName)}"&count=patient.reaction.reactionmeddrapt.exact`;
  try {
    const data = await fetchCached(url);
    if (!data || !data.results) return [];
    return data.results; // [{term, count}, ...]
  } catch {
    return [];
  }
}

/**
 * Fetch total report count.
 */
export async function fetchTotalReports(genericName) {
  const url = `${BASE}/drug/event.json?search=patient.drug.openfda.generic_name.exact:"${encodeURIComponent(genericName)}"&limit=1`;
  try {
    const data = await fetchCached(url);
    if (!data || !data.meta) return 0;
    return data.meta.results.total || 0;
  } catch {
    return 0;
  }
}

/**
 * Fetch serious vs non-serious counts.
 */
export async function fetchSeriousness(genericName) {
  const url = `${BASE}/drug/event.json?search=patient.drug.openfda.generic_name.exact:"${encodeURIComponent(genericName)}"&count=serious`;
  try {
    const data = await fetchCached(url);
    if (!data || !data.results) return { serious: 0, nonSerious: 0 };
    const result = { serious: 0, nonSerious: 0 };
    for (const r of data.results) {
      if (r.term === 1) result.serious = r.count;
      else if (r.term === 2) result.nonSerious = r.count;
    }
    return result;
  } catch {
    return { serious: 0, nonSerious: 0 };
  }
}

/**
 * Fetch seriousness breakdown (death, hospitalization, life-threatening, disabling).
 */
export async function fetchSeriousnessBreakdown(genericName) {
  const categories = ['seriousnessdeath', 'seriousnesshospitalization', 'seriousnesslifethreatening', 'seriousnessdisabling'];
  const result = {};
  const promises = categories.map(async (cat) => {
    const url = `${BASE}/drug/event.json?search=patient.drug.openfda.generic_name.exact:"${encodeURIComponent(genericName)}"&count=${cat}`;
    try {
      const data = await fetchCached(url);
      if (data && data.results) {
        const yes = data.results.find(r => r.term === 1);
        result[cat] = yes ? yes.count : 0;
      } else {
        result[cat] = 0;
      }
    } catch {
      result[cat] = 0;
    }
  });
  await Promise.all(promises);
  return result;
}

/**
 * Fetch demographics (sex distribution).
 */
export async function fetchDemographics(genericName) {
  const url = `${BASE}/drug/event.json?search=patient.drug.openfda.generic_name.exact:"${encodeURIComponent(genericName)}"&count=patient.patientsex`;
  try {
    const data = await fetchCached(url);
    if (!data || !data.results) return [];
    return data.results;
  } catch {
    return [];
  }
}

/**
 * Fetch temporal trends (report dates).
 */
export async function fetchReportingTrends(genericName) {
  const url = `${BASE}/drug/event.json?search=patient.drug.openfda.generic_name.exact:"${encodeURIComponent(genericName)}"&count=receivedate`;
  try {
    const data = await fetchCached(url);
    if (!data || !data.results) return [];
    return data.results;
  } catch {
    return [];
  }
}

/**
 * Fetch recall/enforcement data.
 */
export async function fetchRecalls(genericName) {
  const url = `${BASE}/drug/enforcement.json?search=openfda.generic_name.exact:"${encodeURIComponent(genericName)}"&sort=recall_initiation_date:desc&limit=10`;
  try {
    const data = await fetchCached(url);
    if (!data || !data.results) return [];
    return data.results;
  } catch {
    return [];
  }
}

/**
 * Fetch recent recalls for explore view.
 */
export async function fetchRecentRecalls() {
  const url = `${BASE}/drug/enforcement.json?sort=recall_initiation_date:desc&limit=6`;
  try {
    const data = await fetchCached(url);
    if (!data || !data.results) return [];
    return data.results;
  } catch {
    return [];
  }
}

/**
 * Fetch all data for a drug in parallel.
 */
export async function fetchAllDrugData(genericName) {
  const [label, reactions, totalReports, seriousness, breakdown, demographics, trends, recalls] =
    await Promise.all([
      fetchLabel(genericName),
      fetchTopReactions(genericName),
      fetchTotalReports(genericName),
      fetchSeriousness(genericName),
      fetchSeriousnessBreakdown(genericName),
      fetchDemographics(genericName),
      fetchReportingTrends(genericName),
      fetchRecalls(genericName),
    ]);

  return { label, reactions, totalReports, seriousness, breakdown, demographics, trends, recalls };
}
