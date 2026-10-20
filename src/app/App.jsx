import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, BriefcaseBusiness, CalendarDays,
  Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CircleDollarSign, ClipboardList, Clock3,
  FileText, Filter, Flag, HardHat, Home, Mail, Menu, MessageSquare, MoreHorizontal, Plus, Search,
  Settings as SettingsIcon, SlidersHorizontal, Sparkles, Users, Wallet, X, RefreshCw, Download, Eye,
  Pencil, Trash2, CheckCheck, Building2, BarChart3, PanelLeftClose, PanelLeftOpen, Send, RotateCcw,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { createSeed, day } from '../data/mockData'
import { activeProjects, csvDownload, daysFromNow, invoiceAging, money, openPipeline, outstanding, overdueInvoices, revisedContract, shortDate } from '../utils/calculations'

const STORE = 'siteledger-demo-v1'
const navItems = [
  { label:'Overview', path:'/dashboard', icon:Home },
  { label:'Leads & CRM', path:'/leads', icon:Users },
  { label:'Customers', path:'/customers', icon:Building2 },
  { label:'Projects', path:'/projects', icon:HardHat },
  { label:'Schedule & Tasks', path:'/schedule', icon:CalendarDays },
  { label:'Quotes & Variations', path:'/quotes', icon:FileText },
  { label:'Finance', path:'/finance', icon:Wallet },
  { label:'Communications', path:'/communications', icon:Mail },
  { label:'Reports', path:'/reports', icon:BarChart3 },
  { label:'Integrations', path:'/integrations', icon:RefreshCw },
]
const titleFor = (path) => navItems.find((item) => path.startsWith(item.path) && item.path !== '/dashboard')?.label || (path === '/dashboard' ? 'Overview' : path === '/settings' ? 'Settings' : 'Project workspace')
const statusTone = (value='') => {
  const key = value.toLowerCase()
  if (/paid|completed|accepted|approved|won|on track|active/.test(key)) return 'green'
  if (/overdue|delayed|blocked|critical|declined|lost|cancelled/.test(key)) return 'red'
  if (/risk|sent|progress|awaiting|priced|scheduled|qualified|partial|hold/.test(key)) return 'amber'
  return 'slate'
}

function readSeed() {
  try {
    const saved = localStorage.getItem(STORE)
    if (!saved) return createSeed()
    const parsed = JSON.parse(saved)
    const initial = createSeed()
    return Object.fromEntries(Object.keys(initial).map((key) => {
      const value = parsed?.[key]
      if (Array.isArray(initial[key])) return [key, Array.isArray(value) ? value : initial[key]]
      if (key === 'settings') return [key, value && typeof value === 'object' ? { ...initial.settings, ...value } : initial.settings]
      return [key, value ?? initial[key]]
    }))
  } catch {
    return createSeed()
  }
}

export default function App() {
  const [data, setData] = useState(readSeed)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [search, setSearch] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [drawer, setDrawer] = useState(null)
  const [modal, setModal] = useState(null)
  const location = useLocation()
  const navigate = useNavigate()
  const currency = data.settings.currency
  const searchInput = useRef(null)

  useEffect(() => { localStorage.setItem(STORE, JSON.stringify(data)) }, [data])
  useEffect(() => { setMobileNav(false); setSearch('') }, [location.pathname])
  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])
  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchInput.current?.focus()
      }
      if (event.key === 'Escape') {
        setSearch('')
        setNotificationsOpen(false)
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])
  const update = (key, value) => setData((current) => ({ ...current, [key]: value }))
  const patchRecord = (key, id, patch) => update(key, patch._deleted ? data[key].filter((item) => item.id !== id) : data[key].map((item) => item.id === id ? { ...item, ...patch } : item))
  const addActivity = (title, description, module, recordId) => update('activity', [{ id:`a-${Date.now()}`, title, description, module, recordId, date:day(0) }, ...data.activity].slice(0, 30))
  const notify = (message) => setToast(message)
  const openDetails = (record, type) => setDrawer({ record, type })
  const openForm = (type, record = null) => setModal({ type, record })
  const saveForm = (type, record, values) => {
    const listKey = { Lead:'leads', Customer:'customers', Task:'tasks', Quote:'quotes', Variation:'variations' }[type]
    if (!listKey) return
    if (record) {
      patchRecord(listKey, record.id, values)
      notify(`${type} updated`)
      addActivity(`${type} updated`, `${record.name || record.title || record.reference || record.number} was updated`, type, record.id)
    } else {
      const fresh = { ...values, id:`${type.toLowerCase()}-${Date.now()}` }
      if (type === 'Lead') fresh.activity = []
      update(listKey, [fresh, ...data[listKey]])
      notify(`${type} created`)
      addActivity(`${type} created`, `${fresh.name || fresh.title || fresh.reference} was added`, type, fresh.id)
    }
    setModal(null)
  }
  const convertLead = (lead) => {
    if (!lead.name || !lead.email || !lead.value) return notify('Add a contact name, email and opportunity value before converting.')
    if (lead.projectId) return notify('This lead has already been converted.')
    let customer = data.customers.find((item) => item.email.toLowerCase() === lead.email.toLowerCase())
    let customers = data.customers
    if (!customer) {
      customer = { id:`c-${Date.now()}`, name:lead.name, company:lead.company || lead.name, email:lead.email, phone:lead.phone, status:'Active', address:'Address to be confirmed', lastInteraction:day(0), notes:'' }
      customers = [customer, ...customers]
    }
    const project = {
      id:`p-${Date.now()}`, name:`${lead.company || lead.name} ${lead.projectType || 'Project'}`, reference:`SL-${new Date().getFullYear()}${String(Date.now()).slice(-4)}`,
      customerId:customer.id, address:customer.address, manager:lead.owner, status:'Planning', health:'On Track', progress:0,
      originalContractValue:Number(lead.value), contractValue:Number(lead.value), budget:Math.round(Number(lead.value)*0.8), committedCost:0, actualCost:0,
      startDate:day(30), endDate:day(180), risk:'Project created from converted lead', documents:[],
    }
    update('customers', customers)
    update('projects', [project, ...data.projects])
    patchRecord('leads', lead.id, { stage:'Won', customerId:customer.id, projectId:project.id })
    addActivity('Lead converted', `${lead.name} converted to ${project.name}`, 'Projects', project.id)
    setDrawer(null)
    notify('Lead converted. Customer and project are ready.')
    navigate(`/projects/${project.id}`)
  }
  const globalRecords = useMemo(() => [
    ...data.leads.map((item) => ({ label:item.name, type:'Lead', secondary:`${item.company} · ${item.stage}`, path:'/leads' })),
    ...data.customers.map((item) => ({ label:item.company, type:'Customer', secondary:item.name, path:'/customers' })),
    ...data.projects.map((item) => ({ label:item.name, type:'Project', secondary:`${item.reference} · ${item.status}`, path:`/projects/${item.id}` })),
    ...data.invoices.filter((item) => item.kind === 'Invoice').map((item) => ({ label:item.number, type:'Invoice', secondary:`${customerOf(data,item.customerId)?.name || 'Customer'} · ${money(outstanding(item),currency)} due`, path:'/finance' })),
    ...data.quotes.map((item) => ({ label:item.reference, type:'Quote', secondary:item.description, path:'/quotes' })),
  ], [data, currency])
  const hits = search.trim() ? globalRecords.filter((item) => `${item.label} ${item.type} ${item.secondary}`.toLowerCase().includes(search.toLowerCase())).slice(0, 7) : []

  return <div className={`app-shell ${collapsed?'sidebar-collapsed':''}`}>
    <aside className={`sidebar ${mobileNav?'mobile-open':''}`}>
      <div className="brand"><span className="brand-mark"><HardHat size={20}/></span><span className="brand-name">site<span>ledger</span><small>CONSTRUCTION OPERATIONS</small></span></div>
      <div className="workspace-switch"><div className="workspace-avatar">SC</div><div className="workspace-copy"><b>{data.settings.companyName}</b><small>Demo workspace</small></div><ChevronDown size={15}/></div>
      <div className="nav-label">WORKSPACE</div>
      <nav className="side-nav">{navItems.map(({label,path,icon:Icon})=><NavLink key={path} to={path} title={collapsed?label:undefined} className={({isActive})=>`nav-item ${isActive?'active':''}`}><Icon size={18}/><span>{label}</span>{label==='Communications'&&data.emails.filter(e=>e.unread).length>0&&<i className="nav-count">{data.emails.filter(e=>e.unread).length}</i>}</NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="integration-mini"><span className="status-dot"/><div><b>Integrations</b><small>Demo mode · disconnected</small></div></div><NavLink to="/settings" className={({isActive})=>`nav-item ${isActive?'active':''}`}><SettingsIcon size={18}/><span>Settings</span></NavLink></div>
      <button className="collapse-button" onClick={()=>setCollapsed(!collapsed)} aria-label="Collapse sidebar">{collapsed?<PanelLeftOpen size={17}/>:<PanelLeftClose size={17}/>}<span>Collapse sidebar</span></button>
    </aside>
    {mobileNav&&<button className="mobile-scrim" aria-label="Close navigation" onClick={()=>setMobileNav(false)}/>}
    <main className="main-area">
      <header className="topbar">
        <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={()=>setMobileNav(true)}><Menu size={19}/></button>
        <div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14}/><b>{titleFor(location.pathname)}</b></div>
        <div className="topbar-actions">
          <div className="global-search"><Search size={17}/><input ref={searchInput} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search anything..." aria-label="Search records"/><kbd>⌘ K</kbd>
            {search&&<button className="search-clear" onClick={()=>setSearch('')} aria-label="Clear search"><X size={14}/></button>}
            {search&&<div className="search-results">{hits.length?hits.map((hit,i)=><button key={`${hit.type}-${i}`} onClick={()=>{navigate(hit.path);setSearch('')}}><span className="search-type">{hit.type==='Project'?<HardHat size={16}/>:hit.type==='Customer'?<Building2 size={16}/>:<FileText size={16}/>}</span><span><b>{hit.label}</b><small>{hit.secondary}</small></span><ArrowRight size={14}/></button>):<div className="no-results">No matching records</div>}</div>}
          </div>
          <div className="notification-wrap"><button className={`icon-button notification-button ${notificationsOpen?'selected':''}`} onClick={()=>setNotificationsOpen(!notificationsOpen)} aria-label="Notifications"><Bell size={18}/><i/></button>
            {notificationsOpen&&<div className="notification-popover"><div className="popover-heading"><b>Notifications</b><span>{data.activity.length} recent</span></div>{data.activity.slice(0,4).map(item=><button key={item.id} onClick={()=>{setNotificationsOpen(false);notify(item.title)}}><span className={`notification-icon ${statusTone(item.title)}`}><Activity size={15}/></span><span><b>{item.title}</b><small>{item.description}</small></span></button>)}</div>}
          </div>
          <button className="profile-button" onClick={()=>navigate('/settings')}><span className="profile-avatar">JT</span><span className="profile-name">{data.settings.userName}</span><ChevronDown size={14}/></button>
        </div>
      </header>
      <div className="page-content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace/>}/>
          <Route path="/dashboard" element={<Dashboard data={data} currency={currency} onDetails={openDetails} onNavigate={navigate}/>}/>
          <Route path="/leads" element={<LeadsPage data={data} currency={currency} onDetails={openDetails} onCreate={()=>openForm('Lead')} onEdit={r=>openForm('Lead',r)} onConvert={convertLead} onUpdate={patchRecord} notify={notify} onActivity={addActivity}/>}/>
          <Route path="/customers" element={<CustomersPage data={data} currency={currency} onDetails={openDetails} onCreate={()=>openForm('Customer')} onEdit={r=>openForm('Customer',r)} onNavigate={navigate}/>}/>
          <Route path="/projects" element={<ProjectsPage data={data} currency={currency} onNavigate={navigate} onUpdate={patchRecord}/>}/>
          <Route path="/projects/:id" element={<ProjectDetails data={data} currency={currency} onUpdate={patchRecord} onDetails={openDetails} onNavigate={navigate} notify={notify}/>}/>
          <Route path="/schedule" element={<SchedulePage data={data} onCreate={()=>openForm('Task')} onEdit={r=>openForm('Task',r)} onUpdate={patchRecord} notify={notify}/>}/>
          <Route path="/quotes" element={<QuotesPage data={data} currency={currency} onCreate={type=>openForm(type)} onEdit={(type,r)=>openForm(type,r)} onUpdate={patchRecord} onDetails={openDetails} notify={notify}/>}/>
          <Route path="/finance" element={<FinancePage data={data} currency={currency} onUpdate={patchRecord} onDetails={openDetails} onNavigate={navigate} notify={notify}/>}/>
          <Route path="/communications" element={<CommunicationsPage data={data} onUpdate={patchRecord} onDetails={openDetails} notify={notify}/>}/>
          <Route path="/reports" element={<ReportsPage data={data} currency={currency} notify={notify}/>}/>
          <Route path="/integrations" element={<IntegrationsPage data={data} update={update} notify={notify} onDetails={openDetails}/>}/>
          <Route path="/settings" element={<SettingsPage settings={data.settings} onSave={value=>update('settings',value)} onReset={()=>{const settings=data.settings;localStorage.removeItem(STORE);setData({...createSeed(),settings});notify('Demo data has been reset to the original sample records.')}} notify={notify}/>}/>
          <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
        </Routes>
      </div>
    </main>
    {drawer&&<Drawer data={data} details={drawer} currency={currency} onClose={()=>setDrawer(null)} onConvert={convertLead} onUpdate={patchRecord} onEdit={record=>{setDrawer(null);openForm(drawer.type,record)}} onNavigate={navigate} notify={notify} onSaveDraft={draft=>update('drafts',[draft,...data.drafts])}/>}
    {modal&&<FormModal type={modal.type} record={modal.record} data={data} onClose={()=>setModal(null)} onSave={values=>saveForm(modal.type,modal.record,values)}/>}
    {toast&&<div className="toast"><CheckCircle2 size={18}/><span>{toast}</span><button onClick={()=>setToast('')} aria-label="Dismiss notification"><X size={15}/></button></div>}
  </div>
}

