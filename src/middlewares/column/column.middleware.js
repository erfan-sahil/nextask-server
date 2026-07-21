import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  loadWorkspaceByWorkspaceId,
  loadProjectByProjectId,
  loadBoard,
} from '../board/board.middleware.js';
import {
  ensureActorCanViewColumns,
  ensureActorCanCreateColumn,
  ensureActorCanUpdateColumn,
  ensureActorCanDeleteColumn,
  findColumnOrThrow,
} from '../../services/column/column.helpers.js';

export { loadWorkspaceByWorkspaceId, loadProjectByProjectId, loadBoard };

export const requireColumnView = asyncHandler(async (req, _res, next) => {
  req.actorMembership = await ensureActorCanViewColumns(
    req.workspace,
    req.project._id,
    req.user._id
  );
  next();
});

export const requireColumnCreate = asyncHandler(async (req, _res, next) => {
  req.actorMembership = await ensureActorCanCreateColumn(
    req.workspace,
    req.project._id,
    req.user._id
  );
  next();
});

export const requireColumnUpdate = asyncHandler(async (req, _res, next) => {
  req.actorMembership = await ensureActorCanUpdateColumn(
    req.workspace,
    req.project._id,
    req.user._id
  );
  next();
});

export const requireColumnDelete = asyncHandler(async (req, _res, next) => {
  req.actorMembership = await ensureActorCanDeleteColumn(
    req.workspace,
    req.project._id,
    req.user._id
  );
  next();
});

export const loadColumn = asyncHandler(async (req, _res, next) => {
  req.column = await findColumnOrThrow(
    req.params.columnId,
    req.board._id
  );
  next();
});
