// src/lib/auth.js
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production-min-32-chars'
);
const OTP_SECRET = process.env.OTP_SECRET || 'fallback-otp-secret-change-in-production';

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function hashOtp(email, otp) {
  return crypto
    .createHash('sha256')
    .update(`${email.toLowerCase()}:${otp}:${OTP_SECRET}`)
    .digest('hex');
}

export function verifyOtpHash(email, otp, otpHash) {
  const candidate = hashOtp(email, otp);
  const left = Buffer.from(candidate, 'hex');
  const right = Buffer.from(otpHash, 'hex');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export async function createToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

export function getTokenFromCookies(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [key, ...val] = c.trim().split('=');
      return [key, val.join('=')];
    })
  );
  return cookies['auth-token'] || null;
}

export async function getUserFromRequest(request) {
  const token = getTokenFromCookies(request);
  if (!token) return null;
  return verifyToken(token);
}
