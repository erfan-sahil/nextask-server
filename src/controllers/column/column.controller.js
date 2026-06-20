import { columnService } from '../../services/column/column.service.js';
import { COLUMN_MESSAGES } from '../../constants/columnMessages.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const createColumn = asyncHandler(async (req, res) => {
  const column = await columnService.create(
    req.board,
    req.body,
    req.user._id
  );

  res
    .status(201)
    .json(ApiResponse.created({ column }, COLUMN_MESSAGES.CREATED));
});

export const listColumns = asyncHandler(async (req, res) => {
  const result = await columnService.list(req.board);

  res.json(ApiResponse.ok(result, COLUMN_MESSAGES.LIST_FETCHED));
});

export const getColumn = asyncHandler(async (req, res) => {
  const column = await columnService.getById(req.board, req.params.columnId);

  res.json(ApiResponse.ok({ column }, COLUMN_MESSAGES.FETCHED));
});

export const updateColumn = asyncHandler(async (req, res) => {
  const column = await columnService.update(req.board, req.column, req.body);

  res.json(ApiResponse.ok({ column }, COLUMN_MESSAGES.UPDATED));
});

export const deleteColumn = asyncHandler(async (req, res) => {
  await columnService.delete(req.board, req.column);

  res.json(ApiResponse.ok(null, COLUMN_MESSAGES.DELETED));
});
