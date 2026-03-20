/**
 * Configuration parameters for object caching. Controls pooling behavior for
 * VFX instances.
 */
export interface CacheParameters {
	/**
	 * Seconds before excess cached items are cleaned up.
	 *
	 * @default undefined
	 */
	excess_lifetime?: number;
	/**
	 * Callback invoked when an item is returned to the cache.
	 *
	 * @param item - The cache item being freed.
	 */
	on_free?: (item: Item) => void;
	/**
	 * Initial/target size of the cache pool.
	 *
	 * @default undefined
	 */
	size?: number;
}

/**
 * Object cache for pooling and reusing VFX instances. Extends the base Cache
 * with additional tracking for part-based effects. MeshPart and Union effects
 * cannot be reasonably pooled, so their CFrames are not updated in bulk which
 * may impact performance with heavy emission.
 */
export interface ObjectCache extends Cache {
	/** Current number of items in the cache. */
	amount: number;
	/** Map of keys to their corresponding cache items. */
	item_map: Map<unknown, Item>;
	/** Cache configuration parameters. */
	params: CacheParameters;
	/** Parent instance for cached items. */
	parent?: Instance;
	/** Whether this cache is in part mode for bulk CFrame updates. */
	part_mode: boolean;
	/** Reference instance used as template for creating new cache items. */
	ref: Instance;
	/** Number of items to restore to the pool. */
	restore_amount: number;
	/** Scope for cleanup management. */
	scope: Array<unknown>;
	/** Array of unused items available for reuse. */
	unused: Array<Item>;
}

/** Internal cache storage for the VFX system. */
export interface ApiCaches {
	/** Shared part cache for pooling reusable effect parts. */
	shared_part: ObjectCache;
}

/**
 * Result returned from emitting VFX effects. Contains a promise for tracking
 * effect completion.
 *
 * @example
 *
 * ```ts
 * const env = vfx.emit(Workspace.Effect);
 * env.Finished.finally(() => print("Effect finished!"));
 * ```
 */
export interface EmitEnvironment {
	/**
	 * Promise that resolves when all emitted effects have finished playing. Use
	 * `:finally()` or `:andThen()` to run code after completion.
	 */
	Finished: Promise<void>;
}

/**
 * Main API for Forge VFX.
 *
 * @example
 *
 * ```ts
 * import vfx from "@rbxts/forge-vfx";
 * vfx.init();
 *
 * const env = vfx.emit(Workspace.Effect);
 * env.Finished.finally(() => print("Effect finished!"));
 * ```
 */
export interface Api {
	/**
	 * Caches attributes for a VFX object's descendants. Client-side only. Use
	 * with `restoreAttributes` to save/restore original attribute values.
	 *
	 * @param object - Root instance whose descendant attributes to cache.
	 */
	cacheAttributes: (object: Instance) => void;

	/** Internal caches used by the VFX system. */
	caches?: ApiCaches;

	/**
	 * Clean up and shut down Forge VFX. Destroys all caches, cleans up scopes,
	 * deinitializes all modules, and disconnects event handlers.
	 */
	deinit: () => void;

	/**
	 * Disables a VFX instance and all its descendants. For ParticleEmitters and
	 * Beams, sets the Enabled property directly. For other instances, sets the
	 * "Enabled" attribute.
	 *
	 * @param object - Instance to disable (propagates to descendants).
	 */
	disable: (object: Instance) => void;

	/**
	 * Emit VFX effects from the provided instances. Supports ParticleEmitters,
	 * Beams, Trails, Meshes, Beziers, Spin Models, Shockwaves, and all other
	 * Forge VFX effect types.
	 *
	 * @example
	 *
	 * ```ts
	 * // Basic emit
	 * vfx.emit(Workspace.Effect);
	 *
	 * // Emit multiple effects
	 * vfx.emit(Effects.Explosion, Effects.Wind);
	 *
	 * // Emit with 2x scale
	 * vfx.emit(2, Workspace.Effect);
	 * ```
	 */
	emit: {
		/**
		 * Emit effects at default scale (1).
		 *
		 * @param instances - Roblox instances to emit effects from.
		 * @returns Environment with a Finished promise that resolves when
		 *   complete.
		 */
		(instance: Instance, ...instances: Array<Instance>): EmitEnvironment;
		/**
		 * Emit effects at a specified scale.
		 *
		 * @param scale - Scale multiplier for the effects.
		 * @param instances - One or more Roblox instances to emit effects from.
		 * @returns Environment with a Finished promise that resolves when
		 *   complete.
		 */
		(scale: number, instance: Instance, ...instances: Array<Instance>): EmitEnvironment;
	};

