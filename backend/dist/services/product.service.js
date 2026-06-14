// backend/src/services/product.service.ts
import mongoose from 'mongoose';
import Product from '../models/product.model.js';
import { AppError } from '../middleware/error.middleware.js';
// Helper: generate unique slug
const generateUniqueSlug = async (baseName, excludeId) => {
    let slug = baseName
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    const excludeIdStr = excludeId;
    let existing = await Product.findOne({ slug, _id: { $ne: excludeIdStr } });
    let counter = 1;
    while (existing) {
        slug = `${generateUniqueSlug(baseName, excludeId)}-${counter}`;
        existing = await Product.findOne({ slug, _id: { $ne: excludeIdStr } });
        counter++;
    }
    return slug;
};
// Build filter object from query params – using `any` temporarily to bypass FilterQuery issues
const buildFilter = (options) => {
    const filter = {};
    if (options.isActive !== undefined)
        filter.isActive = options.isActive;
    if (options.isFeatured !== undefined)
        filter.isFeatured = options.isFeatured;
    if (options.category)
        filter.category = options.category;
    if (options.tags && options.tags.length)
        filter.tags = { $in: options.tags };
    if (options.minPrice !== undefined || options.maxPrice !== undefined) {
        filter.price = {};
        if (options.minPrice !== undefined)
            filter.price.$gte = options.minPrice;
        if (options.maxPrice !== undefined)
            filter.price.$lte = options.maxPrice;
    }
    if (options.search) {
        const regex = { $regex: options.search, $options: 'i' };
        filter.$or = [
            { name: regex },
            { description: regex },
            { tags: { $in: [regex] } },
        ];
    }
    return filter;
};
// Parse sort string
const parseSort = (sortStr) => {
    if (!sortStr)
        return { createdAt: -1 };
    const sortObj = {};
    const fields = sortStr.split(',');
    for (const field of fields) {
        if (field.startsWith('-')) {
            sortObj[field.substring(1)] = -1;
        }
        else {
            sortObj[field] = 1;
        }
    }
    return sortObj;
};
// Get all products with filtering, pagination, sorting
export const getAllProducts = async (filterOptions, pagination) => {
    const { page, limit, sort } = pagination;
    const skip = (page - 1) * limit;
    const filter = buildFilter(filterOptions);
    const sortObj = parseSort(sort);
    const [products, total] = await Promise.all([
        Product.find(filter)
            .sort(sortObj)
            .skip(skip)
            .limit(limit)
            .populate('createdBy', 'fullName email')
            .lean(),
        Product.countDocuments(filter),
    ]);
    return {
        products,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
    };
};
// Get product by ID
export const getProductById = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid product ID format', 400);
    }
    const product = await Product.findById(id).populate('createdBy', 'fullName email').lean();
    if (!product) {
        throw new AppError('Product not found', 404);
    }
    Product.findByIdAndUpdate(id, { $inc: { views: 1 } }).catch(() => { });
    return product;
};
// Get product by slug
export const getProductBySlug = async (slug) => {
    const product = await Product.findOne({ slug, isActive: true })
        .populate('createdBy', 'fullName')
        .lean();
    if (!product) {
        throw new AppError('Product not found', 404);
    }
    Product.findOneAndUpdate({ slug }, { $inc: { views: 1 } }).catch(() => { });
    return product;
};
// Create new product (admin)
export const createProduct = async (productData, createdBy) => {
    const { name, description, price, category } = productData;
    if (!name || !description || price === undefined || !category) {
        throw new AppError('Missing required fields: name, description, price, category', 400);
    }
    if (price < 0) {
        throw new AppError('Price cannot be negative', 400);
    }
    let slug = productData.slug;
    if (!slug) {
        slug = await generateUniqueSlug(name);
    }
    else {
        const existing = await Product.findOne({ slug });
        if (existing) {
            throw new AppError('Slug already exists', 400);
        }
    }
    const product = new Product({
        ...productData,
        slug,
        createdBy,
        inventory: {
            quantity: productData.inventory?.quantity ?? 0,
            lowStockThreshold: productData.inventory?.lowStockThreshold ?? 5,
            reservedQuantity: 0,
        },
    });
    await product.save();
    return product;
};
// Update product (admin) - with type-safe field assignment
export const updateProduct = async (id, updateData, updatedBy) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid product ID', 400);
    }
    const product = await Product.findById(id);
    if (!product) {
        throw new AppError('Product not found', 404);
    }
    const allowedUpdates = [
        'name', 'description', 'shortDescription', 'price', 'compareAtPrice',
        'category', 'subcategory', 'tags', 'images', 'inventory', 'weight',
        'dimensions', 'attributes', 'seo', 'isActive', 'isFeatured',
    ];
    for (const field of allowedUpdates) {
        if (updateData[field] !== undefined) {
            product[field] = updateData[field];
        }
    }
    if (updateData.name && updateData.name !== product.name) {
        product.slug = await generateUniqueSlug(updateData.name, id);
    }
    product.updatedBy = new mongoose.Types.ObjectId(updatedBy);
    await product.save();
    return product;
};
// Delete product (hard delete)
export const deleteProduct = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid product ID', 400);
    }
    const product = await Product.findById(id);
    if (!product) {
        throw new AppError('Product not found', 404);
    }
    await product.deleteOne();
    return { success: true };
};
// Get featured products
export const getFeaturedProducts = async (limit = 8) => {
    return Product.find({ isActive: true, isFeatured: true })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
};
// Get products by category
export const getProductsByCategory = async (category, page = 1, limit = 20) => {
    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
        Product.find({ category, isActive: true })
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .lean(),
        Product.countDocuments({ category, isActive: true }),
    ]);
    return {
        products,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
    };
};
// Get low stock products (admin)
export const getLowStockProducts = async (threshold = 5) => {
    return Product.find({
        'inventory.quantity': { $lte: threshold },
        isActive: true,
    })
        .select('name inventory.quantity slug')
        .lean();
};
// Search products (text search - using regex)
export const searchProducts = async (keyword, limit = 20) => {
    if (!keyword.trim())
        return [];
    const regex = { $regex: keyword, $options: 'i' };
    return Product.find({
        isActive: true,
        $or: [{ name: regex }, { description: regex }, { tags: { $in: [new RegExp(keyword, 'i')] } }],
    })
        .limit(limit)
        .lean();
};
// Smart search with relevance scoring
export const smartSearchProducts = async (query, limit = 5) => {
    if (!query.trim())
        return [];
    const words = query.split(/\s+/).filter(w => w.length > 1);
    if (words.length === 0)
        return [];
    const orConditions = [];
    words.forEach(word => {
        orConditions.push({ name: { $regex: word, $options: 'i' } });
        orConditions.push({ description: { $regex: word, $options: 'i' } });
        orConditions.push({ tags: { $in: [new RegExp(word, 'i')] } });
    });
    let results = await Product.find({ isActive: true, $or: orConditions })
        .limit(limit)
        .lean();
    if (results.length) {
        const scored = results.map(p => {
            let score = 0;
            words.forEach(word => {
                const re = new RegExp(word, 'i');
                if (re.test(p.name))
                    score += 3;
                if (re.test(p.description))
                    score += 1;
                if (p.tags?.some((tag) => re.test(tag)))
                    score += 2;
            });
            return { ...p, relevanceScore: score };
        });
        scored.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
        return scored.slice(0, limit);
    }
    return [];
};
// Fallback products when search yields no results
export const getFallbackProducts = async (limit = 5) => {
    const featured = await Product.find({ isActive: true, isFeatured: true }).limit(limit).lean();
    if (featured.length)
        return featured;
    return Product.find({ isActive: true }).limit(limit).lean();
};
/**
 * Autocomplete product names (fast prefix search)
 * @param prefix - Partial product name (at least 2 characters)
 * @param limit - Maximum number of suggestions
 * @returns Array of products with name, slug, and first image
 */
export const autocompleteProducts = async (prefix, limit = 5) => {
    if (!prefix || prefix.length < 2)
        return [];
    const regex = { $regex: `^${prefix}`, $options: 'i' };
    return Product.find({ name: regex, isActive: true })
        .select('name slug images')
        .limit(limit)
        .lean();
};
//# sourceMappingURL=product.service.js.map