/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import { DbResult, GuidString, Id64String, IModelStatus, Logger } from "@bentley/bentleyjs-core";
import { ChangeSet } from "@bentley/imodeljs-clients";
import { CodeSpec, FontProps, IModel, IModelError } from "@bentley/imodeljs-common";
import { IModelJsNative } from "@bentley/imodeljs-native";
import * as path from "path";
import { BackendLoggerCategory } from "./BackendLoggerCategory";
import { AuthorizedBackendRequestContext } from "./BackendRequestContext";
import { BriefcaseManager } from "./BriefcaseManager";
import { ChangeSummaryExtractContext, ChangeSummaryManager } from "./ChangeSummaryManager";
import { ECSqlStatement } from "./ECSqlStatement";
import { Element, GeometricElement } from "./Element";
import { ElementAspect, ElementMultiAspect, ElementUniqueAspect } from "./ElementAspect";
import { IModelDb } from "./IModelDb";
import { DefinitionModel, Model } from "./Model";
import { ElementRefersToElements, Relationship, RelationshipProps } from "./Relationship";

const loggerCategory: string = BackendLoggerCategory.IModelExporter;

/** Options provided to the [[IModelExporter]] constructor.
 * @alpha
 */
export interface IModelExportOptions { // tslint:disable-line:no-empty-interface
  // WIP: expect export options in the future
}

/** Handles the events generated by IModelExporter.
 * @alpha
 */
export abstract class IModelExportHandler {
  /** If `true` is returned, then the CodeSpec will be exported. */
  protected shouldExportCodeSpec(_codeSpec: CodeSpec): boolean { return true; }

  /** Called when a CodeSpec should be exported.
   * @param codeSpec The CodeSpec to export
   * @param isUpdate If defined, then `true` indicates an UPDATE operation while `false` indicates an INSERT operation. If not defined, then INSERT vs. UPDATE is not known.
   * @note This should be overridden to actually do the export.
   */
  protected onExportCodeSpec(_codeSpec: CodeSpec, _isUpdate: boolean | undefined): void { }

  /** Called when a font should be exported.
   * @param font The font to export
   * @note This should be overridden to actually do the export.
   */
  protected onExportFont(_font: FontProps): void { }

  /** Called when a model should be exported.
   * @param model The model to export
   * @param isUpdate If defined, then `true` indicates an UPDATE operation while `false` indicates an INSERT operation. If not defined, then INSERT vs. UPDATE is not known.
   * @note This should be overridden to actually do the export.
   */
  protected onExportModel(_model: Model, _isUpdate: boolean | undefined): void { }

  /** Called when a model should be deleted. */
  protected onDeleteModel(_modelId: Id64String): void { }

  /** If `true` is returned, then the element will be exported. */
  protected shouldExportElement(_element: Element): boolean { return true; }

  /** Called when an element should be exported.
   * @param element The element to export
   * @param isUpdate If defined, then `true` indicates an UPDATE operation while `false` indicates an INSERT operation. If not defined, then INSERT vs. UPDATE is not known.
   * @note This should be overridden to actually do the export.
   */
  protected onExportElement(_element: Element, _isUpdate: boolean | undefined): void { }

  /** Called when an element should be deleted. */
  protected onDeleteElement(_elementId: Id64String): void { }

  /** If `true` is returned, then the ElementAspect will be exported. */
  protected shouldExportElementAspect(_aspect: ElementAspect): boolean { return true; }

  /** Called when an ElementUniqueAspect should be exported.
   * @param aspect The ElementUniqueAspect to export
   * @param isUpdate If defined, then `true` indicates an UPDATE operation while `false` indicates an INSERT operation. If not defined, then INSERT vs. UPDATE is not known.
   * @note This should be overridden to actually do the export.
   */
  protected onExportElementUniqueAspect(_aspect: ElementUniqueAspect, _isUpdate: boolean | undefined): void { }

  /** Called when ElementMultiAspects should be exported.
   * @note This should be overridden to actually do the export.
   */
  protected onExportElementMultiAspects(_aspects: ElementMultiAspect[]): void { }

  /** If `true` is returned, then the relationship will be exported. */
  protected shouldExportRelationship(_relationship: Relationship): boolean { return true; }

