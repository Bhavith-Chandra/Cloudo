export interface CloudResource {
  id: string;
  type: string;
  name: string;
  tags?: Record<string, string>;
  [key: string]: any;
}

export interface CloudProvider {
  listResources(): Promise<CloudResource[]>;
  applyTags(resourceId: string, tags: Record<string, string>): Promise<void>;
} 