WIDTH = 60;
EXTRA_WIDTH = 22;
HEIGHT = 46;
DEFAULT_COLOR = '#e2c900';
MAP_SATURATION = 0.35;
TORCH_DISTANCE = 5;
SHOOT_DISTANCE = TORCH_DISTANCE - 1;
STARTING_ENEMY_DISTANCE = 7;

CORROSION_LIMIT = 100;

PLAYER_HP = 10;

LIGHT_RADIUS = 10;

UID_NOTHING = -1;
UID_AMMO = 1;
UID_DETECTOR = 2;
UID_MEDPAK = 3;

CHAR_PLAYER = '@';
CHAR_FLOOR = '.';
CHAR_WALL = '#';
// CHAR_LIGHT = '\u00A4';
CHAR_LIGHT = 'T';
CHAR_LOCKER = '\u00B6';

CHAR_EGG = '\u00A9';
CHAR_EGG_EMPTY = '\u00A2';
CHAR_HUGGER = '\u00A3';
CHAR_SOLDIER = '\u00A7';

COLOR_LIGHT = '#aeeafc';
COLOR_LIGHT_OFF = '#3ccbfa';
COLOR_LIGHT_DARK = '#377b91';

COLOR_LOCKER = '#90ee90';
COLOR_LOCKER_DARK = '#528752';

COLOR_ENEMY = '#ff0000';

COLOR_FLOOR = '#e2c900';
COLOR_SHINING = '#ffe30026';

let makeKey = function(x, y) {
	return x + ',' + y;
};
// let randomIndex = function(arr) {
// 	return Math.floor(ROT.RNG.getUniform() * arr.length);
// };
let randomIndex = function(arr) {
	return ROT.RNG.getUniformInt(0, arr.length-1);
};
let computePath = function(x1, y1, x2, y2, mode = 'planning') {
	// callback = (mode === 'planning' ? Game.visibleCallback : Game.walkableCallback);
	let astar = new ROT.Path.AStar(x2, y2, Game.visibleCallback, {topology:8});
	let path = [];
	let pathCallback = function(x, y) {
		path.push([x, y]);
	};
	astar.compute(x1, y1, pathCallback);
	if (path) {
		path.shift();
	}
	return path;
};


let Game = {
	init: function() {
		this.display = new ROT.Display({
			width: WIDTH + EXTRA_WIDTH,
			height: HEIGHT,
			fontSize: 19,
			forceSquareRatio: true,
			bg: '#000'
		});
		canvas = this.display.getContainer();
		canvas.setAttribute('id', 'canvas');
		document.body.appendChild(canvas);
		this.debug = false;
		this.scheduler = new ROT.Scheduler.Simple();
		Game.start();
	},
	keyDown: function(e) {
		if (Animator.running) {
			return;
		};

		if (Game.screen === 'game') {
			Game.player.handleEvent(e);
		} else if (Game.screen === 'help') {
			Game.screen = 'game';
			Game.drawMap();
		} else {
			if (e.code === 'Space') {
				Game.start();
			}
		}
	},

	start: function() {
		this.screen = 'game';

		this.player = null;
		this.engine = null;
		this.level = 1;
		this.score = 0;
		this.turns = 0;
		this.paused = false;
		this.scheduler.clear();

		this.nextLevel();

		this.scheduler.add(this.player, true);
		for (let enemyPos in this.enemies) {
			this.scheduler.add(this.enemies[enemyPos], true);
		}
		this.engine.start();
	},

	gameOver: function() {
		this.screen = 'lose';
		this.scheduler.clear();
		this.display.clear();

		let x = Math.floor(WIDTH / 2);
		let y = Math.floor(HEIGHT / 2) - 2;
		this.display.draw(x, y, 'YOU DIED', 'lightcoral');
		y += 2;
		this.display.draw(x, y, 'Total score: '+Game.score, 'lightcoral');
		y += 2;
		this.display.draw(x, y, 'Press [Space] to restart', 'white');
		Game.printStats();
	},

	endLevel: function() {
		this.screen = 'win';
		for (let key in this.map) {
			let entity = this.map[key];
			if (entity.char === CHAR_LIGHT && entity.untouched) {
				Game.score += 1;
			} else if (entity.char === CHAR_LOCKER && entity.item !== UID_NOTHING) {
				Game.score += 1;
			}
		}
		this.scheduler.clear();
		this.display.clear();

		let x = Math.floor(WIDTH / 2);
		let y = Math.floor(HEIGHT / 2) - 2;
		this.display.draw(x, y, 'YOU WIN', 'lightgreen');
		y += 2;
		this.display.draw(x, y, 'Final score: '+Game.score, 'lightgreen');
		y += 2;
		this.display.draw(x, y, 'Press [Space] to restart', 'white');
		Game.printStats();
	},

	nextLevel: function() {
		this.messages = [];
		this.engine = new ROT.Engine(this.scheduler);
		this.enemies = {};
		this.map = {};
		this.walls = {};
		this.lights = {};
		this.litUp = {};
		this.known = {};
		Game.generateMap();
		Game.addMessage('You see nothing');
		Game.player.seeNearby();
		Game.printStats(true);
	},
};

