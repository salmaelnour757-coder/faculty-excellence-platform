import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function IDP({ institution, currentUser, setScreen }) {
  const [domains, setDomains]     = useState([])
  const [responses, setResponses] = useState([])
  const [pathways, setPathways]   = useState([])
  const [enrolments, setEnrolments] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    if (institution?.id && currentUser?.id) loadData()
  }, [institution, currentUser])

  async function loadData() {
    setLoading(true)

    const { data: domainsData } = await supabase
      .from('domains')
      .select('*')
      .eq('institution_id', institution.id)
      .order('domain_number')

    const { data: responsesData } = await supabase
      .from('responses')
      .select('*, items(domain_id)')
      .eq('user_id', currentUser.id)

    const { data: pathwaysData } = await supabase
      .from('pathways')
      .select('*')
      .eq('institution_id', institution.id)
      .eq('is_active', true)

    const { data: enrolData } = await supabase
      .from('enrolments')
      .select('*, pathways(*)')
      .eq('user_id', currentUser.id)

    setDomains(domainsData || [])
    setResponses(responsesData || [])
    setPathways(pathwaysData || [])
    setEnrolments(enrolData || [])
    setLoading(false)
  }

  function getDomainTNI(domainId) {
    const dr = responses.filter(r => r.items?.domain_id === domainId)
    if (dr.length === 0) return 0
    return Math.round(dr.reduce((s,r) => s + (r.tni||0), 0) / dr.length * 10) / 10
  }

  function getTNIBand(tni) {
    if (tni >= 13) return { label:'Critical', color:'#DC2626', bg:'#FEE2E2' }
    if (tni >= 9)  return { label:'High',     color:'#EA580C', bg:'#FFEDD5' }
    if (tni >= 5)  return { label:'Moderate', color:'#CA8A04', bg:'#FEF9C3' }
    return               { label:'Low',      color:'#16A34A', bg:'#DCFCE7' }
  }

  async function enrol(pathwayId) {
    await supabase.from('enrolments').insert({
      user_id:        currentUser.id,
      pathway_id:     pathwayId,
      institution_id: institution.id,
      status:         'active'
    })
    loadData()
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
                  height:'60vh', flexDirection:'column', gap:12 }}>
      <div style={{ fontSize:32 }}>🗺️</div>
      <div style={{ fontSize:16, fontWeight:700, color:'#0D2B5E' }}>Loading your IDP...</div>
    </div>
  )

  if (responses.length === 0) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
                  height:'60vh', flexDirection:'column', gap:12 }}>
      <div style={{ fontSize:48 }}>📋</div>
      <div style={{ fontSize:18, fontWeight:700, color:'#0D2B5E' }}>
        Complete your assessment first
      </div>
      <div style={{ color:'#64748B', marginBottom:16 }}>
        Your IDP is generated from your assessment responses.
      </div>
      <button onClick={() => setScreen('assessment')} style={{
        padding:'11px 28px', borderRadius:8, border:'none',
        background:'#0D2B5E', color:'white', fontWeight:700,
        fontSize:14, cursor:'pointer'
      }}>
        Start Assessment →
      </button>
    </div>
  )

  // Build domain profiles sorted by TNI
  const domainProfiles = domains
    .map(d => ({ ...d, tni: getDomainTNI(d.id) }))
    .sort((a,b) => b.tni - a.tni)

  // Match pathways to high-TNI domains
  const recommendedPathways = pathways
    .map(p => {
      const score = (p.domain_codes || []).reduce((s, code) => {
        const d = domainProfiles.find(d => d.code === code)
        return s + (d ? d.tni : 0)
      }, 0)
      const enrolled = enrolments.some(e => e.pathway_id === p.id)
      return { ...p, score, enrolled }
    })
    .filter(p => p.score > 0)
    .sort((a,b) => b.score - a.score)

  return (
    <div>
      {/* Domain TNI summary */}
      <div style={{ background:'white', borderRadius:10, border:'1px solid #DDE3EF',
                    marginBottom:20, boxShadow:'0 2px 12px rgba(13,43,94,.06)' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #DDE3EF' }}>
          <div style={{ fontSize:15, fontWeight:700, color:'#0D2B5E' }}>
            Competency Gap Analysis
          </div>
        </div>
        <div style={{ padding:'16px 20px' }}>
          {domainProfiles.map(d => {
            const { label, color, bg } = getTNIBand(d.tni)
            const width = Math.max((d.tni / 20) * 100, 2)
            return (
              <div key={d.id} style={{ display:'flex', alignItems:'center',
                                        gap:12, padding:'8px 0',
                                        borderBottom:'1px solid #F1F5F9' }}>
                <div style={{ width:220, fontSize:13, fontWeight:600,
                              color:'#0D2B5E', flexShrink:0 }}>
                  {d.name}
                </div>
                <div style={{ flex:1, height:8, background:'#DDE3EF',
                              borderRadius:4, overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:4,
                                background:color, width:`${width}%`,
                                transition:'width .6s' }} />
                </div>
                <div style={{ fontWeight:700, color, width:36, textAlign:'right' }}>
                  {d.tni}
                </div>
                <span style={{ fontSize:11, fontWeight:700, padding:'2px 9px',
                               borderRadius:10, background:bg, color, width:76,
                               textAlign:'center', flexShrink:0 }}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recommended pathways */}
      <div style={{ background:'white', borderRadius:10, border:'1px solid #DDE3EF',
                    boxShadow:'0 2px 12px rgba(13,43,94,.06)' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #DDE3EF' }}>
          <div style={{ fontSize:15, fontWeight:700, color:'#0D2B5E' }}>
            Recommended Learning Pathways
          </div>
        </div>
        <div style={{ padding:'16px 20px' }}>
          {recommendedPathways.length === 0 ? (
            <div style={{ color:'#64748B', fontSize:13 }}>
              No pathway recommendations yet. Complete your assessment to generate recommendations.
            </div>
          ) : recommendedPathways.map((p, i) => {
            const enrolment = enrolments.find(e => e.pathway_id === p.id)
            return (
              <div key={p.id} style={{
                display:'flex', gap:14, alignItems:'flex-start',
                padding:'14px 16px', borderRadius:10,
                border:'1.5px solid #DDE3EF', marginBottom:10,
                background:'white'
              }}>
                <div style={{
                  width:42, height:42, borderRadius:10, flexShrink:0,
                  background: i === 0 ? '#DC2626' : i === 1 ? '#1A7B8C' : '#C9982A',
                  color:'white', fontSize:16,
                  display:'flex', alignItems:'center', justifyContent:'center'
                }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, color:'#0D2B5E', fontSize:14,
                                display:'flex', alignItems:'center', gap:8 }}>
                    {p.name}
                    {p.is_flagship && (
                      <span style={{ background:'#C9982A', color:'#0D2B5E',
                                     fontSize:11, padding:'2px 8px', borderRadius:8,
                                     fontWeight:700 }}>⭐ Flagship</span>
                    )}
                  </div>
                  <div style={{ fontSize:12, color:'#64748B', marginTop:3 }}>
                    {p.domain_codes?.join(', ')} · {p.cpd_credits} CPD credits
                  </div>
                  {enrolment && (
                    <div style={{ marginTop:8 }}>
                      <div style={{ height:6, background:'#DDE3EF', borderRadius:4,
                                    overflow:'hidden', maxWidth:200 }}>
                        <div style={{ height:'100%', borderRadius:4,
                                      background:'#1A7B8C',
                                      width:`${enrolment.progress_percent || 0}%` }} />
                      </div>
                      <div style={{ fontSize:11, color:'#64748B', marginTop:3 }}>
                        {enrolment.progress_percent || 0}% complete
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
                  {enrolment ? (
                    <span style={{ fontSize:12, fontWeight:700, padding:'4px 12px',
                                   borderRadius:10, background:'#CCFBF1',
                                   color:'#0F766E' }}>
                      {enrolment.status}
                    </span>
                  ) : (
                    <button onClick={() => enrol(p.id)} style={{
                      padding:'8px 18px', borderRadius:8, border:'none',
                      background:'#0D2B5E', color:'white',
                      fontWeight:700, fontSize:12, cursor:'pointer'
                    }}>
                      Enrol
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}