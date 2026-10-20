import { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  BrowserRouter,
  Link,
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useNavigate,
  useParams
} from 'react-router-dom';
import {
  Activity, ArrowDownToLine, ArrowLeft, ArrowLeftRight, ArrowRight, BookOpen, CalendarDays,
  Check, CheckCircle2, ChevronLeft, ChevronRight, CircleAlert, CircleCheck, Clock3, LayoutDashboard,
  LibraryBig, LogOut, Menu, Search, ShieldCheck, UserRound, UserRoundPlus, Users, Wrench, X
} from 'lucide-react';
import { addDays, api, formatDate, initials, queryString, today } from './api.js';

const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

function useResource(path, dependencies = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    setState((previous) => ({ ...previous, loading: true, error: '' }));
    api(path).then((data) => {
      if (active) setState({ data, loading: false, error: '' });
    }).catch((error) => {
      if (active) setState({ data: null, loading: false, error: error.message });
    });
    return () => { active = false; };
  }, [path, version, ...dependencies]);
  return { ...state, refresh: () => setVersion((value) => value + 1) };
}

function Field({ label, children, hint, required = false }) {
  return (
    <label className="field">
      <span className="field-label">{label}{required && <b aria-hidden="true"> *</b>}</span>
      {children}
      {hint && <small className="field-hint">{hint}</small>}
    </label>
  );
}

function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      {action && <div className="heading-action">{action}</div>}
    </div>
  );
}

function StatCard({ label, value, note, icon: Icon, tone = 'blue' }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}><Icon size={20} aria-hidden="true" /></div>
      <div className="stat-label">{label}</div>
      <strong className="stat-value">{value ?? '—'}</strong>
      {note && <span className="stat-note">{note}</span>}
    </article>
  );
}

function StatusBadge({ status }) {
  const labels = {
    disponivel: ['Disponível', 'success'],
    emprestado: ['Emprestado', 'info'],
    manutencao: ['Em manutenção', 'warning'],
    ativo: ['Ativo', 'info'],
    atrasado: ['Em atraso', 'danger'],
    devolvido: ['Devolvido', 'success']
  };
  const [label, tone] = labels[status] || [status || '—', 'neutral'];
  return <span className={`badge ${tone}`}><span className="badge-dot" />{label}</span>;
}

function Notice({ error, success }) {
  if (!error && !success) return null;
  return <div className={`notice ${error ? 'notice-error' : 'notice-success'}`} role={error ? 'alert' : 'status'}>
    {error ? <CircleAlert size={17} /> : <CircleCheck size={17} />}{error || success}
  </div>;
}

function LoadingState() {
  return <div className="state-panel" role="status"><span className="spinner" />Carregando informações…</div>;
}

function ErrorState({ message }) {
  return <div className="state-panel state-error" role="alert"><CircleAlert size={18} />{message}</div>;
}

function EmptyState({ children }) {
  return <div className="state-panel">{children}</div>;
}

function DataTable({ columns, rows, loading, error, empty = 'Nenhum registro encontrado.' }) {
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!rows?.length) return <EmptyState>{empty}</EmptyState>;
  return (
    <div className="table-scroll">
      <table>
        <thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={row.id || row.id_livro || row.id_usuario || row.id_emprestimo || index}>
          {columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>)}
        </tr>)}</tbody>
      </table>
    </div>
  );
}

function Pagination({ page, limit, total, onChange }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  return <div className="pagination">
    <span>Exibindo {total ? (page - 1) * limit + 1 : 0}–{Math.min(page * limit, total)} de {total}</span>
    <div className="pagination-actions">
      <button className="button button-quiet button-small" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Página anterior"><ChevronLeft size={16} /> Anterior</button>
      <span>Página {page} de {pages}</span>
      <button className="button button-quiet button-small" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Próxima página">Próxima <ChevronRight size={16} /></button>
    </div>
  </div>;
}

function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    api('/auth/me').then(({ user: current }) => setUser(current)).catch(() => setUser(null)).finally(() => setChecking(false));
  }, []);

  return <AuthContext.Provider value={{ user, setUser, checking }}>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/books/new" element={<BookFormPage />} />
          <Route path="/books/:id" element={<BookDetailsPage />} />
          <Route path="/books/:id/edit" element={<BookFormPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/new" element={<UserFormPage />} />
          <Route path="/users/:id" element={<UserDetailsPage />} />
          <Route path="/users/:id/edit" element={<UserFormPage />} />
          <Route path="/loans" element={<LoansPage />} />
          <Route path="/returns" element={<ReturnsPage />} />
          <Route path="/loans/new" element={<NewLoanPage />} />
          <Route path="/loans/:id/return" element={<ReturnPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthContext.Provider>;
}

function LoginPage() {
  const { user, setUser, checking } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (checking) return <div className="login-loading"><LoadingState /></div>;
  if (user) return <Navigate to="/" replace />;

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const result = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          login: form.get('login'),
          password: form.get('password'),
          remember: form.get('remember') === 'on'
        })
      });
      setUser(result.user);
      navigate('/', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return <main className="login-page">
    <div className="login-card">
      <div className="login-brand"><span className="brand-mark"><LibraryBig size={30} /></span>
        <span className="eyebrow">INSTITUIÇÃO ESCOLAR</span>
        <h1>Sistema de Gestão da Biblioteca Escolar</h1>
        <p>Controle e organização do acervo, empréstimos e usuários da instituição escolar.</p>
      </div>
      <form onSubmit={submit} className="form-stack">
        <Notice error={error} />
        <Field label="Usuário ou matrícula" required><input name="login" autoComplete="username" required placeholder="Digite seu usuário ou matrícula" /></Field>
        <Field label="Senha" required><input name="password" type="password" autoComplete="current-password" required placeholder="Digite sua senha de acesso" /></Field>
        <label className="checkbox-row"><input name="remember" type="checkbox" /> Manter conectado por 7 dias</label>
        <button className="button button-primary button-full" disabled={busy}>{busy ? 'Entrando…' : 'Entrar no sistema'} <ArrowRight size={17} /></button>
      </form>
      <p className="login-footnote"><ShieldCheck size={15} /> Acesso restrito a operadores autorizados da biblioteca escolar.</p>
    </div>
    <footer className="login-footer">Instituição Escolar <span>•</span> Biblioteca Escolar <span>•</span> Acesso ao Sistema</footer>
  </main>;
}

