// backend/src/tests/auth.test.ts
/**
 * Why this test file?
 * - Integration tests for authentication endpoints (register, login, profile)
 * - Uses Vitest as test runner (compatible with Jest API)
 * - Uses in‑memory MongoDB for isolated tests (no real database needed)
 * - Tests cover success scenarios, validation errors, and edge cases
 *
 * Required devDependencies:
 *   - vitest
 *   - supertest
 *   - mongodb-memory-server
 *   - @types/supertest
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import User from '../models/user.model.js';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

// Helper interfaces for response bodies (improves type safety)
interface AuthResponse {
  success: boolean;
  token?: string;
  user?: { email: string; fullName: string; role: string };
  message?: string;
}

interface ProfileResponse {
  success: boolean;
  data?: { email: string; fullName: string; role: string };
  message?: string;
}

describe('Auth Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user and return token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        });
      const body = res.body as AuthResponse;
      expect(res.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.token).toBeDefined();
      expect(body.user?.email).toBe('test@example.com');
    });

    it('should return 400 if email already exists', async () => {
      await User.create({
        fullName: 'Existing User',
        email: 'existing@example.com',
        password: 'hashedpassword',
      });
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Another User',
          email: 'existing@example.com',
          password: 'password123',
        });
      const body = res.body as AuthResponse;
      expect(res.status).toBe(400);
      expect(body.message).toMatch(/already registered/i);
    });

    it('should return 400 if required fields missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' });
      const body = res.body as AuthResponse;
      expect(res.status).toBe(400);
      expect(body.message).toMatch(/required/i);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Login User',
          email: 'login@example.com',
          password: 'password123',
        });
    });

    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@example.com', password: 'password123' });
      const body = res.body as AuthResponse;
      expect(res.status).toBe(200);
      expect(body.token).toBeDefined();
      expect(body.user?.email).toBe('login@example.com');
    });

    it('should return 401 with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@example.com', password: 'wrongpassword' });
      const body = res.body as AuthResponse;
      expect(res.status).toBe(401);
      expect(body.message).toMatch(/invalid credentials/i);
    });

    it('should return 401 for non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' });
      const body = res.body as AuthResponse;
      expect(res.status).toBe(401);
      // No message expectation needed; the controller returns a generic 401
    });
  });

  describe('GET /api/auth/profile', () => {
    let token: string;
    beforeEach(async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Profile User',
          email: 'profile@example.com',
          password: 'password123',
        });
      const body = res.body as AuthResponse;
      token = body.token!;
    });

    it('should return user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);
      const body = res.body as ProfileResponse;
      expect(res.status).toBe(200);
      expect(body.data?.email).toBe('profile@example.com');
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/auth/profile');
      const body = res.body as AuthResponse;
      expect(res.status).toBe(401);
    });
  });
});