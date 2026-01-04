/**
 * Type definitions for Framer Plugin API
 * These types help improve type safety when working with Framer's API
 */

import type { CanvasNode } from 'framer-plugin'

/**
 * Extended CanvasNode with additional properties we use
 */
export interface ExtendedCanvasNode extends CanvasNode {
  __class?: string
  __svgContent?: string
  svg?: string
  content?: string
  [key: string]: unknown // For dynamic properties
}

/**
 * CMS Collection type from Framer API
 */
export interface FramerCMSCollection {
  id: string
  name: string
  getItems?: () => Promise<FramerCMSItem[]>
  getFields?: () => Promise<FramerCMSField[]>
  itemCount?: number
  [key: string]: unknown // For additional properties
}

/**
 * CMS Item type from Framer API
 */
export interface FramerCMSItem {
  id: string
  slug?: string
  fields?: Record<string, FramerCMSFieldValue>
  [key: string]: unknown // For additional properties
}

/**
 * CMS Field type from Framer API
 */
export interface FramerCMSField {
  id?: string
  name?: string
  key?: string
  type?: string
  [key: string]: unknown // For additional properties
}

/**
 * CMS Field Value - can be various types
 */
export type FramerCMSFieldValue = 
  | string 
  | number 
  | boolean 
  | { value: unknown; type?: string }
  | ImageAsset
  | FileAsset
  | unknown

/**
 * Image Asset from Framer API
 */
export interface ImageAsset {
  id: string
  url: string
  measure?: () => Promise<{ width: number; height: number }>
  [key: string]: unknown
}

/**
 * File Asset from Framer API
 */
export interface FileAsset {
  id: string
  url: string
  [key: string]: unknown
}

/**
 * Framer API with CMS methods (extended)
 */
export interface FramerAPIWithCMS {
  getCollections?: () => Promise<FramerCMSCollection[]>
  getActiveCollection?: () => Promise<FramerCMSCollection | null>
  isImageAsset?: (value: unknown) => value is ImageAsset
  isFileAsset?: (value: unknown) => value is FileAsset
  [key: string]: unknown
}

