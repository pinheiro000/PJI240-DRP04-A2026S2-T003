export const USER_TYPES = ['Aluno', 'Professor', 'Servidor'];
export const BOOK_STATUSES = ['disponivel', 'emprestado', 'manutencao'];

export function todayInSaoPaulo(date = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(date);
}

export function addCalendarDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function isOverdue(dueDate, returnedDate, today = todayInSaoPaulo()) {
  return !returnedDate && dueDate < today;
}

export function loanStatus(loan, today = todayInSaoPaulo()) {
  if (loan.data_devolucao_real) return 'devolvido';
  return isOverdue(loan.data_prevista_devolucao, null, today) ? 'atrasado' : 'ativo';
}

export function normalizeBookStatus(value) {
  const statuses = {
    Disponível: 'disponivel',
    'Em manutenção': 'manutencao',
    Emprestado: 'emprestado',
    disponivel: 'disponivel',
    emprestado: 'emprestado',
    manutencao: 'manutencao'
  };
  return statuses[value] || null;
}
