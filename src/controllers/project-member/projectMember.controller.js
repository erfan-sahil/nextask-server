import { projectMemberService } from '../../services/project-member/projectMember.service.js';
import { projectInvitationService } from '../../services/project-invitation/projectInvitation.service.js';
import { PROJECT_INVITATION_MESSAGES } from '../../constants/projectInvitationMessages.js';
import { PROJECT_MEMBER_MESSAGES } from '../../constants/projectMemberMessages.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const inviteProjectMember = asyncHandler(async (req, res) => {
  const result = await projectInvitationService.invite(
    req.workspace,
    req.project,
    req.body,
    req.user._id
  );

  const message = result.invitationEmailSent
    ? PROJECT_INVITATION_MESSAGES.SENT
    : PROJECT_INVITATION_MESSAGES.EMAIL_FAILED;

  res.status(201).json(ApiResponse.created(result, message));
});

export const listProjectMembers = asyncHandler(async (req, res) => {
  const result = await projectMemberService.list(req.project, req.query);

  res.json(ApiResponse.ok(result, PROJECT_MEMBER_MESSAGES.LIST_FETCHED));
});

export const getProjectMember = asyncHandler(async (req, res) => {
  const member = await projectMemberService.getById(
    req.project,
    req.params.memberId
  );

  res.json(ApiResponse.ok({ member }, PROJECT_MEMBER_MESSAGES.FETCHED));
});

export const updateProjectMember = asyncHandler(async (req, res) => {
  const member = await projectMemberService.update(
    req.workspace,
    req.project,
    req.projectMember,
    req.body,
    req.user._id
  );

  res.json(ApiResponse.ok({ member }, PROJECT_MEMBER_MESSAGES.UPDATED));
});

export const deleteProjectMember = asyncHandler(async (req, res) => {
  await projectMemberService.remove(
    req.workspace,
    req.project,
    req.projectMember,
    req.user._id
  );

  res.json(ApiResponse.ok(null, PROJECT_MEMBER_MESSAGES.DELETED));
});