function ProtectedLayout() {
  const { user, checking, setUser } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  if (checking) return <div className="login-loading"><LoadingState /></div>;
  if (!user) return <Navigate to="/login" replace />;

  async function logout() {
    try {
      await api('/auth/logout', { method: 'POST' });
      setUser(null);
      navigate('/login', { replace: true });
    } catch (error) {
      window.alert(error.message);
    }
  }

  const navigation = [
    ['Início', '/', LayoutDashboard],
    ['Acervo', '/books', BookOpen],
    ['Usuários', '/users', Users],
    ['Empréstimos', '/loans', ArrowLeftRight],
    ['Devoluções', '/returns', ArrowDownToLine],
    ['Relatórios', '/reports', Activity]
  ];
  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
      <Link to="/" className="brand">
        <span className="brand-mark"><LibraryBig size={25} /></span>
        <span><strong>Biblioteca Escolar</strong><small>GESTÃO INSTITUCIONAL</small></span>
      </Link>
      <nav className="side-nav" aria-label="Navegação principal">
        <span className="nav-caption">MÓDULOS</span>
        {navigation.map(([label, path, Icon]) => <NavLink
          key={path} to={path} end={path === '/'}
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          onClick={() => setMenuOpen(false)}
        ><Icon size={19} /><span>{label}</span></NavLink>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="operator">
          <span className="avatar avatar-small"><UserRound size={17} /></span>
          <span><strong>{user.name}</strong><small>{user.profile}</small></span>
        </div>
        <button className="logout-button" onClick={logout}><LogOut size={17} /> Encerrar sessão</button>
      </div>
    </aside>
    <div className="main-column">
      <header className="topbar">
        <button className="menu-button" onClick={() => setMenuOpen((value) => !value)} aria-label="Abrir navegação"><Menu size={21} /></button>
        <div className="topbar-title"><LibraryBig size={20} /> Sistema de Gestão da Biblioteca</div>
        <div className="topbar-user"><span>{user.name}<small>Operador da Biblioteca</small></span><span className="avatar"><UserRound size={18} /></span></div>
      </header>
      <main className="main-content"><Outlet /></main>
    </div>
  </div>;
}

function DashboardPage() {
  const { data, loading, error } = useResource('/dashboard');
  return <>
    <PageHeading title="Painel da Biblioteca" description="Visão geral e rotinas operacionais da biblioteca escolar."
      action={<div className="action-group"><Link className="button button-secondary" to="/books/new"><BookOpen size={17} /> Cadastrar livro</Link><Link className="button button-secondary" to="/users/new"><UserRoundPlus size={17} /> Cadastrar usuário</Link><Link className="button button-primary" to="/loans/new"><ArrowLeftRight size={17} /> Novo empréstimo</Link></div>} />
    {error ? <ErrorState message={error} /> : loading ? <LoadingState /> : <>
      <section className="stats-grid">
        <StatCard label="Livros cadastrados" value={data.books.total} note="Exemplares no acervo" icon={BookOpen} />
        <StatCard label="Livros disponíveis" value={data.books.available} note="Prontos para circulação" icon={CheckCircle2} tone="green" />
        <StatCard label="Empréstimos ativos" value={data.loans.active} note="Com leitores" icon={ArrowLeftRight} tone="blue" />
        <StatCard label="Empréstimos em atraso" value={data.loans.overdue} note="Pendências de devolução" icon={Clock3} tone="red" />
      </section>
      <section className="dashboard-grid">
        <article className="panel circulation-panel">
          <div className="panel-heading"><div><h2>Índice de circulação do acervo</h2><p className="muted">Distribuição atual dos exemplares</p></div><span className="badge info">{data.books.total ? Math.round(data.books.available / data.books.total * 100) : 0}% disponíveis</span></div>
          <div className="availability-bar" role="img" aria-label={`${data.books.available} exemplares disponíveis de ${data.books.total}`}>
            <span style={{ width: `${data.books.total ? data.books.available / data.books.total * 100 : 0}%` }} />
          </div>
          <div className="bar-legend"><span><i className="legend-dot green" />Disponíveis <b>{data.books.available}</b></span><span><i className="legend-dot blue" />Em circulação <b>{data.loans.active}</b></span><span><i className="legend-dot red" />Em atraso <b>{data.loans.overdue}</b></span></div>
          <div className="info-strip"><ShieldCheck size={17} /> Os prazos são acompanhados pela data prevista de devolução. Não há cobrança de multas.</div>
        </article>
        <article className="panel terminal-card">
          <div className="terminal-art" aria-hidden="true"><LibraryBig size={56} /><span>LEITURA E APRENDIZAGEM</span></div>
          <div className="terminal-copy"><h2>Terminal de circulação</h2><p>Acervo escolar organizado para apoiar a comunidade de leitores.</p><span><Clock3 size={15} /> Gestão local da biblioteca</span></div>
        </article>
      </section>
      <section className="panel">
        <div className="panel-heading"><div><h2>Empréstimos recentes</h2><p className="muted">Acompanhamento das últimas retiradas e prazos de devolução</p></div><Link className="text-link" to="/loans">Ver todos <ArrowRight size={16} /></Link></div>
        <DataTable columns={[
          { key: 'usuario_nome', label: 'Leitor', render: (row) => <div className="person-cell"><span className="avatar-initials">{initials(row.usuario_nome)}</span><span><strong>{row.usuario_nome}</strong><small>{row.matricula}</small></span></div> },
          { key: 'titulo', label: 'Livro', render: (row) => <div><strong>{row.titulo}</strong><small>{row.tombo}</small></div> },
          { key: 'data_saida', label: 'Retirada', render: (row) => formatDate(row.data_saida) },
          { key: 'data_prevista_devolucao', label: 'Devolução prevista', render: (row) => formatDate(row.data_prevista_devolucao) },
          { key: 'status', label: 'Situação', render: (row) => <StatusBadge status={row.status} /> }
        ]} rows={data.latest} loading={false} />
      </section>
    </>}
  </>;
}

function BooksPage() {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data: options } = useResource('/books/options');
  const { data, loading, error } = useResource(`/books${queryString({ q, category, status, page, limit: 10 })}`, [q, category, status, page]);
  const columns = [
    { key: 'titulo', label: 'Título', render: (row) => <div className="title-cell"><strong>{row.titulo}</strong><small>{row.tombo}{row.isbn ? ` · ISBN ${row.isbn}` : ''}</small></div> },
    { key: 'autor', label: 'Autor' },
    { key: 'categoria', label: 'Categoria' },
    { key: 'status_livro', label: 'Situação', render: (row) => <StatusBadge status={row.status_livro} /> },
    { key: 'actions', label: 'Ações', render: (row) => <div className="row-actions"><Link to={`/books/${row.id_livro}`}>Ver</Link><Link to={`/books/${row.id_livro}/edit`}>Editar</Link></div> }
  ];
  return <>
    <PageHeading title="Acervo" description="Consulte e gerencie os exemplares cadastrados no acervo da biblioteca escolar." action={<Link className="button button-primary" to="/books/new"><BookOpen size={17} /> Novo livro</Link>} />
    <section className="panel filter-panel">
      <Field label="Pesquisa bibliográfica"><div className="input-with-icon"><Search size={17} /><input value={q} onChange={(event) => { setQ(event.target.value); setPage(1); }} placeholder="Pesquisar por título, autor, ISBN ou tombo" /></div></Field>
      <Field label="Categoria"><select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}><option value="">Todas as categorias</option>{options?.categories?.map((item) => <option key={item}>{item}</option>)}</select></Field>
      <Field label="Situação"><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">Todas as situações</option><option value="disponivel">Disponível</option><option value="emprestado">Emprestado</option><option value="manutencao">Em manutenção</option></select></Field>
    </section>
    <section className="panel table-panel">
      <DataTable columns={columns} rows={data?.items} loading={loading} error={error} empty="Nenhum exemplar corresponde à busca." />
      {data && <Pagination page={data.page} limit={data.limit} total={data.total} onChange={setPage} />}
    </section>
  </>;
}

function BookFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const formRef = useRef(null);
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [isbnBusy, setIsbnBusy] = useState(false);
  const [isbnMessage, setIsbnMessage] = useState('');
  useEffect(() => {
    if (!id) return;
    api(`/books/${id}`).then(setBook).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false));
  }, [id]);
  if (loading) return <LoadingState />;

  async function lookupIsbn() {
    const form = formRef.current;
    if (!form) return;
    const isbn = form.elements.isbn_lookup.value.trim();
    if (!isbn) { setIsbnMessage('Informe o ISBN para consultar.'); return; }
    setIsbnBusy(true);
    setIsbnMessage('');
    try {
      const metadata = await api(`/isbn/${encodeURIComponent(isbn)}`);
      if (!metadata.found) {
        setIsbnMessage(metadata.message);
        return;
      }
      for (const [name, value] of Object.entries({ titulo: metadata.title, autor: metadata.author, editora: metadata.publisher, ano: metadata.year, isbn: metadata.isbn })) {
        if (value) form.elements[name].value = value;
      }
      setIsbnMessage('Dados encontrados. Revise os campos antes de salvar.');
    } catch (requestError) {
      setIsbnMessage(`${requestError.message} Você ainda pode preencher manualmente.`);
    } finally {
      setIsbnBusy(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      await api(id ? `/books/${id}` : '/books', { method: id ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
      navigate('/books');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return <>
    <Link className="back-link" to="/books"><ArrowLeft size={16} /> Voltar ao acervo</Link>
    <PageHeading title={id ? 'Editar exemplar' : 'Cadastrar livro'} description="Preencha os dados bibliográficos para incluir um exemplar no acervo escolar." />
    <form ref={formRef} id="book-form" className="panel form-panel" onSubmit={submit}>
      <Notice error={error} />
      <div className="isbn-box">
        <div className="panel-heading"><div><h2><Search size={18} /> Consultar dados por ISBN</h2><p className="muted">Busca opcional em catálogo público; o cadastro manual continua disponível.</p></div></div>
        <div className="inline-form"><Field label="ISBN para consulta"><input name="isbn_lookup" defaultValue={book?.isbn || ''} placeholder="Ex.: 9788522031445" /></Field><button type="button" className="button button-secondary" onClick={lookupIsbn} disabled={isbnBusy}>{isbnBusy ? 'Consultando…' : 'Consultar ISBN'}</button></div>
        {isbnMessage && <p className="inline-message" role="status">{isbnMessage}</p>}
      </div>
      {book && <div className="info-strip"><BookOpen size={17} /> Identificador patrimonial: <strong>{book.tombo}</strong></div>}
      <div className="form-grid">
        <Field label="Título da obra" required><input name="titulo" required defaultValue={book?.titulo || ''} /></Field>
        <Field label="Autor principal" required><input name="autor" required defaultValue={book?.autor || ''} /></Field>
        <Field label="Editora"><input name="editora" defaultValue={book?.editora || ''} /></Field>
        <Field label="Ano de publicação"><input name="ano" type="number" min="0" max="3000" defaultValue={book?.ano || ''} /></Field>
        <Field label="ISBN"><input name="isbn" defaultValue={book?.isbn || ''} /></Field>
        <Field label="Categoria" required><input name="categoria" required list="book-categories" defaultValue={book?.categoria || ''} /><datalist id="book-categories"><option>Literatura Brasileira</option><option>Literatura Estrangeira</option><option>Literatura Juvenil</option><option>Didáticos</option></datalist></Field>
        <Field label="Situação inicial" required><select name="status_livro" defaultValue={book?.status_livro || 'disponivel'} disabled={book?.status_livro === 'emprestado'}><option value="disponivel">Disponível</option><option value="manutencao">Em manutenção</option>{book?.status_livro === 'emprestado' && <option value="emprestado">Emprestado</option>}</select></Field>
      </div>
      {!id && <div className="info-strip"><LibraryBig size={17} /> Um código patrimonial sequencial será gerado ao salvar.</div>}
      <div className="form-actions"><Link className="button button-quiet" to="/books">Cancelar</Link><button className="button button-primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar exemplar'} <Check size={17} /></button></div>
    </form>
  </>;
}

function BookDetailsPage() {
  const { id } = useParams();
  const { data: book, loading, error } = useResource(`/books/${id}`);
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  return <>
    <Link className="back-link" to="/books"><ArrowLeft size={16} /> Voltar ao acervo</Link>
    <PageHeading title={book.titulo} description="Detalhes do exemplar cadastrado." action={<Link className="button button-primary" to={`/books/${id}/edit`}>Editar exemplar</Link>} />
    <section className="panel detail-grid">
      <Detail label="Tombo patrimonial" value={book.tombo} /><Detail label="Autor" value={book.autor} /><Detail label="Editora" value={book.editora} /><Detail label="Ano" value={book.ano} /><Detail label="ISBN" value={book.isbn} /><Detail label="Categoria" value={book.categoria} /><Detail label="Situação" value={<StatusBadge status={book.status_livro} />} />
    </section>
  </>;
}

function UsersPage() {
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [className, setClassName] = useState('');
  const [page, setPage] = useState(1);
  const { data: stats } = useResource('/users/stats');
  const { data, loading, error } = useResource(`/users${queryString({ q, type, class: className, page, limit: 10 })}`, [q, type, className, page]);
  const columns = [
    { key: 'nome', label: 'Nome', render: (row) => <div className="person-cell"><span className="avatar-initials">{initials(row.nome)}</span><span><strong>{row.nome}</strong><small>{row.ativo ? 'Cadastro ativo' : 'Cadastro inativo'}</small></span></div> },
    { key: 'matricula', label: 'Matrícula', render: (row) => <code>{row.matricula}</code> },
    { key: 'turma', label: 'Turma / vínculo' },
    { key: 'tipo_usuario', label: 'Tipo', render: (row) => <span className="badge info">{row.tipo_usuario}</span> },
    { key: 'actions', label: 'Ações', render: (row) => <div className="row-actions"><Link to={`/users/${row.id_usuario}`}>Ver</Link><Link to={`/users/${row.id_usuario}/edit`}>Editar</Link></div> }
  ];
  return <>
    <PageHeading title="Usuários cadastrados" description="Gerencie os leitores da comunidade escolar autorizados a utilizar a biblioteca." action={<Link className="button button-primary" to="/users/new"><UserRoundPlus size={17} /> Novo usuário</Link>} />
    <div className="stats-grid stats-compact">
      <StatCard label="Total de leitores" value={stats?.total} icon={Users} />
      <StatCard label="Alunos ativos" value={stats?.students} icon={UserRound} tone="green" />
      <StatCard label="Corpo docente" value={stats?.teachers} icon={LibraryBig} tone="blue" />
      <StatCard label="Servidores" value={stats?.staff} icon={Wrench} tone="slate" />
    </div>
    <section className="panel filter-panel">
      <Field label="Pesquisar leitores"><div className="input-with-icon"><Search size={17} /><input value={q} onChange={(event) => { setQ(event.target.value); setPage(1); }} placeholder="Pesquisar por nome ou matrícula" /></div></Field>
      <Field label="Tipo de usuário"><select value={type} onChange={(event) => { setType(event.target.value); setPage(1); }}><option value="">Todos os tipos</option><option>Aluno</option><option>Professor</option><option>Servidor</option></select></Field>
      <Field label="Turma ou vínculo"><select value={className} onChange={(event) => { setClassName(event.target.value); setPage(1); }}><option value="">Todas as turmas</option>{stats?.classes?.map((item) => <option key={item}>{item}</option>)}</select></Field>
    </section>
    <section className="panel table-panel">
      <DataTable columns={columns} rows={data?.items} loading={loading} error={error} empty="Nenhum leitor corresponde à busca." />
      {data && <Pagination page={data.page} limit={data.limit} total={data.total} onChange={setPage} />}
    </section>
  </>;
}

function UserFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!id) return;
    api(`/users/${id}`).then(setPerson).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false));
  }, [id]);
  if (loading) return <LoadingState />;
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      await api(id ? `/users/${id}` : '/users', { method: id ? 'PATCH' : 'POST', body: JSON.stringify(form) });
      navigate('/users');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }
  return <>
    <Link className="back-link" to="/users"><ArrowLeft size={16} /> Voltar para usuários</Link>
    <PageHeading title={id ? 'Editar usuário' : 'Cadastrar usuário'} description="Preencha os dados do leitor para registrar ou atualizar o cadastro escolar." />
    <form className="panel form-panel form-narrow" onSubmit={submit}>
      <Notice error={error} />
      <div className="form-grid">
        <Field label="Nome completo" required><input name="nome" required defaultValue={person?.nome || ''} /></Field>
        <Field label="Matrícula / RA" required><input name="matricula" required defaultValue={person?.matricula || ''} /></Field>
        <Field label="Turma ou setor"><input name="turma" defaultValue={person?.turma || ''} placeholder="Ex.: 7º Ano A ou Secretaria" /></Field>
        <Field label="Tipo de usuário" required><select name="tipo_usuario" required defaultValue={person?.tipo_usuario || 'Aluno'}><option>Aluno</option><option>Professor</option><option>Servidor</option></select></Field>
        {id && <Field label="Situação do cadastro"><select name="ativo" defaultValue={String(person?.ativo)}><option value="true">Ativo</option><option value="false">Inativo</option></select></Field>}
      </div>
      <div className="info-strip"><ShieldCheck size={17} /> O sistema registra os empréstimos e prazos; o MVP não aplica cotas por tipo de leitor.</div>
      <div className="form-actions"><Link className="button button-quiet" to="/users">Cancelar</Link><button className="button button-primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar usuário'} <Check size={17} /></button></div>
    </form>
  </>;
}

