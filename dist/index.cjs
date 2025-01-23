"use strict";const e=0,t=1,i=2,s=3,n=["LeftStickLeft","LeftStickRight","LeftStickUp","LeftStickDown","RightStickLeft","RightStickRight","RightStickUp","RightStickDown"],o={A:0,B:1,X:2,Y:3,LeftShoulder:4,RightShoulder:5,LeftTrigger:6,RightTrigger:7,Back:8,Start:9,LeftStickClick:10,RightStickClick:11,DPadUp:12,DPadDown:13,DPadLeft:14,DPadRight:15},a=["A","B","X","Y","LeftShoulder","RightShoulder","LeftTrigger","RightTrigger","Back","Start","LeftStickClick","RightStickClick","DPadUp","DPadDown","DPadLeft","DPadRight"];let r=new Map;function throttle(e,t){var i;const s=Date.now();return(null!==(i=r.get(e))&&void 0!==i?i:0)>s||(r.set(e,s+t),!1)}class EventEmitter{constructor(){this._listeners={}}hasListener(e){return void 0!==this._listeners[e]}emit(e,t){var i;null===(i=this._listeners[e])||void 0===i||i.forEach((e=>e(t)))}on(e,t,i){var s,n;if(this._listeners[e]||(this._listeners[e]=[]),null==i?void 0:i.once){const onceFn=i=>{t(i),this.off(e,onceFn)};null===(s=this._listeners[e])||void 0===s||s.push(onceFn)}else null===(n=this._listeners[e])||void 0===n||n.push(t)}off(e,t){var i,s;this._listeners[e]=void 0===t||null===(i=this._listeners[e])||void 0===i?void 0:i.filter((e=>e!==t)),0===(null===(s=this._listeners[e])||void 0===s?void 0:s.length)&&(this._listeners[e]=void 0)}}class GamepadDevice{static configureDefaultBinds(e){this.defaultOptions.binds=Object.assign(Object.assign({},this.defaultOptions.binds),e)}pressedBind(e){return void 0!==this.options.binds[e]&&this.pressedAny(this.options.binds[e])}pressedAny(e){for(let t=0;t<e.length;t++)if(this.button[e[t]])return!0;return!1}pressedAll(e){for(let t=0;t<e.length;t++)if(!this.button[e[t]])return!1;return!0}configureBinds(e){this.options.binds=Object.assign(Object.assign({},this.options.binds),e)}on(e,t,i){return this._emitter.on(e,t,i),this}off(e,t){return this._emitter.off(e,t),this}onBind(e,t,i){return this._bindEmitter.on(e,t,i),this}offBind(e,t){return this._bindEmitter.off(e,t),this}playVibration({duration:e=200,weakMagnitude:t=.5,strongMagnitude:i=.5,vibrationType:s="dual-rumble",rightTrigger:n=0,leftTrigger:o=0,startDelay:a=0}={}){if(!this.options.vibration.enabled)return;if(!this.source.vibrationActuator)return;const r=this.options.vibration.intensity;try{this.source.vibrationActuator.playEffect(s,{duration:e,startDelay:a,weakMagnitude:r*t,strongMagnitude:r*i,leftTrigger:r*o,rightTrigger:r*n})}catch(e){}}update(e,t){this.updatePresses(e,t),this.source=e}clear(){this.button=[...n,...a].reduce(((e,t)=>(e[t]=!1,e)),{})}constructor(e){this.source=e,this.type="gamepad",this.meta={},this.lastInteraction=performance.now(),this.options=JSON.parse(JSON.stringify(GamepadDevice.defaultOptions)),this.leftJoystick={x:0,y:0},this.rightJoystick={x:0,y:0},this.button=[...a,...n].reduce(((e,t)=>(e[t]=!1,e)),{}),this._emitter=new EventEmitter,this._bindEmitter=new EventEmitter,this.leftTrigger=0,this.rightTrigger=0,this.leftShoulder=0,this.rightShoulder=0,this.id="gamepad"+e.index,this.layout=function detectLayout(e){const t=(e.id||"").toLowerCase();return/(steam|28de)/.test(t)?"steam":/(logitech|046d|c216)/.test(t)?"logitech":/(nintendo|switch|joycon|057e)/.test(t)?"nintendo":/(dualshock|dualsense|sony|054c|0ce6|0810)/.test(t)?"playstation":/(xbox|xinput|045e|028e|0291|02a0|02a1|02ea|02ff)/.test(t)?"xbox":"standard"}(e)}updatePresses(r,d){var c,u,l,h,g,p,m;const v=this.options.joystick;for(let e=0;e<4;e++){const t=_scale(r.axes[e],v.deadzone),i=n[2*e+(t>0?1:0)];if(Math.abs(t)<v.threshold)this.button[i]=!1;else{const t=v.autoRepeatDelayMs[+this.button[i]];if(this.button[i]&&throttle(i,t))continue;this.button[i]=!0,this.lastInteraction=d,this._emitter.hasListener(i)&&this._emitter.emit(i,{device:this,axis:e,axisCode:i}),Object.entries(this.options.binds).forEach((([t,s])=>{if(!s.includes(i))return;const n={device:this,type:"axis",axis:e,axisCode:i,name:t};this._bindEmitter.emit(t,n),this._emitter.emit("bind",n)}))}}for(let e=0;e<16;e++){let t=e;"nintendo"===this.layout&&"none"!==this.options.nintendoRemapMode&&("physical"===this.options.nintendoRemapMode?t===o.B?t=o.A:t===o.A?t=o.B:t===o.X?t=o.Y:t===o.Y&&(t=o.X):t===o.B?t=o.X:t===o.X&&(t=o.B));const i=a[t];if(this.button[i]===(null===(c=r.buttons[e])||void 0===c?void 0:c.pressed))continue;this.lastInteraction=d;const s=null!==(l=null===(u=r.buttons[e])||void 0===u?void 0:u.pressed)&&void 0!==l&&l;this.button[i]=s,s&&(this._emitter.hasListener(i)&&this._emitter.emit(i,{device:this,button:t,buttonCode:i}),Object.entries(this.options.binds).forEach((([e,s])=>{if(!s.includes(i))return;const n={device:this,type:"button",button:t,buttonCode:i,name:e};this._bindEmitter.emit(e,n),this._emitter.emit("bind",n)})))}const f=this.options.trigger.deadzone;this.leftTrigger=_scale(r.buttons[o.LeftTrigger].value,f),this.rightTrigger=_scale(r.buttons[o.RightTrigger].value,f),this.leftShoulder=_scale(r.buttons[o.LeftShoulder].value,f),this.rightShoulder=_scale(r.buttons[o.RightShoulder].value,f);const y=v.deadzone;this.leftJoystick.x=_scale(null!==(h=r.axes[e])&&void 0!==h?h:0,y),this.leftJoystick.y=_scale(null!==(g=r.axes[t])&&void 0!==g?g:0,y),this.rightJoystick.x=_scale(null!==(p=r.axes[i])&&void 0!==p?p:0,y),this.rightJoystick.y=_scale(null!==(m=r.axes[s])&&void 0!==m?m:0,y)}}function _scale(e,t){const i=(Math.abs(e)-t[0])/(t[1]-t[0]);return i>=0&&i<=1?Math.sign(e)*i:i>1?1*Math.sign(e):0}GamepadDevice.defaultOptions={nintendoRemapMode:"physical",binds:{"navigate.back":["B","Back"],"navigate.down":["DPadDown","LeftStickDown"],"navigate.left":["DPadLeft","LeftStickLeft"],"navigate.right":["DPadRight","LeftStickRight"],"navigate.trigger":["A"],"navigate.up":["DPadUp","LeftStickUp"]},joystick:{deadzone:[0,1],threshold:.25,autoRepeatDelayMs:[400,80]},trigger:{deadzone:[0,1]},vibration:{enabled:!0,intensity:1}};const d={AltLeft:"AltLeft",AltRight:"AltRight",ArrowDown:"ArrowDown",ArrowLeft:"ArrowLeft",ArrowRight:"ArrowRight",ArrowUp:"ArrowUp",Backquote:"Backquote",Backslash:"Backslash",Backspace:"Backspace",BracketLeft:"BracketLeft",BracketRight:"BracketRight",CapsLock:"CapsLock",Comma:"Comma",ContextMenu:"ContextMenu",ControlLeft:"ControlLeft",ControlRight:"ControlRight",Delete:"Delete",Digit0:"Digit0",Digit1:"Digit1",Digit2:"Digit2",Digit3:"Digit3",Digit4:"Digit4",Digit5:"Digit5",Digit6:"Digit6",Digit7:"Digit7",Digit8:"Digit8",Digit9:"Digit9",End:"End",Enter:"Enter",Equal:"Equal",Escape:"Escape",F1:"F1",F10:"F10",F11:"F11",F12:"F12",F13:"F13",F14:"F14",F15:"F15",F16:"F16",F17:"F17",F18:"F18",F19:"F19",F2:"F2",F20:"F20",F21:"F21",F22:"F22",F23:"F23",F24:"F24",F25:"F25",F26:"F26",F27:"F27",F28:"F28",F29:"F29",F3:"F3",F30:"F30",F31:"F31",F32:"F32",F4:"F4",F5:"F5",F6:"F6",F7:"F7",F8:"F8",F9:"F9",Home:"Home",IntlBackslash:"IntlBackslash",IntlRo:"IntlRo",IntlYen:"IntlYen",KeyA:"KeyA",KeyB:"KeyB",KeyC:"KeyC",KeyD:"KeyD",KeyE:"KeyE",KeyF:"KeyF",KeyG:"KeyG",KeyH:"KeyH",KeyI:"KeyI",KeyJ:"KeyJ",KeyK:"KeyK",KeyL:"KeyL",KeyM:"KeyM",KeyN:"KeyN",KeyO:"KeyO",KeyP:"KeyP",KeyQ:"KeyQ",KeyR:"KeyR",KeyS:"KeyS",KeyT:"KeyT",KeyU:"KeyU",KeyV:"KeyV",KeyW:"KeyW",KeyX:"KeyX",KeyY:"KeyY",KeyZ:"KeyZ",Lang1:"Lang1",Lang2:"Lang2",MediaTrackNext:"MediaTrackNext",MediaTrackPrevious:"MediaTrackPrevious",MetaLeft:"MetaLeft",MetaRight:"MetaRight",Minus:"Minus",NumLock:"NumLock",Numpad0:"Numpad0",Numpad1:"Numpad1",Numpad2:"Numpad2",Numpad3:"Numpad3",Numpad4:"Numpad4",Numpad5:"Numpad5",Numpad6:"Numpad6",Numpad7:"Numpad7",Numpad8:"Numpad8",Numpad9:"Numpad9",NumpadAdd:"NumpadAdd",NumpadComma:"NumpadComma",NumpadDecimal:"NumpadDecimal",NumpadDivide:"NumpadDivide",NumpadMultiply:"NumpadMultiply",NumpadSubtract:"NumpadSubtract",OSLeft:"OSLeft",Pause:"Pause",Period:"Period",Quote:"Quote",ScrollLock:"ScrollLock",Semicolon:"Semicolon",ShiftLeft:"ShiftLeft",ShiftRight:"ShiftRight",Slash:"Slash",Space:"Space",Tab:"Tab",VolumeDown:"VolumeDown",VolumeMute:"VolumeMute",VolumeUp:"VolumeUp",WakeUp:"WakeUp"};function __awaiter(e,t,i,s){return new(i||(i=Promise))((function(n,o){function fulfilled(e){try{step(s.next(e))}catch(e){o(e)}}function rejected(e){try{step(s.throw(e))}catch(e){o(e)}}function step(e){e.done?n(e.value):function adopt(e){return e instanceof i?e:new i((function(t){t(e)}))}(e.value).then(fulfilled,rejected)}step((s=s.apply(e,t||[])).next())}))}let c,u;"function"==typeof SuppressedError&&SuppressedError;const l=["fr","mg","lu"],h=["ab","ba","be","bg","ch","kk","ky","mk","mn","ru","sr","tg","tt","uk","uz"],g=["de","cs","sk","sl","hu","hr","bs","ro","sq","me","lt","lv","et"],p=/ф|и|с|в|у|а|п|р|ш|о|л|д|ь|т|щ|з|й|к|ы|е|г|м|ц|ч|н|я|ё|х|ъ|б|ю|э|ж|и/i,m=/[a-z]/i;function inferKeyboardLayoutFromLang(e=function getLang(){var e;const t=navigator;return null!=(null===(e=t.languages)||void 0===e?void 0:e.length)?t.languages[0]:t.userLanguage||t.language||t.browserLanguage}()){const t=(e||"").toLowerCase(),i=t.split("-")[0];return l.includes(i)||t.startsWith("nl-be")?"AZERTY":h.includes(i)?"JCUKEN":g.includes(i)||t.startsWith("sr-latn")?"QWERTZ":"QWERTY"}const v=new Set(["AZERTY","JCUKEN","QWERTY","QWERTZ"]);function getLayoutKeyLabel(e,t){var i,s;if(void 0===u){const e={ArrowLeft:"⬅",ArrowRight:"➡",ArrowUp:"⬆",ArrowDown:"⬇",AltLeft:"Left Alt",AltRight:"Right Alt",Backquote:"`",Backslash:"\\",Backspace:"Backspace",BracketLeft:"[",BracketRight:"]",CapsLock:"CapsLock",Comma:",",ContextMenu:"Context Menu",ControlLeft:"Left Ctrl",ControlRight:"Right Ctrl",Delete:"Delete",Digit0:"0",Digit1:"1",Digit2:"2",Digit3:"3",Digit4:"4",Digit5:"5",Digit6:"6",Digit7:"7",Digit8:"8",Digit9:"9",End:"End",Enter:"Enter",Equal:"=",Escape:"Esc",F1:"F1",F2:"F2",F3:"F3",F4:"F4",F5:"F5",F6:"F6",F7:"F7",F8:"F8",F9:"F9",F10:"F10",F11:"F11",F12:"F12",F13:"F13",F14:"F14",F15:"F15",F16:"F16",F17:"F17",F18:"F18",F19:"F19",F20:"F20",F21:"F21",F22:"F22",F23:"F23",F24:"F24",F25:"F25",F26:"F26",F27:"F27",F28:"F28",F29:"F29",F30:"F30",F31:"F31",F32:"F32",Home:"Home",IntlBackslash:"\\",IntlRo:"Ro",IntlYen:"¥",KeyA:"A",KeyB:"B",KeyC:"C",KeyD:"D",KeyE:"E",KeyF:"F",KeyG:"G",KeyH:"H",KeyI:"I",KeyJ:"J",KeyK:"K",KeyL:"L",KeyM:"M",KeyN:"N",KeyO:"O",KeyP:"P",KeyQ:"Q",KeyR:"R",KeyS:"S",KeyT:"T",KeyU:"U",KeyV:"V",KeyW:"W",KeyX:"X",KeyY:"Y",KeyZ:"Z",Lang1:"Language 1",Lang2:"Language 2",MediaTrackNext:"Next Track",MediaTrackPrevious:"Previous Track",MetaLeft:"Left "+getMetaKeyLabel(),MetaRight:"Right "+getMetaKeyLabel(),Minus:"-",NumLock:"Num Lock",Numpad0:"Num0",Numpad1:"Num1",Numpad2:"Num2",Numpad3:"Num3",Numpad4:"Num4",Numpad5:"Num5",Numpad6:"Num6",Numpad7:"Num7",Numpad8:"Num8",Numpad9:"Num9",NumpadAdd:"+",NumpadComma:",",NumpadDecimal:".",NumpadDivide:"/",NumpadMultiply:"*",NumpadSubtract:"-",OSLeft:"OS Left",Pause:"Pause",Period:".",Quote:"'",ScrollLock:"Scroll Lock",Semicolon:";",ShiftLeft:"Left Shift",ShiftRight:"Right Shift",Slash:"/",Space:"Space",Tab:"Tab",VolumeDown:"Volume Down",VolumeMute:"Volume Mute",VolumeUp:"Volume Up",WakeUp:"Wake Up"};u={AZERTY:{KeyA:"Q",KeyQ:"A",KeyW:"Z",KeyZ:"W",Backquote:"²",BracketLeft:"«",BracketRight:"»"},JCUKEN:{KeyA:"Ф",KeyB:"И",KeyC:"С",KeyD:"В",KeyE:"У",KeyF:"А",KeyG:"П",KeyH:"Р",KeyI:"Ш",KeyJ:"О",KeyK:"Л",KeyL:"Д",KeyM:"Ь",KeyN:"Т",KeyO:"Щ",KeyP:"З",KeyQ:"Й",KeyR:"К",KeyS:"Ы",KeyT:"Е",KeyU:"Г",KeyV:"М",KeyW:"Ц",KeyX:"Ч",KeyY:"Н",KeyZ:"Я",Backquote:"Ё",BracketLeft:"х",BracketRight:"ъ",Comma:"Б",Period:"Ю",Quote:"Э",Semicolon:"Ж",Slash:"И"},QWERTY:e,QWERTZ:{KeyY:"Z",KeyZ:"Y",BracketLeft:"ü",BracketRight:"ö",Slash:"-"}}}return null!==(s=null!==(i=u[t][e])&&void 0!==i?i:u.QWERTY[e])&&void 0!==s?s:e}function getMetaKeyLabel(){var e,t,i,s;const n=navigator,o=null!==(t=null===(e=n.platform)||void 0===e?void 0:e.toLowerCase())&&void 0!==t?t:"",a=null!==(s=null===(i=n.userAgent)||void 0===i?void 0:i.toLowerCase())&&void 0!==s?s:"";return o.includes("mac")?"⌘":o.includes("win")||o.includes("linux")?"⊞":a.includes("android")?"Search":a.includes("iphone")||a.includes("ipad")?"⌘":"⊞"}class KeyboardDevice{constructor(){this.type="keyboard",this.id="keyboard",this.meta={},this.lastInteraction=performance.now(),this.detectLayoutOnKeypress=!0,this.detected=!1,this.options={binds:{"navigate.back":["Escape","Backspace"],"navigate.down":["ArrowDown","KeyS"],"navigate.left":["ArrowLeft","KeyA"],"navigate.right":["ArrowRight","KeyD"],"navigate.trigger":["Enter","Space"],"navigate.up":["ArrowUp","KeyW"]},repeatableBinds:["navigate.down","navigate.left","navigate.right","navigate.up"]},this.key=Object.keys(d).reduce(((e,t)=>(e[t]=!1,e)),{}),this._emitter=new EventEmitter,this._bindEmitter=new EventEmitter,this._deferredKeydown=[],this._layout=inferKeyboardLayoutFromLang(),this._layoutSource="lang",function requestKeyboardLayout(){return __awaiter(this,void 0,void 0,(function*(){const e=navigator;if(e.keyboard&&e.keyboard.getLayoutMap)try{const t=yield e.keyboard.getLayoutMap();c=t;const i=t.get("KeyQ"),s=t.get("KeyA"),n=t.get("KeyZ");if("a"===i&&"w"===n&&"q"===s)return"AZERTY";if("q"===i&&"y"===n&&"a"===s)return"QWERTZ";if("q"===i&&"z"===n&&"a"===s)return"QWERTY";if("й"===i&&"я"===n&&"ф"===s)return"JCUKEN"}catch(e){}}))}().then((e=>{void 0!==e&&(this._layoutSource="browser",this._layout=e,this.detectLayoutOnKeypress=!1,this._emitter.emit("layoutdetected",{layoutSource:"browser",layout:e,device:this}))})),this._configureEventListeners()}get layout(){return this._layout}set layout(e){this._layoutSource="manual",this._layout=e,this.detectLayoutOnKeypress=!1}get layoutSource(){return this._layoutSource}pressedBind(e){return void 0!==this.options.binds[e]&&this.pressedAny(this.options.binds[e])}pressedAny(e){for(let t=0;t<e.length;t++)if(this.key[e[t]])return!0;return!1}pressedAll(e){for(let t=0;t<e.length;t++)if(!this.key[e[t]])return!1;return!0}configureBinds(e){this.options.binds=Object.assign(Object.assign({},this.options.binds),e)}on(e,t,i){return this._emitter.on(e,t,i),this}off(e,t){return this._emitter.off(e,t),this}onBind(e,t,i){return this._bindEmitter.on(e,t,i),this}offBind(e,t){return this._bindEmitter.off(e,t),this}getKeyLabel(e,t){var i;return t?getLayoutKeyLabel(e,t):null!==(i=function getNavigatorKeyLabel(e){const t=null==c?void 0:c.get(e);return void 0===t?void 0:function _toLocaleTitleCase(e){return e.split(/\s+/).map((e=>e.charAt(0).toLocaleUpperCase()+e.slice(1))).join(" ")}(t)}(e))&&void 0!==i?i:getLayoutKeyLabel(e,null!=t?t:this._layout)}update(e){this._deferredKeydown.length>0&&(this._deferredKeydown.forEach((e=>this._processDeferredKeydownEvent(e))),this._deferredKeydown.length=0)}clear(){for(const e of Object.keys(d))this.key[e]=!1}_configureEventListeners(){const e=this.key,t=this._deferredKeydown;window.addEventListener("keydown",(i=>{e[i.code]=!0,t.push(i),this.lastInteraction=performance.now()}),{passive:!0,capture:!0}),window.addEventListener("keyup",(t=>{e[t.code]=!1,this.lastInteraction=performance.now()}),{passive:!0,capture:!0})}_processDeferredKeydownEvent(e){const t=e.code;if(!e.repeat){if(this.detectLayoutOnKeypress&&"lang"===this._layoutSource){const t=function detectKeyboardLayoutFromKeydown(e){const t=e.key.toLowerCase(),i=e.code;return p.test(t)?(v.delete("AZERTY"),v.delete("QWERTY"),v.delete("QWERTZ")):"Backquote"===i&&"²"===t||"BracketLeft"===i&&"«"===t||"BracketRight"===i&&"»"===t||"KeyA"===i&&"q"===t||"KeyQ"===i&&"a"===t||"KeyW"===i&&"z"===t||"KeyZ"===i&&"w"===t?(v.delete("JCUKEN"),v.delete("QWERTY"),v.delete("QWERTZ")):"BracketLeft"===i&&"ü"===t||"BracketRight"===i&&"ö"===t||"KeyY"===i&&"z"===t||"KeyZ"===i&&"y"===t||"Slash"===i&&"-"===t?(v.delete("AZERTY"),v.delete("JCUKEN"),v.delete("QWERTY")):"BracketLeft"===i&&"["===t||"BracketRight"===i&&"]"===t||"KeyZ"===i&&"z"===t?(v.delete("AZERTY"),v.delete("JCUKEN"),v.delete("QWERTZ")):"KeyQ"===i&&"q"===t||"KeyW"===i&&"w"===t?(v.delete("AZERTY"),v.delete("JCUKEN")):"KeyY"===i&&"y"===t?(v.delete("QWERTZ"),v.delete("JCUKEN")):m.test(t)&&v.delete("JCUKEN"),1===v.size?[...v][0]:void 0}(e);void 0!==t&&(this._layout=t,this._layoutSource="keypress",this.detectLayoutOnKeypress=!1,this._emitter.emit("layoutdetected",{layout:t,layoutSource:"keypress",device:this}))}this._emitter.hasListener(t)&&this._emitter.emit(t,{device:this,keyCode:t,keyLabel:this.getKeyLabel(t),event:e})}Object.entries(this.options.binds).forEach((([i,s])=>{if(!s.includes(t))return;if(e.repeat&&!this.options.repeatableBinds.includes(i))return;const n={device:this,keyCode:t,keyLabel:this.getKeyLabel(t),event:e,name:i,repeat:e.repeat};this._bindEmitter.emit(i,n),this._emitter.emit("bind",n)}))}}KeyboardDevice.global=new KeyboardDevice;class InputDeviceManager{constructor(){this.isMobile=(()=>{let e=!1;var t;return t=navigator.userAgent||navigator.vendor,(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(t)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(t.substr(0,4)))&&(e=!0),e})(),this.isTouchCapable=function isTouchCapable(){return"ontouchstart"in window||navigator.maxTouchPoints>0}(),this.options={requireFocus:!0,clearInputInBackground:!0},this._devices=[],this._gamepadDevices=[],this._gamepadDeviceMap=new Map,this._customDevices=[],this._emitter=new EventEmitter,this._bindEmitter=new EventEmitter,this._hasFocus=!1,this.keyboard=KeyboardDevice.global,this.isTouchCapable||this.isMobile?window.addEventListener("keydown",(()=>this.add(this.keyboard)),{once:!0}):this.add(this.keyboard),window.addEventListener("gamepadconnected",(()=>this._pollGamepads(performance.now()))),window.addEventListener("gamepaddisconnected",(e=>this._removeGamepad(e.gamepad.index)))}get devices(){return this._devices}get gamepads(){return this._gamepadDevices}get custom(){return this._customDevices}get lastInteractedDevice(){return this._lastInteractedDevice}on(e,t){return this._emitter.on(e,t),this}off(e,t){return this._emitter.off(e,t),this}onBind(e,t,i){return(e=Array.isArray(e)?e:[e]).forEach((e=>this._bindEmitter.on(e,t,i))),this}offBind(e,t){return(e=Array.isArray(e)?e:[e]).forEach((e=>this._bindEmitter.off(e,t))),this}emitBind(e){this._bindEmitter.emit(e.name,e)}add(e){-1===this._devices.indexOf(e)&&(this._devices.push(e),e instanceof KeyboardDevice?(e.detected=!0,e.on("bind",(e=>this.emitBind(e)))):e instanceof GamepadDevice?(this._gamepadDeviceMap.set(e.source.index,e),this._gamepadDevices.push(e),e.on("bind",(e=>this.emitBind(e)))):this._customDevices.push(e),this._emitter.emit("deviceadded",{device:e}))}remove(e){if(!(e instanceof KeyboardDevice||e instanceof GamepadDevice)){const t=this._customDevices.indexOf(e);-1!==t&&this._devices.splice(t,1)}const t=this._devices.indexOf(e);-1!==t&&(this._devices.splice(t,1),this._emitter.emit("deviceremoved",{device:e}))}update(){if(this.options.requireFocus&&!document.hasFocus())return this._hasFocus&&this.options.clearInputInBackground&&this.devices.forEach((e=>{var t;return null===(t=e.clear)||void 0===t?void 0:t.call(e)})),this._hasFocus=!1,this._devices;this._hasFocus=!0;const e=performance.now();return this.keyboard.detected&&this.keyboard.update(e),this._gamepadDevices.length>0&&this._pollGamepads(e),this._customDevices.length>0&&this._customDevices.forEach((t=>t.update(e))),this._updateLastInteracted(),this._devices}_updateLastInteracted(){if(0===this._devices.length)return;let e;if(1===this._devices.length)e=this._devices[0];else for(const t of this._devices)(void 0===e||t.lastInteraction>e.lastInteraction)&&(e=t);this._lastInteractedDevice=e}_pollGamepads(e){if(!document.hasFocus())return this._gamepadDevices;if(void 0===navigator.getGamepads)return this._gamepadDevices;for(const t of navigator.getGamepads())if(null!=t)if(this._gamepadDeviceMap.has(t.index)){this._gamepadDeviceMap.get(t.index).update(t,e)}else{const i=new GamepadDevice(t);this.add(i),i.update(t,e)}return this._gamepadDevices}_removeGamepad(e){const t=this._gamepadDeviceMap.get(e);if(!t)return;const i=this._gamepadDevices.indexOf(t);-1!==i&&this._gamepadDevices.splice(i,1),this.remove(t),this._gamepadDeviceMap.delete(e)}}InputDeviceManager.global=new InputDeviceManager;const f=InputDeviceManager.global;function getAllNavigatables(e,t=[]){var i;for(const s of null!==(i=e.children)&&void 0!==i?i:[])s.isNavigatable?t.push(s):getAllNavigatables(s,t);return t}function getFirstNavigatable(e,t,i,{minimumDistance:s=0}={}){return function chooseFirstNavigatableInDirection(e,t,i,s=0){var n,o,a,r,d,c,u,l,h;const g=e.filter((e=>e.isNavigatable&&null!=e.parent&&isVisible(e))),p=g.find((e=>e===t));if(void 0===p)return g.sort(((e,t)=>t.navigationPriority-e.navigationPriority)),g[0];if(void 0===i&&p)return p;const m=null!=p?p:g[Math.floor(Math.random()*g.length)];if(void 0===p)return null!==(n=e[0])&&void 0!==n?n:m;const v=p.getGlobalPosition(),f=p.getBounds(),y={x:v.x+f.left+f.width/2,y:v.y+f.top+f.height/2},b=g.filter((e=>e!==p)).map((e=>{const t=e.getGlobalPosition(),i=e.getBounds(),s={x:t.x+i.left+i.width/2,y:t.y+i.top+i.height/2};return{element:e,bounds:i,center:s,xDistSqrd:weightedDistSquared(s,y,1,3),yDistSqrd:weightedDistSquared(s,y,3,1)}}));switch(i){case"navigate.up":return null!==(a=null===(o=b.filter((e=>e.center.y<y.y-s)).sort(((e,t)=>e.yDistSqrd-t.yDistSqrd))[0])||void 0===o?void 0:o.element)&&void 0!==a?a:m;case"navigate.left":return null!==(d=null===(r=b.filter((e=>e.center.x<y.x-s)).sort(((e,t)=>e.xDistSqrd-t.xDistSqrd))[0])||void 0===r?void 0:r.element)&&void 0!==d?d:m;case"navigate.right":return null!==(u=null===(c=b.filter((e=>e.center.x>y.x+s)).sort(((e,t)=>e.xDistSqrd-t.xDistSqrd))[0])||void 0===c?void 0:c.element)&&void 0!==u?u:m;case"navigate.down":return null!==(h=null===(l=b.filter((e=>e.center.y>y.y+s)).sort(((e,t)=>e.yDistSqrd-t.yDistSqrd))[0])||void 0===l?void 0:l.element)&&void 0!==h?h:m;default:return p}}(getAllNavigatables(e),t,i,s)}function isChildOf(e,t){for(;null!=e;){if(e===t)return!0;e=e.parent}return!1}function weightedDistSquared(e,t,i,s){const n=t.x-e.x,o=t.y-e.y;return n*n*i+o*o*s}function isVisible(e){for(;null!=e;){if(!e.visible)return!1;e=e.parent}return!0}const y=["navigate.left","navigate.right","navigate.up","navigate.down","navigate.back","navigate.trigger"];class NavigationManager{constructor(){this.options={useFallbackHoverEffect:!0,minimumDirectionDistance:10},this.enabled=!1,this._responders=[]}get focusTarget(){var e,t;return null!==(t=null===(e=this.responders.find((e=>null!=e.focusTarget&&isVisible(e.focusTarget))))||void 0===e?void 0:e.focusTarget)&&void 0!==t?t:this._rootFocused}set focusTarget(e){const t=this.focusTarget;if(t===e)return;const i=this.getResponderStage();i&&(!e||e.isNavigatable&&isChildOf(e,i))&&(t&&this._emitBlur(t),e&&this._emitFocus(e),this.firstResponder?this.firstResponder.focusTarget=e:this._rootFocused=e)}get firstResponder(){return this._responders[0]}get responders(){return this._responders}configureWithRoot(e){null==this._root&&f.onBind(y,(e=>this._propagate(e))),this._root=e,this.enabled=!0}popResponder(){var e,t,i,s,n;const o=this.focusTarget,a=this._responders.shift();a.focusTarget=void 0;const r=this.focusTarget;return null===(e=null==a?void 0:a.resignedAsFirstResponder)||void 0===e||e.call(a),this._invalidateFocusedIfNeeded(),this.firstResponder&&(null===(i=(t=this.firstResponder).becameFirstResponder)||void 0===i||i.call(t)),o!==r&&(null!==(n=null===(s=this.firstResponder)||void 0===s?void 0:s.autoFocus)&&void 0!==n?n:void 0===r)&&this.autoFocus(),a}pushResponder(e){var t,i,s;const n=e;if(this._responders.includes(n))throw new Error("Responder already in stack.");const o=this.firstResponder;this._responders.unshift(n),null===(t=null==o?void 0:o.resignedAsFirstResponder)||void 0===t||t.call(o),this._invalidateFocusedIfNeeded(),null===(i=n.becameFirstResponder)||void 0===i||i.call(n),(null===(s=n.autoFocus)||void 0===s||s)&&this.autoFocus()}autoFocus(){if(!b.enabled)return;const e=this.getResponderStage();if(!e)return;const t=getFirstNavigatable(e);void 0!==t?t!==this.focusTarget&&(this.focusTarget=t):console.debug("navigation: no navigatable containers found")}getResponderStage(){var e;return null!==(e=this.responders.find(isContainer))&&void 0!==e?e:this._root}_propagate({device:e,name:t}){var i;if(this.enabled){for(const s of this._responders)if(null===(i=s.handledNavigationIntent)||void 0===i?void 0:i.call(s,t,e))return;if(null==this._root)throw this.enabled=!1,new Error("Navigation requires root responder to be configured");{const e=this.getResponderStage();this._handleGlobalIntent(e,t)}}}_handleGlobalIntent(e,t){var i;this._invalidateFocusedIfNeeded(e);const s=this.focusTarget;if(void 0===s)return void this.autoFocus();if("navigate.back"===t)return this._emitBlur(s),void(this.focusTarget=void 0);if("navigate.trigger"===t)return void this._emitTrigger(s);const n=null!==(i=getFirstNavigatable(e,s,t,{minimumDistance:this.options.minimumDirectionDistance}))&&void 0!==i?i:s;n!==s&&(this.focusTarget=n)}_emitBlur(e){const t=e.eventNames();t.includes("pointerout")?e.emit("pointerout"):t.includes("mouseout")?e.emit("mouseout"):this.options.useFallbackHoverEffect&&(e.alpha=1),e.emit("deviceout")}_emitFocus(e){const t=e.eventNames();t.includes("pointerover")?e.emit("pointerover"):t.includes("mouseover")?e.emit("mouseover"):this.options.useFallbackHoverEffect&&(e.alpha=.5),e.emit("deviceover")}_emitTrigger(e){const t=e.eventNames();t.includes("pointerdown")?e.emit("pointerdown"):t.includes("mousedown")?e.emit("mousedown"):this.options.useFallbackHoverEffect&&(e.alpha=.75),e.emit("devicedown")}_invalidateFocusedIfNeeded(e=this.getResponderStage()){if(!e)return;const t=this.focusTarget;t&&!isChildOf(t,e)&&(this._emitBlur(t),this.focusTarget=void 0)}}function isContainer(e){return"children"in e}NavigationManager.global=new NavigationManager;const b=NavigationManager.global;let K=!1;exports.Button=o,exports.GamepadDevice=GamepadDevice,exports.InputDevice=f,exports.KeyCode=d,exports.KeyboardDevice=KeyboardDevice,exports.UINavigation=b,exports.getAllNavigatables=getAllNavigatables,exports.getFirstNavigatable=getFirstNavigatable,exports.isChildOf=isChildOf,exports.isVisible=isVisible,exports.navigationIntents=y,exports.registerPixiJSNavigationMixin=function registerPixiJSNavigationMixin(e){if(K)return;K=!0;const t=e.prototype;t.navigationPriority=0,t.navigationMode="auto",Object.defineProperty(t,"isNavigatable",{get:function(){if("target"===this.navigationMode)return!0;if("none"===this.navigationMode)return!1;const e=this.eventNames();return e.includes("pointerdown")||e.includes("mousedown")},configurable:!0,enumerable:!1})};
//# sourceMappingURL=index.cjs.map
