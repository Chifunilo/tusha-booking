// lib/audit.ts
//
// Audit log writer. Every privileged action must be recorded, and the record
// must be written in the SAME transaction as the change it describes — an
// audit entry that can go missing when something half-fails is worse than no
// audit log at all, because it will be trusted.

import type { PoolClient } from 'pg';
import type { NextRequest } from 'next/server';

export interface AuditEntry {
  adminId: number;
  action: string;        // 'property.approve', 'booking.refund', 'user.suspend'
  entityType: string;    // 'property' | 'booking' | 'user' | 'business' | 'review'
  entityId: number;
  before?: unknown;
  after?: unknown;
  reason?: string | null;
  ip?: string | null;
}

/**
 * Writes an audit entry using an EXISTING transaction client.
 * Always prefer this form so the log and the change commit together.
 */
export async function writeAuditLog(client: PoolClient, entry: AuditEntry): Promise<void> {
  await client.query(
    `INSERT INTO admin_audit_log
       (admin_id, action, entity_type, entity_id, before, after, reason, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      entry.adminId,
      entry.action,
      entry.entityType,
      entry.entityId,
      entry.before === undefined ? null : JSON.stringify(entry.before),
      entry.after === undefined ? null : JSON.stringify(entry.after),
      entry.reason ?? null,
      entry.ip ?? null,
    ],
  );
}

/**
 * Extracts the client IP from proxy headers. Returns null when unknown —
 * never guess, an incorrect IP in an audit log is worse than an absent one.
 */
export function clientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip');
}
