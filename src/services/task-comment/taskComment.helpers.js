import { TaskComment } from '../../models/task-comment/taskComment.model.js';
import { TASK_COMMENT_MESSAGES } from '../../constants/taskCommentMessages.js';
import { WORKSPACE_MEMBER_ROLE } from '../../constants/workspaceMemberRole.js';
import { ApiError } from '../../utils/ApiError.js';
import { USER_POPULATE_FIELDS } from '../workspace/workspace.helpers.js';
import {
  ensureCanCreateComment,
  ensureCanUpdateComment,
  ensureCanDeleteComment,
} from '../workspace-member/memberPermission.helpers.js';
import { findEffectiveProjectMembershipOrThrow } from '../project-member/projectMember.helpers.js';

export const populateTaskComment = (query) =>
  query.populate('createdBy', USER_POPULATE_FIELDS).populate('updatedBy', USER_POPULATE_FIELDS);

export const findTaskCommentOrThrow = async (commentId, taskId) => {
  const comment = await TaskComment.findOne({ _id: commentId, taskId });

  if (!comment) {
    throw ApiError.notFound(TASK_COMMENT_MESSAGES.NOT_FOUND);
  }

  return comment;
};

export const findPopulatedTaskCommentOrThrow = async (commentId, taskId) => {
  const comment = await populateTaskComment(TaskComment.findOne({ _id: commentId, taskId }));

  if (!comment) {
    throw ApiError.notFound(TASK_COMMENT_MESSAGES.NOT_FOUND);
  }

  return comment;
};

export const ensureActorCanCreateTaskComment = async (workspace, projectId, userId) => {
  const membership = await findEffectiveProjectMembershipOrThrow(workspace._id, projectId, userId);
  ensureCanCreateComment(membership);
  return membership;
};

const canManageAnyComment = (membership) =>
  [WORKSPACE_MEMBER_ROLE.OWNER, WORKSPACE_MEMBER_ROLE.ADMIN].includes(membership.role);

export const ensureActorCanUpdateTaskComment = async (workspace, projectId, comment, userId) => {
  const membership = await findEffectiveProjectMembershipOrThrow(workspace._id, projectId, userId);
  ensureCanUpdateComment(membership);

  if (comment.createdBy.toString() !== userId.toString() && !canManageAnyComment(membership)) {
    throw ApiError.forbidden('You can only update your own comments');
  }

  return membership;
};

export const ensureActorCanDeleteTaskComment = async (workspace, projectId, comment, userId) => {
  const membership = await findEffectiveProjectMembershipOrThrow(workspace._id, projectId, userId);
  ensureCanDeleteComment(membership);

  if (comment.createdBy.toString() !== userId.toString() && !canManageAnyComment(membership)) {
    throw ApiError.forbidden('You can only delete your own comments');
  }

  return membership;
};
