import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import type { FileEncryptionResult } from "@/lib/crypto/types";

const KEY_LENGTH = 32;
const NONCE_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const ALGORITHM = "chacha20-poly1305";

function toBuffer(data: Uint8Array): Buffer {
  return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
}

export function encryptFile(fileBuffer: Uint8Array): FileEncryptionResult {
  const key = randomBytes(KEY_LENGTH);
  const nonce = randomBytes(NONCE_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, nonce, { authTagLength: AUTH_TAG_LENGTH });
  const ciphertext = Buffer.concat([cipher.update(toBuffer(fileBuffer)), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: new Uint8Array(ciphertext),
    key: new Uint8Array(key),
    nonce: new Uint8Array(nonce),
    authTag: new Uint8Array(authTag),
  };
}

export function decryptFile(
  ciphertext: Uint8Array,
  key: Uint8Array,
  nonce: Uint8Array,
  authTag: Uint8Array,
): Uint8Array {
  const decipher = createDecipheriv(ALGORITHM, toBuffer(key), toBuffer(nonce), {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(toBuffer(authTag));

  const plaintext = Buffer.concat([decipher.update(toBuffer(ciphertext)), decipher.final()]);
  return new Uint8Array(plaintext);
}
