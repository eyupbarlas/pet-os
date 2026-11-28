// Online RPCs for the household (mobile.md 3.7, backend-sync.md §8). These need a connection;
// the result comes back to every phone through the next sync. Errors are stable codes raised by
// the backend (P0001 + code) and mapped to `error.*` i18n keys.
import { supabase } from '../auth/supabase';

export const RPC_ERRORS = [
  'invite_not_found', 'invite_revoked', 'invite_used', 'invite_expired', 'household_full', 'already_member',
  'confirm_leave_required', 'not_owner', 'not_a_member', 'member_not_found', 'cannot_remove_self',
  'owner_must_be_member', 'owner_must_transfer', 'not_authenticated',
] as const;
export type RpcErrorCode = (typeof RPC_ERRORS)[number] | 'offline' | 'unknown';

export class RpcError extends Error {
  constructor(public code: RpcErrorCode) { super(code); }
}

/** Maps a PostgREST error (or a thrown fetch error) to one of our codes. */
export function toRpcError(e: { code?: string; message?: string } | null | undefined): RpcError {
  const msg = e?.message ?? '';
  if ((RPC_ERRORS as readonly string[]).includes(msg)) return new RpcError(msg as RpcErrorCode);
  if (/network|fetch|timed? ?out|offline/i.test(msg)) return new RpcError('offline');
  return new RpcError('unknown');
}

async function call<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  let res;
  try {
    res = await supabase.rpc(fn, args);
  } catch (e) {
    throw toRpcError(e as Error);
  }
  if (res.error) throw toRpcError(res.error);
  return res.data as T;
}

export interface InvitePreview {
  status: 'ok' | 'already_member' | 'invite_not_found' | 'invite_revoked' | 'invite_used' | 'invite_expired';
  household_name?: string | null;
  inviter_name?: string | null;
  member_names?: string[];
  pet_names?: string[];
  full?: boolean;
  my_current?: {
    household_name: string | null;
    other_member_names: string[];
    pets: { id: string; name: string; species: string }[];
    outcome: 'pets_come_along' | 'leave_pets_stay';
    new_owner_name: string | null;
  } | null;
}

export interface LeaveResult {
  household_deleted: boolean;
  new_owner_member_id: string | null;
  open_invites_revoked: number;
  care_cards: number;
}

export const createInvite = (householdId: string) =>
  call<{ token: string; expires_at: string }>('create_invite', { p_household_id: householdId });
export const revokeInvite = (inviteId: string) => call<void>('revoke_invite', { p_invite_id: inviteId });
export const previewInvite = (token: string) => call<InvitePreview>('preview_invite', { p_token: token });
export const acceptInvite = (token: string, displayName: string, confirmLeave: boolean) =>
  call<{ household_id: string }>('accept_invite', { p_token: token, p_display_name: displayName, p_confirm_leave: confirmLeave });
export const removeMember = (memberId: string) => call<LeaveResult>('remove_member', { p_member_id: memberId });
export const leaveHousehold = (householdId: string) => call<LeaveResult>('leave_household', { p_household_id: householdId });
export const transferOwnership = (householdId: string, memberId: string) =>
  call<void>('transfer_ownership', { p_household_id: householdId, p_member_id: memberId });
export const deleteHousehold = (householdId: string) => call<void>('delete_household', { p_household_id: householdId });
