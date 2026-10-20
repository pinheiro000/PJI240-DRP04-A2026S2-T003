CREATE SEQUENCE IF NOT EXISTS livro_tombo_seq START 1;

CREATE TABLE IF NOT EXISTS usuario (
  id_usuario SERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  matricula VARCHAR(50) NOT NULL UNIQUE,
  turma VARCHAR(80),
  tipo_usuario VARCHAR(30) NOT NULL CHECK (tipo_usuario IN ('Aluno', 'Professor', 'Servidor')),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS livro (
  id_livro SERIAL PRIMARY KEY,
  tombo VARCHAR(30) NOT NULL UNIQUE,
  titulo VARCHAR(200) NOT NULL,
  autor VARCHAR(150) NOT NULL,
  editora VARCHAR(150),
  ano INTEGER CHECK (ano IS NULL OR (ano >= 0 AND ano <= 3000)),
  isbn VARCHAR(20),
  categoria VARCHAR(100) NOT NULL,
  status_livro VARCHAR(30) NOT NULL DEFAULT 'disponivel'
    CHECK (status_livro IN ('disponivel', 'emprestado', 'manutencao')),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS emprestimo (
  id_emprestimo SERIAL PRIMARY KEY,
  id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario),
  id_livro INTEGER NOT NULL REFERENCES livro(id_livro),
  data_saida DATE NOT NULL,
  data_prevista_devolucao DATE NOT NULL,
  data_devolucao_real DATE,
  status_emprestimo VARCHAR(30) NOT NULL DEFAULT 'ativo'
    CHECK (status_emprestimo IN ('ativo', 'devolvido')),
  observacoes_devolucao TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (data_prevista_devolucao >= data_saida),
  CHECK (data_devolucao_real IS NULL OR data_devolucao_real >= data_saida)
);

CREATE UNIQUE INDEX IF NOT EXISTS emprestimo_unico_ativo_por_livro
  ON emprestimo(id_livro) WHERE data_devolucao_real IS NULL;
CREATE INDEX IF NOT EXISTS emprestimo_data_saida_idx ON emprestimo(data_saida);
CREATE INDEX IF NOT EXISTS emprestimo_data_prevista_idx ON emprestimo(data_prevista_devolucao);
CREATE INDEX IF NOT EXISTS livro_busca_titulo_idx ON livro(titulo);
CREATE INDEX IF NOT EXISTS usuario_busca_nome_idx ON usuario(nome);

CREATE TABLE IF NOT EXISTS acesso_sistema (
  id_acesso SERIAL PRIMARY KEY,
  nome_usuario VARCHAR(150) NOT NULL,
  login VARCHAR(100) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  perfil_acesso VARCHAR(30) NOT NULL DEFAULT 'Operador',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  ultimo_acesso TIMESTAMPTZ
);
