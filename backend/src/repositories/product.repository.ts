// backend/src/repositories/product.repository.ts
import mongoose from 'mongoose';
import Product from '../models/product.model.js';
import { IProduct } from '../models/product.model.js';

export interface ProductQueryOptions {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  limit?: number;
  isActive?: boolean;
}

export class ProductRepository {
  // Use `any` to bypass TypeScript's FilterQuery issues (Mongoose 9.x compatibility)
  private buildFilter(options: ProductQueryOptions): any {
    const filter: any = {};

    if (options.isActive !== undefined) filter.isActive = options.isActive;

    if (options.search && options.search.trim().length > 0) {
      const searchRegex = { $regex: options.search, $options: 'i' };
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { tags: { $in: [searchRegex] } }
      ];
      if (options.category) filter.category = options.category;
    } else if (options.category) {
      filter.category = options.category;
    }

    if (options.minPrice !== undefined || options.maxPrice !== undefined) {
      filter.price = {};
      if (options.minPrice !== undefined) filter.price.$gte = options.minPrice;
      if (options.maxPrice !== undefined) filter.price.$lte = options.maxPrice;
    }

    return filter;
  }

  private buildSort(sortField: string = '-createdAt'): Record<string, 1 | -1> {
    const sortMap: Record<string, Record<string, 1 | -1>> = {
      '-createdAt': { createdAt: -1 },
      'createdAt': { createdAt: 1 },
      '-price': { price: -1 },
      'price': { price: 1 },
      '-views': { views: -1 },
      '-ratings.average': { 'ratings.average': -1 }
    };
    return sortMap[sortField] ?? sortMap['-createdAt'];
  }

  async findProducts(options: ProductQueryOptions) {
    const filter = this.buildFilter(options);
    const sort = this.buildSort(options.sort);
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, options.limit || 12);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limit).lean().exec(),
      Product.countDocuments(filter)
    ]);

    return { products: data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findProductById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Product.findById(id).lean().exec();
  }

  async findProductBySlug(slug: string) {
    return Product.findOne({ slug, isActive: true }).lean().exec();
  }

  async getFeatured(limit: number = 8) {
    return Product.find({ isActive: true, isFeatured: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }
}