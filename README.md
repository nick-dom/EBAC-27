# 📓 Diário de Bordo

[![CI](https://github.com/nick-dom/EBAC-27/actions/workflows/ci.yml/badge.svg)](https://github.com/nick-dom/EBAC-27/actions/workflows/ci.yml)
![PWA](https://img.shields.io/badge/PWA-ready-5A0FC8?logo=pwa&logoColor=white)
![No backend](https://img.shields.io/badge/backend-nenhum-lightgrey)

> Uma PWA simples e offline-first para registrar o que você fez durante o dia — sem servidor, sem banco de dados, sem conta.

O **Diário de Bordo** permite criar registros com título, data e descrição. Os dados ficam salvos direto no navegador (`localStorage`), a aplicação funciona sem conexão e pode ser instalada como um app nativo, no computador ou no celular.

---

## Sumário

- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Como executar](#como-executar)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Testes e qualidade](#testes-e-qualidade)
- [Testando a PWA](#testando-a-pwa)
- [Publicação](#publicação)
- [Privacidade](#privacidade)
- [Sobre o projeto](#sobre-o-projeto)

---

## Funcionalidades

* Criar, visualizar, editar e excluir registros
* Campos de título, data e descrição, com validação de entrada
* Contagem de palavras da descrição
* Copiar o conteúdo de um registro
* Baixar registros em `.txt`
* Indicador de status de conexão (online/offline)
* Notificações (toasts) de feedback para ações do usuário
* Prompt de instalação da PWA
* Funcionamento offline via Service Worker
* Armazenamento local no navegador, sem backend
* Interface responsiva, construída *mobile-first*

---

## Tecnologias

| Tecnologia     | Uso                                          |
| -------------- | --------------------------------------------- |
| HTML5          | Estrutura da aplicação                        |
| CSS3           | Estilos e responsividade (mobile-first)       |
| JavaScript     | Lógica da aplicação, organizada em classes    |
| PWA            | Manifest + Service Worker (instalação/offline)|
| LocalStorage   | Persistência dos registros no navegador       |
| Jest           | Testes unitários                              |
| ESLint         | Análise estática do código                    |
| html-validate  | Validação de HTML                             |
| Prettier       | Formatação de código                          |

O projeto foi feito **sem React, sem backend e sem build step** — apenas JavaScript puro.

---

## Como executar

Pré-requisito: [Node.js](https://nodejs.org/) instalado (para rodar o servidor local, os testes e o lint).

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/nick-dom/EBAC-27.git
cd EBAC-27
npm install
```

Inicie o servidor local:

```bash
npm run start
```

Abra no navegador o endereço mostrado no terminal, normalmente:

```text
http://localhost:3000
```

> [!IMPORTANT]
> O `service-worker.js` precisa ser executado via HTTP ou HTTPS. Abrir o `index.html` diretamente com `file://` não é suficiente para testar todas as funcionalidades da PWA.

---

## Estrutura do projeto

```text
EBAC-27/
│
├── index.html
├── style.css
├── script.js
├── manifest.json
├── service-worker.js
│
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── icon-maskable-512.png
│
├── tests/
│   └── diary.test.js
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── package.json
└── README.md
```

---

## Testes e qualidade

Executar os testes:

```bash
npm test
```

Executar em modo *watch*:

```bash
npm run test:watch
```

Executar o lint:

```bash
npm run lint
```

Formatar os arquivos:

```bash
npm run format
```

Os testes cobrem principalmente:

* validação das entradas do formulário;
* o modelo `DiaryEntry` (incluindo contagem de palavras);
* a persistência via `DiaryStorage` no `localStorage`.

Uma [GitHub Action](.github/workflows/ci.yml) executa lint e testes automaticamente a cada `push` e `pull request` para a branch `main`.

---

## Testando a PWA

### Offline

1. Execute o projeto com `npm run start`.
2. Abra o projeto no navegador.
3. Abra o DevTools.
4. Acesse a aba **Network**.
5. Ative o modo **Offline**.
6. Recarregue a página.

A aplicação deve continuar funcionando com os arquivos armazenados pelo service worker e com os registros já salvos, exibindo o indicador de status como offline.

### Instalação

No Chrome, a opção de instalação pode aparecer na barra de endereço ou através do prompt de instalação da própria aplicação.

Em dispositivos móveis compatíveis, também é possível instalar a aplicação na tela inicial.

### Lighthouse

Para verificar a PWA:

```text
DevTools → Lighthouse → Progressive Web App → Analyze
```

---

## Publicação

O projeto pode ser publicado com o **GitHub Pages**:

```text
Settings → Pages → Deploy from a branch → main
```

O GitHub Pages fornece HTTPS, o que é necessário para o service worker funcionar em produção.

---

## Privacidade

Os registros ficam armazenados **apenas no navegador**, via `localStorage`. O projeto não possui:

* Backend
* Banco de dados
* Analytics
* Conta de usuário
* Servidor para armazenar os registros

> [!WARNING]
> Se os dados do site forem apagados do navegador, os registros também poderão ser perdidos. Para informações importantes, é recomendável baixar uma cópia em `.txt`.

---

## Sobre o projeto

A ideia foi criar um diário simples que funcionasse diretamente no navegador, sem depender de uma estrutura externa. Por isso, o projeto usa **HTML, CSS e JavaScript puro**, junto com os recursos de PWA disponíveis nativamente no navegador (manifest + service worker).

A aplicação foi organizada em classes (`DiaryEntry`, `DiaryStorage`, `DiaryApp`, `EntryModal`, `ConnectionIndicator`, `Toast`, `InstallPrompt`) para separar responsabilidades, e o CSS segue uma abordagem **mobile-first**.

Projeto desenvolvido como parte do curso na **EBAC**.
