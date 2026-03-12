/**
 * ActivityStats.jsx
 * Last 10 minutes activity window stats with a small line chart.
 */
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { useRef } from 'react';

function StatPill({ label, value, color }) {
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</span>
      <motion.span
        key={value}
        initial={{ scale: 1.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`mono text-2xl font-bold ${color}`}
      >
        {value}
      </motion.span>
    </div>
  );
}

export default function ActivityStats({ windowLogins, windowLogouts, windowEvents, history }) {
  return (
    <div className="glass glow-cyan p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold tracking-widest uppercase text-slate-400">Last 10 Min Window</span>
        <span className="text-base">⏱️</span>
      </div>

      <div className="flex gap-2">
        <StatPill label="Logins" value={windowLogins} color="text-emerald-400" />
        <div className="w-px bg-white/5" />
        <StatPill label="Logouts" value={windowLogouts} color="text-orange-400" />
        <div className="w-px bg-white/5" />
        <StatPill label="Events" value={windowEvents} color="text-violet-400" />
      </div>

      {history.length > 1 && (
        <ResponsiveContainer width="100%" height={80}>
          <LineChart data={history} margin={{ top: 4, right: 4, left: -32, bottom: 0 }}>
            <XAxis dataKey="t" hide />
            <YAxis hide />
            <Tooltip
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <div className="glass px-2 py-1 text-[10px] text-violet-300">
                    {payload[0].value} events
                  </div>
                ) : null
              }
            />
            <Line
              type="monotone"
              dataKey="events"
              stroke="#a78bfa"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
