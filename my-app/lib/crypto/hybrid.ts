import "server-only";
import { fromBase64, toBase64 } from "@/lib/crypto/binary";
import { decryptKey, encryptKey } from "@/lib/crypto/abe-client";
import { decryptFile, encryptFile } from "@/lib/crypto/symmetric";
import type { EncryptedUploadPayload, EncryptedUploadPayloadSerialized } from "@/lib/crypto/types";

export async function buildUploadPayload(
  fileBuffer: Uint8Array,
  policy: string,
): Promise<EncryptedUploadPayload> {
  const { ciphertext, key, nonce, authTag } = encryptFile(fileBuffer);
  const encryptedKey = await encryptKey(key, policy);

  return {
    ciphertext,
    encryptedKey,
    nonce,
    authTag,
  };
}

export async function uploadFlow(
  fileBuffer: Uint8Array,
  policy: string,
): Promise<EncryptedUploadPayloadSerialized> {
  const payload = await buildUploadPayload(fileBuffer, policy);
  return {
    ciphertext: toBase64(payload.ciphertext),
    encrypted_key: payload.encryptedKey,
    nonce: toBase64(payload.nonce),
    auth_tag: toBase64(payload.authTag),
  };
}

export async function accessAndDecryptFile(
  ciphertext: Uint8Array,
  encryptedKey: string,
  nonce: Uint8Array,
  authTag: Uint8Array,
  userPrivateKey: string,
): Promise<Uint8Array> {
  try {
    const key = await decryptKey(encryptedKey, userPrivateKey);
    return decryptFile(ciphertext, key, nonce, authTag);
  } catch {
    throw new Error("Access Denied");
  }
}

export async function accessFlow(
  payload: EncryptedUploadPayloadSerialized,
  userPrivateKey: string,
): Promise<Uint8Array> {
  try {
    return await accessAndDecryptFile(
      fromBase64(payload.ciphertext),
      payload.encrypted_key,
      fromBase64(payload.nonce),
      fromBase64(payload.auth_tag),
      userPrivateKey,
    );
  } catch {
    throw new Error("Access Denied");
  }
}
