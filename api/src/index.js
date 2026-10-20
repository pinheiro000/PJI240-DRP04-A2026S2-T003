import express from 'express';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { pool } from './db.js';
import { createSessionCookie, clearSessionCookie, optionalAuth, requireAuth } from './auth.js';
import { AppError, handleError } from './errors.js';
import {
  addCalendarDays,
  loanStatus,
  normalizeBookStatus,
  todayInSaoPaulo,
  USER_TYPES
} from './domain.js';

const app = express();
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const webDist = path.join(projectRoot, 'web', 'dist');
const webIndex = path.join(webDist, 'index.html');
if (config.nodeEnv === 'production' && !existsSync(webIndex)) {
  throw new Error('Interface não compilada. Execute `npm run build` antes de iniciar em produção.');
}

const asyncRoute = (handler) => (request, response, next) =>
  Promise.resolve(handler(request, response, next)).catch(next);

const paged = (request) => {
  const page = Math.max(1, Number.parseInt(request.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(request.query.limit, 10) || 10));
  return { page, limit, offset: (page - 1) * limit };
};

const text = (value) => typeof value === 'string' ? value.trim() : '';
const numericId = (value, label) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new AppError(400, `${label} inválido.`);
  return id;
};
const required = (value, label) => {
  const result = text(value);
  if (!result) throw new AppError(400, `${label} é obrigatório.`);
  return result;
};

app.get('/api/health', asyncRoute(async (_request, response) => {
  await pool.query('SELECT 1');
  response.json({ status: 'ok' });
}));

app.post('/api/auth/login', asyncRoute(async (request, response) => {
  const login = required(request.body.login, 'Usuário');
  const password = required(request.body.password, 'Senha');
  const result = await pool.query(
    `SELECT id_acesso, nome_usuario, login, senha_hash, perfil_acesso
       FROM acesso_sistema WHERE login = $1 AND ativo = TRUE`,
    [login]
  );
  const access = result.rows[0];
  if (!access || !(await bcrypt.compare(password, access.senha_hash))) {
    throw new AppError(401, 'Usuário ou senha incorretos.');
  }

  await pool.query('UPDATE acesso_sistema SET ultimo_acesso = NOW() WHERE id_acesso = $1', [access.id_acesso]);
  createSessionCookie(response, access, Boolean(request.body.remember));
  response.json({ user: { name: access.nome_usuario, login: access.login, profile: access.perfil_acesso } });
}));

app.post('/api/auth/logout', (_request, response) => {
  clearSessionCookie(response);
  response.status(204).end();
});

app.get('/api/auth/me', optionalAuth, asyncRoute(async (request, response) => {
  if (!request.access) {
    response.json({ user: null });
    return;
  }
  const result = await pool.query(
    'SELECT nome_usuario, login, perfil_acesso FROM acesso_sistema WHERE id_acesso = $1 AND ativo = TRUE',
    [request.access.id]
  );
  if (!result.rows[0]) {
    clearSessionCookie(response);
    response.json({ user: null });
    return;
  }
  const access = result.rows[0];
  response.json({ user: { name: access.nome_usuario, login: access.login, profile: access.perfil_acesso } });
}));

app.use('/api', requireAuth);

