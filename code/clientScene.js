//clientScene

function clientScene(files, game, snowman) {	
	var t = this;

	this.render = render;
	this.update = update;
	this.sendPacket = sendPacket;
	this.keyPress = keyPress;

	var WebSocket = window.WebSocket || window.MozWebSocket;
	var ws = new WebSocket("ws://46.101.67.219:8080");
	ws.binaryType = "arraybuffer";

	t.ws = ws;
	t.mode = -1;
	var child = null;
	t.myPlayer = null;

	ws.onerror = function(e) {
		alert("NETWORK ERROR: "+e)
	}

	ws.onclose = function(e) {
		alert("disconnected! :'(\n Refresh the page to attempt to reconnect. If it still doesn't work, hit me up at @RHY3756547!");
		if (child != null) child.disconnected = true;
	}

	ws.onopen = function() {
		console.log("initial connection")
		var obj = {
			t:"*",
			i:0,
			c:{
				name:window.prompt("What is your name?"),
				snowman: snowman
				//also send snowman choice here...
			}
		}
		sendPacket(obj);
	};

	ws.onmessage = function(evt) {
		var d = evt.data;
		if (typeof d != "string") {
			//binary data
			var view = new DataView(d);
			var handler = binH[view.getUint8(0)];
			if (handler != null) handler(view);
		} else {
			//JSON string
			var obj;
			try {	
				obj = JSON.parse(d);
			} catch (err) {
				debugger; //packet recieved from server is bullshit
				return;
			}
			var handler = wsH["$"+obj.t];
			if (handler != null) handler(obj);
		}
	}

	t.ws = ws;

	//fall through to child scene

	function keyPress(evt) {
		if (child != null) {
			child.keyPress(evt);
		}
	}

	function update() {
		if (child != null) {
			
			child.update();
		}
	}

	function render(ctx) {
		if (child != null) {
			child.render(ctx);
		}
	}

	//websockets handlers

	function sendPacket(obj) {
		ws.send(JSON.stringify(obj));
	}

	var wsH = {};

	wsH["$*"] = function(obj) { //initiate scene.
		t.myKart = null;

		t.mode = obj.m;
		setUpLevel("lvl1", obj);
		child.setMode(obj.m);
	}

	wsH["$m"] = function(obj) {
		child.setMode(obj.m);
	}

	wsH["$^"] = function(obj) { //tick
		if (child != null) {
			child.time = obj.s;
			console.log(obj.s+" seconds")
		}
	}

	wsH["$c"] = function(obj) { //chat message
		console.log("test???");
		if (child != null) {
			child.recvChat(obj);
		}
	}

	wsH["$p"] = function(obj) { //update players
		if (child.mode != 1) return;
		for (var i=0; i<obj.d.length; i++) {
			var d = obj.d[i];
			var o = child.entities[d.k];
			if (!o.net) continue;

			o.pos = d.p;
			o.vel = d.v;
			o.angle = d.a;
			o.angvel = d.av;
			o.dead = d.d;
			o.deadTimer = d.dT;
			o.accumPoints = d.aP;
			o.lastTier = d.lT;
			o.input = d.i;
			o.invuln = d.iv;
			o.points = d.pt;
			o.deaths = d.D;
			o.kills = d.K;
		}
	}

	wsH["$x"] = function(obj) {
		if (obj.c[1] == "normal") {
			child.entities[obj.c[0]].kills++;
			child.entities[obj.c[0]].addPoints("", 1500);
		}
		child.gameUI.addKill(obj.c);
		child.entities[obj.o].udie(obj.c);
	}

	wsH["$b"] = function(obj) {
		child.fireBullet(obj.b, obj.s, obj.p, obj.v, obj.o);
	}

	wsH["$+"] = function(obj) { //add player
		console.log("player added");
		var p = new Player(child, true, obj.k.snowman);
		child.entities.push(p)
		p.active = obj.k.active;
		p.name = obj.k.name;
		p.cred = obj.k;
	}

	wsH["$-"] = function(obj) { //player disconnect.
		child.entities[obj.k].active = false;
	}

	function setUpLevel(level, obj) {
		if (child != null) child.kill();
		child = new gameScene(files, game, t)
		child.setLevel(level);

		child.entities = [];
		for (var i=0; i<obj.k.length; i++) {
			var p = new Player(child, !(i == obj.p), obj.k[i].snowman);
			child.entities.push(p)
			p.active = obj.k[i].active;
			p.name = obj.k[i].name;
			p.cred = obj.k[i]
		}

		console.log(child);
	}

	var binH = {};
}