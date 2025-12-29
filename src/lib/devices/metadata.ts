export interface Metadata
{
}

export type DeviceMetadata =
  | Record<string, any>
  | Partial<Metadata>;
