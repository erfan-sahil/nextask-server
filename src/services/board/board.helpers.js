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
import { findActorMembershipOrThrow } from '../workspace-member/workspaceMember.helpers.js';

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

export const ensureActorCanViewBoards = async (workspace, userId) => {
  const membership = await findActorMembershipOrThrow(workspace._id, userId);
  ensureCanViewProject(membership);
  return membership;
};

export const ensureActorCanCreateBoard = async (workspace, userId) => {
  const membership = await findActorMembershipOrThrow(workspace._id, userId);
  ensureCanCreateBoard(membership);
  return membership;
};

export const ensureActorCanUpdateBoard = async (workspace, userId) => {
  const membership = await findActorMembershipOrThrow(workspace._id, userId);
  ensureCanUpdateBoard(membership);
  return membership;
};

export const ensureActorCanDeleteBoard = async (workspace, userId) => {
  const membership = await findActorMembershipOrThrow(workspace._id, userId);
  ensureCanDeleteBoard(membership);
  return membership;
};
