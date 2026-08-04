import { Router } from 'express';
import { getWorkspaceReport } from '../../controllers/report/report.controller.js';
import { validate } from '../../middlewares/common/validate.middleware.js';
import { requireAnalyticsView } from '../../middlewares/report/report.middleware.js';
import { loadWorkspaceByWorkspaceId } from '../../middlewares/workspace-member/workspaceMember.middleware.js';
import { getWorkspaceReportSchema } from '../../validations/report/report.validation.js';

const router = Router({ mergeParams: true });

router.use(loadWorkspaceByWorkspaceId);

router.get('/', validate(getWorkspaceReportSchema), requireAnalyticsView, getWorkspaceReport);

export default router;