  /** Called when a Relationship should be exported.
   * @param relationship The Relationship to export
   * @param isUpdate If defined, then `true` indicates an UPDATE operation while `false` indicates an INSERT operation. If not defined, then INSERT vs. UPDATE is not known.
   * @note This should be overridden to actually do the export.
   */
  protected onExportRelationship(_relationship: Relationship, _isUpdate: boolean | undefined): void { }

  /** Called when a relationship should be deleted. */
  protected onDeleteRelationship(_relInstanceId: Id64String): void { }

  /** Helper method that allows IModelExporter to call protected methods in IModelExportHandler.
   * @internal
   */
  public get callProtected(): any { return this; }
}

/** Base class for exporting data from an iModel.
 * @alpha
 */
export class IModelExporter {
  /** The read-only source iModel. */
  public readonly sourceDb: IModelDb;
  /** Optionally cached entity change information */
  private _sourceDbChanges?: ChangedInstanceIds;
  /** The handler called by this IModelExporter. */
  private _handler: IModelExportHandler | undefined;
  /** The handler called by this IModelExporter. */
  protected get handler(): IModelExportHandler {
    if (undefined === this._handler) { throw new Error("IModelExportHandler not registered"); }
    return this._handler;
  }

  /** The set of CodeSpecs to exclude from the export. */
  private _excludedCodeSpecNames = new Set<string>();
  /** The set of specific Elements to exclude from the export. */
  private _excludedElementIds = new Set<Id64String>();
  /** The set of Categories where Elements in that Category will be excluded from transformation to the target iModel. */
  private _excludedElementCategoryIds = new Set<Id64String>();
  /** The set of classes of Elements that will be excluded (polymorphically) from transformation to the target iModel. */
  private _excludedElementClasses = new Set<typeof Element>();
  /** The set of classes of ElementAspects that will be excluded (polymorphically) from transformation to the target iModel. */
  private _excludedElementAspectClasses = new Set<typeof ElementAspect>();
  /** The set of classes of Relationships that will be excluded (polymorphically) from transformation to the target iModel. */
  private _excludedRelationshipClasses = new Set<typeof Relationship>();

  /** Construct a new IModelExporter
   * @param sourceDb The source IModelDb
   * @param options The options that specify how the export should be done.
   * @see registerHandler
   */
  public constructor(sourceDb: IModelDb, options?: IModelExportOptions) {
    this.sourceDb = sourceDb;
    if (undefined !== options) { } // WIP
  }

  /** Register the handler that will be called by IModelExporter. */
  public registerHandler(handler: IModelExportHandler): void {
    this._handler = handler;
  }

  /** Add a rule to exclude a CodeSpec */
  public excludeCodeSpec(codeSpecName: string): void {
    this._excludedCodeSpecNames.add(codeSpecName);
  }

  /** Add a rule to exclude a specific Element. */
  public excludeElement(elementId: Id64String): void {
    this._excludedElementIds.add(elementId);
  }

  /** Add a rule to exclude all Elements of a specified Category. */
  public excludeElementCategory(categoryId: Id64String): void {
    this._excludedElementCategoryIds.add(categoryId);
  }

  /** Add a rule to exclude all Elements of a specified class. */
  public excludeElementClass(classFullName: string): void {
    this._excludedElementClasses.add(this.sourceDb.getJsClass<typeof Element>(classFullName));
  }

  /** Add a rule to exclude all ElementAspects of a specified class. */
  public excludeElementAspectClass(classFullName: string): void {
    this._excludedElementAspectClasses.add(this.sourceDb.getJsClass<typeof ElementAspect>(classFullName));
  }

  /** Add a rule to exclude all Relationships of a specified class. */
  public excludeRelationshipClass(classFullName: string): void {
    this._excludedRelationshipClasses.add(this.sourceDb.getJsClass<typeof Relationship>(classFullName));
  }

  /** Export everything from the source iModel. */
  public exportAll(): void {
    this.exportCodeSpecs();
    this.exportFonts();
    this.exportModelContainer(IModel.repositoryModelId);
    this.exportElement(IModel.rootSubjectId);
    this.exportSubModels(IModel.repositoryModelId);
    this.exportRelationships(ElementRefersToElements.classFullName);
  }

