//select a snowman

window.sasScene = function(res, game) {
	
	this.update = update;
	this.render = render;

	var snowman = {
		b:1,
		t:1,
		h:1
	}

	var lastB = {
		b:false,
		t:false,
		h:false
	}

	var sImg;

	function update() {
		if (game.keyDownArray[49] != lastB.b){
			if (!lastB.b) {
				snowman.b = ((snowman.b)%5)+1;
				buildSnowman();
			}
		}
		lastB.b = game.keyDownArray[49];

		if (game.keyDownArray[50] != lastB.h){
			if (!lastB.h) {
				snowman.h = ((snowman.h)%6)+1;
				buildSnowman();
			}
		}
		lastB.h = game.keyDownArray[50];

		if (game.keyDownArray[51] != lastB.t){
			if (!lastB.t) {
				snowman.t = ((snowman.t)%6)+1;
				buildSnowman();
			}
		}
		lastB.t = game.keyDownArray[51];

		if (game.keyDownArray[32]) {
			game.startGame(snowman);
		}
	}

	function buildSnowman() {
		sImg = renderSnowman(snowman, res);
	}

	function render(ctx) {
		ctx.save();
		ctx.drawImage(res["img/selSnow.png"], 0, 0);

		ctx.restore();
		ctx.save();
		ctx.translate(ctx.canvas.width/2, ctx.canvas.height/2);

		ctx.scale(3, 3);
		if (sImg == null) buildSnowman();
		ctx.drawImage(sImg, -32, -32);
		ctx.restore();
	}
}