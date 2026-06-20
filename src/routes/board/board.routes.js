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
