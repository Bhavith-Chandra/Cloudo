import { Metadata } from 'next'
import { ApiKeysTable } from '@/components/api-keys/ApiKeysTable'
import { WebhooksTable } from '@/components/api-keys/WebhooksTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export const metadata: Metadata = {
  title: 'API Keys & Webhooks | Cloudo',
  description: 'Manage API keys and webhooks for third-party integrations',
}

export default function ApiKeysPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">API Keys & Webhooks</h1>
          <p className="text-muted-foreground">
            Manage API keys and webhooks for third-party integrations
          </p>
        </div>
        <div className="flex gap-4">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New API Key
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Webhook
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>API Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <ApiKeysTable />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Webhooks</CardTitle>
          </CardHeader>
          <CardContent>
            <WebhooksTable />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 