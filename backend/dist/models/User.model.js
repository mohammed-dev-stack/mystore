// backend/src/models/user.model.ts
/**
 * Why this model?
 * - TypeScript interface for type safety (IUser)
 * - Password hashing using bcrypt (via method called before save)
 * - Brute-force protection: login attempts + lockUntil
 * - Role-based access: user, admin, moderator
 * - Methods: comparePassword, incrementLoginAttempts, resetLoginAttempts, isLocked, createPasswordResetToken
 * - Indexes: email unique, role+isActive for admin queries
 * - No pre-save hook to avoid "next is not a function" error; hashing is done explicitly in service layer
 */
import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
const userSchema = new Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false,
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'moderator'],
        default: 'user',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    lastLogin: {
        type: Date,
        default: null,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    loginAttempts: {
        type: Number,
        default: 0,
        min: 0,
    },
    lockUntil: {
        type: Date,
        default: null,
    },
    profilePicture: {
        type: String,
        default: null,
    },
    addresses: [
        {
            street: { type: String, required: true },
            city: { type: String, required: true },
            postalCode: { type: String, required: true },
            country: { type: String, required: true },
            isDefault: { type: Boolean, default: false },
        },
    ],
}, {
    timestamps: true,
    toJSON: {
        transform: (_doc, ret) => {
            // Destructure to remove sensitive fields without using delete operator
            const { password, passwordResetToken, passwordResetExpires, __v, ...safeUser } = ret;
            return safeUser;
        },
    },
});
// Indexes
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ email: 1, isActive: 1 });
/**
 * Compare a candidate password with the stored hash
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};
/**
 * Check if the account is currently locked due to too many failed attempts
 */
userSchema.methods.isLocked = function () {
    return !!(this.lockUntil && this.lockUntil > new Date());
};
/**
 * Increment login attempts and lock the account if maximum attempts exceeded
 */
userSchema.methods.incrementLoginAttempts = async function () {
    const MAX_ATTEMPTS = 5;
    const LOCK_TIME = 15 * 60 * 1000; // 15 minutes
    if (this.lockUntil && this.lockUntil < new Date()) {
        // Lock expired, reset
        this.loginAttempts = 1;
        this.lockUntil = null;
    }
    else {
        this.loginAttempts += 1;
        if (this.loginAttempts >= MAX_ATTEMPTS) {
            this.lockUntil = new Date(Date.now() + LOCK_TIME);
        }
    }
    await this.save({ validateBeforeSave: false });
};
/**
 * Reset login attempts after a successful login
 */
userSchema.methods.resetLoginAttempts = async function () {
    this.loginAttempts = 0;
    this.lockUntil = null;
    await this.save({ validateBeforeSave: false });
};
/**
 * Generate a password reset token (plain and hashed) and set expiration
 * @returns Plain token that should be sent to the user
 */
userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    return resetToken;
};
const User = mongoose.model('User', userSchema);
export default User;
//# sourceMappingURL=user.model.js.map