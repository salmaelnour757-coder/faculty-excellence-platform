import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function PathwaysManagement({ institution, branding }) {
  const [pathways, setPathways]     = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [workshops, setWorkshops]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [editing, setEditing]       = useState(null)
  const [creating, setCreating]     = useState(false)
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState('')

  const blank = {
    title:'', description:'', facilitator:'', format:'in_person',
    location:'', meeting_link:'', start_time:'', end_time:'', capacity:''
  }
  const [form, setForm] = useState(blank)

  useEffect(() => { loadPathways() }, [])
  useEffect(() => { if (selectedId) loadWorkshops() }, [selectedId])

  async function loadPathways() {
    const { data } = await supabase
      .from('pathways')
      .select('*')
      .eq('institution_id', institution.id)
      .order('name')
    setPathways(data || [])
    if (data && data.length > 0) setSelectedId(data[0].id)
    setLoading(false)
  }

  async function loadWorkshops() {
    const { data } = await supabase
      .from('workshops')
      .select('*')
      .eq('pathway_id', selectedId)
      .order('start_time')
    setWorkshops(data || [])
  }

  function openNew() {
    setForm(blank)
    setCreating(true)
    setEditing(null)
  }

  function openEdit(w) {
    setForm({
      title: w.title, description: w.description || '', facilitator: w.facilitator || '',
      format: w.format || 'in_person', location: w.location || '', meeting_link: w.meeting_link || '',
      start_time: toLocalInput(w.start_time), end_time: toLocalInput(w.end_time),
      capacity: w.capacity ?? ''
    })
    setEditing(w.id)
    setCreating(false)
  }

  function toLocalInput(iso) {
    const d = new Date(iso)
    const pad = n => String(n).padStart(2,'0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  async function saveWorkshop() {
    if (!form.title || !form.start_time || !form.end_time) return
    setSaving(true)

    const payload = {
      institution_id: institution.id,
      pathway_id:      selectedId,
      title:           form.title,
      description:     form.description,
      facilitator:      form.facilitator,
      format:          form.format,
      location:        form.location,
      meeting_link:    form.meeting_link,
      start_time:      new Date(form.start_time).toISOString(),
      end_time:        new Date(form.end_time).toISOString(),
      capacity:        form.capacity ? parseInt(form.capacity) : null,
    }

    const { error } = editing
      ? await supabase.from('workshops').update(payload).eq('id', editing)
      : await supabase.from('workshops').insert(payload)

    setSaving(false)
    if (!error) {
      setSaved(editing ? 'Workshop updated.' : 'Workshop added.')
      setTimeout(() => setSaved(''), 3000)
      setEditing(null)
      setCreating(false)
      loadWorkshops()
    } else {
      console.error('Workshop save failed:', error)
    }
  }

  async function deleteWorkshop(id) {
    if (!confirm('Delete this workshop?')) return
    const { error } = await supabase.from('workshops').delete().eq('id', id)
    if (!error) loadWorkshops()
    else console.error('Delete failed:', error)
  }

  function downloadIcs(w) {
    const fmt = d => new Date(d).toISOString().replace(/[-:]/g,'').split('.')[0] + 'Z'
    const loc = w.format === 'online' ? (w.meeting_link || 'Online') : (w.location || '')
    const desc = (w.description || '').replace(/\n/g,'\\n')
    const ics = [
      'BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT',
      `UID:${w.id}@fep`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(w.start_time)}`,
      `DTEND:${fmt(w.end_time)}`,
      `SUMMARY:${w.title}`,
      `DESCRIPTION:${desc}${w.facilitator ? `\\nFacilitator: ${w.facilitator}` : ''}`,
      `LOCATION:${loc}`,
      'END:VEVENT','END:VCALENDAR'
    ].join('\r\n')

    const blob = new Blob([ics], { type:'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${w.title.replace(/[^a-z0-9]/gi,'_')}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  const selectedPathway = pathways.find(p => p.id === selectedId)
  const formatLabel = { in_person:'📍 In-Person', online:'💻 Online', hybrid:'🔀 Hybrid' }

  if (loading) return <div style={{ color:'#64748B' }}>Loading pathways...</div>

  return (
    <div style={{ display:'flex', gap:20 }}>

      {/* Pathway list */}
      <div style={{ width:220, flexShrink:0, background:'white', borderRadius:10,
                    border:'1px solid #DDE3EF', padding:10, alignSelf:'flex-start',
                    boxShadow:'0 2px 12px rgba(13,43,94,.06)' }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#64748B',
                      textTransform:'uppercase', letterSpacing:.5, padding:'4px 8px 10px' }}>
          Pathways
        </div>
        {pathways.map(p => (
          <button key={p.id} onClick={() => setSelectedId(p.id)}
            style={{
              display:'block', width:'100%', padding:'9px 10px', borderRadius:8,
              border:'none', cursor:'pointer', textAlign:'left', fontSize:13,
              fontWeight: selectedId === p.id ? 700 : 400, marginBottom:2,
              background: selectedId === p.id ? '#EEF2FF' : 'transparent',
              color: selectedId === p.id ? '#0D2B5E' : '#64748B'
            }}>
            {p.name}
          </button>
        ))}
        {pathways.length === 0 && (
          <div style={{ fontSize:12, color:'#94A3B8', padding:'8px 10px' }}>
            No pathways yet — add one in Settings first.
          </div>
        )}
      </div>

      {/* Workshops for selected pathway */}
      <div style={{ flex:1 }}>
        {saved && (
          <div style={{ background:'#DCFCE7', color:'#15803D', padding:'10px 16px',
                        borderRadius:8, fontSize:13, fontWeight:600, marginBottom:16 }}>
            ✓ {saved}
          </div>
        )}

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:800, color:'#0D2B5E' }}>
              {selectedPathway?.name || 'Select a pathway'}
            </div>
            <div style={{ fontSize:12, color:'#64748B' }}>
              {workshops.length} workshop{workshops.length !== 1 ? 's' : ''} scheduled
            </div>
          </div>
          {selectedId && (
            <button onClick={openNew}
              style={{ padding:'9px 18px', borderRadius:8, border:'none',
                       background: branding.primary, color:'white',
                       fontWeight:700, fontSize:13, cursor:'pointer' }}>
              + Add Workshop
            </button>
          )}
        </div>

        {(creating || editing) && (
          <div style={{ background:'white', borderRadius:10, border:'2px solid #1A7B8C',
                        padding:18, marginBottom:16 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'#0D2B5E', marginBottom:14 }}>
              {editing ? 'Edit Workshop' : 'New Workshop'}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ fontSize:12, fontWeight:600, color:'#0D2B5E', display:'block', marginBottom:5 }}>Title</label>
                <input value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))}
                  placeholder="e.g. Active Learning Strategies Workshop"
                  style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #DDE3EF', boxSizing:'border-box' }} />
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ fontSize:12, fontWeight:600, color:'#0D2B5E', display:'block', marginBottom:5 }}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))}
                  rows={2} placeholder="What this session covers"
                  style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #DDE3EF', boxSizing:'border-box', resize:'vertical' }} />
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'#0D2B5E', display:'block', marginBottom:5 }}>Facilitator</label>
                <input value={form.facilitator} onChange={e => setForm(f=>({...f,facilitator:e.target.value}))}
                  placeholder="Name"
                  style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #DDE3EF', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'#0D2B5E', display:'block', marginBottom:5 }}>Format</label>
                <select value={form.format} onChange={e => setForm(f=>({...f,format:e.target.value}))}
                  style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #DDE3EF', boxSizing:'border-box' }}>
                  <option value="in_person">In-Person</option>
                  <option value="online">Online</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              {form.format !== 'online' && (
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:'#0D2B5E', display:'block', marginBottom:5 }}>Location</label>
                  <input value={form.location} onChange={e => setForm(f=>({...f,location:e.target.value}))}
                    placeholder="Room / building"
                    style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #DDE3EF', boxSizing:'border-box' }} />
                </div>
              )}
              {form.format !== 'in_person' && (
                <div>
                  <label style={{ fontSize:12, fontWeight:600, color:'#0D2B5E', display:'block', marginBottom:5 }}>Meeting Link</label>
                  <input value={form.meeting_link} onChange={e => setForm(f=>({...f,meeting_link:e.target.value}))}
                    placeholder="https://zoom.us/..."
                    style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #DDE3EF', boxSizing:'border-box' }} />
                </div>
              )}
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'#0D2B5E', display:'block', marginBottom:5 }}>Start</label>
                <input type="datetime-local" value={form.start_time} onChange={e => setForm(f=>({...f,start_time:e.target.value}))}
                  style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #DDE3EF', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'#0D2B5E', display:'block', marginBottom:5 }}>End</label>
                <input type="datetime-local" value={form.end_time} onChange={e => setForm(f=>({...f,end_time:e.target.value}))}
                  style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #DDE3EF', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'#0D2B5E', display:'block', marginBottom:5 }}>Capacity (optional)</label>
                <input type="number" value={form.capacity} onChange={e => setForm(f=>({...f,capacity:e.target.value}))}
                  placeholder="e.g. 30"
                  style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #DDE3EF', boxSizing:'border-box' }} />
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={saveWorkshop} disabled={saving}
                style={{ padding:'9px 20px', borderRadius:8, border:'none',
                         background:'#0D2B5E', color:'white', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                {saving ? 'Saving...' : '💾 Save Workshop'}
              </button>
              <button onClick={() => { setCreating(false); setEditing(null) }}
                style={{ padding:'9px 20px', borderRadius:8, border:'1.5px solid #DDE3EF',
                         background:'white', color:'#64748B', fontWeight:600, fontSize:13, cursor:'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {workshops.length === 0 && !creating ? (
          <div style={{ background:'white', borderRadius:10, border:'1px solid #DDE3EF',
                        padding:'32px 20px', textAlign:'center', color:'#64748B', fontSize:13 }}>
            No workshops scheduled for this pathway yet.
          </div>
        ) : (
          workshops.map(w => (
            <div key={w.id} style={{ background:'white', borderRadius:10, border:'1px solid #DDE3EF',
                                      padding:'14px 18px', marginBottom:10,
                                      display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, color:'#0D2B5E', fontSize:14 }}>{w.title}</div>
                <div style={{ fontSize:12, color:'#64748B', marginTop:3 }}>
                  {new Date(w.start_time).toLocaleString([], { dateStyle:'medium', timeStyle:'short' })}
                  {' – '}
                  {new Date(w.end_time).toLocaleTimeString([], { timeStyle:'short' })}
                </div>
                <div style={{ fontSize:12, color:'#64748B', marginTop:4, display:'flex', gap:12, flexWrap:'wrap' }}>
                  <span>{formatLabel[w.format]}</span>
                  {w.location && <span>📍 {w.location}</span>}
                  {w.facilitator && <span>👤 {w.facilitator}</span>}
                  {w.capacity && <span>👥 Capacity: {w.capacity}</span>}
                </div>
              </div>
              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                <button onClick={() => downloadIcs(w)}
                  style={{ padding:'6px 12px', borderRadius:8, border:'1.5px solid #DDE3EF',
                           background:'white', color:'#0D2B5E', fontWeight:600, fontSize:12, cursor:'pointer' }}>
                  📅 .ics
                </button>
                <button onClick={() => openEdit(w)}
                  style={{ padding:'6px 12px', borderRadius:8, border:'1.5px solid #DDE3EF',
                           background:'white', color:'#0D2B5E', fontWeight:600, fontSize:12, cursor:'pointer' }}>
                  ✏️ Edit
                </button>
                <button onClick={() => deleteWorkshop(w.id)}
                  style={{ padding:'6px 12px', borderRadius:8, border:'1.5px solid #FCA5A5',
                           background:'white', color:'#DC2626', fontWeight:600, fontSize:12, cursor:'pointer' }}>
                  🗑
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}