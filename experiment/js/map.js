Game.getAroundCoords = function(obj, x, y) {
	let around = [];
	for (let dx = -1; dx <= 1; dx++) {
		for (let dy = -1; dy <= 1; dy++) {
			if (dx === 0 && dy === 0) {
				continue;
			}
			let x0 = x + dx;
			let y0 = y + dy;
			let key = makeKey(x0, y0);
			if (key in obj) {
				around.push([x0, y0, obj[key]]);
			}
		}
	}
	return around;
};
Game.countAroundTypes = function(obj, x, y) {
	let cells = this.getAroundCoords(obj, x, y);
	let around = [];
	for (let i = 0; i < cells.length; i++) {
		let cell = cells[i][2];
		if (!around[cell.type]) {
			around[cell.type] = 0;
		}
		around[cell.type]++;
	}
	return around;
};

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
		if (!around[cell.type]) {
			around[cell.type] = 0;
		}
		around[cell.type]++;
	}
	return around;
};

Game.isAccessible = function(x, y) {
	let key = makeKey(x, y);
	if (!(key in Game.map) || Game.map[key].type === TYPE_WALL) {
		return false;
	}
	return true;
};
Game.generateMap = function() {

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
	// this.generateLockers();
	this.generateEntities();
	// this.createPlayer();


	let types = [
		CHAR_EGG, CHAR_EGG, CHAR_EGG, CHAR_EGG, CHAR_EGG,
		CHAR_HUGGER, CHAR_HUGGER, CHAR_HUGGER, CHAR_HUGGER, CHAR_HUGGER,
		CHAR_SOLDIER, CHAR_SOLDIER, CHAR_SOLDIER, CHAR_SOLDIER, CHAR_SOLDIER,
		// CHAR_SOLDIER,
	];
	let length = types.length;

	Game.enemiesCount = 0;
	Game.enemiesMax = 0;
	for(let i = 0; i < length; i++) {
		let pos = randomIndex(types);
		let type = CHAR_EGG;
		if (types.length > 0) {
			type = types.splice(pos, 1)[0];
		}
		let enemy = this.generateEnemy(type);
		let key = makeKey(enemy.x, enemy.y);
		this.enemies[key] = enemy;
		Game.enemiesMax++;
	}
	Game.percents = Game.percentsTotal;

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
Game.generateLockers = function(room, count, cb) {
	let done = count;
	for (let i = 0; i < count; i++) {
		// four corners
		let limit = 4;
		while(limit > 0) {
			limit--;
			let x = ROT.RNG.getUniformInt(0, 1) ? room.getLeft() : room.getRight();
			let y = ROT.RNG.getUniformInt(0, 1) ? room.getTop() : room.getBottom();
			let cells = Game.countAroundTypes(Game.doors, x, y);
			if (!cells.door) {
				cb(x, y);
				done--;
				break;
			}
		}
	}
	// notestablished count
	return done;
};
Game.generateEntities = function() {
	let items = [
		UID_AMMO, UID_AMMO, UID_AMMO, UID_AMMO, UID_AMMO,
		UID_MEDPAK, UID_MEDPAK, UID_MEDPAK, UID_MEDPAK, UID_MEDPAK,
		UID_DETECTOR, UID_DETECTOR, UID_DETECTOR,
	];

	let capsule = false;
	let rooms = this.rmap.getRooms();
	// lockers per room
	let ratioDiff = items.length / rooms.length;
	let ratio = ratioDiff;

	for (let i = 0; i < rooms.length; i++) {
		let room = rooms[i];

		// cameras
		let x = Math.floor((room.getRight() - room.getLeft()) / 2 + room.getLeft());
		let y = Math.floor((room.getBottom() - room.getTop()) / 2 + room.getTop());

		let entity;
		if (!capsule) {
			capsule = true;
			entity = new EntityCapsule(x, y);
		} else {
			entity = new EntityCamera(x, y);
		}
		this.entities[entity.key] = entity;
		this.cameras[entity.key] = entity;
		Game.percentsTotal++;

		room.getDoors(function(x, y) {
			let solid = ROT.RNG.getUniformInt(0, 1) ? false : true;
			let entity = new EntityDoor(x, y, solid);
			Game.entities[entity.key] = entity;
			Game.doors[entity.key] = entity;
		});

		// lockers
		if (ratio >= 0) {
			let count = Math.floor(ratio);
			ratio -= count;
			ratio += Game.generateLockers(room, count, function(x, y) {
				let pos = randomIndex(items);
				let item = UID_AMMO;
				if (items.length > 0) {
					item = items.splice(pos, 1)[0];
				}
				if (item === UID_DETECTOR || item === UID_MEDPAK) {
					Game.percentsTotal++;
				}
				let entity = new EntityLocker(x, y, item);
				Game.entities[entity.key] = entity;
				if (!Game.player) {
					Game.createPlayer(entity);
				}
			});
		}
		ratio += ratioDiff;
	}
};
Game.createPlayer = function(entity) {
	Game.player = new Player(entity.x, entity.y);
};
Game.generateEnemy = function(type) {
	//limit infinity
	let limit = 1000;
	while(limit > 0) {
		limit--;
		let index = randomIndex(this.freeCells);
		let cell = this.freeCells[index];
		if (Math.abs(cell[0] - this.player.x) <= STARTING_ENEMY_DISTANCE || Math.abs(cell[1] - this.player.y) <= STARTING_ENEMY_DISTANCE) {
			continue;
		}
		let key = makeKey(cell[0], cell[1]);
		let entity = Game.entities[key];
		if (entity) {
			continue;
		}
		this.freeCells.splice(index, 1);
		return new Enemy(cell[0], cell[1], type);
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
	for(let key in this.cameras) {
		let entity = this.cameras[key];
		Game.recomputeLightsKeys(entity.canSee);
	}
	Game.recomputeLightsKeys(Game.player.canSee);
};

Game.isBreakable = function(key) {
	if (!(key in Game.map)) {
		return false;
	}
	if (Game.map[key].solid) {
		return false;
	}
	if (Game.entities[key] && !Game.entities[key].hp) {
		return false;
	}
	return true;
};
Game.breakableCallback = function(x, y) {
	return Game.isBreakable(makeKey(x, y));
};

Game.isVisible = function(key) {
	if (!(key in Game.map)) {
		return false;
	}
	if (Game.map[key].solid) {
		return false;
	}
	if (Game.entities[key] && Game.entities[key].solid) {
		return false;
	}
	return true;
};
Game.visibleCallback = function(x, y) {
	return Game.isVisible(makeKey(x, y));
};
Game.isPassable = Game.visibleCallback;
Game.updateLights = function(entity) {
	let canSee = {};
	let fov = new ROT.FOV.PreciseShadowcasting(Game.visibleCallback);
	let visibilityCallback = function(x, y, distance, dummy) {
		canSee[makeKey(x, y)] = true;
	};
	fov.compute(entity.x, entity.y, LIGHT_RADIUS, visibilityCallback);
	return canSee;
};
