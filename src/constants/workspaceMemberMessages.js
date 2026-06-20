export const WORKSPACE_MEMBER_MESSAGES = {
  CREATED: 'Workspace member added successfully',
  FETCHED: 'Workspace member fetched successfully',
  LIST_FETCHED: 'Workspace members fetched successfully',
  UPDATED: 'Workspace member updated successfully',
  DELETED: 'Workspace member removed successfully',

  NOT_FOUND: 'Workspace member not found',
  ALREADY_EXISTS: 'User is already a member of this workspace',
  INVALID_USER: 'The specified user does not exist',
  VIEW_DENIED: 'You must be a workspace member to view members',
  MANAGE_DENIED: 'You do not have permission to manage workspace members',
  OWNER_ROLE_ASSIGN: 'OWNER role cannot be assigned through this endpoint',
  OWNER_ROLE_UPDATE: 'The workspace owner role cannot be changed',
  OWNER_REMOVE: 'The workspace owner cannot be removed',
  SELF_OWNER_LEAVE: 'Workspace owner cannot leave without transferring ownership',
  UPDATE_FIELDS_REQUIRED:
    'At least one field is required to update the workspace member',
};
