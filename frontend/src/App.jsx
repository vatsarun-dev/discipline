import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlarmClock,
  BarChart3,
  BellRing,
  Bot,
  Check,
  ChevronRight,
  CircleDot,
  Clock,
  Flame,
  LayoutDashboard,
  LogOut,
  Plus,
  Radio,
  Search,
  Shield,
  Trash2,
  Zap
} from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { activitiesApi, aiApi, analyticsApi, authApi, notificationsApi, tasksApi } from './lib/api.js';

const navItems = [
  { id: 'command', icon: LayoutDashboard, label: 'Overview' },
  { id: 'tasks', icon: Check, label: 'Tasks' },
  { id: 'coach', icon: Bot, label: 'AI Coach' },
  { id: 'analytics', icon: BarChart3, label: 'Analytics' },
  { id: 'alarms', icon: BellRing, label: 'Alarms' }
];

const emptySummary = {
  totalTasks: 0,
  completedTasks: 0,
  missedTasks: 0,
  snoozedTasks: 0,
  pendingTasks: 0,
  disciplineScore: 0,
  lazinessScore: 0,
  consistencyPercentage: 0,
  longestStreak: 0,
  insights: []
};

export function App() {
  const [session, setSession] = useState({ user: null, token: localStorage.getItem('disciplineos_token') });
  const [booting, setBooting] = useState(true);
  const [activePage, setActivePage] = useState('command');
  const [state, setState] = useState({
    tasks: [],
    activities: [],
    personalities: [],
    notifications: [],
    summary: emptySummary,
    weekly: [],
    heatmap: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [alarmTask, setAlarmTask] = useState(null);

  const logout = useCallback(() => {
    localStorage.removeItem('disciplineos_token');
    setSession({ user: null, token: null });
    setState({ tasks: [], activities: [], personalities: [], notifications: [], summary: emptySummary, weekly: [], heatmap: [] });
  }, []);

  const loadAppData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [tasks, activities, personalities, notifications, summary, weekly, heatmap] = await Promise.all([
        tasksApi.list(),
        activitiesApi.list(),
        aiApi.personalities(),
        notificationsApi.list(),
        analyticsApi.summary(),
        analyticsApi.weekly(),
        analyticsApi.heatmap()
      ]);
      setState({ tasks, activities, personalities, notifications, summary, weekly, heatmap });
    } catch (err) {
      setError(err.message);
      if (err.message.toLowerCase().includes('authorization') || err.message.toLowerCase().includes('session')) logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    async function restoreSession() {
      if (!session.token) {
        setBooting(false);
        return;
      }
      try {
        const { user } = await authApi.me();
        setSession((current) => ({ ...current, user }));
        await loadAppData();
      } catch {
        logout();
      } finally {
        setBooting(false);
      }
    }
    restoreSession();
  }, [loadAppData, logout, session.token]);

  async function runMutation(action) {
    setError('');
    try {
      await action();
      await loadAppData();
    } catch (err) {
      setError(err.message);
    }
  }

  if (booting) return <ScreenMessage title="Loading DisciplineOS" body="Restoring your secure session." />;
  if (!session.user) return <AuthScreen onSession={(nextSession) => setSession(nextSession)} />;

  const actions = {
    refresh: loadAppData,
    createTask: (payload) => runMutation(() => tasksApi.create(payload)),
    updateTask: (id, payload) => runMutation(() => tasksApi.update(id, payload)),
    deleteTask: (id) => runMutation(() => tasksApi.remove(id)),
    completeTask: (id) => runMutation(() => tasksApi.complete(id)),
    markMissed: (id) => runMutation(() => tasksApi.missed(id)),
    snoozeTask: (id) => runMutation(() => tasksApi.snooze(id)),
    createActivity: (payload) => runMutation(() => activitiesApi.create(payload)),
    updateActivity: (id, payload) => runMutation(() => activitiesApi.update(id, payload)),
    deleteActivity: (id) => runMutation(() => activitiesApi.remove(id)),
    createPersonality: (payload) => runMutation(() => aiApi.createPersonality(payload)),
    updatePersonality: (id, payload) => runMutation(() => aiApi.updatePersonality(id, payload)),
    deletePersonality: (id) => runMutation(() => aiApi.deletePersonality(id)),
    scheduleNotification: (payload) => runMutation(() => notificationsApi.schedule(payload)),
    processDueNotifications: () => runMutation(() => notificationsApi.processDue()),
    deleteNotification: (id) => runMutation(() => notificationsApi.remove(id)),
    snoozeNotification: (id) => runMutation(() => notificationsApi.snooze(id)),
    acknowledgeNotification: (id) => runMutation(() => notificationsApi.acknowledge(id))
  };

  return (
    <main className="min-h-screen bg-[#000] text-[#ededed]">
      <div className="min-h-screen lg:pl-64">
        <Sidebar activePage={activePage} onNavigate={setActivePage} user={session.user} onLogout={logout} />
        <section className="min-w-0 flex-1">
          <TopBar activePage={activePage} loading={loading} onRefresh={loadAppData} onLogout={logout} />
          <div className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-6">
            {error && <Alert>{error}</Alert>}
            {activePage === 'command' && <OverviewPage data={state} actions={actions} onAlarm={setAlarmTask} />}
            {activePage === 'tasks' && <TasksPage tasks={state.tasks} actions={actions} />}
            {activePage === 'coach' && <CoachPage tasks={state.tasks} personalities={state.personalities} actions={actions} />}
            {activePage === 'analytics' && <AnalyticsPage summary={state.summary} weekly={state.weekly} heatmap={state.heatmap} />}
            {activePage === 'alarms' && <AlarmsPage tasks={state.tasks} notifications={state.notifications} actions={actions} onAlarm={setAlarmTask} />}
          </div>
        </section>
      </div>
      <MobileNav activePage={activePage} onNavigate={setActivePage} />
      {alarmTask && <AlarmOverlay task={alarmTask} onClose={() => setAlarmTask(null)} onComplete={() => actions.completeTask(alarmTask._id).then(() => setAlarmTask(null))} />}
    </main>
  );
}

