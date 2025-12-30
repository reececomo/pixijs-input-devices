import { ContainerNavigateOptions } from "./lib/navigation/ContainerNavigateOptions";

declare module "pixi.js"
{
  export interface ContainerOptions
  {
    /** @default "auto" */
    navigationMode?: "auto" | "always" | "none";

    /** @default {} */
    navigationLinks?: ContainerNavigateOptions;

    /** @default 0 */
    navigationPriority?: number;

    handledNavigationIntent?(intent: NavigateBinds, device: Device): boolean;
    becameFirstResponder?(): void;
    resignedAsFirstResponder?(): void;
  }

  export interface Container
  {
    /**
     * Whether the container supports device navigation. Enabled when
     * navigationMode is "always", or "auto" and container is interactive.
     */
    readonly navigatable: boolean;

    /**
     * Device navigation mode.
     *
     * - "auto" - Navigatable when the container is interactive.
     * - "always" - Always navigatable even when interactive disabled.
     * - "none" - Navigation is disabled.
     *
     * @default "auto"
     */
    navigationMode: "auto" | "always" | "none";

    /**
     * (Optional) Container navigation links, to override spatial navigation.
     *
     * @example
     * button1.nav.left = button2;
     */
    navigationLinks: ContainerNavigateOptions;

    /**
     * Priority used when no container has focus, and navigation is determining
     * the focus target to choose.
     *
     * @default 0
     */
    navigationPriority: number;

    //
    // ----- (Optional) NavigationResponder handlers: -----
    //

    /**
     * Called when received a navigation intent. The target should handle, and
     * respond with a boolean indicating whether or not the intent was handled.
     *
     * Unhandled interaction intents will be bubbled up to the next target. You
     * might return `true` here to prevent any intent from being propagated.
     */
    handledNavigationIntent?(
      intent: NavigateBinds,
      device: Device,
    ): boolean;

    /**
     * This method is triggered when the target became the first responder.
     *
     * Either when pushed, or when another target stopped being the first
     * responder.
     */
    becameFirstResponder?(): void;

    /**
     * This method is triggered when the target stopped being first responder.
     *
     * Either popped, or another target was pushed on top of the stack.
     */
    resignedAsFirstResponder?(): void;
  }
}

export {};
import { Bounds, Container } from 'pixi.js';

