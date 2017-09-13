function ld31Instance(config, wss) {
	var userID = 0;
	var sockets = [];
	var userInf = [];
	var relkDat = [];
	var mode = -1;
	var lastTime = 0;
	var countTime = 0;
	var t = this;

	var upInt = setTimeout(update, 16.667);

	var duration = 120*60;
	//var duration = (2*60)*60; //two minutes in frames

	var lastFrame = Date.now();
	var behind = 0;

	function update() {

		behind += Date.now() - lastFrame;
		lastFrame = Date.now();
		while (behind > 1000/60) {
			behind -= 1000/60;
			countTime++;
			lastFrame = Date.now();
		}

		switch (mode) {
			case 0: //0 seconds wait, then 3 seconds countdown
				if (countTime>3*60) setMode(1);
				break;
			case 1: //ingame
				if (countTime>duration) setMode(2);
				break;
			case 2: //done
				if (countTime>7*60) {
					t.resetInstance(); 
					mode = 0;
					countTime = 0;
				} //ten seconds of deep thought for the players
				break;			
		}

		if (Math.floor(countTime/60) != lastTime) {
			lastTime = Math.floor(countTime/60);
			var p = {
				t:"^", //clock tick
				s:Math.floor(countTime/60)
			}
			for (var i=0; i<sockets.length; i++) {
				sendPacket(i, p)
			}
		}

		//generate and send pos packet
		if (relkDat.length != 0) {
			var p = {
				t:"p", //player and position data
				d: relkDat
			}

			for (var i=0; i<sockets.length; i++) {
				sendPacket(i, p)
			}
			relkDat = [];
		}

		for (var i=0; i<sockets.length; i++) {
			if (lastFrame-sockets[i].lastMessage > 20*1000) sockets[i].close(); //rip in peace sweet prince
		}

		var upInt = setTimeout(update, 16.667);

	}

	function setMode(m) {
		console.log("\x00"+timestamp()+"mode set to "+m)
		mode = m;
		countTime = 0;
		var p = {
			t:"m", //mode switch
			m:m
		}
		for (var i=0; i<sockets.length; i++) {
			sendPacket(i, p)
		}
	}

	function sendPacket(i, p) {
		try {
			sockets[i].send(JSON.stringify(p));
		} catch (e) {

		}
	}

	//HANDLERS BELOW

	function addUser(cli, after) {
		var c = JSON.parse(JSON.stringify(cli.credentials));
		c.active = true;
		cli.userID = userInf.length;
		userInf.push(c);

		if (after) {
			for (var i=0; i<sockets.length; i++) {
				if (sockets[i] != cli) sendPacket(i, {
					t:"+",
					k:c
				})
			}
		}
	}

	function vetName(soc) {
		var name = soc.credentials.name;
		if (name == null || name == "") {
			soc.credentials.name = "Player"
		} else if (name.length > 32) {
			soc.credentials.name = name.substr(0, 32);
		}
	}

	this.addClient = function(clientSocket) {
		console.log(timestamp()+clientSocket.credentials.name+" joined the game! ("+clientSocket._socket.remoteAddress+")");
		vetName(clientSocket);
		sockets.push(clientSocket);
		clientSocket.credentials.userID = userID++;

		addUser(clientSocket, true);

		if (mode == -1) {
			startGame();
		}

		sendInstanceInfo(clientSocket);
	}

	function startGame() {
		mode = 0; //countdown mode
		countTime = 0;

	}

	function sendInstanceInfo(clientSocket) {
		try {
			clientSocket.send(JSON.stringify({
				t:"*",
				m:mode,
				k:userInf,
				p:clientSocket.userID
			}))
		} catch (e) {

		}
	}

	function timestamp() {
		return "["+(new Date()).toLocaleTimeString()+"] ";
	}

	this.removeClient = function(clientSocket) {
		//attempt to remove client -- may not be in this instance!
		console.log(timestamp()+clientSocket.credentials.name+" left the game!");
		var ind = sockets.indexOf(clientSocket);
		if (ind != -1) sockets.splice(ind, 1); //shouldn't cause any problems.

		if (clientSocket.userID != null) {
			//tell all other clients that this client is now inactive.
			var dat = {
				t:"-",
				k:clientSocket.userID
			};
			userInf[clientSocket.userID].active = false;
			for (var i=0; i<sockets.length; i++) sendPacket(i, dat);
		}

		if (sockets.length == 0) {
			console.log("All players have left. Server is now IDLE!")
			t.resetInstance();
		}
	}

	function toArrayBuffer(buffer) { //why are you making my life so difficult :(
		var ab = new ArrayBuffer(buffer.length);
		var view = new Uint8Array(ab);
		for (var i = 0; i < buffer.length; ++i) {
			view[i] = buffer[i];
		}
		return ab;
	}

	this.handleMessage = function(cli, data, flags) {
		if (sockets.indexOf(cli) == null) {
			socket.send(JSON.stringify(
				{
					t: "!",
					m: "FATAL ERROR: Server does not recognise client! Are you connecting to the wrong instance?"
				}
			));
		} else {
			var d = toArrayBuffer(data);
			if (flags.binary) {
				//binary data
				var view = new DataView(d);
				var handler = binH[view.getUint8(0)];
				if (handler != null) handler(cli, view);
			} else {

				//JSON string
				var obj;
				try {	
					obj = JSON.parse(data);
				} catch (err) {
					debugger; //packet recieved from server is bullshit
					return;
				}
				var handler = wsH["$"+obj.t];
				if (handler != null) handler(cli, obj);
			}
		}
	}

	var wsH = {};
	wsH["$p"] = function(cli, obj) { //position
		obj.d.k = cli.userID;
		relkDat.push(obj.d);
	} 

	wsH["$c"] = function(cli, obj) { //chat
		obj.o = cli.userID;

		console.log(timestamp()+userInf[obj.o].name+": "+obj.m);
		for (var i=0; i<sockets.length; i++) {
			sendPacket(i, obj); //mirror chat to clients
		}
	} 

	wsH["$b"] = function(cli, obj) {
		for (var i=0; i<sockets.length; i++) {
			if (sockets[i] != cli) sendPacket(i, obj); //mirror bullets to other clients
		}
	}

	wsH["$x"] = function(cli, obj) { //die
		for (var i=0; i<sockets.length; i++) {
			if (sockets[i] != cli) sendPacket(i, obj); //mirror deaths to other clients
		}
	}

	var binH = [];

	this.resetInstance = function() {
		console.log("\x00"+timestamp()+"instance reset")
		userID = 0;
		mode = -1;
		userInf = [];
		relkDat = [];
		for (var i=0; i<sockets.length; i++) {
			addUser(sockets[i], false);
			sockets[i].credentials.userID = userID++; //reassign user IDs to clients.
		}
		if (sockets.length > 0) {
			if (mode == -1) {
				startGame();
			}
		}
		for (var i=0; i<sockets.length; i++) sendInstanceInfo(sockets[i]);
	}
}

exports.ld31Instance = ld31Instance;