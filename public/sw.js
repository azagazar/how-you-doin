// v3 — network-first for HTML, cache-first only for static assets (images/icons).
// Previous v1/v2 cached HTML pages which caused stale-chunk crashes after Vercel deploys.
const CACHE = 'hyd-v3'

// Pre-cache only stable static assets (icons, branding images)
const PRECACHE = [
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      c.addAll(PRECACHE.filter(url => {
        // Ignore precache failures so the SW installs even if assets are missing
        return true
      })).catch(() => {})
    )
  )
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  // Delete ALL old caches (hyd-v1, hyd-v2, …)
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return

  const url = new URL(e.request.url)

  // Never intercept API calls or Next.js JS/CSS chunks
  if (url.pathname.startsWith('/api/')) return
  if (url.pathname.startsWith('/_next/')) return

  // HTML navigation requests → always network-first so the app always gets
  // fresh HTML with correct chunk references after a Vercel deployment.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    )
    return
  }

  // Static assets (images, icons, fonts) → cache-first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached
      return fetch(e.request).then(res => {
        if (res.ok && url.origin === self.location.origin) {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(e.request, clone))
        }
        return res
      })
    })
  )
})
