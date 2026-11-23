import { type AbstractPowerSyncDatabase, type PowerSyncBackendConnector, UpdateType } from '@powersync/common';
import { config } from '../../config';
import { supabase } from '../auth/supabase';
import { classifyUploadError } from './errors';

// Per-table write map (mobile.md 3.3). Not a blanket upsert.
const FIRST_WINS = new Set(['tick', 'rest_day']);                       // insert, ignore duplicates
const UPSERT = new Set(['pet_place', 'vet_contact', 'reminder_pref', 'notification_settings']);
const NO_DELETE = new Set(['task']);                                     // remove = ends_on, never DELETE

export class SupabaseConnector implements PowerSyncBackendConnector {
  async fetchCredentials() {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) throw new Error('no session');
    return { endpoint: config.powersyncUrl, token: data.session.access_token, expiresAt: data.session.expires_at ? new Date(data.session.expires_at * 1000) : undefined };
  }

  async uploadData(database: AbstractPowerSyncDatabase) {
    const tx = await database.getNextCrudTransaction();
    if (!tx) return;
    try {
      for (const op of tx.crud) {
        const table = supabase.from(op.table);
        const row = { ...op.opData, id: op.id };
        let res;
        if (op.op === UpdateType.PUT) {
          res = FIRST_WINS.has(op.table) ? await table.upsert(row, { onConflict: 'id', ignoreDuplicates: true })
              : UPSERT.has(op.table) ? await table.upsert(row, { onConflict: 'id' })
              : await table.insert(row);
        } else if (op.op === UpdateType.PATCH) {
          res = await table.update(op.opData!).eq('id', op.id);
        } else {
          if (NO_DELETE.has(op.table)) continue;
          res = await table.delete().eq('id', op.id);
        }
        if (res.error) throw { code: res.error.code, status: res.status, message: res.error.message, op: op.op };
      }
      await tx.complete();
    } catch (e: any) {
      const action = classifyUploadError(e, { idempotentInsert: e?.op === UpdateType.PUT });
      if (action === 'discard') {
        // Table name and code only, no data (privacy). Next sync restores server truth.
        console.warn('[sync] discarded a write:', e?.code);
        await tx.complete();
      } else {
        throw e; // PowerSync backs off and retries
      }
    }
  }
}
