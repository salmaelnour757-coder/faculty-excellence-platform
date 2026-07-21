/**
 * Faculty Excellence Platform — Onboarding Wizard
 * Seven-step institution setup flow
 * 
 * © 2026 Dr. Salma Elnour Rahma Mohamed. All rights reserved.
 */

import { useState } from "react";

// ── Colour tokens (read from config in production) ────────────────────────────
const NAVY = "#0D2B5E";
const TEAL = "#1A7B8C";
const GOLD = "#C9982A";
const LGREY = "#F5F6FA";

const STEPS = [
  { id: 1, label: "Institution",   icon: "🏛️" },
  { id: 2, label: "Framework",     icon: "🗂️" },
  { id: 3, label: "Instrument",    icon: "📋" },
  { id: 4, label: "Structure",     icon: "🏢" },
  { id: 5, label: "Programmes",    icon: "🎓" },
  { id: 6, label: "Policy",        icon: "⚙️" },
  { id: 7, label: "Launch",        icon: "🚀" },
];

// ── Main wizard component ─────────────────────────────────────────────────────
export default function OnboardingWizard({ onComplete }) {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({
    institution: {
      name: "", short_name: "", country: "UAE", city: "",
      type: "university", website: "",
      accreditation_bodies: [],
      branding: { primary: "#0D2B5E", accent: "#1A7B8C", gold: "#C9982A" },
      logo_url: null,
    },
    framework_choice: "gmu_fcf",   // gmu_fcf | customise | scratch
    instrument_choice: "gmu_fcdnaq", // gmu_fcdnaq | customise | upload
    colleges: [],
    pathways: [],
    policy: {
      appraisal_linked: false,
      idp_approval_required: true,
      reassessment_cycle_years: 2,
      portfolio_ownership: "faculty",
      mandatory_participation: true,
      minimum_cpd_credits_per_year: 20,
    },
  });

  const update = (section, values) =>
    setConfig(prev => ({ ...prev, [section]: { ...prev[section], ...values } }));

  const next = () => setStep(s => Math.min(s + 1, 7));
  const prev = () => setStep(s => Math.max(s - 1, 1));

  const stepComponents = {
    1: <StepInstitution config={config} update={update} />,
    2: <StepFramework config={config} update={update} />,
    3: <StepInstrument config={config} update={update} />,
    4: <StepStructure config={config} update={update} />,
    5: <StepProgrammes config={config} update={update} />,
    6: <StepPolicy config={config} update={update} />,
    7: <StepLaunch config={config} onComplete={onComplete} />,
  };

  return (
    <div style={{ minHeight: "100vh", background: LGREY, fontFamily: "Arial, sans-serif" }}>

      {/* Header */}
      <div style={{ background: NAVY, color: "white", padding: "20px 40px",
                    display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: "bold", color: "white" }}>
            Faculty Excellence Platform
          </div>
          <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 2 }}>
            Institution Setup Wizard
          </div>
        </div>
        <div style={{ fontSize: 13, color: GOLD }}>
          Step {step} of {STEPS.length}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ background: "#1E3A6B", height: 4 }}>
        <div style={{ background: GOLD, height: "100%",
                      width: `${(step / STEPS.length) * 100}%`,
                      transition: "width 0.4s ease" }} />
      </div>

      {/* Step navigation */}
      <div style={{ background: "white", borderBottom: `1px solid #E2E8F0`,
                    padding: "16px 40px", display: "flex", gap: 8, overflowX: "auto" }}>
        {STEPS.map(s => (
          <button
            key={s.id}
            onClick={() => s.id < step && setStep(s.id)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 16px", borderRadius: 20, border: "none", cursor: s.id < step ? "pointer" : "default",
              background: step === s.id ? NAVY : s.id < step ? TEAL : "#F1F5F9",
              color: step === s.id || s.id < step ? "white" : "#64748B",
              fontWeight: step === s.id ? "bold" : "normal",
              fontSize: 13, whiteSpace: "nowrap", transition: "all 0.2s",
            }}>
            <span>{s.icon}</span>
            <span>{s.label}</span>
            {s.id < step && <span style={{ color: GOLD }}>✓</span>}
          </button>
        ))}
      </div>

      {/* Step content */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px" }}>
        {stepComponents[step]}

        {/* Navigation buttons */}
        <div style={{ display: "flex", justifyContent: "space-between",
                      marginTop: 40, paddingTop: 24, borderTop: `1px solid #E2E8F0` }}>
          <button
            onClick={prev}
            disabled={step === 1}
            style={{
              padding: "12px 28px", borderRadius: 8, border: `2px solid ${NAVY}`,
              background: "white", color: NAVY, fontWeight: "bold", fontSize: 15,
              cursor: step === 1 ? "not-allowed" : "pointer",
              opacity: step === 1 ? 0.4 : 1,
            }}>
            ← Back
          </button>

          {step < 7 ? (
            <button
              onClick={next}
              style={{
                padding: "12px 32px", borderRadius: 8, border: "none",
                background: NAVY, color: "white", fontWeight: "bold", fontSize: 15,
                cursor: "pointer",
              }}>
              Continue →
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ── Step 1: Institution Identity ──────────────────────────────────────────────
function StepInstitution({ config, update }) {
  const inst = config.institution;
  const set = (k, v) => update("institution", { [k]: v });
  const setBranding = (k, v) =>
    update("institution", { branding: { ...inst.branding, [k]: v } });

  const accredBodies = ["CAA", "WFME", "QAA", "NCAAA", "ACGME", "LCME", "GMC", "Other"];

  const toggleAccred = (body) => {
    const current = inst.accreditation_bodies || [];
    const updated = current.includes(body)
      ? current.filter(b => b !== body)
      : [...current, body];
    update("institution", { accreditation_bodies: updated });
  };

  return (
    <div>
      <StepHeader
        icon="🏛️"
        title="Tell us about your institution"
        subtitle="This information will be used to personalise your platform. You can change it at any time in settings."
      />

      <Card>
        <FormRow>
          <Field label="Institution Full Name *" required>
            <Input value={inst.name} onChange={e => set("name", e.target.value)}
              placeholder="e.g. Gulf Medical University" />
          </Field>
          <Field label="Short Name / Abbreviation *" required>
            <Input value={inst.short_name} onChange={e => set("short_name", e.target.value)}
              placeholder="e.g. GMU" />
          </Field>
        </FormRow>

        <FormRow>
          <Field label="Country *" required>
            <Select value={inst.country} onChange={e => set("country", e.target.value)}>
              {["UAE", "Saudi Arabia", "Qatar", "Kuwait", "Bahrain", "Oman",
                "Egypt", "Jordan", "Lebanon", "Pakistan", "Malaysia", "Other"].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="City">
            <Input value={inst.city} onChange={e => set("city", e.target.value)}
              placeholder="e.g. Ajman" />
          </Field>
        </FormRow>

        <FormRow>
          <Field label="Institution Type">
            <Select value={inst.type} onChange={e => set("type", e.target.value)}>
              <option value="university">University</option>
              <option value="medical_school">Medical School</option>
              <option value="college">College / Institute</option>
              <option value="hospital_based">Hospital-Based</option>
            </Select>
          </Field>
          <Field label="Website">
            <Input value={inst.website} onChange={e => set("website", e.target.value)}
              placeholder="https://your-institution.edu" />
          </Field>
        </FormRow>
      </Card>

      <Card title="Accreditation Bodies">
        <p style={{ fontSize: 14, color: "#64748B", marginBottom: 16 }}>
          Select all accreditation bodies relevant to your institution. This helps map your competency framework to accreditation evidence requirements.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {accredBodies.map(body => {
            const selected = (inst.accreditation_bodies || []).includes(body);
            return (
              <button
                key={body}
                onClick={() => toggleAccred(body)}
                style={{
                  padding: "8px 18px", borderRadius: 20, border: `2px solid ${selected ? TEAL : "#CBD5E1"}`,
                  background: selected ? TEAL : "white", color: selected ? "white" : "#475569",
                  fontWeight: selected ? "bold" : "normal", cursor: "pointer", fontSize: 14,
                  transition: "all 0.2s",
                }}>
                {body}
              </button>
            );
          })}
        </div>
      </Card>

      <Card title="Brand Colours">
        <p style={{ fontSize: 14, color: "#64748B", marginBottom: 16 }}>
          Your platform will use these colours throughout. The defaults are the Faculty Excellence Platform colours — change them to match your institution's brand.
        </p>
        <FormRow>
          <Field label="Primary Colour">
            <ColourPicker value={inst.branding.primary}
              onChange={v => setBranding("primary", v)} label="Primary" />
          </Field>
          <Field label="Accent Colour">
            <ColourPicker value={inst.branding.accent}
              onChange={v => setBranding("accent", v)} label="Accent" />
          </Field>
          <Field label="Highlight Colour">
            <ColourPicker value={inst.branding.gold}
              onChange={v => setBranding("gold", v)} label="Highlight" />
          </Field>
        </FormRow>

        {/* Preview */}
        <div style={{ marginTop: 20, padding: 20, borderRadius: 10,
                      background: inst.branding.primary, color: "white" }}>
          <div style={{ fontWeight: "bold", fontSize: 16, color: inst.branding.gold }}>
            {inst.name || "Your Institution Name"}
          </div>
          <div style={{ fontSize: 13, marginTop: 4, color: "rgba(255,255,255,0.8)" }}>
            Faculty Excellence Platform
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <span style={{ background: inst.branding.accent, color: "white",
                           padding: "4px 12px", borderRadius: 12, fontSize: 12 }}>
              Active
            </span>
            <span style={{ background: inst.branding.gold, color: inst.branding.primary,
                           padding: "4px 12px", borderRadius: 12, fontSize: 12, fontWeight: "bold" }}>
              Preview
            </span>
          </div>
        </div>
      </Card>

      <Card title="Logo Upload">
        <div style={{ border: `2px dashed #CBD5E1`, borderRadius: 10, padding: 32,
                      textAlign: "center", background: LGREY }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
          <div style={{ fontSize: 14, color: "#64748B", marginBottom: 12 }}>
            Upload your institution logo (PNG or SVG recommended)
          </div>
          <input type="file" accept="image/*"
            onChange={e => {
              const file = e.target.files[0];
              if (file) {
                const url = URL.createObjectURL(file);
                update("institution", { logo_url: url, logo_file: file });
              }
            }}
            style={{ display: "none" }} id="logo-upload" />
          <label htmlFor="logo-upload"
            style={{ padding: "10px 24px", background: NAVY, color: "white",
                     borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: "bold" }}>
            Choose File
          </label>
          {inst.logo_url && (
            <div style={{ marginTop: 16 }}>
              <img src={inst.logo_url} alt="Logo preview"
                style={{ maxHeight: 80, maxWidth: 200, objectFit: "contain" }} />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// ── Step 2: Competency Framework ──────────────────────────────────────────────
function StepFramework({ config, update }) {
  const options = [
    {
      id: "gmu_fcf",
      title: "Use the GMU-FCF",
      subtitle: "Recommended",
      description: "Deploy the validated GMU Faculty Competency Framework — nine evidence-based domains covering the full scope of HPE faculty excellence. Psychometrically validated and accreditation-aligned.",
      icon: "✅",
      badge: "Validated & Ready",
      badgeColor: TEAL,
    },
    {
      id: "customise",
      title: "Customise the GMU-FCF",
      description: "Start with the GMU-FCF as your template and adapt domain names, descriptors, and items to your institutional context. Preserves the validated structure while allowing local tailoring.",
      icon: "✏️",
      badge: "Template",
      badgeColor: GOLD,
    },
    {
      id: "scratch",
      title: "Build from Scratch",
      description: "Define your own competency framework from the ground up. You control domain names, descriptors, proficiency levels, and all items. Requires the most setup but offers complete flexibility.",
      icon: "🔧",
      badge: "Advanced",
      badgeColor: "#94A3B8",
    },
  ];

  return (
    <div>
      <StepHeader
        icon="🗂️"
        title="Choose your competency framework"
        subtitle="The competency framework defines the domains of faculty excellence your platform will assess and develop."
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {options.map(opt => {
          const selected = config.framework_choice === opt.id;
          return (
            <div
              key={opt.id}
              onClick={() => update("framework_choice", opt.id)}
              style={{
                padding: 24, borderRadius: 12,
                border: `2px solid ${selected ? NAVY : "#E2E8F0"}`,
                background: selected ? "#EEF2FF" : "white",
                cursor: "pointer", transition: "all 0.2s",
              }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <span style={{ fontSize: 28 }}>{opt.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontWeight: "bold", fontSize: 16, color: NAVY }}>{opt.title}</span>
                    <span style={{ background: opt.badgeColor, color: "white",
                                   padding: "2px 10px", borderRadius: 10, fontSize: 12 }}>
                      {opt.badge}
                    </span>
                  </div>
                  <p style={{ fontSize: 14, color: "#64748B", margin: 0, lineHeight: 1.6 }}>
                    {opt.description}
                  </p>
                </div>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  border: `2px solid ${selected ? NAVY : "#CBD5E1"}`,
                  background: selected ? NAVY : "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {selected && <span style={{ color: "white", fontSize: 12 }}>✓</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {config.framework_choice === "gmu_fcf" && (
        <Card title="GMU-FCF — Nine Domains" style={{ marginTop: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
            {[
              { n: 1, name: "Teaching and Learning" },
              { n: 2, name: "Assessment and Feedback" },
              { n: 3, name: "Digital and AI Competence" },
              { n: 4, name: "Curriculum Development" },
              { n: 5, name: "Research and Scholarship" },
              { n: 6, name: "Clinical and Professional Practice" },
              { n: 7, name: "Quality, Accreditation & IE" },
              { n: 8, name: "Leadership and Academic Service" },
              { n: 9, name: "Professional Values & Scholarly Citizenship" },
            ].map(d => (
              <div key={d.n} style={{ padding: "10px 14px", borderRadius: 8,
                                      background: LGREY, border: `1px solid #E2E8F0`,
                                      display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ background: TEAL, color: "white", borderRadius: "50%",
                                width: 26, height: 26, display: "flex", alignItems: "center",
                                justifyContent: "center", fontSize: 12, fontWeight: "bold",
                                flexShrink: 0 }}>
                  {d.n}
                </span>
                <span style={{ fontSize: 13, color: NAVY, fontWeight: "500" }}>{d.name}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Step 3: Assessment Instrument ─────────────────────────────────────────────
function StepInstrument({ config, update }) {
  const options = [
    {
      id: "gmu_fcdnaq",
      title: "Use the GMU-FCDNAQ",
      subtitle: "Recommended",
      description: "The validated GMU Faculty Competency and Development Needs Assessment Questionnaire — 36 items across nine domains, three-scale format (Importance, Competence, Priority), with automatic Gap Score and TNI calculation. Pilot reliability: Cronbach's α = 0.958.",
      icon: "✅",
      badge: "Validated · α = 0.958",
      badgeColor: TEAL,
    },
    {
      id: "customise",
      title: "Customise the GMU-FCDNAQ",
      description: "Use the GMU-FCDNAQ as your template. Edit item wording, add or remove items, and adjust scales while retaining the validated framework structure and scoring methodology.",
      icon: "✏️",
      badge: "Template",
      badgeColor: GOLD,
    },
    {
      id: "upload",
      title: "Upload Your Own Instrument",
      description: "Upload a custom questionnaire in our template format. Your items will be mapped to your framework domains and the TNI scoring engine will be applied automatically.",
      icon: "📤",
      badge: "Custom",
      badgeColor: "#94A3B8",
    },
  ];

  return (
    <div>
      <StepHeader
        icon="📋"
        title="Choose your assessment instrument"
        subtitle="The assessment instrument is the questionnaire your faculty will complete. It generates the competency gap data that drives everything else."
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {options.map(opt => {
          const selected = config.instrument_choice === opt.id;
          return (
            <div
              key={opt.id}
              onClick={() => update("instrument_choice", opt.id)}
              style={{
                padding: 24, borderRadius: 12,
                border: `2px solid ${selected ? NAVY : "#E2E8F0"}`,
                background: selected ? "#EEF2FF" : "white",
                cursor: "pointer", transition: "all 0.2s",
              }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <span style={{ fontSize: 28 }}>{opt.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontWeight: "bold", fontSize: 16, color: NAVY }}>{opt.title}</span>
                    <span style={{ background: opt.badgeColor, color: "white",
                                   padding: "2px 10px", borderRadius: 10, fontSize: 12 }}>
                      {opt.badge}
                    </span>
                  </div>
                  <p style={{ fontSize: 14, color: "#64748B", margin: 0, lineHeight: 1.6 }}>
                    {opt.description}
                  </p>
                </div>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  border: `2px solid ${selected ? NAVY : "#CBD5E1"}`,
                  background: selected ? NAVY : "white",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  {selected && <span style={{ color: "white", fontSize: 12 }}>✓</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 4: Organisational Structure ─────────────────────────────────────────
function StepStructure({ config, update }) {
  const [newCollege, setNewCollege] = useState("");

  const addCollege = () => {
    if (!newCollege.trim()) return;
    const colleges = [...(config.colleges || []), {
      id: newCollege.toLowerCase().replace(/\s+/g, "_"),
      name: newCollege.trim(),
      code: newCollege.trim().split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 4),
    }];
    update("colleges", colleges);
    setNewCollege("");
  };

  const removeCollege = (id) => {
    update("colleges", (config.colleges || []).filter(c => c.id !== id));
  };

  return (
    <div>
      <StepHeader
        icon="🏢"
        title="Set up your organisational structure"
        subtitle="Add your colleges and departments. This enables department-level and college-level gap analysis and reporting."
      />

      <Card title="Colleges / Faculties">
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <Input
            value={newCollege}
            onChange={e => setNewCollege(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addCollege()}
            placeholder="Enter college name and press Enter or Add"
            style={{ flex: 1 }}
          />
          <button
            onClick={addCollege}
            style={{ padding: "10px 20px", background: TEAL, color: "white",
                     border: "none", borderRadius: 8, cursor: "pointer",
                     fontWeight: "bold", fontSize: 14, whiteSpace: "nowrap" }}>
            + Add
          </button>
        </div>

        {(config.colleges || []).length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: "#94A3B8",
                        background: LGREY, borderRadius: 8, fontSize: 14 }}>
            No colleges added yet. Add your first college above.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(config.colleges || []).map(college => (
              <div key={college.id}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                         padding: "12px 16px", background: LGREY, borderRadius: 8,
                         border: "1px solid #E2E8F0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ background: NAVY, color: "white", padding: "3px 10px",
                                 borderRadius: 6, fontSize: 12, fontWeight: "bold" }}>
                    {college.code}
                  </span>
                  <span style={{ fontSize: 14, color: NAVY, fontWeight: "500" }}>
                    {college.name}
                  </span>
                </div>
                <button
                  onClick={() => removeCollege(college.id)}
                  style={{ background: "none", border: "none", color: "#EF4444",
                           cursor: "pointer", fontSize: 16 }}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Faculty Ranks">
        <p style={{ fontSize: 14, color: "#64748B", marginBottom: 0 }}>
          The following standard HPE ranks are pre-configured. You can customise these in Settings after launch.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {["Professor", "Associate Professor", "Assistant Professor", "Lecturer", "Clinical Faculty"].map(rank => (
            <span key={rank} style={{ padding: "6px 14px", background: LGREY,
                                      border: `1px solid #CBD5E1`, borderRadius: 20,
                                      fontSize: 13, color: NAVY }}>
              {rank}
            </span>
          ))}
        </div>
      </Card>

      <Card title="Career Development Tracks">
        <p style={{ fontSize: 14, color: "#64748B", marginBottom: 12 }}>
          Pre-configured career-stage tracks based on the GMU model. Customise track names and criteria in Settings.
        </p>
        {[
          { id: "A", name: "New Faculty", years: "Year 1", color: TEAL, desc: "Mandatory induction and foundation development" },
          { id: "B", name: "Early Career", years: "Years 2–5", color: NAVY, desc: "Advanced teaching, assessment excellence, research introduction" },
          { id: "C", name: "Mid Career", years: "Years 6–12", color: GOLD, desc: "Curriculum leadership, scholarship, mentorship training" },
          { id: "D", name: "Senior Faculty", years: "Years 12+", color: "#6B1A6B", desc: "Academic leadership, accreditation leadership, faculty coaching" },
        ].map(track => (
          <div key={track.id} style={{ display: "flex", gap: 14, alignItems: "flex-start",
                                       padding: "12px 0", borderBottom: "1px solid #F1F5F9" }}>
            <div style={{ background: track.color, color: "white", borderRadius: 8,
                           padding: "4px 12px", fontWeight: "bold", fontSize: 14,
                           flexShrink: 0, minWidth: 56, textAlign: "center" }}>
              {track.id}
            </div>
            <div>
              <div style={{ fontWeight: "bold", color: NAVY, fontSize: 14 }}>
                {track.name} <span style={{ fontWeight: "normal", color: "#64748B" }}>· {track.years}</span>
              </div>
              <div style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>{track.desc}</div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── Step 5: Programmes ────────────────────────────────────────────────────────
function StepProgrammes({ config, update }) {
  const defaultPathways = [
    { id: "P1", name: "Teaching Excellence", domain: "Domain 1", flagship: false },
    { id: "P2", name: "Assessment Excellence", domain: "Domain 2", flagship: false },
    { id: "P3", name: "Curriculum Leadership", domain: "Domains 4 & 7", flagship: false },
    { id: "P4", name: "Educational Research & Scholarship", domain: "Domain 5", flagship: false },
    { id: "P5", name: "Quality & Accreditation Excellence", domain: "Domain 7", flagship: true },
    { id: "P6", name: "Academic Leadership Academy", domain: "Domain 8", flagship: false },
    { id: "P7", name: "Digital & AI Academy", domain: "Domain 3", flagship: false },
  ];

  return (
    <div>
      <StepHeader
        icon="🎓"
        title="Configure your development programmes"
        subtitle="These are the learning pathways your platform will recommend and track. Pre-loaded with the GMU FDP seven pathways — customise fully in Settings after launch."
      />

      <Card title="Faculty Development Pathways">
        <p style={{ fontSize: 14, color: "#64748B", marginBottom: 16 }}>
          The following pathways are pre-configured from the GMU Faculty Development Program. Each pathway is mapped to one or more competency domains and generates a certificate on completion.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {defaultPathways.map((p, i) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 14,
                                      padding: "14px 16px", background: i % 2 === 0 ? "white" : LGREY,
                                      borderRadius: 8, border: "1px solid #E2E8F0" }}>
              <span style={{ background: NAVY, color: p.flagship ? GOLD : "white",
                             borderRadius: 8, padding: "4px 10px", fontWeight: "bold",
                             fontSize: 13, flexShrink: 0 }}>
                {p.id}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold", color: NAVY, fontSize: 14, display: "flex",
                              alignItems: "center", gap: 8 }}>
                  {p.name}
                  {p.flagship && (
                    <span style={{ background: GOLD, color: NAVY, fontSize: 11,
                                   padding: "2px 8px", borderRadius: 8, fontWeight: "bold" }}>
                      ⭐ Flagship
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{p.domain}</div>
              </div>
              <span style={{ color: "#22C55E", fontSize: 18 }}>✓</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, padding: 14, background: "#EEF2FF",
                      borderRadius: 8, fontSize: 14, color: NAVY }}>
          💡 You can add custom pathways, edit modules, set CPD credit values, and assign facilitators from <strong>Settings → Programmes</strong> after launch.
        </div>
      </Card>
    </div>
  );
}

// ── Step 6: Policy ────────────────────────────────────────────────────────────
function StepPolicy({ config, update }) {
  const p = config.policy;
  const set = (k, v) => update("policy", { [k]: v });

  return (
    <div>
      <StepHeader
        icon="⚙️"
        title="Configure platform policies"
        subtitle="These settings control how the platform operates for your institution. All can be changed in Settings after launch."
      />

      <Card title="Assessment Policy">
        <Toggle
          label="Decouple from Performance Appraisal"
          description="Faculty are explicitly informed their self-assessment responses will not be linked to annual appraisal or promotion decisions. Strongly recommended for response validity."
          value={!p.appraisal_linked}
          onChange={v => set("appraisal_linked", !v)}
          recommended={true}
        />
        <Toggle
          label="Require Supervisor IDP Approval"
          description="Supervisor must review and approve each faculty member's Individual Development Plan before it is finalised."
          value={p.idp_approval_required}
          onChange={v => set("idp_approval_required", v)}
        />
        <div style={{ marginTop: 16 }}>
          <label style={{ fontWeight: "bold", color: NAVY, fontSize: 14 }}>
            Reassessment Cycle
          </label>
          <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 8px" }}>
            How often should faculty complete the needs assessment?
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            {[1, 2, 3].map(y => (
              <button key={y} onClick={() => set("reassessment_cycle_years", y)}
                style={{ padding: "10px 20px", borderRadius: 8,
                         border: `2px solid ${p.reassessment_cycle_years === y ? NAVY : "#CBD5E1"}`,
                         background: p.reassessment_cycle_years === y ? NAVY : "white",
                         color: p.reassessment_cycle_years === y ? "white" : "#475569",
                         fontWeight: "bold", cursor: "pointer" }}>
                {y === 1 ? "Annual" : y === 2 ? "Biennial (Recommended)" : "Every 3 Years"}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card title="Portfolio Policy">
        <Toggle
          label="Faculty-Owned Portfolio"
          description="Faculty own their portfolio and can export or transfer it at any time. The institution has view and export access while the faculty member is employed. Recommended for faculty trust and genuine engagement."
          value={p.portfolio_ownership === "faculty"}
          onChange={v => set("portfolio_ownership", v ? "faculty" : "institution")}
          recommended={true}
        />
        <Toggle
          label="Mandatory Participation"
          description="All eligible faculty are required to complete the annual needs assessment. Non-completion flagged in the institutional dashboard."
          value={p.mandatory_participation}
          onChange={v => set("mandatory_participation", v)}
        />
      </Card>

      <Card title="Minimum CPD Credits per Year">
        <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 12px" }}>
          Minimum CPD credits faculty should earn annually through development activities.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <input type="range" min={0} max={60} step={5}
            value={p.minimum_cpd_credits_per_year}
            onChange={e => set("minimum_cpd_credits_per_year", parseInt(e.target.value))}
            style={{ flex: 1 }} />
          <span style={{ background: NAVY, color: "white", padding: "6px 14px",
                         borderRadius: 8, fontWeight: "bold", fontSize: 16, minWidth: 60,
                         textAlign: "center" }}>
            {p.minimum_cpd_credits_per_year}
          </span>
        </div>
      </Card>
    </div>
  );
}

// ── Step 7: Launch ────────────────────────────────────────────────────────────
function StepLaunch({ config, onComplete }) {
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched] = useState(false);

  const handleLaunch = async () => {
    setLaunching(true);
    // Simulate setup (in production: API call to provision tenant)
    await new Promise(r => setTimeout(r, 2000));
    setLaunching(false);
    setLaunched(true);
    if (onComplete) onComplete(config);
  };

  if (launched) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <h2 style={{ color: NAVY, marginBottom: 8 }}>
          {config.institution.name || "Your Institution"} is ready!
        </h2>
        <p style={{ color: "#64748B", fontSize: 16, marginBottom: 32 }}>
          Your Faculty Excellence Platform has been configured and is ready to use.
        </p>
        <button
          onClick={() => window.location.href = "/dashboard"}
          style={{ padding: "14px 40px", background: NAVY, color: "white",
                   border: "none", borderRadius: 10, fontSize: 16,
                   fontWeight: "bold", cursor: "pointer" }}>
          Go to Dashboard →
        </button>
      </div>
    );
  }

  const summaryItems = [
    { label: "Institution", value: config.institution.name || "—" },
    { label: "Country", value: config.institution.country },
    { label: "Accreditation", value: (config.institution.accreditation_bodies || []).join(", ") || "None selected" },
    { label: "Framework", value: config.framework_choice === "gmu_fcf" ? "GMU-FCF (9 domains)" : config.framework_choice === "customise" ? "Customised GMU-FCF" : "Custom Framework" },
    { label: "Instrument", value: config.instrument_choice === "gmu_fcdnaq" ? "GMU-FCDNAQ (36 items)" : config.instrument_choice === "customise" ? "Customised FCDNAQ" : "Custom Instrument" },
    { label: "Colleges", value: config.colleges?.length > 0 ? `${config.colleges.length} college(s)` : "None added" },
    { label: "Pathways", value: "7 GMU FDP pathways (pre-loaded)" },
    { label: "Appraisal Linked", value: config.policy.appraisal_linked ? "Yes" : "No (Recommended)" },
    { label: "Portfolio Ownership", value: config.policy.portfolio_ownership === "faculty" ? "Faculty-owned" : "Institution-owned" },
    { label: "Reassessment Cycle", value: `Every ${config.policy.reassessment_cycle_years} year(s)` },
  ];

  return (
    <div>
      <StepHeader
        icon="🚀"
        title="Review and launch"
        subtitle="Everything looks good. Review your configuration below and launch your Faculty Excellence Platform."
      />

      <Card title="Configuration Summary">
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {summaryItems.map((item, i) => (
            <div key={item.label}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                       padding: "12px 0", borderBottom: i < summaryItems.length - 1 ? "1px solid #F1F5F9" : "none" }}>
              <span style={{ fontSize: 14, color: "#64748B" }}>{item.label}</span>
              <span style={{ fontSize: 14, fontWeight: "bold", color: NAVY }}>{item.value}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Colour preview */}
      <div style={{ borderRadius: 12, overflow: "hidden", marginBottom: 24,
                    border: "1px solid #E2E8F0" }}>
        <div style={{ background: config.institution.branding?.primary || NAVY,
                      padding: "20px 24px" }}>
          <div style={{ color: config.institution.branding?.gold || GOLD,
                        fontWeight: "bold", fontSize: 18 }}>
            {config.institution.name || "Your Institution"}
          </div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 4 }}>
            Faculty Excellence Platform · Platform Preview
          </div>
          <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
            <span style={{ background: config.institution.branding?.accent || TEAL,
                           color: "white", padding: "6px 16px", borderRadius: 20,
                           fontSize: 13, fontWeight: "bold" }}>
              Assessment
            </span>
            <span style={{ background: config.institution.branding?.gold || GOLD,
                           color: config.institution.branding?.primary || NAVY,
                           padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: "bold" }}>
              My IDP
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={handleLaunch}
        disabled={launching || !config.institution.name}
        style={{
          width: "100%", padding: "16px", background: launching ? "#94A3B8" : NAVY,
          color: "white", border: "none", borderRadius: 10, fontSize: 17,
          fontWeight: "bold", cursor: launching || !config.institution.name ? "not-allowed" : "pointer",
          transition: "all 0.2s",
        }}>
        {launching ? "⏳ Setting up your platform..." : "🚀 Launch Faculty Excellence Platform"}
      </button>

      {!config.institution.name && (
        <p style={{ textAlign: "center", color: "#EF4444", fontSize: 13, marginTop: 8 }}>
          Please enter your institution name in Step 1 before launching.
        </p>
      )}
    </div>
  );
}

// ── Shared UI primitives ──────────────────────────────────────────────────────

function StepHeader({ icon, title, subtitle }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>{icon}</div>
      <h2 style={{ color: NAVY, margin: "0 0 8px", fontSize: 24 }}>{title}</h2>
      <p style={{ color: "#64748B", margin: 0, fontSize: 15, lineHeight: 1.6 }}>{subtitle}</p>
    </div>
  );
}

function Card({ title, children, style = {} }) {
  return (
    <div style={{ background: "white", borderRadius: 12, padding: 24,
                  border: "1px solid #E2E8F0", marginBottom: 20, ...style }}>
      {title && (
        <h3 style={{ color: NAVY, margin: "0 0 16px", fontSize: 16,
                     paddingBottom: 12, borderBottom: `2px solid ${TEAL}` }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

function FormRow({ children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 16, marginBottom: 16 }}>
      {children}
    </div>
  );
}

function Field({ label, children, required }) {
  return (
    <div>
      <label style={{ display: "block", fontWeight: "bold", color: NAVY,
                      fontSize: 13, marginBottom: 6 }}>
        {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ style = {}, ...props }) {
  return (
    <input
      {...props}
      style={{
        width: "100%", padding: "10px 14px", borderRadius: 8,
        border: "1px solid #CBD5E1", fontSize: 14, color: "#1A1A1A",
        outline: "none", boxSizing: "border-box",
        fontFamily: "Arial, sans-serif", ...style,
      }}
    />
  );
}

function Select({ children, ...props }) {
  return (
    <select
      {...props}
      style={{ width: "100%", padding: "10px 14px", borderRadius: 8,
               border: "1px solid #CBD5E1", fontSize: 14, color: "#1A1A1A",
               background: "white", outline: "none", boxSizing: "border-box" }}>
      {children}
    </select>
  );
}

function ColourPicker({ value, onChange, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <input type="color" value={value} onChange={e => onChange(e.target.value)}
        style={{ width: 44, height: 44, borderRadius: 8, border: "1px solid #CBD5E1",
                 cursor: "pointer", padding: 2 }} />
      <div>
        <div style={{ fontSize: 12, color: "#64748B" }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: "bold", color: NAVY }}>{value}</div>
      </div>
    </div>
  );
}

function Toggle({ label, description, value, onChange, recommended }) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start",
                  padding: "14px 0", borderBottom: "1px solid #F1F5F9" }}>
      <div>
        <button
          onClick={() => onChange(!value)}
          style={{
            width: 48, height: 26, borderRadius: 13, border: "none",
            background: value ? TEAL : "#CBD5E1", cursor: "pointer",
            position: "relative", transition: "background 0.2s",
          }}>
          <span style={{
            position: "absolute", top: 3,
            left: value ? 25 : 3, width: 20, height: 20,
            background: "white", borderRadius: "50%", transition: "left 0.2s",
          }} />
        </button>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: "bold", color: NAVY, fontSize: 14,
                      display: "flex", alignItems: "center", gap: 8 }}>
          {label}
          {recommended && (
            <span style={{ background: TEAL, color: "white", fontSize: 11,
                           padding: "2px 8px", borderRadius: 8 }}>
              Recommended
            </span>
          )}
        </div>
        <div style={{ fontSize: 13, color: "#64748B", marginTop: 4, lineHeight: 1.5 }}>
          {description}
        </div>
      </div>
    </div>
  );
}
