import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  FormField,
  Input,
  PageHeader,
  Select,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@forge/ui';
import { IconAdd } from '@forge/ui/icons';

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Business profile, team, billing, and integrations." />

      <div className="p-6">
        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Business profile</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="squad">Squad account</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Business profile</CardTitle>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField label="Business name">
                    <Input defaultValue="Apapa Trade Co." />
                  </FormField>
                  <FormField label="Business type">
                    <Select
                      options={[
                        { label: 'Wholesaler', value: 'wholesaler' },
                        { label: 'Factory', value: 'factory' },
                        { label: 'Retailer', value: 'retailer' },
                        { label: 'Logistics', value: 'logistics' },
                      ]}
                      defaultValue="wholesaler"
                    />
                  </FormField>
                  <FormField label="Primary contact email">
                    <Input type="email" defaultValue="ops@apapatrade.ng" />
                  </FormField>
                  <FormField label="Primary contact phone">
                    <Input defaultValue="+234 801 234 5678" />
                  </FormField>
                  <FormField label="Registered address" className="md:col-span-2">
                    <Input defaultValue="14 Wharf Road, Apapa, Lagos" />
                  </FormField>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary">Cancel</Button>
                  <Button>Save changes</Button>
                </div>
              </CardBody>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Team members</CardTitle>
                <Button leadingIcon={<IconAdd className="!h-4 !w-4" />} size="sm">
                  Invite
                </Button>
              </CardHeader>
              <CardBody>
                <ul className="divide-y divide-neutral-100">
                  {[
                    { name: 'Adeolu Adeyemi', email: 'adeolu@apapatrade.ng', role: 'Owner' },
                    { name: 'Chinwe Okafor', email: 'chinwe@apapatrade.ng', role: 'Admin' },
                    { name: 'Tunde Bello', email: 'tunde@apapatrade.ng', role: 'Hiring' },
                  ].map((m) => (
                    <li
                      key={m.email}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={m.name} />
                        <div>
                          <p className="text-sm font-medium text-neutral-900">{m.name}</p>
                          <p className="text-xs text-neutral-500">{m.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge>{m.role}</Badge>
                        <Button variant="ghost" size="sm">
                          Manage
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
              </CardHeader>
              <CardBody className="space-y-4">
                {[
                  {
                    label: 'Application received',
                    desc: 'Email me when a worker applies to a job.',
                    on: true,
                  },
                  {
                    label: 'Worker clocked in',
                    desc: 'Push notification on the mobile app.',
                    on: true,
                  },
                  {
                    label: 'Payment processed',
                    desc: 'Email a receipt for every Squad payout.',
                    on: false,
                  },
                  {
                    label: 'Weekly business summary',
                    desc: 'Sunday digest with KPIs and credit health.',
                    on: true,
                  },
                ].map((n) => (
                  <div
                    key={n.label}
                    className="flex items-center justify-between rounded-lg border border-outline p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{n.label}</p>
                      <p className="text-xs text-neutral-500">{n.desc}</p>
                    </div>
                    <Switch defaultChecked={n.on} />
                  </div>
                ))}
              </CardBody>
            </Card>
          </TabsContent>

          <TabsContent value="squad" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Squad settlement account</CardTitle>
                <Badge tone="success">Connected</Badge>
              </CardHeader>
              <CardBody className="space-y-4">
                <p className="text-sm text-neutral-600">
                  Funded payouts settle to this Squad wallet within minutes.
                </p>
                <div className="rounded-lg border border-outline bg-surface-container-high p-4">
                  <p className="text-xs text-neutral-500">Wallet ID</p>
                  <p className="font-mono text-sm text-neutral-900">SQW-3087-0142-9913</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary">Disconnect</Button>
                  <Button>Top up wallet</Button>
                </div>
              </CardBody>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Plan & invoicing</CardTitle>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-outline p-4">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">Growth plan</p>
                    <p className="text-xs text-neutral-500">
                      ₦15,000 / month · unlimited job posts
                    </p>
                  </div>
                  <Button variant="secondary">Change plan</Button>
                </div>
                <FormField label="Billing email">
                  <Input type="email" defaultValue="finance@apapatrade.ng" />
                </FormField>
              </CardBody>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
