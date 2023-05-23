
// mostly from https://github.com/laurheth/pocket-universe-7drl/blob/master/script/animation.js
let Animator = {
	running: false,
	anims: [],
	shoot: function(attacker, target, char, color) {
		let duration = 5;
		let shootAnim = {
			t:0,
			anim: function(t) {
				let frac = 1.0 * t / duration;
				let x = Math.round(frac * (target.x - attacker.x) + attacker.x);
				let y = Math.round(frac * (target.y - attacker.y) + attacker.y);
				Game.display.draw(x, y, char, color);
				if (t >= duration) {
					target.getAttacked();
					return true;
				}
				return false;
			},
		};
		this.anims.push(shootAnim);
	},

	exterminate: function(sx, sy, r, char, color) {
		var duration=3;
		var attacked_enemy_positions = {};
		var extermAnim = {
			t:0,
			anim: function(t) {
				for(var i = -r; i <= r; i++)
					for(var j = -r; j <= r; j++) {
						let x = sx + i;
						let y = sy + j;
						var key = makeKey(x, y);
						if ((key in Game.map) && Game.map[key] === CHAR_ENEMY && !(key in attacked_enemy_positions)) {
							attacked_enemy_positions[key] = true;
						}
						if (Game.isPassable(makeKey(x, y))) {
							Game.display.draw(x, y, char, color);
						}
					}
				if (t>=duration) {
					for(var key in attacked_enemy_positions) {
						Game.enemies[key].getAttacked(10);
					}
					return true;
				}
				return false;
			},
		};
		this.anims.push(extermAnim);
	},

	wind: function(sx, sy, r, char, color) {
		var duration=WIND_RADIUS;
		var queue = [[sx, sy]];
		var used = {};
		used[makeKey(sx, sy)] = true;
		var windAnim = {
			t:0,
			anim: function(t) {
				var new_queue = [];
				for(var i = 0; i < queue.length; i++) {
					var x = queue[i][0];
					var y = queue[i][1];
					for(var dx = -1; dx <= 1; dx++) {
						for(var dy = -1; dy <= 1; dy++) {
							var newx = x + dx;
							var newy = y + dy;
							key = makeKey(newx, newy);
							if (Game.isPassable(key) && !(key in used)) {
								used[key] = true;
								new_queue.push([newx, newy]);
								Game.display.draw(newx, newy, char, color);
								if ((key in Game.map) && Game.map[key] === CHAR_ENEMY) {
									Game.enemies[key].loseTorch();
								}

							}
						}
					}
				}
				queue = new_queue;
				return (t>=duration);
			},
		};
		this.anims.push(windAnim);
	},

	startAnimation() {
		if (this.anims.length>0) {
			Game.engine.lock();
			this.runAnimation();
		}
		else {
			this.running = false;
		}
	},
	runAnimation() {
		Game.drawMap();
		Animator.running=true;
		if (Animator.anims.length>0) {
			//let i=0;
			for (let i=Animator.anims.length-1;i>=0;i--) {
				let done = Animator.anims[i].anim(Animator.anims[i].t);
				Animator.anims[i].t++;
				if (done) {
					if (Animator.anims.length>=1) {
						// this might be a bug?
						Animator.anims.shift();
					}
					else {
						Animator.anims=[];
					}
				}
			}

		}
		if (Animator.anims.length>0) {
			setTimeout(Animator.runAnimation,70);
		}
		else {
			Animator.running=false;
			Game.engine.unlock();
			Game.drawMap();
		}
	},
};