function customerOf(data,id){return data.customers.find(item=>item.id===id)}
function projectOf(data,id){return data.projects.find(item=>item.id===id)}
function PageHeading({eyebrow,title,description,action,actionLabel,secondary,onAction,icon:Icon}){
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div><div className="heading-actions">{secondary&&<button className="button secondary" onClick={secondary.onClick}><secondary.icon size={16}/>{secondary.label}</button>}{actionLabel&&<button className="button primary" onClick={onAction}>{Icon&&<Icon size={16}/>} {actionLabel}</button>}{action}</div></div>
}
function Status({children}){return <span className={`status status-${statusTone(children)}`}><i/>{children}</span>}
function SectionTitle({title,subtitle,action}){return <div className="section-title"><div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div>{action}</div>}
function Empty({title='Nothing to show',text='Try adjusting your search or filters.'}){return <div className="empty-state"><div><Search size={20}/></div><b>{title}</b><span>{text}</span></div>}
function Table({columns,rows,empty='No records found',onRowClick}){
  if(!rows.length)return <Empty title={empty}/>
  return <div className="table-scroll"><table><thead><tr>{columns.map(column=><th key={column.label}>{column.label}</th>)}</tr></thead><tbody>{rows.map((row,index)=><tr key={row.id||index} onClick={()=>onRowClick&&onRowClick(row)} className={onRowClick?'clickable-row':''}>{columns.map(column=><td key={column.label}>{column.render?column.render(row):row[column.key]??'—'}</td>)}</tr>)}</tbody></table></div>
}
function SearchFilter({search,onSearch,filters=[],onFilter,placeholder='Search records...'}){
  return <div className="filter-toolbar"><label className="table-search"><Search size={16}/><input value={search} onChange={e=>onSearch(e.target.value)} placeholder={placeholder}/></label>{filters.map(filter=><label className="select-filter" key={filter.label}><Filter size={14}/><select aria-label={filter.label} value={filter.value} onChange={e=>onFilter(filter.key,e.target.value)}><option value="All">{filter.label}: All</option>{filter.options.map(value=><option key={value} value={value}>{value}</option>)}</select></label>)}</div>
}
function Kpi({icon:Icon,label,value,sub,tone='teal',trend,link,onClick}){
  const Box=link?'button':'div'
  return <Box className={`kpi-card ${onClick?'kpi-clickable':''}`} onClick={onClick}><div className="kpi-top"><span className={`kpi-icon ${tone}`}><Icon size={18}/></span>{trend&&<span className={`kpi-trend ${trend.positive?'positive':'negative'}`}>{trend.positive?<ArrowUpRight size={13}/>:<ArrowDownRight size={13}/>} {trend.text}</span>}</div><div className="kpi-value">{value}</div><div className="kpi-label">{label}</div><div className="kpi-sub">{sub}{link&&<ArrowRight size={13}/>}</div></Box>
}

