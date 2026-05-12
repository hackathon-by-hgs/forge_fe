'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import {
  AlertBanner,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  FormField,
  Input,
  LocationPicker,
  Select,
  Textarea,
} from '@forge/ui';
import { formatCurrency } from '@forge/ui/utils';
import { IconBriefcase, IconClock, IconLocation } from '@forge/ui/icons';
import { createJob, type CreateJobInput, type JobTemplate } from '../../../lib/jobsApi';
import { ApiError } from '../../../lib/api';
import {
  DEFAULT_LOCATION,
  DEFAULT_LOCATION_ID,
  LOCATIONS_BY_ID,
  NIGERIAN_LOCATIONS,
  NIGERIAN_STATES,
  OTHER_LOCATION_ID,
} from '../../../lib/nigerianLocations';

const schema = z
  .object({
    type: z.enum(['loader', 'driver', 'unloader', 'general']),
    title: z.string().min(3, 'A clear title helps the right workers find this').max(120),
    description: z.string().min(10, 'Describe the work, the site, and any safety').max(4000),
    payNaira: z.coerce.number().int().min(1500, 'Minimum job pay is ₦1,500').max(200_000),
    durationHours: z.coerce.number().int().min(1).max(24),
    locationId: z.string().min(1, 'Pick a location'),
    state: z.string().max(64).optional().or(z.literal('')),
    city: z.string().max(120).optional().or(z.literal('')),
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
    address: z.string().min(5, 'Add a recognisable address').max(200),
    startAt: z.string().min(1, 'Pick a start date and time'),
    audience: z.enum(['public', 'team_first']),
    geofenceRadiusMeters: z.coerce.number().int().min(50).max(2000),
    postNow: z.boolean(),
    requiredEquipment: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.locationId === OTHER_LOCATION_ID) {
      if (!data.state || data.state.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Pick a state',
          path: ['state'],
        });
      }
      if (!data.city || data.city.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Enter a city or town',
          path: ['city'],
        });
      }
    }
  });

type FormValues = z.infer<typeof schema>;

const JOB_TYPES: { value: FormValues['type']; label: string; hint: string }[] = [
  { value: 'loader', label: 'Loader', hint: 'Container & cargo loading' },
  { value: 'driver', label: 'Driver', hint: 'Local distribution, light truck' },
  { value: 'unloader', label: 'Unloader', hint: 'Discharge crews, intake' },
  { value: 'general', label: 'General', hint: 'Stocking, setup, teardown' },
];

const DEFAULTS: FormValues = {
  type: 'loader',
  title: '',
  description: '',
  payNaira: 5000,
  durationHours: 4,
  locationId: DEFAULT_LOCATION_ID,
  state: '',
  city: '',
  lat: DEFAULT_LOCATION.lat,
  lng: DEFAULT_LOCATION.lng,
  address: '',
  startAt: '',
  audience: 'public',
  geofenceRadiusMeters: 200,
  postNow: true,
  requiredEquipment: '',
};

const LOCATION_OPTIONS = [
  { label: 'Other (type details below)', value: OTHER_LOCATION_ID },
  ...NIGERIAN_LOCATIONS.map((loc) => ({
    label: `${loc.name} — ${loc.city}${loc.city !== loc.state ? `, ${loc.state}` : ''}`,
    value: loc.id,
  })),
];

const STATE_OPTIONS = NIGERIAN_STATES.map((s) => ({ label: s, value: s }));

function matchTemplateLocation(neighborhood: string | undefined | null): string {
  if (!neighborhood) return DEFAULT_LOCATION_ID;
  const needle = neighborhood.trim().toLowerCase();
  const exact = NIGERIAN_LOCATIONS.find((l) => l.name.toLowerCase() === needle);
  if (exact) return exact.id;
  const partial = NIGERIAN_LOCATIONS.find(
    (l) => l.name.toLowerCase().includes(needle) || needle.includes(l.name.toLowerCase()),
  );
  return partial?.id ?? DEFAULT_LOCATION_ID;
}

