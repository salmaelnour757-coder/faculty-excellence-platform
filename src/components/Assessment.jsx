import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Assessment({ institution, currentUser, setScreen }) {
  const [domains, setDomains]     = useState([])
  const [items, setItems]         = useState([])
  const [ratings, setRatings]     = useState({})
  const [currentDomain, setCurrentDomain] = useState(0)
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [cycleId, setCycleId]     = useState(null)

  useEffect(() => {
    if (institution?.id && currentUser?.id) loadData()
  }, [institution, currentUser])

  async function loadData() {
    setLoading(true)

    // Load domains
    const { data: domainsData } = await supabase
      .from('domains')
      .select('*')
      .eq('institution_id', institution.id)
      .order('domain_number')

    // Load items
    const { data: itemsData } = await supabase
      .from('items')
      .select('*')
      .eq('institution_id', institution.id)
      .order('item_number')

    // Get or create active assessment cycle
    let { data: cycle } = await supabase
      .from('assessment_cycles')
      .select('*')
      .eq('institution_id', institution.id)
      .eq('status', 'active')
      .single()

    if (!cycle) {
      const { data: newCycle } = await supabase
        .from('assessment_cycles')
        .insert({
          institution_id: institution.id,
          name: `Assessment Cycle ${new Date().getFullYear()}`,
          start_date: new Date().toISOString().split('T')[0],
          status: 'active'
        })
        .select()
        .single()
      cycle = newCycle
    }

    setCycleId(cycle?.id)

    // Load existing responses
    const { data: existingResponses } = await supabase
      .from('responses')
      .select('*, items(id)')
      .eq('user_id', currentUser.id)
      .eq('cycle_id', cycle?.id)

    // Map existing responses to ratings state
    const ratingsMap = {}
    existingResponses?.forEach(r => {
      ratingsMap[`${r.item_id}_importance`] = r.importance
      ratingsMap[`${r.item_id}_competence`] = r.competence
      ratingsMap[`${r.item_id}_priority`]   = r.priority
    })

    setDomains(domainsData || [])
    setItems(itemsData || [])
    setRatings(ratingsMap)
    setLoading(false)
  }

  function setRating(itemId, scale, value) {
    setRatings(prev => ({ ...prev, [`${itemId}_${scale}`]: value }))
  }

  function getDomainItems(domainId) {
    return items.filter(i => i.domain_id === domainId)
  }

  function isDomainComplete(domainId) {
    const domainItems = getDomainItems(domainId)
    return domainItems.every(item =>
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

  async function saveCurrentDomain() {
    if (!cycleId) return
    setSaving(true)

    const domain = domains[currentDomain]
    const domainItems = getDomainItems(domain.id)

    for (const item of domainItems) {
      const importance = ratings[`${item.id}_importance`]
      const competence = ratings[`${item.id}_competence`]
      const priority   = ratings[`${item.id}_priority`]

      if (!importance || !competence || !priority) continue

      // Upsert response
      await supabase.from('responses').upsert({
        user_id:        currentUser.id,
        item_id:        item.id,
        cycle_id:       cycleId,
        institution_id: institution.id,
        importance, competence, priority
      }, { onConflict: 'user_id,item_id,cycle_id' })
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleSubmit() {
    await saveCurrentDomain()
    setScreen('idp')
  }

  const scaleLabels = {
    importance: { 1:'Not Important', 2:'Slightly', 3:'Moderately', 4:'Important', 5:'Very Important' },
    competence: { 1:'Novice', 2:'Basic', 3:'Competent', 4:'Proficient', 5:'Expert' },
    priority:   { 1:'No Need', 2:'Low', 3:'Moderate', 4:'High', 5:'Immediate' },
  }

  const scaleColors = {
    importance: '#0D2B5E',
    competence: '#1A7B8C',
    priority:   '#C9982A',
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
                  height:'60vh', flexDirection:'column', gap:12 }}>
      <div style={{ fontSize:32 }}>📋</div>
      <div style={{ fontSize:16, fontWeight:700, color:'#0D2B5E' }}>Loading assessment...</div>
    </div>
  )

  const domain = domains[currentDomain]
  if (!domain) return null
  const domainItems = getDomainItems(domain.id)
  const totalItems  = items.length
  const totalRated  = getTotalRated()
  const progress    = totalItems > 0 ? Math.round((totalRated / totalItems) * 100) : 0

  return (
    <div style={{ maxWidth:800, margin:'0 auto' }}>

      {/* Info banner */}
      <div style={{
        background:'#EEF2FF', border:'1px solid #C7D2FE',
        borderRadius:10, padding:'12px 16px', marginBottom:16,
        fontSize:13, color:'#0D2B5E'
      }}>
        ℹ️ Your responses are <strong>not linked to performance appraisal</strong>.
        Rate honestly — this drives your personal development plan.
      </div>

      {/* Overall progress */}
      <div style={{ background:'white', borderRadius:10, border:'1px solid #DDE3EF',
                    padding:'16px 20px', marginBottom:16,
                    boxShadow:'0 2px 12px rgba(13,43,94,.06)' }}>
        <div style={{ display:'flex', justifyContent:'space-between',
                      alignItems:'center', marginBottom:8 }}>
          <span style={{ fontWeight:700, color:'#0D2B5E' }}>Overall Progress</span>
          <span style={{ fontSize:13, color:'#64748B' }}>
            {totalRated} of {totalItems * 3} ratings · {progress}%
          </span>
        </div>
        <div style={{ background:'#DDE3EF', borderRadius:4, height:6, overflow:'hidden' }}>
          <div style={{ height:'100%', borderRadius:4, background:'#1A7B8C',
                        width:`${progress}%`, transition:'width .4s' }} />
        </div>

        {/* Domain tabs */}
        <div style={{ display:'flex', gap:6, marginTop:12, flexWrap:'wrap' }}>
          {domains.map((d, i) => {
            const complete = isDomainComplete(d.id)
            return (
              <button key={d.id}
                onClick={() => { saveCurrentDomain(); setCurrentDomain(i) }}
                style={{
                  padding:'4px 12px', borderRadius:16, border:'none',
                  fontSize:12, fontWeight:700, cursor:'pointer',
                  background: currentDomain === i ? '#0D2B5E'
                            : complete ? '#1A7B8C' : '#DDE3EF',
                  color: currentDomain === i || complete ? 'white' : '#64748B',
                  transition:'all .15s'
                }}>
                D{d.domain_number}{complete ? ' ✓' : ''}
              </button>
            )
          })}
        </div>
      </div>

      {/* Domain header */}
      <div style={{
        background:'#0D2B5E', borderRadius:'10px 10px 0 0',
        padding:'16px 20px', color:'white'
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{
            background:'#1A7B8C', color:'white', borderRadius:6,
            padding:'3px 10px', fontWeight:800, fontSize:13
          }}>
            D{domain.domain_number}
          </span>
          <div>
            <div style={{ fontWeight:700, fontSize:15 }}>{domain.name}</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,.55)', marginTop:2 }}>
              {domain.core_focus}
            </div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div style={{ background:'white', border:'1px solid #DDE3EF',
                    borderTop:'none', borderRadius:'0 0 10px 10px',
                    boxShadow:'0 2px 12px rgba(13,43,94,.06)', marginBottom:16 }}>
        {domainItems.map((item, idx) => (
          <div key={item.id} style={{
            padding:'18px 20px',
            borderBottom: idx < domainItems.length - 1 ? '1px solid #F1F5F9' : 'none'
          }}>
            {/* Item text */}
            <div style={{ fontSize:14, fontWeight:600, color:'#0D2B5E',
                          marginBottom:14, lineHeight:1.5 }}>
              {idx + 1}. {item.item_text}
            </div>

            {/* Three scales */}
            {['importance','competence','priority'].map(scale => {
              const current = ratings[`${item.id}_${scale}`] || 0
              const color   = scaleColors[scale]
              return (
                <div key={scale} style={{ display:'flex', alignItems:'center',
                                          gap:10, marginBottom:10 }}>
                  <div style={{ width:130, fontSize:12, fontWeight:700,
                                color:'#64748B', flexShrink:0, textTransform:'capitalize' }}>
                    {scale === 'importance' ? 'A. Importance'
                   : scale === 'competence' ? 'B. Competence'
                   : 'C. Priority'}
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    {[1,2,3,4,5].map(v => (
                      <button key={v}
                        onClick={() => setRating(item.id, scale, v)}
                        title={scaleLabels[scale][v]}
                        style={{
                          width:36, height:36, borderRadius:8, cursor:'pointer',
                          fontSize:13, fontWeight:700, transition:'all .15s',
                          border: current === v ? 'none' : '1.5px solid #DDE3EF',
                          background: current === v ? color : 'white',
                          color: current === v ? 'white' : '#64748B',
                        }}>
                        {v}
                      </button>
                    ))}
                  </div>
                  {current > 0 && (
                    <span style={{ fontSize:12, color:'#64748B', fontStyle:'italic' }}>
                      {scaleLabels[scale][current]}
                    </span>
                  )}
                </div>
              )
            })}

            {/* Live TNI preview */}
            {ratings[`${item.id}_importance`] &&
             ratings[`${item.id}_competence`] &&
             ratings[`${item.id}_priority`] && (() => {
              const gap = ratings[`${item.id}_importance`] - ratings[`${item.id}_competence`]
              const tni = gap * ratings[`${item.id}_priority`]
              const band = tni >= 13 ? { label:'Critical', color:'#DC2626', bg:'#FEE2E2' }
                         : tni >= 9  ? { label:'High',     color:'#EA580C', bg:'#FFEDD5' }
                         : tni >= 5  ? { label:'Moderate', color:'#CA8A04', bg:'#FEF9C3' }
                         :             { label:'Low',      color:'#16A34A', bg:'#DCFCE7' }
              return (
                <div style={{ display:'flex', gap:10, alignItems:'center',
                              marginTop:8, padding:'6px 12px', background:'#F8FAFC',
                              borderRadius:6 }}>
                  <span style={{ fontSize:12, color:'#64748B' }}>
                    Gap: <strong>{gap}</strong> · TNI: <strong>{tni}</strong>
                  </span>
                  <span style={{
                    fontSize:11, fontWeight:700, padding:'2px 8px',
                    borderRadius:10, background: band.bg, color: band.color
                  }}>
                    {band.label} Need
                  </span>
                </div>
              )
            })()}
          </div>
        ))}
      </div>

      {/* Save feedback */}
      {saved && (
        <div style={{ background:'#DCFCE7', color:'#15803D', padding:'10px 16px',
                      borderRadius:8, fontSize:13, fontWeight:600, marginBottom:12 }}>
          ✓ Responses saved
        </div>
      )}

      {/* Navigation */}
      <div style={{ display:'flex', justifyContent:'space-between', gap:10 }}>
        <button
          onClick={() => { saveCurrentDomain(); setCurrentDomain(d => Math.max(0, d-1)) }}
          disabled={currentDomain === 0}
          style={{
            padding:'11px 24px', borderRadius:8,
            border:'1.5px solid #DDE3EF', background:'white',
            color:'#0D2B5E', fontWeight:700, fontSize:14,
            cursor: currentDomain === 0 ? 'not-allowed' : 'pointer',
            opacity: currentDomain === 0 ? 0.4 : 1
          }}>
          ← Previous
        </button>

        <button onClick={saveCurrentDomain} disabled={saving}
          style={{
            padding:'11px 24px', borderRadius:8,
            border:'1.5px solid #1A7B8C', background:'white',
            color:'#1A7B8C', fontWeight:700, fontSize:14, cursor:'pointer'
          }}>
          {saving ? 'Saving...' : '💾 Save'}
        </button>

        {currentDomain < domains.length - 1 ? (
          <button
            onClick={() => { saveCurrentDomain(); setCurrentDomain(d => d+1) }}
            style={{
              padding:'11px 24px', borderRadius:8, border:'none',
              background:'#0D2B5E', color:'white',
              fontWeight:700, fontSize:14, cursor:'pointer'
            }}>
            Next Domain →
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={saving}
            style={{
              padding:'11px 28px', borderRadius:8, border:'none',
              background:'#C9982A', color:'#0D2B5E',
              fontWeight:700, fontSize:14, cursor:'pointer'
            }}>
            ✓ Submit Assessment
          </button>
        )}
      </div>
    </div>
  )
}