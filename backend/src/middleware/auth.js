import { User } from '../models/User.js';
import { verifyToken } from '../utils/tokens.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [, token] = header.split(' ');

    if (!token) {
      return res.status(401).json({ message: 'Missing authorization token' });
    }

    const payload = verifyToken(token);
    const user = await User.findById(payload.sub).select('-passwordHash');

    if (!user) {
      return res.status(401).json({ message: 'Invalid session' });
    }

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid authorization token' });
  }
}
