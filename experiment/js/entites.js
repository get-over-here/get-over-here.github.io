let Floor = function(x, y) {
	this.x = x;
	this.y = y;
	this.type = TYPE_FLOOR;
	this.char = CHAR_FLOOR;
	this.colorOn = COLOR_FLOOR;
	this.colorOff = '#b09800';
};
let Wall = function(x, y) {
	this.x = x;
	this.y = y;
	this.type = TYPE_WALL;
	this.char = CHAR_WALL;
	this.colorOn = '#e2c900';
	this.colorOff = '#b09800';
	this.solid = true;
};


let EntityLocker = function(x, y, item) {
	this.x = x;
	this.y = y;
	this.key = makeKey(x, y);
	this.type = TYPE_LOCKER;
	this.char = CHAR_LOCKER;
	this.colorOn = COLOR_LOCKER;
	this.colorOff = COLOR_LOCKER_DARK;
	this.item = item;
	// this.solid = true;
};
EntityLocker.prototype.getItem = function() {
	return this.item;
};
EntityLocker.prototype.removeItem = function() {
	this.item = UID_NOTHING;
	this.char = CHAR_LOCKER_EMPTY;
};
EntityLocker.prototype.printMessage = function() {
	if (this.item === UID_NOTHING) {
		return;
	}
	Game.addMessage('You see: '+Game.itemName(this.item));
};
EntityLocker.prototype.setTo = function(x, y) {
	this.x = x;
	this.y = y;
	this.key = makeKey(x, y);
	Game.entities[this.key] = this;
}


let EntityCamera = function(x, y) {
	this.x = x;
	this.y = y;
	this.key = makeKey(x, y);
	this.type = TYPE_CAMERA;
	this.char = CHAR_LIGHT;
	this.colorOn = COLOR_LIGHT_OFF;
	this.colorOff = COLOR_LIGHT_DARK;
	this.untouched = true;
	this.light = false;
	this.canSee = {};
};
EntityCamera.prototype.switch = function() {
	this.untouched = false;
	// three states: light is on, light is off, light is off and visible
	this.light = !this.light;
	if (this.light) {
		this.canSee = Game.updateLights(this);
		this.colorOn = COLOR_LIGHT;
		this.colorOff = COLOR_LIGHT_OFF;
	} else {
		this.canSee = {};
		this.colorOn = COLOR_LIGHT_OFF;
		this.colorOff = COLOR_LIGHT_DARK;
	}
};
EntityCamera.prototype.switchOn = function() {
	Game.percents--;
	this.light = true;
	this.canSee = Game.updateLights(this);
	this.colorOn = COLOR_LIGHT;
	this.colorOff = COLOR_LIGHT_OFF;
	Game.addMessage('Camera turned on');
};

EntityCamera.prototype.printMessage = function() {
	Game.addMessage('Camera '+(this.light ? 'enabled' : 'disabled'));
};

let EntityCapsule = function(x, y) {
	this.x = x;
	this.y = y;
	this.key = makeKey(x, y);
	this.type = TYPE_CAPSULE;
	this.char = CHAR_CAPSULE;
	this.colorOn = COLOR_CAPSULE;
	this.colorOff = COLOR_CAPSULE;
};
EntityCapsule.prototype.switchOn = function() {
	if (!this.light) {
		this.light = true;
		this.canSee = Game.updateLights(this);
		Game.addMessage('Escape pod prepared');
	} else {
		Game.screen = 'win';
	}
};
EntityCapsule.prototype.printMessage = function() {
	Game.addMessage('Escape pod '+(this.solid ? 'enabled' : 'disabled'));
};

let EntityDoor = function(x, y, solid) {
	this.x = x;
	this.y = y;
	this.key = makeKey(x, y);
	this.type = TYPE_DOOR;
	this.char = CHAR_DOOR;
	this.colorOn = COLOR_DOOR;
	this.colorOff = COLOR_DOOR_DARK;
	this.solid = solid;
	this.hp = 10;
	if (this.solid) {
		this.char = CHAR_DOOR;
	} else {
		this.char = CHAR_DOOR_OPENED;
	}
};
EntityDoor.prototype.switch = function() {
	this.solid = !this.solid;
	if (this.solid) {
		this.char = CHAR_DOOR;
	} else {
		this.char = CHAR_DOOR_OPENED;
	}
	this.printMessage();
	Game.player.updateLight();
	Game.recomputeLights();
};
EntityDoor.prototype.getAttacked = function(damage) {
	this.hp -= damage;
	if (this.hp <= 0) {
		delete Game.entities[this.key];
		Game.player.updateLight();
		Game.recomputeLights();
	}
};
EntityDoor.prototype.printMessage = function() {
	Game.addMessage('Door '+(this.solid ? 'closed' : 'open'));
};