// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as PIXI from 'pixi.js';

/*
 * PixiJs Mixin:
 */

declare module 'pixi.js' {

  export interface Container {

    /**
     * @returns true when navigationMode is "target", or
     * navigationMode is "auto" and the container handles
     * either "pointerdown" or "mousedown" events.
     */
    readonly isNavigatable: boolean;

    /**
     * When selecting a default navigation focus target, the
     * target with the largest priority is chosen.
     * @default 0
     */
    readonly navigationPriority: number;

    /**
     * Whether this container is explicitly navigatable or not.
     */
    navigationMode?: "auto" | "target" | "disabled" | undefined;
  }

}

export {};
import { Container } from 'pixi.js';

declare class GamepadJoystick {
	private _owner;
	private ix;
	private iy;
	constructor(_owner: GamepadDeviceSource, ix: number, iy: number);
	/** A scalar -1.0 to 1.0 representing the X-axis position on the stick */
	get x(): number;
	/** A scalar -1.0 to 1.0 representing the Y-axis position on the stick */
	get y(): number;
}
declare class InputDeviceManager {
	static global: InputDeviceManager;
	readonly keyboard: KeyboardDevice;
	private readonly _emitter;
	/** Whether we are a mobile device (including tablets) */
	readonly isMobile: boolean;
	/** Whether a touchscreen is available */
	readonly isTouchCapable: boolean;
	/** Add an event listener */
	on<K extends keyof InputDeviceEvent>(event: K, listener: (event: InputDeviceEvent[K]) => void): this;
	/** Remove an event listener (or all if none provided) */
	off<K extends keyof InputDeviceEvent>(event: K, listener: (event: InputDeviceEvent[K]) => void): this;
	private hasFocus;
	/**
	 * Connected gamepads accessible by index.
	 *
	 * Keep in mind these inputs are only up-to-date from the last update().
	 */
	get gamepads(): readonly GamepadDevice[];
	/**
	 * Connected devices.
	 *
	 * Keep in mind these inputs may only be up-to-date from the last update().
	 */
	get devices(): readonly Device[];
	options: {
		clearInputInBackground: boolean;
	};
	private _devices;
	private _gamepadDevices;
	private _gamepadDeviceMap;
	private constructor();
	/**
	 * Performs a poll of latest input from all devices
	 */
	update(): ReadonlyArray<Device>;
	/** Add a custom device. */
	add(device: CustomDevice): void;
	/** Remove a custom device. */
	remove(device: Device): void;
	/**
	 * @returns updates connected gamepads, performing a poll of latest input
	 */
	pollGamepads(now: number): ReadonlyArray<GamepadDevice>;
	private removeGamepad;
}
declare class NavigationManager {
	static global: NavigationManager;
	/**
	 * Set the stage root to automatically handle global
	 * navigation intents.
	 */
	stage?: Container;
	/**
	 * When enabled, if no pointover/mouseover listeners
	 * exist, a default effect will be used instead.
	 */
	fallbackEffects: boolean;
	private _focused?;
	private _responderStack;
	private constructor();
	/**
	 * Active global interaction target
	 */
	get firstResponder(): NavigationResponder | undefined;
	/**
	 * Stack of global interaction targets
	 */
	get responders(): readonly NavigationResponder[];
	/**
	 * Emit interaction intent to the first responder,
	 * or the global responder if none.
	 */
	commit(intent: NavigationIntent, device: Device): void;
	/**
	 * Remove the top-most global interaction target
	 */
	popResponder(): NavigationResponder | undefined;
	/**
	 * Set the new top-most global interaction target.
	 */
	pushResponder(responder: NavigationResponder): void;
	private _propagateIntent;
	private _handleGlobalIntent;
	private _emitBlur;
	private _emitFocus;
	private _emitTrigger;
}
declare const ButtonCode: readonly [
	"A",
	"B",
	"X",
	"Y",
	"LeftShoulder",
	"RightShoulder",
	"LeftTrigger",
	"RightTrigger",
	"Back",
	"Start",
	"LeftStick",
	"RightStick",
	"DPadUp",
	"DPadDown",
	"DPadLeft",
	"DPadRight"
];
export declare abstract class CustomDevice {
	readonly id: string;
	readonly type = "custom";
	/**
	 * Associate custom meta data with a device.
	 */
	readonly meta: Record<string, any>;
	lastUpdated: number;
	constructor(id: string);
	/**
	 * (Optional) Clear input.
	 *
	 * This method is triggered when the window is
	 * moved to background.
	 */
	clear(): void;
	/**
	 * Triggered during the polling function.
	 */
	abstract update(now: number): void;
}
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
	static defaultOptions: {
		/**
		 * When set to `"physical"` _(default)_, ABXY refer to the equivalent
		 * positions on a standard layout controller.
		 *
		 * When set to `"accurate"`, ABXY refer to the ABXY buttons on a Nintendo
		 * controller.
		 *
		 * When set to `"none"`, ABXY refer to the unmapped buttons in the 0, 1,
		 * 2, and 3 positions respectively.
		 */
		remapNintendoMode: RemapNintendoMode;
		navigation: {
			enabled: boolean;
			binds: Partial<Record<Button, NavigationIntent>>;
		};
		intent: {
			joystickCommitSensitivity: number;
			firstCooldownMs: number;
			defaultCooldownMs: number;
		};
		vibration: {
			enabled: boolean;
			intensity: number;
		};
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
	readonly meta: Record<string, any>;
	lastUpdated: number;
	/**
	 * Platform of this gamepad, useful for configuring standard
	 * button layouts or displaying branded icons.
	 * @example "playstation"
	 */
	layout: GamepadLayout;
	options: typeof GamepadDevice.defaultOptions;
	private _btnPrevState;
	private _axisIntents;
	private readonly _throttleIdLeftStickX;
	private readonly _throttleIdLeftStickY;
	private readonly _emitter;
	readonly leftJoystick: GamepadJoystick;
	readonly rightJoystick: GamepadJoystick;
	/** A scalar 0.0 to 1.0 representing the trigger pull */
	get leftTrigger(): number;
	/** A scalar 0.0 to 1.0 representing the trigger pull */
	get rightTrigger(): number;
	/** A scalar 0.0 to 1.0 representing the trigger pull */
	get leftShoulder(): number;
	/** A scalar 0.0 to 1.0 representing the trigger pull */
	get rightShoulder(): number;
	/** Add an event listener */
	on<K extends keyof GamepadDeviceEvent>(event: K, listener: (event: GamepadDeviceEvent[K]) => void): this;
	/** Remove an event listener (or all if none provided). */
	off<K extends keyof GamepadDeviceEvent>(event: K, listener?: (event: GamepadDeviceEvent[K]) => void): this;
	/** Accessors for buttons */
	button: Record<ButtonCode, boolean>;
	/**
	 * Play a vibration effect (if supported).
	 *
	 * This API only works in browsers that support it.
	 * @see https://caniuse.com/mdn-api_gamepad_vibrationactuator
	 */
	playVibration({ duration, weakMagnitude, strongMagnitude, vibrationType, rightTrigger, leftTrigger, startDelay, }?: GamepadVibration): void;
	update(source: Gamepad, now: number): void;
	clear(): void;
	constructor(source: Gamepad);
	private updatePresses;
}
export declare class KeyboardDevice {
	static global: KeyboardDevice;
	readonly type = "keyboard";
	readonly id = "keyboard";
	/**
	 * Associate custom meta data with a device.
	 */
	readonly meta: Record<string, any>;
	lastUpdated: number;
	/**
	 * Detect layout from keypresses.
	 *
	 * This will continuously check "keydown" events until the
	 * layout can be determined.
	 */
	detectLayoutOnKeypress: boolean;
	/**
	 * Keyboard has been detected.
	 */
	detected: boolean;
	private _layout;
	private _layoutSource;
	private _emitter;
	/** Add an event listener. */
	on<K extends keyof KeyboardDeviceEvent>(event: K, listener: (event: KeyboardDeviceEvent[K]) => void): this;
	/** Remove an event listener (or all if none provided). */
	off<K extends keyof KeyboardDeviceEvent>(event: K, listener: (event: KeyboardDeviceEvent[K]) => void): this;
	options: {
		/**
		 * Keys to prevent default event propagation for.
		 */
		preventDefaultKeys: Set<KeyCode>;
		navigation: {
			enabled: boolean;
			binds: Partial<Record<KeyCode, NavigationIntent>>;
		};
	};
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
	private configureEventListeners;
	/** Accessors for keys */
	key: Record<KeyCode, boolean>;
	/**
	 * Get the label for the given key code in the current keyboard layout.
	 *
	 * @example
	 * // when AZERTY
	 * keyboard.localeLabel( "KeyQ" ) // "A"
	 *
	 * // when JCUKEN
	 * keyboard.localeLabel( "KeyQ" ) // "Й"
	 */
	keyLabel(key: KeyCode, layout?: KeyboardLayout): string;
	/**
	 * Clear all keyboard keys.
	 */
	clear(): void;
}
export declare const Button: {
	/** A Button (Xbox / Nintendo: "A", PlayStation: "Cross") */
	readonly A: 0;
	/** B Button (Xbox: "B", PlayStation: "Circle", Nintendo: "X") */
	readonly B: 1;
	/** X Button (Xbox: "X", PlayStation: "Square", Nintendo: "B") */
	readonly X: 2;
	/** Y Button (Xbox / Nintendo: "Y", PlayStation: "Triangle") */
	readonly Y: 3;
	/** Left Shoulder Button (Xbox: "LB", PlayStation: "L1", Nintendo: "L") */
	readonly LeftShoulder: 4;
	/** Right Shoulder Button (Xbox: "RB", PlayStation: "R1", Nintendo: "R") */
	readonly RightShoulder: 5;
	/** Left Trigger (Xbox: "LT", PlayStation: "L2", Nintendo: "ZL") */
	readonly LeftTrigger: 6;
	/** Right Trigger (Xbox: "RT", PlayStation: "R2", Nintendo: "ZR") */
	readonly RightTrigger: 7;
	/** Back Button (Xbox: "Back", PlayStation: "Share", Nintendo: "Minus") */
	readonly Back: 8;
	/** Start Button (Xbox: "Start", PlayStation: "Options", Nintendo: "Plus") */
	readonly Start: 9;
	/** Left Stick Press (Xbox / PlayStation: "LS", Nintendo: "L3") */
	readonly LeftStick: 10;
	/** Right Stick Press (Xbox / PlayStation: "RS", Nintendo: "R3") */
	readonly RightStick: 11;
	/** D-Pad Up */
	readonly DPadUp: 12;
	/** D-Pad Down */
	readonly DPadDown: 13;
	/** D-Pad Left */
	readonly DPadLeft: 14;
	/** D-Pad Right */
	readonly DPadRight: 15;
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
/**
 * Responsible for global navigation interactions.
 *
 * Set stage to enable the global responder behaviors.
 */
export declare const Navigation: NavigationManager;
/**
 * @returns all navigatable containers in some container
 */
export declare function getAllNavigatables(target: Container, navigatables?: NavigatableContainer[]): NavigatableContainer[];
/**
 * @returns the first navigatable container in the given direction
 */
export declare function getFirstNavigatable(root: Container, currentFocus?: Container, nearestDirection?: NavigationDirection, { minimumDistance, }?: {
	minimumDistance?: number;
}): NavigatableContainer | undefined;
/**
 * Register the mixin for PIXI.Container.
 *
 * @param container A reference to `PIXI.Container`.
 */
export declare function registerPixiJSInputDeviceMixin(container: any): void;
export interface GamepadButtonPressEvent {
	device: GamepadDevice;
	button: Button;
	buttonCode: ButtonCode;
}
export interface InputDeviceEvent {
	deviceadded: {
		device: Device;
	};
	deviceremoved: {
		device: Device;
	};
}
export interface KeyboardDeviceKeydownEvent {
	event: KeyboardEvent;
	device: KeyboardDevice;
	keyCode: KeyCode;
	/** Layout-specific label for key. @example "Ц" // JCUKEN for "KeyW" */
	keyLabel: string;
}
export interface KeyboardDeviceLayoutUpdatedEvent {
	device: KeyboardDevice;
	layout: KeyboardLayout;
	layoutSource: KeyboardLayoutSource;
}
/**
 * A target that responds to navigation on the stack.
 */
export interface NavigationResponder {
	/**
	 * Called when received a navigation intent. The target should handle, and
	 * respond with a boolean indicating whether or not the intent was handled.
	 *
	 * Unhandled interaction intents will be bubbled up to the next target. You
	 * might return `true` here to prevent any intent from being propagated.
	 */
	handledNavigationIntent?(intent: NavigationIntent, device: Device): boolean;
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
export type Button = (typeof Button)[keyof typeof Button];
export type ButtonCode = typeof ButtonCode[number];
export type Device = GamepadDevice | KeyboardDevice | CustomDevice;
export type GamepadButtonDownEvent = (gamepad: GamepadDevice, button: Button) => void;
export type GamepadDeviceEvent = {} & {
	[button in ButtonCode]: GamepadButtonPressEvent;
} & {
	[button in Button]: GamepadButtonPressEvent;
};
export type GamepadDeviceSource = {
	source: Gamepad;
};
export type GamepadVibration = GamepadEffectParameters & {
	vibrationType?: GamepadHapticEffectType;
};
export type KeyCode = (typeof KeyCode)[keyof typeof KeyCode];
export type KeyboardDeviceEvent = {
	layoutdetected: KeyboardDeviceLayoutUpdatedEvent;
} & {
	[key in KeyCode]: KeyboardDeviceKeydownEvent;
};
export type KeyboardLayout = "QWERTY" | "AZERTY" | "JCUKEN" | "QWERTZ";
export type KeyboardLayoutSource = "browser" | "lang" | "keypress" | "manual";
export type NavigatableContainer = Container;
export type NavigationDirection = "navigateLeft" | "navigateRight" | "navigateUp" | "navigateDown";
export type NavigationIntent = "navigateBack" | "navigateDown" | "navigateLeft" | "navigateRight" | "navigateUp" | "trigger";
export type NavigationTargetEvent = "focus" | "blur";
export type RemapNintendoMode = "none" | "accurate" | "physical";
/**
 * Common gamepad platform layouts, which may indicate button layout.
 *
 * Note: Non-comprehensive list, covers the most brands only.
 */
type GamepadLayout = "logitech" | "nintendo" | "playstation" | "steam" | "xbox" | "generic";

export {
	GamepadLayout as GamepadPlatform,
};

export {};
