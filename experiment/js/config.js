WIDTH = 60;
EXTRA_WIDTH = 22;
HEIGHT = 46;
DEFAULT_COLOR = '#e2c900';
MAP_SATURATION = 0.35;
TORCH_DISTANCE = 5;
SHOOT_DISTANCE = TORCH_DISTANCE - 1;
STARTING_ENEMY_DISTANCE = 7;

CORROSION_LIMIT = 25;

PLAYER_HP = 10;

LIGHT_RADIUS = 10;
DETECTOR_RADIUS = 10;

UID_NOTHING = -1;
UID_AMMO = 1;
UID_DETECTOR = 2;
UID_MEDPAK = 3;

CHAR_PLAYER = '@';
CHAR_FLOOR = '.';
CHAR_WALL = '#';
// CHAR_LIGHT = '\u00A4';
CHAR_CAPSULE = '\u0394';
CHAR_LIGHT = 'T';
CHAR_LOCKER = 'H';
CHAR_LOCKER_EMPTY = 'h';
CHAR_DOOR = 'D';
CHAR_DOOR_OPENED = 'd';

CHAR_EGG = '\u00A9';
CHAR_EGG_EMPTY = '\u00A2';
CHAR_HUGGER = '\u00A3';
CHAR_SOLDIER = '\u00A7';
CHAR_ENEMY_DEAD = '$';
COLOR_ENEMY_DEAD = '#cc0000';

COLOR_PLAYER = '#00ff00';
COLOR_PLAYER_DARK = '#008800';
COLOR_CAPSULE = 'lightblue';

COLOR_LIGHT = '#aeeafc';
COLOR_LIGHT_OFF = '#3ccbfa';
COLOR_LIGHT_DARK = '#377b91';

COLOR_LOCKER = '#90ee90';
COLOR_LOCKER_DARK = '#528752';

COLOR_ENEMY = '#ff0000';

COLOR_FLOOR = '#e2c900';
COLOR_SHINING = '#ffe30026';

COLOR_DOOR = '#90ee90';
COLOR_DOOR_DARK = '#528752';

TYPE_FLOOR = 0;
TYPE_WALL = 1;
TYPE_LOCKER = 2;
TYPE_CAMERA = 3;
TYPE_DOOR = 4;
TYPE_CAPSULE = 5;

let makeKey = function(x, y) {
	return x + ',' + y;
};
let makeColored = function(text, color) {
	return `%c{${color}}${text}%c{}`;
}
let randomIndex = function(arr) {
	return ROT.RNG.getUniformInt(0, arr.length-1);
};
let computePath = function(x1, y1, x2, y2, mode = 'pass') {
	let cb = mode === 'pass' ? Game.visibleCallback : Game.breakableCallback;
	let astar = new ROT.Path.AStar(x2, y2, cb, {topology:8});
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
