import mongoose from 'mongoose';
import { TASK_PRIORITY } from '../../constants/taskPriority.js';

const taskSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace is required'],
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project is required'],
      index: true,
    },
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: [true, 'Board is required'],
      index: true,
    },
    columnId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Column',
      required: [true, 'Column is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: 500,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 10000,
    },
    priority: {
      type: String,
      enum: Object.values(TASK_PRIORITY),
      default: TASK_PRIORITY.MEDIUM,
    },
    assignees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter is required'],
    },
    dueDate: {
      type: Date,
      default: null,
    },
    labels: [
      {
        type: String,
        trim: true,
        maxlength: 50,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by user is required'],
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Updated by user is required'],
    },
    completedAt: {
      type: Date,
      default: null,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
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

taskSchema.index({ boardId: 1, columnId: 1, lastActivityAt: -1, createdAt: -1 });
taskSchema.index({ projectId: 1, lastActivityAt: -1 });

export const Task = mongoose.model('Task', taskSchema);
