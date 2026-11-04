import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => scrypt(password, salt, 64, (error, key) => error ? reject(error) : resolve(key)));
}
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${salt}:${(await derive(password, salt)).toString("hex")}`;
}
export async function verifyPassword(password: string, hash: string | null) {
  const [algorithm, salt, encoded] = (hash ?? `scrypt:${"0".repeat(32)}:${"0".repeat(128)}`).split(":");
  if (algorithm !== "scrypt" || !/^[a-f0-9]{32}$/.test(salt ?? "") || !/^[a-f0-9]{128}$/.test(encoded ?? "")) return false;
  return timingSafeEqual(await derive(password, salt), Buffer.from(encoded, "hex")) && hash !== null;
}