export function PostJobForm({ template }: { template?: JobTemplate | null }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [insufficientFunds, setInsufficientFunds] = useState<{
    message: string;
    walletBalanceNaira: number;
    requiredNaira: number;
    shortfallNaira: number;
  } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    if (!template) return;
    const locationId = matchTemplateLocation(template.location.neighborhood);
    const loc = LOCATIONS_BY_ID[locationId] ?? DEFAULT_LOCATION;
    reset({
      type: template.type,
      title: template.title,
      description: DEFAULTS.description,
      payNaira: template.payNaira,
      durationHours: template.durationHours,
      locationId,
      state: '',
      city: '',
      lat: loc.lat,
      lng: loc.lng,
      address: template.location.address,
      startAt: '',
      audience: 'public',
      geofenceRadiusMeters: DEFAULTS.geofenceRadiusMeters,
      postNow: true,
      requiredEquipment: (template.requiredEquipment ?? []).join(', '),
    });
  }, [template, reset]);

  const watchedType = watch('type');
  const watchedLocationId = watch('locationId');
  const watchedState = watch('state');
  const watchedCity = watch('city');
  const watchedLat = watch('lat');
  const watchedLng = watch('lng');
  const watchedPay = watch('payNaira');
  const watchedStartAt = watch('startAt');
  const watchedRadius = watch('geofenceRadiusMeters');
  const isOtherLocation = watchedLocationId === OTHER_LOCATION_ID;
  const selectedLocation = LOCATIONS_BY_ID[watchedLocationId];

  const startInPast =
    watchedStartAt && new Date(watchedStartAt).getTime() < Date.now() - 60_000;

  const mutate = useMutation({
    mutationFn: (input: CreateJobInput) => createJob(input),
    onSuccess: (job) => {
      void queryClient.invalidateQueries({ queryKey: ['employer', 'jobs'] });
      void queryClient.invalidateQueries({ queryKey: ['employer', 'overview'] });
      router.push(`/jobs/${job.id}`);
    },
    onError: (err) => {
      const funds = insufficientFundsFromApi(err);
      if (funds) {
        setInsufficientFunds(funds);
        return;
      }
      const fe = fieldErrorsFromApi(err);
      if (fe) setFieldErrors(fe);
      setServerError(humanError(err));
    },
  });

  const onSubmit = handleSubmit((values) => {
    setFieldErrors({});
    setServerError(null);
    setInsufficientFunds(null);
    const equipment = (values.requiredEquipment ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 20);

    // For preset locations, send the preset's canonical name as neighborhood.
    // For "Other", use the typed city as the human-readable label.
    const preset = LOCATIONS_BY_ID[values.locationId];
    const neighborhood =
      values.locationId === OTHER_LOCATION_ID
        ? (values.city ?? '').trim()
        : preset?.name ?? null;

    mutate.mutate({
      title: values.title,
      description: values.description,
      type: values.type,
      payNaira: values.payNaira,
      durationHours: values.durationHours,
      location: {
        lat: values.lat,
        lng: values.lng,
        address: values.address,
        neighborhood: neighborhood || null,
      },
      geofenceRadiusMeters: values.geofenceRadiusMeters,
      audience: values.audience,
      scheduledStartAt: new Date(values.startAt).toISOString(),
      requiredEquipment: equipment.length ? equipment : undefined,
      postNow: values.postNow,
    });
  });

  const handleLocationChange = (id: string) => {
    setValue('locationId', id, { shouldValidate: true });
    if (id === OTHER_LOCATION_ID) {
      // Don't move the pin — user will pick via map/search/geolocation.
      return;
    }
    const loc = LOCATIONS_BY_ID[id];
    if (loc) {
      setValue('lat', loc.lat, { shouldValidate: true });
      setValue('lng', loc.lng, { shouldValidate: true });
      // Clear typed state/city when switching back to a preset.
      setValue('state', '', { shouldValidate: false });
      setValue('city', '', { shouldValidate: false });
    }
  };

  const handlePinChange = (coords: { lat: number; lng: number }) => {
    setValue('lat', coords.lat, { shouldValidate: true });
    setValue('lng', coords.lng, { shouldValidate: true });
  };

  const handleAddressFromSearch = (formattedAddress: string) => {
    setValue('address', formattedAddress, { shouldValidate: true });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6 pb-24">
      {insufficientFunds ? (
        <AlertBanner
          tone="warning"
          title="Top up your wallet to publish this job"
          description={
            <span className="space-y-1">
              <span className="block">{insufficientFunds.message}</span>
              <span className="block text-xs text-neutral-600">
                Wallet{' '}
                <span className="font-medium tabular-nums">
                  {formatCurrency(insufficientFunds.walletBalanceNaira)}
                </span>{' '}
                · Required{' '}
                <span className="font-medium tabular-nums">
                  {formatCurrency(insufficientFunds.requiredNaira)}
                </span>{' '}
                · Short{' '}
                <span className="font-medium text-danger-700 tabular-nums">
                  {formatCurrency(insufficientFunds.shortfallNaira)}
                </span>
              </span>
            </span>
          }
          action={
            <Link href="/">
              <Button size="sm">Top up wallet</Button>
            </Link>
          }
          onDismiss={() => setInsufficientFunds(null)}
        />
      ) : null}

      {serverError ? (
        <AlertBanner
          tone="danger"
          title="Couldn’t post job"
          description={serverError}
          onDismiss={() => setServerError(null)}
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Job basics</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <fieldset>
            <legend className="mb-2 text-xs font-medium text-neutral-700">
              Job type <span className="text-danger-500">*</span>
            </legend>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {JOB_TYPES.map((opt) => {
                const active = watchedType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setValue('type', opt.value, { shouldValidate: true })}
                    className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors ${
                      active
                        ? 'border-accent-500 bg-accent-50/60 text-accent-700'
                        : 'border-outline bg-surface text-neutral-700 hover:bg-surface-container-high'
                    }`}
                  >
                    <IconBriefcase className="!h-4 !w-4" />
                    <span className="text-sm font-medium">{opt.label}</span>
                    <span className="text-xs text-neutral-500">{opt.hint}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <FormField
            label="Title"
            required
            error={errors.title?.message ?? fieldErrors.title}
            hint="Make it specific. e.g., 'Truck loaders for early shipment, Apapa terminal'"
          >
            <Input placeholder="Container loaders needed at warehouse" {...register('title')} />
          </FormField>

          <FormField
            label="Description"
            required
            error={errors.description?.message ?? fieldErrors.description}
          >
            <Textarea
              rows={5}
              placeholder="What the worker will do, site rules, any equipment provided…"
              {...register('description')}
            />
          </FormField>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compensation</CardTitle>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            label="Pay (₦)"
            required
            error={errors.payNaira?.message ?? fieldErrors.payNaira}
            hint={`That's ${formatCurrency(watchedPay || 0)} flat.`}
          >
            <Input type="number" min={1500} step={500} {...register('payNaira')} />
          </FormField>
          <FormField
            label="Duration (hours)"
            required
            error={errors.durationHours?.message ?? fieldErrors.durationHours}
          >
            <Input type="number" min={1} max={24} step={1} {...register('durationHours')} />
          </FormField>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Location & schedule</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              label="Area"
              required
              error={errors.locationId?.message}
              hint="Pick the closest area, then drop the pin on the map for the exact site."
            >
              <Select
                options={LOCATION_OPTIONS}
                value={watchedLocationId}
                onChange={(e) => handleLocationChange(e.target.value)}
              />
            </FormField>
            <FormField
              label="Address"
              required
              error={errors.address?.message ?? fieldErrors['location.address']}
              hint={isOtherLocation ? 'Street + landmark — or pick on the map below.' : undefined}
            >
              <Input placeholder="14 Wharf Road, Apapa, Lagos" {...register('address')} />
            </FormField>
          </div>
          {isOtherLocation ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                label="State"
                required
                error={errors.state?.message}
              >
                <Select
                  options={STATE_OPTIONS}
                  placeholder="Pick a state…"
                  value={watchedState ?? ''}
                  onChange={(e) =>
                    setValue('state', e.target.value, { shouldValidate: true })
                  }
                />
              </FormField>
              <FormField
                label="City or town"
                required
                error={errors.city?.message}
              >
                <Input
                  placeholder="e.g., Sango Ota"
                  value={watchedCity ?? ''}
                  onChange={(e) =>
                    setValue('city', e.target.value, { shouldValidate: true })
                  }
                />
              </FormField>
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Start at" required error={errors.startAt?.message}>
              <Input type="datetime-local" {...register('startAt')} />
            </FormField>
            <FormField
              label="Geofence (m)"
              error={errors.geofenceRadiusMeters?.message ?? fieldErrors.geofenceRadiusMeters}
              hint="50–2000m — workers must clock in within this radius."
            >
              <Input
                type="number"
                min={50}
                max={2000}
                step={50}
                {...register('geofenceRadiusMeters')}
              />
            </FormField>
          </div>
          {startInPast ? (
            <p className="text-xs text-warning-700">
              The scheduled start is in the past. Double-check the date and time.
            </p>
          ) : null}

          <LocationPicker
            value={{ lat: watchedLat, lng: watchedLng }}
            onChange={handlePinChange}
            radiusMeters={watchedRadius}
            onAddressSelect={handleAddressFromSearch}
            googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
            className="w-full"
          />
          <p className="flex items-center gap-1 text-xs text-neutral-500">
            <IconLocation className="!h-3 !w-3" />
            {isOtherLocation
              ? `${(watchedCity ?? '').trim() || '—'}${watchedState ? `, ${watchedState}` : ''}`
              : selectedLocation
                ? `${selectedLocation.name}, ${selectedLocation.state}`
                : '—'}
            {' · '}
            <span className="font-mono text-[11px]">
              {Number.isFinite(watchedLat) ? watchedLat.toFixed(5) : '?'},{' '}
              {Number.isFinite(watchedLng) ? watchedLng.toFixed(5) : '?'}
            </span>
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audience</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          <label className="flex items-start gap-3 rounded-lg border border-outline p-3 hover:border-outline hover:bg-surface-container-high">
            <input
              type="radio"
              value="public"
              {...register('audience')}
              className="mt-0.5 accent-accent-500"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-900">
                Open to all eligible workers
              </p>
              <p className="text-xs text-neutral-500">
                Any qualifying worker in range will see this job immediately.
              </p>
            </div>
          </label>
          <label className="flex items-start gap-3 rounded-lg border border-outline p-3 hover:border-outline hover:bg-surface-container-high">
            <input
              type="radio"
              value="team_first"
              {...register('audience')}
              className="mt-0.5 accent-accent-500"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-900">Post to my team first</p>
              <p className="text-xs text-neutral-500">
                Your saved workers see this job 30 minutes before the BE auto-flips it to
                public.
              </p>
            </div>
          </label>
          <p className="text-xs text-neutral-500">
            Tip: use “Save as draft” to keep this job hidden and publish later from the
            Drafts tab.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Equipment</CardTitle>
        </CardHeader>
        <CardBody>
          <FormField label="Required equipment" hint="Comma-separated list (max 20).">
            <Input
              placeholder="Safety boots, Gloves, Hi-vis vest"
              {...register('requiredEquipment')}
            />
          </FormField>
        </CardBody>
      </Card>

      <div className="sticky bottom-0 -mx-6 border-t border-outline bg-surface/95 px-6 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-neutral-500">
            <IconClock className="!h-3.5 !w-3.5 -mt-0.5 mr-0.5 inline-block" />
            {watch('postNow') ? 'Will publish immediately' : 'Will save as draft'} ·{' '}
            {watch('audience') === 'team_first' ? (
              <Badge tone="accent" variant="outline">
                Team first
              </Badge>
            ) : (
              <span>Public</span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setValue('postNow', false);
                void onSubmit();
              }}
              loading={isSubmitting || (mutate.isPending && !watch('postNow'))}
            >
              Save as draft
            </Button>
            <Button
              type="submit"
              loading={isSubmitting || (mutate.isPending && watch('postNow'))}
              onClick={() => setValue('postNow', true)}
            >
              Post job
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

function humanError(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}

function fieldErrorsFromApi(err: unknown): Record<string, string> | null {
  if (!(err instanceof ApiError) || err.code !== 'VALIDATION_FAILED') return null;
  const errors =
    (err.details?.errors as Array<{ field?: string; message?: string }>) ?? [];
  const out: Record<string, string> = {};
  for (const e of errors) {
    if (e?.field) out[e.field] = e.message ?? 'Invalid value';
  }
  return Object.keys(out).length ? out : null;
}

function insufficientFundsFromApi(err: unknown): {
  message: string;
  walletBalanceNaira: number;
  requiredNaira: number;
  shortfallNaira: number;
} | null {
  if (!(err instanceof ApiError) || err.code !== 'INSUFFICIENT_FUNDS') return null;
  const d = err.details ?? {};
  const wallet = typeof d.walletBalanceNaira === 'number' ? d.walletBalanceNaira : 0;
  const required = typeof d.requiredNaira === 'number' ? d.requiredNaira : 0;
  const shortfall = typeof d.shortfallNaira === 'number' ? d.shortfallNaira : Math.max(0, required - wallet);
  return {
    message: err.message,
    walletBalanceNaira: wallet,
    requiredNaira: required,
    shortfallNaira: shortfall,
  };
}
