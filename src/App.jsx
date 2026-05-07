import { useState, useEffect, useRef, useMemo, useCallback } from "react";

/* ===== CONFIG ===== */
const FOLDER_ID = "1H7JBgaoTX3g94wGD3A3bloVcMCJL_ZXh";
const DRIVE_URL = "https://drive.google.com/drive/folders/" + FOLDER_ID;
const CLIENT_ID = "727865116903-3f05472e4i39hq12d6a42t2voohubros.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/drive.file";
const SK = "eh_wh_tracker_v8";

const P = { erin: { name: "Erin", accent: "#C96B5B" }, henry: { name: "Henry", accent: "#5B8FB9" } };

/* ===== GOOGLE DRIVE UPLOAD ===== */
let _tokenClient = null;
let _accessToken = null;
let _gisLoaded = false;

function loadGis() {
  return new Promise((resolve) => {
    if (_gisLoaded) return resolve();
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.onload = () => { _gisLoaded = true; resolve(); };
    document.head.appendChild(s);
  });
}

function getToken() {
  return new Promise(async (resolve, reject) => {
    if (_accessToken) return resolve(_accessToken);
    await loadGis();
    if (!_tokenClient) {
      _tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (resp) => {
          if (resp.error) return reject(resp);
          _accessToken = resp.access_token;
          setTimeout(() => { _accessToken = null; }, (resp.expires_in - 60) * 1000);
          resolve(_accessToken);
        },
      });
    }
    _tokenClient.requestAccessToken({ prompt: "" });
  });
}

async function uploadToDrive(file, fileName) {
  const token = await getToken();
  const metadata = { name: fileName, parents: [FOLDER_ID] };
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", file);
  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink", {
    method: "POST",
    headers: { Authorization: "Bearer " + token },
    body: form,
  });
  if (!res.ok) throw new Error("Upload failed: " + res.status);
  return res.json();
}

/* ===== DATA ===== */
const TASKS_INIT = [
  { id: "t01", title: "Henry 網路預約換護照", desc: "外交部領事局線上預約，一般件 10 工作天，急件 +$900 最快隔天取", deadline: "2026-05-07", assignee: "henry", category: "護照", phase: 1 },
  { id: "t02", title: "Erin 確認護照效期 ≥ 12 個月", desc: "若不足需同步辦理換發", deadline: "2026-05-07", assignee: "erin", category: "護照", phase: 1 },
  { id: "t03", title: "預約衛福部指定醫院健檢", desc: "報告需 5-7 天出爐，不需漢生病及寄生蟲檢查。請至 CDC 網站查詢指定醫院", deadline: "2026-05-08", assignee: "both", category: "健檢", phase: 1 },
  { id: "t04", title: "拍攝白底彩色證件照", desc: "3.5 x 4.5cm，最近 6 個月內拍攝，用於貼在簽證申請書上", deadline: "2026-05-09", assignee: "both", category: "證件照", phase: 2 },
  { id: "t05", title: "銀行開立存款餘額證明", desc: "本人名義、台灣境內銀行或郵局、USD $3,000 以上，中英文均可", deadline: "2026-05-09", assignee: "both", category: "財力證明", phase: 2 },
  { id: "t06", title: "戶政事務所申請全戶戶籍謄本", desc: "全戶，中英文均可，當場可取件", deadline: "2026-05-09", assignee: "both", category: "戶籍", phase: 2 },
  { id: "t07", title: "警察局申請無犯罪紀錄證明", desc: "良民證，約 3-5 個工作天，中英文均可", deadline: "2026-05-12", assignee: "both", category: "良民證", phase: 3 },
  { id: "t08", title: "準備最高學歷證明", desc: "正本 + 影本（或在學證明正本），中英文均可", deadline: "2026-05-12", assignee: "both", category: "學歷", phase: 3 },
  { id: "t09", title: "投保海外旅平險", desc: "保期大於等於 1 年（365 天），需含海外事故意外理賠，保單須明載「海外 / overseas / global」字樣", deadline: "2026-05-14", assignee: "both", category: "保險", phase: 3 },
  { id: "t10", title: "撰寫打工渡假行程及計畫書", desc: "下載代表部附件格式，中英韓文均可，務必親筆簽名", deadline: "2026-05-16", assignee: "both", category: "計畫書", phase: 4 },
  { id: "t11", title: "填寫簽證申請書", desc: "建議英文或韓文填寫，貼上證件照", deadline: "2026-05-16", assignee: "both", category: "申請書", phase: 4 },
  { id: "t12", title: "Henry 領取新護照", desc: "一般件約 5/19-20 可取（自繳費次半日起算 10 工作天）", deadline: "2026-05-20", assignee: "henry", category: "護照", phase: 5 },
  { id: "t13", title: "影印護照資料頁 + 身分證正反面", desc: "各 1 份，代表部現場也有影印機", deadline: "2026-05-23", assignee: "both", category: "影本", phase: 5 },
  { id: "t14", title: "按代表部順序排列全部 10 項文件", desc: "護照、申請書、影本、戶籍、存款、計畫書、學歷、良民證、健檢、保險", deadline: "2026-05-29", assignee: "both", category: "最終確認", phase: 6 },
  { id: "t15", title: "逐項確認文件為 3 個月內正本", desc: "缺件 / 文件有誤一律不接受補件", deadline: "2026-05-29", assignee: "both", category: "最終確認", phase: 6 },
  { id: "t16", title: "前往駐台北韓國代表部繳件", desc: "台北市基隆路一段 333 號 1506 室（國貿大樓 15F）08:30-11:20 / 14:00-15:50", deadline: "2026-06-01", assignee: "both", category: "繳件", phase: 7 },
  { id: "t17", title: "領取護照 + H-1 簽證", desc: "繳件後約 10 個工作天，憑收據至代表部領取，可由他人代領", deadline: "2026-06-15", assignee: "both", category: "取件", phase: 8 },
];

