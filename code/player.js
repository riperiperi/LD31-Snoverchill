var GRAVITY = 0.05;

var numbers = [
	"360",
	"720",
	"1080",
	"QUADRUPLE",
	"QUINTUPLE",
	"HEXTUPLE",
	"HEPTUPLE",
	"OCTUPLE",
	"NONUPLE",
	"DECUPLE",
	"WHAT"
]

var prefixes = [
	"MEGA",
	"ULTRA",
	"SUPER",
	"INSANE",
	"WICKED",
	"SICK",
	"RIDICULOUS",
	"CRAZY",
	"SIGNATURE"
]

var suffixes = [
	"-TACULAR",
	"-STRAVAGANZA",
	"",
	""
]

function Player(scene, net, snowman) {
	var t = this;
	t.scn = scene;
	t.pos = [0, 0];
	t.vel = [0, 0];
	t.angle = 0;
	t.angvel = 0;
	t.dead = false;
	t.deadTimer = 0;
	t.deaths = 0;
	t.kills = 0;
	t.active = true;
	var img = renderSnowman(snowman, scene.res)
	var jumpTime = 0;

	t.points = 0;

	var minimumMove = 0.05;

	var bigText = [];

	t.update = update;
	t.render = render;
	t.hit = hit;
	t.udie = udie;
	t.addPoints = addPoints;

	var COL_RADIUS = 16;
	var ATTACH_RADIUS = 18;

	var DEATH_TIME = 120;
	var ACCEL = 0.05;
	var ANG_ACCEL = 0.01;
	var TOP_SPEED = 4;
	var JUMP_VEL = 2;

	t.accumPoints = 0;
	t.lastTier = 0;
	t.net = net;
	t.invuln = 0;

	var drawHit = 0;
	t.HP = 3;
	var onG = 0;

	var shootTimer = 0;
	var bulletMode = "normal";

	var queueSendPos = 60; //set to true whenever we think it is reasonable to send a position. Otherwise position will be sent every second
	respawn(true);

	t.input = {};

	function getInput(){
		if (scene.mode == 2) t.input = {ccw: false, cw: false, jump: false}
		else if (!t.net) {
			var lastInput = t.input;
			t.input = {
				ccw: scene.game.keyDownArray[69],
				cw: scene.game.keyDownArray[82],
				jump: scene.game.keyDownArray[32]
			}

			if (t.input.cw != lastInput.cw || t.input.ccw != lastInput.ccw || t.input.jump != lastInput.jump) queueSendPos = 0;
		}
		return t.input;
	}

	function addFlipTier() {
		var tier = Math.floor(t.accumPoints/(Math.PI*2));
		if (!net) playSound("t"+Math.min(4, tier));
		else playReduced("t"+Math.min(4, tier));
		var p = Math.floor(tier/1.5);

		var text = ""
		for (var i=0; i<p; i++) {
			text += prefixes[Math.floor(Math.random()*prefixes.length)]+" ";
		}
		text += numbers[tier-1]+" FLIP"
		text += suffixes[Math.floor(Math.random()*suffixes.length)];

		bigText.push( {
			scale: 0,
			sv: 0.2,
			time: 0,
			text: text
		});
	}

	function respawn(noSound) {
		if(!noSound) playSound("respawn");
		var respawnLoc = scene.lvlInf.respawns[Math.floor(Math.random()*scene.lvlInf.respawns.length)];
		t.vel = vec2.scale([], respawnLoc.vel, TOP_SPEED);
		t.pos = [respawnLoc.pos[0], respawnLoc.pos[1]];
		t.angle = respawnLoc.angle;
		t.angvel = 0;
		t.accumPoints = 0;
		t.lastTier = 0;
		t.invuln = 60;
		t.HP = 3;
		t.dead = false;
		queueSendPos = 0;
	}

	function update() {
		if (!t.active || scene.mode == 0) return;
		if (t.invuln>0) t.invuln--;
		if (onG>0) onG--;
		if (jumpTime > 0) jumpTime--;
		getInput();
		updateBigText();

		if (!t.net) {
			if (queueSendPos <= 0) {
				queueSendPos = 60;
				scene.uploadPos(t);
			} else queueSendPos--;
		}

		if (t.dead) {
			if (--t.deadTimer == 0) respawn();
			else return;
		}

		var rot = mat2.create();
		mat2.rotate(rot, rot, t.angle);
		var attach = [0, ATTACH_RADIUS]

		var speed = Math.sqrt(vec2.dot(t.vel, t.vel));

		var hit = collider.raycast(t.pos, vec2.transformMat2(attach, attach, rot), scene);
		if (hit != null) {
			//calculate new speed
			var norm = vec2.normalize([], t.vel);
			if (speed < TOP_SPEED) {
				vec2.add(t.vel, t.vel, vec2.scale(norm, norm, ACCEL))
			} else {
				vec2.scale(t.vel, t.vel, 0.98)
			}
			t.angvel = 0;
			

			//{
			vec2.add(t.vel, t.vel, vec2.transformMat2([], [0, GRAVITY], rot));
			//}

			if (t.lastTier > 0) addFlipPoints();
			if (t.lastTier > 2) snowSplosion(rot);

			t.accumPoints = 0;
			t.lastTier = 0;

			makeItSnow(rot);
		} else {
			t.vel[1] += GRAVITY;

			if(t.input.ccw) {
				t.angvel -= ANG_ACCEL;
			}
			if(t.input.cw) {
				t.angvel += ANG_ACCEL;
			}

			t.angvel *= 0.95;
			t.angle += t.angvel;
			t.accumPoints += Math.abs(t.angvel);
			emitStar(rot);

			var tier = Math.floor(t.accumPoints/(Math.PI*2));
			if (tier != t.lastTier) addFlipTier();
			t.lastTier = tier;
		}

		if (onG>0 && t.input.jump && jumpTime == 0) { //Jump

			/*jumpfix
				nullify "vertical" velocity, then add our jump
			*/

			var n = vec2.transformMat2([], [0, 1], rot);
			var proj = vec2.dot(t.vel, n);
			vec2.sub(t.vel, t.vel, vec2.scale(vec2.create(), n, proj));

			snowSplosion(rot);
			playSound("jump");
			jumpTime = 10;
			vec2.add(t.vel, t.vel, vec2.transformMat2([], [0, -JUMP_VEL], rot));
		}

		var steps = 0;
		var remainingT = 1;
		var velSeg = vec2.clone(t.vel);
		var posSeg = vec2.clone(t.pos);
		while (steps++ < 10 && remainingT > 0.01) {
			var result = collider.sweepEllipse(posSeg, velSeg, scene, [COL_RADIUS, COL_RADIUS]);
			if (result != null) {
				colResponse(posSeg, velSeg, result)
				remainingT -= result.t;
				if (remainingT > 0.01) {
					vec2.scale(velSeg, t.vel, remainingT);
				}
			} else {
				vec2.add(posSeg, posSeg, velSeg);
				remainingT = 0;
			}
		}
		t.pos = posSeg;
		snow2snowCol();
		//die();
		if (!t.net) {
			shootCheck();
		}
	}

	function addFlipPoints() {
		var p = 0;
		var a = 125;
		for (var i=0; i<t.lastTier; i++) {
			p += a;
			a *= 2;
		}
		if (!net) playSound((t.lastTier>2)?"bigget":"smallget");
		else playReduced((t.lastTier>2)?"bigget":"smallget");
		addPoints("", p)
	}

	function addPoints(reason, pts) {
		if (net || scene.mode == 2) return;
		t.points += pts;
		scene.gameUI.addPtText(reason+((pts>0)?"+":"")+pts, t.pos)
	}

	function shootCheck() {
		if (scene.game.mouseDown && (scene.mode == 1) && t.invuln == 0) {
			if (shootTimer <= 0) {
				var mp = scene.getScreenRelative([scene.game.mouseX, scene.game.mouseY]);

				var vel = vec2.sub([], mp, t.pos);
				vec2.normalize(vel, vel);
				vec2.scale(vel, vel, 8);

				scene.sendBullet(bulletMode, Math.floor(Math.random()*23534542), t.pos, vel, scene.entities.indexOf(t));
				shootTimer = 10;
			}
		}
		if (shootTimer > 0) shootTimer--;
	}

	function hit(hitter, wep) {
		if (t.invuln>0) return;
		playSound("hit");
		if (--t.HP == 0) {
			die([hitter, wep, scene.entities.indexOf(t)]);
			addPoints("KILLED ", -500);
		} else {
			drawHit = 5;
		}
	}

	function snow2snowCol() {
		for (var i=0; i<scene.entities.length; i++) {
			var ent = scene.entities[i];
			if (ent != t && ent.active && (!ent.dead) && (ent.invuln == 0) && (t.invuln == 0) && vec2.dist(ent.pos, t.pos) < (COL_RADIUS)*2.25) {
				die([i, "body", scene.entities.indexOf(t)]);
				addPoints("SUICIDE ", -250);
			}
		}
	}

	function updateBigText() {
		for (var i=0; i<bigText.length; i++) {
			var elem = bigText[i];
			if (++elem.time > 60) {
				bigText.splice(i--, 1);
			} else {
				elem.sv += (1-elem.scale)/10;
				elem.sv *= 0.9;
				elem.scale += elem.sv;
			}
		}
	}

	function colResponse(pos, pvel, dat) {
		var n = vec2.normalize([], dat.normal);
		var adjustPos = true;

		var proj = vec2.dot(t.vel, n);
		vec2.sub(t.vel, t.vel, vec2.scale(vec2.create(), n, proj));
		onG = 5;

		if (adjustPos) { //move back from plane slightly
			vec3.add(pos, pos, vec3.scale(vec3.create(), pvel, dat.t));
			vec3.add(pos, vec3.scale([], n, COL_RADIUS+minimumMove), dat.colPoint);
		} else {
			vec3.add(pos, pos, vec3.scale(vec3.create(), pvel, dat.t));
		}

		var targAng = calcAngleFromNorm(n);
		if (Math.abs(dirDiff(t.angle, targAng)) > 60*(Math.PI/180) && (t.invuln == 0)) {
			addPoints("SUICIDE ", -250);
			die([scene.entities.indexOf(t), "suicide", scene.entities.indexOf(t)]);
		}

		t.angle = targAng;
	}

	function fixDir(dir) {
		return posMod(dir, Math.PI*2);
	}

	function dirDiff(dir1, dir2) {
		var d = fixDir(dir1-dir2);
		return (d>Math.PI)?(-2*Math.PI+d):d;
	}

	function posMod(i, n) {
		return (i % n + n) % n;
	}

	function calcAngleFromNorm(norm) {
		var dot = vec2.dot(norm, [0, -1]);
		if (norm[0] < 0) return -Math.acos(dot);
		else return Math.acos(dot);
	}

	function udie() {
		queueSendPos = 0;
		t.HP = 0;
		playSound("boom");
		t.dead = true;
		t.deadTimer = DEATH_TIME;

		var p = Particles.snow;

		for (var i=0; i<100; i++) {
			var col = Math.floor(Math.random()*32)+(256-32);
			scene.addParticle({
				update: p.update,
				render: p.render,
				p: [t.pos[0], t.pos[1]],
				v: [Math.random()*5-2.5, Math.random()*5-2.5],
				time: 0,
				expire: 30,
				fill: "rgb("+col+","+col+","+col+")",
				r: Math.random()*3+1
			})
		}

		p = Particles.collidingImg;

		for (var i=0; i<20; i++) {
			var col = Math.floor(Math.random()*32)+(256-32);
			scene.addParticle({
				update: p.update,
				render: p.render,
				p: [t.pos[0], t.pos[1]],
				v: [Math.random()*10-5, Math.random()*10-5],
				time: 0,
				expire: 90,
				img: scene.res["playerp/d"+((i%5)+1)+".png"],
				scene: scene,
				rv: Math.random()*0.5-0.25,
				r: 0
			})
		}
	}

	function die(reason) {
		if (t.dead || t.invuln>0) return;
		if (!net) {
			t.deaths++;
			udie();
			scene.playerDeath(t, reason);
		}
	}


	function snowSplosion(rot) {
		var p = Particles.snow;

		var board = [0, COL_RADIUS];
		var bind = vec2.add([], t.pos, vec2.transformMat2(board, board, rot));

		var up = [0, -5]
		var spikeUpBase = vec2.transformMat2(up, up, rot);
		var side = [5, 0]
		var spikeSideBase = vec2.transformMat2(side, side, rot);

		for (var i=0; i<50; i++) {
			var col = Math.floor(Math.random()*32)+(256-32);
			scene.addParticle({
				update: p.update,
				render: p.render,
				p: [bind[0], bind[1]],
				v: vec2.add([], vec2.scale([], spikeUpBase, Math.random()), vec2.scale([], spikeSideBase, Math.random()*2-1)),
				time: 0,
				expire: 30,
				fill: "rgb("+col+","+col+","+col+")",
				r: Math.random()*3+1
			})
		}
	}

	function emitStar(rot) {
		if (t.accumPoints < 1) return;
		var p = Particles.starImg;
		var i = Math.min(Math.floor((Math.random()*t.accumPoints)/Math.PI), 2);

			var speedBase = vec2.scale([], t.vel, -1);

			scene.addParticle({
				update: p.update,
				render: p.render,
				p: [t.pos[0], t.pos[1]],
				v: vec2.add(speedBase, speedBase, [Math.random()*5-2.5, Math.random()*5-2.5]),
				time: 0,
				expire: 60,
				img: scene.res["img/star"+i+".png"],
				scene: scene,
				rv: Math.random()*0.5-0.25,
				s: (Math.random()*Math.min(1, t.accumPoints/15)),
				r: 0
			})
	}

	function makeItSnow(rot) {
		var speed = Math.sqrt(vec2.dot(t.vel, t.vel));
		if (speed < 1) return;

		var p = Particles.snow;

		var board = [0, COL_RADIUS];
		var bind = vec2.add([], t.pos, vec2.transformMat2(board, board, rot));
		var speedBase = vec2.scale([], t.vel, -1);
		var up = [0, -1]
		var spikeUpBase = vec2.transformMat2(up, up, rot);
		vec2.scale(spikeUpBase, spikeUpBase, speed);

		for (var i=0; i<5; i++) {
			var col = Math.floor(Math.random()*32)+(256-32);
			scene.addParticle({
				update: p.update,
				render: p.render,
				p: [bind[0], bind[1]],
				v: vec2.add([], vec2.scale([], speedBase, Math.random()*0.7+0.3), vec2.scale([], spikeUpBase, Math.random()*0.7+0.3)),
				time: 0,
				expire: 30,
				fill: "rgb("+col+","+col+","+col+")",
				r: Math.random()*(speed/2)+0.5
			})
		}
	}

	function renderBT(ctx) {
		ctx.font = "30px Impact, Arial Black, sans-serif";
		ctx.lineWidth = 5;
		ctx.strokeStyle = "black";
		ctx.fillStyle = "white";
		for (var i=0; i<bigText.length; i++) {
			var e = bigText[i];
			ctx.save();
			ctx.globalAlpha = Math.min((60-e.time)/15, 1);
			ctx.translate(t.pos[0], t.pos[1]-10-(e.time));
			ctx.scale(e.scale/2, e.scale/2);
			var m = ctx.measureText(e.text);
			ctx.strokeText(e.text, -m.width/2, -30/2);
			ctx.fillText(e.text, -m.width/2, -30/2);
			ctx.restore();
		}
	}

	function render(ctx) {
		if (!t.active) return;
		renderBT(ctx);
		if (t.dead) return;
		ctx.save();
		if (t.invuln>0) ctx.globalAlpha = 0.5;
		ctx.translate(t.pos[0], t.pos[1]);
		ctx.rotate(t.angle);

		ctx.save();
		ctx.scale(0.5, 0.5);
		ctx.drawImage(img, -img.width/2, -img.height/2);
		ctx.restore();

		if (drawHit>0) {
			ctx.globalAlpha = (drawHit/5)*0.3;
			ctx.beginPath();
			ctx.arc(0, 0, COL_RADIUS, 0, 2 * Math.PI, false);
			ctx.fillStyle = "#FF0000";
			ctx.fill();
			ctx.globalAlpha = 1;
			drawHit--;
		}

		//draw name

		ctx.font = "20px Trebuchet MS, Arial, sans-serif";
		ctx.lineWidth = 5;
		ctx.strokeStyle = "black";
		ctx.fillStyle = "white";

		ctx.translate(0, 32);
		ctx.scale(0.5, 0.5);
		var m = ctx.measureText(t.name);
		ctx.strokeText(t.name, -m.width/2, -20/2);
		ctx.fillText(t.name, -m.width/2, -20/2);

		ctx.restore();

	}

	function playReduced(snd) {
		var source = scene.ac.createBufferSource();
		var g = scene.ac.createGain();
		g.gain.value = 0.5;
		source.buffer = scene.res["snd/"+snd+".wav"];
		source.connect(g);
		g.connect(scene.ac.destination);
		source.start(0);
	}

	function playSound(snd) {
		var source = scene.ac.createBufferSource();
		source.buffer = scene.res["snd/"+snd+".wav"];
		source.connect(scene.ac.destination);
		source.start(0);
	}
}