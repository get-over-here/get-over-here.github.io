let Enemy = function(x, y, char) {
	this.dir = 0;
	this.moveTo(x, y);
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
	if (this.char === CHAR_EGG) {
		this.birth = ROT.RNG.getUniformInt(100, 200);
	}
};
Enemy.prototype.calcFov = function() {
	let fov = new ROT.FOV.RecursiveShadowcasting(Game.visibleCallback);
	fovCallback = function(x, y, distance, visibility) {
		if (Game.map[makeKey(x,y)] instanceof Floor) {
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
	fov.compute90(this.x, this.y, TORCH_DISTANCE, this.dir, fovCallback.bind(this));
}

Enemy.prototype.moveTo = function(x, y) {
	delete Game.enemies[this.key];
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
	// dead alien is dangerous, you can't walk over it
	if (this.hp <= 0) {
		// floor corroding
		this.hp--;
		if (this.hp < CORROSION_LIMIT) {
			// hole in the floor, time limit until game over
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
				if (entity instanceof Floor) {
					let enemy = new Enemy(x0, y0, CHAR_HUGGER);
					let key = makeKey(x0, y0)
					Game.enemies[key] = enemy;
					Game.scheduler.add(enemy, true);
					// changes of enemies count skipped
					// because of victory condition
					// it is not a birth, it's a hatching
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
		}
	} else if (!this.path || this.path.length === 0 || this.blockedTurns > 1) {
		let pos = Game.selectNextPatrolRoom(this);
		this.path = computePath(this.x, this.y, pos[0], pos[1]);
	}


	if (this.path && this.path.length > 0) {
		let nextStep = this.path[0];
		let key = makeKey(nextStep[0], nextStep[1]);
		this.turnTo(nextStep[0], nextStep[1]);
		if (Game.map[key] instanceof Floor) {
			this.blockedTurns = 0;
			this.moveTo(nextStep[0], nextStep[1]);
			this.calcFov();
			this.path.shift();
		} else {
			this.blockedTurns += 1;
		}
	} else {
		this.blockedTurns += 1;
	}
	if (this.blockedTurns > 1) {
		let dir = this.dir + ROT.RNG.getItem([-1, 0, +1]);
		this.setDir(dir);
	}
};


Enemy.prototype.getAttacked = function(damage = 1) {
	this.hp -= damage;
	this.playerWasSeen = true;
	if (this.hp <= 0) {
		this.hp = 0;
		switch(this.char){
			case CHAR_HUGGER:
				Game.score += 3;
				break;
			case CHAR_SOLDIER:
				Game.score += 5;
				break;
			case CHAR_EGG:
				Game.score += 1;
				break;
		}
		delete Game.enemies[this.key];
		Game.scheduler.remove(this);
		Game.player.updateLight();
		if (Object.keys(Game.enemies).length === 0) {
			Game.screen = 'win';
		}
	}
};