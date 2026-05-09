import { addHours, formatISO, subDays, subHours } from 'date-fns';
import type { GeoPoint, Job, JobStatus, WorkerSkill } from '@forge/types';
import { MOCK_EMPLOYERS } from './employers';
import { MOCK_WORKERS } from './workers';
import { NEIGHBORHOOD_COORDS, NEIGHBORHOODS } from './fixtures';
import { createRng, pick, range, rangeFloat } from './rng';

const SKILLS: readonly WorkerSkill[] = ['loader', 'driver', 'unloader', 'general'];

const TITLE_BY_SKILL: Record<WorkerSkill, readonly string[]> = {
  loader: ['Container loaders needed at warehouse', 'Truck loaders, 4 hrs', 'Cargo loaders'],
  driver: ['Delivery driver, light truck', 'Driver — Apapa to VI', 'Local distribution driver'],
  unloader: ['Unloaders for inbound shipment', 'Discharge crew, evening shift'],
  general: ['General hands needed', 'Stocking and inventory help', 'Event setup crew'],
};

const STATUS_DISTRIBUTION: readonly JobStatus[] = [
  'open', 'open', 'open',
  'applications_in', 'applications_in',
  'accepted', 'accepted',
  'in_progress', 'in_progress', 'in_progress',
  'pending_verification',
  'completed', 'completed', 'completed', 'completed', 'completed',
  'draft',
  'cancelled',
];

export const MOCK_JOBS: readonly Job[] = (() => {
  const rng = createRng(0xbeef);
  const list: Job[] = [];
  for (let i = 0; i < 220; i += 1) {
    const employer = pick(rng, MOCK_EMPLOYERS);
    const skill = pick(rng, SKILLS);
    const status = pick(rng, STATUS_DISTRIBUTION);
    const neighborhood = pick(rng, NEIGHBORHOODS);
    const coords = NEIGHBORHOOD_COORDS[neighborhood];
    const location: GeoPoint = {
      lat: coords.lat + rangeFloat(rng, -0.01, 0.01),
      lng: coords.lng + rangeFloat(rng, -0.01, 0.01),
      neighborhood,
    };
    const daysAgo = range(rng, 0, 90);
    const postedAt = subDays(new Date(), daysAgo);
    const start = subHours(postedAt, -range(rng, 1, 48));
    const durationHours = range(rng, 2, 8);
    const assigned =
      status === 'accepted' ||
      status === 'in_progress' ||
      status === 'pending_verification' ||
      status === 'completed';
    const startedAt =
      status === 'in_progress' || status === 'pending_verification' || status === 'completed'
        ? formatISO(start)
        : null;
    const completedAt =
      status === 'completed' ? formatISO(addHours(start, durationHours)) : null;
    list.push({
      id: `job_${String(i + 1).padStart(5, '0')}`,
      employerId: employer.id,
      title: pick(rng, TITLE_BY_SKILL[skill]),
      description:
        'Reliable hands needed. Show up on time, follow site safety rules. Payment via Squad on completion.',
      type: skill,
      payNaira: range(rng, 2000, 15000),
      durationHours,
      location,
      status,
      postedAt: formatISO(postedAt),
      scheduledStartAt: formatISO(start),
      applicationsCount:
        status === 'open' || status === 'applications_in' ? range(rng, 0, 18) : 0,
      assignedWorkerId: assigned ? pick(rng, MOCK_WORKERS).id : null,
      startedAt,
      completedAt,
    });
  }
  return list;
})();

export function getJobById(id: string): Job | undefined {
  return MOCK_JOBS.find((j) => j.id === id);
}

export function getJobsByEmployer(employerId: string): Job[] {
  return MOCK_JOBS.filter((j) => j.employerId === employerId);
}

export function getActiveJobs(): Job[] {
  return MOCK_JOBS.filter(
    (j) =>
      j.status === 'open' ||
      j.status === 'applications_in' ||
      j.status === 'accepted' ||
      j.status === 'in_progress',
  );
}
