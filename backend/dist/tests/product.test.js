// backend/src/tests/product.test.ts
/**
 * Why this test file?
 * - Unit tests for product service and API endpoints
 * - Tests CRUD operations, filtering, pagination, and admin access
 * - Uses in-memory MongoDB for isolated testing
 * - Verifies authentication and authorization for admin routes
 */
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import User from '../models/user.model.js';
import Product from '../models/product.model.js';
let mongoServer;
let adminToken;
let userToken;
let productId;
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
    await Product.deleteMany({});
    // Create admin user and get token
    const adminRes = await request(app)
        .post('/api/auth/register')
        .send({
        fullName: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
    });
    adminToken = adminRes.body.token;
    // Set admin role
    await User.findOneAndUpdate({ email: 'admin@example.com' }, { role: 'admin' });
    // Create regular user and get token
    const userRes = await request(app)
        .post('/api/auth/register')
        .send({
        fullName: 'Regular User',
        email: 'user@example.com',
        password: 'user123',
    });
    userToken = userRes.body.token;
    // Create a sample product (by admin)
    const productRes = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
        name: 'Test Product',
        description: 'A great test product',
        price: 99.99,
        category: 'electronics',
        inventory: { quantity: 10 },
    });
    productId = productRes.body.data._id;
});
describe('Product Endpoints', () => {
    describe('GET /api/products', () => {
        it('should return paginated products', async () => {
            const res = await request(app).get('/api/products?page=1&limit=10');
            expect(res.status).toBe(200);
            expect(res.body.products).toHaveLength(1);
            expect(res.body.total).toBe(1);
        });
        it('should filter by category', async () => {
            const res = await request(app).get('/api/products?category=electronics');
            expect(res.status).toBe(200);
            expect(res.body.products[0].category).toBe('electronics');
        });
        it('should filter by price range', async () => {
            const res = await request(app).get('/api/products?minPrice=50&maxPrice=150');
            expect(res.status).toBe(200);
            expect(res.body.products).toHaveLength(1);
        });
    });
    describe('GET /api/products/:id', () => {
        it('should return single product', async () => {
            const res = await request(app).get(`/api/products/${productId}`);
            expect(res.status).toBe(200);
            expect(res.body.data.name).toBe('Test Product');
        });
        it('should return 404 for invalid id', async () => {
            const res = await request(app).get('/api/products/507f1f77bcf86cd799439011');
            expect(res.status).toBe(404);
        });
    });
    describe('POST /api/products (admin only)', () => {
        it('should create product when admin', async () => {
            const res = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                name: 'New Product',
                description: 'Description',
                price: 49.99,
                category: 'clothing',
                inventory: { quantity: 5 },
            });
            expect(res.status).toBe(201);
            expect(res.body.data.name).toBe('New Product');
        });
        it('should return 403 for non-admin user', async () => {
            const res = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                name: 'Unauthorized Product',
                description: 'Should fail',
                price: 10,
                category: 'books',
            });
            expect(res.status).toBe(403);
        });
    });
    describe('PUT /api/products/:id (admin only)', () => {
        it('should update product', async () => {
            const res = await request(app)
                .put(`/api/products/${productId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ price: 79.99 });
            expect(res.status).toBe(200);
            expect(res.body.data.price).toBe(79.99);
        });
    });
    describe('DELETE /api/products/:id (admin only)', () => {
        it('should delete product', async () => {
            const res = await request(app)
                .delete(`/api/products/${productId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            const check = await Product.findById(productId);
            expect(check).toBeNull();
        });
    });
});
//# sourceMappingURL=product.test.js.map