export const DEFAULT_COLUMN_COLOR = '#64748b';

export const COLUMN_MESSAGES = {
  CREATED: 'Column created successfully',
  FETCHED: 'Column fetched successfully',
  LIST_FETCHED: 'Columns fetched successfully',
  UPDATED: 'Column updated successfully',
  DELETED: 'Column deleted successfully',

  NOT_FOUND: 'Column not found',
  COMPLETED_COLUMN_EXISTS:
    'This board already has a completed column. Unset the existing one first.',
  HAS_TASKS: 'Move or delete the tasks in this column before deleting the column',
  UPDATE_FIELDS_REQUIRED: 'At least one field is required to update the column',
  INVALID_COLOR: 'Color must be a valid hex color (e.g. #64748B)',
};