  /** Export changes from the source iModel.
   * @param requestContext The request context
   * @param startChangeSetId Include changes from this changeset up through and including the current changeset.
   * If this parameter is not provided, then just the current changeset will be exported.
   */
  public async exportChanges(requestContext: AuthorizedBackendRequestContext, startChangeSetId?: GuidString): Promise<void> {
    requestContext.enter();
    if ((undefined === this.sourceDb.briefcase.parentChangeSetId) || ("" === this.sourceDb.briefcase.parentChangeSetId)) {
      this.exportAll(); // no changesets, so revert to exportAll
      return Promise.resolve();
    }
    if (undefined === startChangeSetId) {
      startChangeSetId = this.sourceDb.briefcase.currentChangeSetId;
    }
    this._sourceDbChanges = await ChangedInstanceIds.initialize(requestContext, this.sourceDb, startChangeSetId);
    requestContext.enter();
    this.exportCodeSpecs();
    // WIP: handle font changes???
    this.exportElement(IModel.rootSubjectId);
    this.exportSubModels(IModel.repositoryModelId);
    this.exportRelationships(ElementRefersToElements.classFullName);
    // handle deletes
    for (const elementId of this._sourceDbChanges.element.deleteIds) {
      this.handler.callProtected.onDeleteElement(elementId);
    }
    // WIP: handle ElementAspects?
    for (const modelId of this._sourceDbChanges.model.deleteIds) {
      this.handler.callProtected.onDeleteModel(modelId);
    }
    for (const relInstanceId of this._sourceDbChanges.relationship.deleteIds) {
      this.handler.callProtected.onDeleteRelationship(relInstanceId);
    }
  }

  /** Export all CodeSpecs from the source iModel. */
  public exportCodeSpecs(): void {
    Logger.logTrace(loggerCategory, `exportCodeSpecs()`);
    const sql = `SELECT Name FROM BisCore:CodeSpec ORDER BY ECInstanceId`;
    this.sourceDb.withPreparedStatement(sql, (statement: ECSqlStatement) => {
      while (DbResult.BE_SQLITE_ROW === statement.step()) {
        const codeSpecName: string = statement.getValue(0).getString();
        this.exportCodeSpecByName(codeSpecName);
      }
    });
  }

  /** Export a single CodeSpec from the source iModel. */
  public exportCodeSpecByName(codeSpecName: string): void {
    const codeSpec: CodeSpec = this.sourceDb.codeSpecs.getByName(codeSpecName);
    let isUpdate: boolean | undefined;
    if (undefined !== this._sourceDbChanges) { // is changeSet information available?
      if (this._sourceDbChanges.codeSpec.insertIds.has(codeSpec.id)) {
        isUpdate = false;
      } else if (this._sourceDbChanges.codeSpec.updateIds.has(codeSpec.id)) {
        isUpdate = true;
      } else {
        return; // not in changeSet, don't export
      }
    }
    // passed changeSet test, now apply standard exclusion rules
    if (this._excludedCodeSpecNames.has(codeSpec.name)) {
      Logger.logInfo(loggerCategory, `Excluding CodeSpec: ${codeSpec.name}`);
      return;
    }
    // CodeSpec has passed standard exclusion rules, now give handler a chance to accept/reject export
    if (this.handler.callProtected.shouldExportCodeSpec(codeSpec)) {
      Logger.logTrace(loggerCategory, `exportCodeSpec(${codeSpecName})` + isUpdate ? " UPDATE" : "");
      this.handler.callProtected.onExportCodeSpec(codeSpec, isUpdate);
    }
  }

  /** Export a single CodeSpec from the source iModel. */
  public exportCodeSpecById(codeSpecId: Id64String): void {
    const codeSpec: CodeSpec = this.sourceDb.codeSpecs.getById(codeSpecId);
    this.exportCodeSpecByName(codeSpec.name);
  }

  /** Export all fonts from the source iModel. */
  public exportFonts(): void {
    Logger.logTrace(loggerCategory, `exportFonts()`);
    for (const font of this.sourceDb.fontMap.fonts.values()) {
      this.handler.callProtected.onExportFont(font);
    }
  }

  /** Export a single font from the source iModel. */
  public exportFontByName(fontName: string): void {
    Logger.logTrace(loggerCategory, `exportFontByName(${fontName})`);
    const font: FontProps | undefined = this.sourceDb.fontMap.getFont(fontName);
    if (undefined !== font) {
      this.handler.callProtected.onExportFont(font);
    }
  }

  /** Export a single font from the source iModel. */
  public exportFontByNumber(fontNumber: number): void {
    Logger.logTrace(loggerCategory, `exportFontById(${fontNumber})`);
    const font: FontProps | undefined = this.sourceDb.fontMap.getFont(fontNumber);
    if (undefined !== font) {
      this.handler.callProtected.onExportFont(font);
    }
  }

