import mongoose from 'mongoose';

const workspaceChatMessageSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true, toJSON: { transform: (_doc, ret) => { delete ret.__v; return ret; } } },
);

workspaceChatMessageSchema.index({ workspaceId: 1, createdAt: -1 });

export const WorkspaceChatMessage = mongoose.model(
  'WorkspaceChatMessage',
  workspaceChatMessageSchema,
);
