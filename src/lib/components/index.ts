/**
 * Components Module
 *
 * Main entry point for all UI components.
 * Re-exports from core, layout, and domain modules.
 */

// Re-export all from core (primitives, interactive, error)
export * from './core';

// Re-export all from layout (navigation, page structure, status)
export * from './layout';

// Re-export all from domain (work, agents, seance, workflows)
export * from './domain';
