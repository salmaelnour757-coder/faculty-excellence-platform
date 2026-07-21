/**
 * Faculty Excellence Platform — Core Scoring Engine
 * © 2026 Dr. Salma Elnour Rahma Mohamed. All rights reserved.
 * ORCID: 0000-0001-6439-5062
 * Commercial use requires a licence. See LICENSE for full terms.
 */

export function calculateGapScore(importance, competence) {
  if (!isValidRating(importance) || !isValidRating(competence))
    throw new Error('Ratings must be integers between 1 and 5');
  return importance - competence;
}

export function calculateTNI(importance, competence, priority) {
  if (!isValidRating(priority))
    throw new Error('Priority must be an integer between 1 and 5');
  return calculateGapScore(importance, competence) * priority;
}

export function classifyTNI(tni, bands) {
  if (tni <= 4)  return { band: 'low',      ...bands.low      };
  if (tni <= 8)  return { band: 'moderate', ...bands.moderate };
  if (tni <= 12) return { band: 'high',     ...bands.high     };
  return           { band: 'critical',  ...bands.critical  };
}

export function calculateItemProfile(ratings, config) {
  const { importance, competence, priority } = ratings;
  const gapScore = calculateGapScore(importance, competence);
  const tni = calculateTNI(importance, competence, priority);
  return { importance, competence, priority, gap_score: gapScore, tni,
           classification: classifyTNI(tni, config.tni_bands) };
}

export function calculateDomainAggregate(itemProfiles) {
  if (!itemProfiles || itemProfiles.length === 0) return null;
  const n = itemProfiles.length;
  const sums = itemProfiles.reduce((acc, item) => ({
    importance: acc.importance + item.importance,
    competence: acc.competence + item.competence,
    priority:   acc.priority   + item.priority,
    gap_score:  acc.gap_score  + item.gap_score,
    tni:        acc.tni        + item.tni,
  }), { importance: 0, competence: 0, priority: 0, gap_score: 0, tni: 0 });
  return {
    mean_importance: round2(sums.importance / n),
    mean_competence: round2(sums.competence / n),
    mean_priority:   round2(sums.priority   / n),
    mean_gap_score:  round2(sums.gap_score  / n),
    mean_tni:        round2(sums.tni        / n),
    item_count: n,
  };
}

export function calculateInstitutionalMatrix(allResponses, domains, config) {
  return domains.map(domain => {
    const domainItems = domain.items.map(item => {
      const responses = allResponses
        .map(r => r.responses?.find(resp => resp.item_id === item.id))
        .filter(Boolean);
      if (responses.length === 0) return null;
      const profiles = responses.map(r =>
        calculateItemProfile({ importance: r.importance, competence: r.competence, priority: r.priority }, config));
      return { item_id: item.id, item_text: item.text, n: responses.length, ...calculateDomainAggregate(profiles) };
    }).filter(Boolean);
    const domainMeanTNI = domainItems.length > 0
      ? round2(domainItems.reduce((s, i) => s + i.mean_tni, 0) / domainItems.length) : 0;
    return {
      domain_id: domain.id, domain_code: domain.code, domain_name: domain.name,
      mean_tni: domainMeanTNI, classification: classifyTNI(domainMeanTNI, config.tni_bands),
      items: domainItems,
    };
  }).sort((a, b) => b.mean_tni - a.mean_tni);
}

export function generatePathwayRecommendations(domainProfiles, pathways, careerTrack) {
  const priorityDomains = domainProfiles
    .filter(d => d.mean_tni >= 5).sort((a, b) => b.mean_tni - a.mean_tni)
    .slice(0, 5).map(d => d.domain_id);
  return pathways
    .filter(p => p.domain_ids.some(id => priorityDomains.includes(id)) &&
                 (!careerTrack || p.career_tracks.includes(careerTrack.id)))
    .map(p => ({
      ...p,
      priority_score: p.domain_ids.reduce((s, id) => {
        const dp = domainProfiles.find(d => d.domain_id === id);
        return s + (dp ? dp.mean_tni : 0);
      }, 0),
      is_mandatory: (careerTrack?.mandatory_pathways || []).includes(p.id),
    }))
    .sort((a, b) => b.priority_score - a.priority_score);
}

function isValidRating(v) { return Number.isInteger(v) && v >= 1 && v <= 5; }
function round2(n)        { return Math.round(n * 100) / 100; }

export default { calculateGapScore, calculateTNI, classifyTNI,
  calculateItemProfile, calculateDomainAggregate,
  calculateInstitutionalMatrix, generatePathwayRecommendations };
