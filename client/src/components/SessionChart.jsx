/**
 * SessionChart.jsx
 * Bar chart showing per-session attendance using Recharts.
 */
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, CartesianGrid,
} from 'recharts';

const SESSION_COLORS = {
  session_1: '#a78bfa',
  session_2: '#38bdf8',
  session_3: '#34d399',
};

const SESSION_LABELS = {
  session_1: 'Session 1',
  session_2: 'Session 2',
  session_3: 'Session 3',
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="glass px-3 py-2 text-xs">
      <div className="font-semibold" style={{ color: d.fill }}>{SESSION_LABELS[d.payload.name]}</div>
      <div className="text-slate-300">{d.value} students</div>
    </div>
  );
};

export default function SessionChart({ sessionCounts }) {
  const data = Object.entries(sessionCounts).map(([name, value]) => ({ name, value }));

  return (
    <div className="glass glow-violet p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold tracking-widest uppercase text-slate-400">Session Attendance</span>
        <span className="text-lg">🎓</span>
      </div>

      <div className="flex gap-4 mb-1">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs">
            <span className="w-2 h-2 rounded-sm" style={{ background: SESSION_COLORS[d.name] }} />
            <span className="text-slate-400">{SESSION_LABELS[d.name]}</span>
            <span className="mono font-semibold" style={{ color: SESSION_COLORS[d.name] }}>{d.value}</span>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barSize={40} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Inter' }}
            tickFormatter={k => SESSION_LABELS[k]}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive>
            {data.map(entry => (
              <Cell key={entry.name} fill={SESSION_COLORS[entry.name]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
