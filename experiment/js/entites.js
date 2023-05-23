let Floor = function(x, y) {
	this.x = x;
	this.y = y;
	this.char = CHAR_FLOOR;
	this.colorOn = COLOR_FLOOR;
	this.colorOff = '#b09800';
};
let Wall = function(x, y) {
	this.x = x;
	this.y = y;
	this.char = CHAR_WALL;
	this.colorOn = '#e2c900';
	this.colorOff = '#b09800';
	this.solid = true;
};


let Locker = function(x, y, item) {
	this.x = x;
	this.y = y;
	this.char = CHAR_LOCKER;
	this.colorOn = COLOR_LOCKER;
	this.colorOff = COLOR_LOCKER_DARK;
	this.item = item;
	this.solid = true;
};
Locker.prototype.getItem = function() {
	let item = this.item;
	this.item = UID_NOTHING;
	return item;
};
Locker.prototype.getItemText = function() {
	if (this.item === UID_NOTHING) {
		return 'Empty locker';
	}
	return 'Locker with '+Game.itemName(this.item);
};

let Light = function(x, y) {
	this.x = x;
	this.y = y;
	this.char = CHAR_LIGHT;
	this.colorOn = COLOR_LIGHT_OFF;
	this.colorOff = COLOR_LIGHT_DARK;
	this.untouched = true;
	this.light = false;
	this.canSee = {};
};
Light.prototype.switch = function() {
	this.untouched = false;
	// three states: light is on, light is off, light is off and visible
	this.light = !this.light;
	if (this.light) {
		this.canSee = Game.updateLight(this);
		this.colorOn = COLOR_LIGHT;
		this.colorOff = COLOR_LIGHT_OFF;
	} else {
		this.canSee = {};
		this.colorOn = COLOR_LIGHT_OFF;
		this.colorOff = COLOR_LIGHT_DARK;
	}
};
