import type { components } from '@forge/types/api';
import { api } from './api';

export type BusinessProfileDto = components['schemas']['BusinessProfileDto'];
export type UpdateBusinessProfileDto = components['schemas']['UpdateBusinessProfileDto'];
export type TeamListDto = components['schemas']['TeamListDto'];
export type InviteTeamMemberDto = components['schemas']['InviteTeamMemberDto'];
export type UpdateTeamMemberRoleDto = components['schemas']['UpdateTeamMemberRoleDto'];
export type NotificationPrefsDto = components['schemas']['NotificationPrefsDto'];
export type UpdateNotificationPrefsDto = components['schemas']['UpdateNotificationPrefsDto'];
export type SquadStatusDto = components['schemas']['SquadStatusDto'];
export type BillingDto = components['schemas']['BillingDto'];
export type UpdateBillingDto = components['schemas']['UpdateBillingDto'];

export async function getBusinessProfile() {
  return api.get<BusinessProfileDto>('/v1/settings/business');
}

export async function patchBusinessProfile(body: UpdateBusinessProfileDto) {
  return api.patch<BusinessProfileDto, UpdateBusinessProfileDto>('/v1/settings/business', body);
}

export async function getTeam() {
  return api.get<TeamListDto>('/v1/settings/team');
}

export async function inviteTeamMember(body: InviteTeamMemberDto, idempotencyKey: string) {
  return api.post<components['schemas']['PendingInvitationDto'], InviteTeamMemberDto>(
    '/v1/settings/team/invite',
    body,
    { idempotencyKey },
  );
}

export async function updateTeamMemberRole(userId: string, body: UpdateTeamMemberRoleDto) {
  return api.patch<unknown, UpdateTeamMemberRoleDto>(`/v1/settings/team/${userId}`, body);
}

export async function removeTeamMember(userId: string) {
  return api.del<unknown>(`/v1/settings/team/${userId}`);
}

export async function revokeInvitation(invitationId: string) {
  return api.del<unknown>(`/v1/settings/team/invitations/${invitationId}`);
}

export async function getNotificationPrefs() {
  return api.get<NotificationPrefsDto>('/v1/settings/notifications');
}

export async function patchNotificationPrefs(body: UpdateNotificationPrefsDto) {
  return api.patch<NotificationPrefsDto, UpdateNotificationPrefsDto>('/v1/settings/notifications', body);
}

export async function getSquadStatus() {
  return api.get<SquadStatusDto>('/v1/settings/squad');
}

export async function disconnectSquad() {
  return api.post<SquadStatusDto>('/v1/settings/squad/disconnect');
}

export async function getBilling() {
  return api.get<BillingDto>('/v1/settings/billing');
}

export async function patchBilling(body: UpdateBillingDto) {
  return api.patch<BillingDto, UpdateBillingDto>('/v1/settings/billing', body);
}
