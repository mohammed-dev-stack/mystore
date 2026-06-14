// backend/src/models/product.model.ts
/**
 * Why this model?
 * - TypeScript interface IProduct for type safety
 * - Inventory management: quantity + reservedQuantity to prevent overselling
 * - Virtuals: availableQuantity, isOnSale, discountPercent
 * - Indexes: text search (name, description, tags, category), category+price, slug unique, etc.
 * - Methods: isInStock, decrementInventory, incrementViews, updateRating
 * - Timestamps for audit
 * - NOTE: Static methods (search, getLowStockProducts, getFeatured) are removed.
 *         They belong to the Repository/Service layer.
 */

import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import logger from '../utils/logger.js';

// Interfaces for sub-documents
export interface IProductImage {
  url: string;
  thumbnail: string;
  small: string;
  medium: string;
  alt: string;
  isPrimary: boolean;
}

export interface IInventory {
  quantity: number;
  lowStockThreshold: number;
  reservedQuantity: number;
}

export interface IDimensions {
  length: number;
  width: number;
  height: number;
  unit: string;
}

export interface IRatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface ISeo {
  title: string;
  description: string;
  keywords: string[];
}

// Main Product Interface (extends Document)
export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice: number | null;
  category: string;
  subcategory: string | null;
  tags: string[];
  images: IProductImage[];
  inventory: IInventory;
  weight: number;
  dimensions: IDimensions;
  attributes: Map<string, any>;
  ratings: {
    average: number;
    count: number;
    distribution: IRatingDistribution;
  };
  isActive: boolean;
  isFeatured: boolean;
  views: number;
  seo: ISeo;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  // Virtuals
  availableQuantity: number;
  isOnSale: boolean;
  discountPercent: number;
  // Instance methods
  isInStock(quantity?: number): boolean;
  decrementInventory(quantity: number): Promise<boolean>;
  incrementViews(): Promise<void>;
  updateRating(): Promise<void>;
}

type ProductModel = Model<IProduct>;

const productSchema = new Schema<IProduct, ProductModel>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [3, 'Product name must be at least 3 characters'],
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      minlength: [10, 'Description too short'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    shortDescription: {
      type: String,
      maxlength: [300, 'Short description max 300 characters'],
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    compareAtPrice: {
      type: Number,
      min: 0,
      default: null,
      validate: {
        // Use `this: any` to avoid Mongoose's internal type conflicts
        validator: function (this: any, value: number | null): boolean {
          return value === null || value > this.price;
        },
        message: 'Compare-at price must be greater than current price',
      },
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['electronics', 'clothing', 'books', 'home', 'beauty', 'sports', 'toys', 'other'],
    },
    subcategory: {
      type: String,
      default: null,
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    images: [{
      url: { type: String, required: true },
      thumbnail: { type: String, required: true },
      small: { type: String, required: true },
      medium: { type: String, required: true },
      alt: { type: String, default: '' },
      isPrimary: { type: Boolean, default: false },
    }],
    inventory: {
      quantity: { type: Number, required: true, default: 0, min: 0 },
      lowStockThreshold: { type: Number, default: 5 },
      reservedQuantity: { type: Number, default: 0, min: 0 },
    },
    weight: {
      type: Number,
      default: 0,
      min: 0,
    },
    dimensions: {
      length: { type: Number, default: 0 },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
      unit: { type: String, default: 'cm' },
    },
    attributes: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
      distribution: {
        1: { type: Number, default: 0 },
        2: { type: Number, default: 0 },
        3: { type: Number, default: 0 },
        4: { type: Number, default: 0 },
        5: { type: Number, default: 0 },
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    seo: {
      title: { type: String, maxlength: 60 },
      description: { type: String, maxlength: 160 },
      keywords: [String],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
productSchema.virtual('availableQuantity').get(function (this: IProduct) {
  return Math.max(0, this.inventory.quantity - this.inventory.reservedQuantity);
});

productSchema.virtual('isOnSale').get(function (this: IProduct) {
  return !!(this.compareAtPrice && this.compareAtPrice > this.price);
});

productSchema.virtual('discountPercent').get(function (this: IProduct) {
  if (!this.isOnSale) return 0;
  return Math.round(((this.compareAtPrice! - this.price) / this.compareAtPrice!) * 100);
});

// Indexes (with category added to text index)
productSchema.index({ category: 1, price: 1 });
productSchema.index({ isActive: 1, isFeatured: 1 });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index(
  { name: 'text', description: 'text', tags: 'text', category: 'text' },
  {
    weights: { name: 10, tags: 8, description: 5, category: 2 },
    name: 'product_search_index',
  }
);
productSchema.index({ createdAt: -1 });
productSchema.index({ price: 1 });
productSchema.index({ price: -1 });
productSchema.index({ slug: 1 }, { unique: true });

// Instance methods
productSchema.methods.isInStock = function (this: IProduct, quantity = 1): boolean {
  return this.availableQuantity >= quantity;
};

productSchema.methods.decrementInventory = async function (this: IProduct, quantity: number): Promise<boolean> {
  if (!this.isInStock(quantity)) {
    throw new Error(`Insufficient stock for ${this.name}. Available: ${this.availableQuantity}`);
  }
  this.inventory.quantity -= quantity;
  await this.save();
  return true;
};

productSchema.methods.incrementViews = async function (this: IProduct): Promise<void> {
  this.views += 1;
  await this.save({ validateBeforeSave: false });
};

productSchema.methods.updateRating = async function (this: IProduct): Promise<void> {
  // TODO: In production, aggregate from Review model
  logger.info(`Update rating called for product ${this._id}`);
};

// ✅ Static methods removed as they belong to Repository/Service layer.

const Product = mongoose.model<IProduct, ProductModel>('Product', productSchema);
export default Product;