
window.Bullets = {};

Bullets["$normal"] = function(type, seed, pos, vel, owner, scene) {
	var t = this;
	t.pos = pos;
	t.vel = vel;
	t.seed = seed;
	t.owner = owner;

	t.update = update;
	t.render = render;

	function update() {
		t.vel[1] += GRAVITY;

		var steps = 0;
		var remainingT = 1;
		var velSeg = vec2.clone(t.vel);
		var posSeg = vec2.clone(t.pos);
		while (steps++ < 10 && remainingT > 0.01) {
			var result = collider.raycast(posSeg, velSeg, scene);
			if (result != null) {

					//COL RESPONSE

					snowSplosion();
					return true; //hit wall!

					/*var n = result.normal;
					var proj = vec2.dot(t.vel, n)*1.5;
					vec2.sub(t.vel, t.vel, vec2.scale(vec2.create(), n, proj));

					vec3.add(posSeg, posSeg, vec3.scale(vec3.create(), velSeg, result.t));
					vec3.add(posSeg, vec3.scale([], n, 0.05), result.colPoint);)*/

				//END COL RESPONSE

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

		//attempt to collide with player
		for (var i=0; i<scene.entities.length; i++) {
			if (i == t.owner) continue;
			var e = scene.entities[i];
			if (vec2.dist(e.pos, t.pos) < 16+3) {
				e.hit(t.owner, "normal");
				return true;
			}
		}
	}

	function render(ctx) {
		ctx.beginPath();
		ctx.arc(t.pos[0], t.pos[1], 3, 0, 2 * Math.PI, false);
		ctx.fillStyle = "#FFFFFF";
		ctx.fill();
		ctx.strokeStyle = "#888888";
		ctx.lineWidth = 1;
		ctx.stroke();
	}

	function snowSplosion() {
		var p = Particles.snow;

		for (var i=0; i<10; i++) {
			var col = Math.floor(Math.random()*32)+(256-32);
			scene.addParticle({
				update: p.update,
				render: p.render,
				p: [t.pos[0], t.pos[1]],
				v: [Math.random()*4-2, Math.random()*4-2],
				time: 0,
				expire: 30,
				fill: "rgb("+col+","+col+","+col+")",
				r: Math.random()*2+1
			})
		}
	}
}