/* eslint-disable react-refresh/only-export-components */
import { createElement, forwardRef } from 'react'

// Drop-in replacement for the framer-motion subset this app uses.
// Renders plain DOM elements: entrance/exit animations become a single
// subtle CSS fade, infinite rotations become CSS spins, and value-driven
// props (e.g. progress bar width) are applied as inline styles with a
// CSS transition. Everything else is stripped.

const DROPPED_PROPS = [
  'initial', 'animate', 'exit', 'transition', 'variants',
  'whileHover', 'whileTap', 'whileInView', 'whileFocus', 'whileDrag',
  'layout', 'layoutId', 'viewport', 'drag', 'dragConstraints',
  'onAnimationComplete', 'onAnimationStart',
]

// Transform/keyframe values that only made sense to framer's animator
const TRANSFORM_KEYS = new Set(['x', 'y', 'scale', 'rotate', 'opacity'])

function buildComponent(tag) {
  const Component = forwardRef(function MotionShim(props, ref) {
    const rest = { ...props }
    const { animate, transition, className, style } = props
    for (const key of DROPPED_PROPS) delete rest[key]

    let cls = className
    let mergedStyle = style

    if (animate && typeof animate === 'object') {
      // Infinite rotation -> CSS spinner
      if (animate.rotate && transition?.repeat === Infinity) {
        cls = cls ? `${cls} animate-spin` : 'animate-spin'
      } else {
        // Apply concrete CSS values (width, height, etc.) so state-driven
        // animations like progress bars keep working
        const applied = {}
        for (const [key, value] of Object.entries(animate)) {
          if (!TRANSFORM_KEYS.has(key) && !Array.isArray(value)) {
            applied[key] = value
          }
        }
        if (Object.keys(applied).length) {
          mergedStyle = { transition: 'all 0.3s ease', ...applied, ...style }
        }
      }
    }

    rest.className = cls
    rest.style = mergedStyle
    rest.ref = ref
    return createElement(tag, rest)
  })
  Component.displayName = `motion.${tag}`
  return Component
}

const cache = {}

export const motion = new Proxy({}, {
  get(_, tag) {
    if (!cache[tag]) cache[tag] = buildComponent(tag)
    return cache[tag]
  },
})

export function AnimatePresence({ children }) {
  return children ?? null
}
