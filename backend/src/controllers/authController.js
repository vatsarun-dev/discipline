import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User.js';
import { signToken } from '../utils/tokens.js';

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function signup(req, res) {
  const input = signupSchema.parse(req.body);
  const existing = await User.findOne({ email: input.email });

  if (existing) {
    return res.status(409).json({ message: 'Email is already registered' });
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await User.create({ name: input.name, email: input.email, passwordHash });
  const token = signToken(user);

  return res.status(201).json({ token, user: sanitizeUser(user) });
}

export async function login(req, res) {
  const input = loginSchema.parse(req.body);
  const user = await User.findOne({ email: input.email });

  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  return res.json({ token: signToken(user), user: sanitizeUser(user) });
}

export function me(req, res) {
  return res.json({ user: req.user });
}

export async function updateOnboarding(req, res) {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { onboarding: req.body } },
    { new: true, runValidators: true }
  ).select('-passwordHash');

  return res.json({ user });
}

function sanitizeUser(user) {
  const object = user.toObject();
  delete object.passwordHash;
  return object;
}
