// Configuração "flat config" do ESLint (formato usado a partir do ESLint 9).
// Mantém o projeto livre de frameworks: aqui só validamos JS puro de
// navegador (script.js, service-worker.js) e os testes em Node/Jest.
export default [
  {
    ignores: ["node_modules/**", "coverage/**"],
  },
  {
    files: ["script.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        localStorage: "readonly",
        crypto: "readonly",
        Blob: "readonly",
        URL: "readonly",
        Intl: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        module: "writable",
      },
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "error",
      eqeqeq: "warn",
      "prefer-const": "warn",
    },
  },
  {
    files: ["service-worker.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        self: "readonly",
        caches: "readonly",
        fetch: "readonly",
        Response: "readonly",
        URL: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "error",
    },
  },
  {
    files: ["tests/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        require: "readonly",
        module: "writable",
        describe: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        global: "writable",
      },
    },
  },
];
