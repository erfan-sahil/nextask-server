import { WorkspaceChatMessage } from '../../models/workspace-chat/workspaceChatMessage.model.js';
import { WorkspaceMember } from '../../models/workspace-member/workspaceMember.model.js';
import { ProjectMember } from '../../models/project-member/projectMember.model.js';
import { User } from '../../models/user/user.model.js';
import { NOTIFICATION_TYPE } from '../../models/notification/notification.model.js';
import { workspaceRoom, getSocketServer } from '../../realtime/socket.js';
import { notificationService } from '../../services/notification/notification.service.js';
import { USER_POPULATE_FIELDS } from '../../services/workspace/workspace.helpers.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const populateMessage = (query) => query.populate('createdBy', USER_POPULATE_FIELDS);

export const listWorkspaceChatParticipants = asyncHandler(async (req, res) => {
  const [workspaceUserIds, projectUserIds] = await Promise.all([
    WorkspaceMember.distinct('userId', { workspaceId: req.workspace._id }),
    ProjectMember.distinct('userId', { workspaceId: req.workspace._id }),
  ]);
  const participants = await User.find({
    _id: { $in: [...new Set([...workspaceUserIds, ...projectUserIds].map(String))] },
  }).select(USER_POPULATE_FIELDS);
  res.json(ApiResponse.ok({ participants }));
});

export const listWorkspaceChatMessages = asyncHandler(async (req, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 50);
  const [messages, total] = await Promise.all([
    populateMessage(
      WorkspaceChatMessage.find({ workspaceId: req.workspace._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
    ),
    WorkspaceChatMessage.countDocuments({ workspaceId: req.workspace._id }),
  ]);
  res.json(
    ApiResponse.ok({
      messages: messages.reverse(),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    })
  );
});

export const createWorkspaceChatMessage = asyncHandler(async (req, res) => {
  const message = await WorkspaceChatMessage.create({
    workspaceId: req.workspace._id,
    content: req.body.content,
    createdBy: req.user._id,
  });
  const populatedMessage = await populateMessage(WorkspaceChatMessage.findById(message._id));
  getSocketServer()?.to(workspaceRoom(req.workspace._id)).emit('chat:message', populatedMessage);

  const mentionedUserIds = await notificationService.mentionedUserIds(
    req.workspace._id,
    message.content
  );
  await notificationService.createMany({
    workspaceId: req.workspace._id,
    recipientIds: mentionedUserIds,
    actorId: req.user._id,
    type: NOTIFICATION_TYPE.CHAT_MENTION,
    message: `${req.user.firstName} mentioned you in workspace chat`,
    chatMessageId: message._id,
  });
  res.status(201).json(ApiResponse.created({ message: populatedMessage }));
});