function AuthScreen({ onSession }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        email: form.email.trim(),
        password: form.password
      };
      const response = mode === 'login'
        ? await authApi.login(payload)
        : await authApi.signup({ ...payload, name: form.name.trim() });
      localStorage.setItem('disciplineos_token', response.token);
      onSession({ user: response.user, token: response.token });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-black px-4 text-white">
      <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-[#1d1d1d] bg-[#050505] p-6">
        <div className="mb-6 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-md border border-[#2a2a2a]"><Shield className="h-4 w-4" /></div>
          <div>
            <h1 className="font-semibold">DisciplineOS</h1>
            <p className="text-sm text-[#858585]">Secure accountability console</p>
          </div>
        </div>
        {error && <Alert>{error}</Alert>}
        <div className="mb-4 grid grid-cols-2 rounded-md border border-[#2a2a2a] p-1">
          {['login', 'signup'].map((item) => (
            <button key={item} type="button" onClick={() => setMode(item)} className={`rounded px-3 py-2 text-sm ${mode === item ? 'bg-white text-black' : 'text-[#a1a1a1]'}`}>
              {item === 'login' ? 'Login' : 'Signup'}
            </button>
          ))}
        </div>
        {mode === 'signup' && <Field label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} minLength={2} required />}
        <Field label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} required />
        <Field label="Password" type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} minLength={mode === 'signup' ? 8 : undefined} required />
        <button disabled={loading} className="mt-4 h-10 w-full rounded-md bg-white text-sm font-medium text-black disabled:opacity-50">
          {loading ? 'Working...' : mode === 'login' ? 'Login' : 'Create account'}
        </button>
      </form>
    </main>
  );
}

