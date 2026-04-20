export declare class DeployController {
    deployToAws(payload: {
        accessKey: string;
        secretKey: string;
        modelHubId: string;
        instanceType: string;
    }): Promise<{
        status: string;
        instanceId: string | undefined;
        message: string;
        error?: undefined;
    } | {
        status: string;
        error: any;
        instanceId?: undefined;
        message?: undefined;
    }>;
}
