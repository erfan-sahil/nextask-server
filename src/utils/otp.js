import crypto from 'crypto';

export const generateOtp = () => String(crypto.randomInt(100000, 1000000));

export const hashOtp = (otp) =>
  crypto.createHash('sha256').update(String(otp)).digest('hex');

export const compareOtp = (otp, hashedOtp) => {
  if (!hashedOtp) return false;

  const candidateHash = hashOtp(otp);

  if (candidateHash.length !== hashedOtp.length) return false;

  return crypto.timingSafeEqual(
    Buffer.from(candidateHash),
    Buffer.from(hashedOtp)
  );
};
