# Diário de Bordo

Um diário pessoal para registrar o que você fez no dia — título, data e uma
descrição que pode ser tão longa quanto você quiser. É uma PWA de verdade:
funciona offline, pode ser instalada na tela inicial e não depende de
nenhum servidor. Tudo fica salvo no `localStorage` do seu próprio
navegador.

Sem React, sem build step, sem backend. HTML, CSS e JS puros, de propósito.

Clicando em qualquer entrada da lista, ela abre em uma "página" própria
(um `<dialog>` do próprio navegador), onde dá pra ler o texto completo,
copiar ou baixar como `.txt`.

## Rodando o projeto

Service worker não funciona abrindo o `index.html` direto no navegador
(`file://`) — precisa ser servido por HTTP, mesmo que seja localhost.
Qualquer servidor simples resolve:

```bash
npm run start
# roda "npx serve .", sem precisar instalar nada global
```

Abra a URL que aparecer no terminal (normalmente http://localhost:3000).

## Estrutura

```
index.html            → marcação da página
style.css             → estilos (mobile-first, BEM)
script.js             → toda a lógica: modelo, storage, CRUD, PWA
manifest.json         → configuração de instalação
service-worker.js     → cache e suporte offline
icons/                → ícones 192, 512 e maskable
tests/diary.test.js   → testes unitários (Jest)
```


## Testes e lint

```bash
npm install
npm test          # roda os testes (Jest)
npm run lint      # ESLint
npm run format    # Prettier em tudo
```

Os testes cobrem a parte que dá pra testar sem precisar simular o DOM
inteiro: validação do formulário, o modelo `DiaryEntry` e a persistência
em `DiaryStorage`. A interface em si eu testei manualmente mesmo, não
achei que valia a pena montar uma suíte de testes de UI pra um projeto
vanilla desse tamanho.

O `.github/workflows/ci.yml` roda lint e testes a cada push, então se
alguma alteração quebrar algo isso aparece no GitHub antes de virar
problema.

## Testando como PWA

1. Suba o projeto com `npm run start` e abra no Chrome.
2. DevTools → aba **Lighthouse** → categoria "Progressive Web App" → analisar.
3. Pra testar offline: DevTools → aba **Network** → marcar "Offline" → recarregar.
   A interface e as entradas já salvas continuam aparecendo normalmente.
4. Pra testar a instalação: no desktop o Chrome mostra um ícone de instalar
   na barra de endereço; no celular, aparece o botão "Instalar aplicativo"
   que eu conectei no evento `beforeinstallprompt`.

## Subindo pro GitHub

```bash
git init
git add .
git commit -m "feat: diário de bordo PWA"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/diario-de-bordo.git
git push -u origin main
```

Depois é só ativar o GitHub Pages em Settings → Pages, apontando pra
branch `main`. O Pages já serve em HTTPS, que é exatamente o que o
service worker precisa pra funcionar em produção.

## Por que as coisas foram feitas assim

Algumas decisões que provavelmente valem uma explicação:

- **`DiaryEntry`, `DiaryStorage`, `DiaryApp`, `EntryModal` etc. em classes
  separadas**: cada uma cuida de uma coisa só (modelo, persistência,
  orquestração da tela, o modal). Ajuda a não virar um `script.js` de
  1000 linhas onde tudo mexe em tudo.
- **`#entries` como campo privado em `DiaryApp`**: ninguém de fora consegue
  alterar a lista de entradas sem passar pelos métodos da classe. É
  encapsulamento de verdade, não só uma convenção de underscore.
- **CSS mobile-first**: os estilos "base" (sem media query) já são os do
  celular; o `min-width` só adiciona coisa pra telas maiores, nunca
  desfaz o que já tem. Reescrevi isso porque a primeira versão tinha
  saído meio ao contrário.
- **O clique na entrada não é um `<h3>`/`<p>` dentro de `<button>`** — isso
  é inválido no HTML5 (bloco dentro de botão não é permitido). Uso um
  botão transparente por cima do cartão inteiro (o clássico "cartão
  clicável"), com o título e a descrição como elementos normais ao lado.
- **Sem React/Next/TypeScript**: o enunciado pede explicitamente sem
  framework e sem backend, então não fez sentido forçar isso aqui. Dá
  pra evoluir pra lá depois — trocar as classes por componentes com
  hooks, tipar o `DiaryEntry` como interface, etc. — mas seria outro
  projeto.

## Privacidade

Nada sai do seu navegador. Sem servidor, sem analytics, sem chamada de
rede pros seus dados. Se você limpar o `localStorage` do site, o diário
some — não tem como recuperar, então bom manter um backup se o conteúdo
for importante pra você.