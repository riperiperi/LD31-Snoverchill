//gameScene

function gameScene(files, game, clientScene) {
	var t = this;
	var test2;
	t.lvlCol = null;
	t.lvlImg = null;
	t.lvlInf = null;

	t.res = files;
	t.entities = [];
	t.particles = [];
	t.bullets = [];
	t.game = game;
	t.mode = -1;
	t.time = 0;
	t.ac = game.ac;
	t.disconnected = false;

	t.chatMode = 0;
	t.chatMsg = "";

	var lastEnter = false;

	var fullView = false;
	var lastW = false;
	var music;

	this.kill = kill;
	this.render = render;
	this.update = update;
	this.setLevel = setLevel;
	this.addParticle = addParticle;
	this.uploadPos = uploadPos;
	this.fireBullet = fireBullet;
	this.sendBullet = sendBullet;
	this.playerDeath = playerDeath;
	this.setMode = setMode;
	this.getScreenRelative = getScreenRelative;
	this.recvChat = recvChat;
	this.keyPress = keyPress;

	t.camPos = {
		x: 512,
		y: 768/2,
		scale: 0.9999999
	}

	t.camFol = {
		x: 0,
		y: 0,
		scale: 2
	}

	init();

	function init() {
		music = t.ac.createBufferSource();
		music.buffer = t.res["snd/music.ogg"];
		music.loop = true;
		music.connect(t.ac.destination);
		music.start(0);
	}

	function kill() {
		music.stop(0);
	}

	function playSound(snd) {
		var source = t.ac.createBufferSource();
		source.buffer = t.res["snd/"+snd+".wav"];
		source.connect(t.ac.destination);
		source.start(0);
	}

	function setMode(mode) {
		t.mode = mode;
		switch (mode) {
			case 0: //we need to put all players in their starting positions!
				for (var i=0; i<t.entities.length; i++) {
					var e = t.entities[i];
					var respawnLoc = t.lvlInf.respawns[i%t.lvlInf.respawns.length];
					e.vel = vec2.scale([], respawnLoc.vel, 4);
					e.pos = [respawnLoc.pos[0], respawnLoc.pos[1]];
					e.angle = respawnLoc.angle;
					e.angvel = 0;
					e.accumPoints = 0;
					e.lastTier = 0;
					e.invuln = 60;
					e.dead = false;
				}
				t.gameUI.duration = 3;
			break;
			case 1:
				t.gameUI.duration = 120;
			break;
			case 2:
				t.gameUI.duration = 7;
			break;
		}
	}	

	function startLevel() {
		t.entities = [];
		t.particles = [];
		t.bullets = [];
		t.gameUI = new gameUI(t);
		//t.entities.push(newCx Player(t));
	}

	var ignoreKeys = [0, 13]

	function keyPress(evt) {
		var cc = String.fromCharCode(evt.charCode);
		console.log(evt.charCode);
		if (t.chatMode) {
			if (evt.keyCode == 8) {
				if (t.chatMsg.length > 0) {
					t.chatMsg = t.chatMsg.substr(0, t.chatMsg.length-1);
					console.log("here");
				}
			} else if (ignoreKeys.indexOf(evt.charCode) == -1) t.chatMsg += cc;
		}
	}

	function getScreenRelative(pos) {
		var pos = [pos[0], pos[1]];
		vec2.scale(pos, pos, 1/t.camPos.scale);
		vec2.add(pos, pos, [t.camPos.x-(1024/2)/t.camPos.scale, t.camPos.y-(768/2)/t.camPos.scale])
		return pos;
	}

	function render(ctx) {
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

		ctx.save();

		ctx.translate(ctx.canvas.width/2, ctx.canvas.height/2);

		//draw parallax
			var xLimMin = (1024/2)/t.camPos.scale;
			var xLimMax = 1024-(1024/2)/t.camPos.scale;
			var yLimMin = (768/2)/t.camPos.scale;
			var yLimMax = 768-(768/2)/t.camPos.scale;

			var xScrollP = (t.camPos.x-xLimMin)/(xLimMax-xLimMin);
			var yScrollP = (t.camPos.y-yLimMin)/(yLimMax-yLimMin);

			ctx.save();
			var scaleMod = 1+(t.camPos.scale-1)/4;

			xLimMin = (1024/2)/scaleMod;
			xLimMax = 1024-(1024/2)/scaleMod;
			yLimMin = (768/2)/scaleMod;
			yLimMax = 768-(768/2)/scaleMod;

			var newCx = xLimMin+xScrollP*(xLimMax-xLimMin);
			var newCy = yLimMin+yScrollP*(yLimMax-yLimMin);

			ctx.scale(scaleMod, scaleMod);
			ctx.translate(-newCx, -newCy);

			ctx.scale(0.5, 0.5);
			ctx.drawImage(t.res["img/bg.png"], 0, 0);
			ctx.restore();



		ctx.scale(t.camPos.scale, t.camPos.scale);
		ctx.translate(-t.camPos.x, -t.camPos.y);

		ctx.save();
		ctx.scale(0.5, 0.5);
		ctx.drawImage(t.lvlImg, 0, 0);
		ctx.restore();

		//if (game.keyDownArray[68]) renderDebug(ctx);
		for (var i=0; i<t.particles.length; i++) {
			t.particles[i].render(ctx, t.particles[i])
		}
		for (var i=0; i<t.entities.length; i++) {
			t.entities[i].render(ctx);
		}
		for (var i=0; i<t.bullets.length; i++) {
			t.bullets[i].render(ctx);
		}

		ctx.restore();

		t.gameUI.render(ctx);

		if (t.disconnected) {
			ctx.globalAlpha = 0.66;
			ctx.fillStyle = "black";
			ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			ctx.globalAlpha = 1;
		}
	}

	function renderDebug(ctx) {
		for (var i=0; i<t.lvlCol.lines.length; i++) {
			var line = t.lvlCol.lines[i];
			ctx.beginPath();
			ctx.moveTo(line.p1[0], line.p1[1]);
			ctx.lineTo(line.p2[0], line.p2[1]);
			ctx.stroke();
		}
	}

	function addParticle(p) {
		t.particles.push(p);
	}

	function recvChat(obj) {
		t.gameUI.queueMsg(t.entities[obj.o].name+": "+obj.m);
	}

	function sendMsg() {
		clientScene.sendPacket({
			t:"c",
			m:t.chatMsg
		});
		t.chatMsg = "";
	}

	function update() {
		if (t.disconnected) return;

		if ((game.keyDownArray[13] != lastEnter) && game.keyDownArray[13]) {
			if (t.chatMode && (t.chatMsg.length>0)) sendMsg();
			t.chatMode = !t.chatMode;
		}

		lastEnter = game.keyDownArray[13];

		if ((!t.chatMode) && (game.keyDownArray[87] != lastW) && game.keyDownArray[87]) {
			fullView = !fullView;
		}
		lastW = game.keyDownArray[87];

		var p;
		for (var i=0; i<t.entities.length; i++){
			if (!t.entities[i].net) p = t.entities[i];
		}

		t.camFol.scale = (fullView || (t.mode != 1))?1:(2-(Math.sqrt(vec2.dot(p.vel, p.vel))/8));
		t.camFol.x = p.pos[0];
		t.camFol.y = p.pos[1];

		t.camPos.x += (t.camFol.x-t.camPos.x)/10;
		t.camPos.y += (t.camFol.y-t.camPos.y)/10;
		t.camPos.scale += (t.camFol.scale-t.camPos.scale)/20;

		if (t.camPos.x < (1024/2)/t.camPos.scale) t.camPos.x = (1024/2)/t.camPos.scale;
		if (t.camPos.x > 1024-(1024/2)/t.camPos.scale) t.camPos.x = 1024-(1024/2)/t.camPos.scale;
		if (t.camPos.y < (768/2)/t.camPos.scale) t.camPos.y = (768/2)/t.camPos.scale;
		if (t.camPos.y > 768-(768/2)/t.camPos.scale) t.camPos.y = 768-(768/2)/t.camPos.scale;

		for (var i=0; i<t.entities.length; i++) {
			t.entities[i].update();
		}

		for (var i=0; i<t.particles.length; i++) {
			if (t.particles[i].update(t.particles[i])) t.particles.splice(i--, 1);
		}

		for (var i=0; i<t.bullets.length; i++) {
			if (t.bullets[i].update(t.bullets[i])) t.bullets.splice(i--, 1);
		}

		t.gameUI.update();
	}

	function sendBullet(type, seed, pos, vel, owner) {
		clientScene.sendPacket({
			t:"b",
			b: type,
			s: seed,
			p: pos,
			v: vel,
			o: owner
		});
		fireBullet(type, seed, pos, vel, owner)
	}

	function playerDeath(p, cause) {
		t.gameUI.addKill(cause);
		clientScene.sendPacket({
			t:"x",
			c:cause,
			o:t.entities.indexOf(p)
		});
	}

	function fireBullet(type, seed, pos, vel, owner) {
		playSound("throw");
		var handle = Bullets["$"+type];
		if (handle != null) t.bullets.push(new handle(type, seed, pos, vel, owner, t));
	}

	function setLevel(name) {
		t.lvlCol = new SvgColParse(files["collision/"+name+".svg"]);
		t.lvlImg = files["img/"+name+".png"];
		t.lvlInf = files["levels/"+name+".json"]
		startLevel();
	}

	function uploadPos(ent) {
		clientScene.sendPacket({
			t:"p",
			d: {
				p: [ent.pos[0], ent.pos[1]],
				v: [ent.vel[0], ent.vel[1]],
				a: ent.angle,
				av: ent.angvel,
				d: ent.dead,
				dT: ent.deadTimer,
				aP: ent.accumPoints,
				lT: ent.lastTier,
				iv: ent.invuln,
				i: ent.input,
				pt: ent.points,
				D: ent.deaths,
				K: ent.kills
			}
		});
	}

	//websockets handlers
}