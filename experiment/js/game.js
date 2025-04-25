let Game = {
	init: function() {
		this.display = new ROT.Display({
			width: WIDTH + EXTRA_WIDTH,
			height: HEIGHT,
			fontSize: 19,
			forceSquareRatio: true,
			bg: '#000000',
		});
		canvas = this.display.getContainer();
		canvas.setAttribute('id', 'canvas');
		document.body.appendChild(canvas);
		this.scheduler = new ROT.Scheduler.Simple();
		Game.start();
	},

	keyDown: function(e) {
		if (Animator.running) {
			return;
		}
		switch(Game.screen) {
			case 'game':
				Game.player.handleEvent(e);
				break;
			case 'help':
				Game.screen = 'game';
				Game.drawMap();
				break;
			case 'start':
				Game.screen = 'game';
				Game.player.updateLight();
				Game.recomputeLights();
				Game.drawMap();
				break;
			case 'debug':
				Game.handleDebug(e);
				break;
			default:
				Game.start();
		}
	},

	start: function() {
		this.screen = 'game';
		this.debug = JSON.parse(localStorage.getItem('experiment_debugs')) || {};
		this.player = null;
		this.engine = null;
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

	printTotalScores: function(x, y, color) {
		let percent1 = Math.floor(Game.enemiesCount * 100 / Game.enemiesMax);
		this.display.draw(x, y, 'Final score: '+percent1+'%', color);
		if (percent1 >= 100) {
			y += 2;
			let percent2 = Math.floor(Game.percents * 100 / Game.percentsTotal);
			this.display.draw(x, y, 'Additional score: '+percent2+'%', color);
			y += 2;
			this.display.draw(x, y, 'Total score: '+(percent1+percent2)+'%', color);
		}
		return y;
	},

	gameOver: function(type) {
		this.screen = 'lose';
		this.scheduler.clear();
		this.display.clear();

		if (type === 'pressure') {
			type = 'YOU SUFFOCATED';
		} else {
			type = 'YOU DIED';
		}
		let x = Math.floor(WIDTH / 2);
		let y = Math.floor(HEIGHT / 2) - 2;
		this.display.draw(x, y, type, 'lightcoral');
		y += 2;
		y += Game.printTotalScores(x, y, 'lightcoral');
		y += 3;

		this.display.draw(x, y, 'Press [F] to restart', 'white');
		Game.printStats();
	},

	endLevel: function() {
		this.screen = 'win';

		this.scheduler.clear();
		this.display.clear();

		let x = Math.floor(WIDTH / 2);
		let y = Math.floor(HEIGHT / 2) - 2;
		this.display.draw(x, y, 'YOU ESCAPED', 'lightgreen');
		y += 2;
		y += Game.printTotalScores(x, y, 'lightgreen');
		y += 3;

		this.display.draw(x, y, 'Press [F] to restart', 'white');
		Game.printStats();
	},

	nextLevel: function() {
		this.screen = 'start';
		this.messages = [];
		this.engine = new ROT.Engine(this.scheduler);
		this.entities = {};
		this.enemies = {};
		this.enemiesCount = 0;
		this.enemiesMax = 0;
		this.percents = 0;
		this.percentsTotal = 0;
		this.map = {};
		this.walls = {};
		this.cameras = {};
		this.doors = {};
		this.litUp = {};
		this.known = {};
		this.pressure = 101;
		Game.generateMap();

		this.display.clear();
		let texts = [
			['You wake up in locker at the space station.', 'lightblue'],
			['You hear some angry noises around.', 'lightblue'],
			['You need to find the capsule and escape.', 'lightblue'],
			['Press [F] to start', 'white'],
		];

		let x = Math.floor((WIDTH + EXTRA_WIDTH) / 2);
		let y = Math.floor(HEIGHT / 2) - 2;
		for (let i = 0; i < texts.length; i++) {
			let text = texts[i][0];
			let color = texts[i][1];
			let x1 = x - Math.floor(text.length / 2);
			y += this.display.drawText(x1, y, makeColored(text, color));
		}
	},
};
window.addEventListener('keydown', Game.keyDown);

/*
чтобы переключить камеру и залезть в шкаф - нужно зайти на клетку с ними
датчик того, что игрок спрятался и что он стоит на предмете
детектор! oOooOO0
ключи к шкафам в других шкафах
точка выхода из игры - шлюз с шатлом
дополнительные очки за сэкономленные ячейки
дверь можно захлопнуть перед солдатом, и он будет её выламывать
*/