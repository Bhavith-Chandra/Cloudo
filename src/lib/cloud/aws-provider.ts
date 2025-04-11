import { CloudProvider, CloudResource } from './cloud-provider';
import { AWS } from 'aws-sdk';

export class AWSProvider implements CloudProvider {
  private ec2: AWS.EC2;
  private s3: AWS.S3;
  private rds: AWS.RDS;

  constructor(credentials: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
  }) {
    AWS.config.update(credentials);
    this.ec2 = new AWS.EC2();
    this.s3 = new AWS.S3();
    this.rds = new AWS.RDS();
  }

  async listResources(): Promise<CloudResource[]> {
    const resources: CloudResource[] = [];

    // List EC2 instances
    const ec2Instances = await this.ec2.describeInstances().promise();
    for (const reservation of ec2Instances.Reservations || []) {
      for (const instance of reservation.Instances || []) {
        resources.push({
          id: instance.InstanceId || '',
          type: 'ec2',
          name: instance.Tags?.find(tag => tag.Key === 'Name')?.Value || instance.InstanceId || '',
          tags: this.convertTagsToRecord(instance.Tags),
          state: instance.State?.Name,
          instanceType: instance.InstanceType,
        });
      }
    }

    // List S3 buckets
    const buckets = await this.s3.listBuckets().promise();
    for (const bucket of buckets.Buckets || []) {
      const tags = await this.s3.getBucketTagging({ Bucket: bucket.Name || '' }).promise()
        .catch(() => ({ TagSet: [] }));
      resources.push({
        id: bucket.Name || '',
        type: 's3',
        name: bucket.Name || '',
        tags: this.convertTagsToRecord(tags.TagSet),
        creationDate: bucket.CreationDate,
      });
    }

    // List RDS instances
    const dbInstances = await this.rds.describeDBInstances().promise();
    for (const instance of dbInstances.DBInstances || []) {
      resources.push({
        id: instance.DBInstanceIdentifier || '',
        type: 'rds',
        name: instance.DBInstanceIdentifier || '',
        tags: this.convertTagsToRecord(instance.TagList),
        engine: instance.Engine,
        status: instance.DBInstanceStatus,
      });
    }

    return resources;
  }

  async applyTags(resourceId: string, tags: Record<string, string>): Promise<void> {
    const resourceType = this.getResourceType(resourceId);
    
    switch (resourceType) {
      case 'ec2':
        await this.ec2.createTags({
          Resources: [resourceId],
          Tags: this.convertRecordToTags(tags),
        }).promise();
        break;
      case 's3':
        await this.s3.putBucketTagging({
          Bucket: resourceId,
          Tagging: {
            TagSet: this.convertRecordToTags(tags),
          },
        }).promise();
        break;
      case 'rds':
        await this.rds.addTagsToResource({
          ResourceName: `arn:aws:rds:${AWS.config.region}:${AWS.config.credentials?.accessKeyId}:db:${resourceId}`,
          Tags: this.convertRecordToTags(tags),
        }).promise();
        break;
      default:
        throw new Error(`Unsupported resource type: ${resourceType}`);
    }
  }

  private getResourceType(resourceId: string): string {
    if (resourceId.startsWith('i-')) return 'ec2';
    if (resourceId.includes('.')) return 's3';
    return 'rds';
  }

  private convertTagsToRecord(tags?: AWS.EC2.Tag[] | AWS.S3.Tag[] | AWS.RDS.Tag[]): Record<string, string> {
    if (!tags) return {};
    return tags.reduce((acc, tag) => {
      if (tag.Key && tag.Value) {
        acc[tag.Key] = tag.Value;
      }
      return acc;
    }, {} as Record<string, string>);
  }

  private convertRecordToTags(tags: Record<string, string>): AWS.EC2.Tag[] {
    return Object.entries(tags).map(([Key, Value]) => ({ Key, Value }));
  }
} 