import { dashboardService } from '../../services/dashboard/dashboard.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getDashboardOverview = asyncHandler(async (req, res) => {
  const dashboard = await dashboardService.getOverview(req.user._id);

  res.json(ApiResponse.ok(dashboard, 'Dashboard overview fetched successfully'));
});
