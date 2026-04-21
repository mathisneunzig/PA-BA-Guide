'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Thin progress bar at the top of the page that shows during route changes.
 * No external dependencies — uses a CSS animation + state machine.
 */
export default function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [visible, setVisible] = useState(false)
  const [width, setWidth] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const incrementRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevRoute = useRef<string | null>(null)

  const route = pathname + searchParams.toString()

  useEffect(() => {
    if (prevRoute.current === null) {
      prevRoute.current = route
      return
    }
    if (prevRoute.current === route) return

    // Route changed → complete the bar
    setWidth(100)
    timerRef.current = setTimeout(() => {
      setVisible(false)
      setWidth(0)
    }, 400)
    prevRoute.current = route

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [route])

  // On link click / navigation start — detect via the loading state
  // We can't directly hook into router.push, so we track clicks on <a> tags
  useEffect(() => {
    function onLinkClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest('a')
      if (!target) return
      const href = target.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return
      // Same-page anchor or external → skip
      const url = new URL(href, window.location.href)
      if (url.origin !== window.location.origin) return
      if (url.pathname + url.search === route) return

      // Start progress bar
      setVisible(true)
      setWidth(20)
      let current = 20
      incrementRef.current = setInterval(() => {
        // Slow increments — never reaches 100 until navigation completes
        current += Math.random() * 8
        if (current > 85) current = 85
        setWidth(current)
      }, 300)
    }

    window.addEventListener('click', onLinkClick, { capture: true })
    return () => {
      window.removeEventListener('click', onLinkClick, { capture: true })
      if (incrementRef.current) clearInterval(incrementRef.current)
    }
  }, [route])

  if (!visible && width === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: 3,
        width: `${width}%`,
        backgroundColor: '#e65100',
        zIndex: 9999,
        transition: width === 100 ? 'width 0.2s ease-out' : 'width 0.3s ease',
        borderRadius: '0 2px 2px 0',
        boxShadow: '0 0 8px rgba(230, 81, 0, 0.6)',
        opacity: visible ? 1 : 0,
        pointerEvents: 'none',
      }}
    />
  )
}
