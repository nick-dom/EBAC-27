"use strict";

/**
 * DIÁRIO DE BORDO — script.js
 * ---------------------------------------------------------------
 * Conceitos aplicados neste arquivo:
 *  - Programação Orientada a Objetos: classes com responsabilidade única
 *    e encapsulamento real via campos privados (#campo).
 *  - Lógica de programação: validação pura, ordenação, formatação de datas.
 *  - Web APIs: localStorage, crypto.randomUUID, Intl.DateTimeFormat,
 *              Service Worker API, <dialog> (HTMLDialogElement),
 *              Clipboard API, Blob + URL.createObjectURL (download),
 *              evento beforeinstallprompt, eventos online/offline.
 *  - Boas práticas de JS: 'use strict', const/let, template literals,
 *              delegação de eventos, funções puras, tratamento de erros.
 *  - Testabilidade: `validateEntry`, `DiaryEntry` e `DiaryStorage` são
 *    exportados no final do arquivo (guardado por `typeof module`) para
 *    serem cobertos por testes unitários com Jest, sem afetar o navegador.
 */

/* ============================ VALIDAÇÃO (função pura) ============================ */

/**
 * Função pura: não depende do DOM nem de estado externo, recebe dados e
 * devolve uma mensagem de erro (string) ou `null` quando está tudo certo.
 * Ser uma função pura é o que a torna fácil de testar isoladamente.
 */
function validateEntry({ title, description, date }) {
  if (!title?.trim() || !description?.trim() || !date) {
    return "Preencha título, data e descrição antes de registrar.";
  }
  if (title.trim().length < 3) {
    return "O título precisa ter pelo menos 3 caracteres.";
  }
  if (description.trim().length < 3) {
    return "A descrição precisa ter pelo menos 3 caracteres.";
  }
  return null;
}

/* ============================ MODELO ============================ */

/**
 * Representa uma entrada do diário. Mantemos o modelo isolado da
 * camada de armazenamento e da camada de interface (separação de
 * responsabilidades).
 */
class DiaryEntry {
  constructor({ title, description, date, id, createdAt }) {
    this.id = id ?? DiaryEntry.createId();
    this.title = title.trim();
    this.description = description.trim();
    this.date = date; // formato ISO (yyyy-mm-dd), vindo de <input type="date">
    this.createdAt = createdAt ?? new Date().toISOString();
  }

