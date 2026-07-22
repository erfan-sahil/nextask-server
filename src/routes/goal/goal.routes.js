import { Router } from 'express';
import {
  createGoal,
  deleteGoal,
  getGoal,
  listGoals,
  updateGoal,
} from '../../controllers/goal/goal.controller.js';
import {
  loadGoal,
  loadWorkspaceByWorkspaceId,
  requireGoalManagement,
  requireGoalView,
} from '../../middlewares/goal/goal.middleware.js';
import { validate } from '../../middlewares/common/validate.middleware.js';
import {
  createGoalSchema,
  goalIdSchema,
  listGoalsSchema,
  updateGoalSchema,
} from '../../validations/goal/goal.validation.js';

const router = Router({ mergeParams: true });

router.use(loadWorkspaceByWorkspaceId);

router.post('/', validate(createGoalSchema), requireGoalManagement, createGoal);
router.get('/', validate(listGoalsSchema), requireGoalView, listGoals);

router.get(
  '/:goalId',
  validate(goalIdSchema),
  requireGoalView,
  getGoal
);

router.patch(
  '/:goalId',
  validate(updateGoalSchema),
  requireGoalManagement,
  loadGoal,
  updateGoal
);

router.delete(
  '/:goalId',
  validate(goalIdSchema),
  requireGoalManagement,
  loadGoal,
  deleteGoal
);

export default router;
