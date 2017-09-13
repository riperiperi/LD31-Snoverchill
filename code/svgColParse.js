//Parses svg paths into collision lines. does not support curves! (yet >:) )

window.SvgColParse = function(svg){
	var t = this;
	t.svg = svg;
	t.lines = [];
	parse();

	function parse() {
		var paths = svg.getElementsByTagName("path")
		for (var j=0; j<paths.length; j++) {
			var rot90 = mat2.create();
			mat2.rotate(rot90, rot90, Math.PI/2);
			var s = paths[j].getAttribute("d").split(" ");

			var reading = false;
			var read = [];
			var last = [0, 0]
			var l = [0, 0];
			var relative = false;
			var lastRead = null;

			for (var i=0; i<s.length; i++) {
				var code = s[i].toLowerCase();
				if (reading) {
					if (code == "z" || code == "m" || code == "zm") {
						if (code == "m") i--;
						if (code == "zm") {
							s[i] = s[i].substr(1, 1);
							i--;
						}
						reading = false;
						continue;
					} else if (code == "l") {
						relative = (s[i]=="l");
						continue;
					} else {
						if (lastRead == null) {
							lastRead = s[i];
							continue;
						}
						if (relative) {
							last[0] += s[i-1]-0;
							last[1] += s[i]-0;
						} else {
							last[0] = s[i-1]-0;
							last[1] = s[i]-0;
						}
						lastRead = null;
						read.push([last[0], last[1]]);

						//add line
						if (read.length > 1) {
							var p1 = read[read.length-2];
							var p2 = read[read.length-1];
							var norm = vec2.sub([], p1, p2);
							vec2.transformMat2(norm, norm, rot90);
							vec2.normalize(norm, norm);
							t.lines.push({
								p1: p1,
								p2: p2,
								normal: norm
							})
						}
					}
				} else {
					if (code == "m") {
						relative = (s[i]=="m");
						reading = true;
						read = [];
						continue;
					}
				}
			}
		}
	}

};