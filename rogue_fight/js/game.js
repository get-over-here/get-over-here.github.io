// import Play from './play.js';
import Tiles from './tiles.js';
import Battle from './battle.js';

export default class Game {
	clock = {
		fps: 60,
		stop: false,
		frameCount: 0,
		interval: 0,
		startTime: 0,
		lastTick: 0,
		then: 0,
		elapsed: 0,
	}
	screen = {
		width: 320,
		height: 640,
	}
	init(image) {
		this.tileset = image;

		this.cnv = document.getElementById('canvas');
		this.ctx = this.cnv.getContext('2d');
		this.ctx.font = '32px Deepkyd';
		this.ctx.textAlign = 'left';
		this.ctx.textBaseline = 'top';

		this.cnv.width = 320
		this.cnv.height = 640

		this.interval = 1000 / this.fps;
		this.then = Date.now();
		this.startTime = this.then;
		this.animate.bind(this);

		this.clock.fps = 60;
		this.clock.interval = 1000/this.clock.fps;
		this.clock.then = 0;
		this.clock.lastTick = window.performance.now();

		window.requestAnimationFrame(this.animate.bind(this));


		this.screens = {
			battle: new Battle(this),
		}

		this.resizeGame()

		this.switchScreen('battle');

	}
	resizeGame(){
		// if (window.innerHeight > window.innerWidth) {
		// 	vertical = buttonsTop
		// 	this.screenPortrait = true
		// } else {
		// 	this.screen.width = window.innerHeight
		// }
	}
	prepareTiles(name) {
		/*
		let canvas = document.createElement('canvas');
		let context = canvas.getContext('2d');

		canvas.width = tileSet.width;
		canvas.height = tileSet.height;

		context.drawImage(tileSet, 0, 0);
		let img = context.getImageData(0, 0, canvas.width, canvas.height);

		let tileFG = [238, 238, 204, 255];
		let tileBG = [17,   17,  51, 255];

		let data = img.data;
		for (let k = 0; k < data.length; k+=4) {
			if (data[k] === tileFG[0] && data[k+1] === tileFG[1] && data[k+2] === tileFG[2]) {
				data[k]   = 255;
				data[k+1] = 255;
				data[k+2] = 255;
			}

			if (data[k] === tileBG[0] && data[k+1] === tileBG[1] && data[k+2] === tileBG[2]) {
				data[k]   = 0;
				data[k+1] = 0;
				data[k+2] = 0;
			}
		}

		context.putImageData(img, 0, 0);
		document.body.appendChild(canvas);
		*/
	}
	animate(timestamp) {
		const delta = timestamp - this.clock.then;
		if (delta > this.clock.interval) {
			this.clock.then = timestamp - (delta % this.clock.interval);
			this.draw();
		}
		window.requestAnimationFrame(this.animate.bind(this));
	}
	loop(){
	}
	draw(){
		this.ctx.fillStyle = '#204631';
		this.ctx.fillRect(0, 0, this.cnv.width, this.cnv.height);
		if (this.currentScreen) {
			this.currentScreen.draw()
		}
	}
	renderTile(tile, dx, dy, offset = 0){
		let [sx, sy] = Tiles[tile]
		sx += offset;
		this.ctx.drawImage(this.tileset, sx*32, sy*32, 32, 32, dx, dy, 32, 32);
	}
	switchScreen(name, data) {
		if (this.currentScreen) {
			this.currentScreen.exit(data)
		}
		if (this.screens[name]) {
			this.currentScreen = this.screens[name]
		}
		if (this.currentScreen) {
			this.currentScreen.enter(data)
		}
	}
}