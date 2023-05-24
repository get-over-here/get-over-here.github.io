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
Game.printStats = function() {
	let OFFSET = WIDTH + 1;
	let TOP_OFFSET = 1;
	let status = {
		1: '%c{gray}Dead%c{}',
		3: '%c{red}Lethally%c{}',
		5: '%c{orange}Badly%c{}',
		8: '%c{gold}Wounded%c{}',
		10: '%c{yellow}Injured%c{}',
	};

	let text = '%c{green}Normal%c{}';
	for (let key in status) {
		if (Game.player.hp < key) {
			text = status[key];
			break;
		}
	}

	if (Game.player.hidden) {
		this.display.drawText(OFFSET, TOP_OFFSET, '%b{green}YOU ARE HIDDEN');
	} else {
		this.display.drawText(OFFSET, TOP_OFFSET, '%c{red}YOU ARE VISIBLE');
	}
	TOP_OFFSET += 1;

	let rightOffset = 10;
	this.display.drawText(OFFSET, TOP_OFFSET, 'Health: ');
	this.display.drawText(OFFSET+rightOffset, TOP_OFFSET, text);
	TOP_OFFSET += 1;
	text = makeColored(Game.player.ammo.toString(10), '#00ca37');
	this.display.drawText(OFFSET, TOP_OFFSET, 'Ammo: ');
	this.display.drawText(OFFSET+rightOffset, TOP_OFFSET, text);
	TOP_OFFSET += 1;
	this.display.drawText(OFFSET, TOP_OFFSET, 'Pressure: ');
	this.display.drawText(OFFSET+rightOffset, TOP_OFFSET, ''+(Game.pressure - 1));

	TOP_OFFSET += 3;

	TOP_OFFSET += this.display.drawText(OFFSET, TOP_OFFSET, makeColored(Game.player.char + ' \u00A0 - human (you)', '#0f0'));
	TOP_OFFSET += this.display.drawText(OFFSET, TOP_OFFSET, makeColored(CHAR_LOCKER+CHAR_LOCKER_EMPTY+'\u00A0 - locker', COLOR_LOCKER));
	TOP_OFFSET += this.display.drawText(OFFSET, TOP_OFFSET, makeColored(CHAR_LIGHT + ' \u00A0 - camera', COLOR_LIGHT));
	TOP_OFFSET += this.display.drawText(OFFSET, TOP_OFFSET, makeColored(CHAR_DOOR+CHAR_DOOR_OPENED + '\u00A0 - door', COLOR_DOOR));
	TOP_OFFSET += this.display.drawText(OFFSET, TOP_OFFSET, makeColored(CHAR_EGG+CHAR_HUGGER+CHAR_SOLDIER + ' - aliens', 'red'));
	TOP_OFFSET += this.display.drawText(OFFSET, TOP_OFFSET, makeColored(CHAR_CAPSULE + ' \u00A0 - escape pod', COLOR_CAPSULE));
	TOP_OFFSET += this.display.drawText(OFFSET, TOP_OFFSET, makeColored('. \u00A0 - passage', DEFAULT_COLOR));
	TOP_OFFSET += this.display.drawText(OFFSET, TOP_OFFSET, makeColored('# \u00A0 - wall', DEFAULT_COLOR));
	TOP_OFFSET += 2;

	text = `Quick help:

	arrows - move
	qweasdzc - move
	v - wait
	f - interact
	x - shoot
	h - full help`;
	TOP_OFFSET += this.display.drawText(OFFSET, TOP_OFFSET, text);
	TOP_OFFSET += 4;

	let LIMIT = EXTRA_WIDTH - 3;
	this.display.drawText(OFFSET, TOP_OFFSET-2, 'Messages:');
	for(var i = 0; i < Game.messages.length; i++) {
		let lines = this.display.drawText(OFFSET, TOP_OFFSET, makeColored(Game.messages[i], 'white'), LIMIT);
		TOP_OFFSET += lines;
	}
};

Game.printHelp = function() {
	Game.display.clear();
	Game.screen = 'help';
	let x = 2;
	let y = 1;
	let limit = WIDTH - 4;
	let lines = [
		'%c{white}Rules',
		'',
		'The game proceeds in a turn-based fashion: you make a move, then each of your enemies makes a move.',
		'Both you and your opponents have some amount of health. When enemy\'s health drops to zero, they die. When your wound ups to maximum, you lose the game.',
		'You can jump into lockers, which lets you disappear from sight as long as you are inside a locker.',
		'You can interact with item on your cell. Close door, search locker, switch camera, turn on escape pod, and fly away.',
		'Enemies don\'t have eyes, but they have sonar. You can see sonar waves on your display.',
		'Beware of huggers - they kills you instantly.',
		'',
		'%c{#00ff00}Main objective:',
		'%c{#00ff00} - eliminate all enemies;',
		'%c{#00ff00} - escape the station;',
		'',
		'%c{lightcoral}Note: destroy all eggs immediately!',
		'',
		'Actions',
		'',
		' [cursor] - keys to move (or jump to locker).',
		' [qweasdzc] - alternate movement keys.',
		' [v] - wait a turn.',
		' [x] - shoot to nearest enemy. Costs an ammo.',
		' [f] - interact with item.',
		' [h] - open/close this help menu',
	];
	for (let i = 0; i < lines.length; i++) {
		let count = Game.display.drawText(x, y, lines[i], limit);
		y += count;
	}
	Game.printStats();
};

