// Invite secrets. The link carries the secret; the database stores only its SHA-256 hash.
import { createHash, randomBytes } from 'node:crypto';

export const newToken = () => randomBytes(24).toString('base64url');
export const hashToken = (token: string) => createHash('sha256').update(token, 'utf8').digest('hex');
