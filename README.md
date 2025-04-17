# 🎮 PixiJS Input Devices &nbsp;[![License](https://badgen.net/npm/license/pixijs-input-devices)](https://github.com/reececomo/pixijs-input-devices/blob/main/LICENSE) [![Tests](https://github.com/reececomo/pixijs-input-devices/actions/workflows/tests.yml/badge.svg)](https://github.com/reececomo/pixijs-input-devices/actions/workflows/tests.yml) [![Downloads per month](https://img.shields.io/npm/dm/pixijs-input-devices.svg)](https://www.npmjs.com/package/pixijs-input-devices) [![NPM version](https://img.shields.io/npm/v/pixijs-input-devices.svg)](https://www.npmjs.com/package/pixijs-input-devices)

⚡ Simple keyboard & gamepad management for PixiJS

| | |
| ------ | ------ |
| 🎮 Handle [keyboard](#keyboarddevice), [gamepads](#gamepaddevice), and [more](#custom-devices)! | 🚀 [Real-time](#real-time) &amp; [event-driven](#keyboarddevice-events) APIs |
| ⚡ Highly-optimized for [performance](https://web.dev/articles/inp) | 🧭 Built-in [UI navigation](#uinavigation-api) |
| 🔮 Highly configurable (with sensible defaults) | 🪄 Supports [input binding](#named-binds) |
| ✅ Cross-platform &amp; mobile-friendly <sup>[[1]](https://caniuse.com/mdn-api_keyboardlayoutmap) [[2]](https://caniuse.com/mdn-api_gamepad_vibrationactuator) [[3]](https://chromestatus.com/feature/5989275208253440)</sup>  | 🌐 Automatic [Intl layouts](#keyboard-layout---detection) detection |
| 🍃 Zero dependencies & tree-shakeable | ✨ Supports PixiJS v8, v7, v6.3+ |


## Sample Usage

*Handle device inputs with ease.*

```ts
import { InputDevice, GamepadDevice } from "pixijs-input-devices"


// Set named binds
GamepadDevice.configureDefaultBinds({
    jump: [ "Face1" ]
})
InputDevice.keyboard.configureBinds({
    jump: [ "ArrowUp", "Space" ]
})

// Use binds
for (const device of InputDevice.devices) {
    if (device.bindDown("jump")) // ...
}

// Event-driven
InputDevice.onBindDown("jump", ({ device }) => {
    // play a haptic on supported devices
    device.playHaptic({
        duration: 50,
        strongMagnitude: 0.5,
    })
})
```

## Getting Started with PixiJS Input Devices

*Everything you need to quickly integrate device management.*

**PixiJS Input Devices** adds first-class support for input devices, and
provides a simple, but powerful navigation manager that can enable devices to
navigate existing pointer-based UIs.

The key concepts are:

1. **Devices:** _Any human interface device_
2. **Binds:** _Custom, named input actions that can be triggered by assigned keys or buttons_
3. **UINavigation:** _Navigation manager for non-pointer devices to navigate UIs_

> [!NOTE]
> _See [UINavigation API](#uinavigation-api) for more information._


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
import { Ticker } from 'pixi.js'
import { InputDevice } from 'pixijs-input-devices'


Ticker.shared.add(() => InputDevice.update())
```

> [!TIP]
> **Input polling:** In the context of a video game, you may want to put the input update at the start of your game event loop instead.

**3.** (Optional) enable the UINavigation API

```ts
import * as PIXI from 'pixi.js'
import { UINavigation, registerPixiJSNavigationMixin } from 'pixijs-input-devices'


const app = new PIXI.Application(/*…*/)

// enable the navigation API
UINavigation.configureWithRoot(app.stage)
registerPixiJSNavigationMixin(PIXI.Container)
```

✨ You are now ready to use inputs!

## Features

### InputDevice Manager

The `InputDevice` singleton controls all device discovery.

```ts
InputDevice.keyboard  // KeyboardDevice
InputDevice.gamepads  // GamepadDevice[]
InputDevice.custom    // Device[]
```

You can access all **active/connected** devices using `.devices`:

```ts
for (const device of InputDevice.devices) {  // …
```

#### InputDevice - properties

The `InputDevice` manager provides the following **context capability** properties:

| Property | Type | Description |
|---|---|---|
| `InputDevice.hasMouseLikePointer` | `boolean` | Whether the context has a mouse/trackpad. |
| `InputDevice.isMobile` | `boolean` | Whether the context is mobile capable. |
| `InputDevice.isTouchCapable` | `boolean` | Whether the context is touchscreen capable. |

As well as shortcuts to **connected devices**:

| Accessor | Type | Description |
|---|---|---|
| `InputDevice.lastInteractedDevice` | `Device?` | The most recently interacted device (or first if multiple). |
| `InputDevice.devices` | `Device[]` | All active, connected devices. |
| `InputDevice.keyboard` | `KeyboardDevice` | The global keyboard. |
| `InputDevice.gamepads` | `GamepadDevice[]` | Connected gamepads. |
| `InputDevice.custom` | `CustomDevice[]` | Any custom devices. |

#### InputDevice - on() Events

Access global events directly through the manager:

```ts
InputDevice.on("deviceadded", ({ device }) => {
    // new device was connected or became available
    // do additional setup here, show a dialog, etc.
})

InputDevice.off("deviceadded") // stop listening
```

| Event | Description | Payload |
|---|---|---|
| `"deviceadded"` | `{device}` | A device has been added. |
| `"deviceremoved"` | `{device}` | A device has been removed. |
| `"lastdevicechanged"` | `{device}` | The _last interacted device_ has changed. |


#### InputDevice - onBindDown() Events

You may also subscribe globally to **named bind** events:

```ts
InputDevice.onBindDown("my_custom_bind", (event) => {
    // a bound input waas triggered
})
```

### KeyboardDevice

Unlike gamepads & custom devices, there is a single global keyboard device.

```ts
let keyboard = InputDevice.keyboard

if (keyboard.key.ControlLeft) {  // …
```

> [!NOTE]
> **Detection:** On mobiles/tablets the keyboard will not appear in `InputDevice.devices` until
> a keyboard is detected. See `keyboard.detected`.

#### Keyboard Layout - detection

```ts
keyboard.layout  // "AZERTY" | "JCUKEN" | "QWERTY" | "QWERTZ"

keyboard.getKeyLabel("KeyZ")  // Я
```

> [!NOTE]
> **Layout support:** Detects the **"big four"** (AZERTY, JCUKEN, QWERTY and QWERTZ).
> Almost every keyboard is one of these four (or a regional derivative &ndash; e.g. Hangeul,
> Kana). There is no built-in detection for specialist or esoteric layouts (e.g. Dvorak, Colemak, BÉPO).
>
> The `keyboard.getKeyLabel(key)` uses the [KeyboardLayoutMap API](https://caniuse.com/mdn-api_keyboardlayoutmap)
> when available, before falling back to default AZERTY, JCUKEN, QWERTY or QWERTZ key values.

The keyboard layout is automatically detected from (in order):

1. Browser API <sup>[(browser support)](https://caniuse.com/mdn-api_keyboardlayoutmap)</sup>
2. Keypresses
3. Browser Language

You can also manually force the layout:

```ts
// force layout
InputDevice.keyboard.layout = "JCUKEN"

InputDevice.keyboard.getKeyLabel("KeyW")  // "Ц"
InputDevice.keyboard.layoutSource  // "manual"
```

#### KeyboardDevice Events

| Event | Description | Payload |
|---|---|---|
| `"layoutdetected"` | `{layout,layoutSource,device}` | The keyboard layout (`"QWERTY"`, `"QWERTZ"`, `"AZERTY"`, or `"JCUKEN"`) has been detected, either from the native API or from keypresses. |
| `"binddown"` | `{name,event,keyCode,keyLabel,device}` | A **named bind** key was pressed. |
| **Key presses:** | | |
| `"KeyA"` | `{event,keyCode,keyLabel,device}` | The `"KeyA"` was pressed. |
| `"KeyB"` | `{event,keyCode,keyLabel,device}` | The `"KeyB"` was pressed. |
| `"KeyC"` | `{event,keyCode,keyLabel,device}` | The `"KeyC"` was pressed. |
| … | … | … |


### GamepadDevice

Gamepads are automatically detected via the browser API when first interacted with <sup>[(read more)](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API)</sup>.

Gamepad accessors are modelled around the "Standard Controller Layout":

```ts
const gamepad = InputDevice.gamepads[0];

if (gamepad.button.DpadDown)
{
    // button pressed
}

if (gamepad.leftTrigger > 0.25)
{
    // trigger pulled
}

if (gamepad.leftJoystick.x < -0.33)
{
    // joystick moved
}
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

| Button # | GamepadCode | Description | Xbox Series X | Playstation 5 DualSense® | Nintendo Switch™ Pro |
|:---:|:---|:---|:---:|:---:|:---:|
| `0` | `"Face1"` | **Face Button 1** | A | Cross | B |
| `1` | `"Face2"` | **Face Button 2** | B | Circle | A |
| `2` | `"Face3"` | **Face Button 3** | X | Square | Y |
| `3` | `"Face4"` | **Face Button 4** | Y | Triangle | X |
| `4` | `"LeftShoulder"` | **Left Shoulder** | LB | L1 | L |
| `5` | `"RightShoulder"` | **Right Shoulder** | RB | R1 | R |
| `6` | `"LeftTrigger"` | **Left Trigger** | LT | L2 | ZL |
| `7` | `"RightTrigger"` | **Right Trigger** | RT | R2 | ZR |
| `8` | `"Back"` | **Back** | View | Options | Minus |
| `9` | `"Start"` | **Start** | Menu | Select | Plus |
| `10` | `"LeftStickClick"` | **Left Stick (Click)** | LSB | L3 | L3 |
| `11` | `"RightStickClick"` | **Right Stick (Click)** | RSB | R3 | R3 |
| `12` | `"DpadUp"` | **D-Pad Up** | ⬆️ | ⬆️ | ⬆️ |
| `13` | `"DpadDown"` | **D-Pad Down** | ⬇️ | ⬇️ | ⬇️ |
| `14` | `"DpadLeft"` | **D-Pad Left** |  ⬅️ | ⬅️ | ⬅️ |
| `15` | `"DpadRight"` | **D-Pad Right** | ➡️ | ➡️ | ➡️ |

#### Gamepad Axis Codes

Bindable helpers are available for the joysticks too:

| Axis # | GamepadCode | Standard | Layout
|:---:|:---:|:---:|:---:|
| `0` | `"LeftStickLeft"`<br/>`"LeftStickRight"` | **Left Stick (X-Axis)** | ⬅️➡️ |
| `1` | `"LeftStickUp"`<br/>`"LeftStickDown"` | **Left Stick (Y-Axis)** | ⬆️⬇️ |
| `2` | `"RightStickLeft"`<br/>`"RightStickRight"` | **Right Stick (X-Axis)** | ⬅️➡️ |
| `3` | `"RightStickUp"`<br/>`"RightStickDown"` | **Right Stick (Y-Axis)** | ⬆️⬇️ |

> [!TIP]
> Set the `joystick.pressThreshold` option in `GamepadDevice.defaultOptions` to adjust event sensitivity.

#### Gamepad Layouts

```ts
gamepad.layout // "xbox_one"
```

Gamepad device layout reporting is a non-standard API, and should only be used for aesthetic
enhancements improvements (i.e. [display layout-specific icons](https://thoseawesomeguys.com/prompts/)).

#### GamepadDevice Events

| Event | Description | Payload |
|---|---|---|
| `"binddown"` | `{name,button,buttonCode,device}` | A **named bind** button was pressed. |
| **Button presses:** | | |
| `"Face1"` | `{button,buttonCode,device}` | Standard layout button `"Face1"` was pressed. Equivalent to `0`. |
| `"Face2"` | `{button,buttonCode,device}` | Standard layout button `"Face2"` was pressed. Equivalent to `1`. |
| `"Face3"` | `{button,buttonCode,device}` | Standard layout button `"Face3"` was pressed. Equivalent to `2`. |
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

export const onScreenButtonsDevice: CustomDevice = {
    type: "custom",
    id: "OnScreen",
    meta: {},
    update: (now: number) => {
        // polling update
    }
};

InputDevice.add(onScreenButtonsDevice);
```

## Named Binds

Use _named binds_ to create mappings between abstract inputs and the keys/buttons that trigger those inputs.

This allows you to change the keys/buttons later (e.g. allow users to override inputs).

```ts
// keyboard:
InputDevice.keyboard.configureBinds({
    jump: [ "ArrowUp", "Space", "KeyW" ],
    crouch: [ "ArrowDown", "KeyS" ],
    toggleGraphics: [ "KeyB" ],
})

// all gamepads:
GamepadDevice.configureDefaultBinds({
    jump: [ "Face1", "LeftStickUp" ],
    crouch: [ "Face2", "Face3", "RightTrigger" ],
    toggleGraphics: [ "RightStickUp", "RightStickDown" ],
})
```

These can then be used with either the real-time and event-based APIs.

#### Event-based:

```ts
// listen to all devices:
InputDevice.onBindDown("toggleGraphics", (e) => toggleGraphics())

// listen to specific devices:
InputDevice.keyboard.onBindDown("jump", (e) => doJump())
InputDevice.gamepads[0].onBindDown("jump", (e) => doJump())
```

#### Real-time:

```ts
let jump = false, crouch = false, moveX = 0

const keyboard = InputDevice.keyboard
if (keyboard.bindDown("jump")) jump = true
if (keyboard.bindDown("crouch")) crouch = true
if (keyboard.key.ArrowLeft) moveX = -1
else if (keyboard.key.ArrowRight) moveX = 1

for (const gamepad of InputDevice.gamepads) {
    if (gamepad.bindDown("jump")) jump = true
    if (gamepad.bindDown("crouch")) crouch = true

    // gamepads have additional analog inputs
    // we're going to apply these only if touched
    if (gamepad.leftJoystick.x != 0) moveX = gamepad.leftJoystick.x
    if (gamepad.leftTrigger > 0) moveX *= (1 - gamepad.leftTrigger)
}
```

## UINavigation API

_Traverse a UI using input devices._

### Quick setup

Set up navigation once using:

```ts
UINavigation.configureWithRoot(app.stage)  // any root container
registerPixiJSNavigationMixin(PIXI.Container)
```

Navigation should now work automatically if your buttons handle these events:

- `"pointerdown"` &ndash; i.e. Trigger / show press effect

But in order to really make use, you should also set:

- `"pointerover"` &ndash; i.e. Select / show hover effect
- `"pointerout"` &ndash; i.e. Deselect / reset

> [!TIP]
> 🖱️ **Seamless navigation:** Manually set `UINavigation.focusTarget = <target>`
> inside any `"pointerover"` handlers to allow mouse/pointers to update the
> navigation context for all devices.

> [!TIP]
> **Auto-focus:** Set a container's `navigationPriority` to a value above `0`
> to become the default selection in a context.

### How it works

The Navigation API is centered around the **UINavigation** manager, which
receives navigation intents from devices and forwards it to the UI context.

The **UINavigation** manager maintains a stack of responders, which can be a
`Container`, or any object that implements the `NavigationResponder` interface.

When a device sends a navigation intent, the **UINavigation** manager is
responsible for asking the **first responder** whether it can handle the intent.

If it returns `false`, any other responders are checked (if they exist),
otherwise the default global navigation behavior kicks in.

### Default Global Navigation Behaviors

When a navigation intent is **not** handled manually by a responder, it is handled in one of the following ways:

| Intent | Behavior |
|---|---|
|`"navigate.back"`|<ul><li>No action.</li></ul>|
|`"navigate.left"`, `"navigate.right"`, `"navigate.up"`, `"navigate.down"`|<ul><li>Looks for the nearest `Container` where `container.isNavigatable` in the direction given, and if found, receives a `"deviceover"` event.</li><li>Additionally, if the newly focused container has registered an event handler for either `"pointerover"` or `"mouseover"` (in that order), it will fire that too.</li><li>If we were previously focused on a container, that previous container receives a `"deviceout"` event.</li><li>If the blurred container has register an event handler for either `"pointerout"` or `"mouseout"` (in that order), that event handler will be fired too.</li></ul>|
|`"navigate.trigger"`|<ul><li>Checks if we are currently focused on a container, and then issue a `"devicedown"` event.</li><li>If the focused container has registered an event handler for either `"pointerdown"` or `"mousedown"` (in that order), that event handler will be fired too.</li></ul>|

| Container event  | Description | Compatibility
|-----------------|-------------|------------------------------------------
| `"devicedown"`   | Target was triggered. | `"pointerdown"`, `"mousedown"`
| `"deviceover"`   | Target became focused. | `"pointerover"`, `"mouseover"`
| `"deviceout"`    | Target lost focus. | `"pointerout"`, `"mouseout"`

### Container Navigatability

Containers are extended with a few properties/accessors:

| Container properties | type | default | description
|---------------------|------|---------|--------------
| `isNavigatable`      | `get(): boolean` | `false` | returns `true` if `navigationMode` is set to `"target"`, |or is `"auto"` and a `"pointerdown"` or `"mousedown"` event handler is registered.
| `navigationMode`     | `"auto"` \| `"disabled"` \| `"target"` | `"auto"` | When set to `"auto"`, a `Container` can be navigated to if it has a `"pointerdown"` or `"mousedown"` event handler registered.
| `navigationPriority` | `number` | `0` | The priority relative to other navigation items in this group.

> [!NOTE]
> **isNavigatable:** By default, any element with `"pointerdown"` or `"mousedown"` handlers is navigatable.

> [!WARNING]
> **Fallback Hover Effect:** If there is no `"pointerover"` or `"mouseover"` handler detected on a container, `UINavigation`
>  will apply abasic alpha effect to the selected item to indicate which container is currently the navigation target. This
> can be disabled by setting `UINavigation.options.enableFallbackOverEffect` to `false`.

### Default Binds

The keyboard and gamepad devices are preconfigured with the following binds, feel free to modify them:

Navigation Intent Bind | Keyboard | Gamepad
---|---|---
`"navigate.left"` | "ArrowLeft", "KeyA" | "DpadLeft", "LeftStickLeft"
`"navigate.right"` | "ArrowRight", "KeyD" | "DpadRight", "LeftStickRight"
`"navigate.up"` | "ArrowUp", "KeyW" | "DpadUp", "LeftStickUp"
`"navigate.down"` | "ArrowDown", "KeyS" | "DpadDown", "LeftStickDown"
`"navigate.trigger"` | "Enter", "Space" | "Face1"
`"navigate.back"` | "Escape", "Backspace" | "Face2", "Back"

### Manual control for submenus & modal views

You can manually take control of navigation using:

```ts
// take control
UINavigation.pushResponder(myModalView)

// relinquish control
UINavigation.popResponder()
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

for (const device of InputDevice.devices)
{
    if (device.meta.localPlayerId === 123)
    {
        // use assigned input device!
    }
}
```

### On-Screen Inputs

You can easily map an on-screen input device using the `CustomDevice` interface.

```ts
export class OnScreenInputContainer extends Container implements CustomDevice {
    id = "onscreen"
    type = "custom" as const
    meta: Record<string, any> = {}

    inputs = {
        moveX: 0.0
        jump: false,
    }

    update(now)
    {
        this.inputs.moveX = this._virtualJoystick.x
        this.inputs.jump = this._jumpButton.isTouching()
    }

    // e.g. disable named binds for onscreen joysticks:
    bindDown(name){ return false } 
}

const onscreen = new OnScreenInputContainer()

InputDevice.add(onscreen)
InputDevice.remove(onscreen)
```

### Two Users; One Keyboard

You could set up multiple named inputs:

```ts
InputDevice.keyboard.configureBinds({
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
    p2_right: [ "ArrowRight" ]
})
```

and then switch groups depending on the mode:

```ts
if (gameMode === "multiplayer")
{
    player1.jump   = device.bindDown("p1_jump")
    player1.defend = device.bindDown("p1_defend")
    player1.moveX += device.bindDown("p1_left") ? -1 : 0
    player1.moveX += device.bindDown("p1_right") ? 1 : 0

    player2.jump   = device.bindDown("p2_jump")
    player2.defend = device.bindDown("p2_defend")
    player2.moveX += device.bindDown("p2_left") ? -1 : 0
    player2.moveX += device.bindDown("p2_right") ? 1 : 0
}
else
{
    player1.jump   = device.bindDown("jump")
    player1.defend = device.bindDown("defend")
    player1.moveX += device.bindDown("left") ? -1 : 0
    player1.moveX += device.bindDown("right") ? 1 : 0

    updateComputerPlayerInput(player2)
}
```
