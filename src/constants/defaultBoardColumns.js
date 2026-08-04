import { DEFAULT_COLUMN_COLOR } from './columnMessages.js';

export const DEFAULT_BOARD_COLUMNS = [
  {
    name: 'Backlog',
    position: 0,
    color: DEFAULT_COLUMN_COLOR,
    isCompletedColumn: false,
  },
  {
    name: 'Todo',
    position: 1,
    color: '#94a3b8',
    isCompletedColumn: false,
  },
  {
    name: 'In Progress',
    position: 2,
    color: '#3b82f6',
    isCompletedColumn: false,
  },
  {
    name: 'In Review',
    position: 3,
    color: '#f59e0b',
    isCompletedColumn: false,
  },
  {
    name: 'Testing',
    position: 4,
    color: '#8b5cf6',
    isCompletedColumn: false,
  },
  {
    name: 'Done',
    position: 5,
    color: '#22c55e',
    isCompletedColumn: true,
  },
];
