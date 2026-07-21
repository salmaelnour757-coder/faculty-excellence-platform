import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Assessment({ institution, currentUser, setScreen }) {
  const [domains, setDomains]             = useState([])
  const [items, setItems]                 = useState([])
  const [ratings, setRatings]             = useState({})
  const [currentDomain, setCurrentDomain] = useState(0)
  const [loading, setLoading]             = useState(true)
  const [saving, setSaving]               = useState(false)
  const [saved, setSaved]                 = useState(false)
  const [cycleId, setCycleId]             = useState(null)
  const [error, setError]                 = useState('')

  useEffect(() => {
    if (institution?.id && currentUser?.id) loadData()
  }, [institution?.id, currentUser?.id])

  async function loadData() {
    setLoading(true)
    setError('')

    try {
      // Load domains
      const { data: domainsData, error: dErr } = await supabase
        .from('domains')
        .select('*')
        .eq('institution_id', institution.id)
        .order('domain_number')
      if (dErr) throw dErr

      // Load items
      const { data: itemsData, error: iErr } = await supabase
        .from('items')
        .select('*')
        .eq('institution_id', institution.id)
        .order('item_number')
      if (iErr) throw iErr

      // Get most recent active cycle — never create duplicates
      const { data: cycles } = await supabase
        .from('assessment_cycles')
        .select('*')
        .eq('institution_id', institution.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)

      let cycle = cycles?.[0] || null

      if (!cycle) {
        const { data: newCycle, error: cErr } = await supabase
          .from('assessment_cycles')
          .insert({
            institution_id: institution.id,
            name: `Assessment Cycle ${new Date().getFullYear()}`,
            start_date: new Date().toISOString().split('T')[0],
            status: 'active'
          })
          .select()
          .single()
        if (cErr) throw cErr
        cycle = newCycle
      }

      setCycleId(cycle.id)

      // Load existing responses for this cycle
      const { data: existingResponses, error: rErr } = await supabase
        .from('responses')
        .select('item_id, importance, competence, priority')
        .eq('user_id', currentUser.id)
        .eq('cycle_id', cycle.id)
      if (rErr) throw rErr

      // Map responses to ratings state
      const ratingsMap = {}
      existingResponses?.forEach(r => {
        ratingsMap[`${r.item_id}_importance`] = r.importance
        ratingsMap[`${r.item_id}_competence`] = r.competence
        ratingsMap[`${r.item_id}_priority`]   = r.priority
      })

      setDomains(domainsData || [])
      setItems(itemsData || [])
      setRatings(ratingsMap)

    } catch (err) {
      setError(err.message || 'Failed to load assessment.')
    }

    setLoading(false)
  }

  function setRating(itemId, scale, value) {
    setRatings(prev => ({ ...prev, [`${itemId}_${scale}`]: value }))
  }

  function getDomainItems(domainId) {
    return items.filter(i => i.domain_id === domainId)
  }

  function isDomainComplete(domainId) {
    return getDomainItems(domainId).every(item =>
      ratings[`${item.id}_importance`] &&
      ratings[`${item.id}_competence`] &&
      ratings[`${item.id}_priority`]
    )
  }

  function getTotalRated() {
    return items.filter(item =>
      ratings[`${item.id}_importance`] &&
      ratings[`${item.id}_competence`] &&
      ratings[`${item.id}_priority`]
    ).length
  }

  async function saveDomain(domainIndex) {
    if (!cycleId) return
    setSaving(true)
    setError('')

    const domain = domains[domainIndex ?? currentDomain]
    if (!domain) { setSaving(false); return }

    const domainItems = getDomainItems(domain.id)

    for (const item of domainItems) {
      const importance = ratings[`${item.id}_importance`]
      const competence = ratings[`${item.id}_competence`]
      const priority   = ratings[`${item.id}_priority`]
      if (!importance || !competence || !priority) continue

      try {
        // Check if response exists
        const { data: existing } = await supabase
          .from('responses')
          .select('id')
          .eq('user_id', currentUser.id)
          .eq('item_id', item.id)
          .eq('cycle_id', cycleId)
          .maybeSingle()

        if (existing?.id) {
          await supabase
            .from('responses')
            .update({ importance, competence, priority })
            .eq('id', existing.id)
        } else {
          await supabase
            .from('responses')
            .insert({
              user_id:        currentUser.id,
              item_id:        item.id,
              cycle_id:       cycleId,
              institution_id: institution.id,
              importance,
              competence,
              priority
            })
        }
      } catch (err) {
        console.error('Save error:', err)
      }
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function handleNext() {
    await saveDomain(currentDomain)
    setCurrentDomain(d => Math.min(domains.length - 1, d + 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handlePrev() {
    await saveDomain(currentDomain)
    setCurrentDomain(d => Math.max(0, d - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleJump(index) {
    await saveDomain(currentDomain)
    setCurrentDomain(index)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit() {
    await saveDomain(currentDomain)
    setScreen('idp')
  }

  const SCALE_LABELS = {
    importance: { 1:'Not Important', 2:'Slightly Important', 3:'Moderately Important', 4:'Important', 5:'Very Important' },
    competence: { 1:'Novice', 2:'Basic', 3:'Competent', 4:'Proficient', 5:'Expert' },
    priority:   { 1:'No Need', 2:'Low Priority', 3:'Moderate', 4:'High Priority', 5:'Immediate' },
  }

  const SCALE_COLORS = {
    importance: '#0D2B5E',
    competence: '#1A7B8C',
    priority:   '#C9982A',
  }

  const SCALE_NAMES = {
    importance: 'A. Importance',
    competence: 'B. Competence',
    priority:   'C. Priority',
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
                  height:'60vh', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize:40 }}>📋</div>
      <div style={{ fontSize:17, fontWeight:700, color:'#0D2B5E' }}>
        Loading your assessment...
      </div>
      <div style={{ fontSize:13, color:'#64748B' }}>
        Fetching your domains and saved responses
      </div>
    </div>
  )

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) return (
    <div style={{ maxWidth:600, margin:'40px auto', padding:24,
                  background:'#FEE2E2', borderRadius:10, color:'#DC2626' }}>
      <div style={{ fontWeight:700, marginBottom:8 }}>Error loading assessment</div>
      <div style={{ fontSize:13 }}>{error}</div>
      <button onClick={loadData} style={{ marginTop:16, padding:'8px 20px',
        borderRadius:8, border:'none', background:'#DC2626', color:'white',
        fontWeight:700, cursor:'pointer' }}>Retry</button>
    </div>
  )

  if (domains.length === 0) return (
    <div style={{ textAlign:'center', padding:40, color:'#64748B' }}>
      No domains found. Please check your framework configuration in Settings.
    </div>
  )

  const domain      = domains[currentDomain]
  const domainItems = getDomainItems(domain.id)
  const totalItems  = items.length
  const totalRated  = getTotalRated()
  const progress    = totalItems > 0
    ? Math.round((totalRated / totalItems) * 100) : 0
  const isLast      = currentDomain === domains.length - 1
  const isFirst     = currentDomain === 0

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth:820, margin:'0 auto' }}>

      {/* Decoupling notice */}
      <div style={{
        background:'#EEF2FF', border:'1px solid #C7D2FE',
        borderRadius:10, padding:'12px 16px', marginBottom:16,
        fontSize:13, color:'#0D2B5E', display:'flex',
        alignItems:'center', gap:8
      }}>
        <span style={{ fontSize:16 }}>ℹ️</span>
        Your responses are <strong>not linked to performance appraisal</strong>.
        Rate honestly — this generates your personal development plan.
      </div>

      {/* Progress card */}
      <div style={{
        background:'white', borderRadius:10, border:'1px solid #DDE3EF',
        padding:'16px 20px', marginBottom:16,
        boxShadow:'0 2px 12px rgba(13,43,94,.06)'
      }}>
        <div style={{ display:'flex', justifyContent:'space-between',
                      alignItems:'center', marginBottom:10 }}>
          <div style={{ fontWeight:700, color:'#0D2B5E', fontSize:14 }}>
            Overall Progress
          </div>
          <div style={{ fontSize:13, color:'#64748B' }}>
            {totalRated} / {totalItems} items · {progress}%
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ background:'#DDE3EF', borderRadius:4,
                      height:8, overflow:'hidden', marginBottom:14 }}>
          <div style={{
            height:'100%', borderRadius:4, background:'#1A7B8C',
            width:`${progress}%`, transition:'width .5s ease'
          }} />
        </div>

        {/* Domain pills */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {domains.map((d, i) => {
            const complete = isDomainComplete(d.id)
            const active   = currentDomain === i
            return (
              <button key={d.id}
                onClick={() => handleJump(i)}
                style={{
                  padding:'5px 13px', borderRadius:20, border:'none',
                  fontSize:12, fontWeight:700, cursor:'pointer',
                  background: active   ? '#0D2B5E'
                            : complete ? '#1A7B8C' : '#F1F5F9',
                  color: active || complete ? 'white' : '#64748B',
                  transition:'all .2s'
                }}>
                D{d.domain_number}{complete ? ' ✓' : ''}
              </button>
            )
          })}
        </div>
      </div>

      {/* Domain header */}
      <div style={{
        background:'#0D2B5E',
        borderRadius:'10px 10px 0 0',
        padding:'18px 22px'
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{
            background:'#1A7B8C', color:'white', borderRadius:8,
            padding:'4px 12px', fontWeight:800, fontSize:14, flexShrink:0
          }}>
            D{domain.domain_number}
          </span>
          <div>
            <div style={{ fontWeight:700, fontSize:16, color:'white' }}>
              {domain.name}
            </div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,.5)', marginTop:3 }}>
              {domain.core_focus}
            </div>
          </div>
          <div style={{ marginLeft:'auto', fontSize:13, color:'rgba(255,255,255,.5)' }}>
            Domain {currentDomain + 1} of {domains.length}
          </div>
        </div>
      </div>

      {/* Items */}
      <div style={{
        background:'white',
        border:'1px solid #DDE3EF',
        borderTop:'none',
        borderRadius:'0 0 10px 10px',
        boxShadow:'0 4px 16px rgba(13,43,94,.08)',
        marginBottom:16
      }}>
        {domainItems.length === 0 ? (
          <div style={{ padding:24, color:'#64748B', fontSize:13, textAlign:'center' }}>
            No items found for this domain.
          </div>
        ) : domainItems.map((item, idx) => {
          const imp = ratings[`${item.id}_importance`] || 0
          const com = ratings[`${item.id}_competence`] || 0
          const pri = ratings[`${item.id}_priority`]   || 0
          const gap = imp - com
          const tni = gap * pri
          const allRated = imp && com && pri

          let band = null
          if (allRated) {
            band = tni >= 13 ? { label:'Critical', color:'#DC2626', bg:'#FEE2E2' }
                 : tni >= 9  ? { label:'High',     color:'#EA580C', bg:'#FFEDD5' }
                 : tni >= 5  ? { label:'Moderate', color:'#CA8A04', bg:'#FEF9C3' }
                 :             { label:'Low',      color:'#16A34A', bg:'#DCFCE7' }
          }

          return (
            <div key={item.id} style={{
              padding:'20px 22px',
              borderBottom: idx < domainItems.length - 1
                ? '1px solid #F1F5F9' : 'none',
              background: allRated ? '#FAFBFF' : 'white',
              transition:'background .3s'
            }}>
              {/* Item text */}
              <div style={{
                fontSize:14, fontWeight:600, color:'#0D2B5E',
                marginBottom:16, lineHeight:1.6,
                display:'flex', gap:10
              }}>
                <span style={{
                  background:'#EEF2FF', color:'#0D2B5E', borderRadius:6,
                  padding:'2px 9px', fontWeight:800, fontSize:12,
                  flexShrink:0, alignSelf:'flex-start', marginTop:2
                }}>
                  {idx + 1}
                </span>
                {item.item_text}
              </div>

              {/* Scales */}
              {['importance','competence','priority'].map(scale => {
                const current = ratings[`${item.id}_${scale}`] || 0
                const col     = SCALE_COLORS[scale]
                return (
                  <div key={scale} style={{
                    display:'flex', alignItems:'center',
                    gap:12, marginBottom:12
                  }}>
                    <div style={{
                      width:140, fontSize:12, fontWeight:700,
                      color:'#64748B', flexShrink:0
                    }}>
                      {SCALE_NAMES[scale]}
                    </div>
                    <div style={{ display:'flex', gap:6 }}>
                      {[1,2,3,4,5].map(v => (
                        <button key={v}
                          onClick={() => setRating(item.id, scale, v)}
                          title={SCALE_LABELS[scale][v]}
                          style={{
                            width:38, height:38, borderRadius:8,
                            cursor:'pointer', fontSize:14, fontWeight:700,
                            transition:'all .15s',
                            border: current === v
                              ? 'none' : '1.5px solid #DDE3EF',
                            background: current === v ? col : 'white',
                            color: current === v ? 'white' : '#94A3B8',
                            boxShadow: current === v
                              ? `0 2px 8px ${col}44` : 'none',
                            transform: current === v ? 'scale(1.1)' : 'scale(1)',
                          }}>
                          {v}
                        </button>
                      ))}
                    </div>
                    {current > 0 && (
                      <span style={{
                        fontSize:12, color: col,
                        fontWeight:600
                      }}>
                        {SCALE_LABELS[scale][current]}
                      </span>
                    )}
                  </div>
                )
              })}

              {/* TNI preview */}
              {allRated && band && (
                <div style={{
                  display:'inline-flex', gap:12, alignItems:'center',
                  marginTop:4, padding:'7px 14px',
                  background: band.bg, borderRadius:8
                }}>
                  <span style={{ fontSize:12, color:'#64748B' }}>
                    Gap: <strong style={{ color:'#0D2B5E' }}>{gap}</strong>
                  </span>
                  <span style={{ fontSize:12, color:'#64748B' }}>
                    TNI: <strong style={{ color: band.color }}>{tni}</strong>
                  </span>
                  <span style={{
                    fontSize:11, fontWeight:700, padding:'2px 10px',
                    borderRadius:10, background:'white',
                    color: band.color, border:`1px solid ${band.color}`
                  }}>
                    {band.label} Need
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Save feedback */}
      {saved && (
        <div style={{
          background:'#DCFCE7', color:'#15803D',
          padding:'11px 16px', borderRadius:8,
          fontSize:13, fontWeight:600, marginBottom:12,
          display:'flex', alignItems:'center', gap:8
        }}>
          <span>✓</span> Responses saved to database successfully
        </div>
      )}

      {error && (
        <div style={{
          background:'#FEE2E2', color:'#DC2626',
          padding:'11px 16px', borderRadius:8,
          fontSize:13, marginBottom:12
        }}>
          {error}
        </div>
      )}

      {/* Navigation */}
      <div style={{
        display:'flex', justifyContent:'space-between',
        alignItems:'center', gap:10
      }}>
        <button
          onClick={handlePrev}
          disabled={isFirst}
          style={{
            padding:'11px 24px', borderRadius:8,
            border:'1.5px solid #DDE3EF', background:'white',
            color:'#0D2B5E', fontWeight:700, fontSize:14,
            cursor: isFirst ? 'not-allowed' : 'pointer',
            opacity: isFirst ? 0.4 : 1
          }}>
          ← Previous
        </button>

        <button
          onClick={() => saveDomain(currentDomain)}
          disabled={saving}
          style={{
            padding:'11px 24px', borderRadius:8,
            border:'1.5px solid #1A7B8C', background:'white',
            color:'#1A7B8C', fontWeight:700,
            fontSize:14, cursor:'pointer'
          }}>
          {saving ? '⏳ Saving...' : '💾 Save Progress'}
        </button>

        {isLast ? (
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              padding:'11px 28px', borderRadius:8, border:'none',
              background:'#C9982A', color:'#0D2B5E',
              fontWeight:700, fontSize:14, cursor:'pointer',
              boxShadow:'0 2px 8px #C9982A44'
            }}>
            ✓ Submit Assessment
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={saving}
            style={{
              padding:'11px 24px', borderRadius:8, border:'none',
              background:'#0D2B5E', color:'white',
              fontWeight:700, fontSize:14, cursor:'pointer'
            }}>
            Next Domain →
          </button>
        )}
      </div>
    </div>
  )
}