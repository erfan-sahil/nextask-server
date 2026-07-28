import { Column } from '../../models/column/column.model.js';
import { COLUMN_MESSAGES } from '../../constants/columnMessages.js';
import { USER_POPULATE_FIELDS } from '../workspace/workspace.helpers.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  ensureActorCanViewBoards,
  ensureActorCanCreateBoard,
  ensureActorCanUpdateBoard,
  ensureActorCanDeleteBoard,
} from '../board/board.helpers.js';

export const populateColumn = (query) =>
  query.populate('createdBy', USER_POPULATE_FIELDS).populate('boardId', 'name');

export const findColumnOrThrow = async (columnId, boardId) => {
  const column = await Column.findOne({ _id: columnId, boardId });

  if (!column) {
    throw ApiError.notFound(COLUMN_MESSAGES.NOT_FOUND);
  }

  return column;
};

export const findPopulatedColumnOrThrow = async (columnId, boardId) => {
  const column = await populateColumn(Column.findOne({ _id: columnId, boardId }));

  if (!column) {
    throw ApiError.notFound(COLUMN_MESSAGES.NOT_FOUND);
  }

  return column;
};

export const ensureNoOtherCompletedColumn = async (boardId, excludeColumnId = null) => {
  const filter = { boardId, isCompletedColumn: true };

  if (excludeColumnId) {
    filter._id = { $ne: excludeColumnId };
  }

  const existing = await Column.findOne(filter).select('_id');

  if (existing) {
    throw ApiError.badRequest(COLUMN_MESSAGES.COMPLETED_COLUMN_EXISTS);
  }
};

export const shiftPositionsOnCreate = async (boardId, position, session) => {
  await Column.updateMany(
    { boardId, position: { $gte: position } },
    { $inc: { position: 1 } },
    { session }
  );
};

export const shiftPositionsOnUpdate = async (
  boardId,
  columnId,
  oldPosition,
  newPosition,
  session
) => {
  if (oldPosition === newPosition) {
    return;
  }

  if (newPosition > oldPosition) {
    await Column.updateMany(
      {
        boardId,
        _id: { $ne: columnId },
        position: { $gt: oldPosition, $lte: newPosition },
      },
      { $inc: { position: -1 } },
      { session }
    );
    return;
  }

  await Column.updateMany(
    {
      boardId,
      _id: { $ne: columnId },
      position: { $gte: newPosition, $lt: oldPosition },
    },
    { $inc: { position: 1 } },
    { session }
  );
};

export const shiftPositionsOnDelete = async (boardId, position, session) => {
  await Column.updateMany(
    { boardId, position: { $gt: position } },
    { $inc: { position: -1 } },
    { session }
  );
};

export {
  ensureActorCanViewBoards as ensureActorCanViewColumns,
  ensureActorCanCreateBoard as ensureActorCanCreateColumn,
  ensureActorCanUpdateBoard as ensureActorCanUpdateColumn,
  ensureActorCanDeleteBoard as ensureActorCanDeleteColumn,
};