	/**
	 * Emit VFX effects with specified render depth ordering.
	 *
	 * @param depth - Render priority depth for the emitted effects.
	 * @param instance - Roblox instance to emit effects from.
	 * @param instances - Additional Roblox instances to emit effects from.
	 * @returns Environment with a Finished promise that resolves when complete.
	 */
	emitWithDepth: (
		depth: number,
		instance: Instance,
		...instances: Array<Instance>
	) => EmitEnvironment;

	/**
	 * Enables a VFX instance and all its descendants. For ParticleEmitters and
	 * Beams, sets the Enabled property directly. For other instances, sets the
	 * "Enabled" attribute.
	 *
	 * @param object - Instance to enable (propagates to descendants).
	 */
	enable: (object: Instance) => void;

	/**
	 * Initializes the VFX system. Sets up collision groups on server,
	 * initializes caches and all VFX modules.
	 *
	 * @param parameters - Optional initialization parameters.
	 */
	init: (parameters?: object) => void;

	/**
	 * Recolor VFX instances. In "replace" mode, sets all colors to the given
	 * color (preserving HDR factor). In "multiply" mode, blends the color with
	 * existing colors via HSV multiplication. Skips BasePart descendants (only
	 * applies to directly passed BaseParts).
	 *
	 * @param color - The target color.
	 * @param mode - "replace" to set colors directly, "multiply" to blend with
	 *   existing.
	 * @param instances - One or more instances to recolor (includes
	 *   descendants).
	 */
	recolor: (color: Color3, mode: "multiply" | "replace", ...instances: Array<Instance>) => void;

	/**
	 * Scale the size of VFX instances by a factor. Adjusts particle sizes, beam
	 * widths, attachment distances, and more.
	 *
	 * @param factor - The size scale factor.
	 * @param instances - One or more instances to resize (includes
	 *   descendants).
	 */
	resize: (factor: number, ...instances: Array<Instance>) => void;

	/**
	 * Restores previously cached attributes for a VFX object's descendants.
	 * Client-side only.
	 *
	 * @param object - Root instance whose descendant attributes to restore.
	 */
	restoreAttributes: (object: Instance) => void;

	/**
	 * Scale the timing of VFX instances by a factor. Adjusts speeds, lifetimes,
	 * durations, and rates across all effect types.
	 *
	 * @param factor - The time scale factor (>1 speeds up, <1 slows down).
	 * @param instances - One or more instances to retime (includes
	 *   descendants).
	 */
	retime: (factor: number, ...instances: Array<Instance>) => void;

	/** Current active scope stack for cleanup management. */
	scope: Array<unknown>;

	/** Whether the VFX system has been initialized. */
	setup: boolean;
}

/**
 * Internal service managing effect emission and lifecycle.
 *
 * @internal
 */
