/**
 * Faculty Excellence Platform — Core Scoring Engine
 * 
 * © 2026 Dr. Salma Elnour Rahma Mohamed. All rights reserved.
 * ORCID: 0000-0001-6439-5062
 * 
 * This scoring engine is the proprietary analytical core of the
 * Faculty Excellence Platform. The Gap Score and Training Need Index
 * methodology is an original adaptation for HPE faculty development.
 * 
 * Commercial use requires a licence.
 * See LICENSE file for full terms.
 */

/**
 * Calculate Gap Score for a single item
 * Gap Score = Importance - Current Competence
 * 
 * @param {number} importance - Scale A rating (1-5)
 * @param {number} competence - Scale B rating (1-5)
 * @returns {number} Gap Score (-4 to 4)
 */
export function calculateGapScore(importance, competence) {
  if (!isValidRating(importance) || !isValidRating(competence)) {
    throw new Error('Ratings must be integers between 1 and 5');
  }
  return importance - competence;
}

/**
 * Calculate Training Need Index for a single item
 * TNI = Gap Score × Development Priority
 * 
 * @param {number} importance - Scale A rating (1-5)
 * @param {number} competence - Scale B rating (1-5)
 * @param {number} priority   - Scale C rating (1-5)
 * @returns {number} TNI Score (-20 to 20)
 */
export function calculateTNI(importance, competence, priority) {
  if (!isValidRating(priority)) {
    throw new Error('Priority must be an integer between 1 and 5');
  }
  const gapScore = calculateGapScore(importance, competence);
  return gapScore * priority;
}

/**
 * Classify TNI score into development need band
 * 
 * @param {number} tni - Training Need Index score
 * @param {object} bands - TNI band configuration from institution config
 * @returns {object} Band classification { band, label, color }
 */
export function classifyTNI(tni, bands) {
  if (tni <= 4)  return { band: 'low',      ...bands.low      };
  if (tni <= 8)  return { band: 'moderate', ...bands.moderate };
  if (tni <= 12) return { band: 'high',     ...bands.high     };
  return           { band: 'critical',  ...bands.critical  };
}

/**
 * Calculate complete item-level profile from three ratings
 * 
 * @param {object} ratings - { importance, competence, priority }
 * @param {object} config  - Assessment config with TNI bands
 * @returns {object} Complete item profile
 */
export function calculateItemProfile(ratings, config) {
  const { importance, competence, priority } = ratings;
  const gapScore = calculateGapScore(importance, competence);
  const tni = calculateTNI(importance, competence, priority);
  const classification = classifyTNI(tni, config.tni_bands);
  
  return {
    importance,
    competence,
    priority,
    gap_score: gapScore,
    tni,
    classification,
  };
}

/**
 * Calculate domain-level aggregate from array of item profiles
 * 
 * @param {Array} itemProfiles - Array of item profile objects
 * @returns {object} Domain aggregate
 */
export function calculateDomainAggregate(itemProfiles) {
  if (!itemProfiles || itemProfiles.length === 0) {
    return null;
  }

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
    item_count:      n,
  };
}

/**
 * Calculate full institutional gap matrix from all faculty responses
 * Aggregates by domain across all respondents
 * 
 * @param {Array} allResponses - Array of faculty response objects
 * @param {Array} domains      - Domain configuration array
 * @param {object} config      - Assessment config
 * @returns {Array} Institutional gap matrix sorted by mean TNI descending
 */
export function calculateInstitutionalMatrix(allResponses, domains, config) {
  return domains.map(domain => {
    const domainItems = domain.items.map(item => {
      const itemResponses = allResponses
        .map(r => r.responses?.find(resp => resp.item_id === item.id))
        .filter(Boolean);

      if (itemResponses.length === 0) return null;

      const profiles = itemResponses.map(r =>
        calculateItemProfile(
          { importance: r.importance, competence: r.competence, priority: r.priority },
          config
        )
      );

      return {
        item_id: item.id,
        item_text: item.text,
        n: itemResponses.length,
        ...calculateDomainAggregate(profiles),
      };
    }).filter(Boolean);

    const domainMeanTNI = domainItems.length > 0
      ? round2(domainItems.reduce((s, i) => s + i.mean_tni, 0) / domainItems.length)
      : 0;

    return {
      domain_id:      domain.id,
      domain_code:    domain.code,
      domain_name:    domain.name,
      mean_tni:       domainMeanTNI,
      classification: classifyTNI(domainMeanTNI, config.tni_bands),
      items:          domainItems,
    };
  }).sort((a, b) => b.mean_tni - a.mean_tni);
}

/**
 * Generate PDP pathway recommendations from TNI profile
 * Matches high-TNI domains to available pathways
 * 
 * @param {Array} domainProfiles  - Array of domain aggregates with TNI
 * @param {Array} pathways        - Pathway configuration array
 * @param {object} careerTrack    - Faculty member's career track
 * @returns {Array} Recommended pathways sorted by priority
 */
export function generatePathwayRecommendations(domainProfiles, pathways, careerTrack) {
  const priorityDomains = domainProfiles
    .filter(d => d.mean_tni >= 5)
    .sort((a, b) => b.mean_tni - a.mean_tni)
    .slice(0, 5)
    .map(d => d.domain_id);

  return pathways
    .filter(pathway => {
      const domainMatch = pathway.domain_ids.some(id => priorityDomains.includes(id));
      const trackMatch  = !careerTrack || pathway.career_tracks.includes(careerTrack.id);
      return domainMatch && trackMatch;
    })
    .map(pathway => ({
      ...pathway,
      priority_score: pathway.domain_ids.reduce((score, domainId) => {
        const domainProfile = domainProfiles.find(d => d.domain_id === domainId);
        return score + (domainProfile ? domainProfile.mean_tni : 0);
      }, 0),
      is_mandatory: pathway.career_tracks.includes(careerTrack?.id) &&
                    (careerTrack?.mandatory_pathways || []).includes(pathway.id),
    }))
    .sort((a, b) => b.priority_score - a.priority_score);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isValidRating(value) {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

export default {
  calculateGapScore,
  calculateTNI,
  classifyTNI,
  calculateItemProfile,
  calculateDomainAggregate,
  calculateInstitutionalMatrix,
  generatePathwayRecommendations,
};