Game.printStats = function() {
	let OFFSET = WIDTH + 5;
	let TOP_OFFSET = 1;
	let status = {
		1: '%c{gray}Dead%c{}',
		3: '%c{red}Lethally Wounded%c{}',
		5: '%c{orange}Severely Wounded%c{}',
		8: '%c{gold}Wounded%c{}',
		10: '%c{yellow}Slightly Wounded%c{}',
	};

	let text = '%c{green}Normal%c{}';
	for (let key in status) {
		if (Game.player.hp < key) {
			text = status[key];
			break;
		}
	}

	this.display.draw(OFFSET + 2, TOP_OFFSET, 'Health: ');
	this.display.drawText(OFFSET + 6, TOP_OFFSET, text);

	TOP_OFFSET += 2;
	this.display.draw(OFFSET + 2, TOP_OFFSET, 'Ammo: ');
	this.display.draw(OFFSET + 5, TOP_OFFSET, Game.player.ammo.toString(10), '#00ca37');
	
	// TOP_OFFSET += 2;
	// OFFSET -= 1;
	// this.display.draw(OFFSET, TOP_OFFSET, 'Enemies: ');
	// for(i = 0; i < Object.keys(Game.enemies).length; i++) this.display.draw(OFFSET + 3 + i, TOP_OFFSET, '*', 'red');
	// for(i = Object.keys(Game.enemies).length; i < ENEMIES; i++) this.display.draw(OFFSET + 3 + i, TOP_OFFSET, '*', 'grey');
	TOP_OFFSET += 2;
	OFFSET += 5;

	// this.display.draw(OFFSET, TOP_OFFSET, 'Enemy HP: ' + ENEMY_HP[Game.level - 1]);
	// this.display.draw(OFFSET, TOP_OFFSET + 2, 'Enemy damage: ' + ENEMY_DAMAGE[Game.level - 1]);

	// TOP_OFFSET += 4;
	this.display.draw(OFFSET, TOP_OFFSET, 'Current score: ' + Game.score);
	this.display.draw(OFFSET, TOP_OFFSET + 2, 'Turns taken: ' + Game.turns);

	OFFSET += 1;
	TOP_OFFSET += 4;
	this.display.draw(OFFSET, TOP_OFFSET, Game.player.char + ' - human (you)', '#0f0');
	this.display.draw(OFFSET, TOP_OFFSET + 1, CHAR_LOCKER + ' - locker to hide', COLOR_LOCKER);
	this.display.draw(OFFSET, TOP_OFFSET + 2, CHAR_LIGHT + ' - lamp to shine', COLOR_LIGHT);
	this.display.draw(OFFSET, TOP_OFFSET + 3, CHAR_EGG+CHAR_HUGGER+CHAR_SOLDIER + ' - aliens', 'red');
	this.display.draw(OFFSET, TOP_OFFSET + 4, '. - passage', DEFAULT_COLOR);
	this.display.draw(OFFSET, TOP_OFFSET + 5, '# - wall', DEFAULT_COLOR);

	TOP_OFFSET += 8;
	this.display.draw(OFFSET, TOP_OFFSET, 'Quick help:', 'white');
	this.display.draw(OFFSET, TOP_OFFSET + 1, 'Arrows to move in 4 directions', 'white');
	this.display.draw(OFFSET, TOP_OFFSET + 2, 'qweasdzc to move in 8 directions', 'white');
	this.display.draw(OFFSET, TOP_OFFSET + 3, 'v - wait a turn', 'white');
	this.display.draw(OFFSET, TOP_OFFSET + 4, 'f - interact with nearest', 'white');
	this.display.draw(OFFSET, TOP_OFFSET + 5, 'x - shoot to nearest', 'white');
	this.display.draw(OFFSET, TOP_OFFSET + 6, 'h - full help', 'white');

	OFFSET = WIDTH + 2;
	TOP_OFFSET += 12;
	let LIMIT = EXTRA_WIDTH - 3;
	this.display.drawText(OFFSET, TOP_OFFSET-2, 'Messages:');
	for(var i = 0; i < Game.messages.length; i++) {
		let lines = this.display.drawText(OFFSET, TOP_OFFSET, Game.messages[i], LIMIT);
		TOP_OFFSET += lines;
	}
};

Game.printHelp = function() {
	Game.display.clear();
	Game.screen = 'help';
	let x = 5;
	let y = 1;
	let limit = WIDTH - 10;
	let lines = [
		'Help Menu',
		'',
		'Actions',
		' [cursor] - keys to move (or jump to locker).',
		' [qweasdzc] - alternate movement keys.',
		' [v] - wait a turn.',
		' [x] - shoot to nearest enemy. Costs an ammo.',
		' [f] - interact with nearest item. Search locker or switch the cameras.',
		' [h] - open/close this help menu',
		'',
		'Rules',
		'',
		'The game proceeds in a turn-based fashion: you make a move, then each of your enemies makes a move.',
		'Both you and your opponents have some amount of health. When enemy\'s health drops to zero, they die. When your wound ups to maximum, you lose the game.',
		'You can jump into lockers (with movement keys), which lets you disappear from sight as long as you are inside a locker.',
		'Enemies don\'t have eyes, but they have sonar. You can see sonar waves on your display.',
		'Beware of huggers and soldiers. Destroy eggs immediately.',
		'Main objective is to eliminate all enemies.',
	];
	for (let i = 0; i < lines.length; i++) {
		let count = Game.display.drawText(x, y, lines[i], limit);
		y += count;
	}
	Game.printStats();
}

window.addEventListener('keydown', Game.keyDown);

Game.addMessage = function(message, noPretty=false) {
	message += noPretty ? '' : '.';
	Game.messages.push(message);
	if (Game.messages.length > 10) {
		Game.messages.shift();
	}
}
Game.texts = [];
Game.texts[UID_NOTHING] = 'nothing';
Game.texts[UID_AMMO] = 'ammo';
Game.texts[UID_DETECTOR] = 'detector';
Game.texts[UID_MEDPAK] = 'medpack';
Game.itemName = function(uid) {
	return Game.texts[uid];
};