function UserDetailsPage() {
  const { id } = useParams();
  const { data: person, loading, error } = useResource(`/users/${id}`);
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  return <>
    <Link className="back-link" to="/users"><ArrowLeft size={16} /> Voltar para usuários</Link>
    <PageHeading title={person.nome} description="Dados do leitor cadastrado." action={<Link className="button button-primary" to={`/users/${id}/edit`}>Editar usuário</Link>} />
    <section className="panel detail-grid"><Detail label="Matrícula" value={person.matricula} /><Detail label="Turma / vínculo" value={person.turma} /><Detail label="Tipo de usuário" value={person.tipo_usuario} /><Detail label="Situação" value={person.ativo ? 'Ativo' : 'Inativo'} /></section>
  </>;
}

function LoansPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data: stats } = useResource('/loans/stats');
  const { data, loading, error } = useResource(`/loans${queryString({ q, status, page, limit: 10 })}`, [q, status, page]);
  const columns = [
    { key: 'usuario_nome', label: 'Leitor', render: (row) => <div className="person-cell"><span className="avatar-initials">{initials(row.usuario_nome)}</span><span><strong>{row.usuario_nome}</strong><small>{row.matricula} · {row.turma || row.tipo_usuario}</small></span></div> },
    { key: 'titulo', label: 'Livro / exemplar', render: (row) => <div><strong>{row.titulo}</strong><small>{row.tombo}</small></div> },
    { key: 'data_saida', label: 'Data de retirada', render: (row) => formatDate(row.data_saida) },
    { key: 'data_prevista_devolucao', label: 'Devolução prevista', render: (row) => <span className={row.status === 'atrasado' ? 'text-danger' : ''}>{formatDate(row.data_prevista_devolucao)}</span> },
    { key: 'status', label: 'Situação', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'action', label: 'Ação', render: (row) => row.status === 'devolvido' ? <span className="muted">Devolvido {formatDate(row.data_devolucao_real)}</span> : <Link className="button button-quiet button-small" to={`/loans/${row.id_emprestimo}/return`}>Registrar devolução</Link> }
  ];
  return <>
    <PageHeading title="Empréstimos" description="Controle de circulação, prazos de devolução e acompanhamento dos exemplares emprestados." action={<Link className="button button-primary" to="/loans/new"><ArrowLeftRight size={17} /> Novo empréstimo</Link>} />
    <div className="stats-grid stats-compact">
      <StatCard label="Volume total" value={stats?.total} icon={BookOpen} />
      <StatCard label="Em circulação" value={stats?.active} icon={ArrowLeftRight} tone="blue" />
      <StatCard label="Em atraso" value={stats?.overdue} icon={Clock3} tone="red" />
      <StatCard label="Devolvidos" value={stats?.returned} icon={CheckCircle2} tone="green" />
    </div>
    <section className="panel filter-panel loan-filters">
      <div className="filter-chips" role="group" aria-label="Filtrar empréstimos">
        {[['', 'Todos'], ['active', 'Ativos'], ['overdue', 'Em atraso'], ['returned', 'Devolvidos']].map(([value, label]) =>
          <button key={value} className={`filter-chip ${status === value ? 'selected' : ''}`} onClick={() => { setStatus(value); setPage(1); }}>{label}</button>)}
      </div>
      <Field label="Pesquisar empréstimos"><div className="input-with-icon"><Search size={17} /><input value={q} onChange={(event) => { setQ(event.target.value); setPage(1); }} placeholder="Pesquisar por leitor, matrícula ou livro" /></div></Field>
    </section>
    <section className="panel table-panel">
      <DataTable columns={columns} rows={data?.items} loading={loading} error={error} empty="Nenhum empréstimo corresponde ao filtro." />
      {data && <Pagination page={data.page} limit={data.limit} total={data.total} onChange={setPage} />}
    </section>
    <div className="info-strip"><ShieldCheck size={17} /> A biblioteca não aplica multas. O sistema indica o atraso para acompanhamento do operador.</div>
  </>;
}

