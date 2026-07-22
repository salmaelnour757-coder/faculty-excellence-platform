import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function FacultyPathways({ institution, currentUser, branding }) {
  const [pathways, setPathways]       = useState([])
  const [enrolments, setEnrolments]   = useState([])
  const [workshopsByPathway, setWorkshopsByPathway] = useState({})
  const [recommendedCodes, setRecommendedCodes]      = useState([])
  const [loading, setLoading]         = useState(true)
  const [enrolling, setEnrolling]     = useState(null)
  const [message, setMessage]         = useState('')
  const [expanded, setExpanded]       = useState(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)

    // 1. Pathways matching this faculty member's career track
    const { data: pathwaysData } = await supabase
      .from('pathways')
      .select('*')
      .eq('institution_id', institution.id)
      .eq('is_active', true)
      .contains('career_tracks', [currentUser.career_track])

    const activePathways = pathwaysData || []

    // 2. This faculty member's existing enrolments
    const { data: enrolData } = await supabase
      .from('enrolments')
      .select('*')
      .eq('user_id', currentUser.id)

    // 3. Domains + items, to map item -> domain
    const { data: domainsData } = await supabase
      .from('domains')
      .select('*')
      .eq('institution_id', institution.id)

    const { data: itemsData } = await supabase
      .from('items')
      .select('id, domain_id')
      .eq('institution_id', institution.id)

    const itemToDomain = {}
    ;(itemsData || []).forEach(i => { itemToDomain[i.id] = i.domain_id })

    // 4. This faculty member's most recent responses, aggregated into avg TNI per domain
    const { data: responsesData } = await supabase
      .from('responses')
      .select('item_id, tni')
      .eq('user_id', currentUser.id)

    const domainTni = {} // domain_id -> { sum, count }
    ;(responsesData || []).forEach(r => {
      const domainId = itemToDomain[r.item_id]
      if (!domainId || r.tni == null) return
      if (!domainTni[domainId]) domainTni[domainId] = { sum:0, count:0 }
      domainTni[domainId].sum += r.tni
      domainTni[domainId].count += 1
    })

    const domainAverages = (domainsData || []).map(d => ({
      domain: d,
      avgTni: domainTni[d.id] ? domainTni[d.id].sum / domainTni[d.id].count : 0
    })).sort((a, b) => b.avgTni - a.avgTni)

    // Top 3 highest-need domains, as long as they have a real positive gap
    const topDomains = domainAverages.filter(d => d.avgTni > 0).slice(0, 3)
    const codes = topDomains.flatMap(d => [
      String(d.domain.domain_number),
      `D${d.domain.domain_number}`
    ])

    // 5. Workshops for all these pathways
    const pathwayIds = activePathways.map(p => p.id)
    let workshopsData = []
    if (pathwayIds.length > 0) {
      const { data: w } = await supabase
        .from('workshops')
        .select('*')
        .in('pathway_id', pathwayIds)
        .order('start_time')
      workshopsData = w || []
    }
    const grouped = {}
    workshopsData.forEach(w => {
      if (!grouped[w.pathway_id]) grouped[w.pathway_id] = []
      grouped[w.pathway_id].push(w)
    })

    // Sort pathways: training-need matches first, flagship next, then alphabetical
    const sorted = [...activePathways].sort((a, b) => {
      const aMatch = (a.domain_codes || []).some(c => codes.includes(String(c)))
      const bMatch = (b.domain_codes || []).some(c => codes.includes(String(c)))
      if (aMatch !== bMatch) return aMatch ? -1 : 1
      if (a.is_flagship !== b.is_flagship) return a.is_flagship ? -1 : 1
      return a.name.localeCompare(b.name)
    })

    setPathways(sorted)
    setEnrolments(enrolData || [])
    setWorkshopsByPathway(grouped)
    setRecommendedCodes(codes)
    setLoading(false)
  }

  function matchesNeed(pathway) {
    return (pathway.domain_codes || []).some(c => recommendedCodes.includes(String(c)))
  }

  function enrolmentFor(pathwayId) {
    return enrolments.find(e => e.pathway_id === pathwayId)
  }

  async function enrol(pathway) {
    setEnrolling(pathway.id)
    const status = pathway.requires_approval ? 'pending' : 'active'

    const { error } = await supabase.from('enrolments').insert({
      user_id:          currentUser.id,
      pathway_id:       pathway.id,
      institution_id:   institution.id,
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

  function fmtIcsDate(d) {
    return new Date(d).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }

  function downloadWorkshopIcs(w) {
    const loc = w.format === 'online' ? (w.meeting_link || 'Online') : (w.location || '')
    const desc = (w.description || '').replace(/\n/g, '\\n')
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT',
      `UID:${w.id}@fep`,
      `DTSTAMP:${fmtIcsDate(new Date())}`,
      `DTSTART:${fmtIcsDate(w.start_time)}`,
      `DTEND:${fmtIcsDate(w.end_time)}`,
      `SUMMARY:${w.title}`,
      `DESCRIPTION:${desc}${w.facilitator ? `\\nFacilitator: ${w.facilitator}` : ''}`,
      `LOCATION:${loc}`,
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n')
    triggerDownload(ics, `${w.title.replace(/[^a-z0-9]/gi, '_')}.ics`)
  }

  function downloadPathwayIcs(pathway) {
    const sessions = workshopsByPathway[pathway.id] || []
    if (sessions.length === 0) return
    const events = sessions.map(w => {
      const loc = w.format === 'online' ? (w.meeting_link || 'Online') : (w.location || '')
      const desc = (w.description || '').replace(/\n/g, '\\n')
      return [
        'BEGIN:VEVENT',
        `UID:${w.id}@fep`,
        `DTSTAMP:${fmtIcsDate(new Date())}`,
        `DTSTART:${fmtIcsDate(w.start_time)}`,
        `DTEND:${fmtIcsDate(w.end_time)}`,
        `SUMMARY:${w.title}`,
        `DESCRIPTION:${desc}${w.facilitator ? `\\nFacilitator: ${w.facilitator}` : ''}`,
        `LOCATION:${loc}`,
        'END:VEVENT'
      ].join('\r\n')
    }).join('\r\n')
    const ics = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${events}\r\nEND:VCALENDAR`
    triggerDownload(ics, `${pathway.name.replace(/[^a-z0-9]/gi, '_')}_schedule.ics`)
  }

  function triggerDownload(content, filename) {
    const blob = new Blob([content], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const icons = { P1:'👩‍🏫', P2:'✅', P3:'📖', P4:'📚', P5:'🏛️', P6:'🎯', P7:'🤖' }
  const formatLabel = { in_person:'📍 In-Person', online:'💻 Online', hybrid:'🔀 Hybrid' }

  const statusBadge = (status) => {
    const map = {
      active:    { bg:'#DCFCE7', color:'#15803D', label:'Enrolled' },
      pending:   { bg:'#FEF9C3', color:'#92400E', label:'Pending approval' },
      completed: { bg:'#EEF2FF', color:'#0D2B5E', label:'Completed' },
    }
    return map[status] || map.active
  }

  if (loading) return <div style={{ color:'#64748B', fontSize:13 }}>Loading pathways...</div>

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
          Pathways available for your career track, ranked by your assessed training needs
        </div>
      </div>

      {pathways.length === 0 ? (
        <div style={{ background:'white', borderRadius:10, border:'1px solid #DDE3EF',
                      padding:'32px 20px', textAlign:'center', color:'#64748B', fontSize:13 }}>
          No pathways are currently available for your career track.
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {pathways.map(p => {
            const enrolment = enrolmentFor(p.id)
            const badge = enrolment ? statusBadge(enrolment.status) : null
            const sessions = workshopsByPathway[p.id] || []
            const isOpen = expanded === p.id
            const recommended = matchesNeed(p)

            return (
              <div key={p.id} style={{
                background:'white', borderRadius:12, border:'1px solid #DDE3EF',
                boxShadow:'0 2px 12px rgba(13,43,94,.06)', overflow:'hidden'
              }}>
                <div style={{ padding:'16px 18px', display:'flex', gap:12, flexWrap:'wrap',
                              justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ display:'flex', gap:12, alignItems:'flex-start', flex:1, minWidth:220 }}>
                    <span style={{ fontSize:22 }}>{icons[p.code] || '🎓'}</span>
                    <div>
                      <div style={{ fontWeight:700, color:'#0D2B5E', fontSize:15,
                                    display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                        {p.name}
                        {recommended && (
                          <span style={{ background:'#1A7B8C', color:'white', fontSize:10,
                                         padding:'2px 8px', borderRadius:8, fontWeight:700 }}>
                            🎯 Matches your training need
                          </span>
                        )}
                        {p.is_flagship && (
                          <span style={{ background:'#C9982A', color:'#0D2B5E', fontSize:10,
                                         padding:'2px 7px', borderRadius:8, fontWeight:700 }}>
                            ⭐ Flagship
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize:13, color:'#475569', marginTop:6, maxWidth:480 }}>
                        {p.description || 'No description provided.'}
                      </div>
                      <div style={{ display:'flex', gap:14, fontSize:12, color:'#64748B', marginTop:8, flexWrap:'wrap' }}>
                        <span>🎓 {p.cpd_credits} CPD credits</span>
                        <span>⏱ {p.duration_hours} hrs</span>
                        <span>📅 {sessions.length} session{sessions.length !== 1 ? 's' : ''} scheduled</span>
                      </div>
                      {badge && (
                        <span style={{ background:badge.bg, color:badge.color, fontSize:11,
                                       padding:'2px 9px', borderRadius:8, fontWeight:700,
                                       display:'inline-block', marginTop:8 }}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end' }}>
                    {!enrolment && (
                      <button onClick={() => enrol(p)} disabled={enrolling === p.id}
                        style={{ padding:'9px 18px', borderRadius:8, border:'none',
                                 background: enrolling === p.id ? '#94A3B8' : branding.primary,
                                 color:'white', fontWeight:700, fontSize:13,
                                 cursor: enrolling === p.id ? 'not-allowed' : 'pointer', whiteSpace:'nowrap' }}>
                        {enrolling === p.id
                          ? 'Enrolling...'
                          : p.requires_approval ? 'Request Enrolment' : '+ Enrol Now'}
                      </button>
                    )}
                    {enrolment?.status === 'active' && (
                      <div style={{ width:140 }}>
                        <div style={{ fontSize:11, color:'#64748B', marginBottom:4, textAlign:'right' }}>
                          {enrolment.progress_percent || 0}% complete
                        </div>
                        <div style={{ height:6, background:'#F1F5F9', borderRadius:3, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${enrolment.progress_percent || 0}%`,
                                        background: branding.accent }} />
                        </div>
                      </div>
                    )}
                    {sessions.length > 0 && (
                      <button onClick={() => downloadPathwayIcs(p)}
                        style={{ padding:'7px 14px', borderRadius:8, border:'1.5px solid #DDE3EF',
                                 background:'white', color:'#0D2B5E', fontWeight:600, fontSize:12,
                                 cursor:'pointer', whiteSpace:'nowrap' }}>
                        📅 Add all sessions to calendar
                      </button>
                    )}
                    <button onClick={() => setExpanded(isOpen ? null : p.id)}
                      style={{ padding:'6px 14px', borderRadius:8, border:'none',
                               background:'transparent', color:'#1A7B8C', fontWeight:600,
                               fontSize:12, cursor:'pointer' }}>
                      {isOpen ? 'Hide schedule ▲' : 'View schedule ▼'}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div style={{ borderTop:'1px solid #F1F5F9', padding:'14px 18px', background:'#F8FAFC' }}>
                    {sessions.length === 0 ? (
                      <div style={{ fontSize:12.5, color:'#94A3B8' }}>
                        No sessions scheduled for this pathway yet.
                      </div>
                    ) : (
                      sessions.map(w => (
                        <div key={w.id} style={{
                          display:'flex', justifyContent:'space-between', alignItems:'flex-start',
                          gap:12, padding:'10px 0', borderBottom:'1px solid #EEF2F5'
                        }}>
                          <div>
                            <div style={{ fontWeight:700, color:'#0D2B5E', fontSize:13 }}>{w.title}</div>
                            <div style={{ fontSize:12, color:'#64748B', marginTop:3 }}>
                              {new Date(w.start_time).toLocaleString([], { dateStyle:'medium', timeStyle:'short' })}
                              {' – '}
                              {new Date(w.end_time).toLocaleTimeString([], { timeStyle:'short' })}
                            </div>
                            <div style={{ display:'flex', gap:12, fontSize:11.5, color:'#64748B', marginTop:4, flexWrap:'wrap' }}>
                              <span>{formatLabel[w.format]}</span>
                              {w.location && <span>📍 {w.location}</span>}
                              {w.meeting_link && (
                                <a href={w.meeting_link} target="_blank" rel="noreferrer"
                                   style={{ color:'#1A7B8C' }}>🔗 Join link</a>
                              )}
                              {w.facilitator && <span>👤 {w.facilitator}</span>}
                            </div>
                          </div>
                          <button onClick={() => downloadWorkshopIcs(w)}
                            style={{ padding:'6px 12px', borderRadius:8, border:'1.5px solid #DDE3EF',
                                     background:'white', color:'#0D2B5E', fontWeight:600, fontSize:11.5,
                                     cursor:'pointer', flexShrink:0, whiteSpace:'nowrap' }}>
                            📅 Add to calendar
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}