const PHASES = [
  { n: 1, label: "啟動準備" }, { n: 2, label: "基本文件" }, { n: 3, label: "證明文件" },
  { n: 4, label: "計畫撰寫" }, { n: 5, label: "護照取件" }, { n: 6, label: "最終確認" },
  { n: 7, label: "正式繳件" }, { n: 8, label: "等待取件" },
];

const INFO_SECTIONS = [
  { title: "申請資格", items: [["年齡限制","滿 18 歲以上 ~ 34 歲以下（含），以申請日為基準"],["適用對象","中華民國（臺灣）國民"],["限制","一生僅能申請一次，曾發給此簽證者不得再申請"]]},
  { title: "申請方式", items: [["收件期間","2026.5.5（二）~ 12.4（五）平日"],["收件時間","08:30-11:20 / 14:00-15:50"],["名額","每年 800 位，按順序受理額滿為止"],["申請方式","本人親自至代表部申請，備齊文件當場受理"],["審查時間","約 10 個工作天"],["領件","憑收據至代表部領取，可由他人代領"]]},
  { title: "簽證內容", items: [["簽證類型","H-1 觀光就業（打工度假）"],["有效期","核發日起 1 年內多次入境"],["停留期限","入境日起最長 1 年"],["外國人登錄證","停留 90 天以上須於入境後 90 天內申請"]]},
  { title: "就業限制", items: [["工時","一年不超過 1,300 小時（每週 25 小時）"],["雇用方式","不限約聘 / 時薪，符合工時即可"],["禁止職業","教授、外語教學、律師、醫師、機師、研究員等專業職"],["禁止場所","聲色場所"]]},
  { title: "代表部資訊", items: [["地址","台北市基隆路一段 333 號 1506 室（國貿大樓 15F）"],["電話","(02) 2758-8320~5"],["休館日","6/19、7/17、9/25、9/28、10/9、10/26、12/25"]]},
  { title: "繳件文件順序", items: [["①","護照正本（效期 12 個月以上）+ 身分證正本"],["②","簽證申請書（貼 3.5x4.5cm 彩色照片）"],["③","護照 + 身分證影本各 1 份"],["④","全戶戶籍謄本"],["⑤","存款餘額證明（USD $3,000+，本人名義）"],["⑥","打工渡假行程及計畫書（須簽名）"],["⑦","學歷證明正本 + 影本（或在學證明正本）"],["⑧","無犯罪紀錄證明（良民證）"],["⑨","健康診斷書（衛福部指定醫院）"],["⑩","海外保險證明（1 年以上，載明海外字樣）"]]},
];

