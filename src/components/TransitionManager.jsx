import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function getCognitiveLoadDetails(score) {
  if (score <= 33) {
    return {
      style: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      label: 'Optimal State',
      dotColor: 'bg-emerald-500',
    }
  }
  if (score <= 66) {
    return {
      style: 'bg-amber-50 text-amber-700 border-amber-200/80',
      label: 'Moderate Friction',
      dotColor: 'bg-amber-500',
    }
  }
  return {
    style: 'bg-rose-50 text-rose-700 border-rose-200 ring-2 ring-rose-100',
    label: 'High Friction Detected',
    dotColor: 'bg-rose-500 animate-ping',
  }
}

const pageTransitionVariants = {
  initial: { opacity: 0, y: 12, filter: 'blur(3px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit:    { opacity: 0, y: -12, filter: 'blur(3px)' },
}

export default function TransitionManager({ mode, children, cognitiveScore = 0, onModeChange }) {
  const details = getCognitiveLoadDetails(cognitiveScore)

  return (
    <div className="w-full relative">
      {/* ── Fixed Cognitive Load Score Indicator ── */}
      {cognitiveScore > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -10 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 rounded-full px-4 py-2 shadow-[0_4px_16px_rgba(0,0,0,0.06)] border text-xs font-medium backdrop-blur-md transition-colors ${details.style}`}
          title={`Cognitive Load: ${cognitiveScore}/100 - ${details.label}`}
          role="status"
          aria-live="polite"
        >
          <span className="relative flex h-2 w-2">
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${details.dotColor}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${details.dotColor.split(' ')[0]}`} />
          </span>
          <span className="font-semibold text-gray-900">{cognitiveScore}</span>
          <span className="text-[11px] opacity-75 border-l border-current/20 pl-2">
            {details.label}
          </span>
        </motion.div>
      )}

      {/* ── Animated Mode Transitions ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          variants={pageTransitionVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