function ReturnsPage() {
  const { data, loading, error } = useResource('/loans?status=open&limit=50');
  const columns = [
    { key: 'usuario_nome', label: 'Leitor', render: (row) => <div className="person-cell"><span className="avatar-initials">{initials(row.usuario_nome)}</span><span><strong>{row.usuario_nome}</strong><small>{row.matricula} · {row.turma || row.tipo_usuario}</small></span></div> },
    { key: 'titulo', label: 'Livro / exemplar', render: (row) => <div><strong>{row.titulo}</strong><small>{row.tombo}</small></div> },
    { key: 'data_saida', label: 'Retirada', render: (row) => formatDate(row.data_saida) },
    { key: 'data_prevista_devolucao', label: 'Prazo previsto', render: (row) => formatDate(row.data_prevista_devolucao) },
    { key: 'status', label: 'Situação', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'action', label: 'Ação', render: (row) => <Link className="button button-quiet button-small" to={`/loans/${row.id_emprestimo}/return`}>Registrar devolução</Link> }
  ];
  return <>
    <PageHeading title="Devoluções" description="Localize empréstimos em circulação e registre o retorno do exemplar." />
    <section className="panel table-panel">
      <DataTable columns={columns} rows={data?.items} loading={loading} error={error} empty="Não há exemplares aguardando devolução." />
      {data && <div className="pagination"><span>{data.total} empréstimos em circulação</span><Link className="text-link" to="/loans">Ver todos os empréstimos <ArrowRight size={16} /></Link></div>}
    </section>
    <div className="info-strip"><ShieldCheck size={17} /> A confirmação da devolução atualiza o histórico e libera o exemplar para nova circulação.</div>
  </>;
}

function NewLoanPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [userQuery, setUserQuery] = useState('');
  const [bookQuery, setBookQuery] = useState('');
  const [readers, setReaders] = useState([]);
  const [books, setBooks] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => {
    api(`/users${queryString({ q: userQuery, limit: 8, activeOnly: true })}`).then((result) => setReaders(result.items)).catch((requestError) => setError(requestError.message));
  }, [userQuery]);
  useEffect(() => {
    api(`/books${queryString({ q: bookQuery, status: 'disponivel', limit: 8 })}`).then((result) => setBooks(result.items)).catch((requestError) => setError(requestError.message));
  }, [bookQuery]);
  async function confirmLoan() {
    setBusy(true);
    setError('');
    try {
      const loan = await api('/loans', { method: 'POST', body: JSON.stringify({ userId: selectedUser.id_usuario, bookId: selectedBook.id_livro }) });
      setSuccess(`Empréstimo registrado. Devolução prevista: ${formatDate(loan.data_prevista_devolucao)}.`);
      window.setTimeout(() => navigate('/loans'), 1200);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }
  return <>
    <Link className="back-link" to="/loans"><ArrowLeft size={16} /> Voltar para empréstimos</Link>
    <PageHeading title="Registrar empréstimo" description="Identifique o leitor, selecione o exemplar e confirme a retirada." />
    <div className="steps">
      {['Identificar leitor', 'Selecionar livro', 'Confirmar empréstimo'].map((label, index) => <div key={label} className={`step ${step === index + 1 ? 'current' : step > index + 1 ? 'complete' : ''}`}><span>{step > index + 1 ? <Check size={16} /> : index + 1}</span>{label}</div>)}
    </div>
    <section className="panel workflow-panel">
      <Notice error={error} success={success} />
      {step === 1 && <><div className="panel-heading"><div><h2><Users size={19} /> Etapa 1 — Identificar leitor</h2><p className="muted">Pesquise pelo nome ou matrícula.</p></div></div>
        <div className="input-with-icon"><Search size={17} /><input value={userQuery} onChange={(event) => setUserQuery(event.target.value)} placeholder="Nome ou matrícula do leitor" /></div>
        <div className="select-list">{readers.map((person) => <button type="button" key={person.id_usuario} className={`select-row ${selectedUser?.id_usuario === person.id_usuario ? 'chosen' : ''}`} onClick={() => setSelectedUser(person)}><span className="avatar-initials">{initials(person.nome)}</span><span><strong>{person.nome}</strong><small>{person.matricula} · {person.turma || person.tipo_usuario}</small></span><span className="select-check">{selectedUser?.id_usuario === person.id_usuario && <CheckCircle2 size={20} />}</span></button>)}{!readers.length && <EmptyState>Nenhum leitor ativo foi encontrado.</EmptyState>}</div>
        <div className="form-actions"><span /> <button className="button button-primary" disabled={!selectedUser} onClick={() => setStep(2)}>Continuar <ArrowRight size={17} /></button></div>
      </>}
      {step === 2 && <><div className="panel-heading"><div><h2><BookOpen size={19} /> Etapa 2 — Selecionar exemplar</h2><p className="muted">Apenas exemplares disponíveis podem ser emprestados.</p></div></div>
        <div className="selected-summary"><strong>{selectedUser?.nome}</strong><span>{selectedUser?.matricula}</span></div>
        <div className="input-with-icon"><Search size={17} /><input value={bookQuery} onChange={(event) => setBookQuery(event.target.value)} placeholder="Pesquisar por título, autor, ISBN ou tombo" /></div>
        <div className="select-list">{books.map((book) => <button type="button" key={book.id_livro} className={`select-row ${selectedBook?.id_livro === book.id_livro ? 'chosen' : ''}`} onClick={() => setSelectedBook(book)}><span className="avatar book-avatar"><BookOpen size={19} /></span><span><strong>{book.titulo}</strong><small>{book.autor} · {book.tombo} · {book.categoria}</small></span><span className="badge success">Disponível</span></button>)}{!books.length && <EmptyState>Não há exemplares disponíveis com esse critério.</EmptyState>}</div>
        <div className="form-actions"><button className="button button-quiet" onClick={() => setStep(1)}><ArrowLeft size={17} /> Voltar</button><button className="button button-primary" disabled={!selectedBook} onClick={() => setStep(3)}>Continuar <ArrowRight size={17} /></button></div>
      </>}
      {step === 3 && <><div className="panel-heading"><div><h2><CalendarDays size={19} /> Etapa 3 — Confirmar empréstimo</h2><p className="muted">Confira os dados antes de registrar a retirada.</p></div></div>
        <div className="detail-grid workflow-details"><Detail label="Leitor" value={`${selectedUser?.nome} · ${selectedUser?.matricula}`} /><Detail label="Exemplar" value={`${selectedBook?.titulo} · ${selectedBook?.tombo}`} /><Detail label="Data da retirada" value={formatDate(today())} /><Detail label="Devolução prevista" value={formatDate(addDays(today(), 14))} /></div>
        <div className="info-strip"><ShieldCheck size={17} /> Prazo padrão de 14 dias corridos. Não há cobrança de multa.</div>
        <div className="form-actions"><button className="button button-quiet" onClick={() => setStep(2)}><ArrowLeft size={17} /> Voltar</button><button className="button button-primary" disabled={busy || Boolean(success)} onClick={confirmLoan}>{busy ? 'Registrando…' : 'Confirmar empréstimo'} <Check size={17} /></button></div>
      </>}
    </section>
  </>;
}

function ReturnPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: loan, loading, error: listError } = useResource(`/loans/${id}`);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (loading) return <LoadingState />;
  if (listError) return <ErrorState message={listError} />;
  if (!loan) return <ErrorState message="Empréstimo não encontrado na lista atual." />;
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      await api(`/loans/${id}/return`, { method: 'POST', body: JSON.stringify({ returnedDate: form.get('date'), notes: form.get('notes') }) });
      navigate('/loans');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }
  return <>
    <Link className="back-link" to="/loans"><ArrowLeft size={16} /> Voltar para empréstimos</Link>
    <PageHeading title="Registrar devolução" description="Confirme o recebimento do exemplar e atualize a circulação no acervo." />
    <form className="panel form-panel form-narrow return-panel" onSubmit={submit}>
      <div className="return-intro"><span className="icon-tile"><ArrowDownToLine size={21} /></span><div><h2>Confirmação de devolução</h2><p className="muted">Operação de empréstimo #{loan.id_emprestimo}</p></div></div>
      <div className="info-strip"><CircleAlert size={17} /> Confira o estado físico do livro e confirme o recebimento do exemplar.</div>
      <div className="detail-grid"><Detail label="Leitor cadastrado" value={`${loan.usuario_nome} · ${loan.matricula}`} /><Detail label="Obra e tombo" value={`${loan.titulo} · ${loan.tombo}`} /><Detail label="Data da retirada" value={formatDate(loan.data_saida)} /><Detail label="Data prevista" value={formatDate(loan.data_prevista_devolucao)} /></div>
      <StatusBadge status={loan.status} />
      <Notice error={error} />
      <div className="form-grid">
        <Field label="Data efetiva da devolução" required><input name="date" type="date" required defaultValue={today()} max={today()} /></Field>
        <Field label="Observações sobre conservação"><textarea name="notes" rows="3" placeholder="Observação opcional sobre o estado do exemplar" /></Field>
      </div>
      <label className="checkbox-row"><input type="checkbox" required /> Exemplar conferido e liberado para retornar ao acervo</label>
      <div className="form-actions"><Link className="button button-quiet" to="/loans">Cancelar</Link><button className="button button-primary" disabled={busy}>{busy ? 'Confirmando…' : 'Confirmar devolução'} <Check size={17} /></button></div>
    </form>
  </>;
}