declare class InputDeviceManager {
	static global: InputDeviceManager;
	/** Whether the window context is detected as having a mouse-like pointer. */
	readonly hasMouseLikePointer: boolean;
	/** Whether the window context is a touchscreen. */
	readonly isTouchCapable: boolean;
	/** Whether the window context is detected as mobile. */
	readonly isMobile: boolean;
	/**
	 * Global keyboard interface (for all virtual & physical keyboards).
	 */
	readonly keyboard: KeyboardDeviceInstance;
	/**
	 * Options that apply to input devices.
	 */
	options: {
		clearInputOnBackground: boolean;
		requireDocumentFocus: boolean;
		supressHapticsInactivityPeriodMs: number;
	};
	private readonly _devices;
	private readonly _gamepads;
	private readonly _gamepadIdx;
	private readonly _custom;
	private readonly _emitter;
	private readonly _bindDownEmitter;
	private readonly _bindUpEmitter;
	private _hasFocus;
	private _lastInteractedDevice?;
	private constructor();
	/**
	 * Connected devices.
	 *
	 * Keep in mind these inputs may only be up-to-date from the last update().
	 */
	get devices(): readonly Device[];
	/**
	 * Connected gamepads accessible by index.
	 *
	 * Keep in mind these inputs are only up-to-date from the last update().
	 */
	get gamepads(): readonly GamepadDevice[];
	/**
	 * Connected custom devices.
	 *
	 * Keep in mind these inputs may only be up-to-date from the last update().
	 */
	get custom(): readonly CustomDevice[];
	/**
	 * The device with the most recent interaction.
	 */
	get lastInteractedDevice(): Device | undefined;
	/** Add an event listener */
	on<K extends keyof InputDeviceEvent>(event: K, listener: (event: InputDeviceEvent[K]) => void): this;
	/**
	 * Remove an event listener (or all if none provided)
	 */
	off<K extends keyof InputDeviceEvent>(event: K, listener: (event: InputDeviceEvent[K]) => void): this;
	/**
	 * Adds a named bind event listener.
	 */
	onBindDown<B extends NamedBind>(name: B | readonly B[], listener: (event: NamedBindEvent<B>) => void, options?: EventOptions): this;
	/**
	 * Adds a named bind event listener.
	 */
	onBindUp<B extends NamedBind>(name: B | readonly B[], listener: (event: NamedBindEvent<B>) => void, options?: EventOptions): this;
	/**
	 * Adds a named bind event listener.
	 */
	onBind<B extends NamedBind>(name: B | readonly B[], listener: (event: NamedBindEvent<B>) => void, options?: EventOptions): this;
	/**
	 * Remove a named bind event listener (or ALL event listeners if none provided).
	 */
	offBindDown<B extends NamedBind>(name: B | readonly B[], listener?: (event: NamedBindEvent<B>) => void): this;
	/**
	 * Remove a named bind event listener (or ALL event listeners if none provided).
	 */
	offBindUp<B extends NamedBind>(name: B | readonly B[], listener?: (event: NamedBindEvent<B>) => void): this;
	/**
	 * Remove a named bind event listener (or ALL event listeners if none provided).
	 */
	offBind<B extends NamedBind>(name: B | readonly B[], listener?: (event: NamedBindEvent<B>) => void): this;
	/**
	 * Report a named bind event (i.e. from UI or a CustomDevice).
	 */
	emitBindDown<B extends NamedBind>(name: B, device: Device, value?: number): this;
	/**
	 * Report a named bind event (i.e. from UI or a CustomDevice).
	 */
	emitBindUp<B extends NamedBind>(name: B, device: Device): this;
	/**
	 * Report a named bind event (i.e. from UI or a CustomDevice).
	 *
	 * Emits a "down" and "up" immediately.
	 */
	emitBind<B extends NamedBind>(name: B, device: Device): void;
	/**
	 * Add a device.
	 */
	add(device: Device): void;
	/**
	 * Remove a device from the available devices.
	 */
	remove(device: Device): void;
	/**
	 * Performs a poll of latest input from all devices
	 */
	update(): ReadonlyArray<Device>;
	private _updateLastInteracted;
	private _pollGamepads;
}
declare class NavigationManager {
	static global: NavigationManager;
	/**
	 * Navigation options
	 */
	options: {
		/**
		 * Minimum distance in a direction that a container has to be to
		 * appear as selectable in that direction.
		 */
		minimumDirectionDistance: number;
		/**
		 * FederatedPointerEvents to fire when navigating containers.
		 */
		events: {
			enter: string[];
			press: string[];
			release: string[];
			leave: string[];
		};
	};
	/**
	 * Current source of navigation device
	 */
	device?: Device;
	/**
	 * Pauses all navigation.
	 */
	paused: boolean;
	/**
	 * Current source of navigation focus.
	 */
	focusSource: FocusSource;
	private _responders;
	private _rootContainer?;
	private _rootFocused?;
	private _clearBinds?;
	private constructor();
	/**
	 * Whether navigation is enabled and NOT paused.
	 */
	get active(): boolean;
	/**
	 * Current navigation target.
	 */
	get focusTarget(): Container | undefined;
	set focusTarget(target: Container | undefined);
	/**
	 * Active global interaction target.
	 */
	get firstResponder(): NavigationResponder | undefined;
	/**
	 * Stack of global interaction targets.
	 */
	get responders(): readonly NavigationResponder[];
	/** @deprecated Use `UINavigation.enable(stageRoot)` instead. */
	configureWithRoot(stageRoot: Container): void;
	/**
	 * Initialize navigation and set the root navigation responder.
	 *
	 * @param stageRoot - Root navigation responder container, where navigatable
	 * containers can live.
	 */
	enable(stageRoot: Container): this;
	/**
	 * Set the new top-most global interaction target.
	 */
	pushResponder(responder: Container | NavigationResponder): void;
	/**
	 * Remove the top-most global interaction target
	 */
	popResponder(): NavigationResponder | undefined;
	/**
	 * Set the new top-most global interaction target.
	 */
	setTopMostResponder(responder: Container | NavigationResponder): void;
	/**
	 * Removes the responder if in the responders list.
	 */
	removeResponder<T extends Container | NavigationResponder>(responder: T, popAllAbove?: boolean): T | undefined;
	/**
	 * Focus on the first navigatable element.
	 */
	autoFocus(): void;
	/**
	 * Current root container for navigation.
	 */
	getStageContainer(): Container;
	disable(): void;
	/**
	 * @param target - Container to focus on.
	 * @param device - The device setting focus. When omitted, assumes pointer.
	 */
	setFocus(target: Container | undefined | null, device?: Device): void;
	private _clearNavigateBindsHandler;
	private _responderHandleNavigationIntent;
	private _handleNavigateBindEvent;
	private _enter;
	private _press;
	private _release;
	private _leave;
	private _clearFocusTargetIfRemoved;
}
declare const Axis: {
	readonly LeftStickX: 0;
	readonly LeftStickY: 1;
	readonly RightStickX: 2;
	readonly RightStickY: 3;
};
declare const AxisCode: readonly [
	"LeftStickLeft",
	"LeftStickRight",
	"LeftStickUp",
	"LeftStickDown",
	"RightStickLeft",
	"RightStickRight",
	"RightStickUp",
	"RightStickDown"
];
declare const ButtonCode: readonly [
	"Face1",
	"Face2",
	"Face3",
	"Face4",
	"LeftShoulder",
	"RightShoulder",
	"LeftTrigger",
	"RightTrigger",
	"Back",
	"Start",
	"LeftStickClick",
	"RightStickClick",
	"DpadUp",
	"DpadDown",
	"DpadLeft",
	"DpadRight"
];
/**
 * A gamepad (game controller).
 *
 * Provides bindings and accessors for standard controller/gamepad layout:
 * - 2 Joysticks: `leftJoystick`, `rightJoystick`
 * - 16 Buttons: `button[...]`
 *
 * Direct Gamepad API access available too, via `source`.
 */
