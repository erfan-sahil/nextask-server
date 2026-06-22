import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const pendingRegistrationSchema = new mongoose.Schema(
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
      required: [true, 'Password is required'],
      minlength: 8,
      select: false,
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
  },
  {
    timestamps: true,
  }
);

pendingRegistrationSchema.index(
  { emailVerificationExpires: 1 },
  { expireAfterSeconds: 0 }
);

pendingRegistrationSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

pendingRegistrationSchema.methods.comparePassword = async function comparePassword(
  candidate
) {
  return bcrypt.compare(candidate, this.password);
};

export const PendingRegistration = mongoose.model(
  'PendingRegistration',
  pendingRegistrationSchema
);
