'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  FormField,
  Input,
  KeyValueList,
  MapPlaceholder,
  Select,
  Switch,
  Textarea,
} from '@forge/ui';
import { formatCurrency } from '@forge/ui/utils';
import { IconBriefcase, IconClock, IconLocation } from '@forge/ui/icons';

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

const schema = z.object({
  type: z.enum(['loader', 'driver', 'unloader', 'general']),
  title: z.string().min(8, 'A clear title helps the right workers find this').max(100),
  description: z
    .string()
    .min(20, 'Describe the work, the site, and any safety expectations')
    .max(800),
  payNaira: z.coerce
    .number()
    .int()
    .min(1500, 'Minimum job pay is ₦1,500')
    .max(200_000, 'For high-value contracts, contact your account manager'),
  durationHours: z.coerce
    .number()
    .min(0.5, 'Minimum half an hour')
    .max(12, 'Long shifts should be split across multiple jobs'),
  neighborhood: z.enum(NEIGHBORHOODS),
  startAt: z.string().min(1, 'Pick a start date and time'),
  audience: z.enum(['public', 'team_first']),
  postNow: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const JOB_TYPES: { value: FormValues['type']; label: string; hint: string }[] = [
  { value: 'loader', label: 'Loader', hint: 'Container & cargo loading' },
  { value: 'driver', label: 'Driver', hint: 'Local distribution, light truck' },
  { value: 'unloader', label: 'Unloader', hint: 'Discharge crews, intake' },
  { value: 'general', label: 'General', hint: 'Stocking, setup, teardown' },
];

export function PostJobForm() {
  const [submittedSummary, setSubmittedSummary] = useState<FormValues | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'loader',
      title: '',
      description: '',
      payNaira: 5000,
      durationHours: 4,
      neighborhood: 'Apapa',
      startAt: '',
      audience: 'public',
      postNow: true,
    },
  });

  const watchedType = watch('type');
  const watchedNeighborhood = watch('neighborhood');
  const watchedPay = watch('payNaira');

  const onSubmit = handleSubmit(async (values) => {
    // TODO: wire to typed API client. For now just simulate.
    await new Promise((r) => setTimeout(r, 600));
    setSubmittedSummary(values);
  });

  if (submittedSummary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Job posted</CardTitle>
          <Badge tone="success">Live</Badge>
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-sm text-neutral-600">
            Your job is now visible to eligible workers. We&apos;ll notify you as applications
            come in.
          </p>
          <KeyValueList
            layout="grid"
            items={[
              { label: 'Title', value: submittedSummary.title },
              { label: 'Type', value: submittedSummary.type },
              { label: 'Pay', value: formatCurrency(submittedSummary.payNaira) },
              { label: 'Duration', value: `${submittedSummary.durationHours}h` },
              { label: 'Location', value: submittedSummary.neighborhood },
              { label: 'Audience', value: submittedSummary.audience },
            ]}
          />
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setSubmittedSummary(null);
                reset();
              }}
            >
              Post another
            </Button>
            <Button>View job</Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 pb-24">
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
            error={errors.title?.message}
            hint="Make it specific. e.g., 'Truck loaders for early shipment, Apapa terminal'"
          >
            <Input placeholder="Container loaders needed at warehouse" {...register('title')} />
          </FormField>

          <FormField label="Description" required error={errors.description?.message}>
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
            error={errors.payNaira?.message}
            hint={`That's ${formatCurrency(watchedPay || 0)} flat.`}
          >
            <Input type="number" min={1500} step={500} {...register('payNaira')} />
          </FormField>
          <FormField
            label="Duration (hours)"
            required
            error={errors.durationHours?.message}
          >
            <Input type="number" min={0.5} max={12} step={0.5} {...register('durationHours')} />
          </FormField>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Location & schedule</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Neighborhood" required error={errors.neighborhood?.message}>
              <Select
                options={NEIGHBORHOODS.map((n) => ({ label: n, value: n }))}
                {...register('neighborhood')}
              />
            </FormField>
            <FormField label="Start at" required error={errors.startAt?.message}>
              <Input type="datetime-local" {...register('startAt')} />
            </FormField>
          </div>

          <MapPlaceholder
            pins={[
              {
                id: 'preview',
                lat: 6.45,
                lng: 3.4,
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
              <p className="text-sm font-medium text-neutral-900">Open to all eligible workers</p>
              <p className="text-xs text-neutral-500">
                23 workers within 5km right now match this job profile.
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
                Your saved workers see this job 30 minutes before public posting.
              </p>
            </div>
          </label>

          <div className="flex items-center justify-between rounded-lg border border-outline p-3">
            <div>
              <p className="text-sm font-medium text-neutral-900">Post immediately</p>
              <p className="text-xs text-neutral-500">
                Off to schedule for later.
              </p>
            </div>
            <Switch
              checked={watch('postNow')}
              onCheckedChange={(v) => setValue('postNow', v)}
            />
          </div>
        </CardBody>
      </Card>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 -mx-6 border-t border-outline bg-surface/95 px-6 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-neutral-500">
            <IconClock className="!h-3.5 !w-3.5 -mt-0.5 mr-0.5 inline-block" />
            Average time-to-fill in {watchedNeighborhood} is 8 minutes.
          </p>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary">
              Save as draft
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Post job
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
