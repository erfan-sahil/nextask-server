import mongoose from 'mongoose';

export const NOTIFICATION_TYPE = {
  TASK_ASSIGNED: 'TASK_ASSIGNED',
  TASK_UPDATED: 'TASK_UPDATED',
  TASK_COMMENT: 'TASK_COMMENT',
  MENTION: 'MENTION',
  CHAT_MENTION: 'CHAT_MENTION',
  MEETING_CREATED: 'MEETING_CREATED',
  MEETING_UPDATED: 'MEETING_UPDATED',
};

const notificationSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(NOTIFICATION_TYPE), required: true },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
    commentId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaskComment', default: null },
    chatMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkspaceChatMessage',
      default: null,
    },
    meetingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting', default: null },
    readAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

notificationSchema.index({ recipientId: 1, readAt: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
