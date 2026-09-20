"use strict";

/**
 * DIÁRIO DE BORDO — script.js
 * ---------------------------------------------------------------
 * Conceitos aplicados neste arquivo:
 *  - Programação Orientada a Objetos (classes, encapsulamento, responsabilidade única)
 *  - Web APIs: localStorage, crypto.randomUUID, Intl.DateTimeFormat,
 *              Service Worker API, evento beforeinstallprompt, online/offline
 *  - Boas práticas de JS: 'use strict', const/let, template literals,
 *              delegação de eventos, funções puras para regras de negócio,
 *              tratamento de erros (try/catch) ao acessar storage.
 */

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
    if (window.crypto && "randomUUID" in window.crypto) {
      return window.crypto.randomUUID();
    }
    // fallback simples caso o navegador não suporte randomUUID
    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  /** Formata a data (yyyy-mm-dd) para exibição em pt-BR, ex.: "sáb, 19 set" */
  get formattedDate() {
    const [year, month, day] = this.date.split("-").map(Number);
    const localDate = new Date(year, month - 1, day);
    const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(localDate);
    const rest = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(localDate);
    return `${weekday.replace(".", "")}, ${rest.replace(".", "")}`;
  }
}

/* ========================= ARMAZENAMENTO ========================= */

/**
 * Encapsula toda a comunicação com o localStorage. Se um dia a app
 * precisar trocar de mecanismo de persistência (IndexedDB, backend
 * via fetch, etc.), só esta classe muda.
 */
class DiaryStorage {
  static STORAGE_KEY = "diario-de-bordo:entries";

  static getAll() {
    try {
      const raw = window.localStorage.getItem(DiaryStorage.STORAGE_KEY);
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
      window.localStorage.setItem(DiaryStorage.STORAGE_KEY, JSON.stringify(entries));
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
 * lista. É a única classe que conhece o DOM.
 */
class DiaryApp {
  constructor() {
    this.entries = [];

    // Referências ao DOM (cache dos elementos usados com frequência)
    this.form = document.getElementById("entryForm");
    this.titleInput = document.getElementById("title");
    this.dateInput = document.getElementById("date");
    this.descriptionInput = document.getElementById("description");
    this.formError = document.getElementById("formError");

    this.list = document.getElementById("entriesList");
    this.emptyState = document.getElementById("entriesEmpty");
    this.entriesSection = this.emptyState.closest(".entries");
    this.countLabel = document.getElementById("entriesCount");
    this.template = document.getElementById("entryTemplate");

    this.bindEvents();
    this.setDefaultDate();
    this.loadFromStorage();
  }

  /* -------------------- Ciclo de vida / inicialização -------------------- */

  setDefaultDate() {
    // Preenche o campo de data com o dia de hoje, no fuso local do usuário
    const today = new Date();
    const iso = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);
    this.dateInput.value = iso;
  }

  loadFromStorage() {
    this.entries = DiaryStorage.getAll();
    this.sortEntries();
    this.render();
  }

  bindEvents() {
    this.form.addEventListener("submit", (event) => this.handleSubmit(event));

    // Delegação de evento: um único listener na lista trata o clique
    // de exclusão de qualquer item, mesmo os criados depois.
    this.list.addEventListener("click", (event) => {
      const deleteButton = event.target.closest(".entry__delete");
      if (!deleteButton) return;
      const li = deleteButton.closest(".entry");
      this.handleDelete(li.dataset.id);
    });
  }

  /* ------------------------------ CRUD: Create ----------------------------- */

  handleSubmit(event) {
    event.preventDefault();
    this.hideError();

    const title = this.titleInput.value;
    const description = this.descriptionInput.value;
    const date = this.dateInput.value;

    const validationMessage = this.validate({ title, description, date });
    if (validationMessage) {
      this.showError(validationMessage);
      return;
    }

    const entry = new DiaryEntry({ title, description, date });
    this.entries.push(entry);
    this.sortEntries();
    this.persist();
    this.render();
    this.form.reset();
    this.setDefaultDate();
    this.titleInput.focus();
  }

  validate({ title, description, date }) {
    if (!title.trim() || !description.trim() || !date) {
      return "Preencha título, data e descrição antes de registrar.";
    }
    if (title.trim().length < 3) {
      return "O título precisa ter pelo menos 3 caracteres.";
    }
    return null;
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
    this.entries = this.entries.filter((entry) => entry.id !== id);
    this.persist();
    this.render();
  }

  /* ------------------------------ CRUD: Read/List --------------------------- */

  sortEntries() {
    // Mais recentes primeiro (por data e, em empate, por criação)
    this.entries.sort((a, b) => {
      if (a.date === b.date) return b.createdAt.localeCompare(a.createdAt);
      return b.date.localeCompare(a.date);
    });
  }

  render() {
    this.list.innerHTML = "";

    for (const entry of this.entries) {
      const node = this.template.content.cloneNode(true);
      const li = node.querySelector(".entry");
      li.dataset.id = entry.id;
      node.querySelector(".entry__date").textContent = entry.formattedDate;
      node.querySelector(".entry__title").textContent = entry.title;
      node.querySelector(".entry__description").textContent = entry.description;
      this.list.appendChild(node);
    }

    const isEmpty = this.entries.length === 0;
    this.entriesSection.classList.toggle("entries--is-empty", isEmpty);
    this.countLabel.textContent =
      this.entries.length === 1 ? "1 entrada" : `${this.entries.length} entradas`;
  }

  /* -------------------------------- Persistência ----------------------------- */

  persist() {
    DiaryStorage.saveAll(this.entries);
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

document.addEventListener("DOMContentLoaded", () => {
  new DiaryApp();
  new ConnectionIndicator();
  new InstallPrompt();
});

registerServiceWorker();
