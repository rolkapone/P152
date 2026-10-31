export * from "./limits";
export * from "./schema";
export { defaultParams, isValidParamValue } from "./params";
export {
  DESK_TYPE,
  MAX_CATALOG_DEPTH,
  validateCatalog,
  type Catalog,
  type CatalogFiles,
  type CatalogIssue,
  type CatalogIssueCode,
} from "./validate";
export {
  toStudioConfig,
  type QualityTier,
  type Range,
  type StudioBackdrop,
  type StudioCameraView,
  type StudioConfig,
  type StudioLight,
  type StudioShadowTier,
  type ThemeName,
  type Vec3,
  type ViewName,
} from "./studio";
export {
  DESK_SHAPES,
  defaultDeskChoiceId,
  deskChoiceId,
  deskChoices,
  deskSpec,
  sameDesk,
  studioDeskSpec,
  type CornerDeskSpec,
  type DeskChoice,
  type DeskOrientation,
  type DeskShape,
  type DeskSpec,
  type RectDeskSpec,
} from "./desk";
