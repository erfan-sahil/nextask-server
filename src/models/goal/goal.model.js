import mongoose from 'mongoose';
import { GOAL_STATUS } from '../../constants/goalStatus.js';
import { GOAL_PRIORITY } from '../../constants/goalPriority.js';

const goalSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Goal title is required'],
      trim: true,
      maxlength: 500,
    },
    details: {
      type: String,
      default: '',
      trim: true,
      maxlength: 10000,
    },
    // Retained solely to read goals created before the field was renamed.
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 10000,
    },
    status: {
      type: String,
      enum: Object.values(GOAL_STATUS),
      default: GOAL_STATUS.PLANNING,
    },
    startDate: {
      type: Date,
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: Object.values(GOAL_PRIORITY),
      default: GOAL_PRIORITY.MEDIUM,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by user is required'],
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        if (!ret.details && ret.description) {
          ret.details = ret.description;
        }
        delete ret.description;
        delete ret.__v;
        return ret;
      },
    },
  }
);

goalSchema.index({ workspaceId: 1, status: 1, dueDate: 1 });
goalSchema.index({ workspaceId: 1, createdAt: -1 });

export const Goal = mongoose.model('Goal', goalSchema);
