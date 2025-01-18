# 🕹️ pixijs-input-devices &nbsp;[![License](https://badgen.net/npm/license/pixijs-input-devices)](https://github.com/reececomo/pixijs-input-devices/blob/main/LICENSE) [![Tests](https://github.com/reececomo/pixijs-input-devices/actions/workflows/tests.yml/badge.svg)](https://github.com/reececomo/pixijs-input-devices/actions/workflows/tests.yml) [![Downloads per month](https://img.shields.io/npm/dm/pixijs-input-devices.svg)](https://www.npmjs.com/package/pixijs-input-devices) [![NPM version](https://img.shields.io/npm/v/pixijs-input-devices.svg)](https://www.npmjs.com/package/pixijs-input-devices)

⚡ Powerful, high-performance input device management for PixiJS

| | |
| ------ | ------ |
| 🎮 Handles [keyboards](#keyboarddevice), [gamepads](#gamepaddevice), and [more](#custom-devices)! | 🚀 Flexible [low-level](#real-time) and [event-driven](#keyboarddevice-events) APIs |
| 🔮 Resolves browser API inconsistencies <sup>[[1]](https://caniuse.com/mdn-api_keyboardlayoutmap) [[2]](https://caniuse.com/mdn-api_gamepad_vibrationactuator) [[3]](https://chromestatus.com/feature/5989275208253440)</sup> | 🧭 Seamless [navigation](#navigation-api) for pointer/mouse based UIs |
| 📱 Powerful configuration options, sensible defaults | 🌐 Automatic i18n (built-in [internationalization](#keyboard-layout---detection)) |
| ⚡ Optimized for speed (best-in-class [INP performance](https://web.dev/articles/inp)) | 🔀 Named binds (for [user-configurable inputs](#named-binds)) |
| 🍃 Zero dependencies & tree-shakeable | ✨ Supports PixiJS v8, v7, v6.3+ |


## Sample Usage

*Handle device inputs with ease.*

```ts
import { InputDevice } from "pixijs-input-devices";

// Iterative
let jump = false

for (const device of InputDevice.devices) {
  if (device.type === "keyboard" && device.key.Space) jump = true
  if (device.type === "gamepad" && device.button.A) jump = true
}

// Event-driven
const gamepad = InputDevice.gamepads[0]

gamepad?.on("LeftShoulder", (e) => {
    e.device.playVibration({ duration: 100 })
});
```

## Getting Started with PixiJS Input Devices

*Everything you need to quickly integrate powerful device management.*

**PixiJS Input Devices** adds first-class support for input device management and input handling. It also provides an optional navigation manager
that can enable input devices to traverse pointer-based UIs.

The core concepts are:

1. **Devices:** _Any human interface device_
2. **Binds:** _Custom, named input actions that can be triggered by assigned keys or buttons_
3. **Navigation:** _A global controller that allows non-pointer devices to navigate UIs_

> [!NOTE]
> _See [Navigation API](#navigation-api) for more information._


## Installation

*Quick start guide.*

**1.** Install the latest `pixijs-input-devices` package:

```sh
# npm
npm install pixijs-input-devices -D

# yarn
yarn add pixijs-input-devices --dev
```

**2.** Register the update loop:

```ts
import * as PIXI from 'pixi.js';
import { InputDevice } from 'pixijs-input-devices';

// register `InputDevice.update()` with shared ticker
Ticker.shared.add(ticker => InputDevice.update());
```

> [!TIP]
> **Input polling:** In the context of a video game, you may want to put the input update at the start of your game event loop insteaad

> [!NOTE]
> _If not using a PixiJS ticker, then just put `Action.tick(elapsedMs)` in the appropriate equivalent place (i.e. your `requestAnimationFrame()` render loop)._

**3.** (Optional) enable the Navigation API

```ts
import * as PIXI from 'pixi.js';
import { Navigation, registerPixiJSInputDevicesMixin } from 'pixijs-input-devices';

// register container mixin
registerPixiJSInputDevicesMixin(PIXI.Container);

const app = new PIXI.Application(/*…*/)

// set the root view for device navigation
Navigation.stage = app.stage
```

✨ You are now ready to use inputs!

## Features

### InputDevice Manager

The `InputDevice` singleton controls all device discovery.

```ts
InputDevice.keyboard  // KeyboardDevice
InputDevice.gamepads  // Array<GamepadDevice>
InputDevice.custom    // Array<CustomDevice>
```

You can access all **active/connected** devices using `.devices`:

```ts
for ( const device of InputDevice.devices ) {  // …
```

#### InputDevice - properties

| Property | Type | Description |
|---|---|---|
| `InputDevice.isMobile` | `boolean` | Whether the context is mobile (including tablets). |
| `InputDevice.isTouchCapable` | `boolean` | Whether the context has touchscreen capability. |
| `InputDevice.lastInteractedDevice` | `Device?` | The most recently interacted device (or first if multiple). |
| `InputDevice.devices` | `Device[]` | All active, connected devices. |
| `InputDevice.keyboard` | `KeyboardDevice` | The global keyboard. |
| `InputDevice.gamepads` | `GamepadDevice[]` | Connected gamepads. |
| `InputDevice.custom` | `CustomDevice[]` | Custom devices. |

#### InputDevice - on() Events

Access global events directly through the manager:

```ts
InputDevice.on( "deviceadded", ({ device }) => {
    // a device was connected
    // do additional setup here, show a dialog, etc.
})

InputDevice.off( "deviceadded" ) // stop listening
```

| Event | Description | Payload |
|---|---|---|
| `"deviceadded"` | `{device}` | A device has been added. |
| `"deviceremoved"` | `{device}` | A device has been removed. |


### KeyboardDevice

Unlike gamepads & custom devices, there is a single global keyboard device.

```ts
let keyboard = InputDevice.keyboard

if ( keyboard.key.ControlLeft ) {  // …
```

> [!NOTE]
> **Detection:** On mobiles/tablets the keyboard will not appear in `InputDevice.devices` until
> a keyboard is detected. See `keyboard.detected`.

#### Keyboard Layout - detection

```ts
keyboard.layout  // "AZERTY" | "JCUKEN" | "QWERTY" | "QWERTZ"

keyboard.getKeyLabel( "KeyZ" )  // Я
```

> [!NOTE]
> **Layout support:** Detects the **"big four"** (AZERTY, JCUKEN, QWERTY and QWERTZ).
> Almost every keyboard is one of these four (or a regional derivative &ndash; e.g. Hangeul,
> Kana). There is no built-in detection for specialist or esoteric layouts (e.g. Dvorak, Colemak, BÉPO).
>
> The `keyboard.getKeyLabel( key )` uses the [KeyboardLayoutMap API](https://caniuse.com/mdn-api_keyboardlayoutmap)
> when available, before falling back to default AZERTY, JCUKEN, QWERTY or QWERTZ key values.

The keyboard layout is automatically detected from (in order):

1. Browser API <sup>[(browser support)](https://caniuse.com/mdn-api_keyboardlayoutmap)</sup>
2. Keypresses
3. Browser Language

You can also manually force the layout:

```ts
// force layout
InputDevice.keyboard.layout = "JCUKEN"

InputDevice.keyboard.getKeyLabel( "KeyW" )  // "Ц"
InputDevice.keyboard.layoutSource  // "manual"
```

#### KeyboardDevice Events

| Event | Description | Payload |
|---|---|---|
| `"layoutdetected"` | `{layout,layoutSource,device}` | The keyboard layout (`"QWERTY"`, `"QWERTZ"`, `"AZERTY"`, or `"JCUKEN"`) has been detected, either from the native API or from keypresses. |
| `"bind"` | `{name,event,keyCode,keyLabel,device}` | A **named bind** key was pressed. |
| **Key presses:** | | |
| `"KeyA"` | `{event,keyCode,keyLabel,device}` | The `"KeyA"` was pressed. |
| `"KeyB"` | `{event,keyCode,keyLabel,device}` | The `"KeyB"` was pressed. |
| `"KeyC"` | `{event,keyCode,keyLabel,device}` | The `"KeyC"` was pressed. |
| … | … | … |


### GamepadDevice

Gamepads are automatically detected via the browser API when first interacted with <sup>[(read more)](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API)</sup>.

Gamepad accessors are modelled around the "Standard Controller Layout":

```ts
let gamepad = InputDevice.gamepads[0]

if ( gamepad.button.Start ) {  // …
if ( gamepad.leftTrigger > 0.25 ) {  // …
if ( gamepad.leftJoystick.x > 0.5 ) {  // …
```

> [!TIP]
> **Special requirements?** You can always access `gamepad.source` and reference the
> underlying API directly as needed.

#### Vibration & Haptics

Use the `playVibration()` method to play a haptic vibration, in supported browsers.

```ts
gamepad.playVibration({
    duration: 150,
    weakMagnitude: 0.75,
    strongMagnitude: 0.25,
    // …
})
```

#### Gamepad Button Codes

The gamepad buttons reference **Standard Controller Layout**:

| Button # | ButtonCode | Standard | Nintendo* | Playstation | Xbox |
|:---:|:---:|:---:|:---:|:---:|:---:|
| `0` | `"A"` | **A** | A | Cross | A |
| `1` | `"B"` | **B** | X | Circle | B |
| `2` | `"X"` | **X** | B | Square | X |
| `3` | `"Y"` | **Y** | Y | Triangle | Y |
| `4` | `"LeftShoulder"` | **Left Shoulder** | L | L1 | LB |
| `5` | `"RightShoulder"` | **Right Shoulder** | R | R1 | RB |
| `6` | `"LeftTrigger"` | **Left Trigger** | L2 | ZL | LT |
| `7` | `"RightTrigger"` | **Right Trigger** | R2 | ZR | RT |
| `8` | `"Back"` | **Back** | Minus | Options | Back |
| `9` | `"Start"` | **Start** | Plus | Select | Start |
| `10` | `"LeftStick"` | **Left Stick (click)** | L3 | L3 | LSB |
| `11` | `"RightStick"` | **Right Stick (click)** | R3 | R3 | RSB |
| `12` | `"DPadUp"` | **D-Pad Up** | ⬆️ | ⬆️ | ⬆️ |
| `13` | `"DPadDown"` | **D-Pad Down** | ⬇️ | ⬇️ | ⬇️ |
| `14` | `"DPadLeft"` | **D-Pad Left** |  ⬅️ | ⬅️ | ⬅️ |
| `15` | `"DPadRight"` | **D-Pad Right** | ➡️ | ➡️ | ➡️ |

*See [Nintendo Layout Remapping](#gamepad---nintendo-layout-remapping) for more context

#### Gamepad Layouts

```ts
gamepad.layout  // "nintendo" | "xbox" | "playstation" | "logitech" | "steam" | "generic"
```

Layout detection is **highly non-standard** across major browsers, it should generally be used for aesthetic
improvements (e.g. showing [device-specific icons](https://thoseawesomeguys.com/prompts/)).

There is some limited layout remapping support built-in for Nintendo controllers, which appear to be the
only major brand controller that deviates from the standard.

##### Gamepad - Nintendo Layout Remapping

> [!CAUTION]
> ***Nintendo:** Both the labels and physical positions of the A,B,X,Y buttons are different
> on Nintendo controllers.
>
> Set `GamepadDevice.defaultOptions.remapNintendoMode` to apply the remapping as required.
>
> - `"physical"` _**(default)**_ &ndash; The A,B,X,Y button codes will refer the physical layout of a standard controller (Left=X, Top=Y, Bottom=A, Right=B).
> - `"accurate"` &ndash; The A,B,X,Y button codes will correspond to the exact Nintendo labels (Left=Y, Top=X, Bottom=B, Right=A).
> - `"none"` &ndash; The A,B,X,Y button codes mapping stay at the default indices (Left=Y, Top=B, Bottom=X, Right=A).
>
> ```
> standard       nintendo        nintendo       nintendo
>  layout       "physical"      "accurate"       "none"
> reference      (default)
> 
>     Y             Y              X               B
>   X   B         X   B          Y   A           Y   A
>     A             A              B               X
>
>     3             3              2               1
>   2   1         2   1          3   0           3   0
>     0             0              1               2
> ```

You can manually override this per-gamepad, or for all gamepads:

```ts
gamepad.options.remapNintendoMode = "none"
GamepadDevice.defaultOptions.remapNintendoMode = "none"
```

#### GamepadDevice Events

| Event | Description | Payload |
|---|---|---|
| `"bind"` | `{name,button,buttonCode,device}` | A **named bind** button was pressed. |
| **Button presses:** | | |
| `"A"` | `{button,buttonCode,device}` | Standard layout button `"A"` was pressed. Equivalent to `0`. |
| `"B"` | `{button,buttonCode,device}` | Standard layout button `"B"` was pressed. Equivalent to `1`. |
| `"X"` | `{button,buttonCode,device}` | Standard layout button `"X"` was pressed. Equivalent to `2`. |
| … | … | … |
| **Button presses (no label):** | | |
| `0` or `Button.A` | `{button,buttonCode,device}` | Button at offset `0` was pressed. |
| `1` or `Button.B` | `{button,buttonCode,device}` | Button at offset `1` was pressed. |
| `2` or `Button.X` | `{button,buttonCode,device}` | Button at offset `2` was pressed. |
| … | … | … |

### Custom Devices

You can add custom devices to the device manager so it will be polled togehter and included in `InputDevice.devices`.

```ts
import { type CustomDevice, InputDevice } from "pixijs-input-devices"

export const myDevice: CustomDevice = {
    id: "on-screen-buttons",
    type: "custom",
    meta: {},
    
    update: ( now: number ) => {
        // polling update
    }
}

InputDevice.add( myDevice )
```

## Named Binds

Use _named binds_ to create mappings between abstract inputs and the keys/buttons that trigger those inputs.

This allows you to change the keys/buttons later (e.g. allow users to override inputs).

```ts
// keyboard:
InputDevice.keyboard.options.binds = {
    jump: [ "ArrowUp", "Space", "KeyW" ],
    crouch: [ "ArrowDown", "KeyS" ],
    toggleGraphics: [ "KeyB" ],
}

// all gamepads:
GamepadDevice.defaultOptions.binds = {
    jump: [ "A" ],
    crouch: [ "B", "X", "RightTrigger" ],
    toggleGraphics: [ "RightStick" ],
}
```

These can then be used with either the real-time and event-based APIs.

#### Event-based:

```ts
// listen to all devices:
InputDevice.onBind( "toggleGraphics", ( e ) => toggleGraphics() )

// listen to specific devices:
InputDevice.keyboard.onBind( "jump", ( e ) => doJump() )
InputDevice.gamepads[0].onBind( "jump", ( e ) => doJump() )
```

#### Real-time:

```ts
let jump = false, crouch = false, moveX = 0

const keyboard = InputDevice.keyboard
if ( keyboard.bindPressed( "jump" ) ) jump = true
if ( keyboard.bindPressed( "crouch" ) ) crouch = true
if ( keyboard.key.ArrowLeft ) moveX = -1
else if ( keyboard.key.ArrowRight ) moveX = 1

for ( const gamepad of InputDevice.gamepads ) {
    if ( gamepad.bindPressed( "jump" ) ) jump = true
    if ( gamepad.bindPressed( "crouch" ) ) crouch = true

    // gamepads have additional analog inputs
    // we're going to apply these only if touched
    if ( gamepad.leftJoystick.x != 0 ) moveX = gamepad.leftJoystick.x
    if ( gamepad.leftTrigger > 0 ) moveX *= ( 1 - gamepad.leftTrigger )
}
```

## Navigation API

_Traverse a UI using input devices._

The Navigation API is centered around a central **Navigation** controller, which listens to navigation intents from devices,
then handles the intent.

The **Navigation** controller maintains a stack of `NavigationResponder` objects, which represent the **current navigation context**. For
example, you might add a `NavigationResponder` for a drop-down UI. A normal `Container` can be used as a `NavigationResponder`, and any
container on the stack will become the **current root container**.

> [!NOTE]
> The **current root container** is the top-most `Container` on the navigation responder stack, or otherwise `Navigation.stage`.

When a device sends a navigation intent, the **Navigation** controller is responsible for asking each of the responders on the stack
if it can handle the intent. If it can't, it is propagated up all the way to the **current root container**.

### Default UI Navigation Behavior

When a navigation intent is **not** handled manually by a responder, it is handled in one of the following ways:

| Intent | Behavior |
|---|---|
|`"navigateBack"`|<ul><li>No action.</li></ul>|
|`"navigateLeft"`, `"navigateRight"`, `"navigateUp"`, `"navigateDown"`|<ul><li>Looks for the nearest `Container` where `container.isNavigatable` in the direction given, and if found, fires a `"focus"` event on it.</li><li>Additionally, if the newly focused container has registered an event handler for either `"pointerover"` or `"mouseover"` (in that order), it will fire that too.</li><li>If we were previously focused on a container, that previous container fires a `"blur"` event.</li><li>If the blurred container has register an event handler for either `"pointerout"` or `"mouseout"` (in that order), that event handler will be fired too.</li></ul>|
|`"trigger"`|<ul><li>Checks if we are currently focused on a container, and then issue a `"trigger"` event.</li><li>If the focused container has registered an event handler for either `"pointerdown"` or `"mousedown"` (in that order), that event handler will be fired too.</li></ul>|

Container event  | Description | Equivalent
-----------------|--------------------------------------------------------
`trigger`        | Target was triggered. | `"pointerdown"`, `"mousedown"`
`focus`          | Target became focused. | `"pointerover"`, `"mouseover"`
`blur`           | Target lost focus. | `"pointerout"`, `"mouseout"`

### Container Navigation

Containers are extended with a few properties/accesors:

Container properties | type | default | description
---------------------|------|---------|--------------
`isNavigatable`      | `get(): boolean` | `false` | returns `true` if `navigationMode` is set to `"target"`, or is `"auto"` and a `"pointerdown"` or `"mousedown"` event handler is registered.
`navigationMode`     | `"auto"` \| `"disabled"` \| `"target"` | `"auto"` | When set to `"auto"`, a `Container` can be navigated to if it has a `"pointerdown"` or `"mousedown"` event handler registered.
`navigationPriority` | `number` | `0` | The priority relative to other navigation items in this group.

> [!NOTE]
> **isNavigatable:** By default, any element with `"pointerdown"` or `"mousedown"` handlers is navigatable.

> [!WARNING]
> **Fallback Hover Effect:** If there is no `"pointerover"` or `"mouseover"` handler detected on a container, `Navigation`
>  will apply abasic alpha effect to the selected item to indicate which container is currently the navigation target. This
> can be disabled by setting `Navigation.options.useFallbackHoverEffect` to `false`.


### Disable Navigation

You can **disable** the navigation API entirely, either permanently or temporaril):

```ts
Navigation.options.enabled = false
```


## Advanced usage

### Local Player Assignment

Use the `<device>.meta` property to set assorted meta data on devices as needed.

You lose TypeScript's nice strong types, but its very handy for things like user assignment in multiplayer games.

```ts
InputDevice.on("deviceconnected", ({ device }) =>
    // assign!
    device.meta.localPlayerId = 123
)

for ( const device of InputDevice.devices )
{
    if ( device.meta.localPlayerId === 123 )
    {
        // use assigned input device!
    }
}
```

### On-Screen Inputs

You can easily map an on-screen input device using the `CustomDevice` interface.

```ts
export class OnScreenInputContainer extends Container implements CustomDevice {
    id = "onscreen";
    type = "custom" as const;
    meta: Record<string, any> = {};

    inputs = {
        moveX: 0.0
        jump: false,
    }

    update( now )
    {
        this.moveX = this._virtualJoystick.x
        this.jump = this._jumpButton.isTouching()
    }
}

const onscreen = new OnScreenInputContainer();

InputDevice.add( onscreen )
InputDevice.remove( onscreen )
```

### Two Users; One Keyboard

You could set up multiple named inputs:

```ts
InputDevice.keyboard.options.binds = {
    jump: [ "ArrowUp", "KeyW" ],
    defend: [ "ArrowDown", "KeyS" ],
    left: [ "ArrowLeft", "KeyA" ],
    right: [ "ArrowRight", "KeyD" ],

    p1_jump: [ "KeyW" ],
    p1_defend: [ "KeyS" ],
    p1_left: [ "KeyA" ],
    p1_right: [ "KeyD" ],

    p2_jump: [ "ArrowUp" ],
    p2_defend: [ "ArrowDown" ],
    p2_left: [ "ArrowLeft" ],
    p2_right: [ "ArrowRight" ],
}
```

and then switch groups depending on the mode:

```ts
if ( gameMode === "multiplayer" )
{
    player1.jump   = device.bindPressed( "p1_jump" )
    player1.defend = device.bindPressed( "p1_defend" )
    player1.moveX += device.bindPressed( "p1_left" ) ? -1 : 0
    player1.moveX += device.bindPressed( "p1_right" ) ? 1 : 0

    player2.jump   = device.bindPressed( "p2_jump" )
    player2.defend = device.bindPressed( "p2_defend" )
    player2.moveX += device.bindPressed( "p2_left" ) ? -1 : 0
    player2.moveX += device.bindPressed( "p2_right" ) ? 1 : 0
}
else
{
    player1.jump   = device.bindPressed( "jump" )
    player1.defend = device.bindPressed( "defend" )
    player1.moveX += device.bindPressed( "left" ) ? -1 : 0
    player1.moveX += device.bindPressed( "right" ) ? 1 : 0

    updateComputerPlayerInput( player2 )
}
```
