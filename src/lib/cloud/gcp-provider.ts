import { CloudProvider, CloudResource } from './cloud-provider';
import { Compute, Storage, CloudSQL } from '@google-cloud/compute';
import { Storage as CloudStorage } from '@google-cloud/storage';
import { CloudSQL as CloudSQLClient } from '@google-cloud/sql';

export class GCPProvider implements CloudProvider {
  private compute: Compute;
  private storage: CloudStorage;
  private sql: CloudSQLClient;

  constructor(credentials: {
    projectId: string;
    clientEmail: string;
    privateKey: string;
  }) {
    this.compute = new Compute({
      projectId: credentials.projectId,
      credentials: {
        client_email: credentials.clientEmail,
        private_key: credentials.privateKey,
      },
    });

    this.storage = new CloudStorage({
      projectId: credentials.projectId,
      credentials: {
        client_email: credentials.clientEmail,
        private_key: credentials.privateKey,
      },
    });

    this.sql = new CloudSQLClient({
      projectId: credentials.projectId,
      credentials: {
        client_email: credentials.clientEmail,
        private_key: credentials.privateKey,
      },
    });
  }

  async listResources(): Promise<CloudResource[]> {
    const resources: CloudResource[] = [];

    // List Compute Engine instances
    const [vms] = await this.compute.getVMs();
    for (const vm of vms) {
      resources.push({
        id: vm.id?.toString() || '',
        type: 'vm',
        name: vm.name || '',
        tags: vm.labels || {},
        zone: vm.zone?.split('/').pop(),
        machineType: vm.machineType?.split('/').pop(),
        status: vm.status,
      });
    }

    // List Cloud Storage buckets
    const [buckets] = await this.storage.getBuckets();
    for (const bucket of buckets) {
      resources.push({
        id: bucket.id || '',
        type: 'storage',
        name: bucket.name || '',
        tags: bucket.metadata || {},
        location: bucket.location,
        storageClass: bucket.storageClass,
      });
    }

    // List Cloud SQL instances
    const [instances] = await this.sql.instances.list();
    for (const instance of instances) {
      resources.push({
        id: instance.name || '',
        type: 'sql',
        name: instance.name || '',
        tags: instance.labels || {},
        region: instance.region,
        databaseVersion: instance.databaseVersion,
        state: instance.state,
      });
    }

    return resources;
  }

  async applyTags(resourceId: string, tags: Record<string, string>): Promise<void> {
    const resourceType = this.getResourceType(resourceId);
    
    switch (resourceType) {
      case 'vm':
        const [vm] = await this.compute.getVMs({ filter: `id=${resourceId}` });
        if (vm) {
          await vm.setLabels(tags);
        }
        break;
      case 'storage':
        const bucket = this.storage.bucket(resourceId);
        await bucket.setMetadata({ labels: tags });
        break;
      case 'sql':
        const [instance] = await this.sql.instances.list({ filter: `name=${resourceId}` });
        if (instance) {
          await instance.setLabels(tags);
        }
        break;
      default:
        throw new Error(`Unsupported resource type: ${resourceType}`);
    }
  }

  private getResourceType(resourceId: string): string {
    if (resourceId.includes('/instances/')) return 'vm';
    if (resourceId.includes('/buckets/')) return 'storage';
    if (resourceId.includes('/instances/')) return 'sql';
    throw new Error(`Unknown resource type for ID: ${resourceId}`);
  }
} 