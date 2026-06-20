import { asyncHandler } from '../../utils/asyncHandler.js';
import { findWorkspaceOrThrow } from '../../services/workspace/workspace.helpers.js';
import {
  ensureCanViewMembers,
  ensureCanManageMembers,
  findMemberOrThrow,
} from '../../services/workspace-member/workspaceMember.helpers.js';

export const loadWorkspaceByWorkspaceId = asyncHandler(
  async (req, _res, next) => {
    req.workspace = await findWorkspaceOrThrow(req.params.workspaceId);
    next();
  }
);

export const requireWorkspaceMemberView = asyncHandler(
  async (req, _res, next) => {
    await ensureCanViewMembers(req.workspace, req.user._id);
    next();
  }
);

export const requireWorkspaceMemberManage = asyncHandler(
  async (req, _res, next) => {
    await ensureCanManageMembers(req.workspace, req.user._id);
    next();
  }
);

export const loadWorkspaceMember = asyncHandler(async (req, _res, next) => {
  req.workspaceMember = await findMemberOrThrow(
    req.params.memberId,
    req.workspace._id
  );
  next();
});