export declare class GamepadDevice {
	source: Gamepad;
	/**
	 * Setup named binds for all newly connecting gamepads.
	 */
	static configureDefaultBinds<BindName extends NamedBind = NamedBind>(binds: Partial<Record<BindName, GamepadCode[]>>): void;
	static defaultOptions: {
		/**
		 * When set to false, events are not emitted.
		 * @default true,
		 */
		emitEvents: boolean;
		/**
		 * Joystick configuration.
		 */
		joystick: {
			/**
			 * Sensitivity deadzone
			 *
			 * The range of movement in a joystick recognized as input, to
			 * prevent unintended movements caused by imprecision or wear.
			 *
			 * @default [ 0.0, 1.0 ]
			 */
			deadzone: [
				number,
				number
			];
			/**
			 * Press threshold
			 *
			 * The point within the deadzone when a joystick axis is considered pressed.
			 *
			 * @default 0.5
			 */
			pressThreshold: number;
			/**
			 * The amount of time (in milliseconds) between emitting axis events in a
			 * given direction, given as [first, subsequent].
			 *
			 * @default [ delay: 400, repeat: 100 ]
			 */
			autoRepeatDelayMs: [
				number,
				number
			];
		};
		/**
		 * Trigger configuration.
		 */
		trigger: {
			/**
			 * Sensitivity deadzone
			 *
			 * The range of movement in a trigger recognized as input, to
			 * revent unintended movements caused by imprecision or wear.
			 *
			 * @default [ 0.0, 1.0 ]
			 */
			deadzone: [
				number,
				number
			];
		};
		/**
		 * Vibration configuration.
		 */
		vibration: {
			/**
			 * Whether vibration is enabled (when available).
			 *
			 * @default true
			 */
			enabled: boolean;
			/**
			 * Global intensity of vibrations, between 0.0 and 1.0.
			 *
			 * @default 1.0
			 */
			intensity: number;
		};
		/**
		 * Set binds using `device.configureBinds()` or
		 * `GamepadDevice.configureDefaultBinds()`
		 *
		 * @readonly
		 */
		binds: Partial<Record<NamedBind, GamepadCode[]>>;
	};
	/**
	 * Globally unique identifier for this gamepad slot.
	 * @example "gamepad0"
	 */
	readonly id: string;
	readonly type = "gamepad";
	/**
	 * Associate custom meta data with a device.
	 */
	readonly meta: DeviceMetadata;
	/**
	 * When the gamepad was last interacted with.
	 */
	lastInteraction: number;
	/**
	 * Platform of this gamepad, useful for configuring standard
	 * button layouts or displaying branded icons.
	 * @example "playstation"
	 */
	readonly layout: GamepadLayout;
	/**
	 * Whether the gamepad reports that trigger rumble is supported.
	 */
	readonly supportsTriggerRumble: boolean;
	/**
	 * Gamepad configuration options.
	 */
	options: typeof GamepadDevice.defaultOptions;
	readonly leftJoystick: {
		x: number;
		y: number;
	};
	readonly rightJoystick: {
		x: number;
		y: number;
	};
	/** Accessors for buttons */
	button: Record<AxisCode | ButtonCode, boolean>;
	/** A scalar 0.0 to 1.0 representing the left trigger value */
	leftTrigger: number;
	/** A scalar 0.0 to 1.0 representing the right trigger value */
	rightTrigger: number;
	/** A scalar 0.0 to 1.0 representing the left shoulder value */
	leftShoulder: number;
	/** A scalar 0.0 to 1.0 representing the right shoulder value */
	rightShoulder: number;
	private readonly _haptics;
	private readonly _emitter;
	private readonly _bindDownEmitter;
	private readonly _bindUpEmitter;
	private readonly _debounces;
	constructor(source: Gamepad);
	/** @returns true if any button from the named bind is pressed. */
	bindDown(name: NamedBind): boolean;
	/** @returns true if any of the given buttons are pressed. */
	pressedAny(btns: GamepadCode[]): boolean;
	/** @returns true if all of the given buttons are pressed. */
	pressedAll(btns: GamepadCode[]): boolean;
	/** Set named binds for this gamepad */
	configureBinds<BindName extends string = string | NavigateBinds>(binds: Partial<Record<BindName, GamepadCode[]>>): void;
	/** Add an event listener */
	on<K extends keyof GamepadDeviceEvent>(event: K, listener: (event: GamepadDeviceEvent[K]) => void, options?: EventOptions): this;
	/** Remove an event listener (or all if none provided). */
	off<K extends keyof GamepadDeviceEvent>(event: K, listener?: (event: GamepadDeviceEvent[K]) => void): this;
	/** Add a named bind event listener (or all if none provided). */
	onBindDown(name: NamedBind, listener: (event: GamepadNamedBindEvent) => void, options?: EventOptions): this;
	/** Remove a named bind event listener (or all if none provided). */
	offBindDown(name: NamedBind, listener?: (event: GamepadNamedBindEvent) => void): this;
	/** Add a named bind event listener (or all if none provided). */
	onBindUp(name: NamedBind, listener: (event: GamepadNamedBindEvent) => void, options?: EventOptions): this;
	/** Remove a named bind event listener (or all if none provided). */
	offBindUp(name: NamedBind, listener?: (event: GamepadNamedBindEvent) => void): this;
	/** Add a named bind event listener (or all if none provided). */
	onBind(name: NamedBind, listener: (event: GamepadNamedBindEvent) => void, options?: EventOptions): this;
	/** Remove a named bind event listener (or all if none provided). */
	offBind(name: NamedBind, listener?: (event: GamepadNamedBindEvent) => void): this;
	/**
	 * Play a haptic effect (when supported).
	 */
	playHaptic(...effects: HapticEffect[]): void;
	/**
	 * Stop all haptic effects.
	 */
	stopHaptics(): void;
	update(source: Gamepad, now: number): void;
	clear(): void;
	private _poll;
	/**
	 * Inline relay debouncer.
	 * @returns true when already in progress and the operation should be skipped
	 */
	private _debounce;
}
export declare class KeyboardDeviceInstance {
	static global: KeyboardDeviceInstance;
	readonly type = "keyboard";
	readonly id = "keyboard";
	/**
	 * Associate custom meta data with a device.
	 */
	readonly meta: DeviceMetadata;
	/** Timestamp of when the keyboard was last interacted with. */
	lastInteraction: number;
	/**
	 * Keyboard has been detected.
	 *
	 * This is true on devices where keyboard is the default device, or on
	 * other devices when a keyboard is first interacted with.
	 */
	detected: boolean;
	/**
	 * Keyboard configuration otpions.
	 */
	options: {
		/**
		 * When set to false, events are not emitted (excluding layout detection).
		 * @default true,
		 */
		emitEvents: boolean;
		/**
		 * Whether this keyboard is allowed to check keypresses for the layout.
		 *
		 * This is only used when the browser does not provide it, and it is not
		 * set manually.
		 *
		 * Checks "keydown" events until the layout is determined.
		 */
		detectLayoutOnKeypress: boolean;
		/**
		 * Set binds using `device.configureBinds()`
		 *
		 * @readonly
		 */
		binds: Partial<Record<NamedBind, KeyCode[]>>;
		/**
	 * These are the binds that are allowed to repeat when a key
	 * is held down.
	 *
	 * @default ["NavigateDown", "NavigateLeft", "NavigateRight", "NavigateUp"]
	 */
		repeatableBinds: string[];
	};
	/** Accessors for keys */
	key: Record<KeyCode, boolean>;
	private readonly _emitter;
	private readonly _bindDownEmitter;
	private readonly _bindUpEmitter;
	private _layout;
	private _layoutSource;
	private _deferredKeydown;
	private _deferredKeyup;
	private constructor();
	/**
	 * Keyboard Layout
	 *
	 * If not set manually, this is determined by the browser (in
	 * browsers that support detection), otherwise layout is inferred
	 * on keypress, or from device language.
	 *
	 * Supports the "big four": `"QWERTY"`, `"AZERTY"`, `"QWERTZ"`,
	 * and `"JCUKEN"` - i.e. it does not include specialized layouts
	 * (e.g. Dvorak, Colemak, BÉPO), or regional layouts (e.g. Hangeul,
	 * Kana) etc.
	 *
	 * When not set explicitly, this is provided by the browser,
	 * or detected by keystrokes, or finally inferred from the
	 * browser's language.
	 *
	 * @example "JCUKEN"
	 */
	get layout(): KeyboardLayout;
	set layout(value: KeyboardLayout);
	/** How the keyboard layout was determined. */
	get layoutSource(): KeyboardLayoutSource;
	/** @returns true if any KeyCode from the named bind is pressed. */
	bindDown(name: NamedBind): boolean;
	/** @returns true if any of the given keys are pressed. */
	pressedAny(keys: KeyCode[]): boolean;
	/** @returns true if all of the given keys are pressed. */
	pressedAll(keys: KeyCode[]): boolean;
	/** Set custom binds */
	configureBinds<B extends NamedBind>(binds: Partial<Record<B, KeyCode[]>>): void;
	/** Haptics not supported on default keyboard. */
	playHaptic(): void;
	/** Add an event listener. */
	on<K extends keyof KeyboardDeviceEvent>(event: K, listener: (event: KeyboardDeviceEvent[K]) => void, options?: EventOptions): this;
	/** Remove an event listener (or all if none provided). */
	off<K extends keyof KeyboardDeviceEvent>(event: K, listener?: (event: KeyboardDeviceEvent[K]) => void): this;
	/** Add a named bind event listener (or all if none provided). */
	onBindDown(name: NamedBind, listener: (event: KeyboardDeviceNamedBindKeyEvent) => void, options?: EventOptions): this;
	/** Remove a named bind event listener (or all if none provided). */
	offBindDown(name: NamedBind, listener?: (event: KeyboardDeviceNamedBindKeyEvent) => void): this;
	/** Add a named bind event listener (or all if none provided). */
	onBindUp(name: NamedBind, listener: (event: KeyboardDeviceNamedBindKeyEvent) => void, options?: EventOptions): this;
	/** Remove a named bind event listener (or all if none provided). */
	offBindUp(name: NamedBind, listener?: (event: KeyboardDeviceNamedBindKeyEvent) => void): this;
	/** Add a named bind event listener (or all if none provided). */
	onBind(name: NamedBind, listener: (event: KeyboardDeviceNamedBindKeyEvent) => void, options?: EventOptions): this;
	/** Remove a named bind event listener (or all if none provided). */
	offBind(name: NamedBind, listener?: (event: KeyboardDeviceNamedBindKeyEvent) => void): this;
	/**
	 * Get the label for the given key code in the current keyboard
	 * layout. Attempts to use the Navigator KeyboardLayoutMap API
	 * before falling back to defaults.
	 *
	 * @see https://caniuse.com/mdn-api_keyboardlayoutmap
	 *
	 * @example
	 * keyboard.getKeyLabel("KeyZ") === "W" // AZERTY
	 * keyboard.getKeyLabel("KeyZ") === "Я" // JCUKEN
	 * keyboard.getKeyLabel("KeyZ") === "Z" // QWERTY
	 * keyboard.getKeyLabel("KeyZ") === "Y" // QWERTZ
	 */
	getKeyLabel(key: KeyCode, layout?: KeyboardLayout): string;
	/**
	 * Process deferred keyboard events.
	 */
	update(now: number): void;
	/**
	 * Clear all keyboard keys.
	 */
	clear(): void;
	private _configureEventListeners;
	private _processDeferredKeydownEvent;
	private _emitDeferredKeyupEvent;
}
export declare const Button: {
	readonly Face1: 0;
	readonly Face2: 1;
	readonly Face3: 2;
	readonly Face4: 3;
	readonly LeftShoulder: 4;
	readonly RightShoulder: 5;
	readonly LeftTrigger: 6;
	readonly RightTrigger: 7;
	readonly Back: 8;
	readonly Start: 9;
	readonly LeftStickClick: 10;
	readonly RightStickClick: 11;
	readonly DpadUp: 12;
	readonly DpadDown: 13;
	readonly DpadLeft: 14;
	readonly DpadRight: 15;
};
export declare const InputDevice: InputDeviceManager;
export declare const KeyCode: {
	readonly AltLeft: "AltLeft";
	readonly AltRight: "AltRight";
	readonly ArrowDown: "ArrowDown";
	readonly ArrowLeft: "ArrowLeft";
	readonly ArrowRight: "ArrowRight";
	readonly ArrowUp: "ArrowUp";
	readonly Backquote: "Backquote";
	readonly Backslash: "Backslash";
	readonly Backspace: "Backspace";
	readonly BracketLeft: "BracketLeft";
	readonly BracketRight: "BracketRight";
	readonly CapsLock: "CapsLock";
	readonly Comma: "Comma";
	readonly ContextMenu: "ContextMenu";
	readonly ControlLeft: "ControlLeft";
	readonly ControlRight: "ControlRight";
	readonly Delete: "Delete";
	readonly Digit0: "Digit0";
	readonly Digit1: "Digit1";
	readonly Digit2: "Digit2";
	readonly Digit3: "Digit3";
	readonly Digit4: "Digit4";
	readonly Digit5: "Digit5";
	readonly Digit6: "Digit6";
	readonly Digit7: "Digit7";
	readonly Digit8: "Digit8";
	readonly Digit9: "Digit9";
	readonly End: "End";
	readonly Enter: "Enter";
	readonly Equal: "Equal";
	readonly Escape: "Escape";
	readonly F1: "F1";
	readonly F10: "F10";
	readonly F11: "F11";
	readonly F12: "F12";
	readonly F13: "F13";
	readonly F14: "F14";
	readonly F15: "F15";
	readonly F16: "F16";
	readonly F17: "F17";
	readonly F18: "F18";
	readonly F19: "F19";
	readonly F2: "F2";
	readonly F20: "F20";
	readonly F21: "F21";
	readonly F22: "F22";
	readonly F23: "F23";
	readonly F24: "F24";
	readonly F25: "F25";
	readonly F26: "F26";
	readonly F27: "F27";
	readonly F28: "F28";
	readonly F29: "F29";
	readonly F3: "F3";
	readonly F30: "F30";
	readonly F31: "F31";
	readonly F32: "F32";
	readonly F4: "F4";
	readonly F5: "F5";
	readonly F6: "F6";
	readonly F7: "F7";
	readonly F8: "F8";
	readonly F9: "F9";
	readonly Home: "Home";
	readonly IntlBackslash: "IntlBackslash";
	readonly IntlRo: "IntlRo";
	readonly IntlYen: "IntlYen";
	readonly KeyA: "KeyA";
	readonly KeyB: "KeyB";
	readonly KeyC: "KeyC";
	readonly KeyD: "KeyD";
	readonly KeyE: "KeyE";
	readonly KeyF: "KeyF";
	readonly KeyG: "KeyG";
	readonly KeyH: "KeyH";
	readonly KeyI: "KeyI";
	readonly KeyJ: "KeyJ";
	readonly KeyK: "KeyK";
	readonly KeyL: "KeyL";
	readonly KeyM: "KeyM";
	readonly KeyN: "KeyN";
	readonly KeyO: "KeyO";
	readonly KeyP: "KeyP";
	readonly KeyQ: "KeyQ";
	readonly KeyR: "KeyR";
	readonly KeyS: "KeyS";
	readonly KeyT: "KeyT";
	readonly KeyU: "KeyU";
	readonly KeyV: "KeyV";
	readonly KeyW: "KeyW";
	readonly KeyX: "KeyX";
	readonly KeyY: "KeyY";
	readonly KeyZ: "KeyZ";
	readonly Lang1: "Lang1";
	readonly Lang2: "Lang2";
	readonly MediaTrackNext: "MediaTrackNext";
	readonly MediaTrackPrevious: "MediaTrackPrevious";
	readonly MetaLeft: "MetaLeft";
	readonly MetaRight: "MetaRight";
	readonly Minus: "Minus";
	readonly NumLock: "NumLock";
	readonly Numpad0: "Numpad0";
	readonly Numpad1: "Numpad1";
	readonly Numpad2: "Numpad2";
	readonly Numpad3: "Numpad3";
	readonly Numpad4: "Numpad4";
	readonly Numpad5: "Numpad5";
	readonly Numpad6: "Numpad6";
	readonly Numpad7: "Numpad7";
	readonly Numpad8: "Numpad8";
	readonly Numpad9: "Numpad9";
	readonly NumpadAdd: "NumpadAdd";
	readonly NumpadComma: "NumpadComma";
	readonly NumpadDecimal: "NumpadDecimal";
	readonly NumpadDivide: "NumpadDivide";
	readonly NumpadMultiply: "NumpadMultiply";
	readonly NumpadSubtract: "NumpadSubtract";
	readonly OSLeft: "OSLeft";
	readonly Pause: "Pause";
	readonly Period: "Period";
	readonly Quote: "Quote";
	readonly ScrollLock: "ScrollLock";
	readonly Semicolon: "Semicolon";
	readonly ShiftLeft: "ShiftLeft";
	readonly ShiftRight: "ShiftRight";
	readonly Slash: "Slash";
	readonly Space: "Space";
	readonly Tab: "Tab";
	readonly VolumeDown: "VolumeDown";
	readonly VolumeMute: "VolumeMute";
	readonly VolumeUp: "VolumeUp";
	readonly WakeUp: "WakeUp";
};
export declare const KeyboardDevice: KeyboardDeviceInstance;
export declare const Navigate: Readonly<{
	Activate: "NavigateActivate";
	Back: "NavigateBack";
	Down: "NavigateDown";
	Left: "NavigateLeft";
	Right: "NavigateRight";
	Up: "NavigateUp";
}>;
/**
 * Responsible for global navigation interactions.
 *
 * Set stage to enable the global responder behaviors.
 */
