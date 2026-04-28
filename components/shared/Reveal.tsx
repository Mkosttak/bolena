'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

interface RevealProps {
  children: React.ReactNode
  delay?: number
  x?: number
  y?: number
  className?: string
}

export function Reveal({ children, delay = 0, x = 0, y = 24, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px 0px' })

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, x, y }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x, y }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  )
}