  /** Export the model container, contents, and sub-models from the source iModel. */
  public exportModel(modeledElementId: Id64String): void {
    const modeledElement: Element = this.sourceDb.elements.getElement({ id: modeledElementId, wantGeometry: true });
    Logger.logTrace(loggerCategory, `exportModel()`);
    if (this.shouldExportElement(modeledElement)) {
      this.exportModelContainer(modeledElementId);
      this.exportModelContents(modeledElementId);
      this.exportSubModels(modeledElementId);
    }
  }

  /** Export the model (the container only) from the source iModel. */
  private exportModelContainer(modeledElementId: Id64String): void {
    let isUpdate: boolean | undefined;
    if (undefined !== this._sourceDbChanges) { // is changeSet information available?
      if (this._sourceDbChanges.model.insertIds.has(modeledElementId)) {
        isUpdate = false;
      } else if (this._sourceDbChanges.model.updateIds.has(modeledElementId)) {
        isUpdate = true;
      } else {
        return; // not in changeSet, don't export
      }
    }
    const model: Model = this.sourceDb.models.getModel(modeledElementId);
    this.handler.callProtected.onExportModel(model, isUpdate);
  }

  /** Export the model contents. */
  public exportModelContents(modelId: Id64String, elementClassFullName: string = Element.classFullName): void {
    if (undefined !== this._sourceDbChanges) { // is changeSet information available?
      if (!this._sourceDbChanges.model.insertIds.has(modelId) && !this._sourceDbChanges.model.updateIds.has(modelId)) {
        return; // this optimization assumes that the Model changes (LastMod) any time an Element in the Model changes
      }
    }
    Logger.logTrace(loggerCategory, `exportModelContents()`);
    const sql = `SELECT ECInstanceId FROM ${elementClassFullName} WHERE Parent.Id IS NULL AND Model.Id=:modelId ORDER BY ECInstanceId`;
    this.sourceDb.withPreparedStatement(sql, (statement: ECSqlStatement): void => {
      statement.bindId("modelId", modelId);
      while (DbResult.BE_SQLITE_ROW === statement.step()) {
        this.exportElement(statement.getValue(0).getId());
      }
    });
  }

  /** Export the sub-models directly below the specified model. */
  public exportSubModels(parentModelId: Id64String): void {
    const definitionModelIds: Id64String[] = [];
    const otherModelIds: Id64String[] = [];
    const sql = `SELECT ECInstanceId FROM ${Model.classFullName} WHERE ParentModel.Id=:parentModelId ORDER BY ECInstanceId`;
    this.sourceDb.withPreparedStatement(sql, (statement: ECSqlStatement): void => {
      statement.bindId("parentModelId", parentModelId);
      while (DbResult.BE_SQLITE_ROW === statement.step()) {
        const modelId: Id64String = statement.getValue(0).getId();
        const model: Model = this.sourceDb.models.getModel(modelId);
        if (model instanceof DefinitionModel) {
          definitionModelIds.push(modelId);
        } else {
          otherModelIds.push(modelId);
        }
      }
    });
    // export DefinitionModels before other types of Models
    definitionModelIds.forEach((modelId: Id64String) => this.exportModel(modelId));
    otherModelIds.forEach((modelId: Id64String) => this.exportModel(modelId));
  }

  /** Returns true if the specified element should be exported. */
  private shouldExportElement(element: Element): boolean {
    if (this._excludedElementIds.has(element.id)) {
      Logger.logInfo(loggerCategory, `Excluded element by Id`);
      return false;
    }
    if (element instanceof GeometricElement) {
      if (this._excludedElementCategoryIds.has(element.category)) {
        Logger.logInfo(loggerCategory, `Excluded element by Category`);
        return false;
      }
    }
    for (const excludedElementClass of this._excludedElementClasses) {
      if (element instanceof excludedElementClass) {
        Logger.logInfo(loggerCategory, `Excluded element by class: ${excludedElementClass.classFullName}`);
        return false;
      }
    }
    // element has passed standard exclusion rules, now give handler a chance to accept/reject
    return this.handler.callProtected.shouldExportElement(element);
  }

