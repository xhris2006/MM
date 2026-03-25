'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { isAdmin, CONTEST_CONFIG } from '@/lib/config'
import toast from 'react-hot-toast'

type Candidate = { id: string; name: string; description: string; photo_url: string | null; category: string; promotion: string; vote_count: number }
type VoteWithCandidate = { id: string; user_id: string; candidate_id: string; created_at: string; candidates: { id: string; name: string; category: string; photo_url: string | null } | null }
type UserWithVotes = { id: string; email: string; full_name: string | null; created_at: string; confirmed_at: string | null; votes: VoteWithCandidate[] }
type Tab = 'dashboard' | 'candidates' | 'users' | 'settings'

const S = {
  inp: { width: '100%', background: '#12121A', border: '1px solid rgba(255,255,255,0.1)', color: '#F0EDE6', padding: '0.7rem 0.9rem', borderRadius: '9px', fontFamily: 'Outfit,sans-serif', fontSize: '0.88rem', outline: 'none', marginBottom: '0.8rem' } as React.CSSProperties,
  lbl: { display: 'block', fontSize: '0.72rem', color: '#8A8799', letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: '0.35rem' } as React.CSSProperties,
  card: { background: '#1A1A26', border: '1px solid rgba(201,168,76,0.12)', borderRadius: '14px', padding: '1.3rem' } as React.CSSProperties,
  badge: (color: string) => ({ fontSize: '0.67rem', color, background: color + '22', padding: '0.15rem 0.55rem', borderRadius: '50px', border: '1px solid ' + color + '44', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' as const }),
}
function fmt(iso: string) { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }

export default function AdminPage() {
  const [authOk, setAuthOk] = useState(false)
  const [tab, setTab] = useState<Tab>('dashboard')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user || !isAdmin(data.user.email)) { router.push('/'); return }
      setAuthOk(true)
    })
  }, [])

  if (!authOk) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', color:'#8A8799', flexDirection:'column', gap:'1rem' }}><div style={{ fontSize:'2rem', animation:'float 1.5s ease-in-out infinite' }}>👑</div><p style={{ letterSpacing:'3px', textTransform:'uppercase', fontSize:'0.8rem' }}>Vérification...</p></div>

  const TABS: {key:Tab;label:string;icon:string}[] = [
    {key:'dashboard',label:'Tableau de bord',icon:'📊'},
    {key:'candidates',label:'Candidats',icon:'👥'},
    {key:'users',label:'Utilisateurs',icon:'🧑‍💼'},
    {key:'settings',label:'Paramètres',icon:'⚙️'},
  ]

  return (
    <div style={{ maxWidth:'1200px', margin:'0 auto', padding:'1.5rem 1rem 4rem' }}>
      <h1 style={{ fontFamily:'Playfair Display,serif', fontSize:'clamp(1.5rem,3vw,2rem)', fontWeight:900, background:'linear-gradient(135deg,#E8C97A,#C9A84C)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', marginBottom:'1.8rem' }}>⚙️ Panneau Admin</h1>
      <div style={{ display:'flex', gap:'0.5rem', marginBottom:'2rem', flexWrap:'wrap' }}>
        {TABS.map(t => <button key={t.key} onClick={()=>setTab(t.key)} style={{ padding:'0.55rem 1.1rem', border:`1px solid ${tab===t.key?'rgba(201,168,76,0.6)':'rgba(255,255,255,0.09)'}`, borderRadius:'10px', background:tab===t.key?'rgba(201,168,76,0.1)':'transparent', color:tab===t.key?'#C9A84C':'#8A8799', fontFamily:'Outfit,sans-serif', cursor:'pointer', fontSize:'0.86rem', transition:'all 0.2s' }}>{t.icon} {t.label}</button>)}
      </div>
      {tab==='dashboard' && <DashboardTab />}
      {tab==='candidates' && <CandidatesTab />}
      {tab==='users' && <UsersTab />}
      {tab==='settings' && <SettingsTab />}
    </div>
  )
}

