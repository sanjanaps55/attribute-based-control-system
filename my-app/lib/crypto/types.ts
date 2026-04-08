export type FileEncryptionResult = {
  ciphertext: Uint8Array;
  key: Uint8Array;
  nonce: Uint8Array;
  authTag: Uint8Array;
};

export type EncryptedUploadPayload = {
  ciphertext: Uint8Array;
  encryptedKey: string;
  nonce: Uint8Array;
  authTag: Uint8Array;
};

export type EncryptedUploadPayloadSerialized = {
  ciphertext: string;
  encrypted_key: string;
  nonce: string;
  auth_tag: string;
};

export type AbeEncryptKeyRequest = {
  key: string;
  policy: string;
};

export type AbeEncryptKeyResponse = {
  encrypted_key: string;
};

export type AbeDecryptKeyRequest = {
  encrypted_key: string;
  user_private_key: string;
};

export type AbeDecryptKeyResponse = {
  key?: string;
  error?: string;
};
