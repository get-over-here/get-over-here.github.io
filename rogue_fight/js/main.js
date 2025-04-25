import Game from './game.js';

(function() {
	let game = new Game();
	let img = new Image();
	img.onload = function() {
		game.init(img)
	};
	img.src = 'assets/fantasy-tileset_0.png';
	let f = new FontFace('Deepkyd', 'url(assets/deepkyd-normal.otf)');
	f.load().then(() => {
		// console.log('Font loaded');
	});
})();
