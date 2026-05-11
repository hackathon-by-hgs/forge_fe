'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
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
  MapPlaceholder,
  Select,
  Textarea,
} from '@forge/ui';
import { formatCurrency } from '@forge/ui/utils';
import { IconBriefcase, IconClock, IconLocation } from '@forge/ui/icons';
import { createJob, type CreateJobInput, type JobTemplate } from '../../../lib/jobsApi';
import { ApiError } from '../../../lib/api';

const NEIGHBORHOODS = [
  'Apapa',
  'Lekki',
  'Victoria Island',
  'Ikeja',
  'Mile 2',
  'Surulere',
  'Yaba',
  'Ikoyi',
  'Ajah',
  'Festac',
  'Oshodi',
] as const;

const NEIGHBORHOOD_COORDS: Record<(typeof NEIGHBORHOODS)[number], { lat: number; lng: number }> = {
  Apapa: { lat: 6.4458, lng: 3.3608 },
  Lekki: { lat: 6.4392, lng: 3.5036 },
  'Victoria Island': { lat: 6.4281, lng: 3.4219 },
  Ikeja: { lat: 6.6018, lng: 3.3515 },
  'Mile 2': { lat: 6.4641, lng: 3.3061 },
  Surulere: { lat: 6.4969, lng: 3.3597 },
  Yaba: { lat: 6.5095, lng: 3.3711 },
  Ikoyi: { lat: 6.4541, lng: 3.4316 },
  Ajah: { lat: 6.4641, lng: 3.5852 },
  Festac: { lat: 6.4669, lng: 3.2825 },
  Oshodi: { lat: 6.5547, lng: 3.3445 },
};

const schema = z.object({
  type: z.enum(['loader', 'driver', 'unloader', 'general']),
  title: z.string().min(3, 'A clear title helps the right workers find this').max(120),
  description: z.string().min(10, 'Describe the work, the site, and any safety').max(4000),
  payNaira: z.coerce.number().int().min(1500, 'Minimum job pay is ₦1,500').max(200_000),
  durationHours: z.coerce.number().int().min(1).max(24),
  neighborhood: z.enum(NEIGHBORHOODS),
  address: z.string().min(5, 'Add a recognisable address').max(200),
  startAt: z.string().min(1, 'Pick a start date and time'),
  audience: z.enum(['public', 'team_first']),
  geofenceRadiusMeters: z.coerce.number().int().min(50).max(2000),
  postNow: z.boolean(),
  requiredEquipment: z.string().optional(),
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
  neighborhood: 'Apapa',
  address: '',
  startAt: '',
  audience: 'public',
  geofenceRadiusMeters: 200,
  postNow: true,
  requiredEquipment: '',
};

export function PostJobForm({ template }: { template?: JobTemplate | null }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
    reset({
      type: template.type,
      title: template.title,
      description: DEFAULTS.description,
      payNaira: template.payNaira,
      durationHours: template.durationHours,
      neighborhood: (NEIGHBORHOODS as readonly string[]).includes(
        template.location.neighborhood ?? '',
      )
        ? ((template.location.neighborhood as (typeof NEIGHBORHOODS)[number]) ?? 'Apapa')
        : 'Apapa',
      address: template.location.address,
      startAt: '',
      audience: 'public',
      geofenceRadiusMeters: DEFAULTS.geofenceRadiusMeters,
      postNow: true,
      requiredEquipment: (template.requiredEquipment ?? []).join(', '),
    });
  }, [template, reset]);

  const watchedType = watch('type');
  const watchedNeighborhood = watch('neighborhood');
  const watchedPay = watch('payNaira');
  const watchedStartAt = watch('startAt');

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
      const fe = fieldErrorsFromApi(err);
      if (fe) setFieldErrors(fe);
      setServerError(humanError(err));
    },
  });

  const onSubmit = handleSubmit((values) => {
    setFieldErrors({});
    setServerError(null);
    const coords = NEIGHBORHOOD_COORDS[values.neighborhood];
    const equipment = (values.requiredEquipment ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 20);

    mutate.mutate({
      title: values.title,
      description: values.description,
      type: values.type,
      payNaira: values.payNaira,
      durationHours: values.durationHours,
      location: {
        lat: coords.lat,
        lng: coords.lng,
        address: values.address,
        neighborhood: values.neighborhood,
      },
      geofenceRadiusMeters: values.geofenceRadiusMeters,
      audience: values.audience,
      scheduledStartAt: new Date(values.startAt).toISOString(),
      requiredEquipment: equipment.length ? equipment : undefined,
      postNow: values.postNow,
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6 pb-24">
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
              label="Neighborhood"
              required
              error={errors.neighborhood?.message}
            >
              <Select
                options={NEIGHBORHOODS.map((n) => ({ label: n, value: n }))}
                {...register('neighborhood')}
              />
            </FormField>
            <FormField
              label="Address"
              required
              error={errors.address?.message ?? fieldErrors['location.address']}
            >
              <Input placeholder="14 Wharf Road, Apapa, Lagos" {...register('address')} />
            </FormField>
          </div>
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

          <MapPlaceholder
            pins={[
              {
                id: 'preview',
                lat: NEIGHBORHOOD_COORDS[watchedNeighborhood].lat,
                lng: NEIGHBORHOOD_COORDS[watchedNeighborhood].lng,
                tone: 'accent',
              },
            ]}
            className="aspect-[16/6]"
            hint={
              <span className="inline-flex items-center gap-1">
                <IconLocation className="!h-3 !w-3" />
                {watchedNeighborhood}, Lagos
              </span>
            }
          />
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
