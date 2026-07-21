export const PROJECT_MEMBER_MESSAGES = {
  INVITED: 'Project invitation sent successfully',
  FETCHED: 'Project member fetched successfully',
  LIST_FETCHED: 'Project members fetched successfully',
  UPDATED: 'Project member updated successfully',
  DELETED: 'Project member removed successfully',

  NOT_FOUND: 'Project member not found',
  NOT_A_MEMBER: 'You do not have access to this project',
  ALREADY_EXISTS: 'User is already a member of this project',
  INVALID_USER: 'The specified user does not exist',
  PERMISSION_DENIED: 'You do not have permission to perform this action',
  TARGET_MANAGE_DENIED:
    'You cannot manage a member with an equal or higher role than yours',
  OWNER_ROLE_ASSIGN: 'OWNER role cannot be assigned to a project member',
  OWNER_ROLE_UPDATE: 'The project owner role cannot be changed',
  OWNER_REMOVE: 'The project owner cannot be removed',
  SELF_OWNER_LEAVE: 'Project owner cannot leave the project',
  SELF_ROLE_UPDATE: 'You cannot change your own role',
  UPDATE_FIELDS_REQUIRED:
    'At least one field is required to update the project member',
};
