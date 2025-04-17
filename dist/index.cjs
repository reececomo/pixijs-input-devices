"use strict";const e=0,t=1,i=2,n=3,s=["LeftStickLeft","LeftStickRight","LeftStickUp","LeftStickDown","RightStickLeft","RightStickRight","RightStickUp","RightStickDown"],o={Face1:0,Face2:1,Face3:2,Face4:3,LeftShoulder:4,RightShoulder:5,LeftTrigger:6,RightTrigger:7,Back:8,Start:9,LeftStickClick:10,RightStickClick:11,DpadUp:12,DpadDown:13,DpadLeft:14,DpadRight:15},a=["Face1","Face2","Face3","Face4","LeftShoulder","RightShoulder","LeftTrigger","RightTrigger","Back","Start","LeftStickClick","RightStickClick","DpadUp","DpadDown","DpadLeft","DpadRight"];class EventEmitter{constructor(){this._listeners={}}hasListener(e){return void 0!==this._listeners[e]}emit(e,t){var i;null===(i=this._listeners[e])||void 0===i||i.forEach((e=>e(t)))}on(e,t,i){var n,s;if(this._listeners[e]||(this._listeners[e]=[]),null==i?void 0:i.once){const onceFn=i=>{t(i),this.off(e,onceFn)};null===(n=this._listeners[e])||void 0===n||n.push(onceFn)}else null===(s=this._listeners[e])||void 0===s||s.push(t)}off(e,t){var i,n;this._listeners[e]=void 0===t||null===(i=this._listeners[e])||void 0===i?void 0:i.filter((e=>e!==t)),0===(null===(n=this._listeners[e])||void 0===n?void 0:n.length)&&(this._listeners[e]=void 0)}}class GamepadDevice{static configureDefaultBinds(e){this.defaultOptions.binds=Object.assign(Object.assign({},this.defaultOptions.binds),e)}bindDown(e){return void 0!==this.options.binds[e]&&this.pressedAny(this.options.binds[e])}pressedAny(e){for(let t=0;t<e.length;t++)if(this.button[e[t]])return!0;return!1}pressedAll(e){for(let t=0;t<e.length;t++)if(!this.button[e[t]])return!1;return!0}configureBinds(e){this.options.binds=Object.assign(Object.assign({},this.options.binds),e)}on(e,t,i){return this._emitter.on(e,t,i),this}off(e,t){return this._emitter.off(e,t),this}onBindDown(e,t,i){return this._bindDownEmitter.on(e,t,i),this}offBindDown(e,t){return this._bindDownEmitter.off(e,t),this}playHaptic({duration:e,weakMagnitude:t,strongMagnitude:i,vibrationType:n,rightTrigger:s,leftTrigger:o,startDelay:a}){if(!this.isVibrationCapable)return;if(!this.options.vibration.enabled)return;const r=this.options.vibration.intensity;this.source.vibrationActuator.playEffect(null!=n?n:"dual-rumble",{duration:e,startDelay:null!=a?a:0,weakMagnitude:r*(null!=t?t:0),strongMagnitude:r*(null!=i?i:0),leftTrigger:r*(null!=o?o:0),rightTrigger:r*(null!=s?s:0)})}update(e,t){this._updatePresses(e,t),this.source=e}clear(){this.button=[...s,...a].reduce(((e,t)=>(e[t]=!1,e)),{})}constructor(e){var t;this.source=e,this.type="gamepad",this.isVibrationCapable="vibrationActuator"in this.source,this.meta={},this.lastInteraction=performance.now(),this.options=JSON.parse(JSON.stringify(GamepadDevice.defaultOptions)),this.leftJoystick={x:0,y:0},this.rightJoystick={x:0,y:0},this.button=[...a,...s].reduce(((e,t)=>(e[t]=!1,e)),{}),this.leftTrigger=0,this.rightTrigger=0,this.leftShoulder=0,this.rightShoulder=0,this._emitter=new EventEmitter,this._bindDownEmitter=new EventEmitter,this._debounces=new Map,this.id="gamepad"+e.index,this.layout=null!==(t=function detectLayout(e){const t=(e||"").toLowerCase();return/(amazon|luna|1949)/.test(t)?"amazon_luna":/(logitech|046d|c216|logicool|^46d)/.test(t)?"logitech_g":/(joy-?con.*l|057e.*2006)/.test(t)?"nintendo_joycon_l":/(joy-?con.*r|057e.*2007)/.test(t)?"nintendo_joycon_r":/(wiiu?|0305|0306|0337)/.test(t)?"nintendo_wiiu":/(switch.*pro|nintendo|switch|057e|0300)/.test(t)?"nintendo_switch_pro":/(nvidia.*shield|nvidia|shield|0955)/.test(t)?"nvidia_shield":/(playstation.*5|dualsense|0df2|0ce6)/.test(t)?"playstation_5":/(playstation|sony|dualshock|054c|09cc|0ba0|0810)/.test(t)?"playstation_4":/(steam.*controller|steam|28de|1102|1142)/.test(t)?"steam_controller":/(xbox.*series|0b00|0b12)/.test(t)?"xbox_series":/(xbox.*360|0202|0283|0285|0288|0289|028e|028f|0291|0719)/.test(t)?"xbox_360":/(xbox|xinput|045e)/.test(t)?"xbox_one":void 0}(null==e?void 0:e.id))&&void 0!==t?t:"unknown"}_updatePresses(r,d){var c,l,u,h,g,p,m;const v=this.options.joystick;for(let e=0;e<4;e++){const t=_scale(r.axes[e],v.deadzone),i=s[2*e+(t>0?1:0)];if(Math.abs(t)<v.pressThreshold)this.button[i]||this._debounces.delete(i),this.button[i]=!1;else{const t=v.autoRepeatDelayMs[+this.button[i]];if(this._debounce(i,t)&&this.button[i])continue;this.button[i]=!0,this.lastInteraction=d,this.options.emitEvents&&(this._emitter.hasListener(i)&&this._emitter.emit(i,{device:this,axis:e,axisCode:i}),Object.entries(this.options.binds).forEach((([t,n])=>{if(!n.includes(i))return;const s={device:this,type:"axis",axis:e,axisCode:i,name:t};this._bindDownEmitter.emit(t,s),this._emitter.emit("binddown",s)})))}}for(let e=0;e<16;e++){let t=e;const i=a[t];if(this.button[i]===(null===(c=r.buttons[e])||void 0===c?void 0:c.pressed))continue;this.lastInteraction=d;const n=null!==(u=null===(l=r.buttons[e])||void 0===l?void 0:l.pressed)&&void 0!==u&&u;this.button[i]=n,n&&this.options.emitEvents&&(this._emitter.hasListener(i)&&this._emitter.emit(i,{device:this,button:t,buttonCode:i}),Object.entries(this.options.binds).forEach((([e,n])=>{if(!n.includes(i))return;const s={device:this,type:"button",button:t,buttonCode:i,name:e};this._bindDownEmitter.emit(e,s),this._emitter.emit("binddown",s)})))}const f=this.options.trigger.deadzone;this.leftTrigger=_scale(r.buttons[o.LeftTrigger].value,f),this.rightTrigger=_scale(r.buttons[o.RightTrigger].value,f),this.leftShoulder=_scale(r.buttons[o.LeftShoulder].value,f),this.rightShoulder=_scale(r.buttons[o.RightShoulder].value,f);const y=v.deadzone;this.leftJoystick.x=_scale(null!==(h=r.axes[e])&&void 0!==h?h:0,y),this.leftJoystick.y=_scale(null!==(g=r.axes[t])&&void 0!==g?g:0,y),this.rightJoystick.x=_scale(null!==(p=r.axes[i])&&void 0!==p?p:0,y),this.rightJoystick.y=_scale(null!==(m=r.axes[n])&&void 0!==m?m:0,y)}_debounce(e,t){var i;const n=Date.now();return(null!==(i=this._debounces.get(e))&&void 0!==i?i:0)>n||(this._debounces.set(e,n+t),!1)}}function _scale(e,t){const i=(Math.abs(e)-t[0])/(t[1]-t[0]);return i>=0&&i<=1?Math.sign(e)*i:i>1?1*Math.sign(e):0}GamepadDevice.defaultOptions={emitEvents:!0,joystick:{deadzone:[0,1],pressThreshold:.5,autoRepeatDelayMs:[400,100]},trigger:{deadzone:[0,1]},vibration:{enabled:!0,intensity:1},binds:{"navigate.trigger":["Face1"],"navigate.back":["Face2"],"navigate.up":["DpadUp","LeftStickUp"],"navigate.left":["DpadLeft","LeftStickLeft"],"navigate.down":["DpadDown","LeftStickDown"],"navigate.right":["DpadRight","LeftStickRight"]}};const r={AltLeft:"AltLeft",AltRight:"AltRight",ArrowDown:"ArrowDown",ArrowLeft:"ArrowLeft",ArrowRight:"ArrowRight",ArrowUp:"ArrowUp",Backquote:"Backquote",Backslash:"Backslash",Backspace:"Backspace",BracketLeft:"BracketLeft",BracketRight:"BracketRight",CapsLock:"CapsLock",Comma:"Comma",ContextMenu:"ContextMenu",ControlLeft:"ControlLeft",ControlRight:"ControlRight",Delete:"Delete",Digit0:"Digit0",Digit1:"Digit1",Digit2:"Digit2",Digit3:"Digit3",Digit4:"Digit4",Digit5:"Digit5",Digit6:"Digit6",Digit7:"Digit7",Digit8:"Digit8",Digit9:"Digit9",End:"End",Enter:"Enter",Equal:"Equal",Escape:"Escape",F1:"F1",F10:"F10",F11:"F11",F12:"F12",F13:"F13",F14:"F14",F15:"F15",F16:"F16",F17:"F17",F18:"F18",F19:"F19",F2:"F2",F20:"F20",F21:"F21",F22:"F22",F23:"F23",F24:"F24",F25:"F25",F26:"F26",F27:"F27",F28:"F28",F29:"F29",F3:"F3",F30:"F30",F31:"F31",F32:"F32",F4:"F4",F5:"F5",F6:"F6",F7:"F7",F8:"F8",F9:"F9",Home:"Home",IntlBackslash:"IntlBackslash",IntlRo:"IntlRo",IntlYen:"IntlYen",KeyA:"KeyA",KeyB:"KeyB",KeyC:"KeyC",KeyD:"KeyD",KeyE:"KeyE",KeyF:"KeyF",KeyG:"KeyG",KeyH:"KeyH",KeyI:"KeyI",KeyJ:"KeyJ",KeyK:"KeyK",KeyL:"KeyL",KeyM:"KeyM",KeyN:"KeyN",KeyO:"KeyO",KeyP:"KeyP",KeyQ:"KeyQ",KeyR:"KeyR",KeyS:"KeyS",KeyT:"KeyT",KeyU:"KeyU",KeyV:"KeyV",KeyW:"KeyW",KeyX:"KeyX",KeyY:"KeyY",KeyZ:"KeyZ",Lang1:"Lang1",Lang2:"Lang2",MediaTrackNext:"MediaTrackNext",MediaTrackPrevious:"MediaTrackPrevious",MetaLeft:"MetaLeft",MetaRight:"MetaRight",Minus:"Minus",NumLock:"NumLock",Numpad0:"Numpad0",Numpad1:"Numpad1",Numpad2:"Numpad2",Numpad3:"Numpad3",Numpad4:"Numpad4",Numpad5:"Numpad5",Numpad6:"Numpad6",Numpad7:"Numpad7",Numpad8:"Numpad8",Numpad9:"Numpad9",NumpadAdd:"NumpadAdd",NumpadComma:"NumpadComma",NumpadDecimal:"NumpadDecimal",NumpadDivide:"NumpadDivide",NumpadMultiply:"NumpadMultiply",NumpadSubtract:"NumpadSubtract",OSLeft:"OSLeft",Pause:"Pause",Period:"Period",Quote:"Quote",ScrollLock:"ScrollLock",Semicolon:"Semicolon",ShiftLeft:"ShiftLeft",ShiftRight:"ShiftRight",Slash:"Slash",Space:"Space",Tab:"Tab",VolumeDown:"VolumeDown",VolumeMute:"VolumeMute",VolumeUp:"VolumeUp",WakeUp:"WakeUp"};function __awaiter(e,t,i,n){return new(i||(i=Promise))((function(s,o){function fulfilled(e){try{step(n.next(e))}catch(e){o(e)}}function rejected(e){try{step(n.throw(e))}catch(e){o(e)}}function step(e){e.done?s(e.value):function adopt(e){return e instanceof i?e:new i((function(t){t(e)}))}(e.value).then(fulfilled,rejected)}step((n=n.apply(e,t||[])).next())}))}"function"==typeof SuppressedError&&SuppressedError;const d=/ф|и|с|в|у|а|п|р|ш|о|л|д|ь|т|щ|з|й|к|ы|е|г|м|ц|ч|н|я|ё|х|ъ|б|ю|э|ж|и/i,c=/[a-z]/i,l=["fr","mg","lu"],u=["ab","ba","be","bg","ch","kk","ky","mk","mn","ru","sr","tg","tt","uk","uz"],h=["de","cs","sk","sl","hu","hr","bs","ro","sq","me","lt","lv","et"];let g,p;function inferKeyboardLayoutFromLang(e=function getLang(){var e;const t=navigator;return(null===(e=t.languages)||void 0===e?void 0:e.length)?t.languages[0]:t.userLanguage||t.language||t.browserLanguage}()){const t=(e||"").toLowerCase(),i=t.split("-")[0];return l.includes(i)||t.startsWith("nl-be")?"AZERTY":u.includes(i)?"JCUKEN":h.includes(i)||t.startsWith("sr-latn")?"QWERTZ":"QWERTY"}const m=new Set(["AZERTY","JCUKEN","QWERTY","QWERTZ"]);function getLayoutKeyLabel(e,t){var i,n;if(void 0===p){const e={ArrowLeft:"⬅",ArrowRight:"➡",ArrowUp:"⬆",ArrowDown:"⬇",AltLeft:"Left Alt",AltRight:"Right Alt",Backquote:"`",Backslash:"\\",Backspace:"Backspace",BracketLeft:"[",BracketRight:"]",CapsLock:"CapsLock",Comma:",",ContextMenu:"Context Menu",ControlLeft:"Left Ctrl",ControlRight:"Right Ctrl",Delete:"Delete",Digit0:"0",Digit1:"1",Digit2:"2",Digit3:"3",Digit4:"4",Digit5:"5",Digit6:"6",Digit7:"7",Digit8:"8",Digit9:"9",End:"End",Enter:"Enter",Equal:"=",Escape:"Esc",F1:"F1",F2:"F2",F3:"F3",F4:"F4",F5:"F5",F6:"F6",F7:"F7",F8:"F8",F9:"F9",F10:"F10",F11:"F11",F12:"F12",F13:"F13",F14:"F14",F15:"F15",F16:"F16",F17:"F17",F18:"F18",F19:"F19",F20:"F20",F21:"F21",F22:"F22",F23:"F23",F24:"F24",F25:"F25",F26:"F26",F27:"F27",F28:"F28",F29:"F29",F30:"F30",F31:"F31",F32:"F32",Home:"Home",IntlBackslash:"\\",IntlRo:"Ro",IntlYen:"¥",KeyA:"A",KeyB:"B",KeyC:"C",KeyD:"D",KeyE:"E",KeyF:"F",KeyG:"G",KeyH:"H",KeyI:"I",KeyJ:"J",KeyK:"K",KeyL:"L",KeyM:"M",KeyN:"N",KeyO:"O",KeyP:"P",KeyQ:"Q",KeyR:"R",KeyS:"S",KeyT:"T",KeyU:"U",KeyV:"V",KeyW:"W",KeyX:"X",KeyY:"Y",KeyZ:"Z",Lang1:"Language 1",Lang2:"Language 2",MediaTrackNext:"Next Track",MediaTrackPrevious:"Previous Track",MetaLeft:"Left "+getMetaKeyLabel(),MetaRight:"Right "+getMetaKeyLabel(),Minus:"-",NumLock:"Num Lock",Numpad0:"Num0",Numpad1:"Num1",Numpad2:"Num2",Numpad3:"Num3",Numpad4:"Num4",Numpad5:"Num5",Numpad6:"Num6",Numpad7:"Num7",Numpad8:"Num8",Numpad9:"Num9",NumpadAdd:"+",NumpadComma:",",NumpadDecimal:".",NumpadDivide:"/",NumpadMultiply:"*",NumpadSubtract:"-",OSLeft:"OS Left",Pause:"Pause",Period:".",Quote:"'",ScrollLock:"Scroll Lock",Semicolon:";",ShiftLeft:"Left Shift",ShiftRight:"Right Shift",Slash:"/",Space:"Space",Tab:"Tab",VolumeDown:"Volume Down",VolumeMute:"Volume Mute",VolumeUp:"Volume Up",WakeUp:"Wake Up"};p={AZERTY:{KeyA:"Q",KeyQ:"A",KeyW:"Z",KeyZ:"W",Backquote:"²",BracketLeft:"«",BracketRight:"»"},JCUKEN:{KeyA:"Ф",KeyB:"И",KeyC:"С",KeyD:"В",KeyE:"У",KeyF:"А",KeyG:"П",KeyH:"Р",KeyI:"Ш",KeyJ:"О",KeyK:"Л",KeyL:"Д",KeyM:"Ь",KeyN:"Т",KeyO:"Щ",KeyP:"З",KeyQ:"Й",KeyR:"К",KeyS:"Ы",KeyT:"Е",KeyU:"Г",KeyV:"М",KeyW:"Ц",KeyX:"Ч",KeyY:"Н",KeyZ:"Я",Backquote:"Ё",BracketLeft:"х",BracketRight:"ъ",Comma:"Б",Period:"Ю",Quote:"Э",Semicolon:"Ж",Slash:"И"},QWERTY:e,QWERTZ:{KeyY:"Z",KeyZ:"Y",BracketLeft:"ü",BracketRight:"ö",Slash:"-"}}}return null!==(n=null!==(i=p[t][e])&&void 0!==i?i:p.QWERTY[e])&&void 0!==n?n:e}function getMetaKeyLabel(){var e,t,i,n;const s=navigator,o=null!==(t=null===(e=s.platform)||void 0===e?void 0:e.toLowerCase())&&void 0!==t?t:"",a=null!==(n=null===(i=s.userAgent)||void 0===i?void 0:i.toLowerCase())&&void 0!==n?n:"";return o.includes("mac")?"⌘":o.includes("win")||o.includes("linux")?"⊞":a.includes("android")?"Search":a.includes("iphone")||a.includes("ipad")?"⌘":"⊞"}class KeyboardDevice{constructor(){this.type="keyboard",this.id="keyboard",this.meta={},this.lastInteraction=performance.now(),this.detected=!1,this.options={emitEvents:!0,detectLayoutOnKeypress:!0,binds:{"navigate.back":["Escape","Backspace"],"navigate.down":["ArrowDown","KeyS"],"navigate.left":["ArrowLeft","KeyA"],"navigate.right":["ArrowRight","KeyD"],"navigate.trigger":["Enter","Space"],"navigate.up":["ArrowUp","KeyW"]},repeatableBinds:["navigate.down","navigate.left","navigate.right","navigate.up"]},this.key=Object.keys(r).reduce(((e,t)=>(e[t]=!1,e)),{}),this._emitter=new EventEmitter,this._bindDownEmitter=new EventEmitter,this._deferredKeydown=[],this._layout=inferKeyboardLayoutFromLang(),this._layoutSource="lang",function requestKeyboardLayout(){return __awaiter(this,void 0,void 0,(function*(){const e=navigator;if(e.keyboard&&e.keyboard.getLayoutMap)try{const t=yield e.keyboard.getLayoutMap();g=t;const i=t.get("KeyQ"),n=t.get("KeyA"),s=t.get("KeyZ");if("a"===i&&"w"===s&&"q"===n)return"AZERTY";if("q"===i&&"y"===s&&"a"===n)return"QWERTZ";if("q"===i&&"z"===s&&"a"===n)return"QWERTY";if("й"===i&&"я"===s&&"ф"===n)return"JCUKEN"}catch(e){}}))}().then((e=>{void 0!==e&&(this._layoutSource="browser",this._layout=e,this.options.detectLayoutOnKeypress=!1,this._emitter.emit("layoutdetected",{layoutSource:"browser",layout:e,device:this}))})),this._configureEventListeners()}get layout(){return this._layout}set layout(e){this._layoutSource="manual",this._layout=e,this.options.detectLayoutOnKeypress=!1}get layoutSource(){return this._layoutSource}bindDown(e){return void 0!==this.options.binds[e]&&this.pressedAny(this.options.binds[e])}pressedAny(e){for(let t=0;t<e.length;t++)if(this.key[e[t]])return!0;return!1}pressedAll(e){for(let t=0;t<e.length;t++)if(!this.key[e[t]])return!1;return!0}configureBinds(e){this.options.binds=Object.assign(Object.assign({},this.options.binds),e)}playHaptic(e){}on(e,t,i){return this._emitter.on(e,t,i),this}off(e,t){return this._emitter.off(e,t),this}onBindDown(e,t,i){return this._bindDownEmitter.on(e,t,i),this}offBindDown(e,t){return this._bindDownEmitter.off(e,t),this}getKeyLabel(e,t){var i;return t?getLayoutKeyLabel(e,t):null!==(i=function getNavigatorKeyLabel(e){const t=null==g?void 0:g.get(e);return void 0===t?void 0:function _toLocaleTitleCase(e){return e.split(/\s+/).map((e=>e.charAt(0).toLocaleUpperCase()+e.slice(1))).join(" ")}(t)}(e))&&void 0!==i?i:getLayoutKeyLabel(e,null!=t?t:this._layout)}update(e){this._deferredKeydown.length>0&&(this._deferredKeydown.forEach((e=>this._processDeferredKeydownEvent(e))),this._deferredKeydown.length=0)}clear(){for(const e of Object.keys(r))this.key[e]=!1}_configureEventListeners(){const e=this.key,t=this._deferredKeydown;window.addEventListener("keydown",(i=>{e[i.code]=!0,t.push(i),this.lastInteraction=performance.now()}),{passive:!0,capture:!0}),window.addEventListener("keyup",(t=>{e[t.code]=!1,this.lastInteraction=performance.now()}),{passive:!0,capture:!0})}_processDeferredKeydownEvent(e){const t=e.code;if(!e.repeat){if(this.options.detectLayoutOnKeypress&&"lang"===this._layoutSource){const t=function detectKeyboardLayoutFromKeydown(e){const t=e.key.toLowerCase(),i=e.code;return d.test(t)?(m.delete("AZERTY"),m.delete("QWERTY"),m.delete("QWERTZ")):"Backquote"===i&&"²"===t||"BracketLeft"===i&&"«"===t||"BracketRight"===i&&"»"===t||"KeyA"===i&&"q"===t||"KeyQ"===i&&"a"===t||"KeyW"===i&&"z"===t||"KeyZ"===i&&"w"===t?(m.delete("JCUKEN"),m.delete("QWERTY"),m.delete("QWERTZ")):"BracketLeft"===i&&"ü"===t||"BracketRight"===i&&"ö"===t||"KeyY"===i&&"z"===t||"KeyZ"===i&&"y"===t||"Slash"===i&&"-"===t?(m.delete("AZERTY"),m.delete("JCUKEN"),m.delete("QWERTY")):"BracketLeft"===i&&"["===t||"BracketRight"===i&&"]"===t||"KeyZ"===i&&"z"===t?(m.delete("AZERTY"),m.delete("JCUKEN"),m.delete("QWERTZ")):"KeyQ"===i&&"q"===t||"KeyW"===i&&"w"===t?(m.delete("AZERTY"),m.delete("JCUKEN")):"KeyY"===i&&"y"===t?(m.delete("QWERTZ"),m.delete("JCUKEN")):c.test(t)&&m.delete("JCUKEN"),1===m.size?[...m][0]:void 0}(e);void 0!==t&&(this._layout=t,this._layoutSource="keypress",this.options.detectLayoutOnKeypress=!1,this._emitter.emit("layoutdetected",{layout:t,layoutSource:"keypress",device:this}))}this.options.emitEvents&&this._emitter.hasListener(t)&&this._emitter.emit(t,{device:this,keyCode:t,keyLabel:this.getKeyLabel(t),event:e})}this.options.emitEvents&&Object.entries(this.options.binds).forEach((([i,n])=>{if(!n.includes(t))return;if(e.repeat&&!this.options.repeatableBinds.includes(i))return;const s={device:this,keyCode:t,keyLabel:this.getKeyLabel(t),event:e,name:i,repeat:e.repeat};this._bindDownEmitter.emit(i,s),this._emitter.emit("binddown",s)}))}}KeyboardDevice.global=new KeyboardDevice;class InputDeviceManager{constructor(){this.hasMouseLikePointer=window.matchMedia("(pointer: fine) and (hover: hover)").matches,this.isMobile=(()=>{let e=!1;var t;return t=navigator.userAgent||navigator.vendor,(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(t)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(t.substr(0,4)))&&(e=!0),e})(),this.isTouchCapable="ontouchstart"in window||navigator.maxTouchPoints>0,this.keyboard=KeyboardDevice.global,this.options={clearInputOnBackground:!0,requireDocumentFocus:!0},this._devices=[],this._gamepadDevices=[],this._gamepadDeviceMap=new Map,this._customDevices=[],this._emitter=new EventEmitter,this._bindDownEmitter=new EventEmitter,this._hasFocus=!1,window.addEventListener("gamepadconnected",(()=>this._pollGamepads(performance.now()))),window.addEventListener("gamepaddisconnected",(e=>this._removeGamepad(e.gamepad.index))),!this.isMobile&&this.hasMouseLikePointer?this.add(this.keyboard):window.addEventListener("keydown",(()=>this.add(this.keyboard)),{once:!0})}get devices(){return this._devices}get gamepads(){return this._gamepadDevices}get custom(){return this._customDevices}get lastInteractedDevice(){return this._lastInteractedDevice}on(e,t){return this._emitter.on(e,t),this}off(e,t){return this._emitter.off(e,t),this}onBindDown(e,t,i){return(e=Array.isArray(e)?e:[e]).forEach((e=>this._bindDownEmitter.on(e,t,i))),this}offBindDown(e,t){return(e=Array.isArray(e)?e:[e]).forEach((e=>this._bindDownEmitter.off(e,t))),this}emitBindDown(e){this._bindDownEmitter.emit(e.name,e)}add(e){-1===this._devices.indexOf(e)&&(this._devices.push(e),e instanceof KeyboardDevice?(e.detected=!0,e.on("binddown",(e=>this.emitBindDown(e)))):e instanceof GamepadDevice?(this._gamepadDeviceMap.set(e.source.index,e),this._gamepadDevices.push(e),e.on("binddown",(e=>this.emitBindDown(e)))):this._customDevices.push(e),this._emitter.emit("deviceadded",{device:e}))}remove(e){if(!(e instanceof KeyboardDevice||e instanceof GamepadDevice)){const t=this._customDevices.indexOf(e);-1!==t&&this._customDevices.splice(t,1)}const t=this._devices.indexOf(e);-1!==t&&(this._devices.splice(t,1),this._emitter.emit("deviceremoved",{device:e}))}update(){if(this.options.requireDocumentFocus&&!document.hasFocus())return this._hasFocus&&this.options.clearInputOnBackground&&this.devices.forEach((e=>{var t;return null===(t=e.clear)||void 0===t?void 0:t.call(e)})),this._hasFocus=!1,this._devices;this._hasFocus=!0;const e=performance.now();return this.keyboard.detected&&this.keyboard.update(e),this._gamepadDevices.length>0&&this._pollGamepads(e),this._customDevices.length>0&&this._customDevices.forEach((t=>t.update(e))),this._updateLastInteracted(),this._devices}_updateLastInteracted(){if(0===this._devices.length)return;let e;if(1===this._devices.length)e=this._devices[0];else for(const t of this._devices)(void 0===e||t.lastInteraction>e.lastInteraction)&&(e=t);e!==this._lastInteractedDevice&&this._emitter.emit("lastdevicechanged",{device:e}),this._lastInteractedDevice=e}_pollGamepads(e){if(!document.hasFocus())return this._gamepadDevices;if(void 0===navigator.getGamepads)return this._gamepadDevices;for(const t of navigator.getGamepads())if(null!=t)if(this._gamepadDeviceMap.has(t.index)){this._gamepadDeviceMap.get(t.index).update(t,e)}else{const i=new GamepadDevice(t);this.add(i),i.update(t,e)}return this._gamepadDevices}_removeGamepad(e){const t=this._gamepadDeviceMap.get(e);if(!t)return;const i=this._gamepadDevices.indexOf(t);-1!==i&&this._gamepadDevices.splice(i,1),this.remove(t),this._gamepadDeviceMap.delete(e)}}InputDeviceManager.global=new InputDeviceManager;const v=InputDeviceManager.global;function getAllNavigatables(e,t=[]){var i;for(const n of null!==(i=e.children)&&void 0!==i?i:[])n.isNavigatable?t.push(n):getAllNavigatables(n,t);return t}function getFirstNavigatable(e,t,i,{minimumDistance:n=0}={}){return function chooseFirstNavigatableInDirection(e,t,i,n=0){var s,o,a,r,d,c,l,u,h;const g=e.filter((e=>e.isNavigatable&&null!=e.parent&&isVisible(e))),p=g.find((e=>e===t));if(void 0===p)return g.sort(((e,t)=>t.navigationPriority-e.navigationPriority)),g[0];if(void 0===i&&p)return p;const m=null!=p?p:g[Math.floor(Math.random()*g.length)];if(void 0===p)return null!==(s=e[0])&&void 0!==s?s:m;const v=p.getGlobalPosition(),f=p.getBounds(),y={x:v.x+f.left+f.width/2,y:v.y+f.top+f.height/2},b=g.filter((e=>e!==p)).map((e=>{const t=e.getGlobalPosition(),i=e.getBounds(),n={x:t.x+i.left+i.width/2,y:t.y+i.top+i.height/2};return{element:e,bounds:i,center:n,xDistSqrd:weightedDistSquared(n,y,1,3),yDistSqrd:weightedDistSquared(n,y,3,1)}}));switch(i){case"navigate.up":return null!==(a=null===(o=b.filter((e=>e.center.y<y.y-n)).sort(((e,t)=>e.yDistSqrd-t.yDistSqrd))[0])||void 0===o?void 0:o.element)&&void 0!==a?a:m;case"navigate.left":return null!==(d=null===(r=b.filter((e=>e.center.x<y.x-n)).sort(((e,t)=>e.xDistSqrd-t.xDistSqrd))[0])||void 0===r?void 0:r.element)&&void 0!==d?d:m;case"navigate.right":return null!==(l=null===(c=b.filter((e=>e.center.x>y.x+n)).sort(((e,t)=>e.xDistSqrd-t.xDistSqrd))[0])||void 0===c?void 0:c.element)&&void 0!==l?l:m;case"navigate.down":return null!==(h=null===(u=b.filter((e=>e.center.y>y.y+n)).sort(((e,t)=>e.yDistSqrd-t.yDistSqrd))[0])||void 0===u?void 0:u.element)&&void 0!==h?h:m;default:return p}}(getAllNavigatables(e),t,i,n)}function isChildOf(e,t){for(;null!=e;){if(e===t)return!0;e=e.parent}return!1}function weightedDistSquared(e,t,i,n){const s=t.x-e.x,o=t.y-e.y;return s*s*i+o*o*n}function isVisible(e){for(;null!=e;){if(!e.visible)return!1;e=e.parent}return!0}const f=["navigate.left","navigate.right","navigate.up","navigate.down","navigate.back","navigate.trigger"];class NavigationManager{constructor(){this.options={enableFallbackOverEffect:!0,minimumDirectionDistance:10},this.enabled=!1,this._responders=[]}get focusTarget(){var e,t;return null!==(t=null===(e=this.responders.find((e=>null!=e.focusTarget)))||void 0===e?void 0:e.focusTarget)&&void 0!==t?t:this._rootFocused}set focusTarget(e){const t=this.focusTarget;if(t===e)return;const i=this.getResponderStage();if(i){if(e){if(!e.isNavigatable)return;if(!isChildOf(e,i))return}null!=this.firstResponder?this.firstResponder.focusTarget=e:this._rootFocused=e,t&&this._emitBlur(t),e&&this._emitFocus(e)}}get firstResponder(){return this._responders[0]}get responders(){return this._responders}configureWithRoot(e){null==this._root&&v.onBindDown(f,(e=>this._propagate(e))),this._root=e,this.enabled=!0}popResponder(){var e,t,i,n,s;const o=this.focusTarget,a=this._responders.shift();a.focusTarget=void 0;const r=this.focusTarget;return null===(e=null==a?void 0:a.resignedAsFirstResponder)||void 0===e||e.call(a),this._invalidateFocusedIfNeeded(),this.firstResponder&&(null===(i=(t=this.firstResponder).becameFirstResponder)||void 0===i||i.call(t)),o!==r&&(null!==(s=null===(n=this.firstResponder)||void 0===n?void 0:n.autoFocus)&&void 0!==s?s:void 0===r)&&this.autoFocus(),a}pushResponder(e){var t,i,n;const s=e;if(this._responders.includes(s))throw new Error("Responder already in stack.");const o=this.firstResponder;this._responders.unshift(s),null===(t=null==o?void 0:o.resignedAsFirstResponder)||void 0===t||t.call(o),this._invalidateFocusedIfNeeded(),null===(i=s.becameFirstResponder)||void 0===i||i.call(s),(null===(n=s.autoFocus)||void 0===n||n)&&this.autoFocus()}autoFocus(){if(!y.enabled)return;const e=this.getResponderStage();if(!e)return;const t=getFirstNavigatable(e);void 0!==t?t!==this.focusTarget&&(this.focusTarget=t):console.debug("navigation: no navigatable containers found")}getResponderStage(){var e;return null!==(e=this.responders.find(isContainer))&&void 0!==e?e:this._root}_propagate({device:e,name:t}){var i;if(this.enabled){for(const n of this._responders)if(null===(i=n.handledNavigationIntent)||void 0===i?void 0:i.call(n,t,e))return;if(null==this._root)throw this.enabled=!1,new Error("Navigation requires root responder to be configured");{const e=this.getResponderStage();this._handleGlobalIntent(e,t)}}}_handleGlobalIntent(e,t){var i;this._invalidateFocusedIfNeeded(e);const n=this.focusTarget;if(void 0===n)return void this.autoFocus();if("navigate.back"===t)return this._emitBlur(n),void(this.focusTarget=void 0);if("navigate.trigger"===t)return void this._emitTrigger(n);const s=null!==(i=getFirstNavigatable(e,n,t,{minimumDistance:this.options.minimumDirectionDistance}))&&void 0!==i?i:n;s!==n&&(this.focusTarget=s)}_emitBlur(e){const t=e.eventNames();t.includes("pointerout")?e.emit("pointerout"):t.includes("mouseout")?e.emit("mouseout"):this.options.enableFallbackOverEffect&&(e.alpha=1),e.emit("deviceout")}_emitFocus(e){const t=e.eventNames();t.includes("pointerover")?e.emit("pointerover"):t.includes("mouseover")?e.emit("mouseover"):this.options.enableFallbackOverEffect&&(e.alpha=.5),e.emit("deviceover")}_emitTrigger(e){const t=e.eventNames();t.includes("pointerdown")?e.emit("pointerdown"):t.includes("mousedown")?e.emit("mousedown"):this.options.enableFallbackOverEffect&&(e.alpha=.75),e.emit("devicedown")}_invalidateFocusedIfNeeded(e=this.getResponderStage()){if(!e)return;const t=this.focusTarget;t&&!isChildOf(t,e)&&(this._emitBlur(t),this.focusTarget=void 0)}}function isContainer(e){return"children"in e}NavigationManager.global=new NavigationManager;const y=NavigationManager.global;let b=!1;exports.Button=o,exports.GamepadDevice=GamepadDevice,exports.InputDevice=v,exports.KeyCode=r,exports.KeyboardDevice=KeyboardDevice,exports.UINavigation=y,exports.getAllNavigatables=getAllNavigatables,exports.getFirstNavigatable=getFirstNavigatable,exports.isChildOf=isChildOf,exports.isVisible=isVisible,exports.navigationIntents=f,exports.registerPixiJSNavigationMixin=function registerPixiJSNavigationMixin(e){if(b)return;b=!0;const t=e.prototype;t.navigationPriority=0,t.navigationMode="auto",Object.defineProperty(t,"isNavigatable",{get:function(){if("target"===this.navigationMode)return!0;if("none"===this.navigationMode)return!1;const e=this.eventNames();return e.length>0&&(e.includes("pointerdown")||e.includes("mousedown"))},configurable:!0,enumerable:!1})};
//# sourceMappingURL=index.cjs.map
