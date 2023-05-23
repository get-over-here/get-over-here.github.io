
// mostly from https://github.com/laurheth/pocket-universe-7drl/blob/master/script/animation.js
let Animator = {
	running: false,
	anims: [],
	shoot: function(attacker, target, char, color) {
		let duration = 5;
		let shootAnim = {
			t: 0,
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
	startAnimation() {
		if (this.anims.length > 0) {
			Game.engine.lock();
			this.runAnimation();
		} else {
			this.running = false;
		}
	},
	runAnimation() {
		Game.drawMap();
		Animator.running = true;
		if (Animator.anims.length > 0) {
			for (let i = Animator.anims.length - 1; i >= 0; i--) {
				let done = Animator.anims[i].anim(Animator.anims[i].t);
				Animator.anims[i].t++;
				if (done) {
					if (Animator.anims.length>=1) {
						Animator.anims.shift();
					} else {
						Animator.anims = [];
					}
				}
			}

		}
		if (Animator.anims.length > 0) {
			setTimeout(Animator.runAnimation, 70);
		} else {
			Animator.running = false;
			Game.engine.unlock();
			Game.drawMap();
		}
	},
};