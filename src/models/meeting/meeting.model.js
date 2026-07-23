import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Meeting title is required'],
      trim: true,
      maxlength: 500,
    },
    message: {
      type: String,
      default: '',
      trim: true,
      maxlength: 10000,
    },
    startsAt: {
      type: Date,
      required: [true, 'Meeting start time is required'],
      index: true,
    },
    location: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    attendees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
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

meetingSchema.index({ workspaceId: 1, startsAt: 1 });
meetingSchema.index({ workspaceId: 1, attendees: 1, startsAt: 1 });

export const Meeting = mongoose.model('Meeting', meetingSchema);
