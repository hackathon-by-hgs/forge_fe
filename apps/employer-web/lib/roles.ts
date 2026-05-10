import type { components } from '@forge/types/api';

export type DashboardRole = components['schemas']['SessionUserDto']['role'];

export function canPatchBusinessSquadBilling(role: DashboardRole | undefined): boolean {
  return role === 'business_owner' || role === 'business_admin';
}

export function canInviteTeam(role: DashboardRole | undefined): boolean {
  return role === 'business_owner' || role === 'business_admin';
}

export function canChangeTeamRoles(role: DashboardRole | undefined): boolean {
  return role === 'business_owner' || role === 'business_admin';
}

export function isHiringManager(role: DashboardRole | undefined): boolean {
  return role === 'business_hiring_manager';
}
