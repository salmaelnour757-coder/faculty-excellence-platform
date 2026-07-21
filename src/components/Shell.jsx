import { useState } from 'react'
import { supabase } from '../supabase'
import AdminDashboard from './AdminDashboard'
import FacultyDashboard from './FacultyDashboard'
import Assessment from './Assessment'
import IDP from './IDP'
import Portfolio from './Portfolio'
import Pathways from './Pathways'

export default function Shell({ currentUser, institution }) {
  const [screen, setScreen] = useState('admin-dashboard')
  const [isAdmin, setIsAdmin] = useState(true)

  const branding = institution?.branding || {
    primary: '#0D2B5E', accent: '#1A7B8C', gold: '#C9982A'
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  const adminNav = [
    { id: 'admin-dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'admin-faculty',   icon: '👥', label: 'Faculty'   },
    { id: 'admin-analytics', icon: '📈', label: 'Analytics' },
    { id: 'admin-pathways',  icon: '🎓', label: 'Pathways'  },
    { id: 'admin-settings',  icon: '⚙️', label: 'Settings'  },
  ]

  const facultyNav = [
    { id: 'faculty-dashboard', icon: '🏠', label: 'My Dashboard' },
    { id: 'assessment',        icon: '📋', label: 'Assessment'   },
    { id: 'idp',               icon: '🗺️', label: 'My IDP'       },
    { id: 'portfolio',         icon: '💼', label: 'Portfolio'    },
    { id: 'pathways',          icon: '🎓', label: 'Pathways'     },
  ]

  const nav = isAdmin ? adminNav : facultyNav

  const screenMap = {
    'admin-dashboard':  <AdminDashboard  institution={institution} currentUser={currentUser} branding={branding} />,
    'faculty-dashboard':<FacultyDashboard institution={institution} currentUser={currentUser} branding={branding} setScreen={setScreen} />,
    'assessment':       <Assessment      institution={institution} currentUser={currentUser} setScreen={setScreen} />,
    'idp':              <IDP             institution={institution} currentUser={currentUser} setScreen={setScreen} />,
    'portfolio':        <Portfolio       institution={institution} currentUser={currentUser} />,
    'pathways':         <Pathways        institution={institution} currentUser={currentUser} />,
    'admin-faculty':    <Placeholder title="Faculty Management" icon="👥" />,
    'admin-analytics':  <Placeholder title="Analytics" icon="📈" />,
    'admin-pathways':   <Placeholder title="Pathway Management" icon="🎓" />,
    'admin-settings':   <Placeholder title="Settings" icon="⚙️" />,
  }

  const initials = currentUser?.full_name
    ? currentUser.full_name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
    : 'ME'

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden',
                  fontFamily:'Arial, sans-serif' }}>

      {/* ── Sidebar ── */}
      <div style={{
        width: 240, flexShrink: 0,
        background: branding.primary,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Brand */}
        <div style={{ padding:'20px 18px 16px',
                      borderBottom:'1px solid rgba(255,255,255,.08)' }}>
          {institution?.logo_url
            ? <img src={institution.logo_url} alt="logo"
                style={{ height:32, marginBottom:8, objectFit:'contain' }} />
            : null
          }
          <div style={{ fontSize:14, fontWeight:700, color:'white', lineHeight:1.2 }}>
            {institution?.name || 'Faculty Excellence Platform'}
          </div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:2 }}>
            Faculty Excellence Platform
          </div>
        </div>

        {/* Nav */}
        <div style={{ padding:'12px 10px', flex:1, overflowY:'auto' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,.3)',
                        letterSpacing:1, textTransform:'uppercase',
                        padding:'0 8px 8px' }}>
            {isAdmin ? 'Administration' : 'My Development'}
          </div>
          {nav.map(item => (
            <button key={item.id}
              onClick={() => setScreen(item.id)}
              style={{
                display:'flex', alignItems:'center', gap:10,
                width:'100%', padding:'9px 10px', borderRadius:8,
                border:'none', cursor:'pointer', textAlign:'left',
                fontSize:13.5, fontWeight:500, marginBottom:2,
                background: screen === item.id
                  ? branding.accent
                  : 'transparent',
                color: screen === item.id
                  ? 'white'
                  : 'rgba(255,255,255,.65)',
                transition:'all .15s'
              }}>
              <span style={{ fontSize:16, width:20, textAlign:'center' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 10px',
                      borderTop:'1px solid rgba(255,255,255,.08)' }}>
          {/* Switch view */}
          <button onClick={() => {
            setIsAdmin(!isAdmin)
            setScreen(isAdmin ? 'faculty-dashboard' : 'admin-dashboard')
          }} style={{
            width:'100%', padding:'8px 12px', borderRadius:8, marginBottom:10,
            border:'1px solid rgba(255,255,255,.15)', background:'transparent',
            color:'rgba(255,255,255,.6)', fontSize:12, fontWeight:600, cursor:'pointer'
          }}>
            {isAdmin ? '👤 Switch to Faculty View' : '🔧 Switch to Admin View'}
          </button>

          {/* User */}
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'4px 8px' }}>
            <div style={{
              width:34, height:34, borderRadius:'50%', flexShrink:0,
              background: branding.gold, color: branding.primary,
              fontWeight:700, fontSize:13,
              display:'flex', alignItems:'center', justifyContent:'center'
            }}>{initials}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'white',
                            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {currentUser?.full_name || 'User'}
              </div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.4)' }}>
                {currentUser?.role === 'admin' ? 'Administrator' : currentUser?.rank || 'Faculty'}
              </div>
            </div>
            <button onClick={handleSignOut}
              title="Sign out"
              style={{ background:'none', border:'none', color:'rgba(255,255,255,.4)',
                       cursor:'pointer', fontSize:16, padding:4 }}>
              ↩
            </button>
          </div>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Topbar */}
        <div style={{
          height:60, background:'white', borderBottom:'1px solid #DDE3EF',
          display:'flex', alignItems:'center', padding:'0 24px',
          gap:14, flexShrink:0
        }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:17, fontWeight:700, color:'#0D2B5E' }}>
              {nav.find(n => n.id === screen)?.icon}{' '}
              {nav.find(n => n.id === screen)?.label || 'Faculty Excellence Platform'}
            </div>
          </div>
          <div style={{ fontSize:13, color:'#64748B' }}>
            {new Date().toLocaleDateString('en-GB', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:'auto', padding:24, background:'#F2F5FA' }}>
          {screenMap[screen] || <Placeholder title={screen} icon="📄" />}
        </div>
      </div>
    </div>
  )
}

function Placeholder({ title, icon }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
                  height:'60vh', flexDirection:'column', gap:12 }}>
      <div style={{ fontSize:48 }}>{icon}</div>
      <div style={{ fontSize:20, fontWeight:700, color:'#0D2B5E' }}>{title}</div>
      <div style={{ color:'#64748B' }}>This section is coming soon.</div>
    </div>
  )
}