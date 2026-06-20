import { workspaceMemberService } from '../../services/workspace-member/workspaceMember.service.js';
import { WORKSPACE_MEMBER_MESSAGES } from '../../constants/workspaceMemberMessages.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const createWorkspaceMember = asyncHandler(async (req, res) => {
  const member = await workspaceMemberService.create(
    req.workspace,
    req.body,
    req.user._id
  );

  res
    .status(201)
    .json(ApiResponse.created({ member }, WORKSPACE_MEMBER_MESSAGES.CREATED));
});

export const listWorkspaceMembers = asyncHandler(async (req, res) => {
  const result = await workspaceMemberService.list(req.workspace, req.query);

  res.json(ApiResponse.ok(result, WORKSPACE_MEMBER_MESSAGES.LIST_FETCHED));
});

export const getWorkspaceMember = asyncHandler(async (req, res) => {
  const member = await workspaceMemberService.getById(
    req.workspace,
    req.params.memberId
  );

  res.json(ApiResponse.ok({ member }, WORKSPACE_MEMBER_MESSAGES.FETCHED));
});

export const updateWorkspaceMember = asyncHandler(async (req, res) => {
  const member = await workspaceMemberService.update(
    req.workspace,
    req.workspaceMember,
    req.body,
    req.user._id
  );

  res.json(ApiResponse.ok({ member }, WORKSPACE_MEMBER_MESSAGES.UPDATED));
});

export const deleteWorkspaceMember = asyncHandler(async (req, res) => {
  await workspaceMemberService.remove(
    req.workspace,
    req.workspaceMember,
    req.user._id
  );

  res.json(ApiResponse.ok(null, WORKSPACE_MEMBER_MESSAGES.DELETED));
});
