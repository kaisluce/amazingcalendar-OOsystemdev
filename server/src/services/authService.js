const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/prisma');
const { env } = require('../config/env');

const SALT_ROUNDS = 10;

async function registerUser({ name, email, password }) {
  console.log('[AuthService] registerUser called', { email });
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.warn('[AuthService] registerUser email already exists', { email });
    throw new Error('Email already registered');
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
    select: { id: true, name: true, email: true }
  });
  return user;
}

async function loginUser({ email, password }) {
  console.log('[AuthService] loginUser called', { email });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.warn('[AuthService] loginUser user not found', { email });
    throw new Error('Invalid credentials');
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    console.warn('[AuthService] loginUser invalid password', { email });
    throw new Error('Invalid credentials');
  }

  const token = jwt.sign({ sub: user.id, email: user.email }, env.jwtSecret, {
    expiresIn: env.jwtExpiration
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  };
}

module.exports = { registerUser, loginUser };
