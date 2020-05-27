## API Report File for "@bentley/imodel-bridge"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

import { AccessToken } from '@bentley/itwin-client';
import { AuthorizedClientRequestContext } from '@bentley/itwin-client';
import { BentleyStatus } from '@bentley/bentleyjs-core';
import { ChangesType } from '@bentley/imodelhub-client';
import { Id64String } from '@bentley/bentleyjs-core';
import { IModelDb } from '@bentley/imodeljs-backend';

// @alpha
export class BridgeJobDefArgs {
    allDocsProcessed: boolean;
    bridgeModule?: string;
    // (undocumented)
    documentGuid?: string;
    revisionComments?: string;
    sourcePath?: string;
    stagingdir?: string;
    updateDbProfile: boolean;
    updateDomainSchemas: boolean;
}

// @public
export enum BridgeLoggerCategory {
    Framework = "imodel-bridge.Framework"
}

// @alpha
export class BridgeRunner {
    constructor(_jobDefArgs: BridgeJobDefArgs, _serverArgs: ServerArgs);
    static fromArgs(args: string[]): BridgeRunner;
    // (undocumented)
    getCacheDirectory(): string | undefined;
    pushDataChanges(pushComments: string, type: ChangesType): Promise<void>;
    synchronize(): Promise<BentleyStatus>;
    }

// @alpha
export interface IModelBridge {
    // (undocumented)
    getApplicationId(): string;
    // (undocumented)
    getApplicationVersion(): string;
    // (undocumented)
    importDefinitions(): Promise<any>;
    // (undocumented)
    importDomainSchema(requestContext: AuthorizedClientRequestContext): Promise<any>;
    // (undocumented)
    importDynamicSchema(requestContext: AuthorizedClientRequestContext): Promise<any>;
    // (undocumented)
    initialize(params: any): any;
    // (undocumented)
    onOpenBim(sync: Synchronizer): Promise<BentleyStatus>;
    // (undocumented)
    openSource(sourcePath: string, dmsAccessToken: string | undefined, documentGuid: string | undefined): Promise<BentleyStatus>;
    // (undocumented)
    updateExistingData(sourcePath: string): Promise<any>;
}

// @alpha
export abstract class IModelBridgeBase implements IModelBridge {
    // (undocumented)
    abstract getApplicationId(): string;
    // (undocumented)
    abstract getApplicationVersion(): string;
    // (undocumented)
    abstract importDefinitions(): Promise<any>;
    // (undocumented)
    abstract importDomainSchema(requestContext: AuthorizedClientRequestContext): Promise<any>;
    // (undocumented)
    abstract importDynamicSchema(requestContext: AuthorizedClientRequestContext): Promise<any>;
    // (undocumented)
    abstract initialize(params: any): any;
    // (undocumented)
    onOpenBim(sync: Synchronizer): Promise<BentleyStatus>;
    // (undocumented)
    abstract openSource(sourcePath: string, dmsAccessToken: string | undefined, documentGuid: string | undefined): Promise<BentleyStatus>;
    // (undocumented)
    protected _synchronizer: Synchronizer | undefined;
    // (undocumented)
    abstract updateExistingData(sourcePath: string): Promise<any>;
}

// @alpha
export class ServerArgs {
    contextId?: string;
    contextName?: string;
    // @internal
    createiModel: boolean;
    dmsAccessToken?: string;
    dmsServerUrl?: string;
    environment?: string;
    // (undocumented)
    getToken?: () => Promise<AccessToken>;
    iModelId?: string;
    iModelName?: string;
}


// (No @packageDocumentation comment for this package)

```