## API Report File for "@bentley/reality-data-client"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

import { AuthorizedClientRequestContext } from '@bentley/itwin-client';
import { ClientRequestContext } from '@bentley/bentleyjs-core';
import { RequestQueryOptions } from '@bentley/itwin-client';
import { URL } from 'url';
import { WsgClient } from '@bentley/itwin-client';
import { WsgInstance } from '@bentley/itwin-client';

// @internal
export class DataLocation extends WsgInstance {
    // (undocumented)
    id?: string;
    // (undocumented)
    location?: string;
    // (undocumented)
    provider?: string;
}

// @internal
export class FileAccessKey extends WsgInstance {
    // (undocumented)
    permissions?: string;
    // (undocumented)
    requiresConfirmation?: string;
    // (undocumented)
    type?: string;
    // (undocumented)
    url?: string;
}

// @internal
export class RealityData extends WsgInstance {
    // (undocumented)
    accuracyInMeters?: string;
    // (undocumented)
    approximateFootprint?: boolean;
    // (undocumented)
    classification?: string;
    // (undocumented)
    client: undefined | RealityDataClient;
    containerName?: string;
    // (undocumented)
    copyright?: string;
    // (undocumented)
    createdTimestamp?: string;
    // (undocumented)
    creatorId?: string;
    // (undocumented)
    dataAcquirer?: string;
    // (undocumented)
    dataAcquisitionDate?: string;
    // (undocumented)
    dataAcquisitionEndDate?: string;
    // (undocumented)
    dataAcquisitionStartDate?: string;
    // (undocumented)
    dataLocationGuid?: string;
    // (undocumented)
    dataSet?: string;
    // (undocumented)
    description?: string;
    // (undocumented)
    footprint?: string;
    getBlobStringUrl(requestContext: AuthorizedClientRequestContext, name: string, nameRelativeToRootDocumentPath?: boolean): Promise<string>;
    getBlobUrl(requestContext: AuthorizedClientRequestContext, writeAccess?: boolean): Promise<URL>;
    getModelData(requestContext: AuthorizedClientRequestContext, name: string, nameRelativeToRootDocumentPath?: boolean): Promise<any>;
    getRootDocumentJson(requestContext: AuthorizedClientRequestContext): Promise<any>;
    getTileContent(requestContext: AuthorizedClientRequestContext, name: string, nameRelativeToRootDocumentPath?: boolean): Promise<any>;
    getTileJson(requestContext: AuthorizedClientRequestContext, name: string, nameRelativeToRootDocumentPath?: boolean): Promise<any>;
    // (undocumented)
    group?: string;
    // (undocumented)
    hidden?: boolean;
    // (undocumented)
    id?: string;
    // (undocumented)
    lastAccessedTimestamp?: string;
    // (undocumented)
    listable?: boolean;
    // (undocumented)
    metadataUrl?: string;
    // (undocumented)
    modifiedTimestamp?: string;
    // (undocumented)
    name?: string;
    // (undocumented)
    organizationId?: string;
    // (undocumented)
    ownedBy?: string;
    // (undocumented)
    ownerId?: string;
    // (undocumented)
    projectId: undefined | string;
    // (undocumented)
    referenceElevation?: number;
    // (undocumented)
    resolutionInMeters?: string;
    // (undocumented)
    rootDocument?: string;
    // (undocumented)
    size?: string;
    // (undocumented)
    sizeUpToDate?: boolean;
    // (undocumented)
    streamed?: boolean;
    // (undocumented)
    termsOfUse?: string;
    // (undocumented)
    thumbnailDocument?: string;
    // (undocumented)
    type?: string;
    // (undocumented)
    ultimateId?: string;
    // (undocumented)
    ultimateSite?: string;
    // (undocumented)
    version?: string;
    // (undocumented)
    visibility?: string;
}

// @internal
export class RealityDataClient extends WsgClient {
    constructor();
    // (undocumented)
    static readonly configRelyingPartyUri = "imjs_reality_data_service_relying_party_uri";
    createRealityData(requestContext: AuthorizedClientRequestContext, projectId: string | undefined, realityData: RealityData): Promise<RealityData>;
    createRealityDataRelationship(requestContext: AuthorizedClientRequestContext, projectId: string, relationship: RealityDataRelationship): Promise<RealityDataRelationship>;
    deleteRealityData(requestContext: AuthorizedClientRequestContext, projectId: string | undefined, realityDataId: string): Promise<void>;
    deleteRealityDataRelationship(requestContext: AuthorizedClientRequestContext, projectId: string, relationshipId: string): Promise<void>;
    getDataLocation(requestContext: AuthorizedClientRequestContext): Promise<DataLocation[]>;
    getFileAccessKey(requestContext: AuthorizedClientRequestContext, projectId: string | undefined, tilesId: string, writeAccess?: boolean): Promise<FileAccessKey[]>;
    getRealityData(requestContext: AuthorizedClientRequestContext, projectId: string | undefined, tilesId: string): Promise<RealityData>;
    getRealityDataIdFromUrl(url: string): string | undefined;
    getRealityDataInProject(requestContext: AuthorizedClientRequestContext, projectId: string, type?: string): Promise<RealityData[]>;
    getRealityDataInProjectOverlapping(requestContext: AuthorizedClientRequestContext, projectId: string, minLongDeg: number, maxLongDeg: number, minLatDeg: number, maxLatDeg: number, type?: string): Promise<RealityData[]>;
    getRealityDataRelationships(requestContext: AuthorizedClientRequestContext, projectId: string, realityDataId: string): Promise<RealityDataRelationship[]>;
    getRealityDatas(requestContext: AuthorizedClientRequestContext, projectId: string | undefined, queryOptions: RealityDataRequestQueryOptions): Promise<RealityData[]>;
    getRealityDataUrl(requestContext: ClientRequestContext, projectId: string | undefined, tilesId: string): Promise<string>;
    protected getRelyingPartyUrl(): string;
    protected getUrlSearchKey(): string;
    // (undocumented)
    static readonly searchKey: string;
    updateRealityData(requestContext: AuthorizedClientRequestContext, projectId: string | undefined, realityData: RealityData): Promise<RealityData>;
}

// @internal
export class RealityDataRelationship extends WsgInstance {
    // (undocumented)
    createdTimestamp?: string;
    // (undocumented)
    modifiedTimestamp?: string;
    // (undocumented)
    realityDataId?: string;
    // (undocumented)
    relatedId?: string;
    // (undocumented)
    relationType?: string;
}

// @internal
export interface RealityDataRequestQueryOptions extends RequestQueryOptions {
    action?: string;
    polygon?: string;
    project?: string;
}


// (No @packageDocumentation comment for this package)

```
