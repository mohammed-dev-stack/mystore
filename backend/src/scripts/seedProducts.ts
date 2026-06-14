// backend/src/scripts/seedProducts.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/product.model.js';
import productsData from '../data/products.seed.json' with { type: 'json' };
import slugify from 'slugify';
import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';

dotenv.config();

slugify.extend({ ' ': '-' });
const toSlug = (text: string) => slugify(text, { replacement: '-', lower: true, strict: true, locale: 'ar' });

const createDefaultAdmin = async (): Promise<mongoose.Types.ObjectId> => {
  const defaultAdmin = {
    fullName: 'Admin User',
    email: 'admin@mystore.com',
    password: await bcrypt.hash('admin123', 12),
    role: 'admin' as const, // ✅ استخدام as const لتحديد النوع بدقة
    isActive: true,
  };
  const user = await User.create(defaultAdmin);
  console.log('✅ Created default admin user (admin@mystore.com / admin123)');
  return user._id;
};

const seedProducts = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ MONGO_URI environment variable is not defined.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    let createdById: mongoose.Types.ObjectId | null = null;
    const existingUser = await User.findOne({ role: 'admin' });
    if (existingUser) {
      createdById = existingUser._id;
      console.log('✅ Found admin user, will use as createdBy');
    } else {
      const anyUser = await User.findOne({});
      if (anyUser) {
        createdById = anyUser._id;
        console.log('✅ Found existing user, will use as createdBy');
      } else {
        console.warn('⚠️ No users found. Creating a default admin user...');
        createdById = await createDefaultAdmin();
      }
    }

    await Product.deleteMany({});
    console.log('🗑️  Existing products cleared');

    const productsToInsert = productsData.map((p: any, idx: number) => {
      let slug = toSlug(p.name);
      if (slug === '-' || slug === '' || slug.length < 2) {
        slug = `product-${idx}`;
      }
      const finalSlug = `${slug}-${Date.now()}-${idx}`;

      return {
        ...p,
        slug: finalSlug,
        shortDescription: p.description.substring(0, 150),
        compareAtPrice: p.price * 1.2,
        inventory: {
          quantity: Math.floor(Math.random() * 50) + 10,
          lowStockThreshold: 5,
          reservedQuantity: 0,
        },
        tags: [p.category],
        isActive: true,
        isFeatured: idx % 3 === 0,
        seo: {
          title: p.name,
          description: p.description.substring(0, 160),
          keywords: p.category,
        },
        images: p.images.map((url: string, imgIdx: number) => ({
          url,
          thumbnail: url,
          small: url,
          medium: url,
          alt: p.name,
          isPrimary: imgIdx === 0,
        })),
        createdBy: createdById,
        updatedBy: createdById,
      };
    });

    const result = await Product.insertMany(productsToInsert);
    console.log(`✅ ${result.length} products seeded successfully!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

seedProducts();