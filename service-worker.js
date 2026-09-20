/**
 * SERVICE WORKER — Diário de Bordo
 * ---------------------------------------------------------------
 * Estratégia: "cache-first com atualização em segundo plano" para os
 * arquivos do app shell (HTML, CSS, JS, manifest e ícones), garantindo
 * que a aplicação abra e funcione mesmo sem conexão. Os dados em si
 * (as entradas do diário) NÃO passam pelo service worker — eles vivem
 * no localStorage, que é local ao navegador e sobrevive offline por
 * natureza.
 *
 * Sempre que o conteúdo dos arquivos abaixo mudar, incremente o
 * CACHE_VERSION para que os usuários recebam a versão nova.
 */

const CACHE_VERSION = "v2"; // ícones atualizados — v1 tinha os ícones antigos em cache
const CACHE_NAME = `diario-de-bordo-${CACHE_VERSION}`;

// "App shell": o conjunto mínimo de arquivos para a interface funcionar.
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
];

/* --------------------------------- install -------------------------------- */
// Disparado quando o navegador instala este service worker por
// completo. Pré-carregamos o app shell no cache.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

/* --------------------------------- activate -------------------------------- */
// Remove caches de versões antigas quando uma nova versão assume.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("diario-de-bordo-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

/* ---------------------------------- fetch ---------------------------------- */
// Intercepta as requisições da página.
//  - Navegação (abrir/recarregar a página): cache-first, com fallback
//    para o index.html cacheado quando estiver offline.
//  - Outros arquivos do mesmo domínio (CSS, JS, ícones): cache-first,
//    atualizando o cache em segundo plano quando há rede.
//  - Requisições de outra origem (ex.: fontes do Google): deixamos
//    seguir para a rede normalmente; se falhar, apenas não bloqueia a app.
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (isSameOrigin) {
    event.respondWith(cacheFirstWithRevalidate(request));
  }
  // Requisições de outra origem (ex.: Google Fonts) não são interceptadas:
  // o navegador cuida delas com sua própria política de cache/HTTP.
});

async function handleNavigation(request) {
  try {
    const cached = await caches.match(request);
    const network = fetch(request)
      .then((response) => {
        updateCache(request, response.clone());
        return response;
      })
      .catch(() => null);

    return cached || (await network) || (await caches.match("./index.html"));
  } catch {
    return caches.match("./index.html");
  }
}

async function cacheFirstWithRevalidate(request) {
  const cached = await caches.match(request);
  if (cached) {
    // Atualiza o cache em segundo plano sem atrasar a resposta atual.
    fetch(request)
      .then((response) => updateCache(request, response))
      .catch(() => {});
    return cached;
  }

  try {
    const response = await fetch(request);
    updateCache(request, response.clone());
    return response;
  } catch {
    // Sem rede e sem item no cache: não há o que devolver.
    return Response.error();
  }
}

async function updateCache(request, response) {
  if (!response || !response.ok) return;
  const cache = await caches.open(CACHE_NAME);
  cache.put(request, response);
}