app.get('/api/books', asyncRoute(async (request, response) => {
  const { page, limit, offset } = paged(request);
  const values = [];
  const where = [];
  const query = text(request.query.q);
  const category = text(request.query.category);
  const requestedStatus = text(request.query.status);
  const status = normalizeBookStatus(requestedStatus);
  if (requestedStatus && !status) throw new AppError(400, 'Situação de exemplar inválida.');
  if (query) {
    values.push(`%${query}%`);
    where.push(`(titulo ILIKE $${values.length} OR autor ILIKE $${values.length} OR isbn ILIKE $${values.length} OR tombo ILIKE $${values.length})`);
  }
  if (category) {
    values.push(category);
    where.push(`categoria = $${values.length}`);
  }
  if (status) {
    values.push(status);
    where.push(`status_livro = $${values.length}`);
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const count = await pool.query(`SELECT COUNT(*)::int AS total FROM livro ${clause}`, values);
  values.push(limit, offset);
  const books = await pool.query(
    `SELECT id_livro, tombo, titulo, autor, editora, ano, isbn, categoria, status_livro
       FROM livro ${clause}
      ORDER BY titulo, tombo LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  response.json({ items: books.rows, total: count.rows[0].total, page, limit });
}));

app.get('/api/books/options', asyncRoute(async (_request, response) => {
  const result = await pool.query('SELECT DISTINCT categoria FROM livro ORDER BY categoria');
  response.json({ categories: result.rows.map((row) => row.categoria) });
}));

app.get('/api/books/:id', asyncRoute(async (request, response) => {
  const result = await pool.query(
    'SELECT * FROM livro WHERE id_livro = $1',
    [numericId(request.params.id, 'Identificador do exemplar')]
  );
  if (!result.rows[0]) throw new AppError(404, 'Exemplar não encontrado.');
  response.json(result.rows[0]);
}));

app.post('/api/books', asyncRoute(async (request, response) => {
  const body = request.body;
  const status = normalizeBookStatus(body.status_livro || body.status || 'disponivel');
  if (!status || status === 'emprestado') throw new AppError(400, 'A situação inicial deve ser disponível ou em manutenção.');
  const year = body.ano === '' || body.ano == null ? null : Number(body.ano);
  if (year != null && (!Number.isInteger(year) || year < 0 || year > new Date().getFullYear() + 1)) {
    throw new AppError(400, 'Informe um ano de publicação válido.');
  }
  const values = [
    required(body.titulo, 'Título'),
    required(body.autor, 'Autor'),
    text(body.editora) || null,
    year,
    text(body.isbn) || null,
    required(body.categoria, 'Categoria'),
    status
  ];
  const result = await pool.query(
    `INSERT INTO livro (tombo, titulo, autor, editora, ano, isbn, categoria, status_livro)
     VALUES ('BIB-' || LPAD(nextval('livro_tombo_seq')::text, 6, '0'), $1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    values
  );
  response.status(201).json(result.rows[0]);
}));

app.patch('/api/books/:id', asyncRoute(async (request, response) => {
  const body = request.body;
  const id = numericId(request.params.id, 'Identificador do exemplar');
  const currentResult = await pool.query('SELECT * FROM livro WHERE id_livro = $1', [id]);
  const current = currentResult.rows[0];
  if (!current) throw new AppError(404, 'Exemplar não encontrado.');
  const status = body.status_livro || body.status
    ? normalizeBookStatus(body.status_livro || body.status)
    : current.status_livro;
  if (!status) throw new AppError(400, 'Situação do exemplar inválida.');
  if (current.status_livro === 'emprestado' && status !== 'emprestado') {
    throw new AppError(409, 'Devolva o exemplar antes de alterar sua situação.');
  }
  if (status === 'emprestado' && current.status_livro !== 'emprestado') {
    throw new AppError(400, 'A situação “emprestado” é controlada pelo fluxo de empréstimo.');
  }
  const year = body.ano === '' || body.ano == null ? null : Number(body.ano);
  if (year != null && (!Number.isInteger(year) || year < 0 || year > new Date().getFullYear() + 1)) {
    throw new AppError(400, 'Informe um ano de publicação válido.');
  }
  const result = await pool.query(
    `UPDATE livro SET titulo=$1, autor=$2, editora=$3, ano=$4, isbn=$5, categoria=$6, status_livro=$7
      WHERE id_livro=$8 RETURNING *`,
    [
      required(body.titulo ?? current.titulo, 'Título'),
      required(body.autor ?? current.autor, 'Autor'),
      body.editora === undefined ? current.editora : text(body.editora) || null,
      body.ano === undefined ? current.ano : year,
      body.isbn === undefined ? current.isbn : text(body.isbn) || null,
      required(body.categoria ?? current.categoria, 'Categoria'),
      status,
      id
    ]
  );
  response.json(result.rows[0]);
}));

app.get('/api/users', asyncRoute(async (request, response) => {
  const { page, limit, offset } = paged(request);
  const values = [];
  const where = [];
  const query = text(request.query.q);
  const type = text(request.query.type);
  const className = text(request.query.class);
  if (request.query.activeOnly === 'true') where.push('ativo = TRUE');
  if (type && !USER_TYPES.includes(type)) throw new AppError(400, 'Tipo de usuário inválido.');
  if (query) {
    values.push(`%${query}%`);
    where.push(`(nome ILIKE $${values.length} OR matricula ILIKE $${values.length})`);
  }
  if (type) {
    values.push(type);
    where.push(`tipo_usuario = $${values.length}`);
  }
  if (className) {
    values.push(className);
    where.push(`turma = $${values.length}`);
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const count = await pool.query(`SELECT COUNT(*)::int AS total FROM usuario ${clause}`, values);
  values.push(limit, offset);
  const users = await pool.query(
    `SELECT id_usuario, nome, matricula, turma, tipo_usuario, ativo FROM usuario ${clause}
      ORDER BY nome LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  response.json({ items: users.rows, total: count.rows[0].total, page, limit });
}));

app.get('/api/users/stats', asyncRoute(async (_request, response) => {
  const [counts, classes] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE tipo_usuario='Aluno')::int AS students,
              COUNT(*) FILTER (WHERE tipo_usuario='Professor')::int AS teachers,
              COUNT(*) FILTER (WHERE tipo_usuario='Servidor')::int AS staff
         FROM usuario WHERE ativo=TRUE`
    ),
    pool.query('SELECT DISTINCT turma FROM usuario WHERE ativo=TRUE AND turma IS NOT NULL ORDER BY turma')
  ]);
  response.json({ ...counts.rows[0], classes: classes.rows.map((row) => row.turma) });
}));

app.get('/api/users/:id', asyncRoute(async (request, response) => {
  const result = await pool.query(
    'SELECT * FROM usuario WHERE id_usuario = $1',
    [numericId(request.params.id, 'Identificador do leitor')]
  );
  if (!result.rows[0]) throw new AppError(404, 'Leitor não encontrado.');
  response.json(result.rows[0]);
}));

app.post('/api/users', asyncRoute(async (request, response) => {
  const body = request.body;
  const type = required(body.tipo_usuario || body.type, 'Tipo de usuário');
  if (!USER_TYPES.includes(type)) throw new AppError(400, 'Tipo de usuário inválido.');
  try {
    const result = await pool.query(
      `INSERT INTO usuario (nome, matricula, turma, tipo_usuario)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [
        required(body.nome || body.name, 'Nome'),
        required(body.matricula, 'Matrícula'),
        text(body.turma || body.class) || null,
        type
      ]
    );
    response.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') throw new AppError(409, 'Já existe um leitor com essa matrícula.');
    throw error;
  }
}));

app.patch('/api/users/:id', asyncRoute(async (request, response) => {
  const id = numericId(request.params.id, 'Identificador do leitor');
  const currentResult = await pool.query('SELECT * FROM usuario WHERE id_usuario = $1', [id]);
  const current = currentResult.rows[0];
  if (!current) throw new AppError(404, 'Leitor não encontrado.');
  const body = request.body;
  const type = body.tipo_usuario || body.type || current.tipo_usuario;
  if (!USER_TYPES.includes(type)) throw new AppError(400, 'Tipo de usuário inválido.');
  try {
    const result = await pool.query(
      `UPDATE usuario SET nome=$1, matricula=$2, turma=$3, tipo_usuario=$4, ativo=$5
        WHERE id_usuario=$6 RETURNING *`,
      [
        required(body.nome ?? current.nome, 'Nome'),
        required(body.matricula ?? current.matricula, 'Matrícula'),
        body.turma === undefined && body.class === undefined ? current.turma : text(body.turma || body.class) || null,
        type,
        body.ativo === undefined ? current.ativo : body.ativo === true || body.ativo === 'true',
        id
      ]
    );
    response.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') throw new AppError(409, 'Já existe um leitor com essa matrícula.');
    throw error;
  }
}));

app.get('/api/loans', asyncRoute(async (request, response) => {
  const { page, limit, offset } = paged(request);
  const values = [];
  const conditions = [];
  const query = text(request.query.q);
  const filter = text(request.query.status);
  if (filter && !['open', 'active', 'returned', 'overdue'].includes(filter)) {
    throw new AppError(400, 'Filtro de empréstimo inválido.');
  }
  if (query) {
    values.push(`%${query}%`);
    conditions.push(`(u.nome ILIKE $${values.length} OR u.matricula ILIKE $${values.length} OR b.titulo ILIKE $${values.length} OR b.tombo ILIKE $${values.length})`);
  }
  if (filter === 'open') conditions.push('e.data_devolucao_real IS NULL');
  if (filter === 'active') {
    values.push(todayInSaoPaulo());
    conditions.push(`e.data_devolucao_real IS NULL AND e.data_prevista_devolucao >= $${values.length}`);
  }
  if (filter === 'returned') conditions.push('e.data_devolucao_real IS NOT NULL');
  if (filter === 'overdue') {
    values.push(todayInSaoPaulo());
    conditions.push(`e.data_devolucao_real IS NULL AND e.data_prevista_devolucao < $${values.length}`);
  }
  const from = `FROM emprestimo e JOIN usuario u ON u.id_usuario=e.id_usuario JOIN livro b ON b.id_livro=e.id_livro`;
  const clause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const count = await pool.query(`SELECT COUNT(*)::int AS total ${from} ${clause}`, values);
  values.push(limit, offset);
  const loans = await pool.query(
    `SELECT e.id_emprestimo, e.data_saida, e.data_prevista_devolucao, e.data_devolucao_real,
            e.observacoes_devolucao, u.id_usuario, u.nome AS usuario_nome, u.matricula, u.turma, u.tipo_usuario,
            b.id_livro, b.tombo, b.titulo, b.autor, b.categoria
       ${from} ${clause}
      ORDER BY e.data_devolucao_real NULLS FIRST, e.data_prevista_devolucao
      LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  response.json({
    items: loans.rows.map((loan) => ({ ...loan, status: loanStatus(loan) })),
    total: count.rows[0].total,
    page,
    limit
  });
}));

app.get('/api/loans/stats', asyncRoute(async (_request, response) => {
  const today = todayInSaoPaulo();
  const result = await pool.query(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE data_devolucao_real IS NULL)::int AS active,
            COUNT(*) FILTER (WHERE data_devolucao_real IS NULL AND data_prevista_devolucao < $1)::int AS overdue,
            COUNT(*) FILTER (WHERE data_devolucao_real IS NOT NULL)::int AS returned
       FROM emprestimo`,
    [today]
  );
  response.json(result.rows[0]);
}));

app.get('/api/loans/:id', asyncRoute(async (request, response) => {
  const result = await pool.query(
    `SELECT e.id_emprestimo, e.data_saida, e.data_prevista_devolucao, e.data_devolucao_real,
            e.observacoes_devolucao, u.id_usuario, u.nome AS usuario_nome, u.matricula, u.turma, u.tipo_usuario,
            b.id_livro, b.tombo, b.titulo, b.autor, b.categoria
       FROM emprestimo e JOIN usuario u USING(id_usuario) JOIN livro b USING(id_livro)
      WHERE e.id_emprestimo=$1`,
    [numericId(request.params.id, 'Identificador do empréstimo')]
  );
  const loan = result.rows[0];
  if (!loan) throw new AppError(404, 'Empréstimo não encontrado.');
  response.json({ ...loan, status: loanStatus(loan) });
}));

app.post('/api/loans', asyncRoute(async (request, response) => {
  const userId = numericId(request.body.userId || request.body.id_usuario, 'Identificador do leitor');
  const bookId = numericId(request.body.bookId || request.body.id_livro, 'Identificador do exemplar');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const user = await client.query('SELECT id_usuario FROM usuario WHERE id_usuario=$1 AND ativo=TRUE', [userId]);
    if (!user.rows[0]) throw new AppError(404, 'Leitor não encontrado ou inativo.');
    const book = await client.query('SELECT * FROM livro WHERE id_livro=$1 FOR UPDATE', [bookId]);
    if (!book.rows[0]) throw new AppError(404, 'Exemplar não encontrado.');
    if (book.rows[0].status_livro !== 'disponivel') {
      throw new AppError(409, 'Este exemplar não está disponível para empréstimo.');
    }
    const startDate = todayInSaoPaulo();
    const dueDate = addCalendarDays(startDate, 14);
    const loan = await client.query(
      `INSERT INTO emprestimo (id_usuario, id_livro, data_saida, data_prevista_devolucao, status_emprestimo)
       VALUES ($1, $2, $3, $4, 'ativo') RETURNING *`,
      [userId, bookId, startDate, dueDate]
    );
    await client.query("UPDATE livro SET status_livro='emprestado' WHERE id_livro=$1", [bookId]);
    await client.query('COMMIT');
    response.status(201).json({ ...loan.rows[0], status: 'ativo' });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') throw new AppError(409, 'Este exemplar já possui um empréstimo ativo.');
    throw error;
  } finally {
    client.release();
  }
}));

app.post('/api/loans/:id/return', asyncRoute(async (request, response) => {
  const returnedDate = text(request.body.data_devolucao_real || request.body.returnedDate) || todayInSaoPaulo();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(returnedDate) || returnedDate > todayInSaoPaulo()) {
    throw new AppError(400, 'Informe uma data de devolução válida, que não seja futura.');
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const current = await client.query(
      'SELECT * FROM emprestimo WHERE id_emprestimo=$1 FOR UPDATE',
      [numericId(request.params.id, 'Identificador do empréstimo')]
    );
    const loan = current.rows[0];
    if (!loan) throw new AppError(404, 'Empréstimo não encontrado.');
    if (loan.data_devolucao_real) throw new AppError(409, 'Este empréstimo já foi devolvido.');
    if (returnedDate < loan.data_saida) throw new AppError(400, 'A devolução não pode ser anterior à retirada.');
    const updated = await client.query(
      `UPDATE emprestimo SET data_devolucao_real=$1, status_emprestimo='devolvido',
                             observacoes_devolucao=$2
        WHERE id_emprestimo=$3 RETURNING *`,
      [returnedDate, text(request.body.observacoes || request.body.notes) || null, loan.id_emprestimo]
    );
    await client.query("UPDATE livro SET status_livro='disponivel' WHERE id_livro=$1", [loan.id_livro]);
    await client.query('COMMIT');
    response.json(updated.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

app.get('/api/dashboard', asyncRoute(async (_request, response) => {
  const today = todayInSaoPaulo();
  const [books, loans, users, latest, categories] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS total,
                       COUNT(*) FILTER (WHERE status_livro='disponivel')::int AS available
                  FROM livro`),
    pool.query(
      `SELECT COUNT(*) FILTER (WHERE data_devolucao_real IS NULL)::int AS active,
              COUNT(*) FILTER (WHERE data_devolucao_real IS NULL AND data_prevista_devolucao < $1)::int AS overdue,
              COUNT(*) FILTER (WHERE data_devolucao_real IS NOT NULL)::int AS returned
         FROM emprestimo`,
      [today]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE tipo_usuario='Aluno')::int AS students,
              COUNT(*) FILTER (WHERE tipo_usuario='Professor')::int AS teachers,
              COUNT(*) FILTER (WHERE tipo_usuario='Servidor')::int AS staff
         FROM usuario WHERE ativo=TRUE`
    ),
    pool.query(
      `SELECT e.id_emprestimo, e.data_saida, e.data_prevista_devolucao, e.data_devolucao_real,
              u.nome AS usuario_nome, u.matricula, u.turma, b.titulo, b.tombo
         FROM emprestimo e JOIN usuario u USING (id_usuario) JOIN livro b USING (id_livro)
        ORDER BY e.id_emprestimo DESC LIMIT 5`
    ),
    pool.query(
      `SELECT categoria, COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE status_livro='disponivel')::int AS available
         FROM livro GROUP BY categoria ORDER BY total DESC LIMIT 5`
    )
  ]);
  response.json({
    books: books.rows[0],
    loans: loans.rows[0],
    users: users.rows[0],
    latest: latest.rows.map((loan) => ({ ...loan, status: loanStatus(loan, today) })),
    categories: categories.rows
  });
}));

app.get('/api/reports', asyncRoute(async (request, response) => {
  const today = todayInSaoPaulo();
  const period = Math.min(365, Math.max(1, Number.parseInt(request.query.days, 10) || 30));
  const since = addCalendarDays(today, -period + 1);
  const category = text(request.query.category);
  const params = [since, today];
  const categoryClause = category ? `AND b.categoria=$3` : '';
  if (category) params.push(category);
  const [totals, grouped, monthly, topBook, categories] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS loans,
              COUNT(*) FILTER (WHERE data_devolucao_real IS NULL AND data_prevista_devolucao < $2)::int AS overdue,
              COUNT(*) FILTER (WHERE data_devolucao_real IS NOT NULL AND data_devolucao_real <= data_prevista_devolucao)::int AS on_time_returns
         FROM emprestimo e JOIN livro b USING(id_livro)
        WHERE e.data_saida BETWEEN $1 AND $2 ${categoryClause}`,
      params
    ),
    pool.query(
      `SELECT b.categoria, COUNT(*)::int AS loans,
              COUNT(*) FILTER (WHERE e.data_devolucao_real IS NOT NULL)::int AS returned
         FROM emprestimo e JOIN livro b USING(id_livro)
        WHERE e.data_saida BETWEEN $1 AND $2 ${categoryClause}
        GROUP BY b.categoria ORDER BY loans DESC`,
      params
    ),
    pool.query(
      `SELECT TO_CHAR(DATE_TRUNC('month', e.data_saida), 'YYYY-MM') AS month,
              COUNT(*)::int AS loans,
              COUNT(*) FILTER (WHERE e.data_devolucao_real IS NOT NULL)::int AS returned
         FROM emprestimo e JOIN livro b USING(id_livro)
        WHERE e.data_saida BETWEEN $1 AND $2 ${categoryClause}
        GROUP BY DATE_TRUNC('month', e.data_saida) ORDER BY DATE_TRUNC('month', e.data_saida)`,
      params
    ),
    pool.query(
      `SELECT b.titulo, b.autor, COUNT(*)::int AS loans
         FROM emprestimo e JOIN livro b USING(id_livro)
        WHERE e.data_saida BETWEEN $1 AND $2 ${categoryClause}
        GROUP BY b.id_livro ORDER BY loans DESC LIMIT 1`,
      params
    ),
    pool.query('SELECT DISTINCT categoria FROM livro ORDER BY categoria')
  ]);
  response.json({
    periodDays: period,
    since,
    totals: totals.rows[0],
    categories: grouped.rows,
    monthly: monthly.rows,
    mostBorrowed: topBook.rows[0] || null,
    categoryOptions: categories.rows.map((row) => row.categoria)
  });
}));

