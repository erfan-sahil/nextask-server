import mongoose from 'mongoose';
import { WORKSPACE_MEMBER_ROLE } from '../../constants/workspaceMemberRole.js';
import { WORKSPACE_INVITATION_STATUS } from '../../constants/workspaceInvitationStatus.js';

const projectInvitationSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project is required'],
      index: true,
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace is required'],
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
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
      required: [true, 'Invited by user is required'],
    },
    token: {
      type: String,
      required: true,
      select: false,
    },
    status: {
      type: String,
      enum: Object.values(WORKSPACE_INVITATION_STATUS),
      default: WORKSPACE_INVITATION_STATUS.PENDING,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.token;
        delete ret.__v;
        return ret;
      },
    },
  }
);

projectInvitationSchema.index({ projectId: 1, email: 1 }, { unique: true });

export const ProjectInvitation = mongoose.model('ProjectInvitation', projectInvitationSchema);
