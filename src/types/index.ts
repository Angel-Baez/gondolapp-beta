/**
 * Types Barrel Export
 * Re-exports all types from domain-specific files for backward compatibility
 *
 * Usage:
 *   import { ProductoBase, FeedbackReporte } from "@/types";
 *
 * Or import from specific domain:
 *   import { ProductoBase } from "@/types/product.types";
 *   import { FeedbackReporte } from "@/types/feedback.types";
 */

// Common types (generic, used across domains)
export * from "./common.types";

// Product domain types
export * from "./product.types";

// Inventory domain types (reposicion, vencimiento, historial)
export * from "./inventory.types";

// Feedback system types
export * from "./feedback.types";
