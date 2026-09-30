#!/usr/bin/env node
/**
 * Prints an Apple Music developer token (JWT, ES256) for MusicKit JS.
 *
 * Env:
 *   APPLE_TEAM_ID      Team ID (Apple Developer > Membership)
 *   APPLE_KEY_ID       ID of the MusicKit key
 *   APPLE_PRIVATE_KEY  the .p8 key: its content, or a path to the file
 *   APPLE_ORIGINS      optional, comma separated origins allowed to use the token
 *   APPLE_TOKEN_DAYS   optional, validity in days (max 180, default 180)
 *
 * Usage: echo "VITE_APPLE_MUSIC_TOKEN=$(node scripts/apple-token.mjs)" >> .env.local
 */
import { createPrivateKey, sign } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

const { APPLE_TEAM_ID: iss, APPLE_KEY_ID: kid, APPLE_PRIVATE_KEY: key, APPLE_ORIGINS, APPLE_TOKEN_DAYS } = process.env;
if (!iss || !kid || !key) {
  console.error('APPLE_TEAM_ID, APPLE_KEY_ID and APPLE_PRIVATE_KEY are required.');
  process.exit(1);
}

const pem = key.includes('BEGIN PRIVATE KEY') ? key.replace(/\\n/g, '\n') : (existsSync(key) ? readFileSync(key, 'utf8') : null);
if (!pem) {
  console.error('APPLE_PRIVATE_KEY is neither a PEM key nor an existing file.');
  process.exit(1);
}

const days = Math.min(Number(APPLE_TOKEN_DAYS) || 180, 180);
const iat = Math.floor(Date.now() / 1000);
const payload = { iss, iat, exp: iat + days * 86400 };
const origin = APPLE_ORIGINS?.split(',').map(s => s.trim()).filter(Boolean);
if (origin?.length) payload.origin = origin;

const b64 = obj => Buffer.from(JSON.stringify(obj)).toString('base64url');
const data = `${b64({ alg: 'ES256', kid })}.${b64(payload)}`;
const signature = sign('sha256', Buffer.from(data), { key: createPrivateKey(pem), dsaEncoding: 'ieee-p1363' });
process.stdout.write(`${data}.${signature.toString('base64url')}\n`);
