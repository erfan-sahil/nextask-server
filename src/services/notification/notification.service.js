import { Notification } from '../../models/notification/notification.model.js';
import { User } from '../../models/user/user.model.js';
import { WorkspaceMember } from '../../models/workspace-member/workspaceMember.model.js';
import { getSocketServer, userRoom } from '../../realtime/socket.js';
import { USER_POPULATE_FIELDS } from '../workspace/workspace.helpers.js';

const populateNotification = (query) =>
  query.populate('actorId', USER_POPULATE_FIELDS);

const emitNotification = (notification) => {
  getSocketServer()?.to(userRoom(notification.recipientId.toString())).emit(
    'notification:created',
    notification,
  );
};

export const notificationService = {
  async createMany({ workspaceId, recipientIds, actorId, type, message, taskId, commentId, chatMessageId }) {
    const recipients = [...new Set(recipientIds.map(String))].filter(
      (recipientId) => recipientId !== actorId.toString(),
    );
    if (!recipients.length) return [];

    const created = await Notification.insertMany(
      recipients.map((recipientId) => ({
        workspaceId, recipientId, actorId, type, message, taskId, commentId, chatMessageId,
      })),
    );
    const notifications = await populateNotification(
      Notification.find({ _id: { $in: created.map(({ _id }) => _id) } }),
    );
    notifications.forEach(emitNotification);
    return notifications;
  },

  async list(userId, { page = 1, limit = 50 }) {
    const skip = (page - 1) * limit;
    const [notifications, total, unreadCount] = await Promise.all([
      populateNotification(Notification.find({ recipientId: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit)),
      Notification.countDocuments({ recipientId: userId }),
      Notification.countDocuments({ recipientId: userId, readAt: null }),
    ]);
    return { notifications, unreadCount, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
  },

  async markAllRead(userId) {
    await Notification.updateMany({ recipientId: userId, readAt: null }, { readAt: new Date() });
  },

  async markRead(userId, notificationId) {
    await Notification.updateOne(
      { _id: notificationId, recipientId: userId, readAt: null },
      { readAt: new Date() },
    );
  },

  async mentionedUserIds(workspaceId, content) {
    const usernames = [...content.matchAll(/@([a-z0-9_-]+)/gi)].map((match) => match[1].toLowerCase());
    if (!usernames.length) return [];
    const users = await User.find({ username: { $in: [...new Set(usernames)] } }).select('_id');
    const userIds = users.map(({ _id }) => _id);
    const members = await WorkspaceMember.find({
      workspaceId,
      userId: { $in: userIds },
    }).select('userId');
    return members.map(({ userId }) => userId);
  },
};