app.get('/api/isbn/:isbn', asyncRoute(async (request, response) => {
  const isbn = text(request.params.isbn).replace(/[-\s]/g, '');
  if (!/^(?:\d{10}|\d{13}|X\d{9})$/i.test(isbn)) throw new AppError(400, 'Informe um ISBN válido com 10 ou 13 caracteres.');
  let result;
  try {
    const upstream = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${encodeURIComponent(isbn)}&format=json&jscmd=data`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!upstream.ok) throw new AppError(502, 'O serviço bibliográfico está indisponível. Preencha os dados manualmente.');
    result = await upstream.json();
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw new AppError(504, 'A consulta do ISBN excedeu o tempo limite. Preencha os dados manualmente.');
    }
    throw new AppError(502, 'Não foi possível consultar o ISBN. Preencha os dados manualmente.');
  }
  const book = result[`ISBN:${isbn}`];
  if (!book) {
    response.json({ found: false, message: 'ISBN não encontrado. Você pode preencher os dados manualmente.' });
    return;
  }
  response.json({
    found: true,
    title: book.title || '',
    author: book.authors?.map((author) => author.name).join(', ') || '',
    publisher: book.publishers?.[0]?.name || '',
    year: Number.parseInt(book.publish_date?.match(/\d{4}/)?.[0] || '', 10) || null,
    isbn
  });
}));

app.use('/api', (_request, _response, next) => next(new AppError(404, 'Rota da API não encontrada.')));
app.use(express.static(webDist, { index: false }));
app.use((request, response, next) => {
  if (request.method !== 'GET' || request.path.startsWith('/api/')) {
    next();
    return;
  }
  response.sendFile(webIndex, (error) => {
    if (error) next(error);
  });
});
app.use(handleError);

const server = app.listen(config.port, config.host, () => {
  console.log(`API da Biblioteca disponível na porta ${config.port}.`);
});

async function shutdown() {
  server.close();
  await pool.end();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
