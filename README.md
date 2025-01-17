# 🕹️ pixijs-input-devices &nbsp;[![NPM version](https://img.shields.io/npm/v/pixijs-input-devices.svg)](https://www.npmjs.com/package/pixijs-input-devices) [![Minzipped](https://badgen.net/bundlephobia/minzip/pixijs-input-devices@latest)](https://bundlephobia.com/package/pixijs-input-devices) [![Downloads per month](https://img.shields.io/npm/dm/pixijs-input-devices.svg)](https://www.npmjs.com/package/pixijs-input-devices) [![Tests](https://github.com/reececomo/pixijs-input-devices/actions/workflows/tests.yml/badge.svg)](https://github.com/reececomo/pixijs-input-devices/actions/workflows/tests.yml) [![License](https://badgen.net/npm/license/pixijs-input-devices)](https://github.com/reececomo/pixijs-input-devices/blob/main/LICENSE)

🚧 WIP - This API is a work in progress, and is subject to change.

- Adds comprehensive support for ⌨️ **Keyboard**, 🎮 **Gamepads**, and other human-interface devices
- High-performance, easy-to-use, sensible defaults
- Supports either real-time or event driven APIs
- Built-in `Navigation` API to navigate pointer/mouse based menus _(optional)_

<hr/>

## 💿 Install

```sh
npm i pixijs-input-devices
```

### Setup

```ts
import { InputDevice } from "pixijs-input-devices"

Ticker.shared.add( () => InputDevice.update() )
```

_(Optional)_ Enable the Navigation API:

```ts
import { Navigation } from "pixijs-input-devices"

// set root node
Navigation.stage = app.stage

// register mixin
registerPixiJSInputDeviceMixin( Container )
```

## Overview

There are a few very simple themes:

