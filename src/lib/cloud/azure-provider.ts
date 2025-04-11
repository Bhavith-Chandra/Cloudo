import { CloudProvider, CloudResource } from './types';
import { ComputeManagementClient } from '@azure/arm-compute';
import { StorageManagementClient } from '@azure/arm-storage';
import { SqlManagementClient } from '@azure/arm-sql';
import { DefaultAzureCredential } from '@azure/identity';

export class AzureProvider implements CloudProvider {
  private compute: ComputeManagementClient;
  private storage: StorageManagementClient;
  private sql: SqlManagementClient;

  constructor(credentials: any) {
    const credential = new DefaultAzureCredential();
    this.compute = new ComputeManagementClient(credential, credentials.subscriptionId);
    this.storage = new StorageManagementClient(credential, credentials.subscriptionId);
    this.sql = new SqlManagementClient(credential, credentials.subscriptionId);
  }

  async listResources(): Promise<CloudResource[]> {
    const resources: CloudResource[] = [];

    // List Virtual Machines
    const vms = await this.compute.virtualMachines.listAll();
    for await (const vm of vms) {
      if (vm.id && vm.name) {
        resources.push({
          id: vm.id,
          name: vm.name,
          type: 'Virtual Machine',
          provider: 'azure',
          tags: vm.tags || {},
          metadata: {
            size: vm.hardwareProfile?.vmSize,
            location: vm.location,
            status: vm.provisioningState,
          },
        });
      }
    }

    // List Storage Accounts
    const storageAccounts = await this.storage.storageAccounts.list();
    for await (const account of storageAccounts) {
      if (account.id && account.name) {
        resources.push({
          id: account.id,
          name: account.name,
          type: 'Storage Account',
          provider: 'azure',
          tags: account.tags || {},
          metadata: {
            location: account.location,
            sku: account.sku?.name,
            status: account.provisioningState,
          },
        });
      }
    }

    // List SQL Servers
    const sqlServers = await this.sql.servers.list();
    for await (const server of sqlServers) {
      if (server.id && server.name) {
        resources.push({
          id: server.id,
          name: server.name,
          type: 'SQL Server',
          provider: 'azure',
          tags: server.tags || {},
          metadata: {
            location: server.location,
            version: server.version,
            state: server.state,
          },
        });
      }
    }

    return resources;
  }

  async applyTags(resourceId: string, tags: Record<string, string>): Promise<void> {
    const resourceType = this.getResourceType(resourceId);
    
    switch (resourceType) {
      case 'Virtual Machine':
        await this.compute.virtualMachines.beginUpdateTags(
          this.getResourceGroup(resourceId),
          this.getResourceName(resourceId),
          { tags }
        );
        break;
      case 'Storage Account':
        await this.storage.storageAccounts.update(
          this.getResourceGroup(resourceId),
          this.getResourceName(resourceId),
          { tags }
        );
        break;
      case 'SQL Server':
        await this.sql.servers.update(
          this.getResourceGroup(resourceId),
          this.getResourceName(resourceId),
          { tags }
        );
        break;
      default:
        throw new Error(`Unsupported resource type: ${resourceType}`);
    }
  }

  private getResourceType(resourceId: string): string {
    if (resourceId.includes('/virtualMachines/')) return 'Virtual Machine';
    if (resourceId.includes('/storageAccounts/')) return 'Storage Account';
    if (resourceId.includes('/servers/')) return 'SQL Server';
    throw new Error(`Unknown resource type for ID: ${resourceId}`);
  }

  private getResourceGroup(resourceId: string): string {
    const match = resourceId.match(/\/resourceGroups\/([^\/]+)\//);
    if (!match) throw new Error(`Invalid resource ID format: ${resourceId}`);
    return match[1];
  }

  private getResourceName(resourceId: string): string {
    const parts = resourceId.split('/');
    return parts[parts.length - 1];
  }
} 