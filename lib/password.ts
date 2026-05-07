import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCallback);
const HASH_PREFIX = "scrypt:v1";
const KEY_LENGTH = 64;

export function isPasswordHash(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith(`${HASH_PREFIX}:`);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;

  return `${HASH_PREFIX}:${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  storedPassword: string | null | undefined
): Promise<boolean> {
  if (!storedPassword) return false;

  if (!isPasswordHash(storedPassword)) {
    const passwordBuffer = Buffer.from(password);
    const storedBuffer = Buffer.from(storedPassword);

    return (
      passwordBuffer.length === storedBuffer.length &&
      timingSafeEqual(passwordBuffer, storedBuffer)
    );
  }

  const [, , salt, storedHash] = storedPassword.split(":");

  if (!salt || !storedHash) return false;

  const expectedKey = Buffer.from(storedHash, "hex");
  const actualKey = (await scrypt(password, salt, expectedKey.length)) as Buffer;

  return (
    expectedKey.length === actualKey.length &&
    timingSafeEqual(expectedKey, actualKey)
  );
}
