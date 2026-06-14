// backend/src/tests/product.test.ts
/**
 * Why this test file?
 * - Unit tests for product service and API endpoints
 * - Tests CRUD operations, filtering, pagination, and admin access
 * - Uses in-memory MongoDB for isolated testing
 * - Verifies authentication and authorization for admin routes
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
import Product from '../models/product.model.js';

// --- Helper interfaces for response bodies (improves type safety) ---
interface AuthResponse {
  success: boolean;
  token?: string;
  user?: { _id: string; email: string; fullName: string; role: string };
  message?: string;
}

interface ProductResponse {
  success: boolean;
  data?: {
    _id: string;
    name: string;
    price: number;
    category: string;
    [key: string]: unknown;
  };
  message?: string;
}

interface ProductsListResponse {
  success: boolean;
  products: Array<{
    _id: string;
    name: string;
    price: number;
    category: string;
  }>;
  total: number;
  totalPages: number;
  currentPage: number;
}

// --- Test environment setup ---
let mongoServer: MongoMemoryServer;
let adminToken: string;
let userToken: string;
let productId: string;

// Helper: create user and return token
async function createUserAndGetToken(fullName: string, email: string, password: string): Promise<string> {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ fullName, email, password });
  const body = res.body as AuthResponse;
  if (!body.token) throw new Error(`Failed to create user ${email}`);
  return body.token;
}

// Helper: set user role to admin
async function setAdminRole(email: string): Promise<void> {
  await User.findOneAndUpdate({ email }, { role: 'admin' });
}

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
  adminToken = await createUserAndGetToken('Admin User', 'admin@example.com', 'admin123');
  await setAdminRole('admin@example.com');

  // Create regular user and get token
  userToken = await createUserAndGetToken('Regular User', 'user@example.com', 'user123');

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
  const productBody = productRes.body as ProductResponse;
  productId = productBody.data!._id;
});

describe('Product Endpoints', () => {
  describe('GET /api/products', () => {
    it('should return paginated products', async () => {
      const res = await request(app).get('/api/products?page=1&limit=10');
      const body = res.body as ProductsListResponse;
      expect(res.status).toBe(200);
      expect(body.products).toHaveLength(1);
      expect(body.total).toBe(1);
    });

    it('should filter by category', async () => {
      const res = await request(app).get('/api/products?category=electronics');
      const body = res.body as ProductsListResponse;
      expect(res.status).toBe(200);
      expect(body.products[0].category).toBe('electronics');
    });

    it('should filter by price range', async () => {
      const res = await request(app).get('/api/products?minPrice=50&maxPrice=150');
      const body = res.body as ProductsListResponse;
      expect(res.status).toBe(200);
      expect(body.products).toHaveLength(1);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return single product', async () => {
      const res = await request(app).get(`/api/products/${productId}`);
      const body = res.body as ProductResponse;
      expect(res.status).toBe(200);
      expect(body.data?.name).toBe('Test Product');
    });

    it('should return 404 for invalid id', async () => {
      const res = await request(app).get('/api/products/507f1f77bcf86cd799439011');
      const body = res.body as ProductResponse;
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
      const body = res.body as ProductResponse;
      expect(res.status).toBe(201);
      expect(body.data?.name).toBe('New Product');
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
      const body = res.body as ProductResponse;
      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/products/:id (admin only)', () => {
    it('should update product', async () => {
      const res = await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 79.99 });
      const body = res.body as ProductResponse;
      expect(res.status).toBe(200);
      expect(body.data?.price).toBe(79.99);
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