/* ===== HELPERS ===== */
function load() { try { return JSON.parse(localStorage.getItem(SK)); } catch { return null; } }
function save(d) { try { localStorage.setItem(SK, JSON.stringify(d)); } catch {} }
function daysLeft(d) { const now = new Date(); now.setHours(0,0,0,0); const t = new Date(d); t.setHours(0,0,0,0); return Math.ceil((t - now) / 86400000); }
function fmt(d) { const t = new Date(d); return (t.getMonth()+1) + "/" + t.getDate(); }

/* ===== MAIN APP ===== */
export default function App() {
  const saved = load();
  const [view, setView] = useState("dashboard");
  const [tasks, setTasks] = useState(() => {
    if (saved?.tasks) {
      return TASKS_INIT.map(t => {
        const s = saved.tasks.find(x => x.id === t.id);
        return s ? { ...t, erinDone:s.erinDone||false, henryDone:s.henryDone||false, erinFile:s.erinFile||"", henryFile:s.henryFile||"", erinDriveLink:s.erinDriveLink||"", henryDriveLink:s.henryDriveLink||"" } : { ...t, erinDone:false, henryDone:false, erinFile:"", henryFile:"", erinDriveLink:"", henryDriveLink:"" };
      });
    }
    return TASKS_INIT.map(t => ({ ...t, erinDone:false, henryDone:false, erinFile:"", henryFile:"", erinDriveLink:"", henryDriveLink:"" }));
  });
  const [filter, setFilter] = useState("all");
  const [searchQ, setSearchQ] = useState("");
  const fileRef = useRef(null);
  const [uploadCtx, setUploadCtx] = useState(null);
  const [toast, setToast] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { save({ tasks: tasks.map(t => ({ id:t.id, erinDone:t.erinDone, henryDone:t.henryDone, erinFile:t.erinFile, henryFile:t.henryFile, erinDriveLink:t.erinDriveLink, henryDriveLink:t.henryDriveLink })) }); }, [tasks]);

  const toggle = (id, who) => setTasks(prev => prev.map(t => t.id === id ? { ...t, [`${who}Done`]: !t[`${who}Done`] } : t));
  const handleUpload = (id, who) => { setUploadCtx({ id, who }); fileRef.current.click(); };

  const onFile = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file || !uploadCtx) return;
    const { id, who } = uploadCtx;
    const task = tasks.find(t => t.id === id);
    const personName = P[who].name;
    const driveFileName = personName + "_" + task?.category + "_" + file.name;

    setUploading(true);
    setToast("Uploading " + personName + " — " + task?.title + "...");

    try {
      const result = await uploadToDrive(file, driveFileName);
      setTasks(prev => prev.map(t => t.id === id ? { ...t, [who+"File"]: file.name, [who+"DriveLink"]: result.webViewLink || "" } : t));
      setToast(personName + "「" + task?.title + "」uploaded to Drive");
    } catch (err) {
      console.error("Upload error:", err);
      setTasks(prev => prev.map(t => t.id === id ? { ...t, [who+"File"]: file.name } : t));
      setToast("Saved locally. Drive upload failed — please try again.");
    } finally {
      setUploading(false);
      setTimeout(() => setToast(null), 4000);
      e.target.value = "";
    }
  }, [uploadCtx, tasks]);

  const stats = useMemo(() => {
    let total=0,done=0,eT=0,eD=0,hT=0,hD=0,overdue=0,files=0,fileDone=0;
    tasks.forEach(t => {
      const subs = t.assignee==="both"?["erin","henry"]:[t.assignee];
      subs.forEach(w => {
        total++; if(t[w+"Done"])done++;
        if(w==="erin"){eT++;if(t.erinDone)eD++;}
        if(w==="henry"){hT++;if(t.henryDone)hD++;}
        files++;if(t[w+"File"])fileDone++;
        if(!t[w+"Done"]&&daysLeft(t.deadline)<0)overdue++;
      });
    });
    return{total,done,eT,eD,hT,hD,overdue,files,fileDone,pct:total?Math.round(done/total*100):0,ePct:eT?Math.round(eD/eT*100):0,hPct:hT?Math.round(hD/hT*100):0,fPct:files?Math.round(fileDone/files*100):0};
  }, [tasks]);

  const phaseStats = useMemo(() => PHASES.map(p => {
    const pts=tasks.filter(t=>t.phase===p.n); let tot=0,dn=0;
    pts.forEach(t=>{const subs=t.assignee==="both"?["erin","henry"]:[t.assignee];subs.forEach(w=>{tot++;if(t[w+"Done"])dn++;});});
    return{...p,tot,dn,pct:tot?Math.round(dn/tot*100):0};
  }), [tasks]);

  const filteredTasks = useMemo(() => {
    let r = tasks;
    if(filter==="erin")r=r.filter(t=>t.assignee==="erin"||t.assignee==="both");
    if(filter==="henry")r=r.filter(t=>t.assignee==="henry"||t.assignee==="both");
    if(filter==="pending")r=r.filter(t=>{const subs=t.assignee==="both"?["erin","henry"]:[t.assignee];return subs.some(w=>!t[w+"Done"]);});
    if(filter==="overdue")r=r.filter(t=>{const subs=t.assignee==="both"?["erin","henry"]:[t.assignee];return subs.some(w=>!t[w+"Done"])&&daysLeft(t.deadline)<0;});
    if(searchQ.trim()){const q=searchQ.toLowerCase();r=r.filter(t=>t.title.toLowerCase().includes(q)||t.category.toLowerCase().includes(q)||t.desc.toLowerCase().includes(q));}
    return r;
  }, [tasks, filter, searchQ]);

  const reset = () => { if(confirm("確定重置所有進度？"))setTasks(TASKS_INIT.map(t=>({...t,erinDone:false,henryDone:false,erinFile:"",henryFile:"",erinDriveLink:"",henryDriveLink:""}))); };

  return (
    <div style={S.root}>
      <style dangerouslySetInnerHTML={{__html:`.bar{height:4px;border-radius:2px;transition:width .5s ease}.fade-in{animation:fadeIn .35s ease both}@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}.hovcard{transition:box-shadow .2s ease,transform .15s ease}.hovcard:hover{box-shadow:0 2px 12px rgba(0,0,0,.06);transform:translateY(-1px)}@keyframes spin{to{transform:rotate(360deg)}}`}}/>
      <input type="file" ref={fileRef} style={{display:"none"}} onChange={onFile} accept="image/*,.pdf,.doc,.docx,.jpg,.jpeg,.png,.heic"/>

      {toast&&<div style={S.toast}>{uploading&&<span style={S.spinner}/>}{toast}</div>}

      <nav style={S.nav}><div style={S.navInner}>
        <span style={S.logo}>E <span style={{color:"var(--color-text-tertiary)"}}>&amp;</span> H</span>
        <div style={S.navLinks}>{[["dashboard","Dashboard"],["tasks","Tasks"],["info","Info"]].map(([id,lb])=>(
          <button key={id} onClick={()=>setView(id)} style={{...S.navBtn,color:view===id?"#C96B5B":"var(--color-text-secondary)",borderBottom:view===id?"2px solid #C96B5B":"2px solid transparent",fontWeight:view===id?600:400}}>{lb}</button>
        ))}</div>
        <a href={DRIVE_URL} target="_blank" rel="noopener" style={S.driveBtn}>Google Drive</a>
      </div></nav>

      <main style={S.main}>
        {view==="dashboard"&&<Dashboard stats={stats} phaseStats={phaseStats} tasks={tasks} toggle={toggle}/>}
        {view==="tasks"&&<Tasks tasks={filteredTasks} toggle={toggle} filter={filter} setFilter={setFilter} searchQ={searchQ} setSearchQ={setSearchQ} handleUpload={handleUpload} uploading={uploading} stats={stats}/>}
        {view==="info"&&<Info/>}
      </main>

      <footer style={S.footer}>
        <button onClick={reset} style={S.resetBtn}>Reset all progress</button>
        <span style={{fontSize:11,color:"var(--color-text-tertiary)"}}>Source: 駐台北韓國代表部 2026 打工渡假簽證申請須知</span>
      </footer>
    </div>
  );
}

