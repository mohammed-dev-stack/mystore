// backend/src/tests/auth.test.ts
/**
 * Why this test file?
 * - Unit tests for authentication service (register, login, password reset)
 * - Uses Jest as testing framework with supertest for API endpoints
 * - Uses in-memory MongoDB for isolated tests (no real database needed)
 * - Tests cover success scenarios, validation errors, and edge cases
 */
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import User from '../models/user.model.js';
let mongoServer;
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
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.token).toBeDefined();
            expect(res.body.user.email).toBe('test@example.com');
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
            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/already registered/i);
        });
        it('should return 400 if required fields missing', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ email: 'test@example.com' });
            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/required/i);
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
            expect(res.status).toBe(200);
            expect(res.body.token).toBeDefined();
            expect(res.body.user.email).toBe('login@example.com');
        });
        it('should return 401 with wrong password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'login@example.com', password: 'wrongpassword' });
            expect(res.status).toBe(401);
            expect(res.body.message).toMatch(/invalid credentials/i);
        });
        it('should return 401 for non-existent email', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'nonexistent@example.com', password: 'password123' });
            expect(res.status).toBe(401);
        });
    });
    describe('GET /api/auth/profile', () => {
        let token;
        beforeEach(async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                fullName: 'Profile User',
                email: 'profile@example.com',
                password: 'password123',
            });
            token = res.body.token;
        });
        it('should return user profile with valid token', async () => {
            const res = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(res.body.data.email).toBe('profile@example.com');
        });
        it('should return 401 without token', async () => {
            const res = await request(app).get('/api/auth/profile');
            expect(res.status).toBe(401);
        });
    });
});
//# sourceMappingURL=auth.test.js.map