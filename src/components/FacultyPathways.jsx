import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function FacultyPathways({ institution, currentUser, branding }) {
  const [pathways, setPathways]     = useState([])
  const [enrolments, setEnrolments] = useState([])
  const [loading, setLoading]       = useState(true)
  const [enrolling, setEnrolling]   = useState(null)
  const [message, setMessage]       = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)

    const { data: pathwaysData } = await supabase
      .from('pathways')
      .select('*')
      .eq('institution_id', institution.id)
      .eq('is_active', true)
      .contains('career_tracks', [currentUser.career_track])

    const { data: enrolData } = await supabase
      .from('enrolments')
      .select('*')
      .eq('user_id', currentUser.id)

    setPathways(pathwaysData || [])
    setEnrolments(enrolData || [])
    setLoading(false)
  }

  function enrolmentFor(pathwayId) {
    return enrolments.find(e => e.pathway_id === pathwayId)
  }

  async function enrol(pathway) {
    setEnrolling(pathway.id)
    const status = pathway.requires_approval ? 'pending' : 'active'

    const { error } = await supabase.from('enrolments').insert({
      user_id:         currentUser.id,
      pathway_id:      pathway.id,
      institution_id:  institution.id,
      status,
      progress_percent: 0,
    })

    setEnrolling(null)
    if (!error) {
      setMessage(
        pathway.requires_approval
          ? `Enrolment request sent for "${pathway.name}" — awaiting approval.`
          : `Enrolled in "${pathway.name}".`
      )
      setTimeout(() => setMessage(''), 4000)
      loadData()
    } else {
      console.error('Enrolment failed:', error)
    }
  }

  const icons = { P1:'👩‍🏫', P2:'✅', P3:'📖', P4:'📚', P5:'🏛️', P6:'🎯', P7:'🤖' }

  const statusBadge = (status) => {
    const map = {
      active:    { bg:'#DCFCE7', color:'#15803D', label:'Enrolled' },
      pending:   { bg:'#FEF9C3', color:'#92400E', label:'Pending approval' },
      completed: { bg:'#EEF2FF', color:'#0D2B5E', label:'Completed' },
    }
    return map[status] || map.active
  }

  return (
    <div>
      {message && (
        <div style={{ background:'#DCFCE7', color:'#15803D', padding:'10px 16px',
                      borderRadius:8, fontSize:13, fontWeight:600, marginBottom:16 }}>
          ✓ {message}
        </div>
      )}

      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:18, fontWeight:800, color:'#0D2B5E' }}>
          Development Pathways
        </div>
        <div style={{ fontSize:13, color:'#64748B', marginTop:2 }}>
          Pathways available for your career track
        </div>
      </div>

      {loading ? (
        <div style={{ color:'#64748B', fontSize:13 }}>Loading pathways...</div>
      ) : pathways.length === 0 ? (
        <div style={{ background:'white', borderRadius:10, border:'1px solid #DDE3EF',
                      padding:'32px 20px', textAlign:'center', color:'#64748B', fontSize:13 }}>
          No pathways are currently available for your career track.
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',
                      gap:16 }}>
          {pathways.map(p => {
            const enrolment = enrolmentFor(p.id)
            const badge = enrolment ? statusBadge(enrolment.status) : null
            return (
              <div key={p.id} style={{
                background:'white', borderRadius:12, border:'1px solid #DDE3EF',
                boxShadow:'0 2px 12px rgba(13,43,94,.06)', overflow:'hidden',
                display:'flex', flexDirection:'column'
              }}>
                <div style={{ padding:'16px 18px', borderBottom:'1px solid #F1F5F9' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                    <span style={{ fontSize:22 }}>{icons[p.code] || '🎓'}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, color:'#0D2B5E', fontSize:15,
                                    display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                        {p.name}
                        {p.is_flagship && (
                          <span style={{ background:'#C9982A', color:'#0D2B5E',
                                         fontSize:10, padding:'2px 7px',
                                         borderRadius:8, fontWeight:700 }}>⭐ Flagship</span>
                        )}
                      </div>
                      {badge && (
                        <span style={{ background:badge.bg, color:badge.color,
                                       fontSize:11, padding:'2px 9px', borderRadius:8,
                                       fontWeight:700, display:'inline-block', marginTop:6 }}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ padding:'14px 18px', flex:1 }}>
                  <div style={{ fontSize:13, color:'#475569', lineHeight:1.5, marginBottom:12 }}>
                    {p.description || 'No description provided.'}
                  </div>
                  <div style={{ display:'flex', gap:14, fontSize:12, color:'#64748B' }}>
                    <span>🎓 {p.cpd_credits} CPD credits</span>
                    <span>⏱ {p.duration_hours} hrs</span>
                  </div>
                  {p.certificate_title && (
                    <div style={{ fontSize:12, color:'#64748B', marginTop:6 }}>
                      📜 {p.certificate_title}
                    </div>
                  )}
                </div>

                <div style={{ padding:'14px 18px', borderTop:'1px solid #F1F5F9' }}>
                  {enrolment ? (
                    enrolment.status === 'active' && (
                      <div>
                        <div style={{ fontSize:11, color:'#64748B', marginBottom:4 }}>
                          Progress: {enrolment.progress_percent || 0}%
                        </div>
                        <div style={{ height:6, background:'#F1F5F9', borderRadius:3, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${enrolment.progress_percent || 0}%`,
                                        background: branding.accent }} />
                        </div>
                      </div>
                    )
                  ) : (
                    <button onClick={() => enrol(p)} disabled={enrolling === p.id}
                      style={{ width:'100%', padding:'9px 16px', borderRadius:8, border:'none',
                               background: enrolling === p.id ? '#94A3B8' : branding.primary,
                               color:'white', fontWeight:700, fontSize:13,
                               cursor: enrolling === p.id ? 'not-allowed' : 'pointer' }}>
                      {enrolling === p.id
                        ? 'Enrolling...'
                        : p.requires_approval ? 'Request Enrolment' : '+ Enrol Now'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}