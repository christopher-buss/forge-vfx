/**
 * Result returned from emitting VFX effects
 */
export interface EmitResult {
  /**
   * Promise that resolves when the effect has finished playing
   */
  Finished: Promise<void>;
}

/**
 * Initialize the Forge VFX system.
 */
export function init(): void;

/**
 * Clean up and shut down the Forge VFX system.
 * Destroys all caches and disconnects event handlers.
 */
export function deinit(): void;

/**
 * Emit VFX effects from the provided instances.
 * Supports ParticleEmitters, Beams, Trails, Models, and tagged effects.
 * @param instances One or more Roblox instances to emit effects from
 * @returns Result object with a Finished promise
 */
export function emit(...instances: Instance[]): EmitResult;

/**
 * Emit VFX effects with a scale multiplier.
 * @param scale Scale multiplier for the effect
 * @param instances One or more Roblox instances to emit effects from
 * @returns Result object with a Finished promise
 */
export function emit(scale: number, ...instances: Instance[]): EmitResult;

/**
 * Emit VFX effects with a specific render depth.
 * @param depth Render priority depth for the effect
 * @param instances One or more Roblox instances to emit effects from
 * @returns Result object with a Finished promise
 */
export function emitWithDepth(
  depth: number,
  ...instances: Instance[]
): EmitResult;

/**
 * Enable a VFX instance.
 * For ParticleEmitters and Beams, sets the Enabled property directly.
 * For other instances, sets the "Enabled" attribute.
 * @param obj The instance to enable
 */
export function enable(obj: Instance): void;

/**
 * Disable a VFX instance.
 * For ParticleEmitters and Beams, sets the Enabled property directly.
 * For other instances, sets the "Enabled" attribute.
 * @param obj The instance to disable
 */
export function disable(obj: Instance): void;

/**
 * Cache attributes for a VFX instance and its descendants.
 * Strips attributes from instances and stores them in memory for faster access.
 * Only works on the client and for instances inside ReplicatedStorage.
 * @param obj The instance whose descendant attributes to cache
 */
export function cacheAttributes(obj: Instance): void;

/**
 * Restore previously cached attributes back onto instances.
 * Only works on the client.
 * @param obj The instance whose descendant attributes to restore
 */
export function restoreAttributes(obj: Instance): void;
