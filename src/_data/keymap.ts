

export default class KEYMAP {
	private static _data: Indexable<string> = {
		KeyA: 'Key A',
		KeyB: 'Key B',
		KeyC: 'Key C',
		KeyD: 'Key D',
		KeyE: 'Key E',
		KeyF: 'Key F',
		KeyG: 'Key G',
		KeyH: 'Key H',
		KeyI: 'Key I',
		KeyJ: 'Key J',
		KeyK: 'Key K',
		KeyL: 'Key L',
		KeyM: 'Key M',
		KeyN: 'Key N',
		KeyO: 'Key O',
		KeyP: 'Key P',
		KeyQ: 'Key Q',
		KeyR: 'Key R',
		KeyS: 'Key S',
		KeyT: 'Key T',
		KeyU: 'Key U',
		KeyV: 'Key V',
		KeyW: 'Key W',
		KeyX: 'Key X',
		KeyY: 'Key Y',
		KeyZ: 'Key Z',
		Digit1: 'Digit 1',
		Digit2: 'Digit 2',
		Digit3: 'Digit 3',
		Digit4: 'Digit 4',
		Digit5: 'Digit 5',
		Digit6: 'Digit 6',
		Digit7: 'Digit 7',
		Digit8: 'Digit 8',
		Digit9: 'Digit 9',
		Digit0: 'Digit 0',
		Numpad1: 'Numpad 1',
		Numpad2: 'Numpad 2',
		Numpad3: 'Numpad 3',
		Numpad4: 'Numpad 4',
		Numpad5: 'Numpad 5',
		Numpad6: 'Numpad 6',
		Numpad7: 'Numpad 7',
		Numpad8: 'Numpad 8',
		Numpad9: 'Numpad 9',
		Numpad0: 'Numpad 0',
		BracketLeft: '[ Left Bracket',
		BracketRight: '] Right Bracket',
		Slash: '/ Forward Slash',
		Backslash: '\\ Back Slash',
		Minus: '- Minus',
		Equal: '= Equal',
		Semicolon: '; Semicolon',
		Quote: '\' Quote',
		Comma: ', Comma',
		Period: '. Period',
		Backquote: '` Backquote'
	};
	static get(key: string): string { return this._data[key]; }
	static get keys() { return Object.keys(this._data); }
	static get names() { return Object.values(this._data); }
	static get pairs() { return this.keys.map(x => [x, this._data[x]]); }
	static get entries(): { key: string, value: string }[] { return this.keys.map(x => { return { key: x, value: this._data[x] } }); }
	static get KeyA() { return this._data.KeyA; }
	static get KeyB() { return this._data.KeyB; }
	static get KeyC() { return this._data.KeyC; }
	static get KeyD() { return this._data.KeyD; }
	static get KeyE() { return this._data.KeyE; }
	static get KeyF() { return this._data.KeyF; }
	static get KeyG() { return this._data.KeyG; }
	static get KeyH() { return this._data.KeyH; }
	static get KeyI() { return this._data.KeyI; }
	static get KeyJ() { return this._data.KeyJ; }
	static get KeyK() { return this._data.KeyK; }
	static get KeyL() { return this._data.KeyL; }
	static get KeyM() { return this._data.KeyM; }
	static get KeyN() { return this._data.KeyN; }
	static get KeyO() { return this._data.KeyO; }
	static get KeyP() { return this._data.KeyP; }
	static get KeyQ() { return this._data.KeyQ; }
	static get KeyR() { return this._data.KeyR; }
	static get KeyS() { return this._data.KeyS; }
	static get KeyT() { return this._data.KeyT; }
	static get KeyU() { return this._data.KeyU; }
	static get KeyV() { return this._data.KeyV; }
	static get KeyW() { return this._data.KeyW; }
	static get KeyX() { return this._data.KeyX; }
	static get KeyY() { return this._data.KeyY; }
	static get KeyZ() { return this._data.KeyZ; }
	static get Digit1() { return this._data.Digit1; }
	static get Digit2() { return this._data.Digit2; }
	static get Digit3() { return this._data.Digit3; }
	static get Digit4() { return this._data.Digit4; }
	static get Digit5() { return this._data.Digit5; }
	static get Digit6() { return this._data.Digit6; }
	static get Digit7() { return this._data.Digit7; }
	static get Digit8() { return this._data.Digit8; }
	static get Digit9() { return this._data.Digit9; }
	static get Digit0() { return this._data.Digit0; }
	static get Numpad1() { return this._data.Numpad1; }
	static get Numpad2() { return this._data.Numpad2; }
	static get Numpad3() { return this._data.Numpad3; }
	static get Numpad4() { return this._data.Numpad4; }
	static get Numpad5() { return this._data.Numpad5; }
	static get Numpad6() { return this._data.Numpad6; }
	static get Numpad7() { return this._data.Numpad7; }
	static get Numpad8() { return this._data.Numpad8; }
	static get Numpad9() { return this._data.Numpad9; }
	static get Numpad0() { return this._data.Numpad0; }
	static get BracketLeft() { return this._data.BracketLeft; }
	static get BracketRight() { return this._data.BracketRight; }
	static get Slash() { return this._data.Slash; }
	static get Backslash() { return this._data.Backslash; }
	static get Minus() { return this._data.Minus; }
	static get Equal() { return this._data.Equal; }
	static get Semicolon() { return this._data.Semicolon; }
	static get Quote() { return this._data.Quote; }
	static get Comma() { return this._data.Comma; }
	static get Period() { return this._data.Period; }
	static get Backquote() { return this._data.Backquote; }
};