function Sidebar({ activePage, onNavigate, user, onLogout }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-[#1d1d1d] bg-[#050505] lg:flex">
      <div className="border-b border-[#1d1d1d] px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md border border-[#2a2a2a] bg-[#0a0a0a]"><Shield className="h-4 w-4" /></div>
          <div>
            <h1 className="text-sm font-semibold">DisciplineOS</h1>
            <p className="text-xs text-[#858585]">{user.email}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => (
          <button key={item.id} onClick={() => onNavigate(item.id)} className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition ${activePage === item.id ? 'bg-[#161616] text-white' : 'text-[#a1a1a1] hover:bg-[#111] hover:text-white'}`}>
            <span className="flex items-center gap-2"><item.icon className="h-4 w-4" />{item.label}</span>
            {activePage === item.id && <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ))}
      </nav>
      <div className="border-t border-[#1d1d1d] p-3">
        <button onClick={onLogout} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-[#a1a1a1] hover:bg-[#111]"><LogOut className="h-4 w-4" />Logout</button>
      </div>
    </aside>
  );
}

function MobileNav({ activePage, onNavigate }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#1d1d1d] bg-black/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] font-medium transition ${isActive ? 'bg-white text-black' : 'text-[#a1a1a1] hover:bg-[#111] hover:text-white'}`}
            >
              <Icon className="h-4 w-4" />
              <span className="max-w-full truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function TopBar({ activePage, loading, onRefresh, onLogout }) {
  const page = navItems.find((item) => item.id === activePage);
  return (
    <header className="sticky top-0 z-20 border-b border-[#1d1d1d] bg-black/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="text-xs text-[#858585]">DisciplineOS / {page?.label}</p>
          <h2 className="text-xl font-semibold tracking-normal">{page?.label}</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden h-9 items-center gap-2 rounded-md border border-[#2a2a2a] bg-[#0a0a0a] px-3 text-sm text-[#858585] md:flex"><Search className="h-4 w-4" />API connected</div>
          <button onClick={onRefresh} disabled={loading} className="h-9 rounded-md border border-[#2a2a2a] px-3 text-sm text-[#d4d4d4] disabled:opacity-50">{loading ? 'Refreshing...' : 'Refresh'}</button>
          <button onClick={onLogout} className="grid h-9 w-9 place-items-center rounded-md border border-[#2a2a2a] text-[#d4d4d4] hover:bg-[#111] lg:hidden" aria-label="Logout">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

function OverviewPage({ data, actions, onAlarm }) {
  return (
    <div className="space-y-6">
      <Hero summary={data.summary} />
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Panel title="Active Commitments" action={`${data.tasks.length} tasks`}>
          <TaskTable tasks={data.tasks.slice(0, 6)} actions={actions} onAlarm={onAlarm} compact />
        </Panel>
        <Panel title="AI Insights" action="Mongo context">
          {data.summary.insights?.length ? data.summary.insights.map((insight) => <MetricRow key={insight} label="Insight" value={insight} />) : <EmptyState text="No insights yet. Complete or miss tasks to build behavioral context." />}
        </Panel>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <WeeklyChart data={data.weekly} />
        <ActivityFeed activities={data.activities} />
      </div>
    </div>
  );
}

function Hero({ summary }) {
  const cards = [
    { label: 'Discipline', value: summary.disciplineScore, icon: Zap },
    { label: 'Consistency', value: `${summary.consistencyPercentage}%`, icon: Activity },
    { label: 'Missed', value: summary.missedTasks, icon: AlarmClock },
    { label: 'Laziness', value: summary.lazinessScore, icon: Radio }
  ];

  return (
    <div className="rounded-lg border border-[#1d1d1d] bg-[#050505]">
      <div className="border-b border-[#1d1d1d] p-5">
        <p className="text-sm text-[#858585]">MongoDB-backed execution environment</p>
        <h3 className="mt-1 text-2xl font-semibold">{summary.totalTasks ? 'Your execution system is live.' : 'Create your first commitment.'}</h3>
      </div>
      <div className="grid divide-y divide-[#1d1d1d] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
        {cards.map((card) => <div key={card.label} className="p-5"><div className="mb-4 flex items-center justify-between text-[#858585]"><span className="text-sm">{card.label}</span><card.icon className="h-4 w-4" /></div><p className="text-3xl font-semibold">{card.value}</p></div>)}
      </div>
    </div>
  );
}

function TasksPage({ tasks, actions }) {
  const [draft, setDraft] = useState({ title: '', description: '', category: 'Focus', reminderTime: '', priority: 'high', repeatPattern: 'none', aiStrictness: 7 });
  const submitTask = (event) => {
    event.preventDefault();
    if (!draft.title.trim()) return;
    actions.createTask({ ...draft, reminderTime: draft.reminderTime ? new Date(draft.reminderTime).toISOString() : undefined });
    setDraft({ title: '', description: '', category: 'Focus', reminderTime: '', priority: 'high', repeatPattern: 'none', aiStrictness: 7 });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <Panel title="Create Commitment" action="POST /tasks">
        <form onSubmit={submitTask} className="space-y-3">
          <Field label="Title" value={draft.title} onChange={(value) => setDraft({ ...draft, title: value })} required />
          <Field label="Description" value={draft.description} onChange={(value) => setDraft({ ...draft, description: value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Category" value={draft.category} onChange={(value) => setDraft({ ...draft, category: value })} />
            <Field label="Reminder" type="datetime-local" value={draft.reminderTime} onChange={(value) => setDraft({ ...draft, reminderTime: value })} />
            <Select label="Priority" value={draft.priority} onChange={(value) => setDraft({ ...draft, priority: value })} options={['low', 'medium', 'high', 'critical']} />
            <Select label="Repeat" value={draft.repeatPattern} onChange={(value) => setDraft({ ...draft, repeatPattern: value })} options={['none', 'daily', 'weekdays', 'weekly', 'monthly', 'custom']} />
          </div>
          <button className="inline-flex h-10 items-center gap-2 rounded-md bg-white px-4 text-sm font-medium text-black hover:bg-[#eaeaea]"><Plus className="h-4 w-4" />Add Task</button>
        </form>
      </Panel>
      <Panel title="Task Registry" action={`${tasks.length} records`}>
        <TaskTable tasks={tasks} actions={actions} />
      </Panel>
    </div>
  );
}

function CoachPage({ tasks, personalities, actions }) {
  const [taskId, setTaskId] = useState('');
  const [personalityId, setPersonalityId] = useState('');
  const [message, setMessage] = useState('');
  const [draft, setDraft] = useState({ name: '', tone: '', speakingStyle: '', motivationalStyle: '', aggressionLevel: 5, voiceType: 'balanced' });
  const selectedPersonality = personalities.find((item) => String(item._id || item.name) === personalityId);

  async function generateCoach() {
    const response = await aiApi.coach({ taskId: taskId || undefined, personality: selectedPersonality });
    setMessage(response.text);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
      <Panel title="AI Accountability Session" action="Gemini">
        <div className="space-y-3">
          <Select label="Task context" value={taskId} onChange={setTaskId} options={['', ...tasks.map((task) => task._id)]} labels={{ '': 'No task selected', ...Object.fromEntries(tasks.map((task) => [task._id, task.title])) }} />
          <Select label="Personality" value={personalityId} onChange={setPersonalityId} options={['', ...personalities.map((item) => String(item._id || item.name))]} labels={{ '': 'Default coach', ...Object.fromEntries(personalities.map((item) => [String(item._id || item.name), item.name])) }} />
          <button onClick={generateCoach} className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black">Generate Coaching</button>
          <div className="min-h-28 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] p-5 text-sm leading-6 text-[#d4d4d4]">{message || 'Generate a real AI coaching response from your task and behavior history.'}</div>
        </div>
      </Panel>
      <Panel title="Personality CRUD" action="MongoDB">
        <form onSubmit={(event) => { event.preventDefault(); actions.createPersonality(draft); setDraft({ name: '', tone: '', speakingStyle: '', motivationalStyle: '', aggressionLevel: 5, voiceType: 'balanced' }); }} className="mb-5 space-y-3">
          <Field label="Name" value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} required />
          <Field label="Tone" value={draft.tone} onChange={(value) => setDraft({ ...draft, tone: value })} required />
          <Field label="Speaking style" value={draft.speakingStyle} onChange={(value) => setDraft({ ...draft, speakingStyle: value })} required />
          <Field label="Motivational style" value={draft.motivationalStyle} onChange={(value) => setDraft({ ...draft, motivationalStyle: value })} required />
          <button className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black">Save Personality</button>
        </form>
        <div className="space-y-2">{personalities.map((item) => <div key={item._id || item.name} className="flex items-center justify-between rounded-md border border-[#1d1d1d] p-3"><span>{item.name}</span>{!item.isDefault && <button onClick={() => actions.deletePersonality(item._id)} className="text-[#fca5a5]"><Trash2 className="h-4 w-4" /></button>}</div>)}</div>
      </Panel>
    </div>
  );
}

function AnalyticsPage({ summary, weekly, heatmap }) {
  return (
    <div className="space-y-6">
      <Hero summary={summary} />
      <div className="grid gap-6 lg:grid-cols-2">
        <WeeklyChart data={weekly} />
        <Panel title="Discipline Trend" action="7 days">
          <div className="h-72"><ResponsiveContainer width="100%" height="100%"><AreaChart data={weekly}><XAxis dataKey="day" stroke="#666" tickLine={false} axisLine={false} /><YAxis stroke="#666" tickLine={false} axisLine={false} /><Tooltip contentStyle={tooltipStyle} /><Area type="monotone" dataKey="score" stroke="#fff" fill="rgba(255,255,255,0.16)" /></AreaChart></ResponsiveContainer></div>
        </Panel>
      </div>
      <ExecutionHeatmap values={heatmap} />
    </div>
  );
}

function AlarmsPage({ tasks, notifications, actions, onAlarm }) {
  const [draft, setDraft] = useState({ taskId: '', scheduledFor: '' });
  const submit = (event) => {
    event.preventDefault();
    if (!draft.scheduledFor) return;
    actions.scheduleNotification({ taskId: draft.taskId || undefined, scheduledFor: new Date(draft.scheduledFor).toISOString(), channel: 'local' });
    setDraft({ taskId: '', scheduledFor: '' });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
      <Panel title="Schedule Reminder" action="POST /notifications/schedule">
        <form onSubmit={submit} className="space-y-3">
          <Select label="Task" value={draft.taskId} onChange={(value) => setDraft({ ...draft, taskId: value })} options={['', ...tasks.map((task) => task._id)]} labels={{ '': 'No task selected', ...Object.fromEntries(tasks.map((task) => [task._id, task.title])) }} />
          <Field label="Scheduled for" type="datetime-local" value={draft.scheduledFor} onChange={(value) => setDraft({ ...draft, scheduledFor: value })} required />
          <button className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black">Schedule</button>
        </form>
      </Panel>
      <Panel title="Reminder Queue" action={`${notifications.length} reminders`}>
        <div className="mb-4 flex justify-end">
          <button onClick={actions.processDueNotifications} className="rounded-md border border-[#2a2a2a] px-3 py-2 text-sm text-[#d4d4d4] hover:bg-[#111]">Process Due Now</button>
        </div>
        <div className="divide-y divide-[#1d1d1d]">
          {notifications.length ? notifications.map((notification) => {
            const task = tasks.find((item) => item._id === notification.taskId);
            return (
              <div key={notification._id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-start gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-[#2a2a2a]"><Clock className="h-4 w-4" /></div><div className="min-w-0"><p className="font-medium">{task?.title || 'General reminder'}</p><p className="text-sm text-[#858585]">{formatDate(notification.scheduledFor)} · {notification.status}</p>{notification.aiMessage && <p className="mt-2 max-w-2xl text-sm leading-6 text-[#d4d4d4]">{notification.aiMessage}</p>}{notification.voiceCacheUrl && <a className="mt-2 inline-block text-sm text-white underline" href={notification.voiceCacheUrl} target="_blank" rel="noreferrer">Play generated voice</a>}{notification.lastError && <p className="mt-2 text-sm text-red-300">{notification.lastError}</p>}</div></div>
                <div className="flex gap-2"><button onClick={() => actions.snoozeNotification(notification._id)} className="rounded-md border border-[#2a2a2a] px-3 py-2 text-sm">Snooze</button><button onClick={() => actions.deleteNotification(notification._id)} className="rounded-md border border-[#2a2a2a] px-3 py-2 text-sm text-[#fca5a5]">Delete</button><button onClick={() => onAlarm(task || null)} className="rounded-md bg-white px-3 py-2 text-sm font-medium text-black">Preview</button></div>
              </div>
            );
          }) : <EmptyState text="No reminders scheduled." />}
        </div>
      </Panel>
    </div>
  );
}

function TaskTable({ tasks, actions, onAlarm, compact = false }) {
  if (!tasks.length) return <EmptyState text="No tasks found. Create a commitment to begin collecting real analytics." />;
  return (
    <div className="overflow-hidden rounded-md border border-[#1d1d1d]">
      {tasks.map((task) => (
        <div key={task._id} className="grid gap-3 border-b border-[#1d1d1d] bg-black p-4 last:border-b-0 md:grid-cols-[1fr_auto] md:items-center">
          <div><div className="flex flex-wrap items-center gap-2"><CircleDot className={`h-3.5 w-3.5 ${task.completionStatus === 'completed' ? 'text-emerald-400' : task.completionStatus === 'missed' ? 'text-red-400' : 'text-[#858585]'}`} /><p className="font-medium">{task.title}</p><Badge>{task.priority}</Badge><Badge>{task.category}</Badge></div><p className="mt-1 text-sm text-[#858585]">{task.description || 'No description'}</p>{!compact && <p className="mt-2 text-xs text-[#666]">Reminder {formatDate(task.reminderTime)} · Streak {task.streakCount}d · Strictness {task.aiStrictness}/10</p>}</div>
          <div className="flex flex-wrap gap-2"><button onClick={() => actions.completeTask(task._id)} className="rounded-md border border-[#2a2a2a] px-3 py-2 text-sm">Complete</button>{!compact && <button onClick={() => actions.markMissed(task._id)} className="rounded-md border border-[#2a2a2a] px-3 py-2 text-sm">Missed</button>}{!compact && <button onClick={() => actions.snoozeTask(task._id)} className="rounded-md border border-[#2a2a2a] px-3 py-2 text-sm">Snooze</button>}{onAlarm && <button onClick={() => onAlarm(task)} className="rounded-md border border-[#2a2a2a] px-3 py-2 text-sm">Alarm</button>}{!compact && <button onClick={() => actions.deleteTask(task._id)} className="rounded-md border border-[#2a2a2a] px-3 py-2 text-sm text-[#fca5a5]"><Trash2 className="h-4 w-4" /></button>}</div>
        </div>
      ))}
    </div>
  );
}

function WeeklyChart({ data }) {
  return <Panel title="Weekly Performance" action="Activities"><div className="h-72">{data.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={data}><XAxis dataKey="day" stroke="#666" tickLine={false} axisLine={false} /><YAxis stroke="#666" tickLine={false} axisLine={false} /><Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={tooltipStyle} /><Bar dataKey="completed" fill="#fff" radius={[4, 4, 0, 0]} /><Bar dataKey="missed" fill="#555" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer> : <EmptyState text="No weekly activity yet." />}</div></Panel>;
}

function ActivityFeed({ activities }) {
  return <Panel title="Recent Activity" action={`${activities.length} events`}><div className="space-y-3">{activities.length ? activities.slice(0, 8).map((activity) => <div key={activity._id} className="flex items-center justify-between rounded-md border border-[#1d1d1d] p-3"><span className="text-sm">{activity.taskId?.title || activity.type}</span><span className="flex items-center gap-1 text-sm text-[#858585]"><Flame className="h-4 w-4" />{formatDate(activity.occurredAt)}</span></div>) : <EmptyState text="No activity history yet." />}</div></Panel>;
}

function ExecutionHeatmap({ values }) {
  const days = useMemo(() => buildHeatmapDays(values), [values]);
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const activeDays = days.filter((day) => day.count > 0).length;
  const bestDay = days.reduce((best, day) => (day.count > best.count ? day : best), days[0]);
  const weeks = [];

  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }

  return (
    <Panel title="Execution Heatmap" action="Last 90 days">
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <HeatmapStat label="Completions" value={total} />
        <HeatmapStat label="Active days" value={activeDays} />
        <HeatmapStat label="Best day" value={bestDay?.count ? `${bestDay.count} done` : 'None yet'} />
      </div>
      <div className="overflow-x-auto rounded-lg border border-[#1d1d1d] bg-black p-4">
        <div className="grid min-w-[720px] grid-cols-[32px_1fr] gap-3">
          <div className="grid grid-rows-7 gap-1 pt-6 text-[11px] text-[#666]">
            {['M', '', 'W', '', 'F', '', 'S'].map((label, index) => <span key={index} className="h-3.5 leading-none">{label}</span>)}
          </div>
          <div>
            <div className="mb-2 grid grid-flow-col auto-cols-[14px] gap-1 text-[11px] text-[#666]">
              {weeks.map((week, index) => <span key={index}>{index % 4 === 0 ? formatMonth(week[0]?.date) : ''}</span>)}
            </div>
            <div className="grid grid-flow-col auto-cols-[14px] gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-rows-7 gap-1">
                  {week.map((day) => (
                    <div
                      key={day.date}
                      title={`${formatShortDate(day.date)}: ${day.count} completions`}
                      className={`h-3.5 w-3.5 rounded-[3px] border ${heatmapTone(day.count)}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#858585]">
        <span>{values.length ? 'Generated from completed task activity records.' : 'No completed task activity yet.'}</span>
        <div className="flex items-center gap-2">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => <span key={level} className={`h-3 w-3 rounded-[3px] border ${heatmapTone(level)}`} />)}
          <span>More</span>
        </div>
      </div>
    </Panel>
  );
}

function HeatmapStat({ label, value }) {
  return (
    <div className="rounded-md border border-[#1d1d1d] bg-black p-3">
      <p className="text-xs text-[#858585]">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function Panel({ title, action, children }) {
  return <section className="rounded-lg border border-[#1d1d1d] bg-[#050505]"><div className="flex items-center justify-between border-b border-[#1d1d1d] px-5 py-4"><h3 className="font-semibold">{title}</h3><span className="text-sm text-[#858585]">{action}</span></div><div className="p-5">{children}</div></section>;
}

function Field({ label, value, onChange, type = 'text', required = false, minLength }) {
  return <label className="block text-sm"><span className="mb-1 block text-[#858585]">{label}</span><input required={required} minLength={minLength} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-md border border-[#2a2a2a] bg-black px-3 text-white outline-none focus:border-white/50" /></label>;
}

function Select({ label, value, onChange, options, labels = {} }) {
  return <label className="block text-sm"><span className="mb-1 block text-[#858585]">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-md border border-[#2a2a2a] bg-black px-3 text-white outline-none focus:border-white/50">{options.map((option) => <option key={option} value={option}>{labels[option] || option}</option>)}</select></label>;
}

function Badge({ children }) {
  return <span className="rounded-full border border-[#2a2a2a] px-2 py-0.5 text-xs text-[#a1a1a1]">{children}</span>;
}

function MetricRow({ label, value }) {
  return <div className="flex items-center justify-between gap-4 border-b border-[#1d1d1d] py-3 last:border-b-0"><span className="text-sm text-[#858585]">{label}</span><span className="text-right text-sm text-[#ededed]">{value}</span></div>;
}

function Alert({ children }) {
  return <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{children}</div>;
}

function EmptyState({ text }) {
  return <div className="rounded-md border border-dashed border-[#2a2a2a] p-6 text-center text-sm text-[#858585]">{text}</div>;
}

function ScreenMessage({ title, body }) {
  return <main className="grid min-h-screen place-items-center bg-black px-4 text-white"><div className="rounded-lg border border-[#1d1d1d] bg-[#050505] p-6 text-center"><h1 className="font-semibold">{title}</h1><p className="mt-2 text-sm text-[#858585]">{body}</p></div></main>;
}

function AlarmOverlay({ task, onClose, onComplete }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-5 backdrop-blur"><div className="w-full max-w-lg rounded-lg border border-[#2a2a2a] bg-[#050505] p-6 text-center shadow-2xl"><p className="text-sm text-[#858585]">Fullscreen Alarm Preview</p><div className="mx-auto my-6 grid h-36 w-36 place-items-center rounded-full border border-[#2a2a2a] bg-[#0a0a0a]"><span className="text-4xl font-semibold">{task?.reminderTime ? new Date(task.reminderTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span></div><h2 className="text-2xl font-semibold">{task?.title || 'Reminder'}</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#a1a1a1]">This is a UI preview. Delivery is persisted through the notification API and should be completed by native push/local scheduling on mobile.</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><button onClick={onClose} className="rounded-md border border-[#2a2a2a] px-4 py-3 font-medium hover:bg-[#111]">Close</button>{task && <button onClick={onComplete} className="rounded-md bg-white px-4 py-3 font-medium text-black hover:bg-[#eaeaea]">Complete</button>}</div></div></div>;
}

function formatDate(value) {
  if (!value) return 'Not scheduled';
  return new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

function buildHeatmapDays(values) {
  const counts = new Map(values.map((item) => [item.date, item.count]));
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - 89);

  const first = new Date(start);
  const offset = (first.getDay() + 6) % 7;
  first.setDate(first.getDate() - offset);

  const days = [];
  for (let date = new Date(first); date <= end; date.setDate(date.getDate() + 1)) {
    const key = date.toISOString().slice(0, 10);
    days.push({ date: key, count: counts.get(key) || 0 });
  }
  return days;
}

function heatmapTone(count) {
  if (count >= 4) return 'border-white/20 bg-white';
  if (count === 3) return 'border-white/15 bg-[#a3a3a3]';
  if (count === 2) return 'border-white/10 bg-[#666]';
  if (count === 1) return 'border-white/10 bg-[#303030]';
  return 'border-[#222] bg-[#0d0d0d]';
}

function formatMonth(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString([], { month: 'short' });
}

function formatShortDate(value) {
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

const tooltipStyle = { background: '#050505', border: '1px solid #2a2a2a', borderRadius: 8, color: '#ededed' };
