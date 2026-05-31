// MindGuard — Service Worker mínimo
// Não faz cache offline (intencional: evita servir dados antigos do dashboard).
// Existe apenas para habilitar o prompt "Instalar app" no Chrome/Edge.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // Pass-through — sem cache.
});
