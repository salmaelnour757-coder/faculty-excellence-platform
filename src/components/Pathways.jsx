import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Pathways({ institution, currentUser }) {
  const [pathways, setPathways]     = useState([])
  const [enrolments, setEnrolments] = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    if (institution?.id && currentUser?.id) loadData()
  }, [institution, currentUser])

  async function loadData() {
    setLoading(true)
    const { data: pathwaysData } = await supabase
      .from('pathways')
      .select('*')
      .eq('institution_id', institution.id)
      .eq('is_active', true)
      .order('code')

    const { data: enrolData } = await supabase
      .from('enrolments')
      .select('*')
      .eq('user_id', currentUser.id)

    setPathways(pathwaysData || [])
    setEnrolments(enrolData || [])
    setLoading(false)
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

  const icons = { P1:'👩‍🏫', P2:'✅', P3:'📖', P4:'📚', P5:'🏛️', P6:'🎯', P7:'🤖' }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
                  height:'60vh', flexDirection:'column', gap:12 }}>
      <div style={{ fontSize:32 }}>🎓</div>
      <div style={{ fontSize:16, fontWeight:700, color:'#0D2B5E' }}>Loading pathways...</div>
    </div>
  )

  const totalCPD = enrolments
    .filter(e => e.status === 'completed')
    .reduce((s, e) => {
      const p = pathways.find(p => p.id === e.pathway_id)
      return s + (p?.cpd_credits || 0)
    }, 0)

  return (
    <div>
      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',
                    gap:14, marginBottom:20 }}>
        {[
          { label:'Available',  value: pathways.length,                                          color:'#0D2B5E' },
          { label:'Enrolled',   value: enrolments.filter(e=>e.status!=='completed').length,      color:'#1A7B8C' },
          { label:'Completed',  value: enrolments.filter(e=>e.status==='completed').length,      color:'#22C55E' },
          { label:'CPD Credits',value: totalCPD,                                                  color:'#C9982A' },
        ].map(s => (
          <div key={s.label} style={{ background:'white', borderRadius:10,
                                      padding:'16px 20px', border:'1px solid #DDE3EF',
                                      borderLeft:`4px solid ${s.color}` }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#64748B',
                          textTransform:'uppercase', letterSpacing:.4 }}>{s.label}</div>
            <div style={{ fontSize:26, fontWeight:800, color:'#0D2B5E', marginTop:4 }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Pathways list */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {pathways.map(p => {
          const enrolment = enrolments.find(e => e.pathway_id === p.id)
          return (
            <div key={p.id} style={{
              display:'flex', gap:14, alignItems:'center',
              padding:'16px 20px', borderRadius:10, background:'white',
              border:'1.5px solid #DDE3EF',
              boxShadow:'0 2px 12px rgba(13,43,94,.06)'
            }}>
              <div style={{
                width:44, height:44, borderRadius:10, flexShrink:0,
                background: enrolment?.status === 'completed' ? '#22C55E'
                          : enrolment ? '#1A7B8C' : '#0D2B5E',
                color:'white', fontSize:20,
                display:'flex', alignItems:'center', justifyContent:'center'
              }}>
                {icons[p.code] || '🎓'}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, color:'#0D2B5E', fontSize:14,
                              display:'flex', alignItems:'center', gap:8 }}>
                  {p.name}
                  {p.is_flagship && (
                    <span style={{ background:'#C9982A', color:'#0D2B5E', fontSize:11,
                                   padding:'2px 8px', borderRadius:8, fontWeight:700 }}>
                      ⭐ Flagship
                    </span>
                  )}
                </div>
                <div style={{ fontSize:12, color:'#64748B', marginTop:3 }}>
                  {p.domain_codes?.join(', ')} · {p.cpd_credits} CPD credits
                  · Tracks {p.career_tracks?.join(', ')}
                </div>
                {enrolment && (
                  <div style={{ marginTop:8 }}>
                    <div style={{ height:5, background:'#DDE3EF', borderRadius:4,
                                  overflow:'hidden', maxWidth:200 }}>
                      <div style={{
                        height:'100%', borderRadius:4,
                        background: enrolment.status === 'completed' ? '#22C55E' : '#1A7B8C',
                        width:`${enrolment.progress_percent || 0}%`
                      }} />
                    </div>
                    <div style={{ fontSize:11, color:'#64748B', marginTop:3 }}>
                      {enrolment.progress_percent || 0}% complete
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
                {enrolment ? (
                  <span style={{
                    fontSize:12, fontWeight:700, padding:'4px 12px', borderRadius:10,
                    background: enrolment.status === 'completed' ? '#DCFCE7' : '#CCFBF1',
                    color: enrolment.status === 'completed' ? '#15803D' : '#0F766E'
                  }}>
                    {enrolment.status === 'completed' ? '✓ Completed' : 'In Progress'}
                  </span>
                ) : (
                  <button onClick={() => enrol(p.id)} style={{
                    padding:'8px 20px', borderRadius:8, border:'none',
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
  )
}
await supabase.from('pathways').insert({
  institution_id:    institution.id,
  code,
  name:              newForm.name,
  description:       newForm.description,
  cpd_credits:       newForm.cpd_credits,
  duration_hours:    newForm.duration_hours,
  certificate_title: newForm.certificate_title,
  career_tracks:     newForm.career_tracks,
  domain_codes:      newForm.domain_codes,
  is_flagship:       newForm.is_flagship,
  requires_approval: newForm.requires_approval,
  is_active:         true,
})

await supabase.from('pathways').update({
  name:              p.name,
  description:       p.description,
  cpd_credits:       p.cpd_credits,
  duration_hours:    p.duration_hours,
  certificate_title: p.certificate_title,
  is_flagship:       p.is_flagship,
  requires_approval: p.requires_approval,
}).eq('id', p.id)