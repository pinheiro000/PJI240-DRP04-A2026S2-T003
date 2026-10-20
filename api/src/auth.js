import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { AppError } from './errors.js';

const cookieName = 'biblioteca_session';

export function createSessionCookie(response, access, remember = false) {
  const token = jwt.sign(
    { id: access.id_acesso, login: access.login, profile: access.perfil_acesso },
    config.jwtSecret,
    { expiresIn: remember ? '7d' : '12h' }
  );
  response.cookie(cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.nodeEnv === 'production',
    maxAge: remember ? 7 * 24 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000,
    path: '/'
  });
}

export function clearSessionCookie(response) {
  response.clearCookie(cookieName, { httpOnly: true, sameSite: 'lax', path: '/' });
}

export function requireAuth(request, _response, next) {
  const token = request.cookies[cookieName];
  if (!token) return next(new AppError(401, 'Entre no sistema para continuar.'));

  try {
    request.access = jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    next(new AppError(401, 'Sua sessão expirou. Entre novamente.'));
  }
}

export function optionalAuth(request, response, next) {
  const token = request.cookies[cookieName];
  if (!token) {
    request.access = null;
    return next();
  }

  try {
    request.access = jwt.verify(token, config.jwtSecret);
    next();
  } catch (error) {
    if (!(error instanceof jwt.JsonWebTokenError)) return next(error);
    clearSessionCookie(response);
    request.access = null;
    next();
  }
}
