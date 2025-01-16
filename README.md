# 🕹️ pixijs-input-devices &nbsp;[![NPM version](https://img.shields.io/npm/v/pixijs-input-devices.svg)](https://www.npmjs.com/package/pixijs-input-devices) [![Minzipped](https://badgen.net/bundlephobia/minzip/pixijs-input-devices@latest)](https://bundlephobia.com/package/pixijs-input-devices) [![Downloads per month](https://img.shields.io/npm/dm/pixijs-input-devices.svg)](https://www.npmjs.com/package/pixijs-input-devices) [![Tests](https://github.com/reececomo/pixijs-input-devices/actions/workflows/tests.yml/badge.svg)](https://github.com/reececomo/pixijs-input-devices/actions/workflows/tests.yml) [![License](https://badgen.net/npm/license/pixijs-input-devices)](https://github.com/reececomo/pixijs-input-devices/blob/main/LICENSE)

🚧 WIP - This API is a work in progress, and is subject to change.

- Adds support for ⌨️ **Keyboard**, 🎮 **Gamepads**, and other human-interface devices
- A simple `Navigation` API which hooks devices into existing pointer/mouse events
- A powerful event-based API for event-driven interactions
- and of course, a high-performance API for real-time applications

<hr/>

### 💿 Install

```sh
npm i pixijs-input-devices
```

#### Setup

```ts
import { InputDevice, Navigation } from "pixijs-input-devices"

// register mixin
registerPixiJSInputDeviceMixin( Container )

// add update loop
Ticker.shared.add( () => InputDevice.update() )

// enable navigation
Navigation.stage = app.stage
```

### ✨ Binding Groups

Use named "groups" to create referenceable groups of inputs.

```ts
InputDevice.keyboard.options.namedGroups = {
    jump: [ "ArrowUp", "Space", "KeyW" ],
    crouch: [ "ArrowDown","KeyS" ],
    moveSlow: [  "ShiftLeft", "ShiftRight" ],
    left: [ "ArrowLeft", "KeyA" ],
    right: [ "ArrowRight", "KeyD" ],

    toggleGraphics: [ "KeyB" ],
    // other...
};

GamepadDevice.defaultOptions.namedGroups = {
    jump: [ "A" ],
    crouch: [ "B", "X", "RightTrigger" ],

    toggleGraphics: [ "RightStick" ],
    // other...
};
```

These can then be used with the real-time and event-based APIs.

```ts
// real-time:
if ( gamepad.groupPressed("jump") ) doJump();

// events:
InputDevice.gamepads[0].onGroup( "jump", ( event ) => doJump() );

// ...or listen to ANY device:
InputDevice.onGroup( "toggleGraphics", ( event ) => toggleGraphics() );
```

You definitely do not have to use named inputs:

```ts
// real-time:
if ( keyboard.key.Space || keyboard.key.KeyW ) jump = true;
if ( gamepad.button.A || gamepad.button.LeftTrigger ) jump = true;

// events:
InputDevice.gamepads[0].on( "A", ( event ) => doJump() );
```

### Realtime API

Iterate through `InputDevice.devices`, or access devices directly:

```ts
let jump = false, crouch = false, moveX = 0

const keyboard = InputDevice.keyboard
if ( keyboard.groupPressed( "jump" ) ) jump = true
if ( keyboard.groupPressed( "crouch" ) ) crouch = true
if ( keyboard.groupPressed( "left" ) ) moveX -= 1
if ( keyboard.groupPressed( "right" ) ) moveX += 1
if ( keyboard.groupPressed( "moveSlow" ) ) moveX *= 0.5

for ( const gamepad of InputDevice.gamepads ) {
    if ( gamepad.groupPressed( "jump" ) ) jump = true
    if ( gamepad.groupPressed( "crouch" ) ) crouch = true

    // gamepads have additional analog inputs
    // we're going to apply these only if touched
    if ( gamepad.leftJoystick.x != 0 ) moveX = gamepad.leftJoystick.x
    if ( gamepad.leftTrigger > 0 ) moveX *= ( 1 - gamepad.leftTrigger )
}
```

### Event API

Use `on( ... )` to subscribe to built-in events. Use `onGroup( ... )` to subscribe to custom named input group events.

```ts
// global events
InputDevice.on( "deviceconnected", ({ device }) =>
    console.debug( "A new " + device.type + " device connected!" )
)

// device events
InputDevice.keyboard.on( "layoutdetected", ({ layout }) =>
    console.debug( "layout detected as " + layout );
)

// bind keys/buttons
InputDevice.keyboard.on( "Escape", () => showMenu() )
InputDevice.gamepads[0].on( "Back", () => showMenu() )

// use "onGroup()" to add custom events too:
InputDevice.onGroup( "pause_menu", ( event ) => {
    // menu was triggered!
})
```

#### Global Events

| Event | Description | Payload |
|---|---|---|
| `"deviceconnected"` | `{device}` | A device has become available. |
| `"devicedisconnected"` | `{device}` | A device has been removed. |

#### Keyboard Device Events

| Event | Description | Payload |
|---|---|---|
| `"layoutdetected"` | `{layout,layoutSource,device}` | The keyboard layout (`"QWERTY"`, `"QWERTZ"`, `"AZERTY"`, or `"JCUKEN"`) has been detected, either from the native API or from keypresses. |
| `"group"` | `{groupName,event,keyCode,keyLabel,device}` | A named input group key was pressed. |
| **Key presses:** | | |
| `"KeyA"` \| `"KeyB"` \| ... 103 more ... | `{event,keyCode,keyLabel,device}` | `"KeyA"` was pressed. |

