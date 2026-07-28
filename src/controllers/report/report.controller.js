import { reportService } from '../../services/report/report.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const getReportFilters = (query) => {
  const rawProjectIds = query.projectIds;
  const projectIds = (
    Array.isArray(rawProjectIds) ? rawProjectIds : rawProjectIds?.split(',') ?? []
  )
    .map((projectId) => projectId.trim())
    .filter(Boolean);

  return {
    period: query.period,
    from: query.from ? new Date(query.from) : undefined,
    to: query.to ? new Date(query.to) : undefined,
    toIsDateOnly: /^\d{4}-\d{2}-\d{2}$/.test(query.to ?? ''),
    projectIds,
  };
};

export const getWorkspaceReport = asyncHandler(async (req, res) => {
  const report = await reportService.getWorkspaceReport(
    req.workspace._id,
    getReportFilters(req.query)
  );

  res.json(ApiResponse.ok(report, 'Workspace report fetched successfully'));
});