function DashboardTab() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [stats, setStats] = useState({ total:0, miss:0, master:0 })
  const supabase = createClient()
  useEffect(() => {
    const load = async () => {
      const {data:c} = await supabase.from('candidates').select('*').order('vote_count',{ascending:false})
      const cands = c||[]; setCandidates(cands)
      const total = cands.reduce((s:number,x:Candidate)=>s+x.vote_count,0)
      const miss = cands.filter((x:Candidate)=>x.category==='miss').reduce((s:number,x:Candidate)=>s+x.vote_count,0)
      setStats({total,miss,master:total-miss})
    }
    load()
  },[])
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'1rem', marginBottom:'2rem' }}>
        {[{l:'Total votes',v:stats.total,c:'#C9A84C',i:'🗳'},{l:'Votes Miss',v:stats.miss,c:'#D4547A',i:'♛'},{l:'Votes Master',v:stats.master,c:'#4A8FD4',i:'♚'},{l:'Candidats',v:candidates.length,c:'#4CAF7D',i:'👥'}].map(s=>(
          <div key={s.l} style={{...S.card,textAlign:'center'}}>
            <div style={{fontSize:'1.6rem',marginBottom:'0.4rem'}}>{s.i}</div>
            <div style={{fontFamily:'Playfair Display,serif',fontSize:'2rem',fontWeight:700,color:s.c}}>{s.v}</div>
            <div style={{fontSize:'0.68rem',color:'#8A8799',textTransform:'uppercase',letterSpacing:'1px'}}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={S.card}>
        <h3 style={{color:'#C9A84C',marginBottom:'1rem',fontFamily:'Playfair Display,serif'}}>Classement</h3>
        {candidates.slice(0,10).map((c,i)=>(
          <div key={c.id} style={{display:'flex',alignItems:'center',gap:'0.8rem',padding:'0.6rem 0',borderBottom:'1px solid rgba(255,255,255,0.04)',fontSize:'0.88rem'}}>
            <span style={{minWidth:'24px',color:'#8A8799'}}>#{i+1}</span>
            <span style={{flex:1}}>{c.name}</span>
            <span style={S.badge(c.category==='miss'?'#D4547A':'#4A8FD4')}>{c.category}</span>
            <span style={{color:'#C9A84C',fontWeight:600,minWidth:'50px',textAlign:'right'}}>{c.vote_count} votes</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CandidatesTab() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string|null>(null)
  const [form, setForm] = useState({name:'',description:'',category:'miss',promotion:'',photo_url:''})
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const load = useCallback(async()=>{const{data}=await supabase.from('candidates').select('*').order('vote_count',{ascending:false});setCandidates(data||[])},[])
  useEffect(()=>{load()},[load])
  const handlePhoto = async(e:React.ChangeEvent<HTMLInputElement>)=>{const file=e.target.files?.[0];if(!file)return;setUploading(true);const fd=new FormData();fd.append('file',file);const res=await fetch('/api/admin/upload',{method:'POST',body:fd});const d=await res.json();setUploading(false);if(d.url){setForm(f=>({...f,photo_url:d.url}));toast.success('Photo OK')}else toast.error(d.error)}
  const handleSave=async(e:React.FormEvent)=>{e.preventDefault();setSaving(true);const url=editId?`/api/candidates/${editId}`:'/api/candidates';const res=await fetch(url,{method:editId?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});const d=await res.json();setSaving(false);if(res.ok){toast.success(editId?'Modifié':'Ajouté');resetForm();load()}else toast.error(d.error)}
  const handleDelete=async(c:Candidate)=>{if(!confirm('Supprimer '+c.name+' ?'))return;const res=await fetch('/api/candidates/'+c.id,{method:'DELETE'});if(res.ok){toast.success('Supprimé');load()}else toast.error('Erreur')}
  const resetForm=()=>{setShowForm(false);setEditId(null);setForm({name:'',description:'',category:'miss',promotion:'',photo_url:''})}
  const startEdit=(c:Candidate)=>{setEditId(c.id);setForm({name:c.name,description:c.description,category:c.category,promotion:c.promotion,photo_url:c.photo_url||''});setShowForm(true)}
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.3rem',flexWrap:'wrap',gap:'0.8rem'}}>
        <h2 style={{fontFamily:'Playfair Display,serif'}}>Candidats ({candidates.length})</h2>
        <button onClick={()=>{resetForm();setShowForm(true)}} style={{background:'linear-gradient(135deg,#C9A84C,#9A7A30)',border:'none',color:'#0A0A0F',padding:'0.6rem 1.3rem',borderRadius:'9px',fontFamily:'Outfit,sans-serif',fontWeight:700,cursor:'pointer'}}>+ Ajouter</button>
      </div>
      {showForm&&(
        <div style={{...S.card,border:'1px solid rgba(201,168,76,0.3)',marginBottom:'1.3rem'}}>
          <h3 style={{color:'#C9A84C',marginBottom:'1rem'}}>{editId?'Modifier':'Nouveau candidat'}</h3>
          <form onSubmit={handleSave}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'1rem'}}>
              <div>
                <label style={S.lbl}>Nom *</label><input style={S.inp} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required placeholder="Marie Nguemo"/>
                <label style={S.lbl}>Catégorie *</label>
                <select style={{...S.inp,cursor:'pointer'}} value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}><option value="miss">Miss IAI</option><option value="master">Master IAI</option></select>
                <label style={S.lbl}>Promotion</label><input style={S.inp} value={form.promotion} onChange={e=>setForm(f=>({...f,promotion:e.target.value}))} placeholder="Licence 3"/>
              </div>
              <div>
                <label style={S.lbl}>Description</label>
                <textarea style={{...S.inp,height:'90px',resize:'vertical'}} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Présentation..."/>
                <label style={S.lbl}>Photo</label>
                <input type="file" accept="image/*" onChange={handlePhoto} style={{...S.inp,padding:'0.4rem'}}/>
                {uploading&&<p style={{color:'#8A8799',fontSize:'0.75rem'}}>Upload...</p>}
                {form.photo_url&&<div style={{position:'relative',width:60,height:60,borderRadius:'8px',overflow:'hidden',marginTop:'0.4rem'}}><Image src={form.photo_url} alt="" fill style={{objectFit:'cover'}}/></div>}
              </div>
            </div>
            <div style={{display:'flex',gap:'0.7rem',marginTop:'0.5rem'}}>
              <button type="submit" disabled={saving} style={{flex:1,background:'linear-gradient(135deg,#C9A84C,#9A7A30)',border:'none',color:'#0A0A0F',padding:'0.75rem',borderRadius:'9px',fontFamily:'Outfit,sans-serif',fontWeight:700,cursor:'pointer',opacity:saving?0.7:1}}>{saving?'...':editId?'Sauvegarder':'Ajouter'}</button>
              <button type="button" onClick={resetForm} style={{padding:'0.75rem 1.2rem',background:'transparent',border:'1px solid rgba(255,255,255,0.15)',color:'#8A8799',borderRadius:'9px',cursor:'pointer',fontFamily:'Outfit,sans-serif'}}>Annuler</button>
            </div>
          </form>
        </div>
      )}
      <div style={{display:'flex',flexDirection:'column',gap:'0.7rem'}}>
        {candidates.map(c=>(
          <div key={c.id} style={{...S.card,display:'flex',alignItems:'center',gap:'0.9rem',flexWrap:'wrap'}}>
            <div style={{position:'relative',width:48,height:48,borderRadius:'50%',overflow:'hidden',flexShrink:0}}>
              {c.photo_url?<Image src={c.photo_url} alt={c.name} fill style={{objectFit:'cover'}}/>:<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.4rem',background:'#12121A'}}>{c.category==='miss'?'👸':'🤴'}</div>}
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:600,fontSize:'0.9rem'}}>{c.name}</div>
              <div style={{fontSize:'0.72rem',color:'#8A8799'}}>{c.promotion}</div>
              <span style={S.badge(c.category==='miss'?'#D4547A':'#4A8FD4')}>{c.category==='miss'?'Miss':'Master'}</span>
            </div>
            <div style={{textAlign:'center',minWidth:'48px'}}>
              <div style={{fontFamily:'Playfair Display,serif',fontSize:'1.3rem',fontWeight:700,color:'#C9A84C'}}>{c.vote_count}</div>
              <div style={{fontSize:'0.63rem',color:'#8A8799'}}>votes</div>
            </div>
            <div style={{display:'flex',gap:'0.4rem'}}>
              <button onClick={()=>startEdit(c)} style={{background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.28)',color:'#C9A84C',padding:'0.42rem 0.8rem',borderRadius:'7px',cursor:'pointer',fontFamily:'Outfit,sans-serif',fontSize:'0.78rem'}}>✏️ Modifier</button>
              <button onClick={()=>handleDelete(c)} style={{background:'rgba(224,82,82,0.1)',border:'1px solid rgba(224,82,82,0.28)',color:'#E05252',padding:'0.42rem 0.8rem',borderRadius:'7px',cursor:'pointer',fontFamily:'Outfit,sans-serif',fontSize:'0.78rem'}}>🗑 Suppr.</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function UsersTab() {
  const [users, setUsers] = useState<UserWithVotes[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string|null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string|null>(null)
  const [editVoteModal, setEditVoteModal] = useState<{userId:string;vote:VoteWithCandidate}|null>(null)
  const [addVoteModal, setAddVoteModal] = useState<string|null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [page, setPage] = useState(0)
  const PER_PAGE = 15
  const supabase = createClient()

  const loadUsers = useCallback(async()=>{
    setLoading(true)
    try{const res=await fetch('/api/admin/users');const data=await res.json();if(!res.ok)throw new Error(data.error);setUsers(Array.isArray(data)?data:[])}
    catch(e:any){toast.error(e.message)}finally{setLoading(false)}
  },[])

  const loadCandidates = useCallback(async()=>{
    const{data}=await supabase.from('candidates').select('*').order('name');setCandidates(data||[])
  },[])

  useEffect(()=>{loadUsers();loadCandidates()},[])

  const filtered=users.filter(u=>u.email?.toLowerCase().includes(search.toLowerCase())||u.full_name?.toLowerCase().includes(search.toLowerCase()))
  const paginated=filtered.slice(page*PER_PAGE,(page+1)*PER_PAGE)
  const totalPages=Math.ceil(filtered.length/PER_PAGE)

  const doAction=async(url:string,opts:RequestInit,successMsg:string,after:()=>void)=>{
    setActionLoading(true)
    try{const res=await fetch(url,opts);const d=await res.json();if(!res.ok)throw new Error(d.error);toast.success(successMsg);after();await loadUsers()}
    catch(e:any){toast.error(e.message)}finally{setActionLoading(false)}
  }

  const handleDeleteUser=(id:string)=>doAction(`/api/admin/users/${id}`,{method:'DELETE'},'Utilisateur supprimé.',()=>{setDeleteConfirm(null);setExpandedId(null)})
  const handleDeleteVote=(uid:string,vid:string)=>doAction(`/api/admin/users/${uid}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'delete_vote',voteId:vid})},'Vote supprimé.',()=>{})
  const handleChangeVote=(uid:string,vid:string,newCid:string)=>doAction(`/api/admin/users/${uid}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'change_vote',voteId:vid,newCandidateId:newCid})},'Vote modifié.',()=>setEditVoteModal(null))
  const handleAddVote=(uid:string,cid:string)=>doAction(`/api/admin/users/${uid}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'add_vote',candidateId:cid})},'Vote ajouté.',()=>setAddVoteModal(null))

  if(loading)return<div style={{textAlign:'center',padding:'4rem',color:'#8A8799'}}><div style={{fontSize:'2rem',marginBottom:'1rem',animation:'float 1.5s ease-in-out infinite'}}>🧑‍💼</div><p style={{letterSpacing:'3px',textTransform:'uppercase',fontSize:'0.8rem'}}>Chargement...</p></div>

  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.3rem',flexWrap:'wrap',gap:'0.8rem'}}>
        <h2 style={{fontFamily:'Playfair Display,serif'}}>Utilisateurs <span style={{color:'#C9A84C'}}>({filtered.length})</span></h2>
        <button onClick={loadUsers} style={{background:'transparent',border:'1px solid rgba(201,168,76,0.3)',color:'#C9A84C',padding:'0.5rem 1rem',borderRadius:'8px',cursor:'pointer',fontFamily:'Outfit,sans-serif',fontSize:'0.82rem'}}>↻ Actualiser</button>
      </div>

      {/* Search */}
      <div style={{position:'relative',marginBottom:'1.3rem'}}>
        <span style={{position:'absolute',left:'0.9rem',top:'50%',transform:'translateY(-50%)',color:'#8A8799'}}>🔍</span>
        <input type="text" placeholder="Rechercher par nom ou email..." value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}} style={{...S.inp,paddingLeft:'2.4rem',marginBottom:0,border:'1px solid rgba(201,168,76,0.2)'}}/>
      </div>

      {paginated.length===0?(
        <div style={{textAlign:'center',padding:'3rem',color:'#8A8799',border:'1px dashed rgba(201,168,76,0.15)',borderRadius:'14px'}}>
          <p style={{fontSize:'2rem'}}>👥</p>
          <p style={{marginTop:'0.8rem',letterSpacing:'2px',textTransform:'uppercase',fontSize:'0.8rem'}}>{search?'Aucun résultat':'Aucun utilisateur inscrit'}</p>
        </div>
      ):(
        <div style={{display:'flex',flexDirection:'column',gap:'0.7rem'}}>
          {paginated.map(u=>{
            const isExpanded=expandedId===u.id
            const isDeleting=deleteConfirm===u.id
            const nbVotes=u.votes.length
            return(
              <div key={u.id} style={{background:'#1A1A26',border:`1px solid ${isExpanded?'rgba(201,168,76,0.35)':'rgba(201,168,76,0.1)'}`,borderRadius:'14px',overflow:'hidden',transition:'border-color 0.2s'}}>
                {/* Row */}
                <div style={{display:'flex',alignItems:'center',gap:'0.9rem',padding:'1rem 1.2rem',flexWrap:'wrap',cursor:'pointer'}} onClick={()=>setExpandedId(isExpanded?null:u.id)}>
                  <div style={{width:42,height:42,borderRadius:'50%',background:'linear-gradient(135deg,#C9A84C33,#C9A84C11)',border:'1px solid rgba(201,168,76,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.1rem',flexShrink:0,fontWeight:700,color:'#C9A84C'}}>
                    {(u.full_name||u.email||'?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{flex:1,minWidth:'150px'}}>
                    <div style={{fontWeight:600,fontSize:'0.9rem'}}>{u.full_name||<span style={{color:'#8A8799',fontStyle:'italic'}}>Nom non renseigné</span>}</div>
                    <div style={{fontSize:'0.75rem',color:'#8A8799',marginTop:'1px'}}>{u.email}</div>
                    <div style={{fontSize:'0.67rem',color:'#5A5770',marginTop:'2px'}}>Inscrit le {fmt(u.created_at)}</div>
                  </div>
                  <div style={{textAlign:'center',minWidth:'55px'}}>
                    <div style={{fontFamily:'Playfair Display,serif',fontSize:'1.4rem',fontWeight:700,color:nbVotes>0?'#C9A84C':'#5A5770'}}>{nbVotes}</div>
                    <div style={{fontSize:'0.62rem',color:'#8A8799',textTransform:'uppercase',letterSpacing:'1px'}}>vote{nbVotes!==1?'s':''}</div>
                  </div>
                  <div style={{display:'flex',gap:'0.4rem',alignItems:'center'}} onClick={e=>e.stopPropagation()}>
                    <button onClick={()=>setExpandedId(isExpanded?null:u.id)} style={{background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.25)',color:'#C9A84C',padding:'0.4rem 0.8rem',borderRadius:'7px',cursor:'pointer',fontFamily:'Outfit,sans-serif',fontSize:'0.78rem'}}>{isExpanded?'▲ Fermer':'▼ Détails'}</button>
                    <button onClick={()=>setDeleteConfirm(isDeleting?null:u.id)} style={{background:'rgba(224,82,82,0.1)',border:'1px solid rgba(224,82,82,0.28)',color:'#E05252',padding:'0.4rem 0.8rem',borderRadius:'7px',cursor:'pointer',fontFamily:'Outfit,sans-serif',fontSize:'0.78rem'}}>🗑</button>
                  </div>
                </div>

                {/* Delete confirm */}
                {isDeleting&&(
                  <div style={{padding:'0.9rem 1.2rem',background:'rgba(224,82,82,0.07)',borderTop:'1px solid rgba(224,82,82,0.2)'}}>
                    <p style={{color:'#E05252',fontSize:'0.83rem',marginBottom:'0.7rem'}}>⚠️ Supprimer <strong>{u.email}</strong> et ses <strong>{nbVotes} vote{nbVotes!==1?'s':''}</strong> ? Action irréversible.</p>
                    <div style={{display:'flex',gap:'0.6rem'}}>
                      <button onClick={()=>handleDeleteUser(u.id)} disabled={actionLoading} style={{background:'#E05252',border:'none',color:'white',padding:'0.5rem 1.1rem',borderRadius:'8px',cursor:'pointer',fontFamily:'Outfit,sans-serif',fontWeight:700,fontSize:'0.82rem',opacity:actionLoading?0.7:1}}>{actionLoading?'...':'Oui, supprimer'}</button>
                      <button onClick={()=>setDeleteConfirm(null)} style={{background:'transparent',border:'1px solid rgba(255,255,255,0.15)',color:'#8A8799',padding:'0.5rem 1rem',borderRadius:'8px',cursor:'pointer',fontFamily:'Outfit,sans-serif',fontSize:'0.82rem'}}>Annuler</button>
                    </div>
                  </div>
                )}

                {/* Expanded votes */}
                {isExpanded&&(
                  <div style={{padding:'0.9rem 1.2rem 1.2rem',borderTop:'1px solid rgba(255,255,255,0.05)'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.8rem',flexWrap:'wrap',gap:'0.5rem'}}>
                      <p style={{fontSize:'0.8rem',color:'#8A8799',letterSpacing:'1px',textTransform:'uppercase'}}>Votes ({nbVotes})</p>
                      <button onClick={()=>setAddVoteModal(u.id)} style={{background:'rgba(76,175,125,0.15)',border:'1px solid rgba(76,175,125,0.35)',color:'#4CAF7D',padding:'0.35rem 0.8rem',borderRadius:'7px',cursor:'pointer',fontFamily:'Outfit,sans-serif',fontSize:'0.75rem',fontWeight:600}}>+ Ajouter un vote</button>
                    </div>
                    {u.votes.length===0
                      ?<p style={{color:'#5A5770',fontSize:'0.82rem',fontStyle:'italic'}}>Aucun vote enregistré.</p>
                      :<div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
                        {u.votes.map(v=>(
                          <div key={v.id} style={{display:'flex',alignItems:'center',gap:'0.8rem',background:'#12121A',borderRadius:'9px',padding:'0.6rem 0.9rem',flexWrap:'wrap'}}>
                            <div style={{position:'relative',width:34,height:34,borderRadius:'50%',overflow:'hidden',flexShrink:0}}>
                              {v.candidates?.photo_url?<Image src={v.candidates.photo_url} alt="" fill style={{objectFit:'cover'}}/>:<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1rem',background:'#1A1A26'}}>{v.candidates?.category==='miss'?'👸':'🤴'}</div>}
                            </div>
                            <div style={{flex:1}}>
                              <div style={{fontWeight:600,fontSize:'0.85rem'}}>{v.candidates?.name||'Candidat supprimé'}</div>
                              <div style={{display:'flex',gap:'0.5rem',alignItems:'center',marginTop:'2px',flexWrap:'wrap'}}>
                                {v.candidates?.category&&<span style={S.badge(v.candidates.category==='miss'?'#D4547A':'#4A8FD4')}>{v.candidates.category}</span>}
                                <span style={{fontSize:'0.65rem',color:'#5A5770'}}>{fmt(v.created_at)}</span>
                              </div>
                            </div>
                            <div style={{display:'flex',gap:'0.4rem'}}>
                              <button onClick={()=>setEditVoteModal({userId:u.id,vote:v})} style={{background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.25)',color:'#C9A84C',padding:'0.32rem 0.65rem',borderRadius:'6px',cursor:'pointer',fontFamily:'Outfit,sans-serif',fontSize:'0.72rem'}}>✏️ Changer</button>
                              <button onClick={()=>handleDeleteVote(u.id,v.id)} disabled={actionLoading} style={{background:'rgba(224,82,82,0.1)',border:'1px solid rgba(224,82,82,0.25)',color:'#E05252',padding:'0.32rem 0.65rem',borderRadius:'6px',cursor:'pointer',fontFamily:'Outfit,sans-serif',fontSize:'0.72rem',opacity:actionLoading?0.6:1}}>🗑</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    }
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages>1&&(
        <div style={{display:'flex',justifyContent:'center',gap:'0.5rem',marginTop:'1.5rem',flexWrap:'wrap'}}>
          <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{padding:'0.5rem 1rem',border:'1px solid rgba(201,168,76,0.25)',borderRadius:'8px',background:'transparent',color:page===0?'#5A5770':'#C9A84C',cursor:page===0?'default':'pointer',fontFamily:'Outfit,sans-serif',fontSize:'0.82rem'}}>← Précédent</button>
          {Array.from({length:totalPages},(_,i)=><button key={i} onClick={()=>setPage(i)} style={{padding:'0.5rem 0.85rem',border:`1px solid ${i===page?'rgba(201,168,76,0.6)':'rgba(255,255,255,0.1)'}`,borderRadius:'8px',background:i===page?'rgba(201,168,76,0.15)':'transparent',color:i===page?'#C9A84C':'#8A8799',cursor:'pointer',fontFamily:'Outfit,sans-serif',fontSize:'0.82rem',fontWeight:i===page?700:400}}>{i+1}</button>)}
          <button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page===totalPages-1} style={{padding:'0.5rem 1rem',border:'1px solid rgba(201,168,76,0.25)',borderRadius:'8px',background:'transparent',color:page===totalPages-1?'#5A5770':'#C9A84C',cursor:page===totalPages-1?'default':'pointer',fontFamily:'Outfit,sans-serif',fontSize:'0.82rem'}}>Suivant →</button>
        </div>
      )}

      {/* Edit vote modal */}
      {editVoteModal&&(
        <div onClick={e=>{if(e.target===e.currentTarget)setEditVoteModal(null)}} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.82)',backdropFilter:'blur(8px)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}>
          <div style={{background:'#1A1A26',border:'1px solid rgba(201,168,76,0.25)',borderRadius:'18px',padding:'1.8rem',maxWidth:'440px',width:'100%'}}>
            <h3 style={{fontFamily:'Playfair Display,serif',color:'#C9A84C',marginBottom:'0.4rem'}}>Modifier le vote</h3>
            <p style={{color:'#8A8799',fontSize:'0.82rem',marginBottom:'1.3rem'}}>Vote actuel : <strong style={{color:'#F0EDE6'}}>{editVoteModal.vote.candidates?.name}</strong></p>
            <label style={S.lbl}>Rediriger vers</label>
            <select defaultValue={editVoteModal.vote.candidate_id} id="edit-vote-sel" style={{...S.inp,cursor:'pointer',marginBottom:'1.3rem'}}>
              {candidates.filter(c=>c.category===editVoteModal.vote.candidates?.category).map(c=><option key={c.id} value={c.id}>{c.name} ({c.vote_count} votes)</option>)}
            </select>
            <div style={{display:'flex',gap:'0.7rem'}}>
              <button onClick={()=>{const sel=(document.getElementById('edit-vote-sel') as HTMLSelectElement).value;handleChangeVote(editVoteModal.userId,editVoteModal.vote.id,sel)}} disabled={actionLoading} style={{flex:1,background:'linear-gradient(135deg,#C9A84C,#9A7A30)',border:'none',color:'#0A0A0F',padding:'0.75rem',borderRadius:'9px',fontFamily:'Outfit,sans-serif',fontWeight:700,cursor:'pointer',opacity:actionLoading?0.6:1}}>{actionLoading?'...':'Confirmer'}</button>
              <button onClick={()=>setEditVoteModal(null)} style={{padding:'0.75rem 1.2rem',background:'transparent',border:'1px solid rgba(255,255,255,0.15)',color:'#8A8799',borderRadius:'9px',cursor:'pointer',fontFamily:'Outfit,sans-serif'}}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Add vote modal */}
      {addVoteModal&&(
        <div onClick={e=>{if(e.target===e.currentTarget)setAddVoteModal(null)}} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.82)',backdropFilter:'blur(8px)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}>
          <div style={{background:'#1A1A26',border:'1px solid rgba(76,175,125,0.25)',borderRadius:'18px',padding:'1.8rem',maxWidth:'440px',width:'100%'}}>
            <h3 style={{fontFamily:'Playfair Display,serif',color:'#4CAF7D',marginBottom:'0.4rem'}}>Ajouter un vote</h3>
            <p style={{color:'#8A8799',fontSize:'0.82rem',marginBottom:'1.3rem'}}>Attribuer manuellement un vote à cet utilisateur.</p>
            <label style={S.lbl}>Candidat</label>
            <select id="add-vote-sel" style={{...S.inp,cursor:'pointer',marginBottom:'1.3rem'}}>
              {candidates.map(c=><option key={c.id} value={c.id}>{c.category==='miss'?'♛':'♚'} {c.name} — {c.vote_count} votes</option>)}
            </select>
            <div style={{display:'flex',gap:'0.7rem'}}>
              <button onClick={()=>{const sel=(document.getElementById('add-vote-sel') as HTMLSelectElement).value;handleAddVote(addVoteModal,sel)}} disabled={actionLoading} style={{flex:1,background:'linear-gradient(135deg,#4CAF7D,#2d8a5a)',border:'none',color:'white',padding:'0.75rem',borderRadius:'9px',fontFamily:'Outfit,sans-serif',fontWeight:700,cursor:'pointer',opacity:actionLoading?0.6:1}}>{actionLoading?'...':'Ajouter'}</button>
              <button onClick={()=>setAddVoteModal(null)} style={{padding:'0.75rem 1.2rem',background:'transparent',border:'1px solid rgba(255,255,255,0.15)',color:'#8A8799',borderRadius:'9px',cursor:'pointer',fontFamily:'Outfit,sans-serif'}}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SettingsTab() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [stats, setStats] = useState({total:0})
  const [showReset, setShowReset] = useState(false)
  const [resetting, setResetting] = useState(false)
  const supabase = createClient()
  useEffect(()=>{supabase.from('candidates').select('*').then(({data})=>{const c=data||[];setCandidates(c);setStats({total:c.reduce((s:number,x:Candidate)=>s+x.vote_count,0)})})},[])
  const handleReset=async()=>{setResetting(true);const res=await fetch('/api/admin/reset',{method:'DELETE'});setResetting(false);if(res.ok){toast.success('Réinitialisé !');setShowReset(false);setCandidates([]);setStats({total:0})}else toast.error('Erreur')}
  return(
    <div style={{maxWidth:'560px'}}>
      <div style={{...S.card,marginBottom:'1.3rem'}}>
        <h3 style={{color:'#C9A84C',marginBottom:'0.9rem'}}>📅 Dates du concours</h3>
        {[['Début',CONTEST_CONFIG.voteStartDate],['Fin',CONTEST_CONFIG.voteEndDate]].map(([l,d])=>(
          <div key={String(l)} style={{display:'flex',justifyContent:'space-between',padding:'0.6rem 0',borderBottom:'1px solid rgba(255,255,255,0.04)',fontSize:'0.88rem'}}>
            <span style={{color:'#8A8799'}}>{String(l)} des votes</span>
            <span>{(d as Date).toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'})}</span>
          </div>
        ))}
        <p style={{fontSize:'0.73rem',color:'#5A5770',marginTop:'0.9rem',lineHeight:1.5}}>Modifiez dans Vercel → Settings → Environment Variables</p>
      </div>
      <div style={{background:'rgba(224,82,82,0.07)',border:'1px solid rgba(224,82,82,0.27)',borderRadius:'14px',padding:'1.3rem'}}>
        <h3 style={{color:'#E05252',marginBottom:'0.5rem'}}>🚨 Réinitialisation</h3>
        <p style={{color:'#8A8799',fontSize:'0.83rem',lineHeight:1.6,marginBottom:'1rem'}}>Supprime tous les candidats et votes. Irréversible.</p>
        {!showReset
          ?<button onClick={()=>setShowReset(true)} style={{background:'transparent',border:'1px solid rgba(224,82,82,0.4)',color:'#E05252',padding:'0.6rem 1.3rem',borderRadius:'9px',cursor:'pointer',fontFamily:'Outfit,sans-serif',fontWeight:600,fontSize:'0.88rem'}}>🗑 Réinitialiser</button>
          :<div>
            <p style={{color:'#E05252',marginBottom:'0.8rem',fontSize:'0.85rem',fontWeight:600}}>Confirmer la suppression de {candidates.length} candidats et {stats.total} votes ?</p>
            <div style={{display:'flex',gap:'0.7rem'}}>
              <button onClick={handleReset} disabled={resetting} style={{background:'#E05252',border:'none',color:'white',padding:'0.6rem 1.3rem',borderRadius:'9px',cursor:'pointer',fontFamily:'Outfit,sans-serif',fontWeight:700,opacity:resetting?0.7:1}}>{resetting?'...':'Oui, supprimer'}</button>
              <button onClick={()=>setShowReset(false)} style={{background:'transparent',border:'1px solid rgba(255,255,255,0.15)',color:'#8A8799',padding:'0.6rem 1.1rem',borderRadius:'9px',cursor:'pointer',fontFamily:'Outfit,sans-serif'}}>Annuler</button>
            </div>
          </div>
        }
      </div>
    </div>
  )
}
