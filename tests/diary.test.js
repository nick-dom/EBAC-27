/**
 * Testes unitários do Diário de Bordo.
 * ---------------------------------------------------------------
 * Estrutura seguindo o padrão AAA (Arrange, Act, Assert), conforme
 * as boas práticas de testes unitários com Jest.
 *
 * `script.js` foi escrito para rodar tanto no navegador (script solto,
 * sem bundler) quanto aqui no Node: no final do arquivo ele verifica
 * `typeof module !== "undefined"` e exporta as peças testáveis
 * (funções e classes puras, sem dependência direta do DOM).
 */

// Arrange (ambiente): antes de importar o script.js, garantimos que
// `localStorage` exista no ambiente Node/JSDOM usado pelo Jest.
const { validateEntry, DiaryEntry, DiaryStorage } = require("../script.js");

beforeEach(() => {
  // Limpa o localStorage entre os testes para que um teste não
  // "vaze" estado para o outro (isolamento de testes).
  localStorage.clear();
});

describe("validateEntry (função pura de validação)", () => {
  test("rejeita quando título, descrição ou data estão vazios", () => {
    // Arrange
    const dadosIncompletos = { title: "", description: "", date: "" };

    // Act
    const erro = validateEntry(dadosIncompletos);

    // Assert
    expect(erro).toBe("Preencha título, data e descrição antes de registrar.");
  });

  test("rejeita título com menos de 3 caracteres", () => {
    // Arrange
    const dados = { title: "Oi", description: "Descrição válida", date: "2026-09-20" };

    // Act
    const erro = validateEntry(dados);

    // Assert
    expect(erro).toMatch(/pelo menos 3 caracteres/);
  });

  test("aceita uma entrada válida e não retorna erro", () => {
    // Arrange
    const dados = {
      title: "Vistoria no convés",
      description: "Tudo em ordem após a tempestade.",
      date: "2026-09-20",
    };

    // Act
    const erro = validateEntry(dados);

    // Assert
    expect(erro).toBeNull();
  });
});

describe("DiaryEntry (modelo)", () => {
  test("gera um id automaticamente quando não informado", () => {
    // Arrange
    const dados = { title: "Título", description: "Descrição", date: "2026-09-20" };

    // Act
    const entry = new DiaryEntry(dados);

    // Assert
    expect(entry.id).toBeTruthy();
  });

  test("remove espaços extras do título e da descrição", () => {
    // Arrange
    const dados = {
      title: "  Título com espaços  ",
      description: "  Descrição  ",
      date: "2026-09-20",
    };

    // Act
    const entry = new DiaryEntry(dados);

    // Assert
    expect(entry.title).toBe("Título com espaços");
    expect(entry.description).toBe("Descrição");
  });

  test("formatedDate devolve uma string não vazia para uma data válida", () => {
    // Arrange
    const entry = new DiaryEntry({
      title: "Título",
      description: "Descrição",
      date: "2026-01-15",
    });

    // Act
    const formatada = entry.formattedDate;

    // Assert
    expect(typeof formatada).toBe("string");
    expect(formatada.length).toBeGreaterThan(0);
  });

  test("wordCount conta as palavras da descrição", () => {
    // Arrange
    const entry = new DiaryEntry({
      title: "Título",
      description: "uma duas três quatro",
      date: "2026-09-20",
    });

    // Act & Assert
    expect(entry.wordCount).toBe(4);
  });
});

describe("DiaryStorage (persistência em localStorage)", () => {
  test("getAll retorna uma lista vazia quando não há nada salvo", () => {
    // Act
    const entradas = DiaryStorage.getAll();

    // Assert
    expect(entradas).toEqual([]);
  });

  test("saveAll persiste as entradas e getAll as recupera depois", () => {
    // Arrange
    const entry = new DiaryEntry({
      title: "Chegada ao porto",
      description: "Atracamos ao amanhecer.",
      date: "2026-09-20",
    });

    // Act
    DiaryStorage.saveAll([entry]);
    const recuperadas = DiaryStorage.getAll();

    // Assert
    expect(recuperadas).toHaveLength(1);
    expect(recuperadas[0].title).toBe("Chegada ao porto");
    expect(recuperadas[0].id).toBe(entry.id);
  });

  test("getAll não quebra a aplicação se o conteúdo salvo estiver corrompido", () => {
    // Arrange: simula um valor inválido gravado diretamente no storage
    localStorage.setItem("diario-de-bordo:entries", "{ isto não é json válido");

    // Act
    const entradas = DiaryStorage.getAll();

    // Assert
    expect(entradas).toEqual([]);
  });
});
