import mongoose from 'mongoose';
import { DEFAULT_COLUMN_COLOR } from '../../constants/columnMessages.js';

const columnSchema = new mongoose.Schema(
  {
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: [true, 'Board is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Column name is required'],
      trim: true,
      maxlength: 200,
    },
    position: {
      type: Number,
      required: [true, 'Column position is required'],
      min: 0,
    },
    color: {
      type: String,
      default: DEFAULT_COLUMN_COLOR,
    },
    isCompletedColumn: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by user is required'],
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

columnSchema.index({ boardId: 1, position: 1 });

export const Column = mongoose.model('Column', columnSchema);