/* ===== DASHBOARD ===== */
function Dashboard({stats,phaseStats,tasks,toggle}){
  const target=new Date("2026-06-01T08:30:00+08:00");
  const[now,setNow]=useState(new Date());
  useEffect(()=>{const i=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(i);},[]);
  const diff=Math.max(0,target-now);
  const d=Math.floor(diff/864e5),h=Math.floor(diff%864e5/36e5),m=Math.floor(diff%36e5/6e4),s=Math.floor(diff%6e4/1e3);
  const upcoming=tasks.filter(t=>{const subs=t.assignee==="both"?["erin","henry"]:[t.assignee];return subs.some(w=>!t[w+"Done"]);}).sort((a,b)=>new Date(a.deadline)-new Date(b.deadline)).slice(0,4);

  return(
    <div className="fade-in">
      <div style={S.dashHead}>
        <div><h1 style={S.dashTitle}>Erin &amp; Henry</h1><p style={S.dashSub}>2026 Korea Working Holiday Tracker</p></div>
        <div style={S.countdown}>
          <div style={S.countLabel}>D-day countdown</div>
          <div style={S.countNum}>{[{v:d,l:"days"},{v:h,l:"hrs"},{v:m,l:"min"},{v:s,l:"sec"}].map((u,i)=>(
            <span key={i} style={S.countUnit}><b style={S.countVal}>{String(u.v).padStart(2,"0")}</b><span style={S.countUnitLabel}>{u.l}</span></span>
          ))}</div>
        </div>
      </div>
      <div style={S.metricGrid}>
        <MetricCard label="Overall" value={stats.pct+"%"} sub={stats.done+" / "+stats.total+" tasks"} pct={stats.pct} color="#C96B5B"/>
        <MetricCard label="Erin" value={stats.ePct+"%"} sub={stats.eD+" / "+stats.eT} pct={stats.ePct} color={P.erin.accent}/>
        <MetricCard label="Henry" value={stats.hPct+"%"} sub={stats.hD+" / "+stats.hT} pct={stats.hPct} color={P.henry.accent}/>
        <MetricCard label="Files" value={stats.fPct+"%"} sub={stats.fileDone+" / "+stats.files} pct={stats.fPct} color="#7C9B6B"/>
      </div>
      {stats.overdue>0&&<div style={S.alertBox}><span style={{fontWeight:600}}>{stats.overdue} overdue task{stats.overdue>1?"s":""}</span> — review and complete as soon as possible</div>}
      <div style={S.section}><h2 style={S.secTitle}>Phase progress</h2>
        <div style={S.phaseGrid}>{phaseStats.map(p=>(
          <div key={p.n} className="hovcard" style={S.phaseCard}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}>
              <span style={{fontSize:12,fontWeight:600,color:"var(--color-text-primary)"}}>{p.label}</span>
              <span style={{fontSize:11,color:p.pct===100?"#4A9A6B":"var(--color-text-tertiary)"}}>{p.pct}%</span>
            </div>
            <div style={{height:4,borderRadius:2,background:"var(--color-border-tertiary)"}}><div className="bar" style={{width:p.pct+"%",background:p.pct===100?"#4A9A6B":"#C96B5B"}}/></div>
            <div style={{fontSize:10,color:"var(--color-text-tertiary)",marginTop:6}}>{p.dn} / {p.tot}</div>
          </div>
        ))}</div>
      </div>
      <div style={S.section}><h2 style={S.secTitle}>Upcoming tasks</h2>
        {upcoming.map(t=><CompactTask key={t.id} t={t} toggle={toggle}/>)}
        {upcoming.length===0&&<div style={{fontSize:13,color:"var(--color-text-tertiary)",padding:"20px 0",textAlign:"center"}}>All tasks completed</div>}
      </div>
    </div>
  );
}