  static createId() {
    // crypto.randomUUID() é uma Web API nativa para gerar identificadores únicos
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    // fallback simples caso o ambiente não suporte randomUUID
    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  /** Formata a data (yyyy-mm-dd) para exibição curta em pt-BR, ex.: "sáb, 19 set" */
  get formattedDate() {
    return DiaryEntry.formatDate(this.date, { weekday: "short", day: "2-digit", month: "short" });
  }

  /** Formata a data por extenso, ex.: "sábado, 19 de setembro de 2026" */
  get formattedDateLong() {
    return DiaryEntry.formatDate(this.date, {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  /** Quantidade aproximada de palavras da descrição (útil para "tempo de leitura"). */
  get wordCount() {
    return this.description.split(/\s+/).filter(Boolean).length;
  }

  static formatDate(isoDate, options) {
    const [year, month, day] = isoDate.split("-").map(Number);
    const localDate = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat("pt-BR", options).format(localDate).replace(/\.(?=\s|$)/g, "");
  }
}

/* ========================= ARMAZENAMENTO ========================= */

/**
 * Encapsula toda a comunicação com o localStorage. Se um dia a app
 * precisar trocar de mecanismo de persistência (IndexedDB, backend
 * via fetch, etc.), só esta classe muda — o resto da aplicação não
 * precisa saber onde os dados realmente vivem.
 */
class DiaryStorage {
  static #STORAGE_KEY = "diario-de-bordo:entries";

  static getAll() {
    try {
      const raw = localStorage.getItem(DiaryStorage.#STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return parsed.map((item) => new DiaryEntry(item));
    } catch (error) {
      console.error("Não foi possível ler os registros salvos:", error);
      return [];
    }
  }

  static saveAll(entries) {
    try {
      localStorage.setItem(DiaryStorage.#STORAGE_KEY, JSON.stringify(entries));
      return true;
    } catch (error) {
      // Ex.: quota excedida ou modo privado sem suporte a storage
      console.error("Não foi possível salvar os registros:", error);
      return false;
    }
  }
}

/* ============================ APLICAÇÃO ============================ */

/**
 * Orquestra o estado da aplicação (a lista de entradas em memória),
 * a renderização na tela e a ligação dos eventos do formulário e da
 * lista. É a única classe que conhece o DOM da página principal.
 *
 * `#entries` é um campo privado: nenhum código fora desta classe pode
 * ler ou sobrescrever a lista diretamente, apenas através dos métodos
 * públicos (encapsulamento).
 */
class DiaryApp {
  #entries = [];

  constructor({ onOpenEntry } = {}) {
    this.onOpenEntry = onOpenEntry ?? (() => {});

    // Referências ao DOM (cache dos elementos usados com frequência)
    this.form = document.getElementById("entryForm");
    this.titleInput = document.getElementById("title");
    this.dateInput = document.getElementById("date");
    this.descriptionInput = document.getElementById("description");
    this.descCounter = document.getElementById("descCounter");
    this.formError = document.getElementById("formError");

    this.list = document.getElementById("entriesList");
    this.emptyState = document.getElementById("entriesEmpty");
    this.entriesSection = this.emptyState.closest(".entries");
    this.countLabel = document.getElementById("entriesCount");
    this.template = document.getElementById("entryTemplate");

    this.bindEvents();
    this.setDefaultDate();
    this.updateCounter();
    this.loadFromStorage();
  }

  /** Acesso somente-leitura às entradas (cópia rasa, protege o estado interno). */
  get entries() {
    return [...this.#entries];
  }

  get count() {
    return this.#entries.length;
  }

  /* -------------------- Ciclo de vida / inicialização -------------------- */

  setDefaultDate() {
    const today = new Date();
    const iso = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);
    this.dateInput.value = iso;
  }

  loadFromStorage() {
    this.#entries = DiaryStorage.getAll();
    this.sortEntries();
    this.render();
  }

  bindEvents() {
    this.form.addEventListener("submit", (event) => this.handleSubmit(event));
    this.descriptionInput.addEventListener("input", () => this.updateCounter());

    // Delegação de evento: um único listener na lista trata cliques em
    // qualquer item (abrir ou remover), mesmo os criados depois.
    this.list.addEventListener("click", (event) => {
      const deleteButton = event.target.closest(".entry__delete");
      const openButton = event.target.closest(".entry__open");
      const li = event.target.closest(".entry");
      if (!li) return;

      if (deleteButton) {
        this.handleDelete(li.dataset.id);
      } else if (openButton) {
        const entry = this.#entries.find((item) => item.id === li.dataset.id);
        if (entry) this.onOpenEntry(entry);
      }
    });
  }

  updateCounter() {
    const length = this.descriptionInput.value.length;
    const max = this.descriptionInput.maxLength;
    this.descCounter.textContent = `${length} / ${max}`;
  }

  /* ------------------------------ CRUD: Create ----------------------------- */

  handleSubmit(event) {
    event.preventDefault();
    this.hideError();

    const title = this.titleInput.value;
    const description = this.descriptionInput.value;
    const date = this.dateInput.value;

    const validationMessage = validateEntry({ title, description, date });
    if (validationMessage) {
      this.showError(validationMessage);
      return;
    }

    const entry = new DiaryEntry({ title, description, date });
    this.#entries.push(entry);
    this.sortEntries();
    this.persist();
    this.render();
    this.form.reset();
    this.setDefaultDate();
    this.updateCounter();
    this.titleInput.focus();
  }

  showError(message) {
    this.formError.textContent = message;
    this.formError.hidden = false;
  }

  hideError() {
    this.formError.hidden = true;
    this.formError.textContent = "";
  }

  /* ------------------------------ CRUD: Delete ----------------------------- */

  handleDelete(id) {
    this.#entries = this.#entries.filter((entry) => entry.id !== id);
    this.persist();
    this.render();
  }

  /* ------------------------------ CRUD: Read/List --------------------------- */

  sortEntries() {
    // Mais recentes primeiro (por data e, em empate, por criação)
    this.#entries.sort((a, b) => {
      if (a.date === b.date) return b.createdAt.localeCompare(a.createdAt);
      return b.date.localeCompare(a.date);
    });
  }

  render() {
    this.list.innerHTML = "";

    for (const entry of this.#entries) {
      const node = this.template.content.cloneNode(true);
      const li = node.querySelector(".entry");
      li.dataset.id = entry.id;
      node.querySelector(".entry__date").textContent = entry.formattedDate;
      node.querySelector(".entry__title").textContent = entry.title;
      node.querySelector(".entry__description").textContent = entry.description;
      node
        .querySelector(".entry__open")
        .setAttribute("aria-label", `Abrir registro completo: ${entry.title}`);
      this.list.appendChild(node);
    }

    const isEmpty = this.#entries.length === 0;
    this.entriesSection.classList.toggle("entries--is-empty", isEmpty);
    this.countLabel.textContent = this.count === 1 ? "1 entrada" : `${this.count} entradas`;
  }

  /* -------------------------------- Persistência ----------------------------- */

  persist() {
    DiaryStorage.saveAll(this.#entries);
  }
}

/* ============================ PÁGINA EXPANDIDA (MODAL) ============================ */

/**
 * Controla a "página aberta" do diário: um <dialog> nativo que mostra o
 * registro por completo (sem truncar), com ações extras — copiar o
 * texto e baixar a entrada como arquivo .txt — que vão além do CRUD
 * básico, aproveitando Web APIs do navegador.
 */
class EntryModal {
  constructor({ onDelete, onToast } = {}) {
    this.onDelete = onDelete ?? (() => {});
    this.onToast = onToast ?? (() => {});

    this.dialog = document.getElementById("entryModal");
    this.dateEl = document.getElementById("entryModalDate");
    this.titleEl = document.getElementById("entryModalTitle");
    this.descriptionEl = document.getElementById("entryModalDescription");
    this.metaEl = document.getElementById("entryModalMeta");
    this.copyBtn = document.getElementById("entryModalCopy");
    this.downloadBtn = document.getElementById("entryModalDownload");
    this.deleteBtn = document.getElementById("entryModalDelete");

    this.currentEntry = null;
    this.bindEvents();
  }

  bindEvents() {
    this.copyBtn.addEventListener("click", () => this.copyText());
    this.downloadBtn.addEventListener("click", () => this.downloadText());
    this.deleteBtn.addEventListener("click", () => this.deleteCurrent());

    // Fechar clicando no backdrop (fora do <form>)
    this.dialog.addEventListener("click", (event) => {
      if (event.target === this.dialog) this.dialog.close();
    });
  }

  open(entry) {
    this.currentEntry = entry;
    this.dateEl.textContent = entry.formattedDateLong;
    this.titleEl.textContent = entry.title;
    this.descriptionEl.textContent = entry.description;
    this.metaEl.textContent = `${entry.wordCount} ${entry.wordCount === 1 ? "palavra" : "palavras"}`;

    // showModal() é a Web API que abre o <dialog> em modo modal,
    // com foco preso e um ::backdrop semitransparente automático.
    if (typeof this.dialog.showModal === "function") {
      this.dialog.showModal();
    } else {
      this.dialog.setAttribute("open", "");
    }
  }

  deleteCurrent() {
    if (!this.currentEntry) return;
    this.onDelete(this.currentEntry.id);
    this.dialog.close();
    this.onToast("Entrada removida.");
  }

  async copyText() {
    if (!this.currentEntry) return;
    const text = this.toPlainText(this.currentEntry);
    try {
      await navigator.clipboard.writeText(text);
      this.onToast("Texto copiado.");
    } catch (error) {
      console.error("Não foi possível copiar automaticamente:", error);
      this.onToast("Não foi possível copiar. Selecione o texto manualmente.");
    }
  }

  downloadText() {
    if (!this.currentEntry) return;
    const text = this.toPlainText(this.currentEntry);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `diario-${this.currentEntry.date}-${this.slugify(this.currentEntry.title)}.txt`;
    link.click();

    URL.revokeObjectURL(url);
    this.onToast("Download iniciado.");
  }

  toPlainText(entry) {
    return `${entry.title}\n${entry.formattedDateLong}\n\n${entry.description}`;
  }

  slugify(text) {
    return (
      text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 40) || "entrada"
    );
  }
}

/* ============================ CONEXÃO ONLINE/OFFLINE ============================ */

/**
 * Atualiza um pequeno indicador na interface usando a Web API de
 * eventos de conectividade (online/offline) e navigator.onLine.
 */
class ConnectionIndicator {
  constructor() {
    this.wrapper = document.getElementById("connStatus");
    this.label = document.getElementById("connStatusText");
    window.addEventListener("online", () => this.update());
    window.addEventListener("offline", () => this.update());
    this.update();
  }

  update() {
    const isOnline = navigator.onLine;
    this.wrapper.dataset.online = String(isOnline);
    this.label.textContent = isOnline
      ? "Você está online"
      : "Sem conexão — os registros continuam salvos";
  }
}

/* ============================ TOAST (feedback rápido) ============================ */

class Toast {
  constructor() {
    this.el = document.getElementById("toast");
    this.timeoutId = null;
  }

  show(message, duration = 2400) {
    this.el.textContent = message;
    this.el.hidden = false;
    clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => {
      this.el.hidden = true;
    }, duration);
  }
}

/* ============================ INSTALAÇÃO (PWA) ============================ */

/**
 * Captura o evento beforeinstallprompt (disparado pelo navegador
 * quando os critérios de instalabilidade da PWA são atendidos) e
 * conecta-o a um botão próprio da interface, em vez de depender do
 * prompt automático do navegador.
 */
class InstallPrompt {
  constructor() {
    this.deferredEvent = null;
    this.button = document.getElementById("installBtn");

    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      this.deferredEvent = event;
      this.button.hidden = false;
    });

    this.button.addEventListener("click", () => this.promptInstall());

    window.addEventListener("appinstalled", () => {
      this.button.hidden = true;
      this.deferredEvent = null;
    });
  }

  async promptInstall() {
    if (!this.deferredEvent) return;
    this.deferredEvent.prompt();
    await this.deferredEvent.userChoice;
    this.deferredEvent = null;
    this.button.hidden = true;
  }
}

/* ============================ SERVICE WORKER ============================ */

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("service-worker.js")
      .then((registration) => {
        console.log("Service worker registrado:", registration.scope);
      })
      .catch((error) => {
        console.error("Falha ao registrar o service worker:", error);
      });
  });
}

/* ================================ BOOT ================================= */
// Só executa no navegador: quando este arquivo é importado pelo Jest
// (ambiente Node, sem DOM), `document` não existe e este bloco é ignorado,
// permitindo testar as classes/funções acima isoladamente.
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    const toast = new Toast();
    const modal = new EntryModal({
      onDelete: (id) => app.handleDelete(id),
      onToast: (message) => toast.show(message),
    });
    const app = new DiaryApp({
      onOpenEntry: (entry) => modal.open(entry),
    });
    new ConnectionIndicator();
    new InstallPrompt();
  });

  registerServiceWorker();
}

/* ============================ EXPORT PARA TESTES ============================ */
if (typeof module !== "undefined" && module.exports) {
  module.exports = { validateEntry, DiaryEntry, DiaryStorage };
}
