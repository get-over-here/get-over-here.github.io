// Game.countAdjacent = function(x, y) {
// 	let adjacentFree = 0;
// 	for(let di = -1; di < 2; di++) {
// 		for(let dj = -1; dj < 2; dj++) {
// 			if (di === 0 && dj === 0) {
// 				continue;
// 			}
// 			let newx = x + di;
// 			let newy = y + dj;
// 			let key = makeKey(newx, newy);
// 			if ((key in this.map) && this.map[key] === '.') {
// 				++adjacentFree;
// 			}
// 		}
// 	}
// 	return adjacentFree;
// };
// Game.countWallsAround = function(x, y) {
// 	let adjacentFree = 0;
// 	for(let di = -1; di < 2; di++) {
// 		for(let dj = -1; dj < 2; dj++) {
// 			if (di === 0 && dj === 0) {
// 				continue;
// 			}
// 			let newx = x + di;
// 			let newy = y + dj;
// 			let key = makeKey(newx, newy);
// 			if ((key in this.map) && this.map[key] === '#') {
// 				++adjacentFree;
// 			}
// 		}
// 	}
// 	return adjacentFree;
// };
Game.getCellsAround = function(x, y, char = '') {
	let around = [];
	for (let dx = -1; dx <= 1; dx++) {
		for (let dy = -1; dy <= 1; dy++) {
			if (dx === 0 && dy === 0) {
				continue;
			}
			let x0 = x + dx;
			let y0 = y + dy;
			let key = makeKey(x0, y0);
			if (key in this.map) {
				if (char === '' || char === this.map[key].char) {
					around.push([x0, y0, this.map[key]]);
				}
			}
		}
	}
	return around;
};
Game.countCellsAround = function(x, y) {
	let cells = this.getCellsAround(x, y);
	let around = [];
	for (let i = 0; i < cells.length; i++) {
		let cell = cells[i][2];
		if (!around[cell.char]) {
			around[cell.char] = 0;
		}
		around[cell.char]++;
	}
	return around;
};
// Game.checkCharOnMap = function(x, y, char) {
// 	let key = makeKey(x, y);
// 	if ((key in this.map) && Game.map[key] === char) {
// 		return true;
// 	}
// 	return false;
// };
// Game.getItemFromLocker = function(x, y) {
// 	let key = makeKey(x, y);
// 	if (key in this.lockers) {
// 		let item = this.lockers[key];
// 		this.lockers[key] = -1;
// 		return item;
// 	}
// 	return -1;
// };
Game.isAccessible = function(x, y) {
	let key = makeKey(x, y);
	if (!(key in Game.map) || Game.map[key] instanceof Wall) {
		return false;
	}
	return true;
};
Game.generateMap = function() {
	// this.map = Array(WIDTH).fill(null).map(()=>Array(HEIGHT).fill(null));

	this.rmap = new ROT.Map.Digger(
		WIDTH,
		HEIGHT,
		{
			dugPercentage: MAP_SATURATION,
			roomHeight: [4, 8],
			roomWidth: [4, 8],
			corridorLength: [4, 12]
		},
	);
	this.freeCells = [];

	let digCallback = (x, y, value)=>{
		if (value) {
			return;
		}
		let key = makeKey(x, y);
		this.map[key] = new Floor(x, y);
		this.freeCells.push([x, y]);
	};
	this.rmap.create(digCallback.bind(this));

	this.buildWalls();
	this.generateLockers();
	this.generateLights();
	this.createPlayer();


	let types = [
		CHAR_EGG, CHAR_EGG, CHAR_EGG, CHAR_EGG, CHAR_EGG,
		CHAR_HUGGER, CHAR_HUGGER, CHAR_HUGGER, CHAR_HUGGER, CHAR_HUGGER,
		CHAR_SOLDIER, CHAR_SOLDIER, CHAR_SOLDIER, CHAR_SOLDIER, CHAR_SOLDIER,
	];
	let length = types.length;

	this.enemiesCount = 0;
	for(let i = 0; i < length; i++) {
		let pos = randomIndex(types);
		let type = CHAR_EGG;
		if (types.length > 0) {
			type = types.splice(pos, 1)[0];
		}
		let enemy = this.generateEnemy(type);
		let key = makeKey(enemy.x, enemy.y);
		this.enemies[key] = enemy;
		this.enemiesCount++;
	}
	this.recomputeLights();
	this.drawMap();
};
Game.buildWalls = function() {
	for(let x = 0; x < WIDTH; x++) {
		for(let y = 0; y < HEIGHT; y++) {
			let key = makeKey(x, y);
			if (key in this.map) {
				continue;
			}
			if (this.getCellsAround(x, y, CHAR_FLOOR).length === 0) {
				continue;
			}
			this.map[key] = new Wall(x, y);
			this.walls[key] = [x, y];
		}
	}
};
Game.generateLockers = function() {
	// ammo, detector, medpak
	let items = [
		UID_AMMO, UID_AMMO, UID_AMMO, UID_AMMO, UID_AMMO,
		// UID_DETECTOR, UID_DETECTOR, UID_DETECTOR, UID_DETECTOR, UID_DETECTOR,
		UID_MEDPAK ,UID_MEDPAK ,UID_MEDPAK ,UID_MEDPAK ,UID_MEDPAK,
	];
	let walls = Object.keys(this.walls);
	let length = items.length;
	for (let i = 0; i < length; i++) {
		//limit infinity
		let limit = 1000;
		while(limit > 0) {
			limit--;
			let index = randomIndex(walls);
			let key = walls[index];
			let cells = Game.getCellsAround(this.walls[key][0], this.walls[key][1], CHAR_FLOOR);
			if (cells.length === 3) {
				let x = cells[1][0];
				let y = cells[1][1];
				cells = Game.countCellsAround(cells[1][0], cells[1][1]);
				if (cells[CHAR_WALL] < 4) {
					// console.log(i, key, cells);
					let pos = randomIndex(items);
					let item = UID_AMMO;
					if (items.length > 0) {
						item = items.splice(pos, 1)[0];
					}
					let key = makeKey(x, y);
					this.map[key] = new Locker(x, y, item);
					walls.splice(index, 1);
					break;
				}
			}
		}
	}
};
Game.generateLights = function() {
	let rooms = this.rmap.getRooms();
	for (let i = 0; i < rooms.length; i++) {
		let room = rooms[i];

		let x = Math.floor((room.getRight() - room.getLeft()) / 2 + room.getLeft());
		let y = Math.floor((room.getBottom() - room.getTop()) / 2 + room.getTop());

		let key = makeKey(x, y);
		let light = new Light(x, y);
		this.map[key] = light;
		this.lights[key] = light;
	}
};
Game.createPlayer = function() {
	var index = randomIndex(this.freeCells);
	var key = this.freeCells.splice(index, 1)[0];
	var x = key[0];
	var y = key[1];
	this.player = new Player(x, y);
};
Game.generateEnemy = function(type) {
	//limit infinity
	let limit = 1000;
	while(limit > 0) {
		limit--;
		let index = randomIndex(this.freeCells);
		if (Math.abs(this.freeCells[index][0] - this.player.x) <= STARTING_ENEMY_DISTANCE || Math.abs(this.freeCells[index][1] - this.player.y) <= STARTING_ENEMY_DISTANCE) {
			continue;
		}
		let key = this.freeCells.splice(index, 1)[0];
		return new Enemy(key[0], key[1], type);
	}
};
Game.selectNextPatrolRoom = function(enemy) {
	let candidates = [];
	let rooms = this.rmap.getRooms();
	for (let i = 0; i < rooms.length; i++) {
		let room = rooms[i];

		if (enemy.x >= room.getLeft() && enemy.x <= room.getRight()) {
			if (enemy.y >= room.getTop() && enemy.y <= room.getBottom()) {
				continue;
			}
		}

		let x = ROT.RNG.getUniformInt(room.getLeft(), room.getRight());
		let y = ROT.RNG.getUniformInt(room.getTop(), room.getBottom());
		candidates.push([x, y]);
	}
	let index = randomIndex(candidates);
	return candidates[index];
};



