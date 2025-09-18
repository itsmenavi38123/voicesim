import { Secret, Token } from "fernet";

const SECRET_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY 
  ? process.env.NEXT_PUBLIC_ENCRYPTION_KEY 
  : "txKmRmWl7Fifi0rCLbbuItWBFPoVvC-dXb-3wI_vcIs=";
export const decrypt = (cipherText: string): string => {
  if (!cipherText) return "";

  try {
    const secret = new Secret(SECRET_KEY);
    const token = new Token({
      secret: secret,
      token: cipherText,
      ttl: 0, 
    });
    const decoded = token.decode();
    return decoded.toString();
  } catch (err) {
    console.error("Decryption error:", err);
    return "";
  }
};