function MetricCard({label,value,sub,pct,color}){
  return(<div className="hovcard" style={S.mCard}>
    <div style={{fontSize:11,fontWeight:500,color:"var(--color-text-tertiary)",marginBottom:6,letterSpacing:.5,textTransform:"uppercase"}}>{label}</div>
    <span style={{fontSize:28,fontWeight:700,fontFamily:"'Fraunces',serif",color}}>{value}</span>
    <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginTop:2}}>{sub}</div>
    <div style={{height:3,borderRadius:2,background:"var(--color-border-tertiary)",marginTop:10}}><div className="bar" style={{width:pct+"%",background:color}}/></div>
  </div>);
}

function CompactTask({t,toggle}){
  const dl=daysLeft(t.deadline);const subs=t.assignee==="both"?["erin","henry"]:[t.assignee];const allDone=subs.every(w=>t[w+"Done"]);
  return(<div style={{...S.compactRow,opacity:allDone?.45:1}}>
    <div style={{flex:1,minWidth:0}}>
      <div style={{fontSize:13,fontWeight:500,color:"var(--color-text-primary)",textDecoration:allDone?"line-through":"none"}}>{t.title}</div>
      <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginTop:2}}>
        {fmt(t.deadline)} · {t.category}
        {dl<0&&!allDone&&<span style={{color:"#C0453A",fontWeight:600,marginLeft:6}}>overdue</span>}
        {dl>=0&&dl<=2&&!allDone&&<span style={{color:"#C4883A",fontWeight:500,marginLeft:6}}>due soon</span>}
      </div>
    </div>
    <div style={{display:"flex",gap:4}}>{subs.map(w=>(
      <button key={w} onClick={()=>toggle(t.id,w)} style={{...S.checkBtn,background:t[w+"Done"]?P[w].accent:"transparent",borderColor:t[w+"Done"]?P[w].accent:"var(--color-border-secondary)",color:t[w+"Done"]?"#fff":"var(--color-text-tertiary)"}}>{t[w+"Done"]?"✓":P[w].name[0]}</button>
    ))}</div>
  </div>);
}