  /** Export the specified element and its child elements (if applicable). */
  public exportElement(elementId: Id64String): void {
    let isUpdate: boolean | undefined;
    if (undefined !== this._sourceDbChanges) { // is changeSet information available?
      if (this._sourceDbChanges.element.insertIds.has(elementId)) {
        isUpdate = false;
      } else if (this._sourceDbChanges.element.updateIds.has(elementId)) {
        isUpdate = true;
      } else {
        // NOTE: This optimization assumes that the Element will change (LastMod) if an owned ElementAspect changes
        // NOTE: However, child elements may have changed without the parent changing
        this.exportChildElements(elementId);
        return;
      }
    }
    const element: Element = this.sourceDb.elements.getElement({ id: elementId, wantGeometry: true });
    Logger.logTrace(loggerCategory, `exportElement()`);
    if (this.shouldExportElement(element)) {
      this.handler.callProtected.onExportElement(element, isUpdate);
      this.exportElementAspects(elementId);
      this.exportChildElements(elementId);
    }
  }

  /** Export the child elements of the specified element from the source iModel. */
  public exportChildElements(elementId: Id64String): void {
    const childElementIds: Id64String[] = this.sourceDb.elements.queryChildren(elementId);
    if (childElementIds.length > 0) {
      Logger.logTrace(loggerCategory, `exportChildElements(${elementId})`);
      for (const childElementId of childElementIds) {
        this.exportElement(childElementId);
      }
    }
  }

  /** Returns true if the specified ElementAspect should be excluded from the export. */
  private shouldExportElementAspect(aspect: ElementAspect): boolean {
    for (const excludedElementAspectClass of this._excludedElementAspectClasses) {
      if (aspect instanceof excludedElementAspectClass) {
        Logger.logInfo(loggerCategory, `Excluded ElementAspect by class`);
        return false;
      }
    }
    // ElementAspect has passed standard exclusion rules, now give handler a chance to accept/reject
    return this.handler.callProtected.shouldExportElementAspect(aspect);
  }

  /** Export ElementAspects from the specified element from the source iModel. */
  private exportElementAspects(elementId: Id64String): void {
    const aspects: ElementUniqueAspect[] = this.sourceDb.elements.getAspects(elementId);
    if (aspects.length > 0) {
      // ElementUniqueAspects
      const uniqueAspects: ElementUniqueAspect[] = aspects.filter((aspect) => {
        return aspect instanceof ElementUniqueAspect && this.shouldExportElementAspect(aspect);
      });
      if (uniqueAspects.length > 0) {
        uniqueAspects.forEach((uniqueAspect: ElementUniqueAspect) => {
          if (undefined !== this._sourceDbChanges) { // is changeSet information available?
            if (this._sourceDbChanges.aspect.insertIds.has(uniqueAspect.id)) {
              this.handler.callProtected.onExportElementUniqueAspect(uniqueAspect, false);
            } else if (this._sourceDbChanges.aspect.updateIds.has(uniqueAspect.id)) {
              this.handler.callProtected.onExportElementUniqueAspect(uniqueAspect, true);
            } else {
              // not in changeSet, don't export
            }
          } else {
            this.handler.callProtected.onExportElementUniqueAspect(uniqueAspect, undefined);
          }
        });
      }
      // ElementMultiAspects
      const multiAspects: ElementMultiAspect[] = aspects.filter((aspect) => {
        return aspect instanceof ElementMultiAspect && this.shouldExportElementAspect(aspect);
      });
      if (multiAspects.length > 0) {
        this.handler.callProtected.onExportElementMultiAspects(multiAspects);
      }
    }
  }

  /** Exports all relationships that subclass from the specified base class. */
  public exportRelationships(baseRelClassFullName: string): void {
    Logger.logTrace(loggerCategory, `exportRelationships(${baseRelClassFullName})`);
    const sql = `SELECT ECInstanceId FROM ${baseRelClassFullName}`;
    this.sourceDb.withPreparedStatement(sql, (statement: ECSqlStatement) => {
      while (DbResult.BE_SQLITE_ROW === statement.step()) {
        const relInstanceId: Id64String = statement.getValue(0).getId();
        const relProps: RelationshipProps = this.sourceDb.relationships.getInstanceProps(baseRelClassFullName, relInstanceId);
        this.exportRelationship(relProps.classFullName, relInstanceId); // must call exportRelationship using the actual classFullName, not baseRelClassFullName
      }
    });
  }

