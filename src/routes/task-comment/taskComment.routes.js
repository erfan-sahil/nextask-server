import { Router } from 'express';
import {
  createTaskComment,
  listTaskComments,
  getTaskComment,
  updateTaskComment,
  deleteTaskComment,
} from '../../controllers/task-comment/taskComment.controller.js';
import { requireTaskView } from '../../middlewares/task/task.middleware.js';
import {
  loadCommentTask,
  loadTaskComment,
  requireTaskCommentCreate,
  requireTaskCommentUpdate,
  requireTaskCommentDelete,
} from '../../middlewares/task-comment/taskComment.middleware.js';
import { validate } from '../../middlewares/common/validate.middleware.js';
import {
  createTaskCommentSchema,
  updateTaskCommentSchema,
  taskCommentIdSchema,
  listTaskCommentsSchema,
} from '../../validations/task-comment/taskComment.validation.js';

const router = Router({ mergeParams: true });

router.use(loadCommentTask);

router.post(
  '/',
  validate(createTaskCommentSchema),
  requireTaskCommentCreate,
  createTaskComment
);

router.get(
  '/',
  validate(listTaskCommentsSchema),
  requireTaskView,
  listTaskComments
);

router.get(
  '/:commentId',
  validate(taskCommentIdSchema),
  requireTaskView,
  getTaskComment
);

router.patch(
  '/:commentId',
  validate(updateTaskCommentSchema),
  loadTaskComment,
  requireTaskCommentUpdate,
  updateTaskComment
);

router.delete(
  '/:commentId',
  validate(taskCommentIdSchema),
  loadTaskComment,
  requireTaskCommentDelete,
  deleteTaskComment
);

export default router;