/* ===== TASKS ===== */
function Tasks({tasks,toggle,filter,setFilter,searchQ,setSearchQ,handleUpload,uploading,stats}){
  const filters=[["all","All"],["pending","Pending"],["overdue","Overdue"],["erin","Erin"],["henry","Henry"]];
  const grouped=PHASES.map(p=>({...p,items:tasks.filter(t=>t.phase===p.n)})).filter(g=>g.items.length>0);
  return(<div className="fade-in">
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:12}}>
      <h1 style={S.pageTitle}>Tasks</h1>
      <span style={{fontSize:12,color:"var(--color-text-tertiary)"}}>{stats.done} / {stats.total} completed</span>
    </div>
    <div style={{marginBottom:20}}>
      <input type="text" value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search tasks..." style={S.searchInput}/>
      <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap"}}>{filters.map(([id,lb])=>(
        <button key={id} onClick={()=>setFilter(id)} style={{...S.pill,background:filter===id?"var(--color-text-primary)":"transparent",color:filter===id?"var(--color-background-primary)":"var(--color-text-secondary)",borderColor:filter===id?"var(--color-text-primary)":"var(--color-border-tertiary)"}}>{lb}</button>
      ))}</div>
    </div>
    {grouped.map(g=>(<div key={g.n} style={{marginBottom:28}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
        <span style={{fontSize:10,fontWeight:600,color:"var(--color-text-tertiary)",letterSpacing:1,textTransform:"uppercase"}}>Phase {g.n}</span>
        <span style={{fontSize:13,fontWeight:600,color:"var(--color-text-primary)"}}>{g.label}</span>
      </div>
      {g.items.map(t=><TaskCard key={t.id} t={t} toggle={toggle} handleUpload={handleUpload} uploading={uploading}/>)}
    </div>))}
    {grouped.length===0&&<div style={{textAlign:"center",padding:40,color:"var(--color-text-tertiary)",fontSize:13}}>No tasks match your filter</div>}
  </div>);
}

