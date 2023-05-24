var Player = function(x, y) {
	this.moveTo(x, y);
	this.type = 'player';
	this.char = CHAR_PLAYER;
	this.colorOn = COLOR_PLAYER_DARK;
	this.colorOff = COLOR_PLAYER_DARK;
	this.hp = PLAYER_HP;
	this.ammo = 100;
	this.hidden = true;
	this.detector = false;
	this.wasSeen = false;
	this.enemies = [];
	this.canSee = {};
};

Player.prototype.getAttacked = function(damage) {
	if (Game.debug.undead) {
		return;
	}
	this.hp -= damage;
	if (this.hp <= 0) {
		Game.gameOver('health');
	}
};
Player.prototype.updateLight = function() {
	this.canSee = Game.updateLights(this);

	this.enemies = [];
	for(let key in this.canSee) {
		if (key in Game.enemies) {
			this.enemies.push(Game.enemies[key]);
		}
	}
};

Player.prototype.lookAtEntity = function() {
	let entity = Game.entities[this.key];
	if (entity) {
		entity.printMessage();
	}
};
Player.prototype.moveTo = function(x, y) {
	this.x = x;
	this.y = y;
	this.key = makeKey(x, y);
	this.lookAtEntity();
	let enemy = Game.enemies[this.key];
	if (enemy && enemy.hp <= 0) {
		Game.addMessage('%c{yellow}Damaged by acid');
		this.getAttacked(1);
	}
};
Player.prototype.hide = function(hide) {
	this.hidden = hide;
	if (this.hidden) {
		this.colorOn = COLOR_PLAYER_DARK;
	} else {
		this.colorOn = COLOR_PLAYER;
	}
}
Player.prototype.act = function() {
	Animator.startAnimation();
	Game.engine.lock();
	if (Game.pressure <= 100) {
		if (Game.pressure % 20 === 0) {
			Game.addMessage('%c{red}Attention!Pressure reduction!', true);
		}
		if (Game.pressure <= 1) {
			Game.gameOver('pressure');
		}
		Game.pressure--;
	}
};
Player.prototype.addItem = function(item) {
	switch (item) {
		case UID_AMMO:
			this.ammo += 50;
			Game.addMessage('Ammo collected');
			break;
		case UID_DETECTOR:
			Game.percents--;
			this.detector = true;
			Game.addMessage('Detector equipped');
			break;
		case UID_MEDPAK:
			Game.percents--;
			if (this.hp < PLAYER_HP) {
				this.hp = PLAYER_HP;
				Game.addMessage('Health restored');
			} else {
				Game.addMessage('You are healthy');
				return false;
			}
			break;
	}
	return true;
};

Player.prototype.handleEvent = function(e) {
	let keyMap = {
		'ArrowLeft'  : [-1,  0],
		'ArrowRight' : [ 1,  0],
		'ArrowDown'  : [ 0,  1],
		'ArrowUp'    : [ 0, -1],
		'KeyA' : [-1,  0],
		'KeyD' : [ 1,  0],
		'KeyS' : [ 0,  1],
		'KeyW' : [ 0, -1],
		'KeyQ' : [-1, -1],
		'KeyE' : [ 1, -1],
		'KeyZ' : [-1,  1],
		'KeyC' : [ 1,  1],

		'KeyX'      : 'shoot',
		'Enter'     : 'use',
		'KeyF'      : 'use',
		'KeyV'      : 'wait',
		'Backquote' : 'debug',
		'KeyH'      : 'help',
	};
	let code = e.code;

	if (code in keyMap) {
		e.preventDefault();
	}
	if (!(code in keyMap) || Animator.running) {
		return;
	};

	let action = keyMap[code];
	let entity;
	switch(action) {
		case 'wait':
			break;
		case 'debug':
			Game.drawDebug();
			return;
		case 'help':
			Game.printHelp();
			return;// do not move
		case 'shoot':
			if (this.hidden) {
				return;// do not move
			}
			if (this.ammo <= 0) {
				break;
			}
			let enemy;
			if (this.enemies.length === 0) {
				break;
			} else {
				let minDist = LIGHT_RADIUS+1;
				for (let i = 0; i < this.enemies.length; i++) {
					let next = this.enemies[i];
					let dist = Math.abs(next.x - this.x) + Math.abs(next.y - this.y);
					if (next.hp > 0 && minDist > dist) {
						minDist = dist;
						enemy = next;
					}
				}
			}
			if (enemy) {
				this.ammo -= 10;
				this.ammo = Math.max(0, this.ammo);
				Animator.shoot(this, enemy, '*', 'red');
			}
			break;
		case 'use':
			entity = Game.entities[this.key];
			if (entity) {
				switch (entity.type) {
					case TYPE_LOCKER:
						let item = entity.getItem();
						if (this.addItem(item)) {
							entity.removeItem();
						}
						break;
					case TYPE_CAPSULE:
					case TYPE_CAMERA:
						entity.switchOn();
						break;
					case TYPE_DOOR:
						entity.switch();
						break;
				}
			}
			Game.drawMap();
			return;// do not move
			break;
		default:
			let x0 = this.x + action[0];
			let y0 = this.y + action[1];
			let key = makeKey(x0, y0);

			if (!Game.isAccessible(x0, y0)) {
				return;// do not move
			}
			entity = Game.entities[key];
			if (entity) {
				switch (entity.type) {
					case TYPE_LOCKER:
						this.hide(true);
						this.moveTo(x0, y0);
						Game.addMessage('You are hidden');
						break;
					case TYPE_CAPSULE:
					case TYPE_CAMERA:
						this.moveTo(x0, y0);
						entity = undefined;
						break;
					case TYPE_DOOR:
						if (entity.solid) {
							entity.switch();
						} else {
							this.moveTo(x0, y0);
							Game.addMessage('In the doorway');
						}
						entity = undefined;
						break;
					default:
						entity = undefined;
				}
			}
			if (!entity) {
				this.moveTo(x0, y0);
				if (this.hidden) {
					this.hide(false);
					Game.addMessage('You are visible');
				}
			}
	}
	this.updateLight();
	Game.recomputeLights();

	Animator.startAnimation();

	Game.turns += 1;
	Game.drawMap();

	Game.engine.unlock();
};