function ReportsPage() {
  const [days, setDays] = useState('30');
  const [category, setCategory] = useState('');
  const { data, loading, error } = useResource(`/reports${queryString({ days, category })}`, [days, category]);
  return <>
    <PageHeading eyebrow="ESTATÍSTICAS DO ACERVO E CIRCULAÇÃO" title="Relatórios de circulação" description="Indicadores para acompanhar empréstimos e utilização do acervo." />
    <section className="panel filter-panel report-filters">
      <Field label="Período de análise"><select value={days} onChange={(event) => setDays(event.target.value)}><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option><option value="180">Últimos 6 meses</option><option value="365">Último ano</option></select></Field>
      <Field label="Categoria do acervo"><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Todas as categorias</option>{data?.categoryOptions?.map((item) => <option key={item}>{item}</option>)}</select></Field>
    </section>
    {error ? <ErrorState message={error} /> : loading ? <LoadingState /> : <>
      <div className="stats-grid">
        <StatCard label="Empréstimos no período" value={data.totals.loans} note={`Últimos ${data.periodDays} dias`} icon={ArrowLeftRight} />
        <StatCard label="Em atraso" value={data.totals.overdue} note="Pendências abertas" icon={CircleAlert} tone="red" />
        <StatCard label="Devolvidos no prazo" value={data.totals.on_time_returns} note="Histórico de circulação" icon={CheckCircle2} tone="green" />
        <StatCard label="Livro mais emprestado" value={data.mostBorrowed?.titulo || '—'} note={data.mostBorrowed?.autor || 'Sem empréstimos no período'} icon={BookOpen} tone="blue" />
      </div>
      <div className="dashboard-grid">
        <section className="panel chart-panel"><div className="panel-heading"><div><h2>Circulação por categoria</h2><p className="muted">Empréstimos registrados no período</p></div></div>
          {!data.categories.length ? <EmptyState>Não há movimentações nesse período.</EmptyState> : <div className="horizontal-chart">{data.categories.map((item) => { const max = Math.max(1, ...data.categories.map((entry) => entry.loans)); return <div className="chart-row" key={item.categoria}><div><span>{item.categoria}</span><b>{item.loans}</b></div><div className="chart-track"><span style={{ width: `${item.loans / max * 100}%` }} /></div></div>; })}</div>}
        </section>
        <section className="panel chart-panel"><div className="panel-heading"><div><h2>Movimentação mensal</h2><p className="muted">Empréstimos e devoluções por mês</p></div></div>
          {!data.monthly.length ? <EmptyState>Não há movimentações nesse período.</EmptyState> : <div className="monthly-chart">{data.monthly.map((item) => { const max = Math.max(1, ...data.monthly.flatMap((entry) => [entry.loans, entry.returned])); return <div className="month-column" key={item.month}><div className="month-bars"><span className="loan-bar" style={{ height: `${item.loans / max * 100}%` }} title={`${item.loans} empréstimos`} /><span className="return-bar" style={{ height: `${item.returned / max * 100}%` }} title={`${item.returned} devoluções`} /></div><small>{item.month}</small></div>; })}</div>}
          <div className="bar-legend"><span><i className="legend-dot blue" />Empréstimos</span><span><i className="legend-dot neutral-dot" />Devoluções</span></div>
        </section>
      </div>
      <section className="panel table-panel"><div className="panel-heading"><div><h2>Resumo da circulação por categoria</h2><p className="muted">Dados consolidados a partir dos empréstimos registrados.</p></div></div>
        <DataTable columns={[
          { key: 'categoria', label: 'Categoria' },
          { key: 'loans', label: 'Empréstimos no período' },
          { key: 'returned', label: 'Devoluções registradas' },
          { key: 'rate', label: 'Índice de devolução', render: (row) => `${row.loans ? Math.round(row.returned / row.loans * 100) : 0}%` }
        ]} rows={data.categories} loading={false} empty="Sem dados para este período." />
      </section>
    </>}
    <div className="info-strip"><ShieldCheck size={17} /> Relatório gerado a partir dos registros do sistema para acompanhamento acadêmico da biblioteca.</div>
  </>;
}

function Detail({ label, value }) {
  return <div className="detail"><span>{label}</span><strong>{value || '—'}</strong></div>;
}

export { App };