function TaskCard({t,toggle,handleUpload,uploading}){
  const[open,setOpen]=useState(false);
  const dl=daysLeft(t.deadline);const subs=t.assignee==="both"?["erin","henry"]:[t.assignee];const allDone=subs.every(w=>t[w+"Done"]);
  return(<div className="hovcard" style={{...S.taskCard,borderLeft:"3px solid "+(allDone?"#4A9A6B":dl<0?"#C0453A":"var(--color-border-tertiary)")}}>
    <div onClick={()=>setOpen(!open)} style={{cursor:"pointer",display:"flex",gap:12,alignItems:"flex-start"}}>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <span style={{fontSize:13,fontWeight:600,color:allDone?"var(--color-text-tertiary)":"var(--color-text-primary)",textDecoration:allDone?"line-through":"none"}}>{t.title}</span>
          <span style={{fontSize:10,padding:"2px 8px",borderRadius:99,border:"1px solid var(--color-border-tertiary)",color:"var(--color-text-tertiary)"}}>{t.category}</span>
        </div>
        <div style={{fontSize:11,color:"var(--color-text-tertiary)",marginTop:4,display:"flex",gap:12,flexWrap:"wrap"}}>
          <span>Deadline: {fmt(t.deadline)}</span>
          {dl<0&&!allDone&&<span style={{color:"#C0453A",fontWeight:600}}>Overdue by {Math.abs(dl)}d</span>}
          {dl>=0&&dl<=3&&!allDone&&<span style={{color:"#C4883A",fontWeight:500}}>{dl===0?"Due today":dl+"d left"}</span>}
          {dl>3&&!allDone&&<span>{dl}d left</span>}
          {allDone&&<span style={{color:"#4A9A6B",fontWeight:500}}>Completed</span>}
        </div>
      </div>
      <div style={{display:"flex",gap:4,flexShrink:0}}>{subs.map(w=>(
        <button key={w} onClick={e=>{e.stopPropagation();toggle(t.id,w)}} style={{...S.checkBtn,width:28,height:28,background:t[w+"Done"]?P[w].accent:"transparent",borderColor:t[w+"Done"]?P[w].accent:"var(--color-border-secondary)",color:t[w+"Done"]?"#fff":"var(--color-text-tertiary)",fontSize:11}}>{t[w+"Done"]?"✓":P[w].name[0]}</button>
      ))}</div>
    </div>
    {open&&<div style={{marginTop:12,paddingTop:12,borderTop:"1px solid var(--color-border-tertiary)"}}>
      <p style={{fontSize:12,color:"var(--color-text-secondary)",lineHeight:1.7,marginBottom:12}}>{t.desc}</p>
      {subs.map(w=>(<div key={w} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderTop:"1px solid var(--color-border-tertiary)"}}>
        <span style={{fontSize:12,fontWeight:600,color:P[w].accent,width:48}}>{P[w].name}</span>
        <div style={{flex:1,minWidth:0,overflow:"hidden"}}>
          {t[w+"File"]?(<div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:11,color:"#4A9A6B",fontWeight:500}}>✓</span>
            {t[w+"DriveLink"]?(<a href={t[w+"DriveLink"]} target="_blank" rel="noopener" style={{fontSize:11,color:P[w].accent,textDecoration:"underline",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t[w+"File"]}</a>):(<span style={{fontSize:11,color:"var(--color-text-tertiary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t[w+"File"]}</span>)}
          </div>):(<span style={{fontSize:11,color:"var(--color-text-tertiary)"}}>No file attached</span>)}
        </div>
        <button onClick={()=>handleUpload(t.id,w)} disabled={uploading} style={{...S.uploadBtn,opacity:uploading?.5:1,cursor:uploading?"not-allowed":"pointer"}}>{t[w+"File"]?"Replace":"Upload"}</button>
      </div>))}
    </div>}
  </div>);
}

/* ===== INFO ===== */
function Info(){
  const[q,setQ]=useState("");
  const filtered=INFO_SECTIONS.map(sec=>({...sec,items:sec.items.filter(([k,v])=>!q.trim()||k.toLowerCase().includes(q.toLowerCase())||v.toLowerCase().includes(q.toLowerCase()))})).filter(sec=>sec.items.length>0);
  return(<div className="fade-in">
    <h1 style={S.pageTitle}>Reference</h1>
    <p style={{fontSize:12,color:"var(--color-text-tertiary)",marginBottom:16}}>2026 韓國打工渡假簽證申請須知 — 快速查閱</p>
    <input type="text" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search info..." style={S.searchInput}/>
    {filtered.map((sec,i)=>(<div key={i} style={{marginTop:24}}>
      <h3 style={{fontSize:13,fontWeight:600,color:"var(--color-text-primary)",marginBottom:10}}>{sec.title}</h3>
      <div style={S.infoTable}>{sec.items.map(([k,v],j)=>(<div key={j} style={{display:"flex",padding:"10px 14px",borderBottom:j<sec.items.length-1?"1px solid var(--color-border-tertiary)":"none",gap:12}}>
        <span style={{fontSize:12,fontWeight:500,color:"var(--color-text-secondary)",width:90,flexShrink:0}}>{k}</span>
        <span style={{fontSize:12,color:"var(--color-text-primary)",lineHeight:1.6}}>{v}</span>
      </div>))}</div>
    </div>))}
    {filtered.length===0&&<div style={{textAlign:"center",padding:40,color:"var(--color-text-tertiary)",fontSize:13}}>No results</div>}
  </div>);
}

/* ===== STYLES ===== */
const S={
  root:{fontFamily:"'DM Sans',sans-serif",maxWidth:780,margin:"0 auto",minHeight:"100vh",color:"var(--color-text-primary)"},
  nav:{borderBottom:"1px solid var(--color-border-tertiary)",position:"sticky",top:0,background:"var(--color-background-primary)",zIndex:50},
  navInner:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",height:52,maxWidth:780,margin:"0 auto"},
  logo:{fontFamily:"'Fraunces',serif",fontSize:18,fontWeight:600,color:"var(--color-text-primary)",letterSpacing:-1},
  navLinks:{display:"flex",gap:0},
  navBtn:{background:"none",border:"none",padding:"16px 14px",fontSize:13,cursor:"pointer",fontFamily:"inherit",transition:"color .2s"},
  driveBtn:{fontSize:11,fontWeight:500,padding:"6px 14px",borderRadius:6,border:"1px solid var(--color-border-tertiary)",color:"var(--color-text-secondary)",textDecoration:"none",whiteSpace:"nowrap"},
  main:{padding:"24px 20px 40px"},
  footer:{textAlign:"center",padding:"20px",display:"flex",flexDirection:"column",alignItems:"center",gap:8},
  resetBtn:{fontSize:11,color:"var(--color-text-tertiary)",background:"none",border:"1px solid var(--color-border-tertiary)",padding:"5px 14px",borderRadius:6,cursor:"pointer",fontFamily:"inherit"},
  toast:{position:"fixed",top:12,left:"50%",transform:"translateX(-50%)",zIndex:999,padding:"10px 20px",borderRadius:8,background:"var(--color-text-primary)",color:"var(--color-background-primary)",fontSize:12,fontWeight:500,boxShadow:"0 8px 30px rgba(0,0,0,.15)",display:"flex",alignItems:"center",gap:8},
  spinner:{display:"inline-block",width:14,height:14,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .6s linear infinite"},
  dashHead:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28,flexWrap:"wrap",gap:16},
  dashTitle:{fontSize:28,fontWeight:700,fontFamily:"'Fraunces',serif",letterSpacing:-.5,color:"var(--color-text-primary)"},
  dashSub:{fontSize:13,color:"var(--color-text-tertiary)",marginTop:4,fontWeight:400},
  countdown:{textAlign:"right"},
  countLabel:{fontSize:10,fontWeight:500,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:1,marginBottom:6},
  countNum:{display:"flex",gap:6},
  countUnit:{display:"flex",flexDirection:"column",alignItems:"center"},
  countVal:{fontSize:22,fontWeight:700,fontFamily:"'Fraunces',serif",color:"#C96B5B",lineHeight:1},
  countUnitLabel:{fontSize:9,color:"var(--color-text-tertiary)",marginTop:2,textTransform:"uppercase",letterSpacing:.5},
  metricGrid:{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:24},
  mCard:{background:"var(--color-background-primary)",border:"1px solid var(--color-border-tertiary)",borderRadius:10,padding:"16px 14px"},
  alertBox:{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,padding:"10px 14px",fontSize:12,color:"#991B1B",marginBottom:20},
  section:{marginTop:28},
  secTitle:{fontSize:14,fontWeight:600,color:"var(--color-text-primary)",marginBottom:14,letterSpacing:.2},
  phaseGrid:{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8},
  phaseCard:{background:"var(--color-background-primary)",border:"1px solid var(--color-border-tertiary)",borderRadius:8,padding:"12px"},
  compactRow:{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid var(--color-border-tertiary)",transition:"opacity .2s"},
  checkBtn:{width:24,height:24,borderRadius:6,border:"1.5px solid",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,cursor:"pointer",background:"transparent",fontFamily:"inherit",transition:"all .15s",flexShrink:0},
  pageTitle:{fontSize:22,fontWeight:700,fontFamily:"'Fraunces',serif",color:"var(--color-text-primary)"},
  searchInput:{width:"100%",padding:"10px 14px",borderRadius:8,border:"1px solid var(--color-border-tertiary)",fontSize:13,background:"var(--color-background-primary)",color:"var(--color-text-primary)",outline:"none",marginTop:12},
  pill:{padding:"5px 14px",borderRadius:99,border:"1px solid",fontSize:11,fontWeight:500,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"},
  taskCard:{background:"var(--color-background-primary)",border:"1px solid var(--color-border-tertiary)",borderRadius:8,padding:"14px 16px",marginBottom:8},
  uploadBtn:{fontSize:11,fontWeight:500,padding:"5px 12px",borderRadius:6,border:"1px solid var(--color-border-tertiary)",background:"var(--color-background-secondary)",color:"var(--color-text-secondary)",cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"},
  infoTable:{background:"var(--color-background-primary)",border:"1px solid var(--color-border-tertiary)",borderRadius:8,overflow:"hidden"},
};
