import { asyncHandler } from '../../utils/asyncHandler.js';
import { loadWorkspaceByWorkspaceId } from '../workspace-member/workspaceMember.middleware.js';
import { findProjectOrThrow } from '../../services/project/project.helpers.js';
import {
  ensureActorCanViewBoards,
  ensureActorCanCreateBoard,
  ensureActorCanUpdateBoard,
  ensureActorCanDeleteBoard,
  findBoardOrThrow,
} from '../../services/board/board.helpers.js';

export { loadWorkspaceByWorkspaceId };

export const loadProjectByProjectId = asyncHandler(async (req, _res, next) => {
  req.project = await findProjectOrThrow(
    req.params.projectId,
    req.workspace._id
  );
  next();
});

export const requireBoardView = asyncHandler(async (req, _res, next) => {
  req.actorMembership = await ensureActorCanViewBoards(
    req.workspace,
    req.user._id
  );
  next();
});

export const requireBoardCreate = asyncHandler(async (req, _res, next) => {
  req.actorMembership = await ensureActorCanCreateBoard(
    req.workspace,
    req.user._id
  );
  next();
});

export const requireBoardUpdate = asyncHandler(async (req, _res, next) => {
  req.actorMembership = await ensureActorCanUpdateBoard(
    req.workspace,
    req.user._id
  );
  next();
});

export const requireBoardDelete = asyncHandler(async (req, _res, next) => {
  req.actorMembership = await ensureActorCanDeleteBoard(
    req.workspace,
    req.user._id
  );
  next();
});

export const loadBoard = asyncHandler(async (req, _res, next) => {
  req.board = await findBoardOrThrow(
    req.params.boardId,
    req.project._id,
    req.workspace._id
  );
  next();
});
