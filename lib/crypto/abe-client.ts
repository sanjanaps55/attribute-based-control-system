import "server-only";
import type {
  AbeDecryptKeyRequest,
  AbeDecryptKeyResponse,
  AbeEncryptKeyRequest,
  AbeEncryptKeyResponse,
} from "@/lib/crypto/types";
import { fromBase64, toBase64 } from "@/lib/crypto/binary";

const defaultBaseUrl = process.env.ABE_SERVICE_URL ?? "http://localhost:8000";

export async function encryptKey(
  key: Uint8Array,
  policy: string,
  baseUrl = defaultBaseUrl,
): Promise<string> {
  const body: AbeEncryptKeyRequest = { key: toBase64(key), policy };

  const response = await fetch(`${baseUrl}/abe/encrypt-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = (await response.json()) as AbeEncryptKeyResponse & { error?: string };
  if (!response.ok || !data.encrypted_key) {
    throw new Error(data.error ?? "ABE key encryption failed.");
  }

  return data.encrypted_key;
}

export async function decryptKey(
  encryptedKey: string,
  userPrivateKey: string,
  baseUrl = defaultBaseUrl,
): Promise<Uint8Array> {
  const body: AbeDecryptKeyRequest = {
    encrypted_key: encryptedKey,
    user_private_key: userPrivateKey,
  };

  const response = await fetch(`${baseUrl}/abe/decrypt-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = (await response.json()) as AbeDecryptKeyResponse;
  if (!response.ok || !data.key) {
    throw new Error(data.error ?? "Access Denied");
  }

  return fromBase64(data.key);
}
