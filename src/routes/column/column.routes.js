import { Router } from 'express';
import {
  createColumn,
  listColumns,
  getColumn,
  updateColumn,
  deleteColumn,
} from '../../controllers/column/column.controller.js';
import {
  loadWorkspaceByWorkspaceId,
  loadProjectByProjectId,
  loadBoard,
  requireColumnView,
  requireColumnCreate,
  requireColumnUpdate,
  requireColumnDelete,
  loadColumn,
} from '../../middlewares/column/column.middleware.js';
import { validate } from '../../middlewares/common/validate.middleware.js';
import {
  createColumnSchema,
  updateColumnSchema,
  columnIdSchema,
  listColumnsSchema,
} from '../../validations/column/column.validation.js';

const router = Router({ mergeParams: true });

router.use(loadWorkspaceByWorkspaceId);
router.use(loadProjectByProjectId);
router.use(loadBoard);

router.post('/', validate(createColumnSchema), requireColumnCreate, createColumn);

router.get('/', validate(listColumnsSchema), requireColumnView, listColumns);

router.get('/:columnId', validate(columnIdSchema), requireColumnView, getColumn);

router.patch(
  '/:columnId',
  validate(updateColumnSchema),
  requireColumnUpdate,
  loadColumn,
  updateColumn
);

router.delete(
  '/:columnId',
  validate(columnIdSchema),
  requireColumnDelete,
  loadColumn,
  deleteColumn
);

export default router;
