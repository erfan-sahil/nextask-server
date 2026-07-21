export const WORKSPACE_MEMBER_ROLE = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
};

// Roles that can be granted to a user through an invitation or a role update.
// OWNER is reserved for the creator and cannot be assigned.
export const ASSIGNABLE_MEMBER_ROLES = [
  WORKSPACE_MEMBER_ROLE.ADMIN,
  WORKSPACE_MEMBER_ROLE.MEMBER,
];
