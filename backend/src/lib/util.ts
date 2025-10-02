import { ulid } from 'ulid';

export function generateId(): string {
  return ulid();
}

export function now(): number {
  return Date.now();
}

export function ttl(days: number): number {
  return Math.floor(Date.now() / 1000) + days * 86400;
}
