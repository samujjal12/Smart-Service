import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function ActivityFeed({ activities = [] }) {
  return (
    <div className="card-soft bg-white p-5 flex flex-col h-full border border-gray-100">
      <h3 className="text-sm font-bold text-gray-800 tracking-wide mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        Recent Activity
      </h3>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3" style={{ maxHeight: '300px' }}>
        <AnimatePresence initial={false}>
          {activities.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No recent activity.</p>
          ) : (
            activities.map((act, i) => (
              <motion.div
                key={`${act.enrollmentId}-${act.date}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-50 bg-gray-50/50 hover:bg-white transition-colors"
              >
                {act.status === 'Present' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {act.enrollmentId} <span className="text-gray-400 font-normal">marked {act.status.toLowerCase()}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {act.subject} • {act.batch} • {act.date}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