const CHART_COLORS = ['#168c82','#639c91','#e3ad55','#e1795e','#334e5b','#9bb6af','#8297a1']
function Dashboard({data,currency,onDetails,onNavigate}){
  const active=activeProjects(data.projects)
  const overdue=overdueInvoices(data.invoices)
  const pipelineStages=['New','Contacted','Qualified','Quote in Progress','Quote Sent','Won','Lost']
  const pipeline=pipelineStages.map(stage=>({stage,count:data.leads.filter(l=>l.stage===stage).length,value:data.leads.filter(l=>l.stage===stage).reduce((s,l)=>s+l.value,0)}))
  const health=['On Track','At Risk','Delayed'].map(status=>({name:status,value:data.projects.filter(p=>p.health===status).length}))
  const aging=Object.entries(invoiceAging(data.invoices)).map(([name,value])=>({name,value}))
  const attention=data.projects.filter(p=>p.health!=='On Track'||daysFromNow(p.endDate)<14).slice(0,5)
  const upcoming=[...data.events.filter(e=>daysFromNow(e.date)>=0),...data.tasks.filter(t=>t.status!=='Completed'&&daysFromNow(t.dueDate)>=0).map(t=>({id:t.id,title:t.title,projectId:t.projectId,date:t.dueDate,type:'Milestone',owner:t.owner}))].sort((a,b)=>a.date.localeCompare(b.date)).slice(0,5)
  const receivables=overdue.sort((a,b)=>a.dueDate.localeCompare(b.dueDate)).slice(0,4)
  return <>
    <PageHeading eyebrow={new Intl.DateTimeFormat('en-AU',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date()).toUpperCase()} title={`Good morning, ${data.settings.userName.split(' ')[0]}`} description="Here’s the latest view of your construction business." actionLabel="Create lead" icon={Plus} onAction={()=>onNavigate('/leads')}/>
    <div className="banner demo-banner"><span className="demo-icon"><Sparkles size={16}/></span><div><b>Your SiteLedger demo workspace</b><span>Business data is illustrative. Buildxact, Xero and Outlook are not connected.</span></div><Link to="/integrations">Explore integrations <ArrowRight size={14}/></Link></div>
    <div className="kpi-grid">
      <Kpi icon={HardHat} label="Active projects" value={active.length} sub="Across your current workload" tone="teal" link onClick={()=>onNavigate('/projects')}/>
      <Kpi icon={AlertTriangle} label="Projects at risk" value={data.projects.filter(p=>p.health!=='On Track'&&p.status!=='Completed').length} sub="Delayed or need attention" tone="amber" link onClick={()=>onNavigate('/projects')}/>
      <Kpi icon={CircleDollarSign} label="Open pipeline" value={money(openPipeline(data.leads),currency)} sub={`${data.leads.filter(l=>!['Won','Lost'].includes(l.stage)).length} open opportunities`} tone="blue" link onClick={()=>onNavigate('/leads')}/>
      <Kpi icon={Users} label="Follow-ups due" value={data.leads.filter(l=>!['Won','Lost'].includes(l.stage)&&daysFromNow(l.followUp)<=0).length} sub="Lead follow-ups due today or earlier" tone="violet" link onClick={()=>onNavigate('/leads')}/>
      <Kpi icon={Wallet} label="Outstanding invoices" value={money(data.invoices.filter(i=>i.kind==='Invoice').reduce((s,i)=>s+outstanding(i),0),currency)} sub="Across all customer invoices" tone="teal" link onClick={()=>onNavigate('/finance')}/>
      <Kpi icon={Clock3} label="Overdue receivables" value={money(overdue.reduce((s,i)=>s+outstanding(i),0),currency)} sub={`${overdue.length} invoices need attention`} tone="red" link onClick={()=>onNavigate('/finance')}/>
    </div>
    <div className="dashboard-grid">
      <section className="panel chart-panel"><SectionTitle title="Lead pipeline" subtitle="Opportunities by sales stage" action={<Link to="/leads" className="subtle-link">View CRM <ArrowRight size={14}/></Link>}/><div className="chart-wrap"><ResponsiveContainer width="100%" height={230}><BarChart data={pipeline} margin={{top:8,right:8,left:-18,bottom:0}}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf1f2"/><XAxis dataKey="stage" tick={{fontSize:10,fill:'#7a8c92'}} axisLine={false} tickLine={false} interval={0} angle={-14} textAnchor="end" height={54}/><YAxis allowDecimals={false} tick={{fontSize:11,fill:'#7a8c92'}} axisLine={false} tickLine={false}/><Tooltip/><Bar dataKey="count" name="Leads" fill="#168c82" radius={[5,5,0,0]} barSize={25}/></BarChart></ResponsiveContainer></div><div className="chart-footnote"><span><i className="legend-dot teal-dot"/>Lead count</span><b>{money(openPipeline(data.leads),currency)} <small>open value</small></b></div></section>
      <section className="panel chart-panel"><SectionTitle title="Project health" subtitle="Current health across all jobs"/><div className="health-chart"><ResponsiveContainer width="56%" height={190}><PieChart><Pie data={health} dataKey="value" innerRadius={56} outerRadius={78} paddingAngle={4}>{health.map((entry,index)=><Cell key={entry.name} fill={['#168c82','#e4aa48','#d96b58'][index]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer><div className="health-legend">{health.map((item,index)=><div key={item.name}><span><i style={{background:['#168c82','#e4aa48','#d96b58'][index]}}/>{item.name}</span><b>{item.value}</b></div>)}</div></div><div className="mini-note"><span className="status-dot amber-dot"/>Project health is explicitly set for this demo</div></section>
      <section className="panel chart-panel aging-panel"><SectionTitle title="Invoice ageing" subtitle="Outstanding customer invoices"/><div className="chart-wrap"><ResponsiveContainer width="100%" height={200}><BarChart data={aging} margin={{top:10,right:4,left:-18,bottom:0}}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf1f2"/><XAxis dataKey="name" tick={{fontSize:10,fill:'#7a8c92'}} axisLine={false} tickLine={false}/><YAxis tickFormatter={v=>`${Math.round(v/1000)}k`} tick={{fontSize:10,fill:'#7a8c92'}} axisLine={false} tickLine={false}/><Tooltip formatter={value=>money(value,currency)}/><Bar dataKey="value" name="Outstanding" fill="#d69a42" radius={[5,5,0,0]} barSize={36}/></BarChart></ResponsiveContainer></div></section>
      <section className="panel chart-panel"><SectionTitle title="Project financial overview" subtitle="Illustrative project figures" action={<Link to="/reports" className="subtle-link">Reports <ArrowRight size={14}/></Link>}/><div className="financial-summary"><div><span>Contract value</span><b>{money(data.projects.reduce((s,p)=>s+revisedContract(p,data.variations),0),currency)}</b></div><div><span>Budget</span><b>{money(data.projects.reduce((s,p)=>s+p.budget,0),currency)}</b></div><div><span>Committed cost</span><b>{money(data.projects.reduce((s,p)=>s+p.committedCost,0),currency)}</b></div><div><span>Actual cost</span><b>{money(data.projects.reduce((s,p)=>s+p.actualCost,0),currency)}</b></div></div><p className="small-disclaimer"><AlertTriangle size={13}/> Sample project financial data — not accounting records.</p></section>
      <section className="panel wide-panel"><SectionTitle title="Projects requiring attention" subtitle="At-risk, delayed and approaching completion" action={<Link to="/projects" className="subtle-link">All projects <ArrowRight size={14}/></Link>}/><Table columns={[
        {label:'PROJECT',render:r=><div className="primary-cell"><b>{r.name}</b><small>{r.reference}</small></div>},
        {label:'PROJECT MANAGER',key:'manager'},
        {label:'HEALTH',render:r=><Status>{r.health}</Status>},
        {label:'PROGRESS',render:r=><div className="progress-cell"><div className="progress-track"><i style={{width:`${r.progress}%`}}/></div><span>{r.progress}%</span></div>},
        {label:'TARGET FINISH',render:r=><span className={daysFromNow(r.endDate)<0?'text-red':''}>{shortDate(r.endDate)}</span>},
      ]} rows={attention} onRowClick={r=>onNavigate(`/projects/${r.id}`)}/></section>
      <section className="panel"><SectionTitle title="Upcoming schedule" subtitle="Next site events and milestones" action={<Link to="/schedule" className="subtle-link">Open schedule <ArrowRight size={14}/></Link>}/><div className="agenda-list">{upcoming.map(item=><div className="agenda-item" key={item.id}><div className="agenda-date"><b>{new Date(`${item.date}T00:00:00`).getDate()}</b><span>{new Date(`${item.date}T00:00:00`).toLocaleString('en-AU',{month:'short'})}</span></div><div className="agenda-copy"><b>{item.title}</b><span>{projectOf(data,item.projectId)?.name||'Unlinked'} · {item.type}</span></div><ChevronRight size={15}/></div>)}</div>{!upcoming.length&&<Empty/>}</section>
      <section className="panel"><SectionTitle title="Overdue receivables" subtitle="Customer payments past due" action={<Link to="/finance" className="subtle-link">View finance <ArrowRight size={14}/></Link>}/>{receivables.length?<div className="receivable-list">{receivables.map(inv=><button key={inv.id} className="receivable-item" onClick={()=>onDetails(inv,'Invoice')}><span className="invoice-icon"><FileText size={16}/></span><span className="receivable-copy"><b>{inv.number} · {customerOf(data,inv.customerId)?.name}</b><small>Due {shortDate(inv.dueDate)}</small></span><strong>{money(outstanding(inv),currency)}</strong></button>)}</div>:<Empty title="All caught up" text="No invoices are currently overdue."/>}</section>
      <section className="panel"><SectionTitle title="Recent activity" subtitle="Latest updates across your workspace" action={<span className="live-label"><i/>LIVE DEMO</span>}/><div className="activity-list">{data.activity.slice(0,5).map(item=><div className="activity-item" key={item.id}><span className="activity-marker"><Activity size={13}/></span><div><b>{item.title}</b><p>{item.description}</p><small>{shortDate(item.date)}</small></div></div>)}</div></section>
      <section className="panel integrations-panel"><SectionTitle title="Connected platforms" subtitle="Integration status overview" action={<Link to="/integrations" className="subtle-link">Manage <ArrowRight size={14}/></Link>}/><div className="integration-mini-list">{data.integrations.map(item=><div key={item.id}><span className={`provider-icon ${item.id}`}>{item.id==='buildxact'?<HardHat size={16}/>:item.id==='xero'?<CircleDollarSign size={16}/>:<Mail size={16}/>}</span><b>{item.name}</b><span className="disconnected-label">Not connected</span></div>)}</div><div className="disconnected-ribbon">DEMO MODE — NOT CONNECTED</div></section>
    </div>
  </>
}

function LeadsPage({data,currency,onDetails,onCreate,onEdit,onConvert,onUpdate,notify,onActivity}){
  const [search,setSearch]=useState(''),[filters,setFilters]=useState({stage:'All',owner:'All',source:'All',follow:'All'})
  const leads=data.leads.filter(l=>`${l.name} ${l.company} ${l.email} ${l.projectType}`.toLowerCase().includes(search.toLowerCase())&&(filters.stage==='All'||l.stage===filters.stage)&&(filters.owner==='All'||l.owner===filters.owner)&&(filters.source==='All'||l.source===filters.source)&&(filters.follow==='All'||(filters.follow==='Due'&&daysFromNow(l.followUp)<=0)||(filters.follow==='Upcoming'&&daysFromNow(l.followUp)>0)))
  const columns=[
    {label:'LEAD',render:r=><div className="person-cell"><span className="avatar">{r.name.split(' ').map(x=>x[0]).join('')}</span><span><b>{r.name}</b><small>{r.company}</small></span></div>},
    {label:'CONTACT',render:r=><div className="primary-cell"><a href={`mailto:${r.email}`} onClick={e=>e.stopPropagation()}>{r.email}</a><small>{r.phone}</small></div>},
    {label:'SOURCE',key:'source'},
    {label:'OPPORTUNITY',render:r=><b>{money(r.value,currency)}</b>},
    {label:'STAGE',render:r=><Status>{r.stage}</Status>},
    {label:'OWNER',key:'owner'},
    {label:'FOLLOW-UP',render:r=><span className={daysFromNow(r.followUp)<=0?'text-red':''}>{shortDate(r.followUp)}</span>},
    {label:'',render:r=><button className="row-more" aria-label={`Edit ${r.name}`} onClick={e=>{e.stopPropagation();onEdit(r)}}><MoreHorizontal size={17}/></button>},
  ]
  return <><PageHeading eyebrow="SALES & RELATIONSHIPS" title="Leads & CRM" description="Keep every opportunity moving, from first enquiry to signed contract." actionLabel="New lead" icon={Plus} onAction={onCreate}/><div className="kpi-grid compact-kpis"><Kpi icon={Users} label="Total leads" value={data.leads.length} sub="All sales opportunities"/><Kpi icon={CircleDollarSign} label="Open pipeline" value={money(openPipeline(data.leads),currency)} sub="Excludes won and lost" tone="blue"/><Kpi icon={Clock3} label="Follow-ups due" value={data.leads.filter(l=>!['Won','Lost'].includes(l.stage)&&daysFromNow(l.followUp)<=0).length} sub="Due today or overdue" tone="amber"/><Kpi icon={CheckCircle2} label="Won this period" value={data.leads.filter(l=>l.stage==='Won').length} sub="Converted opportunities" tone="green"/></div><div className="panel list-panel"><SectionTitle title="Sales opportunities" subtitle={`${leads.length} leads shown`}/><SearchFilter search={search} onSearch={setSearch} placeholder="Search name, company, email..." filters={[{key:'stage',label:'Stage',value:filters.stage,options:['New','Contacted','Qualified','Quote in Progress','Quote Sent','Won','Lost']},{key:'owner',label:'Owner',value:filters.owner,options:[...new Set(data.leads.map(l=>l.owner))]},{key:'source',label:'Source',value:filters.source,options:[...new Set(data.leads.map(l=>l.source))]},{key:'follow',label:'Follow-up',value:filters.follow,options:['Due','Upcoming']}]} onFilter={(key,value)=>setFilters({...filters,[key]:value})}/><Table columns={columns} rows={leads} onRowClick={r=>onDetails(r,'Lead')} empty="No leads match these filters"/></div><div className="page-footnote"><Sparkles size={14}/> Qualified and won leads can be converted into a customer and project workflow.</div></>
}

function CustomersPage({data,currency,onDetails,onCreate,onEdit,onNavigate}){
  const [search,setSearch]=useState(''),[filter,setFilter]=useState('All')
  const customers=data.customers.filter(c=>`${c.name} ${c.company} ${c.email}`.toLowerCase().includes(search.toLowerCase())&&(filter==='All'||c.status===filter))
  const columns=[
    {label:'CUSTOMER',render:r=><div className="person-cell"><span className="avatar customer-avatar">{r.name.split(' ').map(x=>x[0]).join('')}</span><span><b>{r.company}</b><small>{r.name}</small></span></div>},
    {label:'CONTACT DETAILS',render:r=><div className="primary-cell"><a href={`mailto:${r.email}`} onClick={e=>e.stopPropagation()}>{r.email}</a><small>{r.phone}</small></div>},
    {label:'PROJECTS',render:r=><button className="text-link" onClick={e=>{e.stopPropagation();onNavigate(`/projects?customer=${r.id}`)}}>{data.projects.filter(p=>p.customerId===r.id).length} projects</button>},
    {label:'OUTSTANDING',render:r=><b>{money(data.invoices.filter(i=>i.kind==='Invoice'&&i.customerId===r.id).reduce((sum,i)=>sum+outstanding(i),0),currency)}</b>},
    {label:'LAST INTERACTION',render:r=>shortDate(r.lastInteraction)},
    {label:'STATUS',render:r=><Status>{r.status}</Status>},
    {label:'',render:r=><button className="row-more" aria-label={`Edit ${r.name}`} onClick={e=>{e.stopPropagation();onEdit(r)}}><MoreHorizontal size={17}/></button>},
  ]
  return <><PageHeading eyebrow="CUSTOMER DIRECTORY" title="Customers" description="A complete view of the people and businesses behind your projects." actionLabel="Add customer" icon={Plus} onAction={onCreate}/><div className="kpi-grid compact-kpis"><Kpi icon={Building2} label="Customers" value={data.customers.length} sub="In your directory"/><Kpi icon={HardHat} label="Active relationships" value={data.customers.filter(c=>c.status==='Active').length} sub="Customers with active work" tone="green"/><Kpi icon={Wallet} label="Customer receivables" value={money(data.invoices.filter(i=>i.kind==='Invoice').reduce((s,i)=>s+outstanding(i),0),currency)} sub="Sample financial data" tone="blue"/></div><div className="panel list-panel"><SectionTitle title="Customer directory" subtitle={`${customers.length} customers`}/><SearchFilter search={search} onSearch={setSearch} placeholder="Search customers, companies..." filters={[{key:'status',label:'Status',value:filter,options:['Active','Prospect']}]} onFilter={(_,value)=>setFilter(value)}/><Table columns={columns} rows={customers} onRowClick={r=>onDetails(r,'Customer')} empty="No customers match your search"/></div></>
}

function ProjectsPage({data,currency,onNavigate,onUpdate}){
  const [search,setSearch]=useState(''),[filters,setFilters]=useState({status:'All',health:'All'})
  const customers=new URLSearchParams(window.location.search).get('customer')
  const projects=data.projects.filter(p=>`${p.name} ${p.reference} ${p.address} ${customerOf(data,p.customerId)?.company}`.toLowerCase().includes(search.toLowerCase())&&(filters.status==='All'||p.status===filters.status)&&(filters.health==='All'||p.health===filters.health)&&(!customers||p.customerId===customers))
  const columns=[
    {label:'PROJECT',render:r=><div className="primary-cell"><b>{r.name}</b><small>{r.reference} · {customerOf(data,r.customerId)?.company||'Customer to confirm'}</small></div>},
    {label:'PROJECT MANAGER',key:'manager'},
    {label:'STAGE',render:r=><Status>{r.status}</Status>},
    {label:'HEALTH',render:r=><Status>{r.health}</Status>},
    {label:'PROGRESS',render:r=><div className="progress-cell"><div className="progress-track"><i style={{width:`${r.progress}%`}}/></div><span>{r.progress}%</span></div>},
    {label:'CONTRACT VALUE',render:r=><b>{money(revisedContract(r,data.variations),currency)}</b>},
    {label:'TARGET FINISH',render:r=><span className={daysFromNow(r.endDate)<0&&r.status!=='Completed'?'text-red':''}>{shortDate(r.endDate)}</span>},
  ]
  return <><PageHeading eyebrow="DELIVERY & OPERATIONS" title="Projects" description="Track job progress, team workload, financials and project health."/><div className="kpi-grid compact-kpis"><Kpi icon={HardHat} label="Active projects" value={activeProjects(data.projects).length} sub="Planning through on hold"/><Kpi icon={AlertTriangle} label="Need attention" value={data.projects.filter(p=>p.health!=='On Track'&&p.status!=='Completed').length} sub="At risk or delayed" tone="amber"/><Kpi icon={CircleDollarSign} label="Total contract value" value={money(data.projects.reduce((s,p)=>s+revisedContract(p,data.variations),0),currency)} sub="Includes approved variations" tone="blue"/><Kpi icon={ClipboardList} label="Open tasks" value={data.tasks.filter(t=>t.status!=='Completed').length} sub="Across all projects" tone="violet"/></div><div className="panel list-panel"><SectionTitle title="Project register" subtitle={`${projects.length} projects`}/><SearchFilter search={search} onSearch={setSearch} placeholder="Search projects, reference, customer..." filters={[{key:'status',label:'Status',value:filters.status,options:['Planning','Scheduled','In Progress','On Hold','Completed','Cancelled']},{key:'health',label:'Health',value:filters.health,options:['On Track','At Risk','Delayed']}]} onFilter={(key,value)=>setFilters({...filters,[key]:value})}/><Table columns={columns} rows={projects} onRowClick={r=>onNavigate(`/projects/${r.id}`)} empty="No projects found"/></div></>
}

function ProjectDetails({data,currency,onUpdate,onDetails,onNavigate,notify}){
  const {id}=useParams(),project=data.projects.find(p=>p.id===id),[tab,setTab]=useState('Overview')
  if(!project)return <><PageHeading title="Project not found" description="This project may have been removed."/><Link className="button secondary" to="/projects">Back to projects</Link></>
  const customer=customerOf(data,project.customerId),tasks=data.tasks.filter(t=>t.projectId===id),invoices=data.invoices.filter(i=>i.projectId===id),quotes=data.quotes.filter(q=>q.projectId===id),variations=data.variations.filter(v=>v.projectId===id)
  const tabs=['Overview','Schedule & Tasks','Financials','Quotes & Variations','Communications','Documents','Activity']
  return <><div className="backline"><button onClick={()=>onNavigate('/projects')}><ChevronLeft size={15}/> All projects</button><span>/</span><span>{project.reference}</span></div><PageHeading eyebrow={`${project.reference} · ${project.manager}`} title={project.name} description={project.address} action={<select className="inline-status" value={project.status} onChange={e=>{onUpdate('projects',project.id,{status:e.target.value});notify('Project status updated')}} aria-label="Project status">{['Planning','Scheduled','In Progress','On Hold','Completed','Cancelled'].map(s=><option key={s}>{s}</option>)}</select>}/><div className="project-hero"><div className="project-hero-customer"><span className="avatar customer-avatar">{customer?.name.split(' ').map(x=>x[0]).join('')}</span><div><small>CLIENT</small><button onClick={()=>onDetails(customer,'Customer')}>{customer?.company||'Customer details incomplete'} <ArrowRight size={13}/></button><span>{customer?.name||'Contact to be confirmed'}</span></div></div><div className="project-hero-divider"/><div><small>PROJECT HEALTH</small><Status>{project.health}</Status></div><div className="project-hero-divider"/><div><small>COMPLETION</small><div className="hero-progress">{project.progress}%<div className="progress-track"><i style={{width:`${project.progress}%`}}/></div></div></div><div className="project-hero-divider"/><div><small>PLANNED COMPLETION</small><b>{shortDate(project.endDate)}</b></div></div><div className="tab-strip">{tabs.map(item=><button key={item} className={tab===item?'active':''} onClick={()=>setTab(item)}>{item}{item==='Schedule & Tasks'&&<span>{tasks.length}</span>}</button>)}</div>
    {tab==='Overview'&&<div className="detail-grid"><section className="panel"><SectionTitle title="Project summary" subtitle="Key delivery information"/><div className="detail-pairs"><div><small>Project stage</small><Status>{project.status}</Status></div><div><small>Project manager</small><b>{project.manager}</b></div><div><small>Site address</small><b>{project.address||'Address to be confirmed'}</b></div><div><small>Planned start</small><b>{shortDate(project.startDate)}</b></div><div><small>Original contract value</small><b>{money(project.originalContractValue,currency)}</b></div><div><small>Revised contract value</small><b>{money(revisedContract(project,data.variations),currency)}</b></div></div></section><section className="panel"><SectionTitle title="Delivery health" subtitle="Risks and next steps"/><div className={`risk-card ${statusTone(project.health)}`}><AlertTriangle size={18}/><div><b>{project.health==='On Track'?'No active blockers':project.health==='Delayed'?'Schedule delay identified':'Milestone needs attention'}</b><span>{project.risk||'No additional project notes.'}</span></div></div><div className="project-dates"><div><span>Budget</span><b>{money(project.budget,currency)}</b></div><div><span>Committed cost</span><b>{money(project.committedCost,currency)}</b></div><div><span>Actual cost</span><b>{money(project.actualCost,currency)}</b></div><div><span>Budget variance <small>(actual − budget)</small></span><b className={project.actualCost-project.budget>0?'text-red':''}>{money(project.actualCost-project.budget,currency)}</b></div></div></section><section className="panel"><SectionTitle title="Upcoming milestones" subtitle="Project tasks and inspections" action={<button className="text-link" onClick={()=>setTab('Schedule & Tasks')}>View all <ArrowRight size={14}/></button>}/><div className="task-preview">{tasks.filter(t=>t.status!=='Completed').sort((a,b)=>a.dueDate.localeCompare(b.dueDate)).slice(0,4).map(task=><div key={task.id}><span className={`task-checkbox ${task.status==='Blocked'?'blocked':''}`}>{task.status==='Blocked'?<AlertTriangle size={12}/>:null}</span><span><b>{task.title}</b><small>{task.owner} · Due {shortDate(task.dueDate)}</small></span><Status>{task.status}</Status></div>)}</div></section><section className="panel"><SectionTitle title="Commercial snapshot" subtitle="Invoices and approved variations"/><div className="commercial-summary"><div><span>Open invoices</span><b>{money(invoices.filter(i=>i.kind==='Invoice').reduce((s,i)=>s+outstanding(i),0),currency)}</b></div><div><span>Approved variations</span><b>{money(variations.filter(v=>v.status==='Approved').reduce((s,v)=>s+v.amount,0),currency)}</b></div><div><span>Outstanding quotes</span><b>{quotes.filter(q=>['Sent','In Preparation'].includes(q.status)).length}</b></div></div><button className="button secondary full-button" onClick={()=>setTab('Financials')}>View project financials</button></section></div>}
    {tab==='Schedule & Tasks'&&<div className="panel list-panel"><SectionTitle title="Project tasks & milestones" subtitle={`${tasks.length} linked tasks`}/><Table columns={[{label:'TASK',render:r=><b>{r.title}</b>},{label:'OWNER',key:'owner'},{label:'PRIORITY',render:r=><Status>{r.priority}</Status>},{label:'DUE DATE',render:r=><span className={daysFromNow(r.dueDate)<0&&r.status!=='Completed'?'text-red':''}>{shortDate(r.dueDate)}</span>},{label:'STATUS',render:r=><select className="table-select" value={r.status} onChange={e=>{onUpdate('tasks',r.id,{status:e.target.value});notify('Task status updated')}}>{['Not Started','In Progress','Blocked','Completed'].map(v=><option key={v}>{v}</option>)}</select>}]} rows={tasks}/></div>}
    {tab==='Financials'&&<div className="detail-grid"><section className="panel"><SectionTitle title="Project financials" subtitle="Illustrative project figures"/><div className="detail-pairs">{[['Original contract value',project.originalContractValue],['Approved variations',revisedContract(project,data.variations)-project.originalContractValue],['Revised contract value',revisedContract(project,data.variations)],['Budget',project.budget],['Committed cost',project.committedCost],['Actual cost',project.actualCost],['Budget variance (actual − budget)',project.actualCost-project.budget],['Outstanding invoices',invoices.filter(i=>i.kind==='Invoice').reduce((s,i)=>s+outstanding(i),0)]].map(([label,value])=><div key={label}><small>{label}</small><b>{money(value,currency)}</b></div>)}</div><p className="small-disclaimer"><AlertTriangle size={13}/> Sample financial data — Xero is not connected.</p></section><section className="panel"><SectionTitle title="Invoices" subtitle="Linked customer invoices"/><Table columns={[{label:'INVOICE',key:'number'},{label:'DUE DATE',render:r=>shortDate(r.dueDate)},{label:'BALANCE',render:r=>money(outstanding(r),currency)},{label:'STATUS',render:r=><Status>{r.status}</Status>}]} rows={invoices.filter(i=>i.kind==='Invoice')} onRowClick={r=>onDetails(r,'Invoice')}/></section></div>}
    {tab==='Quotes & Variations'&&<div className="detail-grid"><section className="panel"><SectionTitle title="Quotes" subtitle={`${quotes.length} linked quotes`}/><Table columns={[{label:'REFERENCE',key:'reference'},{label:'DESCRIPTION',key:'description'},{label:'AMOUNT',render:r=>money(r.amount,currency)},{label:'STATUS',render:r=><Status>{r.status}</Status>}]} rows={quotes}/></section><section className="panel"><SectionTitle title="Variations" subtitle="Approved amounts update revised contract value"/><Table columns={[{label:'REFERENCE',key:'reference'},{label:'DESCRIPTION',key:'description'},{label:'AMOUNT',render:r=>money(r.amount,currency)},{label:'STATUS',render:r=><Status>{r.status}</Status>}]} rows={variations}/></section></div>}
    {tab==='Communications'&&<div className="panel"><SectionTitle title="Project communications" subtitle="Linked email and calendar activity"/><Table columns={[{label:'SUBJECT / EVENT',render:r=><b>{r.subject||r.title}</b>},{label:'TYPE',render:r=>r.subject?'Email':'Calendar event'},{label:'DATE',render:r=>shortDate(r.date)},{label:'STATUS',render:r=>r.unread?<Status>Unread</Status>:<span className="muted">Recorded</span>}]} rows={[...data.emails.filter(e=>e.projectId===id),...data.events.filter(e=>e.projectId===id)]} onRowClick={r=>onDetails(r,r.subject?'Email':'Event')}/></div>}
    {tab==='Documents'&&<div className="panel"><SectionTitle title="Document register" subtitle="Mock document metadata only"/><Table columns={[{label:'DOCUMENT',render:r=><div className="document-row"><FileText size={17}/><b>{r.name}</b></div>},{label:'TYPE',render:r=>r.name.split(' ')[0]},{label:'RECORD',render:()=>project.reference},{label:'AVAILABILITY',render:()=> <span className="muted">Metadata only · not uploaded</span>}]} rows={(project.documents||[]).map((name,i)=>({id:`doc${i}`,name,record:project.reference}))} /></div>}
    {tab==='Activity'&&<div className="panel"><SectionTitle title="Project timeline" subtitle="Recent events linked to this job"/><div className="timeline">{data.activity.filter(a=>a.recordId===id||a.description.toLowerCase().includes(project.name.toLowerCase())).map(item=><div className="timeline-row" key={item.id}><span className="activity-marker"><Activity size={13}/></span><div><b>{item.title}</b><p>{item.description}</p><small>{shortDate(item.date)}</small></div></div>)}</div></div>}
  </>
}

function SchedulePage({data,onCreate,onEdit,onUpdate,notify}){
  const [view,setView]=useState('Agenda'),[search,setSearch]=useState(''),[filters,setFilters]=useState({project:'All',owner:'All',priority:'All',status:'All'})
  const rows=data.tasks.filter(t=>`${t.title} ${projectOf(data,t.projectId)?.name} ${t.owner}`.toLowerCase().includes(search.toLowerCase())&&(filters.project==='All'||projectOf(data,t.projectId)?.name===filters.project)&&(filters.owner==='All'||t.owner===filters.owner)&&(filters.priority==='All'||t.priority===filters.priority)&&(filters.status==='All'||t.status===filters.status))
  const today=data.tasks.filter(t=>daysFromNow(t.dueDate)===0&&t.status!=='Completed').length
  const overdue=rows.filter(t=>daysFromNow(t.dueDate)<0&&t.status!=='Completed')
  const columns=[{label:'TASK / MILESTONE',render:r=><div className="primary-cell"><b>{r.title}</b><small>{projectOf(data,r.projectId)?.name}</small></div>},{label:'OWNER',key:'owner'},{label:'DUE DATE',render:r=><span className={daysFromNow(r.dueDate)<0&&r.status!=='Completed'?'text-red':''}>{shortDate(r.dueDate)}</span>},{label:'PRIORITY',render:r=><Status>{r.priority}</Status>},{label:'STATUS',render:r=><select className="table-select" value={r.status} onChange={e=>{onUpdate('tasks',r.id,{status:e.target.value});notify('Task status updated')}}>{['Not Started','In Progress','Blocked','Completed'].map(v=><option key={v}>{v}</option>)}</select>},{label:'',render:r=><button className="row-more" aria-label="Edit task" onClick={()=>onEdit(r)}><Pencil size={15}/></button>}]
  return <><PageHeading eyebrow="FIELD OPERATIONS" title="Schedule & tasks" description="Coordinate site activity, manage dependencies and keep milestones on track." actionLabel="New task" icon={Plus} onAction={onCreate}/><div className="kpi-grid compact-kpis"><Kpi icon={ClipboardList} label="Open tasks" value={data.tasks.filter(t=>t.status!=='Completed').length} sub="Across all active projects"/><Kpi icon={AlertTriangle} label="Overdue" value={data.tasks.filter(t=>t.status!=='Completed'&&daysFromNow(t.dueDate)<0).length} sub="Needs immediate attention" tone="red"/><Kpi icon={CalendarDays} label="Due today" value={today} sub="Scheduled for today" tone="amber"/><Kpi icon={CheckCircle2} label="Completed" value={data.tasks.filter(t=>t.status==='Completed').length} sub="Tasks finished" tone="green"/></div><div className="panel list-panel"><div className="schedule-head"><SectionTitle title="Work schedule" subtitle="Construction tasks and project milestones"/><div className="view-switch"><button className={view==='Agenda'?'active':''} onClick={()=>setView('Agenda')}>Agenda</button><button className={view==='Week'?'active':''} onClick={()=>setView('Week')}>Week view</button></div></div>{overdue.length>0&&<div className="inline-warning"><AlertTriangle size={16}/><span><b>{overdue.length} overdue task{overdue.length===1?'':'s'}</b> need attention, including {overdue[0].title}.</span></div>}<SearchFilter search={search} onSearch={setSearch} placeholder="Search tasks or projects..." filters={[{key:'project',label:'Project',value:filters.project,options:[...new Set(data.projects.map(p=>p.name))]},{key:'owner',label:'Owner',value:filters.owner,options:[...new Set(data.tasks.map(t=>t.owner))]},{key:'priority',label:'Priority',value:filters.priority,options:['Low','Medium','High','Critical']},{key:'status',label:'Status',value:filters.status,options:['Not Started','In Progress','Blocked','Completed']}]} onFilter={(key,value)=>setFilters({...filters,[key]:value})}/>{view==='Agenda'?<Table columns={columns} rows={rows.sort((a,b)=>a.dueDate.localeCompare(b.dueDate))} empty="No tasks found"/>:<WeekCalendar tasks={rows} data={data} onUpdate={onUpdate} notify={notify}/>}</div></>
}
function WeekCalendar({tasks,data,onUpdate,notify}){
  const start=new Date();start.setDate(start.getDate()-start.getDay()+1)
  const days=Array.from({length:7},(_,index)=>{const date=new Date(start);date.setDate(start.getDate()+index);return date})
  const iso=date=>date.toISOString().slice(0,10)
  return <div className="week-calendar">{days.map(date=>{const items=tasks.filter(t=>t.dueDate===iso(date));return <div className="calendar-day" key={iso(date)}><div className="calendar-day-title"><b>{date.toLocaleDateString('en-AU',{weekday:'short'})}</b><span>{date.getDate()}</span></div><div className="calendar-day-items">{items.map(task=><button key={task.id} className={`calendar-task ${statusTone(task.priority)}`} onClick={()=>{onUpdate('tasks',task.id,{status:task.status==='Completed'?'Not Started':'Completed'});notify(`Task ${task.status==='Completed'?'reopened':'completed'} in demo`)}}><b>{task.title}</b><span>{projectOf(data,task.projectId)?.reference}</span></button>)}{!items.length&&<span className="calendar-empty">No milestones</span>}</div></div>})}</div>
}

function QuotesPage({data,currency,onCreate,onEdit,onUpdate,onDetails,notify}){
  const [tab,setTab]=useState('Quotes'),[search,setSearch]=useState('')
  const quotes=data.quotes.filter(q=>`${q.reference} ${q.description} ${customerOf(data,q.customerId)?.name}`.toLowerCase().includes(search.toLowerCase()))
  const variations=data.variations.filter(v=>`${v.reference} ${v.description} ${projectOf(data,v.projectId)?.name}`.toLowerCase().includes(search.toLowerCase()))
  const quoteCols=[{label:'REFERENCE',render:r=><div className="primary-cell"><b>{r.reference}</b><small>{shortDate(r.createdDate)}</small></div>},{label:'CUSTOMER / PROJECT',render:r=><div className="primary-cell"><b>{customerOf(data,r.customerId)?.name}</b><small>{projectOf(data,r.projectId)?.name}</small></div>},{label:'DESCRIPTION',key:'description'},{label:'AMOUNT',render:r=><b>{money(r.amount,currency)}</b>},{label:'FOLLOW-UP',render:r=>shortDate(r.followUp)},{label:'STATUS',render:r=><select className="table-select" value={r.status} onClick={e=>e.stopPropagation()} onChange={e=>{onUpdate('quotes',r.id,{status:e.target.value});notify('Quote status updated')}}>{['Draft','In Preparation','Sent','Accepted','Declined','Expired'].map(s=><option key={s}>{s}</option>)}</select>},{label:'',render:r=><button className="row-more" onClick={e=>{e.stopPropagation();onEdit('Quote',r)}} aria-label="Edit quote"><Pencil size={15}/></button>}]
  const variationCols=[{label:'REFERENCE',render:r=><div className="primary-cell"><b>{r.reference}</b><small>Requested {shortDate(r.requestDate)}</small></div>},{label:'PROJECT',render:r=><div className="primary-cell"><b>{projectOf(data,r.projectId)?.name}</b><small>{customerOf(data,r.customerId)?.name}</small></div>},{label:'DESCRIPTION',key:'description'},{label:'REQUESTED AMOUNT',render:r=><b>{money(r.amount,currency)}</b>},{label:'SCHEDULE IMPACT',key:'scheduleImpact'},{label:'STATUS',render:r=><select className="table-select" value={r.status} onClick={e=>e.stopPropagation()} onChange={e=>{onUpdate('variations',r.id,{status:e.target.value});notify(e.target.value==='Approved'?'Variation approved. Revised project contract value recalculated.':'Variation status updated. Contract value reflects approved variations only.')}}>{['Requested','Priced','Awaiting Approval','Approved','Declined'].map(s=><option key={s}>{s}</option>)}</select>},{label:'',render:r=><button className="row-more" onClick={e=>{e.stopPropagation();onEdit('Variation',r)}} aria-label="Edit variation"><Pencil size={15}/></button>}]
  return <><PageHeading eyebrow="COMMERCIAL MANAGEMENT" title="Quotes & variations" description="Keep proposals, client decisions and scope changes moving forward." action={<div className="heading-action-group"><button className="button secondary" onClick={()=>onCreate('Variation')}><Plus size={16}/>New variation</button><button className="button primary" onClick={()=>onCreate('Quote')}><Plus size={16}/>New quote</button></div>}/><div className="kpi-grid compact-kpis"><Kpi icon={FileText} label="Open quotes" value={data.quotes.filter(q=>['Draft','In Preparation','Sent'].includes(q.status)).length} sub="Draft, preparing or with client"/><Kpi icon={Clock3} label="Awaiting decision" value={data.quotes.filter(q=>q.status==='Sent').length} sub="Follow-up may be required" tone="amber"/><Kpi icon={ArrowUpRight} label="Approved variations" value={data.variations.filter(v=>v.status==='Approved').length} sub={`${money(data.variations.filter(v=>v.status==='Approved').reduce((s,v)=>s+v.amount,0),currency)} added to contracts`} tone="green"/><Kpi icon={AlertTriangle} label="Awaiting approval" value={data.variations.filter(v=>v.status==='Awaiting Approval').length} sub="Customer decision required" tone="amber"/></div><div className="panel list-panel"><div className="tab-strip compact-tabs"><button className={tab==='Quotes'?'active':''} onClick={()=>setTab('Quotes')}>Quotes <span>{data.quotes.length}</span></button><button className={tab==='Variations'?'active':''} onClick={()=>setTab('Variations')}>Variations <span>{data.variations.length}</span></button></div><SearchFilter search={search} onSearch={setSearch} placeholder={`Search ${tab.toLowerCase()}...`}/>{tab==='Quotes'?<Table columns={quoteCols} rows={quotes} onRowClick={r=>onDetails(r,'Quote')} empty="No quotes found"/>:<><div className="variation-note"><CheckCircle2 size={15}/> Approved variation values are calculated once and reflected in revised contract value.</div><Table columns={variationCols} rows={variations} onRowClick={r=>onDetails(r,'Variation')} empty="No variations found"/></>}</div></>
}

function FinancePage({data,currency,onUpdate,onDetails,onNavigate,notify}){
  const [tab,setTab]=useState('Invoices'),[search,setSearch]=useState(''),[filters,setFilters]=useState({status:'All',project:'All',customer:'All'})
  const records=data.invoices.filter(r=>(tab==='Invoices'?r.kind==='Invoice':r.kind==='Bill')&&`${r.number} ${r.supplier} ${customerOf(data,r.customerId)?.name} ${projectOf(data,r.projectId)?.name}`.toLowerCase().includes(search.toLowerCase())&&(filters.status==='All'||r.status===filters.status)&&(filters.project==='All'||projectOf(data,r.projectId)?.name===filters.project)&&(filters.customer==='All'||customerOf(data,r.customerId)?.name===filters.customer))
  const invoices=data.invoices.filter(i=>i.kind==='Invoice'),bills=data.invoices.filter(i=>i.kind==='Bill'),overdue=overdueInvoices(data.invoices)
  const columns=tab==='Invoices'?[
    {label:'INVOICE',render:r=><div className="primary-cell"><b>{r.number}</b><small>Issued {shortDate(r.issueDate)}</small></div>},
    {label:'CUSTOMER',render:r=><button className="text-link" onClick={e=>{e.stopPropagation();onNavigate('/customers')}}>{customerOf(data,r.customerId)?.name||'—'}</button>},
    {label:'PROJECT',render:r=><button className="text-link" onClick={e=>{e.stopPropagation();onNavigate(`/projects/${r.projectId}`)}}>{projectOf(data,r.projectId)?.name||'—'}</button>},
    {label:'DUE DATE',render:r=><span className={r.status==='Overdue'?'text-red':''}>{shortDate(r.dueDate)}</span>},
    {label:'AMOUNT',render:r=>money(r.amount,currency)},
    {label:'PAID',render:r=>money(r.paid,currency)},
    {label:'BALANCE',render:r=><b>{money(outstanding(r),currency)}</b>},
    {label:'STATUS',render:r=><Status>{r.status}</Status>},
  ]:[
    {label:'BILL',render:r=><div className="primary-cell"><b>{r.number}</b><small>Issued {shortDate(r.issueDate)}</small></div>},
    {label:'SUPPLIER',key:'supplier'},
    {label:'PROJECT',render:r=><button className="text-link" onClick={e=>{e.stopPropagation();onNavigate(`/projects/${r.projectId}`)}}>{projectOf(data,r.projectId)?.name}</button>},
    {label:'DUE DATE',render:r=><span className={r.status==='Overdue'?'text-red':''}>{shortDate(r.dueDate)}</span>},
    {label:'AMOUNT',render:r=>money(r.amount,currency)},
    {label:'PAID',render:r=>money(r.paid,currency)},
    {label:'BALANCE',render:r=><b>{money(outstanding(r),currency)}</b>},
    {label:'STATUS',render:r=><Status>{r.status}</Status>},
  ]
  const mockPayment=(record)=>{const paid=record.paid<record.amount?record.amount:0;const newStatus=paid?'Paid':daysFromNow(record.dueDate)<0?'Overdue':'Awaiting Payment';onUpdate('invoices',record.id,{paid,status:newStatus});notify(paid?'Demo payment recorded locally. No accounting system was updated.':'Demo payment reversed locally.');}
  return <><PageHeading eyebrow="SAMPLE FINANCIAL DATA — XERO IS NOT CONNECTED" title="Finance" description="Review customer receivables, supplier bills and cash collection priorities." action={<button className="button secondary" onClick={()=>notify('Demo only — Xero is not connected.')}><ExternalIcon/>View in Xero</button>}/><div className="notice-banner"><AlertTriangle size={16}/><span>Sample financial data — Xero is not connected. No invoices or payments are sent or updated externally.</span></div><div className="kpi-grid compact-kpis"><Kpi icon={Wallet} label="Total outstanding" value={money(invoices.reduce((s,i)=>s+outstanding(i),0),currency)} sub={`${invoices.filter(i=>outstanding(i)>0).length} customer invoices`} tone="blue"/><Kpi icon={AlertTriangle} label="Overdue receivables" value={money(overdue.reduce((s,i)=>s+outstanding(i),0),currency)} sub={`${overdue.length} invoices past due`} tone="red"/><Kpi icon={Clock3} label="Due within 7 days" value={money(invoices.filter(i=>outstanding(i)>0&&daysFromNow(i.dueDate)>=0&&daysFromNow(i.dueDate)<=7).reduce((s,i)=>s+outstanding(i),0),currency)} sub="Expected customer payments" tone="amber"/><Kpi icon={CheckCircle2} label="Paid invoices" value={invoices.filter(i=>i.status==='Paid').length} sub={`${money(invoices.filter(i=>i.status==='Paid').reduce((s,i)=>s+i.amount,0),currency)} fully settled`} tone="green"/><Kpi icon={BriefcaseBusiness} label="Outstanding bills" value={money(bills.reduce((s,i)=>s+outstanding(i),0),currency)} sub={`${bills.filter(i=>outstanding(i)>0).length} supplier bills`} tone="violet"/></div><div className="panel list-panel"><div className="finance-heading"><SectionTitle title="Receivables & payables" subtitle="Invoice and bill register"/><div className="view-switch"><button className={tab==='Invoices'?'active':''} onClick={()=>setTab('Invoices')}>Invoices <span>{invoices.length}</span></button><button className={tab==='Bills'?'active':''} onClick={()=>setTab('Bills')}>Bills <span>{bills.length}</span></button></div></div><SearchFilter search={search} onSearch={setSearch} placeholder={`Search ${tab.toLowerCase()}...`} filters={[{key:'status',label:'Status',value:filters.status,options:['Draft','Awaiting Payment','Partially Paid','Paid','Overdue']},{key:'project',label:'Project',value:filters.project,options:[...new Set(data.projects.map(p=>p.name))]},{key:'customer',label:'Customer',value:filters.customer,options:[...new Set(data.customers.map(c=>c.name))]}]} onFilter={(key,value)=>setFilters({...filters,[key]:value})}/><Table columns={columns} rows={records} onRowClick={r=>onDetails(r,tab==='Invoices'?'Invoice':'Bill')} empty={`No ${tab.toLowerCase()} match these filters`}/></div><div className="page-footnote"><CircleDollarSign size={14}/> Payment amounts and invoice statuses are mock records and can be changed in demo mode.</div></>
}
function ExternalIcon(){return <ArrowUpRight size={16}/>}

function CommunicationsPage({data,onUpdate,onDetails,notify}){
  const [tab,setTab]=useState('Inbox')
  const [search,setSearch]=useState('')
  const [filters,setFilters]=useState({customer:'All',project:'All',unread:false,follow:false})
  const emails=data.emails.filter(e=>`${e.sender} ${e.subject} ${e.preview}`.toLowerCase().includes(search.toLowerCase())&&(filters.customer==='All'||customerOf(data,e.customerId)?.name===filters.customer)&&(filters.project==='All'||projectOf(data,e.projectId)?.name===filters.project)&&(!filters.unread||e.unread)&&(!filters.follow||e.followUp))
  const eventRows=data.events.filter(e=>`${e.title} ${projectOf(data,e.projectId)?.name}`.toLowerCase().includes(search.toLowerCase()))
  const columns=[
    {label:'SENDER',render:r=><div className="person-cell"><span className={`mail-unread ${r.unread?'unread':''}`}/><span><b>{r.sender}</b><small>{customerOf(data,r.customerId)?.company||'External contact'}</small></span></div>},
    {label:'SUBJECT',render:r=><div className="primary-cell"><b className={r.unread?'unread-text':''}>{r.subject}</b><small>{r.preview}</small></div>},
    {label:'PROJECT',render:r=>projectOf(data,r.projectId)?.reference||'—'},
    {label:'FOLLOW-UP',render:r=>r.followUp?<Status>Required</Status>:<span className="muted">—</span>},
    {label:'DATE',render:r=>shortDate(r.date)},
    {label:'',render:r=><button className={`icon-button flag-button ${r.flagged?'flagged':''}`} aria-label="Toggle flag" onClick={e=>{e.stopPropagation();onUpdate('emails',r.id,{flagged:!r.flagged});notify(r.flagged?'Email unflagged':'Email flagged for follow-up')}}><Flag size={15}/></button>},
  ]
  const eventColumns=[
    {label:'DATE',render:r=><div className="primary-cell"><b>{shortDate(r.date)}</b><small>{r.time}</small></div>},
    {label:'EVENT',render:r=><b>{r.title}</b>},
    {label:'PROJECT',render:r=>projectOf(data,r.projectId)?.name},
    {label:'TYPE',key:'type'},
    {label:'OWNER',key:'owner'},
  ]
  return <>
    <PageHeading eyebrow="CUSTOMER COMMUNICATIONS" title="Communications" description="Email and calendar activity connected to customers and projects." actionLabel="Draft follow-up" icon={Send} onAction={()=>onDetails({subject:'Follow-up draft',body:'',sender:'Jordan Taylor',recipient:'',date:day(0)},'Draft')}/>
    <div className="notice-banner"><Mail size={16}/><span>Outlook is not connected. Drafts stay in this browser and no messages are sent.</span><b>DEMO MODE — NOT CONNECTED</b></div>
    <div className="panel list-panel">
      <div className="finance-heading">
        <SectionTitle title={tab==='Inbox'?'Inbox':'Calendar agenda'} subtitle={tab==='Inbox'?`${emails.length} conversations in this view`:'Upcoming and recent site events'}/>
        <div className="view-switch"><button className={tab==='Inbox'?'active':''} onClick={()=>setTab('Inbox')}>Inbox <span>{data.emails.filter(e=>e.unread).length}</span></button><button className={tab==='Calendar'?'active':''} onClick={()=>setTab('Calendar')}>Calendar</button></div>
      </div>
      <SearchFilter search={search} onSearch={setSearch} placeholder={tab==='Inbox'?'Search email...':'Search calendar events...'} filters={tab==='Inbox'?[{key:'customer',label:'Customer',value:filters.customer,options:[...new Set(data.customers.map(c=>c.name))]},{key:'project',label:'Project',value:filters.project,options:[...new Set(data.projects.map(p=>p.name))]}]:[]} onFilter={(key,value)=>setFilters({...filters,[key]:value})}/>
      {tab==='Inbox'&&<div className="mail-filter-toggles"><button className={filters.unread?'selected':''} onClick={()=>setFilters({...filters,unread:!filters.unread})}><span className="mail-unread unread"/>Unread only</button><button className={filters.follow?'selected':''} onClick={()=>setFilters({...filters,follow:!filters.follow})}><Flag size={13}/>Needs follow-up</button></div>}
      {tab==='Inbox'
        ? <Table columns={columns} rows={emails} onRowClick={r=>{onUpdate('emails',r.id,{unread:false});onDetails({...r,wasUnread:r.unread},'Email')}} empty="No email conversations found"/>
        : <Table columns={eventColumns} rows={eventRows} onRowClick={r=>onDetails(r,'Event')} empty="No calendar events found"/>}
    </div>
  </>
}

function ReportsPage({data,currency,notify}){
  const [period,setPeriod]=useState('All time'),[project,setProject]=useState('All projects')
  const withinPeriod=(date)=>period==='All time'||(period==='Last 30 days'?daysFromNow(date)>=-30:period==='Last 90 days'?daysFromNow(date)>=-90:new Date(`${date}T00:00:00`).getFullYear()===new Date().getFullYear())
  const reportLeads=data.leads.filter(l=>withinPeriod(l.lastActivity))
  const filteredProjects=data.projects.filter(p=>(project==='All projects'||p.name===project)&&withinPeriod(p.startDate))
  const filteredTasks=data.tasks.filter(t=>project==='All projects'||t.projectId===data.projects.find(p=>p.name===project)?.id)
  const leadStages=['New','Contacted','Qualified','Quote in Progress','Quote Sent','Won','Lost'].map(stage=>({name:stage,leads:reportLeads.filter(l=>l.stage===stage).length,value:reportLeads.filter(l=>l.stage===stage).reduce((s,l)=>s+l.value,0)}))
  const sources=[...new Set(reportLeads.map(l=>l.source))].map(name=>({name,value:reportLeads.filter(l=>l.source===name).length}))
  const statusData=['Planning','Scheduled','In Progress','On Hold','Completed','Cancelled'].map(name=>({name,value:filteredProjects.filter(p=>p.status===name).length})).filter(x=>x.value)
  const healthData=['On Track','At Risk','Delayed'].map(name=>({name,value:filteredProjects.filter(p=>p.health===name).length}))
  const exportRows=filteredProjects.map(p=>({reference:p.reference,project:p.name,status:p.status,health:p.health,progress:p.progress,contractValue:revisedContract(p,data.variations),budget:p.budget,actualCost:p.actualCost,variance:p.actualCost-p.budget,customer:customerOf(data,p.customerId)?.company}))
  const aged=invoiceAging(data.invoices)
  return <><PageHeading eyebrow="BUSINESS PERFORMANCE" title="Reports & analytics" description="Understand pipeline health, project delivery and sample financial performance." secondary={{label:'Export project report',icon:Download,onClick:()=>notify(csvDownload('siteledger-project-report.csv',exportRows)?'Project report downloaded as CSV.':'No report data to export.')}}/><div className="report-toolbar"><div><SlidersHorizontal size={16}/><b>Report filters</b><span>Charts recalculate from current demo data</span></div><label><span>Period</span><select value={period} onChange={e=>setPeriod(e.target.value)}><option>All time</option><option>Last 30 days</option><option>Last 90 days</option><option>This year</option></select></label><label><span>Project</span><select value={project} onChange={e=>setProject(e.target.value)}><option>All projects</option>{data.projects.map(p=><option key={p.id}>{p.name}</option>)}</select></label></div><div className="report-grid"><section className="panel"><SectionTitle title="Leads by stage" subtitle="Opportunity count in each stage"/><ResponsiveContainer width="100%" height={250}><BarChart data={leadStages} margin={{top:8,right:12,left:-15,bottom:10}}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={55} tick={{fontSize:10}}/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="leads" fill="#168c82" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></section><section className="panel"><SectionTitle title="Pipeline value by stage" subtitle="Open opportunity value"/><ResponsiveContainer width="100%" height={250}><BarChart data={leadStages.filter(l=>!['Won','Lost'].includes(l.name))} margin={{top:8,right:8,left:0,bottom:10}}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={55} tick={{fontSize:10}}/><YAxis tickFormatter={v=>`${Math.round(v/1000)}k`}/><Tooltip formatter={v=>money(v,currency)}/><Bar dataKey="value" fill="#4b78a4" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></section><section className="panel"><SectionTitle title="Lead sources" subtitle="Enquiries by acquisition channel"/><ResponsiveContainer width="100%" height={225}><PieChart><Pie data={sources} dataKey="value" nameKey="name" innerRadius={48} outerRadius={82} paddingAngle={3} label>{sources.map((entry,i)=><Cell key={entry.name} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></section><section className="panel"><SectionTitle title="Project health & status" subtitle={`${filteredProjects.length} projects included`}/><div className="report-status-list">{[...statusData.map(x=>({...x,group:'Status'})),...healthData.map(x=>({...x,group:'Health'}))].map((item,i)=><div key={`${item.group}-${item.name}`}><span><i style={{background:CHART_COLORS[i%CHART_COLORS.length]}}/>{item.group} · {item.name}</span><b>{item.value}</b></div>)}</div></section><section className="panel wide-panel"><SectionTitle title="Budget vs actual" subtitle="Illustrative financial figures · variance = actual cost − budget"/><Table columns={[{label:'PROJECT',render:r=><b>{r.name}</b>},{label:'CONTRACT VALUE',render:r=>money(revisedContract(r,data.variations),currency)},{label:'BUDGET',render:r=>money(r.budget,currency)},{label:'ACTUAL COST',render:r=>money(r.actualCost,currency)},{label:'VARIANCE',render:r=><b className={r.actualCost-r.budget>0?'text-red':'text-green'}>{money(r.actualCost-r.budget,currency)}</b>}]} rows={filteredProjects}/></section><section className="panel wide-panel"><SectionTitle title="Task status" subtitle="Delivery workload for selected project"/><div className="report-status-list horizontal">{['Not Started','In Progress','Blocked','Completed'].map((s,i)=><div key={s}><span><i style={{background:CHART_COLORS[i]}}/>{s}</span><b>{filteredTasks.filter(t=>t.status===s).length}</b></div>)}</div></section><section className="panel"><SectionTitle title="Sales conversion" subtitle="Won vs lost opportunities and quote acceptance"/><div className="report-status-list"><div><span>Won leads</span><b>{reportLeads.filter(l=>l.stage==='Won').length}</b></div><div><span>Lost leads</span><b>{reportLeads.filter(l=>l.stage==='Lost').length}</b></div><div><span>Accepted quotes</span><b>{data.quotes.filter(q=>q.status==='Accepted').length} / {data.quotes.length}</b></div><div><span>Quote acceptance</span><b>{data.quotes.length?Math.round(data.quotes.filter(q=>q.status==='Accepted').length/data.quotes.length*100):0}%</b></div></div></section><section className="panel"><SectionTitle title="Financial snapshot" subtitle="Illustrative receivables and payables"/><div className="report-status-list"><div><span>Outstanding receivables</span><b>{money(data.invoices.filter(i=>i.kind==='Invoice').reduce((s,i)=>s+outstanding(i),0),currency)}</b></div><div><span>Overdue receivables</span><b>{money(overdueInvoices(data.invoices).reduce((s,i)=>s+outstanding(i),0),currency)}</b></div><div><span>Outstanding bills</span><b>{money(data.invoices.filter(i=>i.kind==='Bill').reduce((s,i)=>s+outstanding(i),0),currency)}</b></div>{Object.entries(aged).map(([name,value])=><div key={name}><span>Ageing · {name}</span><b>{money(value,currency)}</b></div>)}</div></section><section className="panel wide-panel"><SectionTitle title="Overdue milestones" subtitle="Incomplete tasks past their due date"/><Table columns={[{label:'TASK',render:r=><b>{r.title}</b>},{label:'PROJECT',render:r=>projectOf(data,r.projectId)?.name},{label:'OWNER',key:'owner'},{label:'DUE DATE',render:r=>shortDate(r.dueDate)},{label:'STATUS',render:r=><Status>{r.status}</Status>}]} rows={filteredTasks.filter(t=>t.status!=='Completed'&&daysFromNow(t.dueDate)<0)}/></section></div><div className="page-footnote"><AlertTriangle size={14}/> Reports are based on illustrative demo information and are not financial advice or accounting records.</div></>
}

function IntegrationsPage({data,update,notify,onDetails}){
  const sync=(integration)=>{
    const warned=integration.id==='buildxact'
    const history={id:`sync-${Date.now()}`,provider:integration.name,operation:'Simulated sync',records:integration.recordCount,result:warned?'Warning':'Success',message:warned?'Sample warning: 1 project record has incomplete site details.':'Demo sync completed. No external system was contacted.',date:new Date().toISOString()}
    update('integrations',data.integrations.map(item=>item.id===integration.id?{...item,lastSync:new Date().toISOString(),recordCount:item.recordCount,warnings:warned?1:0}:item))
    update('syncHistory',[history,...data.syncHistory])
    notify('Demo sync completed. No external system was contacted.')
  }
  return <><PageHeading eyebrow="PLATFORM CONNECTIONS" title="Integrations" description="Review the proposed connection points for the tools your business already uses."/><div className="integration-callout"><div><span className="demo-icon"><RefreshCw size={17}/></span><div><b>All integrations are disconnected</b><p>This proof of concept runs entirely in your browser. No external systems are contacted.</p></div></div><span className="disconnected-label">DEMO MODE — NOT CONNECTED</span></div><div className="provider-grid">{data.integrations.map(item=><IntegrationCard key={item.id} integration={item} onSync={()=>sync(item)} onHistory={()=>onDetails({history:data.syncHistory,provider:item.name},'Sync History')}/>)}</div><section className="panel list-panel sync-history"><SectionTitle title="Simulated sync history" subtitle="Example activity only. Nothing has been synchronized externally."/><Table columns={[{label:'TIMESTAMP',render:r=>r.date.includes('T')?new Date(r.date).toLocaleString('en-AU',{dateStyle:'medium',timeStyle:'short'}):shortDate(r.date)},{label:'PROVIDER',key:'provider'},{label:'OPERATION',key:'operation'},{label:'RECORDS',key:'records'},{label:'RESULT',render:r=><Status>{r.result}</Status>},{label:'DETAILS',key:'message'}]} rows={data.syncHistory} empty="No simulated sync activity yet"/></section><div className="page-footnote"><AlertTriangle size={14}/> Integration status will remain disconnected even after using the local simulation buttons.</div></>
}
function IntegrationCard({integration,onSync,onHistory}){
  const Icon=integration.id==='buildxact'?HardHat:integration.id==='xero'?CircleDollarSign:Mail
  return <section className="panel integration-card"><div className={`provider-badge ${integration.id}`}><Icon size={22}/></div><div className="provider-title"><h2>{integration.name}</h2><Status>Not connected</Status></div><p>{integration.purpose}</p><div className="integration-detail"><small>INTENDED DATA CATEGORIES</small><div className="tag-list">{integration.categories.map(category=><span key={category}>{category}</span>)}</div></div><div className="integration-stats"><div><small>Last simulated sync</small><b>{integration.lastSync==='Never'?'Never':new Date(integration.lastSync).toLocaleString('en-AU',{dateStyle:'medium',timeStyle:'short'})}</b></div><div><small>Example records</small><b>{integration.recordCount}</b></div><div><small>Warnings</small><b className={integration.warnings?'text-amber':''}>{integration.warnings}</b></div></div><div className="disconnected-ribbon">DEMO MODE — NOT CONNECTED</div><div className="integration-actions"><button className="button primary" onClick={onSync}><RefreshCw size={15}/>Simulate sync</button><button className="button secondary" onClick={onHistory}><Clock3 size={15}/>History</button></div></section>
}

function SettingsPage({settings,onSave,onReset,notify}){
  const [draft,setDraft]=useState(settings),[confirm,setConfirm]=useState(false)
  useEffect(()=>setDraft(settings),[settings])
  const field=(key,value)=>setDraft({...draft,[key]:value})
  return <><PageHeading eyebrow="WORKSPACE PREFERENCES" title="Settings" description="Configure your local demo workspace and reset its sample data."/><div className="settings-layout"><section className="panel settings-panel"><SectionTitle title="Company & profile" subtitle="Display preferences are stored in this browser."/><label className="form-field"><span>Company display name</span><input value={draft.companyName} onChange={e=>field('companyName',e.target.value)} maxLength={70}/></label><label className="form-field"><span>User display name</span><input value={draft.userName} onChange={e=>field('userName',e.target.value)} maxLength={70}/></label><label className="form-field"><span>Currency</span><select value={draft.currency} onChange={e=>field('currency',e.target.value)}>{['AUD','NZD','USD','GBP','EUR','CAD'].map(code=><option key={code} value={code}>{code} — {new Intl.DisplayNames(['en'],{type:'currency'}).of(code)}</option>)}</select><small>Currency changes update all financial displays across the app.</small></label><label className="form-field"><span>Theme preference</span><select value={draft.theme} onChange={e=>field('theme',e.target.value)}><option>Light</option><option>Dark</option><option>System</option></select><small>Only the light theme is currently available in this proof of concept.</small></label><label className="setting-toggle"><span><b>Demo notifications</b><small>Show local activity and follow-up reminders</small></span><input type="checkbox" checked={draft.notifications} onChange={e=>field('notifications',e.target.checked)}/></label><div className="settings-actions"><button className="button primary" onClick={()=>{if(!draft.companyName.trim()||!draft.userName.trim())return notify('Company and user names are required.');onSave(draft);notify('Workspace settings saved locally.')}}><Check size={16}/>Save preferences</button><span>Changes are stored in local storage on this device.</span></div></section><section className="panel settings-panel"><SectionTitle title="Demo data management" subtitle="Restore original sample records and remove demo-only changes."/><div className="reset-card"><span className="reset-icon"><RotateCcw size={20}/></span><div><b>Reset demo workspace</b><p>Restore seeded leads, customers, projects, tasks, finance records, communications and integration history. This action cannot be undone.</p><button className="button destructive" onClick={()=>setConfirm(true)}><Trash2 size={15}/>Reset demo data</button></div></div><div className="settings-info"><b>SiteLedger Construction CRM</b><span>Frontend proof of concept · version 1.0</span><span>All names, records and financial figures are fictional sample data.</span><div className="disconnected-ribbon">NO BACKEND · NO LIVE INTEGRATIONS</div></div></section></div>{confirm&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setConfirm(false)}}><div className="confirm-dialog"><span className="confirm-icon"><AlertTriangle size={21}/></span><h2>Reset demo data?</h2><p>This will replace current changes with the original seeded records. Your workspace settings will be preserved.</p><div><button className="button secondary" onClick={()=>setConfirm(false)}>Cancel</button><button className="button destructive" onClick={()=>{setConfirm(false);onReset()}}>Reset demo data</button></div></div></div>}</>
}

function Drawer({data,details,currency,onClose,onConvert,onUpdate,onEdit,onNavigate,notify}){
  const {record,type}=details
  const customer=type==='Customer'?record:customerOf(data,record.customerId)
  const project=projectOf(data,record.projectId)
  const [draft,setDraft]=useState(record.body||'')
  const [draftRecipient,setDraftRecipient]=useState(record.recipient||'')
  const [draftSubject,setDraftSubject]=useState(record.subject||'')
  const [note,setNote]=useState('')
  const [projectToLink,setProjectToLink]=useState('')
  const removeLead=()=>{
    if(!window.confirm(`Delete lead ${record.name}? This cannot be undone.`))return
    onUpdate('leads',record.id,{_deleted:true})
    onClose();notify('Lead removed from this demo workspace.')
  }
  return <div className="drawer-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><aside className="detail-drawer"><div className="drawer-header"><div><small>{type==='Draft'?'LOCAL COMPOSER':`${type.toUpperCase()} DETAILS`}</small><h2>{record.name||record.subject||record.title||record.reference||record.number}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close details"><X size={18}/></button></div>
    <div className="drawer-body">
      {type==='Lead'&&<><div className="drawer-status"><Status>{record.stage}</Status><b>{money(record.value,currency)}</b></div><div className="drawer-section"><h3>Contact information</h3><DetailRow label="Company" value={record.company}/><DetailRow label="Email" value={record.email}/><DetailRow label="Phone" value={record.phone}/><DetailRow label="Project type" value={record.projectType}/><DetailRow label="Source" value={record.source}/><DetailRow label="Owner" value={record.owner}/><DetailRow label="Next follow-up" value={shortDate(record.followUp)}/></div><div className="drawer-section"><h3>Notes</h3><p className="drawer-note">{record.notes||'No notes added yet.'}</p><textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Add a note to this lead..." rows={3}/><button className="button secondary full-button" onClick={()=>{if(!note.trim())return notify('Enter a note first.');onUpdate('leads',record.id,{notes:[record.notes,note.trim()].filter(Boolean).join('\n')});setNote('');notify('Lead note saved locally.')}}>Add note</button></div><div className="drawer-section"><h3>Related records</h3>{record.customerId&&<button className="related-row" onClick={()=>onNavigate('/customers')}>Customer profile <ArrowRight size={14}/></button>}{record.projectId&&<button className="related-row" onClick={()=>onNavigate(`/projects/${record.projectId}`)}>Open converted project <ArrowRight size={14}/></button>}<div className="activity-item"><span className="activity-marker"><Activity size={13}/></span><div><b>Last activity</b><p>{shortDate(record.lastActivity)}</p></div></div></div></>}
      {type==='Customer'&&<><div className="customer-profile"><span className="avatar customer-avatar large-avatar">{record.name.split(' ').map(x=>x[0]).join('')}</span><div><b>{record.name}</b><span>{record.company}</span><Status>{record.status}</Status></div></div><div className="drawer-section"><h3>Contact details</h3><DetailRow label="Email" value={record.email}/><DetailRow label="Phone" value={record.phone}/><DetailRow label="Site address" value={record.address}/><DetailRow label="Last interaction" value={shortDate(record.lastInteraction)}/></div><div className="drawer-section"><h3>Linked projects</h3>{data.projects.filter(p=>p.customerId===record.id).map(p=><button className="related-row" key={p.id} onClick={()=>onNavigate(`/projects/${p.id}`)}><span><b>{p.name}</b><small>{p.reference} · {p.status}</small></span><ArrowRight size={14}/></button>)}{!data.projects.some(p=>p.customerId===record.id)&&<p className="muted">No linked projects.</p>}</div><div className="drawer-section"><h3>Open invoices</h3>{data.invoices.filter(i=>i.kind==='Invoice'&&i.customerId===record.id&&outstanding(i)>0).map(i=><button className="related-row" key={i.id} onClick={()=>{onClose();onNavigate('/finance')}}><span><b>{i.number}</b><small>{i.status} · due {shortDate(i.dueDate)}</small></span><b>{money(outstanding(i),currency)}</b></button>)}</div><div className="drawer-section"><h3>Communications</h3>{data.emails.filter(e=>e.customerId===record.id).map(e=><button className="related-row" key={e.id} onClick={()=>onNavigate('/communications')}><span><b>{e.subject}</b><small>{shortDate(e.date)}</small></span><ArrowRight size={14}/></button>)}</div></>}
      {type==='Customer'&&<div className="drawer-section"><h3>Customer notes</h3><p className="drawer-note">{record.notes||'No customer notes yet.'}</p><textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Add a customer note..." rows={3}/><button className="button secondary full-button" onClick={()=>{if(!note.trim())return notify('Enter a note first.');onUpdate('customers',record.id,{notes:[record.notes,note.trim()].filter(Boolean).join('\n')});setNote('');notify('Customer note saved locally.')}}>Add note</button></div>}
      {type==='Customer'&&<div className="drawer-section"><h3>Link to existing project</h3><label className="form-field"><span>Project</span><select value={projectToLink} onChange={e=>setProjectToLink(e.target.value)}><option value="">Select project</option>{data.projects.filter(p=>p.customerId!==record.id).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><button className="button secondary full-button" disabled={!projectToLink} onClick={()=>{onUpdate('projects',projectToLink,{customerId:record.id});setProjectToLink('');notify('Customer linked to project.')}}>Link customer to project</button></div>}
      {type==='Project'&&<div className="drawer-section"><DetailRow label="Reference" value={record.reference}/><DetailRow label="Customer" value={customer?.company}/><DetailRow label="Address" value={record.address}/><DetailRow label="Manager" value={record.manager}/><DetailRow label="Status" value={record.status}/><DetailRow label="Contract value" value={money(revisedContract(record,data.variations),currency)}/></div>}
      {type==='Invoice'||type==='Bill'?<><div className="drawer-status"><Status>{record.status}</Status><b>{money(outstanding(record),currency)} outstanding</b></div><div className="drawer-section"><h3>{type} details</h3><DetailRow label="Reference" value={record.number}/><DetailRow label={type==='Invoice'?'Customer':'Supplier'} value={type==='Invoice'?customerOf(data,record.customerId)?.name:record.supplier}/><DetailRow label="Project" value={project?.name}/><DetailRow label="Issue date" value={shortDate(record.issueDate)}/><DetailRow label="Due date" value={shortDate(record.dueDate)}/><DetailRow label="Invoice amount" value={money(record.amount,currency)}/><DetailRow label="Amount paid" value={money(record.paid,currency)}/><DetailRow label="Outstanding balance" value={money(outstanding(record),currency)}/></div><div className="drawer-section"><h3>Payment breakdown</h3><div className="payment-track"><i style={{width:`${Math.min(100,record.paid/record.amount*100)}%`}}/></div><p className="drawer-note">{money(record.paid,currency)} paid of {money(record.amount,currency)}. Any change is local demo data only.</p><button className="button primary full-button" onClick={()=>{const paid=record.paid<record.amount?record.amount:0;onUpdate('invoices',record.id,{paid,status:paid?'Paid':daysFromNow(record.dueDate)<0?'Overdue':'Awaiting Payment'});notify(paid?'Demo payment recorded locally.':'Payment reverted in demo data.');onClose()}}>{record.paid<record.amount?'Mark paid in demo':'Revert demo payment'}</button></div></>:null}
      {type==='Invoice'||type==='Bill'?<div className="drawer-section"><h3>Related records</h3>{type==='Invoice'&&<button className="related-row" onClick={()=>{onClose();onNavigate('/customers')}}>Open customer directory <ArrowRight size={14}/></button>}{project&&<button className="related-row" onClick={()=>{onClose();onNavigate(`/projects/${project.id}`)}}>Open project <ArrowRight size={14}/></button>}</div>:null}
      {type==='Email'&&<><div className="drawer-section email-meta"><DetailRow label="From" value={record.sender}/><DetailRow label="To" value={record.recipient}/><DetailRow label="Date" value={shortDate(record.date)}/><DetailRow label="Customer" value={customer?.name||'—'}/><DetailRow label="Project" value={project?.name||'—'}/></div><div className="drawer-section"><h3>Message</h3><p className="email-body">{record.body}</p></div><div className="drawer-section"><h3>Follow-up</h3><div className="drawer-buttons"><button className="button secondary" onClick={()=>{onUpdate('emails',record.id,{unread:!record.unread});notify(record.unread?'Email marked read':'Email marked unread')}}><Mail size={15}/>{record.unread?'Mark read':'Mark unread'}</button><button className="button secondary" onClick={()=>{onUpdate('emails',record.id,{followUp:!record.followUp});notify(record.followUp?'Follow-up cleared':'Follow-up marked required')}}><Flag size={15}/>{record.followUp?'Clear follow-up':'Mark follow-up required'}</button></div></div></>}
      {type==='Event'&&<div className="drawer-section"><DetailRow label="Event" value={record.title}/><DetailRow label="Date" value={shortDate(record.date)}/><DetailRow label="Time" value={record.time||'To be confirmed'}/><DetailRow label="Type" value={record.type}/><DetailRow label="Project" value={project?.name}/><DetailRow label="Owner" value={record.owner}/></div>}
      {type==='Quote'&&<div className="drawer-section"><DetailRow label="Quote reference" value={record.reference}/><DetailRow label="Customer" value={customer?.name}/><DetailRow label="Project" value={project?.name}/><DetailRow label="Description" value={record.description}/><DetailRow label="Amount" value={money(record.amount,currency)}/><DetailRow label="Status" value={record.status}/><DetailRow label="Expiry" value={shortDate(record.expiryDate)}/></div>}
      {type==='Variation'&&<div className="drawer-section"><DetailRow label="Variation reference" value={record.reference}/><DetailRow label="Project" value={project?.name}/><DetailRow label="Customer" value={customer?.name}/><DetailRow label="Description" value={record.description}/><DetailRow label="Requested amount" value={money(record.amount,currency)}/><DetailRow label="Schedule impact" value={record.scheduleImpact}/><DetailRow label="Status" value={record.status}/>{record.status==='Approved'&&<p className="success-note"><CheckCircle2 size={15}/> Included once in revised contract value.</p>}</div>}
      {type==='Draft'&&<><div className="drawer-section"><label className="form-field"><span>To</span><input placeholder="Customer email address" value={draftRecipient} onChange={e=>setDraftRecipient(e.target.value)}/></label><label className="form-field"><span>Subject</span><input value={draftSubject} onChange={e=>setDraftSubject(e.target.value)}/></label><label className="form-field"><span>Message draft</span><textarea rows={9} value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Write a local follow-up draft..."/></label><div className="notice-banner compact-notice">Demo only — message has not been sent.</div><button className="button primary full-button" onClick={()=>{if(!draftRecipient.includes('@')||!draftSubject.trim()||!draft.trim())return notify('Enter a valid recipient, subject and message before saving.');onSaveDraft({id:`draft-${Date.now()}`,recipient:draftRecipient,subject:draftSubject,body:draft,date:day(0)});onClose();notify('Draft saved locally. Demo only — message has not been sent.')}}><SaveIcon/>Save local draft</button></div><div className="drawer-section"><h3>Saved drafts</h3>{data.drafts?.map(item=><div className="saved-draft" key={item.id}><b>{item.subject}</b><span>To {item.recipient} · {shortDate(item.date)}</span></div>)}{!data.drafts?.length&&<p className="muted">No saved drafts yet.</p>}</div></>}
      {type==='Sync History'&&<Table columns={[{label:'DATE',render:r=>shortDate(r.date)},{label:'OPERATION',key:'operation'},{label:'RESULT',render:r=><Status>{r.result}</Status>},{label:'DETAILS',key:'message'}]} rows={record.history.filter(h=>h.provider===record.provider)}/>}
    </div>
    <div className="drawer-footer">{type==='Lead'&&<><button className="icon-button danger-icon" onClick={removeLead} aria-label="Delete lead"><Trash2 size={17}/></button><button className="button secondary" onClick={()=>onEdit(record)}>Edit lead</button>{['Qualified','Won'].includes(record.stage)&&!record.projectId&&<button className="button primary" onClick={()=>onConvert(record)}>Convert to project</button>}</>}{type==='Customer'&&<button className="button secondary" onClick={()=>onEdit(record)}>Edit customer</button>}{type==='Quote'&&<button className="button secondary" onClick={()=>onEdit(record)}>Edit quote</button>}{type==='Variation'&&<button className="button secondary" onClick={()=>onEdit(record)}>Edit variation</button>}{(type==='Email'||type==='Event')&&<button className="button secondary" onClick={onClose}>Close</button>}</div>
  </aside></div>
}
function SaveIcon(){return <Check size={16}/>}
function DetailRow({label,value}){return <div className="detail-row"><small>{label}</small><b>{value||'—'}</b></div>}

const FORM_FIELDS={
  Lead:[['name','Contact name','text',true],['company','Company','text',true],['email','Email','email',true],['phone','Phone','text'],['source','Lead source','select',['Website','Referral','Google Ads','Social Media','Existing Customer','Trade Partner','Other']],['projectType','Project type','select',['New build','Extension','Renovation','Bathroom','Kitchen','Deck','Other']],['value','Estimated value','number',true],['stage','Sales stage','select',['New','Contacted','Qualified','Quote in Progress','Quote Sent','Won','Lost']],['owner','Assigned owner','select',['Daniel Foster','Mia Thompson','Luca Martin']],['followUp','Next follow-up','date',true],['notes','Notes','textarea']],
  Customer:[['name','Customer name','text',true],['company','Company','text',true],['email','Email','email',true],['phone','Phone','text'],['address','Site address','text'],['status','Customer status','select',['Active','Prospect']],['lastInteraction','Last interaction','date'],['notes','Notes','textarea']],
  Task:[['title','Task title','text',true],['projectId','Project','select-project',true],['owner','Owner','select',['Daniel Foster','Mia Thompson','Luca Martin']],['startDate','Start date','date'],['dueDate','Due date','date',true],['priority','Priority','select',['Low','Medium','High','Critical']],['status','Status','select',['Not Started','In Progress','Blocked','Completed']],['dependency','Dependency','text'],['notes','Notes','textarea']],
  Quote:[['reference','Quote reference','text',true],['customerId','Customer','select-customer',true],['projectId','Project','select-project',true],['description','Description','text',true],['amount','Amount','number',true],['createdDate','Date created','date',true],['sentDate','Date sent','date'],['expiryDate','Expiry date','date'],['followUp','Follow-up date','date'],['status','Status','select',['Draft','In Preparation','Sent','Accepted','Declined','Expired']]],
  Variation:[['reference','Variation reference','text',true],['projectId','Project','select-project',true],['description','Description','text',true],['amount','Requested amount','number',true],['requestDate','Request date','date',true],['scheduleImpact','Schedule impact','text'],['status','Approval status','select',['Requested','Priced','Awaiting Approval','Approved','Declined']]],
}
function FormModal({type,record,data,onClose,onSave}){
  const fields=FORM_FIELDS[type]||[]
  const [values,setValues]=useState(()=>Object.fromEntries(fields.map(([key,,kind,option])=>[key,record?.[key]??(kind==='date'?day(0):kind==='select'&&Array.isArray(option)?option[0]:undefined)])))
  const [error,setError]=useState('')
  const change=(key,value)=>setValues({...values,[key]:value})
  const submit=e=>{
    e.preventDefault()
    const missing=fields.find(([key,label,,required])=>required&&!String(values[key]??'').trim())
    if(missing){setError(`${missing[1]} is required.`);return}
    if(values.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)){setError('Enter a valid email address.');return}
    if(['value','amount'].some(key=>values[key]!==undefined&&Number(values[key])<0)){setError('Amount cannot be negative.');return}
    const clean={...values}
    if(clean.value!==undefined)clean.value=Number(clean.value)
    if(clean.amount!==undefined)clean.amount=Number(clean.amount)
    if(type==='Variation'&&clean.projectId)clean.customerId=projectOf(data,clean.projectId)?.customerId
    if(type==='Lead'&&record){clean.activity=[...(record.activity||[]),{date:day(0),note:'Lead details updated'}]}
    onSave(clean)
  }
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><form className="form-modal" onSubmit={submit}><div className="modal-heading"><div><small>{record?'UPDATE RECORD':'ADD TO WORKSPACE'}</small><h2>{record?`Edit ${type.toLowerCase()}`:`Create ${type.toLowerCase()}`}</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close form"><X size={18}/></button></div><div className="form-fields">{fields.map(([key,label,kind,option])=><label className={`form-field ${kind==='textarea'?'span-two':''}`} key={key}><span>{label}{option===true&&<i> *</i>}</span>{kind==='textarea'?<textarea value={values[key]??''} onChange={e=>change(key,e.target.value)} rows={3}/>:kind==='select'?<select value={values[key]??''} onChange={e=>change(key,e.target.value)}><option value="">Select {label.toLowerCase()}</option>{option.map(value=><option key={value}>{value}</option>)}</select>:kind==='select-project'?<select value={values[key]??''} onChange={e=>change(key,e.target.value)}><option value="">Select project</option>{data.projects.map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select>:kind==='select-customer'?<select value={values[key]??''} onChange={e=>change(key,e.target.value)}><option value="">Select customer</option>{data.customers.map(c=><option value={c.id} key={c.id}>{c.company}</option>)}</select>:<input type={kind} min={kind==='number'?0:undefined} step={kind==='number'?100:undefined} value={values[key]??''} onChange={e=>change(key,e.target.value)}/>}</label>)}</div>{error&&<div className="form-error"><AlertTriangle size={15}/>{error}</div>}<div className="modal-actions"><button className="button secondary" type="button" onClick={onClose}>Cancel</button><button className="button primary" type="submit"><Check size={16}/>{record?'Save changes':`Create ${type.toLowerCase()}`}</button></div></form></div>
}
