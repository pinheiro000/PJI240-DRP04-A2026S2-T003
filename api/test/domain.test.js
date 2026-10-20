import test from 'node:test';
import assert from 'node:assert/strict';
import { addCalendarDays, isOverdue, loanStatus, normalizeBookStatus, todayInSaoPaulo } from '../src/domain.js';

test('calcula prazo de 14 dias respeitando a virada do mês', () => {
  assert.equal(addCalendarDays('2026-10-24', 14), '2026-11-07');
});

test('trata empréstimos vencidos, ativos e devolvidos', () => {
  assert.equal(isOverdue('2026-10-16', null, '2026-10-17'), true);
  assert.equal(isOverdue('2026-10-17', null, '2026-10-17'), false);
  assert.equal(loanStatus({ data_prevista_devolucao: '2026-10-16', data_devolucao_real: null }, '2026-10-17'), 'atrasado');
  assert.equal(loanStatus({ data_prevista_devolucao: '2026-10-17', data_devolucao_real: null }, '2026-10-17'), 'ativo');
  assert.equal(loanStatus({ data_prevista_devolucao: '2026-10-01', data_devolucao_real: '2026-10-10' }, '2026-10-17'), 'devolvido');
});

test('normaliza os estados usados pelo formulário e pelo banco', () => {
  assert.equal(normalizeBookStatus('Disponível'), 'disponivel');
  assert.equal(normalizeBookStatus('Em manutenção'), 'manutencao');
  assert.equal(normalizeBookStatus('unknown'), null);
});

test('fornece uma data local no padrão ISO para a operação da biblioteca', () => {
  assert.match(todayInSaoPaulo(new Date('2026-10-17T03:00:00.000Z')), /^\d{4}-\d{2}-\d{2}$/);
});
