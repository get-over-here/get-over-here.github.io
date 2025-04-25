import {Tween, Group} from '../lib/tween.esm.js';
import Items from './items.js';

export default class Battle {
	constructor(game){
		this.game = game
	}
	enter(){

		// ROT.RNG.getUniformInt()

		const RND = {
			get item(){
				return ROT.RNG.getUniformInt(0, 7)
			}
		}


		this.maxHP = 15;
		this.player = {
			name: 'Player',
			health: 15,
			stat: {
				damage  : 1,
				defence : 0,
			},
			avatar : ['hero',0],
			slot: {
				head   : ['helmet',RND.item],
				left   : ['shield',RND.item],
				right  : ['sword',RND.item],
				body   : ['armor',RND.item],
				ammo   : ['bottle',RND.item],
				belt   : ['bottle',RND.item],
			},
		};
		this.enemy = {
			name: 'Enemy',
			health  : 15,
			stat: {
				damage  : 1,
				defence : 0,
			},
			avatar : ['enemy',0],
			slot: {
				head   : ['helmet',RND.item],
				left   : ['shield',RND.item],
				right  : ['sword',RND.item],
				body   : ['armor',RND.item],
				ammo   : ['bottle',RND.item],
				belt   : ['bottle',RND.item],
			},
		};

		this.log = [];
		this.side = 0;

		this.group = new Group();
		this.startCombat();
	}
	exit(){
	}
	draw(){
		this.group.update()

		this.game.ctx.strokeStyle = 'white';
		this.game.ctx.font = '16px Deepkyd';
		// this.game.ctx.fillText('Test', 20, 20);

		this.ox = 1;
		this.oy = 2;

		this.drawHP(this.player);
		this.slot(1, 1, this.player.avatar);
		this.slot(1, 0, this.player.slot.head);
		this.slot(1, 2, this.player.slot.body);
		this.slot(0, 2, this.player.slot.belt);
		this.slot(2, 2, this.player.slot.ammo);
		this.slot(2, 1, this.player.slot.left);
		this.slot(0, 1, this.player.slot.right);

		this.ox = 6;
		this.oy = 2;
		
		this.drawHP(this.enemy);
		this.slot(1, 1, this.enemy.avatar);
		this.slot(1, 0, this.enemy.slot.head);
		this.slot(1, 2, this.enemy.slot.body);
		this.slot(0, 2, this.enemy.slot.belt);
		this.slot(2, 2, this.enemy.slot.ammo);
		this.slot(2, 1, this.enemy.slot.left);
		this.slot(0, 1, this.enemy.slot.right);

		let x = 32;
		let y = 6*32;
		this.game.ctx.fillStyle = 'white';
		this.log.forEach((text)=>{
			this.game.ctx.fillText(text, x, y);
			y += 20;
		});
	}
	slot(ox, oy, item){
		ox = (this.ox + ox) * 32;
		oy = (this.oy + oy) * 32;
		this.game.ctx.strokeRect(ox, oy, 32, 32);

		if (!item[0]) {
			return
		}
		let [tile, offset] = item;
		this.game.renderTile(tile, ox, oy, offset);
	}
	drawHP(entity){
		let pieces = 5;
		let count = 3;
		let health = entity.health;

		// debug
		// this.game.ctx.fillText(entity.health, this.ox*32, this.oy*32);

		for (let current = pieces, pos = 0; current <= this.maxHP; current+=pieces, pos++) {
			let offset = 0;
			if (entity.health < current) {
				offset = (current - health) * 8;
			}
			if (offset > 40) {
				offset = 40
			}
			let px = pos * 8;
			this.game.ctx.drawImage(this.game.tileset, offset, 784, 8, 8, this.ox*32+4+px, this.oy*32+12, 8, 8);
		}
	}
	addLog(text) {
		this.log.push(text);
		if (this.log.length > 15) {
			this.log.shift();
		}
	}
	startCombat(){
		this.tween = new Tween({pos: 0})
			.to({pos: 1}, 1000)
			.repeat(Infinity)
			.delay(200)
			.onEveryStart(()=>{
				this.nextMove();
			})
			.start();
		this.group.add(this.tween);
	}
	endCombat(){
	}
	nextMove(){
		let attacker = this.player;
		let target = this.enemy;
		if (this.side === 1) {
			attacker = this.enemy;
			target = this.player;
			this.side = 0;
		} else {
			this.side = 1;
		}

		this.move(attacker, target);
	}
	move(attacker, target){
		let isHeal = this.heal(attacker);
		if (!isHeal) {
			this.attack(attacker, target);
		}
		this.afterMove();
	}
	afterMove(){
		if (this.player.health <= 0) {
			this.tween.stop();
			this.addLog(`${this.enemy.name} wins.`);
		}
		if (this.enemy.health <= 0) {
			this.tween.stop();
			this.addLog(`${this.player.name} wins.`);
		}
	}
	attack(attacker, target){
		let damage = this.calcStat(attacker, 'damage');
		let defence = this.calcStat(target, 'defence');
		let rollDamage = ROT.RNG.getUniformInt(1, damage);
		let rollDefence = ROT.RNG.getUniformInt(0, defence);

		let text = '';
		let diff = rollDamage - rollDefence;
		if (diff < 1) {
			diff = 1;
		}
		text = `${attacker.name} hits ${target.name} for ${diff}`;
		target.health -= diff;
		this.addLog(text);
	}
	heal(entity){
		let slotName = this.getMinPotion(entity);
		if (slotName === '') {
			return false;
		}
		let slot = entity.slot[slotName]
		let [tile, heal] = slot;
		if (entity.health < this.maxHP - heal) {
			let text = `${entity.name} heals for ${heal}`;
			this.addLog(text);
			entity.health += heal;
			entity.slot[slotName] = [];
			return true;
		}
		return false;
	}
	calcStat(entity, statName){
		let result = entity.stat[statName] || 0;
		for (let slotName in entity.slot) {
			result += this.getSlotItemStat(entity, slotName, statName);
		}
		return result;
	}
	getSlotItemStat(entity, slotName, statName){
		let slot = entity.slot[slotName];
		let [tile, level] = slot;
		if (!tile) {
			return 0;
		}
		let item = Items[tile][level];
		return item[statName] || 0;
	}
	getMinPotion(entity){
		let left = this.getSlotItemStat(entity, 'belt', 'heal');
		let right = this.getSlotItemStat(entity, 'ammo', 'heal');
		let result = '';
		if (left > right) {
			result = 'belt';
		} else if (left < right) {
			result = 'ammo';
		}
		return result;
	}
}
