// backend/src/repositories/product.repository.ts
import mongoose from 'mongoose';
import Product from '../models/product.model.js';
export class ProductRepository {
    // Use `any` to bypass TypeScript's FilterQuery issues (Mongoose 9.x compatibility)
    buildFilter(options) {
        const filter = {};
        if (options.isActive !== undefined)
            filter.isActive = options.isActive;
        if (options.search && options.search.trim().length > 0) {
            const searchRegex = { $regex: options.search, $options: 'i' };
            filter.$or = [
                { name: searchRegex },
                { description: searchRegex },
                { tags: { $in: [searchRegex] } }
            ];
            if (options.category)
                filter.category = options.category;
        }
        else if (options.category) {
            filter.category = options.category;
        }
        if (options.minPrice !== undefined || options.maxPrice !== undefined) {
            filter.price = {};
            if (options.minPrice !== undefined)
                filter.price.$gte = options.minPrice;
            if (options.maxPrice !== undefined)
                filter.price.$lte = options.maxPrice;
        }
        return filter;
    }
    buildSort(sortField = '-createdAt') {
        const sortMap = {
            '-createdAt': { createdAt: -1 },
            'createdAt': { createdAt: 1 },
            '-price': { price: -1 },
            'price': { price: 1 },
            '-views': { views: -1 },
            '-ratings.average': { 'ratings.average': -1 }
        };
        return sortMap[sortField] ?? sortMap['-createdAt'];
    }
    async findProducts(options) {
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
    async findProductById(id) {
        if (!mongoose.Types.ObjectId.isValid(id))
            return null;
        return Product.findById(id).lean().exec();
    }
    async findProductBySlug(slug) {
        return Product.findOne({ slug, isActive: true }).lean().exec();
    }
    async getFeatured(limit = 8) {
        return Product.find({ isActive: true, isFeatured: true })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
    }
}
//# sourceMappingURL=product.repository.js.map