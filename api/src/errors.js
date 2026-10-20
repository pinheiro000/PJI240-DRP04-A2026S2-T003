export class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function handleError(error, _request, response, _next) {
  if (response.headersSent) return;
  if (error instanceof AppError) {
    response.status(error.status).json({ error: error.message });
    return;
  }

  console.error(error);
  response.status(500).json({ error: 'Ocorreu um erro interno. Tente novamente.' });
}