export interface EffectsService {
	/** Shuts down the effects service and cleans up resources. */
	deinit: () => void;
	/**
	 * Emits effects with specified depth ordering.
	 *
	 * @param depth - Render priority depth.
	 * @param instance - Instance to emit effects from.
	 * @param instances - Additional instances to emit effects from.
	 */
	emit: (depth: number, instance: Instance, ...instances: Array<Instance>) => EmitEnvironment;
	/**
	 * Emits effects from a folder's children, parenting them to the target
	 * first.
	 *
	 * @param folder - Folder containing effects to emit, or undefined.
	 * @param targetParent - Instance to parent the folder's children to.
	 * @param depth - Render priority depth.
	 */
	emitFromFolder: (
		folder: Folder | undefined,
		targetParent: Instance,
		depth: number,
	) => EmitEnvironment;
	/**
	 * Emits nested effects from a part's children.
	 *
	 * @param part - Instance whose children to emit.
	 * @param depth - Render priority depth.
	 */
	emitNested: (part: Instance, depth: number) => EmitEnvironment;
	/**
	 * Emits effects from an EmitOnFinish folder. Delegates to emitFromFolder.
	 *
	 * @param emitOnFinish - EmitOnFinish folder, or undefined.
	 * @param targetParent - Instance to parent effects to.
	 * @param depth - Render priority depth.
	 */
	emitOnFinish: (
		emitOnFinish: Folder | undefined,
		targetParent: Instance,
		depth: number,
	) => EmitEnvironment;
	/**
	 * Initializes the effects service.
	 *
	 * @param api - Reference to the main API.
	 */
	init: (api: Api) => void;
	/**
	 * Prepares a named folder for deferred emission by un-parenting it.
	 *
	 * @param object - Instance to search for the folder.
	 * @param folderName - Name of the folder to prepare.
	 * @param scope - Scope for cleanup.
	 */
	prepareEmitFolder: (object: Instance, folderName: string, scope: Scope) => Folder | undefined;
	/**
	 * Prepares the EmitOnFinish folder. Delegates to prepareEmitFolder.
	 *
	 * @param object - Instance to search for EmitOnFinish.
	 * @param scope - Scope for cleanup.
	 */
	prepareEmitOnFinish: (object: Instance, scope: Scope) => Folder | undefined;
}

/**
 * Scope for managing VFX cleanup and lifecycle. Scopes hold cleanup functions,
 * connections, and tweens that need to be cleaned up when effects finish.
 * Implements array semantics for storing cleanup handlers.
 */
export interface Scope extends Array<unknown> {
	/**
	 * Render priority depth for this scope. Used to determine the order of
	 * render step bindings.
	 */
	depth: number;
	/** Reference to the effects service for this scope. */
	effects: EffectsService;
}

/**
 * Internal representation of a cached item.
 *
 * @internal
 */
interface Item {
	/** Unique key identifying this item in the cache. */
	key: unknown;
	/** Timestamp when item was added to cache. */
	added: number;
	/** Number of active references to this item. */
	dependents: number;
	/** The actual Roblox instance being cached. */
	value: Instance;
}

/**
 * Base cache class for pooling Roblox instances. Used internally to reduce
 * instantiation overhead for VFX effects.
 */
declare class Cache {
	/**
	 * Destroys the cache and all cached items. Call during cleanup to prevent
	 * memory leaks.
	 */
	public destroy: () => void;
	/**
	 * Returns an item to the cache pool for reuse.
	 *
	 * @param key - Key of the item to free.
	 */
	public free: (key: unknown) => void;
	/**
	 * Retrieves an item from the cache, creating one if needed.
	 *
	 * @param key - Key to retrieve or create.
	 * @returns The cached instance.
	 */
	public get: (key: unknown) => Instance;
	/**
	 * Checks if an item exists in the cache.
	 *
	 * @param key - Key to check.
	 * @returns True if the key exists in the cache.
	 */
	public has: (key: unknown) => boolean;
	/**
	 * Retrieves an item without creating it if missing.
	 *
	 * @param key - Key to look up.
	 * @returns The cached item, or undefined if not found.
	 */
	public peek: (key: unknown) => Item | undefined;

	/**
	 * Creates a new cache.
	 *
	 * @param ref - Template instance to clone when creating new items.
	 * @param parent - Optional parent for cached instances.
	 * @param parameters - Optional cache configuration.
	 */
	constructor(ref: Instance, parent?: Instance, parameters?: CacheParameters);
}

/**
 * Forge VFX - An advanced custom VFX system for Roblox.
 *
 * Supports 12+ effect types including particles, beams, trails, meshes, bezier
 * curves, shockwaves, spin models, screen effects, and camera shake.
 *
 * @see https://docs.zilibobi.dev/vfx-forge/
 */
declare const VfxForge: Api;
export = VfxForge;