export declare const UINavigation: NavigationManager;
/**
 * @returns all navigatable containers in some container
 */
export declare function getAllNavigatables(target: Container, navigatables?: NavigatableContainer[]): NavigatableContainer[];
export declare function getDistanceScore(a: Bounds, b: Bounds, weightX?: number, weightY?: number): number;
/**
 * @returns the first navigatable container in the given direction
 */
export declare function getFirstNavigatable(root: Container, options?: NavigatableQueryOptions): NavigatableContainer | undefined;
export declare function isChildOf(child: Container, root: Container): boolean;
export declare function isVisible(target: Container): boolean;
/**
 * Register the mixin for PIXI.Container.
 *
 * @param container A reference to `PIXI.Container`.
 */
export declare function registerPixiJSNavigationMixin<T = Container>(container: T): void;
/**
 * Augment this interface with anything. Values become binds.
 *
 * Keys are ignored but may be useful to categorize bindings.
 *
 * @example
 * declare module "pixijs-input-devices" {
 *     interface Binds {
 *         Gameplay:
 *             | "Crouch"
 *             | "Jump"
 *             | "Sprint";
 *
 *         General:
 *             | "Options"
 *             | "Pause";
 *     }
 * }
 */
export interface Binds {
}
export interface ContainerNavigateOptions {
	/** Container to navigate to on "NavigateLeft". */
	left?: Container | null;
	/** Container to navigate to on "NavigateRight". */
	right?: Container | null;
	/** Container to navigate to on "NavigateUp". */
	up?: Container | null;
	/** Container to navigate to on "NavigateDown". */
	down?: Container | null;
	/** Container to navigate to on "NavigateBack". */
	back?: Container | null;
	/** Container to navigate to on "NavigateActivate". */
	activate?: Container | null;
}
export interface CustomDevice {
	/**
	 * Device type.
	 *
	 * Set this to "custom".
	 */
	readonly type: "custom";
	/**
	 * Unique identifier for this device.
	 */
	readonly id: string;
	/**
	 * Arbitrary metadata stored against this device.
	 */
	readonly meta: DeviceMetadata;
	/**
	  * Timestamp when input was last modified.
	  *
	  * Set this to `now` during update() if the device is interacted with,
	  * and this will automatically become `InputDevice.lastInteractedDevice`.
	  */
	readonly lastInteraction: number;
	/** Triggered during the polling function. */
	update(now: number): void;
	/** @returns true when a bind was activated in the previous update(). */
	bindDown(name: string): boolean;
	/**
	 * Play a vibration effect (if device supports it).
	 */
	playHaptic(hapticEffect: HapticEffect): void;
	/**
	 * (Optional) Clear input.
	 *
	 * This method is triggered when the window is moved to background.
	 */
	clear?(): void;
}
export interface EventOptions {
	once?: boolean;
}
export interface GamepadAxisEvent {
	device: GamepadDevice;
	axis: Axis;
	axisCode: AxisCode;
	pressed: boolean;
	value: number;
}
export interface GamepadButtonEvent {
	device: GamepadDevice;
	button: Button;
	buttonCode: ButtonCode;
	pressed: boolean;
	value: 0 | 1;
}
export interface HapticEffect {
	/** How long the vibration lasts (in milliseconds) */
	duration: number;
	/** Strength of the low-frequency strong-magnitude motor (a deeper, heavier rumble) */
	rumble?: number;
	/** Strength of the high-frequency weak-magnitude motor (a lighter, buzzier vibration) */
	buzz?: number;
	/** Strength of the left trigger motor (on supported devices) */
	leftTrigger?: number;
	/** Strength of the right trigger motor (on supported devices) */
	rightTrigger?: number;
	/** Delay the start of the vibration effect (in milliseconds) */
	startDelay?: number;
}
export interface InputDeviceEvent {
	deviceadded: {
		device: Device;
	};
	deviceremoved: {
		device: Device;
	};
	lastdevicechanged: {
		device: Device;
	};
}
export interface KeyboardDeviceKeyEvent {
	event: KeyboardEvent;
	device: KeyboardDeviceInstance;
	keyCode: KeyCode;
	/** Layout-specific label for key. @example "Ц" // JCUKEN for "KeyW" */
	keyLabel: string;
}
export interface KeyboardDeviceLayoutUpdatedEvent {
	device: KeyboardDeviceInstance;
	layout: KeyboardLayout;
	layoutSource: KeyboardLayoutSource;
}
export interface KeyboardDeviceNamedBindKeyEvent extends KeyboardDeviceKeyEvent {
	name: NamedBind;
	pressed: boolean;
	value: 0 | 1;
	repeat: boolean;
}
export interface Metadata {
}
export interface NamedBindEvent<BindName extends NamedBind> {
	device: Device;
	name: BindName;
	pressed: boolean;
	/**
	 * Analog: 0 when inactive, [-1, 1] when active.
	 * Buttons: 0 when released, 1 when pressed.
	 */
	value: number;
}
export interface NavigatableQueryOptions {
	currentFocus?: Container;
	direction?: NavigateDirection;
	minimumDistance?: number;
}
/**
 * A target that responds to navigation on the stack.
 */
