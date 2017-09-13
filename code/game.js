//game.js

var AudioContext = window.AudioContext || window.webkitAudioContext || window.MozAudioContext;

function game(canvas) {
	var t = this;
	var filesToLoad = [
		"collision/lvl1.svg",
		"img/lvl1.png",
		"levels/lvl1.json",

		"img/bg.png",

		"img/selSnow.png",
		"playerp/d1.png", "playerp/d2.png", "playerp/d3.png", "playerp/d4.png", "playerp/d5.png",

		"img/star0.png", "img/star1.png", "img/star2.png",
		"deathico/body.png", "deathico/suicide.png", "deathico/normal.png",

		"snd/boom.wav",
		"snd/jump.wav",
		"snd/respawn.wav",
		"snd/hit.wav",
		"snd/throw.wav",
		"snd/music.ogg",

		"snd/t1.wav",
		"snd/t2.wav",
		"snd/t3.wav",
		"snd/t4.wav",
		"snd/smallget.wav",
		"snd/bigget.wav",

		"p/t1.png", "p/t2.png", "p/t3.png", "p/t4.png", "p/t5.png", "p/t6.png", 
		"p/h1.png", "p/h2.png", "p/h3.png", "p/h4.png", "p/h5.png", "p/h6.png", 
		"p/b1.png", "p/b2.png", "p/b3.png", "p/b4.png", "p/b5.png", "p/board.png"
	]
	var fileTypes = [
		"document",
		"image",
		"json",

		"image",

		"image",
		"image", "image", "image", "image", "image",

		"image", "image", "image",
		"image", "image", "image",

		"sound",
		"sound",
		"sound",
		"sound",
		"sound",
		"sound",

		"sound",
		"sound",
		"sound",
		"sound",
		"sound",
		"sound",

		"image", "image", "image", "image", "image", "image", 
		"image", "image", "image", "image", "image", "image", 
		"image", "image", "image", "image", "image", "image"
	]
	var files = {};
	var filesLoaded = 0;
	var lastFrame = Date.now();
	var behind = 0;
	var mainScene, ctx;

	t.ac = new AudioContext();

	t.mouseX = 0;
	t.mouseY = 0;
	t.mouseDown = false;
	t.mouseClick = false;
	t.startGame = startGame;
	t.keyDownArray = new Array(256);

	document.body.addEventListener("mousemove", getMousePos);
	document.body.addEventListener("mousedown", mouseDown);
	document.body.addEventListener("mouseup", mouseUp);

	/*canvas.addEventListener("mousemove", function(evt){getMousePos(evt); evt.preventDefault()});
	canvas.addEventListener("mousedown", function(evt){mouseDown(evt); evt.preventDefault()});
	canvas.addEventListener("mouseup", function(evt){mouseUp(evt); evt.preventDefault()});*/

	document.body.addEventListener("keydown", keyDown);
	document.body.addEventListener("keyup", keyUp);
	document.body.addEventListener("keypress", keyPress)

	function getMousePos(evt) {
		var el = canvas;
		var _x = 0;
		var _y = 0;
		while( el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop) ) {
			_x += el.offsetLeft;
			_y += el.offsetTop;
			el = el.offsetParent;
		}
		t.mouseX = evt.pageX - _x;
		t.mouseY = evt.pageY - _y;
	}

	function mouseDown() {
		t.mouseDown = true;
		t.mouseClick = true;
	}

	function mouseUp() {
		t.mouseDown = false;
	}

	function keyDown(evt) {
		if (evt.keyCode == 9 || evt.keyCode == 8) {
			evt.preventDefault();
			if (evt.keyCode == 8) {
				evt.charCode = evt.keyCode;
				if (mainScene != null) mainScene.keyPress(evt);
			}
		}
		t.keyDownArray[evt.keyCode] = true;
	}

	function keyUp(evt) {
		t.keyDownArray[evt.keyCode] = false;
	}

	function keyPress(evt) {
		if (mainScene != null) mainScene.keyPress(evt);
		if (evt.charCode == 8 || evt.charCode == 46) {
			return false;
		}
	}

	load();

	function load() {
		filesLoaded = 0;
		for (var i=0; i<filesToLoad.length; i++) {
			switch (fileTypes[i]) {
				case "image":
					loadImg(filesToLoad[i]);
					break;
				case "sound":
					loadSound(filesToLoad[i]);
					break;
				default:
					loadFile(filesToLoad[i], fileTypes[i]);
					break;
			}
		}
	}

	function fileLoaded() {
		if (++filesLoaded == filesToLoad.length) init();
	}

	function loadImg(url) {
		var img = new Image();
		img.src = url;
		img.onload = function() {
			files[url] = img;
			fileLoaded();
		}
	}

	function loadSound(url, name) {
		var name = name;
		if (name == null) name = url; 
		var xml = new XMLHttpRequest();
		xml.open('GET', url, true);
		xml.responseType = 'arraybuffer';

		xml.onload = function() {
			t.ac.decodeAudioData(xml.response, function(buffer) {
				files[name] = buffer;
				fileLoaded();
			}, function(){
				loadSound(url.substr(0, url.length-3)+"wav", url)
			});
		}
		xml.send();
	}

	function loadFile(url, type) {
		var xml = new XMLHttpRequest();
		xml.open("GET", url);
		xml.responseType = type;
		xml.onload = function() {
			files[url] = xml.response;
			fileLoaded();
		}
		xml.send();
	}

	function init() {
		ctx = canvas.getContext('2d');
		mainScene = new sasScene(files, t);
		tick();
	}

	function startGame(snowman) {
		mainScene = new clientScene(files, t, snowman);
		t.keyDownArray = new Array(256);
	}

	function tick() {
		behind += Date.now() - lastFrame;
		lastFrame = Date.now();
		while (behind > 1000/60) {
			behind -= 1000/60;

			mainScene.update();

			t.mouseClick = false;
			behind += Date.now() - lastFrame;
			lastFrame = Date.now();
		}

		mainScene.render(ctx);

		requestAnimationFrame(tick);
	}
}