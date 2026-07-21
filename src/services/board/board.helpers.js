import { Board } from '../../models/board/board.model.js';
import { BOARD_MESSAGES } from '../../constants/boardMessages.js';
import { USER_POPULATE_FIELDS } from '../workspace/workspace.helpers.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  ensureCanCreateBoard,
  ensureCanUpdateBoard,
  ensureCanDeleteBoard,
  ensureCanViewProject,
} from '../workspace-member/memberPermission.helpers.js';
import { findEffectiveProjectMembershipOrThrow } from '../project-member/projectMember.helpers.js';

export const populateBoard = (query) =>
  query
    .populate('createdBy', USER_POPULATE_FIELDS)
    .populate('updatedBy', USER_POPULATE_FIELDS)
    .populate('projectId', 'name status')
    .populate('workspaceId', 'name slug');

export const findBoardOrThrow = async (boardId, projectId, workspaceId) => {
  const board = await Board.findOne({
    _id: boardId,
    projectId,
    workspaceId,
  });

  if (!board) {
    throw ApiError.notFound(BOARD_MESSAGES.NOT_FOUND);
  }

  return board;
};

export const findPopulatedBoardOrThrow = async (
  boardId,
  projectId,
  workspaceId
) => {
  const board = await populateBoard(
    Board.findOne({ _id: boardId, projectId, workspaceId })
  );

  if (!board) {
    throw ApiError.notFound(BOARD_MESSAGES.NOT_FOUND);
  }

  return board;
};

export const ensureActorCanViewBoards = async (workspace, projectId, userId) => {
  const membership = await findEffectiveProjectMembershipOrThrow(
    workspace._id,
    projectId,
    userId
  );
  ensureCanViewProject(membership);
  return membership;
};

export const ensureActorCanCreateBoard = async (workspace, projectId, userId) => {
  const membership = await findEffectiveProjectMembershipOrThrow(
    workspace._id,
    projectId,
    userId
  );
  ensureCanCreateBoard(membership);
  return membership;
};

export const ensureActorCanUpdateBoard = async (workspace, projectId, userId) => {
  const membership = await findEffectiveProjectMembershipOrThrow(
    workspace._id,
    projectId,
    userId
  );
  ensureCanUpdateBoard(membership);
  return membership;
};

export const ensureActorCanDeleteBoard = async (workspace, projectId, userId) => {
  const membership = await findEffectiveProjectMembershipOrThrow(
    workspace._id,
    projectId,
    userId
  );
  ensureCanDeleteBoard(membership);
  return membership;
};