export interface NavigationResponder {
	/**
	 * Whether to auto-focus on the element with the highest priority when
	 * pushed onto the responder stack.
	 *
	 * @default true
	 */
	autoFocus?: boolean;
	/**
	 * Currently focused container.
	 */
	focusTarget?: Container;
	/**
	 * Called when received a navigation intent. The target should handle, and
	 * respond with a boolean indicating whether or not the intent was handled.
	 *
	 * Unhandled interaction intents will be bubbled up to the next target. You
	 * might return `true` here to prevent any intent from being propagated.
	 */
	handledNavigationIntent?(intent: NavigateBinds, device: Device): boolean;
	/**
	 * This method is triggered when the target became the first responder.
	 *
	 * Either when pushed, or when another target stopped being the first
	 * responder.
	 */
	becameFirstResponder?(): void;
	/**
	 * This method is triggered when the target stopped being first responder.
	 *
	 * Either popped, or another target was pushed on top of the stack.
	 */
	resignedAsFirstResponder?(): void;
}
export type Axis = (typeof Axis)[keyof typeof Axis];
export type AxisCode = typeof AxisCode[number];
export type Button = (typeof Button)[keyof typeof Button];
export type ButtonCode = typeof ButtonCode[number];
export type Device = GamepadDevice | typeof KeyboardDevice | CustomDevice;
export type DeviceMetadata = Record<string, any> | Partial<Metadata>;
export type FocusSource = "pointer" | "device";
export type GamepadButtonDownEvent = (gamepad: GamepadDevice, button: Button) => void;
/**
 * Bindable codes for button and joystick events.
 */
