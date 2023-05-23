var Player = function(x, y) {
	this.moveTo(x, y);
	this.char = '@';
	this.colorOn = '#00ff00';
	this.colorOff = '#ee2200';
	this.hp = PLAYER_HP;
	this.ammo = 100;
	this.hidden = false;
	this.detector = false;
	this.wasSeen = false;
	this.enemies = [];
	this.canSee = {};
	this.updateLight();
};

Player.prototype.getAttacked = function(damage) {
	this.hp -= damage;
	if (this.hp <= 0) {
		Game.gameOver();
	}
};
Player.prototype.updateLight = function() {
	if (this.hidden) {
		this.canSee = {};
		return;
	}
	// @todo когда игрок спрятался, он не видит что происходит рядом с ним, но слышит
	this.canSee = Game.updateLight(this);

	this.enemies = [];
	for(let key in this.canSee) {
		if (key in Game.enemies) {
			this.enemies.push(Game.enemies[key]);
		}
	}
};
Player.prototype.seeNearby = function() {
	let around = Game.getCellsAround(this.x, this.y);
	around.push(this.x, this.y);
	while(around.length > 0) {
		let next = around.pop();
		let x0 = next[0];
		let y0 = next[1];
		let entity = next[2];
		if (entity instanceof Locker) {
			Game.addMessage(entity.getItemText());
			break;
		}
		if (entity instanceof Light) {
			Game.addMessage('Camera nearby');
			break;
		}
	}
};
Player.prototype.moveTo = function(x, y) {
	this.x = x;
	this.y = y;
	this.key = makeKey(x, y);
}
Player.prototype.act = function() {
	Animator.startAnimation();
	Game.engine.lock();
};
Player.prototype.addItem = function(item) {
	let taken = true;
	switch (item) {
		case UID_AMMO:
			this.ammo += 50;
			break;
		case UID_DETECTOR:
			this.detector = true;
			break;
		case UID_MEDPAK:
			this.hp = PLAYER_HP;
			break;
		default:
			taken = false;
	}
	if (taken) {
		Game.addMessage('Collect '+Game.itemName(item));
	}
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
	switch(action) {
		case 'wait':
			break;
		case 'debug':
			// Game.debug = !Game.debug;
			break;
		case 'help':
			Game.printHelp();
			return;// do not move
		case 'shoot':
			if (this.ammo <= 0) {
				break;
			}
			let enemy;
			if (this.enemies.length === 0) {
				break;
			} else if (this.enemies.length === 1) {
				enemy = this.enemies[0];
			} else {
				let minDist = LIGHT_RADIUS+1;
				for (let i = 0; i < this.enemies.length; i++) {
					let next = this.enemies[i];
					let dist = Math.abs(next.x - this.x) + Math.abs(next.y - this.y);
					if (minDist > dist) {
						minDist = dist;
						enemy = next;
					}
				}
			}
			this.ammo -= 10;
			this.ammo = Math.max(0, this.ammo);
			Animator.shoot(this, enemy, '*', 'red');
			break;
		case 'use':
			if (this.hidden) {
				let entity = Game.map[this.key];
				if (entity instanceof Locker) {
					let item = entity.getItem();
					this.addItem(item);
				}
				break;
			}

			let success = false;
			let around = Game.getCellsAround(this.x, this.y);
			while(around.length > 0) {
				let next = around.pop();
				let x0 = next[0];
				let y0 = next[1];
				let entity = next[2];
				if (entity instanceof Locker) {
					let item = entity.getItem();
					this.addItem(item);
					success = true;
					break;
				}
				if (entity instanceof Light) {
					entity.switch();
					Game.addMessage('Camera turned '+(entity.light ? 'on' : 'off'));
					success = true;
					break;
				}
			}
			if (!success) {
				return;// do not move
			}
			break;
		default:
			let x0 = this.x + action[0];
			let y0 = this.y + action[1];

			if (!Game.isAccessible(x0, y0)) {
				return;// do not move
			}
			let newKey = makeKey(x0, y0);
			if (Game.map[newKey] instanceof Floor) {
				this.hidden = false;
				this.moveTo(x0, y0);
				if (this.hidden) {
					this.hidden = false;
					Game.addMessage('You are visible');
				}
			}
			if (Game.map[newKey] instanceof Locker) {
				this.hidden = true;
				this.moveTo(x0, y0);
				Game.addMessage('You are hidden');
			}
			if (newKey in Game.enemies) {
				// Game.enemies[newKey].getAttacked(1);
			}
			this.seeNearby();
	}
	this.updateLight();
	Game.recomputeLights();

	Animator.startAnimation();

	Game.turns += 1;
	Game.drawMap();
	Game.engine.unlock();
};