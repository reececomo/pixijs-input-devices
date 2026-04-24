export interface DeviceMetadata
{
}

export type IDeviceMetadata = keyof DeviceMetadata extends never
    ? Record<string, any>
    : Partial<DeviceMetadata>;
