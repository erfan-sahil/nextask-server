export const WORKSPACE_MEMBER_MESSAGES = {
  INVITED: 'Workspace invitation sent successfully',
  FETCHED: 'Workspace member fetched successfully',
  LIST_FETCHED: 'Workspace members fetched successfully',
  UPDATED: 'Workspace member updated successfully',
  DELETED: 'Workspace member removed successfully',

  NOT_FOUND: 'Workspace member not found',
  NOT_A_MEMBER: 'You are not a member of this workspace',
  ALREADY_EXISTS: 'User is already a member of this workspace',
  INVALID_USER: 'The specified user does not exist',
  VIEW_DENIED: 'You must be a workspace member to view members',
  PERMISSION_DENIED: 'You do not have permission to perform this action',
  MANAGE_DENIED: 'You do not have permission to manage workspace members',
  TARGET_MANAGE_DENIED:
    'You cannot manage a member with an equal or higher role than yours',
  OWNER_ROLE_ASSIGN: 'OWNER role cannot be assigned through this endpoint',
  OWNER_ROLE_UPDATE: 'The workspace owner role cannot be changed',
  OWNER_REMOVE: 'The workspace owner cannot be removed',
  SELF_OWNER_LEAVE: 'Workspace owner cannot leave without transferring ownership',
  SELF_ROLE_UPDATE: 'You cannot change your own role',
  UPDATE_FIELDS_REQUIRED:
    'At least one field is required to update the workspace member',
};
