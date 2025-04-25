let Enemy = function(x, y, char) {
	this.dir = 0;
	this.moveTo(x, y);
	this.type = 'enemy';
	this.char = char;
	this.colorOn = COLOR_ENEMY;
	this.colorOff = COLOR_ENEMY;
	
	// soldiers are heavy
	this.hp = (this.char === CHAR_SOLDIER) ? 3 : 1;
	// oneshot kill from hugger
	this.damage = (this.char === CHAR_HUGGER) ? PLAYER_HP : Math.floor(PLAYER_HP / 5);

	this.path = [];
	this.looking = false;
	this.lookingCount = false;
	this.hasTorch = true;
	this.blockedTurns = 0;
	this.canSee = {};
	this.fov = [];
	this.playerWasSeen = false;
	this.targetDoor = null;
	if (this.char === CHAR_EGG) {
		this.birth = ROT.RNG.getUniformInt(100, 200);
	}
};
Enemy.prototype.calcFov = function() {
	let fov = new ROT.FOV.RecursiveShadowcasting(Game.visibleCallback);
	fovCallback = function(x, y, distance, visibility) {
		if (Game.map[makeKey(x,y)].type === TYPE_FLOOR) {
			this.fov.push([x, y]);
			// player has been detected, run!
			if (!Game.player.hidden && x === Game.player.x && y === Game.player.y) {
				if (!this.playerWasSeen) {
					Game.addMessage('%c{red}Monster saw you!%c{}', true);
				}
				this.playerWasSeen = true;
				Game.player.wasSeen = true;
			}
		}
	};
	this.fov = [];
	fov.compute180(this.x, this.y, TORCH_DISTANCE, this.dir, fovCallback.bind(this));
}

Enemy.prototype.moveTo = function(x, y) {
	if (this.key in Game.enemies) {
		delete Game.enemies[this.key];
	}
	this.x = x;
	this.y = y;
	this.key = makeKey(x, y);
	Game.enemies[this.key] = this;
}
/*
	ROT.DIRS[8]
	0 [ 0, -1] N
	1 [ 1, -1] NE
	2 [ 1,  0] E
	3 [ 1,  1] SE
	4 [ 0,  1] S
	5 [-1,  1] SW
	6 [-1,  0] W
	7 [-1, -1] NW
*/
Enemy.prototype.setDir = function(dir) {
	if (dir < 0) {
		this.dir = ROT.DIRS[8].length - 1;
	} else if (dir >= ROT.DIRS[8].length) {
		this.dir = 0;
	} else {
		this.dir = dir;
	}
}
Enemy.prototype.turnTo = function(x, y) {
	let toX = x - this.x;
	let toY = y - this.y;
	let dirs = ROT.DIRS[8];
	for (let i = 0; i < dirs.length; i++) {
		let dir = dirs[i];
		if (dir[0] === toX && dir[1] === toY) {
			this.setDir(i);
			break;
		}
	}
}

Enemy.prototype.act = function() {
	if (this.hp <= 0) {
		if (Game.pressure > 100) {
			this.hp--;
			if (this.hp < -CORROSION_LIMIT) {
				Game.pressure = 100;
			}
		}
		return;
	}

	if (this.char === CHAR_EGG_EMPTY) {
		return;
	}

	if (this.char === CHAR_EGG) {
		this.birth--;
		if (this.birth < 0) {
			this.char = CHAR_EGG_EMPTY;
			let around = Game.getCellsAround(this.x, this.y);
			while(around.length > 0) {
				let next = around.pop();
				let x0 = next[0];
				let y0 = next[1];
				let entity = next[2];
				if (entity.type === TYPE_FLOOR) {
					// it is not a birth, it's a hatching
					let enemy = new Enemy(x0, y0, CHAR_HUGGER);
					enemy.moveTo(x0, y0);
					Game.scheduler.add(enemy, true);
					break;
				}
			}
		}
		return;
	}
	if (this.playerWasSeen) {
		let nextToPlayer = Math.abs(this.x - Game.player.x) <= 1 && Math.abs(this.y - Game.player.y) <= 1;
		if (nextToPlayer) {
			Game.player.getAttacked(this.damage);
			return;
		} else {
			this.path = computePath(this.x, this.y, Game.player.x, Game.player.y);
			if (!this.path || this.path.length === 0) {
				if (this.char === CHAR_SOLDIER) {
					this.path = computePath(this.x, this.y, Game.player.x, Game.player.y, 'breakable');
				}
			}
		}
	} else if (!this.path || this.path.length === 0 || this.blockedTurns > 1) {
		let pos = Game.selectNextPatrolRoom(this);
		this.path = computePath(this.x, this.y, pos[0], pos[1]);
	}

	if (this.targetDoor) {
		this.targetDoor.getAttacked(this.damage);
		if (Game.entities[this.targetDoor.key]) {
			Game.addMessage('%c{yellow}Breaking sounds%c{}');
			return;
		} else {
			this.path = [
				[this.targetDoor.x, this.targetDoor.y],
			];
			this.targetDoor = null;
			Game.addMessage('%c{red}Crash sound!%c{}', true);
		}
	}

	if (this.path && this.path.length > 0) {
		let nextStep = this.path[0];
		let x = nextStep[0];
		let y = nextStep[1];
		this.turnTo(x, y);
	
		if (this.char === CHAR_SOLDIER && this.playerWasSeen) {
			let key = makeKey(x, y);
			let entity = Game.entities[key];
			if (entity && entity.type === TYPE_DOOR) {
				if (entity.solid) {
					this.playerWasSeen = false;
					this.targetDoor = entity;
					return;
				}
			}
		}

		if (Game.isPassable(x, y)) {
			this.blockedTurns = 0;
			this.moveTo(x, y);
			this.calcFov();
			this.path.shift();
		} else {
			this.blockedTurns += 1;
		}
	} else {
		this.blockedTurns += 1;
	}
	if (this.blockedTurns > 1) {
		this.path = [];
		let dir = this.dir + ROT.RNG.getItem([-1, 0, +1]);
		this.setDir(dir);
	}
};


Enemy.prototype.getAttacked = function(damage = 1) {
	this.hp -= damage;
	this.playerWasSeen = true;
	if (this.hp > 0) {
		return;
	}
	this.hp = 0;
	this.char = CHAR_ENEMY_DEAD;
	this.colorOn = COLOR_ENEMY_DEAD;
	this.colorOff = COLOR_ENEMY_DEAD;
	this.fov = [];
	// Game.scheduler.remove(this);
	Game.player.updateLight();
	Game.enemiesCount++;
	Game.addMessage('%c{yellow}Acid corrosion detected!', true);
};