#### Gamepad Device Events

| Event | Description | Payload |
|---|---|---|
| `"group"` | `{groupName,button,buttonCode,device}` | A named input group button was pressed. |
| **Button presses:** | | |
| `"A"` \| `"B"` \| `"X"` \| ... 13 more ... | `{button,buttonCode,device}` | Button `"A"` was pressed. Equivalent to `0`. |
| ... | ... | ... |
| **Button presses (no label):** | | |
| `0` \| `1` \| `2` \| ... 13 more ... | `{button,buttonCode,device}` | Button `0` was pressed. Equivalent to `"A"`. |
| ... | ... | ... |

> [!TIP]
> **Multiplayer:** For multiple players, consider assigning devices
> using `device.meta` (e.g. `device.meta.player = 1`) and use
> `InputDevice.devices` to iterate through devices.

### Navigation API

By default, any element with `"mousedown"` or `"pointerdown"` handlers is navigatable.

Container properties | type | default | description
---------------------|------|---------|--------------
`isNavigatable`      | `boolean` | `false` | returns `true` if `navigationMode` is set to `"target"`, or is `"auto"` and a `"pointerdown"` or `"mousedown"` event handler is registered.
`navigationMode`     | `"auto"` \| `"disabled"` \| `"target"` | `"auto"` | When set to `"auto"`, a `Container` can be navigated to if it has a `"pointerdown"` or `"mousedown"` event handler registered.
`navigationPriority` | `number` | `0` | The priority relative to other navigation items in this group.

Navigation intent | Keyboard               | Gamepads
------------------|------------------------|-----------------------------------
`"navigateLeft"`  | `ArrowLeft`, `KeyA`    | Left Joystick (Left), `DPadLeft`
`"navigateRight"` | `ArrowRight`, `KeyD`   | Left Joystick (Right), `DPadRight`
`"navigateUp"`    | `ArrowUp`, `KeyW`      | Left Joystick (Up), `DPadDown`
`"navigateDown"`  | `ArrowDown`, `KeyS`    | Left Joystick (Down), `DPadUp`
`"navigateBack"`  | `Escape`, `Backspace`  | `B`, `Back`
`"trigger"`       | `Enter,` `Space`       | `A`

Container events  | description
------------------|--------------------------------------------------------
`focus`           | Target became focused.
`blur`            | Target lost focus.

> [!TIP]
> Modify `device.options.navigation.binds` to override which keys/buttons are used for navigation.
>
> Or set `device.options.navigation.enabled = false` to disable navigation.


### Devices

#### Gamepads

##### Gamepad Layouts

> [!NOTE]
> **Gamepad Labels:** The gamepad buttons are aliased with generic standard controller buttons in a Logitech/Xbox/Steam controller layout.

| Button | ButtonCode | Name | Generic | Nintendo<br/>(*physical) | Playstation | Xbox |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `0` | `"A"` | **A** | A | B | Cross | A |
| `1` | `"B"` | **B** | B | A | Circle | B |
| `2` | `"X"` | **X** | X | Y | Square | X |
| `3` | `"Y"` | **Y** | Y | X | Triangle | Y |
| `4` | `"LeftShoulder"` | **Left Shoulder** | LeftShoulder | L | L1 | LB |
| `5` | `"RightShoulder"` | **Right Shoulder** | RightShoulder | R | R1 | RB |
| `6` | `"LeftTrigger"` | **Left Trigger** | LeftTrigger | L2 | ZL | LT |
| `7` | `"RightTrigger"` | **Right Trigger** | RightTrigger | R2 | ZR | RT |
| `8` | `"Back"` | **Back** | Back | Minus | Options | Back |
| `9` | `"Start"` | **Start** | Start | Plus | Select | Start |
| `10` | `"LeftStick"` | **Left Stick** | LeftStick | L3 | LeftStick | LSB |
| `11` | `"RightStick"` | **Right Stick** | RightStick | R3 | RightStick | RSB |
| `12` | `"DPadUp"` | **D-Pad Up** | DPadUp | DPadUp | DPadUp | DPadUp |
| `13` | `"DPadDown"` | **D-Pad Down** | DPadDown | DPadDown | DPadDown | DPadDown |
| `14` | `"DPadLeft"` | **D-Pad Left** | DPadLeft | DPadLeft | DPadLeft | DPadLeft |
| `15` | `"DPadRight"` | **D-Pad Right** | DPadRight | DPadRight | DPadRight | DPadRight |

> [!CAUTION]
> ***Nintendo:** Both the labels and physical positions of the A,B,X,Y buttons are different
> on Nintendo controllers.
>
> Set `GamepadDevice.defaultOptions.remapNintendoMode` to apply the remapping as required.
>
> - `"physical"` _(default)_ &ndash; A,B,X,Y refer the physical layout of a standard controller (Left=X,Top=Y,Bottom=A,Right=B).
> - `"accurate"` &ndash; A,B,X,Y refer to the exact Nintendo labels (Left=Y,Top=X,Bottom=B,Right=A).
> - `"none"` &ndash; A,B,X,Y refer to the button indices 0,1,2,3 (Left=Y,Top=B,Bottom=X,Right=A).
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

#### Device assignment

You can assign IDs and other meta data using the `device.meta` dictionary.

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

#### Custom devices

You can add custom devices to the device manager:

```ts
// 1. subclass CustomDevice
class MySpecialDevice extends CustomDevice
{
    constructor() {
        super( "special-device" )
    }
}

// 2. add the device
const device = new MySpecialDevice();
InputDevice.add( device )
```
