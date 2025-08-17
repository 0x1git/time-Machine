import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { FiPlay, FiPause, FiCoffee, FiCheckCircle, FiTag, FiDollarSign, FiEdit2, FiSave, FiX } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';

const Page = styled.div`
  max-width: 960px;
  margin: 0 auto;
`;

const TrackerCard = styled.div`
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  padding: 16px 20px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px;
  align-items: center;
  margin-bottom: 24px;
`;

const Left = styled.div`
  min-width: 0;
`;

const Desc = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 8px;
  &:focus{ outline: none; border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.15); }
`;

const Row = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
`;

const InlineSelect = styled.select`
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  min-width: 180px;
`;

const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #6b7280;
  padding: 6px 8px;
  border: 1px dashed #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
`;

const Right = styled.div``;

const Counter = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: ${p => p.running ? '#dc2626' : '#16a34a'};
  font-family: "Courier New", monospace;
  text-align: right;
`;

const Controls = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
`;

const Btn = styled.button`
  min-width: 80px;
  height: 40px;
  border-radius: 8px;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 14px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s ease;
  &.primary{ background: ${p => p.running ? '#ef4444' : '#22c55e'}; color:#fff; }
  &.primary:hover{ background: ${p => p.running ? '#dc2626' : '#16a34a'}; }
  &.secondary{ background:#6b7280; color:#fff; }
  &.secondary:hover{ background:#545b62; }
  &:disabled{ opacity:.6; cursor:not-allowed; }
`;

const Card = styled.div`
  background:#fff; border-radius:16px; box-shadow:0 4px 16px rgba(0,0,0,.08); padding:20px; margin-bottom:24px;
`;
const SectionTitle = styled.h3` margin:0 0 12px; font-size:16px; color:#111827; `;
const ListWrap = styled.div` display:flex; flex-direction:column; gap:12px; `;
const WeekHeader = styled.div` display:flex; justify-content:space-between; color:#6b7280; font-size:14px; `;
const WeekTotal = styled.div` font-weight:600; color:#111827; `;
const DayGroup = styled.div` background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; `;
const DayHeader = styled.div` display:flex; justify-content:space-between; padding:12px 16px; background:#fff; border-bottom:1px solid #e5e7eb; border-top-left-radius:10px; border-top-right-radius:10px; `;
const DayTitle = styled.div` font-weight:600; color:#111827; `;
const DayTotal = styled.div` font-family:"Courier New", monospace; color:#374151; `;
const Entries = styled.div` display:flex; flex-direction:column; `;
const RowItem = styled.div` display:grid; grid-template-columns: 1fr auto auto; gap:12px; align-items:center; padding:14px 16px; background:#fff; border-bottom:1px solid #e5e7eb; &:last-child{ border-bottom:none; border-bottom-left-radius:10px; border-bottom-right-radius:10px; } `;
const LeftCol = styled.div` min-width:0; `;
const Title = styled.div` font-weight:500; color:#111827; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; `;
const Sub = styled.div` color:#6b7280; font-size:12px; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; `;
const Range = styled.div` color:#6b7280; font-size:12px; min-width:140px; text-align:right; `;
const Dur = styled.div` font-family:"Courier New", monospace; font-weight:600; color:#111827; min-width:90px; text-align:right; `;
const Empty = styled.div` text-align:center; padding:24px; color:#6b7280; font-style:italic; `;

const EditWrap = styled.div` display:flex; flex-direction:column; gap:8px; padding:8px 0; `;
const EditRow = styled.div` display:flex; gap:8px; align-items:center; `;
const DtInput = styled.input`
  padding: 6px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
`;
const SmallBtn = styled(Btn)` min-width: auto; height: 32px; padding: 0 10px; `;

const formatTime = (sec=0) => {
  const h = Math.floor(sec/3600); const m = Math.floor((sec%3600)/60); const s = sec%60;
  return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
};

const TimerPage = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [runningEntry, setRunningEntry] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeBreak, setActiveBreak] = useState(null);
  const [form, setForm] = useState({ project: '', task: '', description: ''});
  const [week, setWeek] = useState({ groups: [], total: 0, loading: true });
  const [lastWeek, setLastWeek] = useState({ groups: [], total: 0, loading: true });
  const [edit, setEdit] = useState({ id: null, start: '', end: '' });
  const [runningEdit, setRunningEdit] = useState({ open: false, start: '', end: '' });

  useEffect(() => { fetchProjects(); checkRunning(); loadWeeks(); }, []);
  useEffect(() => { if (form.project) fetchTasks(form.project); else setTasks([]); }, [form.project]);
  useEffect(() => {
    let t; if (isRunning && runningEntry && !activeBreak) {
      t = setInterval(() => {
        const start = new Date(runningEntry.startTime);
        setElapsed(Math.floor((Date.now() - start.getTime())/1000));
      }, 1000);
    }
    return () => t && clearInterval(t);
  }, [isRunning, runningEntry, activeBreak]);

  const loadWeeks = async () => {
    await Promise.all([fetchWeek(0, setWeek, true), fetchWeek(-1, setLastWeek)]);
  };

  const fetchProjects = async () => { try { const r = await axios.get('/projects'); setProjects(r.data); } catch(e){ console.error(e);} };
  const fetchTasks = async (pid) => { try { const r = await axios.get(`/tasks?project=${pid}`); setTasks(r.data); } catch(e){ console.error(e);} };

  const checkRunning = async () => {
    try { const r = await axios.get('/time-entries/running'); if (r.data){ setRunningEntry(r.data); setIsRunning(true); setForm({ project:r.data.project?._id, task:r.data.task?._id||'', description:r.data.description||''}); const start=new Date(r.data.startTime); setElapsed(Math.floor((Date.now()-start.getTime())/1000)); }
    } catch(_){/* no-op */}
    try { const br = await axios.get('/breaks/active'); if (br.data){ setActiveBreak(br.data); setIsRunning(false);} } catch(_){/* no-op */}
  };

  const getWeekRange = (offsetWeeks=0) => {
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = (day===0?-6:1)-day;
    const monday = new Date(now); monday.setHours(0,0,0,0); monday.setDate(now.getDate()+diffToMonday + offsetWeeks*7);
    const sunday = new Date(monday); sunday.setDate(monday.getDate()+6); sunday.setHours(23,59,59,999);
    return { start:monday, end:sunday };
  };

  const fetchWeek = async (offset, setState, labelToday=false) => {
    setState(s => ({...s, loading:true}));
    try {
      const {start,end} = getWeekRange(offset);
      const params = new URLSearchParams({ startDate:start.toISOString(), endDate:end.toISOString(), limit:500 });
      const r = await axios.get(`/time-entries?${params.toString()}`);
      const entries = r.data.timeEntries.filter(e=>!e.isRunning);
      const fmt = new Intl.DateTimeFormat(undefined,{ weekday:'short', month:'short', day:'2-digit' });
      const today = new Date(); const yday = new Date(); yday.setDate(today.getDate()-1);
      const sameDay = (a,b)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
      const groupsMap = entries.reduce((acc,e)=>{ const d=new Date(e.startTime); let key = fmt.format(d); if(labelToday){ if(sameDay(d,today)) key='Today'; else if(sameDay(d,yday)) key='Yesterday'; } if(!acc[key]) acc[key]={ key, date:new Date(d.getFullYear(), d.getMonth(), d.getDate()), items:[], total:0 }; acc[key].items.push(e); acc[key].total += e.duration||0; return acc; },{});
      const groups = Object.values(groupsMap).sort((a,b)=>b.date-a.date).map(g=>({ ...g, items: g.items.sort((a,b)=> new Date(b.startTime)-new Date(a.startTime)) }));
      const total = entries.reduce((s,e)=>s+(e.duration||0),0);
      setState({ groups, total, loading:false });
    } catch (e){ console.error(e); setState({ groups:[], total:0, loading:false }); }
  };

  const startTimer = async () => {
    if(!form.project){ toast.error('Please select a project'); return; }
    try{
      const r = await axios.post('/time-entries', { project: form.project, task: form.task||null, description: form.description, startTime: new Date().toISOString(), duration: 0 });
      setRunningEntry(r.data); setIsRunning(true); setElapsed(0); setActiveBreak(null); toast.success('Timer started');
      loadWeeks();
    }catch(e){ toast.error('Failed to start'); console.error(e); }
  };

  const stopTimer = async () => {
    if(!runningEntry) return;
    try{
      await axios.post(`/time-entries/${runningEntry._id}/stop`);
      setIsRunning(false); setRunningEntry(null); setElapsed(0); setActiveBreak(null); setForm({ project:'', task:'', description:''});
      toast.success('Timer stopped');
      loadWeeks();
    }catch(e){ toast.error('Failed to stop'); console.error(e); }
  };

  const startBreak = async () => {
    if(!runningEntry){ toast.error('No active timer'); return; }
    try{ const r = await axios.post('/breaks/start', { timeEntryId: runningEntry._id, breakType: 'other' }); setActiveBreak(r.data); setIsRunning(false); toast.success('Break started'); }catch(e){ toast.error('Failed to start break'); }
  };
  const endBreak = async () => { if(!activeBreak) return; try{ await axios.put(`/breaks/end/${activeBreak._id}`); setActiveBreak(null); if(runningEntry) setIsRunning(true); toast.success('Break ended'); }catch(e){ toast.error('Failed to end break'); } };

  const continueTimer = async (entry) => {
    if(isRunning){ toast.error('Stop current timer first'); return; }
    try{
      const r = await axios.post('/time-entries', { project: entry.project._id, task: entry.task?._id||null, description: entry.description||'', startTime:new Date().toISOString(), duration:0 });
      setRunningEntry(r.data); setIsRunning(true); setElapsed(0); setForm({ project: entry.project._id, task: entry.task?._id||'', description: entry.description||''}); if(entry.project._id) fetchTasks(entry.project._id); toast.success('Timer continued');
      loadWeeks();
    }catch(e){ toast.error('Failed to continue'); }
  };

  const onForm = (k,v) => setForm(prev=>({ ...prev, [k]: v }));

  // Editing helpers
  const toLocalDTValue = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const pad = (n)=> n.toString().padStart(2,'0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth()+1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  };

  const openEdit = (entry) => {
    setEdit({ id: entry._id, start: toLocalDTValue(entry.startTime), end: toLocalDTValue(entry.endTime || new Date()) });
  };
  const cancelEdit = () => setEdit({ id: null, start: '', end: '' });
  const saveEdit = async (entry) => {
    try {
      if (!edit.start || !edit.end) { toast.error('Start and end are required'); return; }
      const s = new Date(edit.start);
      const e = new Date(edit.end);
      if (e <= s) { toast.error('End must be after start'); return; }
      await axios.put(`/time-entries/${entry._id}`, { startTime: s.toISOString(), endTime: e.toISOString() });
      toast.success('Updated time entry');
      cancelEdit();
      loadWeeks();
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const openRunningEdit = () => {
    if (!runningEntry) return;
    setRunningEdit({ open: true, start: toLocalDTValue(runningEntry.startTime), end: toLocalDTValue(new Date()) });
  };
  const cancelRunningEdit = () => setRunningEdit({ open: false, start: '', end: '' });
  const saveRunningEdit = async () => {
    if (!runningEntry) return;
    try{
      if (!runningEdit.start) { toast.error('Start is required'); return; }
      const payload = { startTime: new Date(runningEdit.start).toISOString() };
      if (runningEdit.end) {
        const s = new Date(runningEdit.start); const e = new Date(runningEdit.end);
        if (e <= s) { toast.error('End must be after start'); return; }
        payload.endTime = e.toISOString();
      }
      await axios.put(`/time-entries/${runningEntry._id}`, payload);
      toast.success('Updated');
      cancelRunningEdit();
      // Refresh running state and lists
      await checkRunning();
      await loadWeeks();
      if (runningEdit.end) { setIsRunning(false); setRunningEntry(null); setElapsed(0); setActiveBreak(null); }
    }catch(e){ toast.error('Failed to update'); }
  };

  return (
    <Page>
      <TrackerCard>
        <Left>
          <Desc value={form.description} onChange={e=>onForm('description', e.target.value)} placeholder="What are you working on?" />
          <Row>
            <InlineSelect value={form.project} onChange={e=>onForm('project', e.target.value)} disabled={isRunning}>
              <option value=''>Select project</option>
              {projects.map(p=> <option key={p._id} value={p._id}>{p.name}</option>)}
            </InlineSelect>
            <InlineSelect value={form.task} onChange={e=>onForm('task', e.target.value)} disabled={isRunning || !form.project}>
              <option value=''>Select task</option>
              {tasks.map(t=> <option key={t._id} value={t._id}>{t.name}</option>)}
            </InlineSelect>
            <Chip><FiTag size={14}/> tags</Chip>
            <Chip><FiDollarSign size={14}/> billable</Chip>
          </Row>
        </Left>
        <Right>
          <Counter running={isRunning}>{formatTime(elapsed)}</Counter>
          <Controls>
            {runningEntry && !activeBreak && (
              <Btn className='secondary' onClick={startBreak}><FiCoffee/> Break</Btn>
            )}
            {activeBreak && (
              <Btn className='secondary' onClick={endBreak}><FiCheckCircle/> End break</Btn>
            )}
            {isRunning && (
              runningEdit.open ? (
                <div style={{display:'flex', alignItems:'center', gap:8}}>
                  <div style={{display:'flex', flexDirection:'column', gap:6}}>
                    <label style={{color:'#e5e7eb', fontSize:12}}>Start</label>
                    <DtInput type='datetime-local' value={runningEdit.start} onChange={e=>setRunningEdit({...runningEdit, start: e.target.value})} />
                  </div>
                  <div style={{display:'flex', flexDirection:'column', gap:6}}>
                    <label style={{color:'#e5e7eb', fontSize:12}}>End (optional)</label>
                    <DtInput type='datetime-local' value={runningEdit.end} onChange={e=>setRunningEdit({...runningEdit, end: e.target.value})} />
                  </div>
                  <SmallBtn className='primary' onClick={saveRunningEdit}><FiSave/> Save</SmallBtn>
                  <SmallBtn className='secondary' onClick={cancelRunningEdit}><FiX/> Cancel</SmallBtn>
                </div>
              ) : (
                <Btn className='secondary' onClick={openRunningEdit}><FiEdit2/> Edit times</Btn>
              )
            )}
            <Btn className='primary' running={isRunning} onClick={isRunning?stopTimer:startTimer} disabled={!isRunning && !form.project}>
              {isRunning ? (<><FiPause/> Stop</>) : (<><FiPlay/> Start</>)}
            </Btn>
          </Controls>
        </Right>
      </TrackerCard>

      <Card>
        <SectionTitle>This week</SectionTitle>
        <ListWrap>
          <WeekHeader><div></div><WeekTotal>{formatTime(week.total)}</WeekTotal></WeekHeader>
          {week.loading ? (
            <Empty>Loading week…</Empty>
          ) : week.groups.length === 0 ? (
            <Empty>No entries this week.</Empty>
          ) : (
            week.groups.map(g => (
              <DayGroup key={`w-${g.key}`}>
                <DayHeader><DayTitle>{g.key}</DayTitle><DayTotal>{formatTime(g.total)}</DayTotal></DayHeader>
                <Entries>
                  {g.items.map(timer => (
                    <RowItem key={timer._id}>
                      <LeftCol>
                        <Title>{timer.project?.name}{timer.task?` · ${timer.task.name}`:''}</Title>
                        {timer.description && <Sub title={timer.description}>{timer.description}</Sub>}
                      </LeftCol>
                      {edit.id === timer._id ? (
                        <div style={{display:'flex', alignItems:'center', gap:12, justifySelf:'end'}}>
                          <EditWrap>
                            <EditRow>
                              <label style={{color:'#6b7280', fontSize:12}}>Start</label>
                              <DtInput type='datetime-local' value={edit.start} onChange={e=>setEdit({...edit, start: e.target.value})} />
                            </EditRow>
                            <EditRow>
                              <label style={{color:'#6b7280', fontSize:12}}>End</label>
                              <DtInput type='datetime-local' value={edit.end} onChange={e=>setEdit({...edit, end: e.target.value})} />
                            </EditRow>
                          </EditWrap>
                          <div style={{display:'flex', gap:8}}>
                            <SmallBtn className='primary' onClick={()=>saveEdit(timer)}><FiSave size={14}/>Save</SmallBtn>
                            <SmallBtn className='secondary' onClick={cancelEdit}><FiX size={14}/>Cancel</SmallBtn>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Range>
                            {new Date(timer.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                            {' - '}
                            {timer.endTime ? new Date(timer.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--'}
                          </Range>
                          <div style={{display:'flex',alignItems:'center',gap:12}}>
                            <Dur>{formatTime(timer.duration || 0)}</Dur>
                            <Btn className='secondary' onClick={()=>openEdit(timer)}><FiEdit2 size={14}/>Edit</Btn>
                            <Btn className='primary' onClick={()=>continueTimer(timer)} disabled={isRunning}><FiPlay size={14}/>Continue</Btn>
                          </div>
                        </>
                      )}
                    </RowItem>
                  ))}
                </Entries>
              </DayGroup>
            ))
          )}
        </ListWrap>
      </Card>

      <Card>
        <SectionTitle>Last week</SectionTitle>
        <ListWrap>
          <WeekHeader><div></div><WeekTotal>{formatTime(lastWeek.total)}</WeekTotal></WeekHeader>
          {lastWeek.loading ? (
            <Empty>Loading last week…</Empty>
          ) : lastWeek.groups.length === 0 ? (
            <Empty>No entries last week.</Empty>
          ) : (
            lastWeek.groups.map(g => (
              <DayGroup key={`lw-${g.key}`}>
                <DayHeader><DayTitle>{g.key}</DayTitle><DayTotal>{formatTime(g.total)}</DayTotal></DayHeader>
                <Entries>
                  {g.items.map(timer => (
                    <RowItem key={timer._id}>
                      <LeftCol>
                        <Title>{timer.project?.name}{timer.task?` · ${timer.task.name}`:''}</Title>
                        {timer.description && <Sub title={timer.description}>{timer.description}</Sub>}
                      </LeftCol>
                      {edit.id === timer._id ? (
                        <div style={{display:'flex', alignItems:'center', gap:12, justifySelf:'end'}}>
                          <EditWrap>
                            <EditRow>
                              <label style={{color:'#6b7280', fontSize:12}}>Start</label>
                              <DtInput type='datetime-local' value={edit.start} onChange={e=>setEdit({...edit, start: e.target.value})} />
                            </EditRow>
                            <EditRow>
                              <label style={{color:'#6b7280', fontSize:12}}>End</label>
                              <DtInput type='datetime-local' value={edit.end} onChange={e=>setEdit({...edit, end: e.target.value})} />
                            </EditRow>
                          </EditWrap>
                          <div style={{display:'flex', gap:8}}>
                            <SmallBtn className='primary' onClick={()=>saveEdit(timer)}><FiSave size={14}/>Save</SmallBtn>
                            <SmallBtn className='secondary' onClick={cancelEdit}><FiX size={14}/>Cancel</SmallBtn>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Range>
                            {new Date(timer.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                            {' - '}
                            {timer.endTime ? new Date(timer.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--'}
                          </Range>
                          <div style={{display:'flex',alignItems:'center',gap:12}}>
                            <Dur>{formatTime(timer.duration || 0)}</Dur>
                            <Btn className='secondary' onClick={()=>openEdit(timer)}><FiEdit2 size={14}/>Edit</Btn>
                            <Btn className='primary' onClick={()=>continueTimer(timer)} disabled={isRunning}><FiPlay size={14}/>Continue</Btn>
                          </div>
                        </>
                      )}
                    </RowItem>
                  ))}
                </Entries>
              </DayGroup>
            ))
          )}
        </ListWrap>
      </Card>
    </Page>
  );
};

export default TimerPage;