export type GamepadCode = ButtonCode | AxisCode;
export type GamepadDeviceEvent = {
	binddown: GamepadNamedBindEvent;
	bindup: GamepadNamedBindEvent;
} & {
	[axis in AxisCode]: GamepadAxisEvent;
} & {
	[button in ButtonCode]: GamepadButtonEvent;
};
/**
 * Common gamepad platform layouts, which may indicate button layout.
 *
 * Note: Non-comprehensive list, covers the most brands only.
 */
export type GamepadLayout = "amazon_luna" | "logitech_g" | "nintendo_joycon_l" | "nintendo_joycon_r" | "nintendo_switch_pro" | "nintendo_wiiu" | "nvidia_shield" | "playstation_4" | "playstation_5" | "steam_controller" | "xbox_360" | "xbox_one" | "xbox_series" | "unknown";
export type GamepadNamedBindEvent = {
	type: "button";
	device: GamepadDevice;
	name: NamedBind;
	pressed: boolean;
	value: 0 | 1;
	button: Button;
	buttonCode: ButtonCode;
} | {
	type: "axis";
	device: GamepadDevice;
	name: NamedBind;
	pressed: boolean;
	value: number;
	axis: Axis;
	axisCode: AxisCode;
};
export type KeyCode = (typeof KeyCode)[keyof typeof KeyCode];
export type KeyboardDeviceEvent = {
	layoutdetected: KeyboardDeviceLayoutUpdatedEvent;
	binddown: KeyboardDeviceNamedBindKeyEvent;
	bindup: KeyboardDeviceNamedBindKeyEvent;
} & {
	[key in KeyCode]: KeyboardDeviceKeyEvent;
};
export type KeyboardLayout = "QWERTY" | "AZERTY" | "JCUKEN" | "QWERTZ";
export type KeyboardLayoutSource = "browser" | "lang" | "keypress" | "manual";
export type NamedBind = NavigateBinds | Binds[keyof Binds];
export type NavigatableContainer = Container;
export type NavigateBinds = typeof Navigate[keyof typeof Navigate];
export type NavigateDirection = "NavigateLeft" | "NavigateRight" | "NavigateUp" | "NavigateDown";

export {};
