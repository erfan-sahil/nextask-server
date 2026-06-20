import { boardService } from '../../services/board/board.service.js';
import { BOARD_MESSAGES } from '../../constants/boardMessages.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const createBoard = asyncHandler(async (req, res) => {
  const board = await boardService.create(
    req.workspace,
    req.project,
    req.body,
    req.user._id
  );

  res
    .status(201)
    .json(ApiResponse.created({ board }, BOARD_MESSAGES.CREATED));
});

export const listBoards = asyncHandler(async (req, res) => {
  const result = await boardService.list(req.project, req.query);

  res.json(ApiResponse.ok(result, BOARD_MESSAGES.LIST_FETCHED));
});

export const getBoard = asyncHandler(async (req, res) => {
  const board = await boardService.getById(
    req.workspace,
    req.project,
    req.params.boardId
  );

  res.json(ApiResponse.ok({ board }, BOARD_MESSAGES.FETCHED));
});

export const updateBoard = asyncHandler(async (req, res) => {
  const board = await boardService.update(
    req.workspace,
    req.project,
    req.board,
    req.body,
    req.user._id
  );

  res.json(ApiResponse.ok({ board }, BOARD_MESSAGES.UPDATED));
});

export const deleteBoard = asyncHandler(async (req, res) => {
  await boardService.delete(req.workspace, req.project, req.board);

  res.json(ApiResponse.ok(null, BOARD_MESSAGES.DELETED));
});
