import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import Auth from './components/Auth'
import Shell from './components/Shell'
import Onboarding from './components/Onboarding'

export default function App() {
  const [session, setSession]         = useState(null)
  const [loading, setLoading]         = useState(true)
  const [institution, setInstitution] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)

  // Check for invite token in URL
  const urlParams   = new URLSearchParams(window.location.search)
  const inviteToken = urlParams.get('invite')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadUser(session.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) loadUser(session.user.id)
      else { setCurrentUser(null); setInstitution(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadUser(authId) {
    setLoading(true)
    const { data: user } = await supabase
      .from('users')
      .select('*, institutions(*)')
      .eq('auth_id', authId)
      .single()

    if (user) {
      setCurrentUser(user)
      setInstitution(user.institutions)

      // If user signed up via invite token, process it
      if (inviteToken) {
        await processInvite(inviteToken, authId, user)
      }
    }
    setLoading(false)
  }

  async function processInvite(token, authId, existingUser) {
    // Get invitation
    const { data: invitation } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single()

    if (!invitation) return

    // If user already exists, just update their role
    if (existingUser) {
      await supabase
        .from('users')
        .update({ role: invitation.role })
        .eq('id', existingUser.id)
    } else {
      // Create user profile from invitation
      await supabase.from('users').insert({
        auth_id:        authId,
        institution_id: invitation.institution_id,
        email:          invitation.email,
        full_name:      invitation.full_name,
        role:           invitation.role,
        rank:           invitation.rank,
        department:     invitation.department,
        college:        invitation.college,
        career_track:   invitation.career_track,
      })
    }

    // Mark invitation as accepted
    await supabase
      .from('invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id)

    // Clear token from URL
    window.history.replaceState({}, '', window.location.pathname)

    // Reload user
    loadUser(authId)
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
                  height:'100vh', fontFamily:'Arial,sans-serif', color:'#0D2B5E' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:32, marginBottom:12 }}>⚡</div>
        <div style={{ fontWeight:'bold', fontSize:18 }}>Faculty Excellence Platform</div>
        <div style={{ color:'#64748B', marginTop:6 }}>Loading...</div>
      </div>
    </div>
  )

  if (!session) return <Auth inviteToken={inviteToken} />

  if (!institution) return (
    <Onboarding
      session={session}
      onComplete={(inst, user) => {
        setInstitution(inst)
        setCurrentUser(user)
      }}
    />
  )

  return <Shell currentUser={currentUser} institution={institution} />
}