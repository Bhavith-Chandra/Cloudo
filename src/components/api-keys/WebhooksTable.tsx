import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, Bell, BellOff } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  status: 'active' | 'inactive'
  lastTriggered: string | null
  secret: string
}

export function WebhooksTable() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchWebhooks()
  }, [])

  const fetchWebhooks = async () => {
    try {
      const response = await fetch('/api/webhooks')
      if (!response.ok) throw new Error('Failed to fetch webhooks')
      const data = await response.json()
      setWebhooks(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch webhooks',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteWebhook = async (id: string) => {
    try {
      const response = await fetch(`/api/webhooks/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete webhook')
      setWebhooks(webhooks.filter(webhook => webhook.id !== id))
      toast({
        title: 'Success',
        description: 'Webhook deleted successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete webhook',
        variant: 'destructive',
      })
    }
  }

  const handleToggleWebhook = async (id: string, currentStatus: 'active' | 'inactive') => {
    try {
      const response = await fetch(`/api/webhooks/${id}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: currentStatus === 'active' ? 'inactive' : 'active',
        }),
      })
      if (!response.ok) throw new Error('Failed to toggle webhook status')
      setWebhooks(webhooks.map(webhook => 
        webhook.id === id ? { ...webhook, status: currentStatus === 'active' ? 'inactive' : 'active' } : webhook
      ))
      toast({
        title: 'Success',
        description: `Webhook ${currentStatus === 'active' ? 'deactivated' : 'activated'} successfully`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to toggle webhook status',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-4">
      <Dialog>
        <DialogTrigger asChild>
          <Button>Create New Webhook</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Webhook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input placeholder="Enter webhook name" />
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input placeholder="Enter webhook URL" />
            </div>
            <div className="space-y-2">
              <Label>Events</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cost_spike">Cost Spike</SelectItem>
                  <SelectItem value="resource_created">Resource Created</SelectItem>
                  <SelectItem value="resource_deleted">Resource Deleted</SelectItem>
                  <SelectItem value="security_alert">Security Alert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full">Create Webhook</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Events</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Triggered</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {webhooks.map((webhook) => (
            <TableRow key={webhook.id}>
              <TableCell>{webhook.name}</TableCell>
              <TableCell>{webhook.url}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {webhook.events.map(event => (
                    <Badge key={event} variant="secondary">
                      {event}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={webhook.status === 'active' ? 'default' : 'destructive'}>
                  {webhook.status}
                </Badge>
              </TableCell>
              <TableCell>
                {webhook.lastTriggered ? new Date(webhook.lastTriggered).toLocaleString() : 'Never'}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleWebhook(webhook.id, webhook.status)}
                  >
                    {webhook.status === 'active' ? (
                      <BellOff className="h-4 w-4" />
                    ) : (
                      <Bell className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteWebhook(webhook.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 