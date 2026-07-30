export declare const SERVICE_DISPLAY_NAME = "Mirakurun";
export interface ServiceAccount {
    domain: string;
    account: string;
}
export interface ServiceEnvironmentEntry {
    name: string;
    value: string;
}
export interface ServiceEnvironmentInput {
    machinePath: string;
    extraDirectories: string[];
    serviceName: string;
    userProfile?: string;
    localAppData?: string;
}
export declare function toServiceId(displayName: string): string;
export declare function parseServiceAccount(input: string, computerName: string): ServiceAccount | null;
export declare function defaultServiceAccountName(env: NodeJS.ProcessEnv): string;
export declare function extractExecutablePath(command: string): string | null;
export declare function collectTunerDirectories(tunersYaml: string): string[];
export declare function buildServicePath(machinePath: string, extraDirectories: string[]): string;
export declare function buildServiceEnvironment(input: ServiceEnvironmentInput): ServiceEnvironmentEntry[];
export declare function getWindowsServiceName(env: NodeJS.ProcessEnv): string;
