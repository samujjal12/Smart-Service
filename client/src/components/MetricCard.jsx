import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

function AnimatedNumber({ value }) {
  const spring = useSpring(value, { stiffness: 80, damping: 18 });
  useEffect(() => { spring.set(value); }, [value, spring]);
  const display = useTransform(spring, v => Math.round(v).toLocaleString());

  return <motion.span>{display}</motion.span>;
}

export default function MetricCard({ title, value, subtitle, icon: Icon, colorClass }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-soft p-5 relative overflow-hidden flex flex-col justify-between h-full bg-white transition-shadow hover:shadow-md"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-semibold text-gray-500 tracking-wide">{title}</h3>
        <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10`}>
          <Icon className={`w-5 h-5 ${colorClass.replace('bg-', 'text-')}`} />
        </div>
      </div>
      
      <div>
        <div className="text-3xl font-bold text-gray-900 mb-1">
          <AnimatedNumber value={value} />
        </div>
        {subtitle && (
          <p className="text-xs text-gray-400 font-medium">
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  );
}
