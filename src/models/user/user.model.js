import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { AUTH_PROVIDER } from '../../constants/authProvider.js';
import { USER_STATUS } from '../../constants/userStatus.js';

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function requiredPassword() {
        return (this.authProvider ?? AUTH_PROVIDER.LOCAL) === AUTH_PROVIDER.LOCAL;
      },
      minlength: 8,
      select: false,
      default: null,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      default: null,
      select: false,
    },
    authProvider: {
      type: String,
      enum: Object.values(AUTH_PROVIDER),
      default: AUTH_PROVIDER.LOCAL,
    },
    avatar: {
      type: String,
      default: null,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationOtp: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    emailVerificationSentAt: {
      type: Date,
      select: false,
    },
    emailVerificationAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    // Legacy single-session field; kept for migration into refreshTokens.
    refreshToken: {
      type: String,
      select: false,
    },
    // Multi-device sessions — one refresh token per active device/session.
    refreshTokens: {
      type: [String],
      default: [],
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.refreshTokens;
        delete ret.googleId;
        delete ret.emailVerificationOtp;
        delete ret.emailVerificationExpires;
        delete ret.emailVerificationSentAt;
        delete ret.emailVerificationAttempts;
        delete ret.__v;
        return ret;
      },
    },
  }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password') || !this.password || this.$locals?.skipPasswordHash) {
    if (this.$locals?.skipPasswordHash) {
      delete this.$locals.skipPasswordHash;
    }

    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function comparePassword(candidate) {
  if (!this.password) {
    return false;
  }

  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model('User', userSchema);
