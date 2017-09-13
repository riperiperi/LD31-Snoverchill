//gameUI

function gameUI(scene) {

	var t = this;
	t.update = update;
	t.render = render;
	t.addPtText = addPtText;
	t.addKill = addKill;
	t.queueMsg = queueMsg;
	t.duration = 0;
	var drawPts = 0;

	t.ptText = [];
	t.kills = [];
	t.chat = [];
	var killOff = 0;
	var chatOff = 0;
	var scoreBoard = 0;

	var openingScale = 0;
	var openingT = -1;

	var chatAnim = 0;

	function queueMsg(msg) {
		t.chat.splice(0, 0, {msg:msg, s:0, sv:0, time:0});
		chatOff -= 1;
	}

	function addPtText(text, pos) {
		t.ptText.push({
			text: text,
			pos: [pos[0], pos[1]-25],
			s: 0.2,
			sv: 0,
			vel: [0, 0],
			dir: vec2.scale([], vec2.normalize([], [-pos[0], 768-pos[1]]), 0.5)
		})
	}

	function addKill(cause) {
		var cause = cause.slice(0);
		cause.time = 0;
		cause.lastPos = null;
		cause.s = 0;
		cause.sv = 0.2;

		cause[0] = scene.entities[cause[0]].name;
		cause[1] = scene.res["deathico/"+cause[1]+".png"];
		cause[2] = scene.entities[cause[2]].name;

		if (cause[1] == null) cause[1] = scene.res["deathico/suicide.png"];

		t.kills.push(cause);
	}

	function update() {

		if (scene.mode == 0) {
			if (openingT != scene.time) {
				openingT = scene.time;
				openingScale = 10;
			}
			openingScale += (1-openingScale)/10
		}


		killOff -= killOff/10;
		for (var i=0; i<t.ptText.length; i++) {
			var e = t.ptText[i];
			vec2.add(e.vel, e.vel, e.dir);
			e.sv += 0.001;
			e.s += e.sv;
			vec2.add(e.pos, e.pos, e.vel);
			if (e.pos[0] < -200) t.ptText.splice(i--, 1);
		}

		chatOff -= chatOff/10;
		for (var i=0; i<t.chat.length; i++) {
			if (++t.chat[i].time > 60*4) {
				t.chat.splice(i--, 1);
			} else {
				var e = t.chat[i];
				e.sv += (1-e.s)/10;
				e.sv *= 0.9;
				e.s += e.sv;
			}
		}

		for (var i=0; i<t.kills.length; i++) {
			if (++t.kills[i].time > 60*4) {
				t.kills.splice(i--, 1);
				killOff += 1;
			} else {
				var e = t.kills[i];
				e.sv += (1-e.s)/10;
				e.sv *= 0.9;
				e.s += e.sv;
			}
		}

		scoreBoard += (((scene.game.keyDownArray[9] || (scene.mode == 2))?1:0)-scoreBoard)/10;
	}

	function drawScoreBoard(ctx, center) {
		ctx.save();
		//draws a scoreboard at position 0,0
		var activeUsers = [];
		for (var i=0; i<scene.entities.length; i++) {
			if (scene.entities[i].active) activeUsers.push(scene.entities[i]);
		}

		activeUsers.sort(function(a, b){
			return (a.points < b.points);
		})

		var height = 65+activeUsers.length*20+5;

		if (center) ctx.translate(ctx.canvas.width/2-175, (ctx.canvas.height-height*scoreBoard)/2)

		ctx.globalAlpha = 0.75;
		ctx.beginPath();
		ctx.rect(0,0,350,height*scoreBoard);
		ctx.fill();
		ctx.clip();
		ctx.globalAlpha = 1;

		ctx.font = "30px Impact, Arial Bold, sans-serif";
		ctx.fillStyle = "#FF8000"
		ctx.textBaseline = "top";
		ctx.textAlign = "left";
		ctx.fillText(scene.lvlInf.name, 7, 6);

		ctx.font = "17px Impact, Arial Bold, sans-serif";
		ctx.textAlign = "right";
		ctx.fillText("Deathmatch", 347, 3);
		ctx.fillStyle = "#D8A300"
		ctx.fillText("2 minutes", 347, 20);

		ctx.fillStyle = "#FF8000"
		ctx.fillRect(0, 40, 350, 4);

		//headers
		ctx.font = "12px Impact, Arial Bold, sans-serif";
		ctx.fillStyle = "#D8A300"
		ctx.textAlign = "left"
		ctx.fillText("Name", 3, 48);
		ctx.fillText("Kills", 157, 48);
		ctx.fillText("Deaths", 207, 48);
		ctx.fillText("Score", 257, 48);

		ctx.fillRect(155, 49, 1, height-52);
		ctx.fillRect(205, 49, 1, height-52);
		ctx.fillRect(255, 49, 1, height-52);

		//data
		for (var i=0; i<activeUsers.length; i++) {
			var e = activeUsers[i];
			ctx.font = "15px Impact, Arial Bold, sans-serif";
			ctx.fillStyle = "#FFFFFF"
			ctx.fillText(e.name, 3, 63+i*20);
			ctx.fillText(e.kills, 157, 63+i*20);
			ctx.fillText(e.deaths, 207, 63+i*20);
			ctx.fillText(e.points, 257, 63+i*20);
		}
		ctx.restore();

		return activeUsers;
	}

	function render(ctx) {
		ctx.font = "70px Impact, Arial Bold, sans-serif";
		ctx.fillStyle = "#FFFFFF"

		for (var i=0; i<t.ptText.length; i++) {
			ctx.save();
			var e = t.ptText[i];
			ctx.strokeStyle = "hsl("+Math.floor(Math.random()*360)+", 100%, 50%)"
			var m = ctx.measureText(e.text);

			ctx.lineWidth = 7;
			ctx.textBaseline = "middle"
			ctx.translate(e.pos[0], e.pos[1]);
			ctx.scale(e.s, e.s);
			ctx.strokeText(e.text, -m.width/2, 0);
			ctx.fillText(e.text, -m.width/2, 0);
			ctx.restore();
		}

		//DRAW SCORE

		var p;
		for (var i=0; i<scene.entities.length; i++){
			if (!scene.entities[i].net) p = scene.entities[i];
		}

		drawPts += (p.points-drawPts)/20;

		ctx.save();

		ctx.font = "50px Impact, Arial Bold, sans-serif";
		ctx.fillStyle = "#FFFFFF"
		ctx.lineWidth = 5;
		ctx.strokeStyle = "#B20000"
		ctx.textBaseline = "bottom"
		ctx.translate(10, ctx.canvas.height-10);
		ctx.strokeText(Math.round(drawPts), 0, 0);
		ctx.fillText(Math.round(drawPts), 0, 0);

		ctx.restore();

		//DRAW HP

		ctx.save();

		ctx.font = "35px Impact, Arial Bold, sans-serif";
		ctx.fillStyle = "#FFFFFF"
		ctx.lineWidth = 4;
		ctx.strokeStyle = "#B20000"
		ctx.textAlign = "right";
		ctx.textBaseline = "bottom"
		ctx.translate(ctx.canvas.width-10, ctx.canvas.height-10);
		ctx.strokeText("HP: "+p.HP+"/3", 0, 0);
		ctx.fillText("HP: "+p.HP+"/3", 0, 0);

		ctx.restore();

		//DRAW TIMER

		ctx.save();

		var dT = t.duration-scene.time;

		ctx.font = "50px Impact, Arial Bold, sans-serif";
		ctx.fillStyle = "#FFFFFF"
		ctx.lineWidth = 5;
		ctx.strokeStyle = "#FF8000"
		ctx.textBaseline = "top"
		ctx.textAlign = "center"
		var time = Math.floor(dT/60)+":"+zeroPad(dT%60, 2);
		ctx.strokeText(time, ctx.canvas.width/2, 10);
		ctx.fillText(time, ctx.canvas.width/2, 10);

		ctx.restore()

		//DRAW KILLS
		ctx.font = "30px Impact, Arial Bold, sans-serif";
		ctx.fillStyle = "black";
		for (var i=0; i<t.kills.length; i++) {
			ctx.save();
			var e = t.kills[i];
			var m1 = ctx.measureText(e[2]);
			var m2 = ctx.measureText(e[0]);

			ctx.globalAlpha = 0.75*Math.min(1, (60*4-e.time)/30);

			ctx.textBaseline = "top";
			ctx.textAlign = "right";
			ctx.translate(ctx.canvas.width-10, 10+(i+killOff)*40);
			ctx.scale(e.s, e.s);
			ctx.fillText(e[2], 0, 0);
			ctx.drawImage(e[1], -(m1.width+45), -5)
			ctx.fillText(e[0], -(m1.width+50), 0);
			ctx.restore();
		}
		ctx.globalAlpha = 1;

		if (scene.mode == 2) {
			var out = drawScoreBoard(ctx, true);

			var winner = out[0].name + " wins!"
			ctx.save()
			ctx.lineWidth = 5;
			ctx.font = "50px Trebuchet MS, Arial Bold, sans-serif";
			ctx.fillStyle = "#FFFFFF"
			ctx.textBaseline = "middle";
			ctx.textAlign = "center";
			ctx.strokeStyle = "#FF0000"
			ctx.translate(ctx.canvas.width/2, 200);
			ctx.strokeText(winner, 0, 0);
			ctx.fillText(winner, 0, 0);
			ctx.restore()
		} else if (scoreBoard > 0.0001) drawScoreBoard(ctx);

		if (scene.mode == 0 && (t.duration-openingT > 0)) {
			counter = t.duration-openingT;

			ctx.save();
			ctx.lineWidth = 6;
			ctx.strokeStyle = "#FF0000"
			ctx.font = "250px Trebuchet MS, Arial Bold, sans-serif";
			ctx.fillStyle = "#FFFFFF"
			ctx.textBaseline = "middle";
			ctx.textAlign = "center";
			ctx.translate(ctx.canvas.width/2, ctx.canvas.height/2);
			ctx.scale(openingScale, openingScale);
			ctx.strokeText(counter, 0, 0);
			ctx.fillText(counter, 0, 0);
			ctx.restore()
		}

		var yPos = (scene.chatMode)?(ctx.canvas.height-40):(ctx.canvas.height-10);
		ctx.save();
		ctx.font = "20px TrebuchetMS, Arial Bold, sans-serif";
		ctx.fillStyle = "white";
		ctx.strokeStyle = "black";
		ctx.lineWidth = 2;
		for (var i=0; i<t.chat.length; i++) {
			ctx.save();
			var e = t.chat[i];

			ctx.globalAlpha = Math.min(1, (60*4-e.time)/30);
			ctx.textBaseline = "bottom";
			ctx.textAlign = "center";
			ctx.translate(ctx.canvas.width/2, yPos-(i+chatOff)*25);
			ctx.scale(e.s, e.s);
			ctx.strokeText(e.msg, 0, 0)
			ctx.fillText(e.msg, 0, 0);
			ctx.restore();
		}


		if (scene.chatMode) {
			ctx.save();
			ctx.globalAlpha = 0.75;
			ctx.fillStyle = "#000000";
			ctx.fillRect((ctx.canvas.width-500)/2, ctx.canvas.height-35, 500, 25);
			ctx.globalAlpha = 1;

			ctx.font = "20px Trebuchet MS, Arial Bold, sans-serif";
			ctx.fillStyle = "#FFFFFF"
			ctx.textBaseline = "bottom";
			ctx.textAlign = "left";
			ctx.fillStyle = "#FFFFFF";
			var width = ctx.measureText(scene.chatMsg).width;
			ctx.fillText(scene.chatMsg, (ctx.canvas.width-490)/2, ctx.canvas.height-12)
			
			if ((chatAnim++)%30 < 15) ctx.fillRect((ctx.canvas.width-490)/2 + width + 3, ctx.canvas.height-32, 2, 19);
			chatAnim %= 30;
			ctx.restore();
		}
	}

	function zeroPad(num, length) {
		var n = String(num);
		while (n.length < length) {
			n = "0"+n;
		}
		return n;
	}
}