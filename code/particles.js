//particle functions

window.Particles = {
	snow: {
		update: function(d) {
			if (++d.time < d.expire) {
				d.v[1] += GRAVITY;
				d.p[0] += d.v[0];
				d.p[1] += d.v[1];
			} else {
				return true;
			}
		},
		render: function(ctx, d) {
			ctx.globalAlpha = Math.min(1, ((d.expire)-d.time)/15);
			ctx.beginPath();
			ctx.arc(d.p[0], d.p[1], d.r, 0, 2 * Math.PI, false);
			ctx.fillStyle = d.fill;
			ctx.fill();
			ctx.globalAlpha = 1;
		}
	},

	starImg: {
		update: function(d) {
			if (++d.time < d.expire) {
				d.v[1] += GRAVITY;
				d.p[0] += d.v[0];
				d.p[1] += d.v[1];
				d.r += d.rv;
			} else {
				return true;
			}
		},
		render: function(ctx, d) {
			ctx.save();
			ctx.globalAlpha = Math.min(1, ((d.expire)-d.time)/15);
			ctx.translate(d.p[0], d.p[1]);
			ctx.rotate(d.r);
			ctx.scale(d.s, d.s);
			ctx.drawImage(d.img, -d.img.width/2, -d.img.height/2);
			ctx.restore();
		}
	},

	collidingImg: {
		update: function(d) {
			if (++d.time < d.expire) {
				d.v[1] += GRAVITY;

				var steps = 0;
				var remainingT = 1;
				var velSeg = vec2.clone(d.v);
				var posSeg = vec2.clone(d.p);
				while (steps++ < 10 && remainingT > 0.01) {
					var result = collider.raycast(posSeg, velSeg, d.scene);
					if (result != null) {

						//COL RESPONSE

							var n = result.normal;
							var proj = vec2.dot(d.v, n)*1.5;
							vec2.sub(d.v, d.v, vec2.scale(vec2.create(), n, proj));

							vec3.add(posSeg, posSeg, vec3.scale(vec3.create(), velSeg, result.t));
							vec3.add(posSeg, vec3.scale([], n, 0.05), result.colPoint);

						//END COL RESPONSE

						remainingT -= result.t;
						if (remainingT > 0.01) {
							vec2.scale(velSeg, d.v, remainingT);
						}
					} else {
						vec2.add(posSeg, posSeg, velSeg);
						remainingT = 0;
					}
				}
				d.p = posSeg;
				d.r += d.rv;
			} else {
				return true;
			}
		},
		render: function(ctx, d) {
			ctx.save();
			ctx.globalAlpha = Math.min(1, ((d.expire)-d.time)/15);
			ctx.translate(d.p[0], d.p[1]);
			ctx.rotate(d.r);
			ctx.drawImage(d.img, -d.img.width/2, -d.img.height/2);
			ctx.restore();
		}
	}
}