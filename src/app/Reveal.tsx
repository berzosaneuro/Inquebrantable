'use client'

import { useEffect } from 'react'

/** Scroll-reveal para .reveal. Robusto: usa el contenedor con scroll como root
    y revela todo pasado un tiempo aunque el observer no dispare. */
export default function Reveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.reveal'))
    if (els.length === 0) return

    const revealAll = () => els.forEach((el) => el.classList.add('in'))

    if (!('IntersectionObserver' in window)) {
      revealAll()
      return
    }

    const root = els[0].closest('.home, .plat') as HTMLElement | null
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        })
      },
      { root, threshold: 0.05, rootMargin: '0px 0px 10% 0px' },
    )
    els.forEach((el) => io.observe(el))

    // Fallback: nada debe quedarse invisible.
    const t = setTimeout(revealAll, 2500)

    return () => {
      io.disconnect()
      clearTimeout(t)
    }
  }, [])

  return null
}
