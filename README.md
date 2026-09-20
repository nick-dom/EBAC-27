# Diário de Bordo

> Uma PWA simples para registrar o que fiz durante o dia.

O **Diário de Bordo** permite criar registros com título, data e descrição.
Os dados ficam salvos no próprio navegador usando `localStorage`.

A aplicação funciona offline, pode ser instalada como PWA e não precisa de servidor ou banco de dados.

---

## Funcionalidades

* Criar registros
* Definir título, data e descrição
* Visualizar o conteúdo completo de cada registro
* Editar e excluir registros
* Copiar o conteúdo
* Baixar registros em `.txt`
* Funcionamento offline
* Instalação como PWA
* Armazenamento local no navegador
* Interface responsiva

---

## Tecnologias

| Tecnologia   | Uso                                |
| ------------ | ---------------------------------- |
| HTML5        | Estrutura da aplicação             |
| CSS3         | Estilos e responsividade           |
| JavaScript   | Lógica da aplicação                |
| PWA          | Instalação e funcionamento offline |
| LocalStorage | Armazenamento dos registros        |
| Jest         | Testes                             |
| ESLint       | Análise do código                  |
| Prettier     | Formatação                         |

O projeto foi feito sem React, backend ou build step, usando JavaScript puro.

---

## Como executar

Primeiro, instale as dependências:

```bash
npm install
```

Depois, inicie o servidor local:

```bash
npm run start
```

Abra no navegador o endereço mostrado no terminal, normalmente:

```text
http://localhost:3000
```

> [!IMPORTANT]
> O `service-worker.js` precisa ser executado através de HTTP ou HTTPS. Abrir o `index.html` diretamente com `file://` não é suficiente para testar todas as funcionalidades da PWA.

---

## Estrutura

```text
diario-de-bordo/
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
│   └── icon-maskable.png
│
├── tests/
│   └── diary.test.js
│
├── package.json
└── README.md
```

---

## Testes

Executar os testes:

```bash
npm test
```

Executar o lint:

```bash
npm run lint
```

Formatar os arquivos:

```bash
npm run format
```

Os testes verificam principalmente:

* validação das entradas;
* modelo `DiaryEntry`;
* persistência no `localStorage`.

Também existe uma GitHub Action que executa o lint e os testes automaticamente a cada `push`.

---

## Testando a PWA

### Offline

1. Execute o projeto com `npm run start`.
2. Abra o projeto no navegador.
3. Abra o DevTools.
4. Acesse a aba **Network**.
5. Ative o modo **Offline**.
6. Recarregue a página.

A aplicação deve continuar funcionando com os arquivos armazenados pelo service worker e com os registros já salvos.

### Instalação

No Chrome, a opção de instalação pode aparecer na barra de endereço.

Em dispositivos móveis compatíveis, também é possível instalar a aplicação na tela inicial.

### Lighthouse

Para verificar a PWA:

```text
DevTools
→ Lighthouse
→ Progressive Web App
→ Analyze
```

---

## Publicação

O projeto pode ser publicado utilizando o **GitHub Pages**.

No repositório:

```text
Settings
→ Pages
→ Deploy from a branch
→ main
```

O GitHub Pages fornece HTTPS, permitindo que o service worker funcione em produção.

---

## Privacidade

Os registros ficam armazenados apenas no navegador:

```text
localStorage
```

O projeto não possui:

* Backend
* Banco de dados
* Analytics
* Conta de usuário
* Servidor para armazenar os registros

> [!WARNING]
> Se os dados do site forem apagados do navegador, os registros também poderão ser perdidos. Para informações importantes, é recomendável baixar uma cópia em `.txt`.

---

## Sobre o projeto

A ideia foi criar um diário simples que pudesse funcionar diretamente no navegador, sem depender de uma estrutura externa.

Por isso, escolhi utilizar **HTML, CSS e JavaScript puro**, junto com os recursos de PWA disponíveis no navegador.

A aplicação foi organizada em classes para separar as responsabilidades do código, e o CSS segue uma abordagem **mobile-first**.

---