  /** Export a relationship from the source iModel. */
  private exportRelationship(relClassFullName: string, relInstanceId: Id64String): void {
    let isUpdate: boolean | undefined;
    if (undefined !== this._sourceDbChanges) { // is changeSet information available?
      if (this._sourceDbChanges.relationship.insertIds.has(relInstanceId)) {
        isUpdate = false;
      } else if (this._sourceDbChanges.relationship.updateIds.has(relInstanceId)) {
        isUpdate = true;
      } else {
        return; // not in changeSet, don't export
      }
    }
    // passed changeSet test, now apply standard exclusion rules
    Logger.logTrace(loggerCategory, `exportRelationship(${relClassFullName}, ${relInstanceId})`);
    const relationship: Relationship = this.sourceDb.relationships.getInstance(relClassFullName, relInstanceId);
    for (const excludedRelationshipClass of this._excludedRelationshipClasses) {
      if (relationship instanceof excludedRelationshipClass) {
        Logger.logInfo(loggerCategory, `Excluded relationship by class: ${excludedRelationshipClass.classFullName}`);
        return;
      }
    }
    // relationship has passed standard exclusion rules, now give handler a chance to accept/reject export
    if (this.handler.callProtected.shouldExportRelationship(relationship)) {
      this.handler.callProtected.onExportRelationship(relationship, isUpdate);
    }
  }
}

class ChangedInstanceOps {
  public insertIds = new Set<Id64String>();
  public updateIds = new Set<Id64String>();
  public deleteIds = new Set<Id64String>();
  public addFromJson(val: IModelJsNative.ChangedInstanceOpsProps | undefined): void {
    if (undefined !== val) {
      if ((undefined !== val.insert) && (Array.isArray(val.insert))) { val.insert.forEach((id: Id64String) => this.insertIds.add(id)); }
      if ((undefined !== val.update) && (Array.isArray(val.update))) { val.update.forEach((id: Id64String) => this.updateIds.add(id)); }
      if ((undefined !== val.delete) && (Array.isArray(val.delete))) { val.delete.forEach((id: Id64String) => this.deleteIds.add(id)); }
    }
  }
}

class ChangedInstanceIds {
  public codeSpec = new ChangedInstanceOps();
  public model = new ChangedInstanceOps();
  public element = new ChangedInstanceOps();
  public aspect = new ChangedInstanceOps();
  public relationship = new ChangedInstanceOps();
  public font = new ChangedInstanceOps();
  private constructor() { }
  public static async initialize(requestContext: AuthorizedBackendRequestContext, iModelDb: IModelDb, startChangeSetId: GuidString): Promise<ChangedInstanceIds> {
    requestContext.enter();
    const extractContext = new ChangeSummaryExtractContext(iModelDb); // NOTE: ChangeSummaryExtractContext is nothing more than a wrapper around IModelDb that has a method to get the iModelId
    // NOTE: ChangeSummaryManager.downloadChangeSets has nothing really to do with change summaries but has the desired behavior of including the start changeSet (unlike BriefcaseManager.downloadChangeSets)
    const changeSets: ChangeSet[] = await ChangeSummaryManager.downloadChangeSets(requestContext, extractContext, startChangeSetId, iModelDb.briefcase.currentChangeSetId);
    requestContext.enter();
    const changedInstanceIds = new ChangedInstanceIds();
    changeSets.forEach((changeSet: ChangeSet): void => {
      const changeSetPath: string = path.join(BriefcaseManager.getChangeSetsPath(iModelDb.iModelToken.iModelId!), changeSet.fileName!);
      const statusOrResult: IModelJsNative.ErrorStatusOrResult<IModelStatus, any> = iModelDb.nativeDb.extractChangedInstanceIdsFromChangeSet(changeSetPath);
      if (undefined !== statusOrResult.error) {
        throw new IModelError(statusOrResult.error.status, "Error processing changeSet", Logger.logError, loggerCategory);
      }
      const result: IModelJsNative.ChangedInstanceIdsProps = JSON.parse(statusOrResult.result);
      changedInstanceIds.codeSpec.addFromJson(result.codeSpec);
      changedInstanceIds.model.addFromJson(result.model);
      changedInstanceIds.element.addFromJson(result.element);
      changedInstanceIds.aspect.addFromJson(result.aspect);
      changedInstanceIds.relationship.addFromJson(result.relationship);
      changedInstanceIds.font.addFromJson(result.font);
    });
    return changedInstanceIds;
  }
}
