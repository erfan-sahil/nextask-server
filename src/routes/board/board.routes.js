import { Router } from 'express';
import {
  createBoard,
  listBoards,
  getBoard,
  updateBoard,
  deleteBoard,
} from '../../controllers/board/board.controller.js';
import {
  loadWorkspaceByWorkspaceId,
  loadProjectByProjectId,
  requireBoardView,
  requireBoardCreate,
  requireBoardUpdate,
  requireBoardDelete,
  loadBoard,
} from '../../middlewares/board/board.middleware.js';
import { validate } from '../../middlewares/common/validate.middleware.js';
import {
  createBoardSchema,
  updateBoardSchema,
  boardIdSchema,
  listBoardsSchema,
} from '../../validations/board/board.validation.js';
import columnRoutes from '../column/column.routes.js';
import taskRoutes from '../task/task.routes.js';

const router = Router({ mergeParams: true });

router.use(loadWorkspaceByWorkspaceId);
router.use(loadProjectByProjectId);

router.post(
  '/',
  validate(createBoardSchema),
  requireBoardCreate,
  createBoard
);

router.get('/', validate(listBoardsSchema), requireBoardView, listBoards);

router.use('/:boardId/columns', columnRoutes);
router.use('/:boardId/tasks', taskRoutes);

router.get(
  '/:boardId',
  validate(boardIdSchema),
  requireBoardView,
  getBoard
);

router.patch(
  '/:boardId',
  validate(updateBoardSchema),
  requireBoardUpdate,
  loadBoard,
  updateBoard
);

router.delete(
  '/:boardId',
  validate(boardIdSchema),
  requireBoardDelete,
  loadBoard,
  deleteBoard
);

export default router;