Game.handleDebug = function(e) {
	switch(e.code) {
		case 'Backquote':
			Game.screen = 'game';
			Game.drawMap();
			return;
		case 'Digit1':
			Game.debug.enemies = !Game.debug.enemies;
			break;
		case 'Digit2':
			Game.debug.paths = !Game.debug.paths;
			break;
		case 'Digit3':
			Game.debug.lights = !Game.debug.lights;
			break;
		case 'Digit4':
			Game.debug.knowns = !Game.debug.knowns;
			break;
		case 'Digit5':
			Game.debug.entities = !Game.debug.entities;
			break;
		case 'KeyA':
			Game.debug.undead = !Game.debug.undead;
			break;

		case 'KeyS':
			Game.player.addItem(UID_AMMO);
			Game.screen = 'game';
			Game.drawMap();
			return;
		case 'KeyD':
			Game.player.addItem(UID_DETECTOR);
			Game.screen = 'game';
			Game.drawMap();
			return;
		case 'KeyZ':
			Game.player.addItem(UID_MEDPAK);
			Game.screen = 'game';
			Game.drawMap();
			return;
		case 'KeyX':
			Game.player.getAttacked(1);
			Game.screen = 'game';
			Game.drawMap();
			return;

		case 'KeyQ':
			Game.screen = 'win';
			Game.drawMap();
			return;
		case 'KeyW':
			Game.screen = 'lose';
			Game.drawMap();
			return;
	}
	localStorage.setItem('experiment_debugs', JSON.stringify(Game.debug));
	Game.drawDebug();
};
Game.drawDebug = function() {
	this.screen = 'debug';
	this.display.clear();

	let x = 1;
	let y = 1;
	y += this.display.drawText(x, y, '` - close');
	y += this.display.drawText(x, y, '1 - enemies '+Game.debug.enemies);
	y += this.display.drawText(x, y, '2 - paths '+Game.debug.paths);
	y += this.display.drawText(x, y, '3 - lights '+Game.debug.lights);
	y += this.display.drawText(x, y, '4 - knowns '+Game.debug.knowns);
	y += this.display.drawText(x, y, '5 - entities '+Game.debug.entities);
	y += this.display.drawText(x, y, 'a - undead '+Game.debug.undead);
	y += this.display.drawText(x, y, 'q - win');
	y += this.display.drawText(x, y, 'w - lose');
	y += this.display.drawText(x, y, 's - add ammo');
	y += this.display.drawText(x, y, 'd - add detector');
	y += this.display.drawText(x, y, 'z - add medpack');
	y += this.display.drawText(x, y, 'x - damage');
};

Game.drawChar = function(entity, litUp, known) {
	if (!known && !Game.debug.knowns) {
		return;
	}
	if (litUp || Game.debug.lights) {
		this.display.draw(entity.x, entity.y, entity.char, entity.colorOn, COLOR_SHINING);
	} else {
		this.display.draw(entity.x, entity.y, entity.char, entity.colorOff);
	}
};

Game.drawMap = function() {
	if (Game.screen === 'debug') {
		Game.debugConsole();
		return;
	}
	if (Game.screen === 'win') {
		Game.endLevel();
		return;
	}
	if (Game.screen === 'lose') {
		Game.gameOver();
		return;
	}
	this.display.clear();
	for (let key in this.map) {
		this.drawChar(this.map[key], key in this.litUp, key in this.known);
	}
	for (let key in this.entities) {
		let visible = key in this.litUp;
		let entity = this.entities[key];
		if (visible) {
			this.drawChar(entity, visible, visible);
		}
		if (this.debug.entities) {
			this.drawChar(entity, true, true);
		}
	}
	for (let key in this.enemies) {
		let visible = key in this.litUp;
		let enemy = this.enemies[key];
		if (visible) {
			if (!Animator.running) {
				for (let i = 0; i < enemy.fov.length; i++) {
					let [x, y] = enemy.fov[i];
					let key = makeKey(x, y);
					if (key in this.litUp) {
						if (!(key in this.enemies)) {
							if (!(key in this.entities)) {
								this.display.draw(x, y, CHAR_FLOOR, COLOR_ENEMY, COLOR_SHINING);
							}
						}
					}
				}
			}
			this.drawChar(enemy, visible, visible);
		} else if (Game.player.detector) {
			if (enemy.fov.length > 0) {
				let detected = Math.abs(enemy.x - Game.player.x) <= DETECTOR_RADIUS && Math.abs(enemy.y - Game.player.y) <= DETECTOR_RADIUS;
				if (detected) {
					this.display.draw(enemy.x, enemy.y, 'o', COLOR_ENEMY);
				}
			}
		}
		if (this.debug.paths) {
			if (enemy.path) {
				for (let i = 0; i < enemy.path.length; i++) {
					let [x, y] = enemy.path[i];
					this.display.draw(x, y, '+', 'pink');
				}
			}
		}
		if (this.debug.enemies) {
			this.drawChar(enemy, true, true);
		}
	}

	this.drawChar(this.player, true, true);
	this.printStats();
};

