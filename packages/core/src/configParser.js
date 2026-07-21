/**
 * Faculty Excellence Platform — Configuration Parser
 * Validates and parses institutional configuration objects
 * © 2026 Dr. Salma Elnour Rahma Mohamed. All rights reserved.
 */

export function parseConfig(raw) {
  validateConfig(raw);
  return {
    institution: raw.institution,
    framework:   raw.framework,
    assessment:  raw.assessment,
    careerTracks: raw.career_tracks,
    pathways:    raw.pathways,
    policy:      raw.policy,
    evidenceTypes: raw.evidence_types || [],
    organisationalStructure: raw.organisational_structure || {},
  };
}

export function validateConfig(config) {
  const required = ['institution', 'framework', 'assessment', 'career_tracks', 'pathways', 'policy'];
  for (const key of required) {
    if (!config[key]) throw new Error(`Configuration missing required key: ${key}`);
  }
  if (!config.institution.name) throw new Error('Institution name is required');
  if (!config.institution.branding) throw new Error('Institution branding is required');
  return true;
}

export function getInstitutionBranding(config) {
  return config.institution?.branding || {
    primary: '#0D2B5E',
    accent:  '#1A7B8C',
    gold:    '#C9982A',
    background: '#F5F6FA',
    text:    '#1A1A1A',
  };
}
