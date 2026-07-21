/**
 * Faculty Excellence Platform — Onboarding Wizard
 * Seven-step institution setup flow
 * © 2026 Dr. Salma Elnour Rahma Mohamed. All rights reserved.
 */

import { useState } from "react";

const NAVY = "#0D2B5E";
const TEAL = "#1A7B8C";
const GOLD = "#C9982A";
const LGREY = "#F5F6FA";

const STEPS = [
  { id: 1, label: "Institution", icon: "🏛️" },
  { id: 2, label: "Framework",   icon: "🗂️" },
  { id: 3, label: "Instrument",  icon: "📋" },
  { id: 4, label: "Structure",   icon: "🏢" },
  { id: 5, label: "Programmes",  icon: "🎓" },
  { id: 6, label: "Policy",      icon: "⚙️" },
  { id: 7, label: "Launch",      icon: "🚀" },
];

export default function OnboardingWizard({ onComplete }) {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({
    institution: {
      name: "", short_name: "", country: "", city: "",
      type: "university", website: "", accreditation_bodies: [],
      branding: { primary: "#0D2B5E", accent: "#1A7B8C", gold: "#C9982A" },
      logo_url: null,
    },
    framework_choice:   "provided",
    instrument_choice:  "provided",
    colleges: [],
    pathways: [],
    policy: {
      appraisal_linked: false, idp_approval_required: true,
      reassessment_cycle_years: 2, portfolio_ownership: "faculty",
      mandatory_participation: true, minimum_cpd_credits_per_year: 20,
    },
  });

  const update = (section, values) =>
    setConfig(prev => ({ ...prev, [section]: { ...prev[section], ...values } }));

  const next = () => setStep(s => Math.min(s + 1, 7));
  const prev = () => setStep(s => Math.max(s - 1, 1));

  const stepComponents = {
    1: <StepInstitution config={config} update={update} />,
    2: <StepFramework   config={config} update={update} />,
    3: <StepInstrument  config={config} update={update} />,
    4: <StepStructure   config={config} update={update} />,
    5: <StepProgrammes  config={config} update={update} />,
    6: <StepPolicy      config={config} update={update} />,
    7: <StepLaunch      config={config} onComplete={onComplete} />,
  };

  return (
    <div style={{ minHeight: "100vh", background: LGREY, fontFamily: "Arial, sans-serif" }}>

      {/* Header */}
      <div style={{ background: NAVY, color: "white", padding: "20px 40px",
                    display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: "bold", color: "white" }}>Faculty Excellence Platform</div>
          <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 2 }}>Institution Setup Wizard</div>
        </div>
        <div style={{ fontSize: 13, color: GOLD }}>Step {step} of {STEPS.length}</div>
      </div>

      {/* Progress bar */}
      <div style={{ background: "#1E3A6B", height: 4 }}>
        <div style={{ background: GOLD, height: "100%",
                      width: `${(step / STEPS.length) * 100}%`, transition: "width 0.4s ease" }} />
      </div>

      {/* Step tabs */}
      <div style={{ background: "white", borderBottom: "1px solid #E2E8F0",
                    padding: "16px 40px", display: "flex", gap: 8, overflowX: "auto" }}>
        {STEPS.map(s => (
          <button key={s.id}
            onClick={() => s.id < step && setStep(s.id)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 16px", borderRadius: 20, border: "none",
              cursor: s.id < step ? "pointer" : "default",
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

      {/* Content */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px" }}>
        {stepComponents[step]}
        <div style={{ display: "flex", justifyContent: "space-between",
                      marginTop: 40, paddingTop: 24, borderTop: "1px solid #E2E8F0" }}>
          <button onClick={prev} disabled={step === 1}
            style={{ padding: "12px 28px", borderRadius: 8, border: `2px solid ${NAVY}`,
                     background: "white", color: NAVY, fontWeight: "bold", fontSize: 15,
                     cursor: step === 1 ? "not-allowed" : "pointer", opacity: step === 1 ? 0.4 : 1 }}>
            ← Back
          </button>
          {step < 7 && (
            <button onClick={next}
              style={{ padding: "12px 32px", borderRadius: 8, border: "none",
                       background: NAVY, color: "white", fontWeight: "bold",
                       fontSize: 15, cursor: "pointer" }}>
              Continue →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Step 1 ────────────────────────────────────────────────────────────────────
function StepInstitution({ config, update }) {
  const inst = config.institution;
  const set = (k, v) => update("institution", { [k]: v });
  const setBranding = (k, v) => update("institution", { branding: { ...inst.branding, [k]: v } });
  const accredBodies = ["CAA", "WFME", "QAA", "NCAAA", "ACGME", "LCME", "GMC", "Other"];
  const toggleAccred = (body) => {
    const current = inst.accreditation_bodies || [];
    update("institution", {
      accreditation_bodies: current.includes(body) ? current.filter(b => b !== body) : [...current, body]
    });
  };

  return (
    <div>
      <StepHeader icon="🏛️" title="Tell us about your institution"
        subtitle="This information personalises your platform. You can change it at any time in Settings." />
      <Card>
        <FormRow>
          <Field label="Institution Full Name" required>
            <Input value={inst.name} onChange={e => set("name", e.target.value)}
              placeholder="e.g. Your University Name" />
          </Field>
          <Field label="Short Name / Abbreviation" required>
            <Input value={inst.short_name} onChange={e => set("short_name", e.target.value)}
              placeholder="e.g. UNI" />
          </Field>
        </FormRow>
        <FormRow>
          <Field label="Country">
            <Input value={inst.country} onChange={e => set("country", e.target.value)}
              placeholder="e.g. United Arab Emirates" />
          </Field>
          <Field label="City">
            <Input value={inst.city} onChange={e => set("city", e.target.value)}
              placeholder="e.g. Dubai" />
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
          Select all accreditation bodies relevant to your institution.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {accredBodies.map(body => {
            const selected = (inst.accreditation_bodies || []).includes(body);
            return (
              <button key={body} onClick={() => toggleAccred(body)}
                style={{
                  padding: "8px 18px", borderRadius: 20,
                  border: `2px solid ${selected ? TEAL : "#CBD5E1"}`,
                  background: selected ? TEAL : "white",
                  color: selected ? "white" : "#475569",
                  fontWeight: selected ? "bold" : "normal",
                  cursor: "pointer", fontSize: 14, transition: "all 0.2s",
                }}>
                {body}
              </button>
            );
          })}
        </div>
      </Card>

      <Card title="Brand Colours">
        <p style={{ fontSize: 14, color: "#64748B", marginBottom: 16 }}>
          Customise to match your institution's brand identity.
        </p>
        <FormRow>
          <Field label="Primary"><ColourPicker value={inst.branding.primary} onChange={v => setBranding("primary", v)} label="Primary" /></Field>
          <Field label="Accent"> <ColourPicker value={inst.branding.accent}  onChange={v => setBranding("accent",  v)} label="Accent"  /></Field>
          <Field label="Highlight"><ColourPicker value={inst.branding.gold}  onChange={v => setBranding("gold",    v)} label="Highlight" /></Field>
        </FormRow>
        {/* Live preview */}
        <div style={{ marginTop: 20, padding: 20, borderRadius: 10,
                      background: inst.branding.primary, color: "white" }}>
          <div style={{ fontWeight: "bold", fontSize: 16, color: inst.branding.gold }}>
            {inst.name || "Your Institution"}
          </div>
          <div style={{ fontSize: 13, marginTop: 4, color: "rgba(255,255,255,0.8)" }}>
            Faculty Excellence Platform
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <span style={{ background: inst.branding.accent, color: "white",
                           padding: "4px 12px", borderRadius: 12, fontSize: 12 }}>Dashboard</span>
            <span style={{ background: inst.branding.gold, color: inst.branding.primary,
                           padding: "4px 12px", borderRadius: 12, fontSize: 12, fontWeight: "bold" }}>My IDP</span>
          </div>
        </div>
      </Card>

      <Card title="Logo Upload">
        <div style={{ border: "2px dashed #CBD5E1", borderRadius: 10, padding: 32,
                      textAlign: "center", background: LGREY }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
          <div style={{ fontSize: 14, color: "#64748B", marginBottom: 12 }}>
            Upload your institution logo (PNG or SVG recommended)
          </div>
          <input type="file" accept="image/*" id="logo-upload" style={{ display: "none" }}
            onChange={e => {
              const file = e.target.files[0];
              if (file) update("institution", { logo_url: URL.createObjectURL(file), logo_file: file });
            }} />
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

// ── Step 2 ────────────────────────────────────────────────────────────────────
function StepFramework({ config, update }) {
  const options = [
    { id: "provided",  icon: "✅", badge: "Validated & Ready", badgeColor: TEAL,
      title: "Use the provided framework",
      description: "Deploy the validated nine-domain HPE faculty competency framework — evidence-based, psychometrically validated, and aligned with major accreditation standards including WFME and CAA." },
    { id: "customise", icon: "✏️", badge: "Template", badgeColor: GOLD,
      title: "Customise the provided framework",
      description: "Start with the validated nine-domain framework as a template and adapt domain names, descriptors, and items to your institutional context." },
    { id: "scratch",   icon: "🔧", badge: "Advanced", badgeColor: "#94A3B8",
      title: "Build your own framework",
      description: "Define your own competency framework from scratch. Full control over domain names, descriptors, proficiency levels, and all items." },
  ];
  return (
    <div>
      <StepHeader icon="🗂️" title="Choose your competency framework"
        subtitle="The framework defines the domains of faculty excellence your platform will assess and develop." />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {options.map(opt => {
          const selected = config.framework_choice === opt.id;
          return (
            <div key={opt.id} onClick={() => update("framework_choice", opt.id)}
              style={{ padding: 24, borderRadius: 12,
                       border: `2px solid ${selected ? NAVY : "#E2E8F0"}`,
                       background: selected ? "#EEF2FF" : "white",
                       cursor: "pointer", transition: "all 0.2s" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <span style={{ fontSize: 28 }}>{opt.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontWeight: "bold", fontSize: 16, color: NAVY }}>{opt.title}</span>
                    <span style={{ background: opt.badgeColor, color: "white",
                                   padding: "2px 10px", borderRadius: 10, fontSize: 12 }}>{opt.badge}</span>
                  </div>
                  <p style={{ fontSize: 14, color: "#64748B", margin: 0, lineHeight: 1.6 }}>{opt.description}</p>
                </div>
                <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                              border: `2px solid ${selected ? NAVY : "#CBD5E1"}`,
                              background: selected ? NAVY : "white",
                              display: "flex", alignItems: "center", justifyContent: "center" }}>
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

// ── Step 3 ────────────────────────────────────────────────────────────────────
function StepInstrument({ config, update }) {
  const options = [
    { id: "provided",  icon: "✅", badge: "Validated · α = 0.958", badgeColor: TEAL,
      title: "Use the provided instrument",
      description: "Deploy the validated 36-item needs assessment questionnaire — three-scale format (Importance, Competence, Priority) with automatic Gap Score and TNI calculation. Pilot reliability: Cronbach's α = 0.958." },
    { id: "customise", icon: "✏️", badge: "Template", badgeColor: GOLD,
      title: "Customise the provided instrument",
      description: "Use the validated instrument as your template. Edit item wording, add or remove items, and adjust scales while retaining the scoring methodology." },
    { id: "upload",    icon: "📤", badge: "Custom", badgeColor: "#94A3B8",
      title: "Upload your own instrument",
      description: "Upload a custom questionnaire. Your items will be mapped to your framework domains and the TNI scoring engine will be applied automatically." },
  ];
  return (
    <div>
      <StepHeader icon="📋" title="Choose your assessment instrument"
        subtitle="The instrument is the questionnaire your faculty will complete. It generates the gap data that drives everything else." />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {options.map(opt => {
          const selected = config.instrument_choice === opt.id;
          return (
            <div key={opt.id} onClick={() => update("instrument_choice", opt.id)}
              style={{ padding: 24, borderRadius: 12,
                       border: `2px solid ${selected ? NAVY : "#E2E8F0"}`,
                       background: selected ? "#EEF2FF" : "white",
                       cursor: "pointer", transition: "all 0.2s" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <span style={{ fontSize: 28 }}>{opt.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontWeight: "bold", fontSize: 16, color: NAVY }}>{opt.title}</span>
                    <span style={{ background: opt.badgeColor, color: "white",
                                   padding: "2px 10px", borderRadius: 10, fontSize: 12 }}>{opt.badge}</span>
                  </div>
                  <p style={{ fontSize: 14, color: "#64748B", margin: 0, lineHeight: 1.6 }}>{opt.description}</p>
                </div>
                <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                              border: `2px solid ${selected ? NAVY : "#CBD5E1"}`,
                              background: selected ? NAVY : "white",
                              display: "flex", alignItems: "center", justifyContent: "center" }}>
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

// ── Step 4 ────────────────────────────────────────────────────────────────────
function StepStructure({ config, update }) {
  const [newCollege, setNewCollege] = useState("");
  const addCollege = () => {
    if (!newCollege.trim()) return;
    update("colleges", [...(config.colleges || []), {
      id: newCollege.toLowerCase().replace(/\s+/g, "_"),
      name: newCollege.trim(),
      code: newCollege.trim().split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 4),
    }]);
    setNewCollege("");
  };
  return (
    <div>
      <StepHeader icon="🏢" title="Set up your organisational structure"
        subtitle="Add your colleges and departments to enable department and college-level gap analysis." />
      <Card title="Colleges / Faculties">
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <Input value={newCollege} onChange={e => setNewCollege(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addCollege()}
            placeholder="College name — press Enter or click Add" style={{ flex: 1 }} />
          <button onClick={addCollege}
            style={{ padding: "10px 20px", background: TEAL, color: "white", border: "none",
                     borderRadius: 8, cursor: "pointer", fontWeight: "bold", whiteSpace: "nowrap" }}>
            + Add
          </button>
        </div>
        {(config.colleges || []).length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: "#94A3B8",
                        background: LGREY, borderRadius: 8, fontSize: 14 }}>
            No colleges added yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(config.colleges || []).map(c => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                                       padding: "12px 16px", background: LGREY, borderRadius: 8,
                                       border: "1px solid #E2E8F0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ background: NAVY, color: "white", padding: "3px 10px",
                                 borderRadius: 6, fontSize: 12, fontWeight: "bold" }}>{c.code}</span>
                  <span style={{ fontSize: 14, color: NAVY, fontWeight: "500" }}>{c.name}</span>
                </div>
                <button onClick={() => update("colleges", (config.colleges || []).filter(x => x.id !== c.id))}
                  style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: 16 }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Card title="Career Development Tracks">
        <p style={{ fontSize: 14, color: "#64748B", marginBottom: 12 }}>
          Pre-configured career-stage tracks. Customise in Settings after launch.
        </p>
        {[
          { id: "A", name: "New Faculty",    years: "Year 1",    color: TEAL,      desc: "Mandatory induction and foundation development" },
          { id: "B", name: "Early Career",   years: "Years 2–5", color: NAVY,      desc: "Advanced practice development" },
          { id: "C", name: "Mid Career",     years: "Years 6–12",color: GOLD,      desc: "Leadership and scholarship" },
          { id: "D", name: "Senior Faculty", years: "Years 12+", color: "#6B1A6B", desc: "Institutional leadership and mentorship" },
        ].map((t, i) => (
          <div key={t.id} style={{ display: "flex", gap: 14, alignItems: "flex-start",
                                    padding: "12px 0", borderBottom: i < 3 ? "1px solid #F1F5F9" : "none" }}>
            <div style={{ background: t.color, color: "white", borderRadius: 8,
                           padding: "4px 12px", fontWeight: "bold", fontSize: 14, flexShrink: 0 }}>{t.id}</div>
            <div>
              <div style={{ fontWeight: "bold", color: NAVY, fontSize: 14 }}>
                {t.name} <span style={{ fontWeight: "normal", color: "#64748B" }}>· {t.years}</span>
              </div>
              <div style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>{t.desc}</div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── Step 5 ────────────────────────────────────────────────────────────────────
function StepProgrammes({ config, update }) {
  return (
    <div>
      <StepHeader icon="🎓" title="Configure your development programmes"
        subtitle="Pre-loaded with seven evidence-based learning pathways. Customise fully in Settings after launch." />
      <Card title="Learning Pathways">
        {[
          { id: "P1", name: "Teaching Excellence",                domain: "Teaching and Learning",                flagship: false },
          { id: "P2", name: "Assessment Excellence",              domain: "Assessment and Feedback",              flagship: false },
          { id: "P3", name: "Curriculum Leadership",              domain: "Curriculum Development & Quality",     flagship: false },
          { id: "P4", name: "Educational Research & Scholarship", domain: "Research and Scholarship",             flagship: false },
          { id: "P5", name: "Quality & Accreditation Excellence", domain: "Quality, Accreditation & IE",          flagship: true  },
          { id: "P6", name: "Academic Leadership Academy",        domain: "Leadership and Academic Service",      flagship: false },
          { id: "P7", name: "Digital & AI Academy",               domain: "Digital and AI Competence",           flagship: false },
        ].map((p, i) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 14,
                                    padding: "14px 16px", background: i % 2 === 0 ? "white" : LGREY,
                                    borderRadius: 8, border: "1px solid #E2E8F0", marginBottom: 8 }}>
            <span style={{ background: NAVY, color: p.flagship ? GOLD : "white",
                           borderRadius: 8, padding: "4px 10px", fontWeight: "bold",
                           fontSize: 13, flexShrink: 0 }}>{p.id}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: "bold", color: NAVY, fontSize: 14, display: "flex",
                            alignItems: "center", gap: 8 }}>
                {p.name}
                {p.flagship && <span style={{ background: GOLD, color: NAVY, fontSize: 11,
                                              padding: "2px 8px", borderRadius: 8, fontWeight: "bold" }}>⭐ Flagship</span>}
              </div>
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{p.domain}</div>
            </div>
            <span style={{ color: "#22C55E", fontSize: 18 }}>✓</span>
          </div>
        ))}
        <div style={{ marginTop: 8, padding: 14, background: "#EEF2FF",
                      borderRadius: 8, fontSize: 14, color: NAVY }}>
          💡 Add custom pathways, edit modules, and assign facilitators in <strong>Settings → Programmes</strong> after launch.
        </div>
      </Card>
    </div>
  );
}

// ── Step 6 ────────────────────────────────────────────────────────────────────
function StepPolicy({ config, update }) {
  const pol = config.policy;
  const set = (k, v) => update("policy", { [k]: v });
  return (
    <div>
      <StepHeader icon="⚙️" title="Configure platform policies"
        subtitle="These settings control how the platform operates. All can be changed in Settings after launch." />
      <Card title="Assessment Policy">
        <Toggle label="Decouple from Performance Appraisal" recommended
          description="Faculty are explicitly informed their responses will not be linked to appraisal or promotion. Strongly recommended for response validity."
          value={!pol.appraisal_linked} onChange={v => set("appraisal_linked", !v)} />
        <Toggle label="Require Supervisor IDP Approval"
          description="Supervisor must review and approve each faculty member's Individual Development Plan before it is finalised."
          value={pol.idp_approval_required} onChange={v => set("idp_approval_required", v)} />
        <div style={{ marginTop: 16 }}>
          <label style={{ fontWeight: "bold", color: NAVY, fontSize: 14 }}>Reassessment Cycle</label>
          <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 8px" }}>How often should faculty complete the needs assessment?</p>
          <div style={{ display: "flex", gap: 10 }}>
            {[1, 2, 3].map(y => (
              <button key={y} onClick={() => set("reassessment_cycle_years", y)}
                style={{ padding: "10px 20px", borderRadius: 8, fontWeight: "bold", cursor: "pointer",
                         border: `2px solid ${pol.reassessment_cycle_years === y ? NAVY : "#CBD5E1"}`,
                         background: pol.reassessment_cycle_years === y ? NAVY : "white",
                         color: pol.reassessment_cycle_years === y ? "white" : "#475569" }}>
                {y === 1 ? "Annual" : y === 2 ? "Biennial ★" : "Every 3 Years"}
              </button>
            ))}
          </div>
        </div>
      </Card>
      <Card title="Portfolio and Participation">
        <Toggle label="Faculty-Owned Portfolio" recommended
          description="Faculty own their portfolio and can export it at any time. The institution has view and export access while employed."
          value={pol.portfolio_ownership === "faculty"} onChange={v => set("portfolio_ownership", v ? "faculty" : "institution")} />
        <Toggle label="Mandatory Participation"
          description="All eligible faculty are required to complete the needs assessment. Non-completion is flagged in the institutional dashboard."
          value={pol.mandatory_participation} onChange={v => set("mandatory_participation", v)} />
      </Card>
    </div>
  );
}

// ── Step 7 ────────────────────────────────────────────────────────────────────
function StepLaunch({ config, onComplete }) {
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched]   = useState(false);

  const handleLaunch = async () => {
    setLaunching(true);
    await new Promise(r => setTimeout(r, 2000));
    setLaunching(false);
    setLaunched(true);
    if (onComplete) onComplete(config);
  };

  if (launched) return (
    <div style={{ textAlign: "center", padding: "40px 0" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
      <h2 style={{ color: NAVY, marginBottom: 8 }}>{config.institution.name || "Your Platform"} is ready!</h2>
      <p style={{ color: "#64748B", fontSize: 16, marginBottom: 32 }}>Your Faculty Excellence Platform is configured and ready to use.</p>
      <button onClick={() => window.location.href = "/dashboard"}
        style={{ padding: "14px 40px", background: NAVY, color: "white", border: "none",
                 borderRadius: 10, fontSize: 16, fontWeight: "bold", cursor: "pointer" }}>
        Go to Dashboard →
      </button>
    </div>
  );

  const summary = [
    { label: "Institution",       value: config.institution.name || "—" },
    { label: "Country",           value: config.institution.country || "—" },
    { label: "Accreditation",     value: (config.institution.accreditation_bodies || []).join(", ") || "None selected" },
    { label: "Framework",         value: config.framework_choice   === "provided"  ? "Provided (9 domains)" : config.framework_choice   === "customise" ? "Customised" : "Custom" },
    { label: "Instrument",        value: config.instrument_choice  === "provided"  ? "Provided (36 items)"  : config.instrument_choice  === "customise" ? "Customised" : "Custom Upload" },
    { label: "Colleges",          value: config.colleges?.length > 0 ? `${config.colleges.length} added` : "None added" },
    { label: "Appraisal Linked",  value: config.policy.appraisal_linked ? "Yes" : "No (Recommended)" },
    { label: "Portfolio Ownership", value: config.policy.portfolio_ownership === "faculty" ? "Faculty-owned" : "Institution-owned" },
    { label: "Reassessment Cycle", value: `Every ${config.policy.reassessment_cycle_years} year(s)` },
  ];

  return (
    <div>
      <StepHeader icon="🚀" title="Review and launch"
        subtitle="Review your configuration below then launch your Faculty Excellence Platform." />
      <Card title="Configuration Summary">
        {summary.map((item, i) => (
          <div key={item.label} style={{ display: "flex", justifyContent: "space-between",
                                          padding: "12px 0", borderBottom: i < summary.length - 1 ? "1px solid #F1F5F9" : "none" }}>
            <span style={{ fontSize: 14, color: "#64748B" }}>{item.label}</span>
            <span style={{ fontSize: 14, fontWeight: "bold", color: NAVY }}>{item.value}</span>
          </div>
        ))}
      </Card>
      <div style={{ borderRadius: 12, overflow: "hidden", marginBottom: 24, border: "1px solid #E2E8F0" }}>
        <div style={{ background: config.institution.branding?.primary || NAVY, padding: "20px 24px" }}>
          <div style={{ color: config.institution.branding?.gold || GOLD, fontWeight: "bold", fontSize: 18 }}>
            {config.institution.name || "Your Institution"}
          </div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 4 }}>Faculty Excellence Platform</div>
          <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
            <span style={{ background: config.institution.branding?.accent || TEAL, color: "white",
                           padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: "bold" }}>Assessment</span>
            <span style={{ background: config.institution.branding?.gold || GOLD,
                           color: config.institution.branding?.primary || NAVY,
                           padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: "bold" }}>My IDP</span>
          </div>
        </div>
      </div>
      <button onClick={handleLaunch} disabled={launching || !config.institution.name}
        style={{ width: "100%", padding: 16, background: launching ? "#94A3B8" : NAVY,
                 color: "white", border: "none", borderRadius: 10, fontSize: 17,
                 fontWeight: "bold", cursor: launching || !config.institution.name ? "not-allowed" : "pointer" }}>
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

// ── Primitives ────────────────────────────────────────────────────────────────
function StepHeader({ icon, title, subtitle }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>{icon}</div>
      <h2 style={{ color: NAVY, margin: "0 0 8px", fontSize: 24 }}>{title}</h2>
      <p style={{ color: "#64748B", margin: 0, fontSize: 15, lineHeight: 1.6 }}>{subtitle}</p>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background: "white", borderRadius: 12, padding: 24,
                  border: "1px solid #E2E8F0", marginBottom: 20 }}>
      {title && <h3 style={{ color: NAVY, margin: "0 0 16px", fontSize: 16,
                              paddingBottom: 12, borderBottom: `2px solid ${TEAL}` }}>{title}</h3>}
      {children}
    </div>
  );
}

function FormRow({ children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 16, marginBottom: 16 }}>{children}</div>
  );
}

function Field({ label, children, required }) {
  return (
    <div>
      <label style={{ display: "block", fontWeight: "bold", color: NAVY, fontSize: 13, marginBottom: 6 }}>
        {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ style = {}, ...props }) {
  return (
    <input {...props} style={{ width: "100%", padding: "10px 14px", borderRadius: 8,
      border: "1px solid #CBD5E1", fontSize: 14, outline: "none",
      boxSizing: "border-box", fontFamily: "Arial, sans-serif", ...style }} />
  );
}

function Select({ children, ...props }) {
  return (
    <select {...props} style={{ width: "100%", padding: "10px 14px", borderRadius: 8,
      border: "1px solid #CBD5E1", fontSize: 14, background: "white",
      outline: "none", boxSizing: "border-box" }}>{children}</select>
  );
}

function ColourPicker({ value, onChange, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <input type="color" value={value} onChange={e => onChange(e.target.value)}
        style={{ width: 44, height: 44, borderRadius: 8, border: "1px solid #CBD5E1", cursor: "pointer", padding: 2 }} />
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
      <button onClick={() => onChange(!value)}
        style={{ width: 48, height: 26, borderRadius: 13, border: "none", flexShrink: 0,
                 background: value ? TEAL : "#CBD5E1", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
        <span style={{ position: "absolute", top: 3, left: value ? 25 : 3,
                       width: 20, height: 20, background: "white", borderRadius: "50%", transition: "left 0.2s" }} />
      </button>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: "bold", color: NAVY, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
          {label}
          {recommended && <span style={{ background: TEAL, color: "white", fontSize: 11, padding: "2px 8px", borderRadius: 8 }}>Recommended</span>}
        </div>
        <div style={{ fontSize: 13, color: "#64748B", marginTop: 4, lineHeight: 1.5 }}>{description}</div>
      </div>
    </div>
  );
}
