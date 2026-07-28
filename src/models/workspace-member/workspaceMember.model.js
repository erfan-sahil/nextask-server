import mongoose from 'mongoose';
import { WORKSPACE_MEMBER_ROLE } from '../../constants/workspaceMemberRole.js';

const workspaceMemberSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace is required'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    role: {
      type: String,
      enum: Object.values(WORKSPACE_MEMBER_ROLE),
      default: WORKSPACE_MEMBER_ROLE.MEMBER,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    joinedAt: {
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

workspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

export const WorkspaceMember = mongoose.model('WorkspaceMember', workspaceMemberSchema);
