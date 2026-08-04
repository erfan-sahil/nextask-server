import mongoose from 'mongoose';
import { WORKSPACE_VISIBILITY } from '../../constants/workspaceVisibility.js';
import { WORKSPACE_STATUS } from '../../constants/workspaceStatus.js';

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Workspace name is required'],
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: [true, 'Workspace slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    logo: {
      type: String,
      default: null,
    },
    visibility: {
      type: String,
      enum: Object.values(WORKSPACE_VISIBILITY),
      required: [true, 'Visibility is required'],
      default: WORKSPACE_VISIBILITY.PRIVATE,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Workspace owner is required'],
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(WORKSPACE_STATUS),
      default: WORKSPACE_STATUS.ACTIVE,
    },
    memberCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    projectCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taskCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastActivityAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by user is required'],
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Workspace = mongoose.model('Workspace', workspaceSchema);
