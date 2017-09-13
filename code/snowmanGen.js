//snowmanGen

window.renderSnowman = function(conf, res) {
	var out = document.createElement("canvas");
	out.width = 64;
	out.height = 64;

	var ctx = out.getContext("2d");
	try {
		ctx.drawImage(res["p/b"+conf.b+".png"], 0, 0);
		ctx.drawImage(res["p/h"+conf.h+".png"], 0, 0);
		ctx.drawImage(res["p/t"+conf.t+".png"], 0, 0);
		ctx.drawImage(res["p/board.png"], 0, 0);
	} catch (e) {}
	return out;
}