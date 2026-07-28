import { Router } from 'express';
import {
  createTask,
  listTasks,
  getTask,
  updateTask,
  deleteTask,
} from '../../controllers/task/task.controller.js';
import {
  loadWorkspaceByWorkspaceId,
  loadProjectByProjectId,
  loadBoard,
  loadActorMembership,
  requireTaskView,
  requireTaskCreate,
  requireTaskDelete,
  loadTask,
} from '../../middlewares/task/task.middleware.js';
import { validate } from '../../middlewares/common/validate.middleware.js';
import {
  createTaskSchema,
  updateTaskSchema,
  taskIdSchema,
  listTasksSchema,
} from '../../validations/task/task.validation.js';
import taskCommentRoutes from '../task-comment/taskComment.routes.js';

const router = Router({ mergeParams: true });

router.use(loadWorkspaceByWorkspaceId);
router.use(loadProjectByProjectId);
router.use(loadBoard);

router.post('/', validate(createTaskSchema), requireTaskCreate, createTask);

router.get('/', validate(listTasksSchema), requireTaskView, listTasks);

router.use('/:taskId/comments', taskCommentRoutes);

router.get('/:taskId', validate(taskIdSchema), requireTaskView, getTask);

router.patch('/:taskId', validate(updateTaskSchema), loadActorMembership, loadTask, updateTask);

router.delete('/:taskId', validate(taskIdSchema), requireTaskDelete, loadTask, deleteTask);

export default router;