Game.isPassable = function(key) {
	return (key in Game.map) && Game.map[key] !== HP_VASE && Game.map[key] !== MP_VASE && !WALLS.includes(Game.map[key]);
};
Game.passableCallback = function(x, y) {
	return Game.isPassable(makeKey(x, y));
};

Game.isVisible = function(key) {
	if (!(key in Game.map)) {
		return false;
	}
	if (Game.map[key].solid) {
		return false;
	}
	return true;
};
Game.visibleCallback = function(x, y) {
	return Game.isVisible(makeKey(x, y));
};


Game.walkableCallback = function(x, y) {
	let key = makeKey(x, y);
	let pass = Game.isVisible(key);
	return pass || Game.map[key] === CHAR_PLAYER;
};

Game.recomputeLightsKeys = function(canSee) {
	for(let key in canSee) {
		this.litUp[key] = true;
		this.known[key] = true;
	}
};
Game.recomputeLights = function() {
	this.litUp = {};
	for(let key in this.lights) {
		let entity = this.lights[key];
		Game.recomputeLightsKeys(entity.canSee);
	}
	Game.recomputeLightsKeys(Game.player.canSee);
};

Game.updateLight = function(entity) {
	let canSee = {};
	let fov = new ROT.FOV.PreciseShadowcasting(Game.visibleCallback);
	let visibilityCallback = function(x, y, distance, dummy) {
		canSee[makeKey(x, y)] = true;
	};
	fov.compute(entity.x, entity.y, LIGHT_RADIUS, visibilityCallback);
	return canSee;
};

Game.drawChar = function(entity, litUp, known) {
	if (!known) {
		return;
	}
	if (litUp) {
		this.display.draw(entity.x, entity.y, entity.char, entity.colorOn, COLOR_SHINING);
	} else {
		this.display.draw(entity.x, entity.y, entity.char, entity.colorOff);
	}
};

Game.drawMap = function() {
	this.display.clear();
	for (let key in this.map) {
		this.drawChar(this.map[key], key in this.litUp, key in this.known);
	}
	for (let key in this.enemies) {
		let visible = key in this.litUp;
		let enemy = this.enemies[key];
		if (visible) {
			for (let i = 0; i < enemy.fov.length; i++) {
				let [x, y] = enemy.fov[i];
				let key = makeKey(x, y);
				if (key in this.litUp) {
					if (!(key in this.enemies)) {
						this.display.draw(x, y, CHAR_FLOOR, COLOR_ENEMY, COLOR_SHINING);
					}
				}
			}
			this.drawChar(this.enemies[key], visible, visible);
		}
		if (this.debug) {
			if (enemy.path) {
				for (let i = 0; i < enemy.path.length; i++) {
					let [x, y] = enemy.path[i];
					this.display.draw(x, y, '+', 'pink');
				}
			}
			this.drawChar(this.enemies[key], true, true);
		}

	}
	this.drawChar(this.player, true, true);
	if (this.player) {
		this.printStats();
	}
};
