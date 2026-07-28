import crypto from 'crypto';

export const generateInvitationToken = () => crypto.randomBytes(32).toString('hex');

export const hashInvitationToken = (token) =>
  crypto.createHash('sha256').update(String(token)).digest('hex');

export const compareInvitationToken = (token, hashedToken) => {
  if (!hashedToken) return false;

  const candidateHash = hashInvitationToken(token);

  if (candidateHash.length !== hashedToken.length) return false;

  return crypto.timingSafeEqual(Buffer.from(candidateHash), Buffer.from(hashedToken));
};