- All devices are accessed through the `InputDevice` manager
- There are three supported device types: ⌨️ `"keyboard"`, 🎮 `"gamepad"` and 👻 `"custom"`
- Inputs can be accessed directly, or configured by [Named Groups](#named-input-groups)

### InputDevice Manager

The `InputDevice` singleton controls all device discovery.

```ts
InputDevice.keyboard  // KeyboardDevice
InputDevice.gamepads  // Array<GamepadDevice>
InputDevice.custom    // Array<CustomDevice>
```

You can access all **active/connected** devices using `.devices`:

```ts
for ( const device of InputDevice.devices ) {  // ...
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
InputDevice.on( "deviceconnected", ({ device }) => {
    // a device was connected
    // do additional setup here, show a dialog, etc.
})

InputDevice.off( "deviceconnected" ) // stop listening
```

| Event | Description | Payload |
|---|---|---|
| `"deviceconnected"` | `{device}` | A device has become available. |
| `"devicedisconnected"` | `{device}` | A device has been removed. |


### KeyboardDevice

Unlike gamepads & custom devices, there is a single global keyboard device.

```ts
let keyboard = InputDevice.keyboard

if ( keyboard.key.ControlLeft ) {  // ...
```

> [!NOTE]
> **Detection:** On mobiles/tablets the keyboard will not appear in `InputDevice.devices` until
> a keyboard is detected. See `keyboard.detected`.

#### Keyboard Layout - detection

```ts
keyboard.layout  // "AZERTY" | "JCUKEN" | "QWERTY" | "QWERTZ"
```

> [!NOTE]
> **Layout support:** Detects the **"big four"** (AZERTY, JCUKEN, QWERTY and QWERTZ).
> Almost every keyboard is one of these four (or a regional derivative &ndash; e.g. Hangeul,
> Kana). There is no built-in detection for specialist or esoteric layouts (e.g. Dvorak, Colemak, BÉPO).

The keyboard layout is automatically detected from (in order):

1. Browser API <sup>[(browser support)](https://caniuse.com/mdn-api_keyboardlayoutmap)</sup>
2. Keypresses
3. Browser Language

You can also manually force the layout:

```ts
// force layout
InputDevice.keyboard.layout = "JCUKEN"

InputDevice.keyboard.keyLabel( "KeyW" )  // "Ц"
InputDevice.keyboard.layoutSource  // "manual"
```

#### KeyboardDevice Events

| Event | Description | Payload |
|---|---|---|
| `"layoutdetected"` | `{layout,layoutSource,device}` | The keyboard layout (`"QWERTY"`, `"QWERTZ"`, `"AZERTY"`, or `"JCUKEN"`) has been detected, either from the native API or from keypresses. |
| `"group"` | `{groupName,event,keyCode,keyLabel,device}` | A **named input group** key was pressed. |
| **Key presses:** | | |
| `"KeyA"` | `{event,keyCode,keyLabel,device}` | The `"KeyA"` was pressed. |
| `"KeyB"` | `{event,keyCode,keyLabel,device}` | The `"KeyB"` was pressed. |
| `"KeyC"` | `{event,keyCode,keyLabel,device}` | The `"KeyC"` was pressed. |
| ... | ... | ... |


### GamepadDevice

Gamepads are automatically detected via the browser API when first interacted with <sup>[(read more)](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API)</sup>.

Gamepad accessors are modelled around the "Standard Controller Layout":

```ts
let gamepad = InputDevice.gamepads[0]

if ( gamepad.button.Start ) {  // ...
if ( gamepad.leftTrigger > 0.25 ) {  // ...
if ( gamepad.leftJoystick.x > 0.5 ) {  // ...
```

> [!TIP]
> **Special requirements?** You can always access `gamepad.source` and reference the
> underlying API directly as needed.

#### Vibration & Haptics

Use the `playVibration()` method to play a haptic vibration, in supported browsers.

```ts
gamepad.playVibration()

gamepad.playVibration({
  duration: 150,
  weakMagnitude: 0.25,
  strongMagnitude: 0.65,
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
| `"group"` | `{groupName,button,buttonCode,device}` | A **named input group** button was pressed. |
| **Button presses:** | | |
| `"A"` | `{button,buttonCode,device}` | Standard layout button `"A"` was pressed. Equivalent to `0`. |
| `"B"` | `{button,buttonCode,device}` | Standard layout button `"B"` was pressed. Equivalent to `1`. |
| `"X"` | `{button,buttonCode,device}` | Standard layout button `"X"` was pressed. Equivalent to `2`. |
| ... | ... | ... |
| **Button presses (no label):** | | |
| `0` or `Button.A` | `{button,buttonCode,device}` | Button at offset `0` was pressed. |
| `1` or `Button.B` | `{button,buttonCode,device}` | Button at offset `1` was pressed. |
| `2` or `Button.X` | `{button,buttonCode,device}` | Button at offset `2` was pressed. |
| ... | ... | ... |

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

## Named Input Groups

Use named "groups" to create named inputs that can be referenced.

This allows you to change the keys/buttons later (e.g. allow users to override inputs).

```ts
// keyboard:
InputDevice.keyboard.options.namedGroups = {
    jump: [ "ArrowUp", "Space", "KeyW" ],
    crouch: [ "ArrowDown", "KeyS" ],
    toggleGraphics: [ "KeyB" ],
}

// all gamepads:
GamepadDevice.defaultOptions.namedGroups = {
    jump: [ "A" ],
    crouch: [ "B", "X", "RightTrigger" ],
    toggleGraphics: [ "RightStick" ],
}
```

These can then be used with either the real-time and event-based APIs.

#### Event-based:

```ts
// listen to all devices:
InputDevice.onGroup( "toggleGraphics", ( e ) => toggleGraphics() )

// listen to specific devices:
InputDevice.keyboard.onGroup( "jump", ( e ) => doJump() )
InputDevice.gamepads[0].onGroup( "jump", ( e ) => doJump() )
```

#### Real-time:

```ts
let jump = false, crouch = false, moveX = 0

const keyboard = InputDevice.keyboard
if ( keyboard.groupPressed( "jump" ) ) jump = true
if ( keyboard.groupPressed( "crouch" ) ) crouch = true
if ( keyboard.key.ArrowLeft ) moveX = -1
else if ( keyboard.key.ArrowRight ) moveX = 1

for ( const gamepad of InputDevice.gamepads ) {
    if ( gamepad.groupPressed( "jump" ) ) jump = true
    if ( gamepad.groupPressed( "crouch" ) ) crouch = true

    // gamepads have additional analog inputs
    // we're going to apply these only if touched
    if ( gamepad.leftJoystick.x != 0 ) moveX = gamepad.leftJoystick.x
    if ( gamepad.leftTrigger > 0 ) moveX *= ( 1 - gamepad.leftTrigger )
}
```

## Navigation API

Automatically traverse existing pointer/mouse based menus using the `Navigation` API.

```ts
Navigation.stage = app.stage

const button = new ButtonSprite()
button.on( "mousedown", () => button.run( clickAnimation ) )
button.on( "mouseout", () => button.run( resetAnimation ) )
button.on( "mouseover", () => button.run( hoverAnimation ) )

app.stage.addChild( button )

button.isNavigatable  // true
```

> [!NOTE]
> **isNavigatable:** By default, any element with `"mousedown"` or `"pointerdown"` handlers is navigatable.

> [!WARNING]
> **Fallback Hover Effect:** If there is no `"pointerover"` or `"mouseover"` handler detected on a container, `Navigation`
>  will apply abasic alpha effect to the selected item to indicate which container is currently the navigation target. This
> can be disabled by setting `Navigation.options.useFallbackHoverEffect` to `false`.

### Disable Navigation

You can **disable** the navigation API - either permanently or temporarily - like so:

```ts
Navigation.options.enabled = false
```

### Navigation Hierarchy

UIs can be complex! The Navigation API allows you to take over some - or all - of the navigation elements.

```ts
class MyVerticalMenu implements NavigationResponder
{
    becameFirstResponder() {
        console.log( "I'm in charge now!" )
    }

    resignedAsFirstResponder() {
        console.log( "Nooo! My power is gone!" )
    }

    handledNavigationIntent( intent, device ): boolean {
        if ( intent === "navigateUp" ) this.moveCursorUp()
        else if ( intent === "navigateDown" ) this.moveCursorDown()
        else if ( intent === "navigateBack" ) this.loseFocus()
        else if ( intent === "trigger" ) this.clickCursorItem()

        // we are going to return false here, which will propagates unhandled
        // intents ("navigateLeft", "navigateRight") up to the next responder
        // in the stack - which could be a parent view, etc.
        return false
    }
}

const myMenu = new MyVerticalMenu()
Navigation.pushResponder( myMenu )
```

In a game, you might use this to disable navigation outside of menus:

```ts
class GameScene implements NavigationResponder
{
    handledNavigationIntent( intent, device ) {
        // ignore navigation intents, but allow other navigatable
        // views to be pushed on top of me - e.g. a dialog window:
        return true
    }
}
```

### Default Navigation Binds

Keyboard and gamepad devices are configured with a few default binds for navigation.

The default binds are below:

Navigation Intent | Keyboard               | Gamepad
------------------|------------------------|-----------------------------------
`"navigateLeft"`  | `ArrowLeft`, `KeyA`    | Left Joystick (Left), `DPadLeft`
`"navigateRight"` | `ArrowRight`, `KeyD`   | Left Joystick (Right), `DPadRight`
`"navigateUp"`    | `ArrowUp`, `KeyW`      | Left Joystick (Up), `DPadDown`
`"navigateDown"`  | `ArrowDown`, `KeyS`    | Left Joystick (Down), `DPadUp`
`"navigateBack"`  | `Escape`, `Backspace`  | `B`, `Back`
`"trigger"`       | `Enter,` `Space`       | `A`

These can be manually configured in `<device>.options.navigation.binds`.

#### Container Mixin

Container properties | type | default | description
---------------------|------|---------|--------------
`isNavigatable`      | `boolean` | `false` | returns `true` if `navigationMode` is set to `"target"`, or is `"auto"` and a `"pointerdown"` or `"mousedown"` event handler is registered.
`navigationMode`     | `"auto"` \| `"disabled"` \| `"target"` | `"auto"` | When set to `"auto"`, a `Container` can be navigated to if it has a `"pointerdown"` or `"mousedown"` event handler registered.
`navigationPriority` | `number` | `0` | The priority relative to other navigation items in this group.

Container events  | description
------------------|--------------------------------------------------------
`focus`           | Target became focused.
`blur`            | Target lost focus.


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
InputDevice.keyboard.options.namedGroups = {
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
if ( gameMode === "2p" )
{
    // multiplayer
    player1.jump = device.pressedGroup( "p1_jump" )
    player1.defend = device.pressedGroup( "p1_defend" )
    player1.moveX += device.pressedGroup( "p1_left" ) ? -1 : 0
    player1.moveX += device.pressedGroup( "p1_right" ) ? 1 : 0
    player2.jump = device.pressedGroup( "p2_jump" )
    player2.defend = device.pressedGroup( "p2_defend" )
    player2.moveX += device.pressedGroup( "p2_left" ) ? -1 : 0
    player2.moveX += device.pressedGroup( "p2_right" ) ? 1 : 0
}
else
{
    // single player
    player1.jump = device.pressedGroup( "jump" )
    player1.defend = device.pressedGroup( "defend" )
    player1.moveX += device.pressedGroup( "left" ) ? -1 : 0
    player1.moveX += device.pressedGroup( "right" ) ? 1 : 0
    player2.updateComputerPlayer()
}
```
