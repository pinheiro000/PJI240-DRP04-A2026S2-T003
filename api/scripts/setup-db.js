import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import pg from 'pg';
import { config } from '../src/config.js';

const { Pool } = pg;
if (!config.databaseUrl) {
  throw new Error('Defina DATABASE_URL no arquivo .env antes de configurar o banco.');
}

const directory = path.dirname(fileURLToPath(import.meta.url));
const pool = new Pool({ connectionString: config.databaseUrl });

const readers = [
  ['Mariana Costa Rocha', '20240982', '7º Ano A', 'Aluno'],
  ['Lucas Gabriel Ferreira', '20240842', '8º Ano B', 'Aluno'],
  ['Prof. Carlos Eduardo Mendes', 'DOC-2021-041', 'Docência / História', 'Professor'],
  ['Beatriz Helena Pires', '20240912', '8º Ano C', 'Aluno']
];

const books = [
  ['Dom Casmurro', 'Machado de Assis', 'Companhia das Letras', 1899, '9788535910663', 'Literatura Brasileira'],
  ['Vidas Secas', 'Graciliano Ramos', 'Record', 1938, '9788501067340', 'Literatura Brasileira'],
  ['O Pequeno Príncipe', 'Antoine de Saint-Exupéry', 'Agir', 1943, '9788522031445', 'Literatura Estrangeira'],
  ['O Meu Pé de Laranja Lima', 'José Mauro de Vasconcelos', 'Melhoramentos', 1968, '9788506055220', 'Literatura Juvenil'],
  ['Capitães da Areia', 'Jorge Amado', 'Companhia das Letras', 1937, '9788535911691', 'Literatura Brasileira'],
  ['História do Brasil para Crianças', 'Ana Maria Machado', 'Global', 2001, '9788526011048', 'Didáticos']
];

try {
  const schema = await readFile(path.join(directory, '..', 'schema.sql'), 'utf8');
  await pool.query(schema);

  for (const [name, matricula, turma, type] of readers) {
    await pool.query(
      `INSERT INTO usuario (nome, matricula, turma, tipo_usuario)
       VALUES ($1, $2, $3, $4) ON CONFLICT (matricula) DO NOTHING`,
      [name, matricula, turma, type]
    );
  }

  const existingBooks = await pool.query('SELECT COUNT(*)::int AS total FROM livro');
  if (existingBooks.rows[0].total === 0) {
    for (const [title, author, publisher, year, isbn, category] of books) {
      await pool.query(
        `INSERT INTO livro (tombo, titulo, autor, editora, ano, isbn, categoria)
         VALUES ('BIB-' || LPAD(nextval('livro_tombo_seq')::text, 6, '0'), $1, $2, $3, $4, $5, $6)`,
        [title, author, publisher, year, isbn, category]
      );
    }
  }

  const hash = await bcrypt.hash(config.demoPassword, 12);
  await pool.query(
    `INSERT INTO acesso_sistema (nome_usuario, login, senha_hash, perfil_acesso)
     VALUES ('Operador da Biblioteca', $1, $2, 'Operador')
     ON CONFLICT (login) DO UPDATE
       SET nome_usuario = EXCLUDED.nome_usuario,
           senha_hash = EXCLUDED.senha_hash,
           perfil_acesso = EXCLUDED.perfil_acesso,
           ativo = TRUE`,
    [config.demoLogin, hash]
  );

  console.log(`Banco preparado. Acesso de demonstração: ${config.demoLogin}`);
  if (!process.env.DEMO_PASSWORD) console.log(`Senha de demonstração local: ${config.demoPassword}`);
} finally {
  await pool.end();
}
