import { notificationService } from '../../services/notification/notification.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.list(req.user._id, req.query);
  res.json(ApiResponse.ok(result));
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllRead(req.user._id);
  res.json(ApiResponse.ok(null));
});
