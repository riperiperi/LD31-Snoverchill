//ellipse collision

window.collider = new (function(){

	this.sweepEllipse = sweepEllipse;
	this.raycast = raycast;

	function raycast (pos, dir, scn) {
		var lines = scn.lvlCol.lines;

		var t=1;
		var colPlane = null;
		var colPoint = null; //can be calculated from t, but we calculate it anyway so why not include
		for (var i=0; i<lines.length; i++) {
			//first, check if we intersect the plane within reasonable t.
			//only if this happens do we check if the point is in the triangle.
			//we would also only do sphere sweep if this happens.

			var l = lines[i];

			var planeConst = -vec2.dot(l.normal, l.p1);
			var dist = vec2.dot(l.normal, pos) + planeConst;
			if (dist < 0) {
				vec2.scale(l.normal, l.normal, -1);
				planeConst = -vec2.dot(l.normal, l.p1);
				dist *= -1;
			}
			var modDir = vec2.dot(l.normal, dir);
			var newT = -dist/modDir;
			if (newT>0 && newT<t) {
				//we have a winner! check if the plane intersecion point is in the line
				var pt = vec2.add([], pos, vec2.scale([], dir, newT))
				if (checkPointInLine(pt, l)) {
					t = newT;
					colPlane = l;
					colPoint = pt; //result!
				}
			}
		}

		if (colPlane != null) {
			return {
				t: t,
				plane: colPlane,
				colPoint: colPoint,
				normal: colPlane.normal,
				pNormal: colPlane.normal
			}
		}
	}


	function sweepEllipse(pos, dir, scn, eDimensions) {
		var t=1;

		var lines = scn.lvlCol.lines;

		var oPos = pos;
		var oDir = dir;

		var pos = vec2.divide([], pos, eDimensions); //need to rescale position to move into ellipsoid space
		var dir = vec2.divide([], dir, eDimensions);
		
		var colPlane = null;
		var colPoint = null; //can be calculated from t, but we calculate it anyway so why not include
		var emb = false;
		var edge = false;

		for (var i=0; i<lines.length; i++) {
			var l = modLine(lines[i], eDimensions);
			//first check if we intersect with unbounded line
			var planeConst = -vec2.dot(l.normal, l.p1);
			var dist = vec2.dot(l.normal, pos) + planeConst;
			if (dist < 0) {
				vec2.scale(l.normal, l.normal, -1);
				planeConst = -vec2.dot(l.normal, l.p1);
				dist *= -1;
			}
			var modDir = vec2.dot(l.normal, dir);

			var t0, t1, embedded = false;
			if (modDir == 0) {
				if (Math.abs(dist) < 1) {
					t0 = 0; 
					t1 = 1;
					embedded = true;
				} else {
					t0 = 1000; 
					t1 = 2000;
				}
			} else {
				t0 = (1-dist)/modDir;
				t1 = ((-1)-dist)/modDir;
			}

			if (t0 > t1) { //make sure t0 is smallest value
				var temp = t1;
				t1 = t0;
				t0 = temp;
			}

			if (!(t0>1 || t1<0)) { //we intersect with the line at some point during the time!
				//first of all check if our intersection point on the unbounded line is within bounds
				if (t0 < 0) { embedded = true; t0 = 0; }
				if (t1 > 1) t1 = 1;
				var newT = t0;

				//sphere intersects plane of triangle
				var pt = [];
				if (embedded) {
					vec2.sub(pt, pos, vec2.scale([], l.normal, dist));
				} else {
					vec2.add(pt, pos, vec2.scale([], dir, newT))
					vec2.sub(pt, pt, l.normal); //project new position onto plane along normal
				}

				if (checkPointInLine(pt, l) && newT < t) {
					t = newT;
					colPlane = lines[i];
					colPoint = pt; //result!
					edge = false;
					emb = embedded;
					planeNormal = l.normal;
					continue;
				}

				//check intersection with vertices
				//
				//swept sphere equation
				//
				//	(vt - p) dot (vt - p) = 1

				for (var j=1; j<=2; j++) {
					var vert = vec2.sub([], pos, l["p"+j]);
					var root = getSmallestRoot(vec2.dot(dir, dir), 2*vec2.dot(dir, vert), vec2.dot(vert, vert)-1, t);
					if (root != null) {
						t = root;
						colPlane = lines[i];
						colPoint = vec2.clone(l["p"+j]); //result!
						planeNormal = l.normal;
						edge = false;
					}
				}

			}
		}

		if (colPlane != null) {
			var norm = vec2.scale([], dir, t)
			vec2.add(norm, pos, norm);
			vec2.sub(norm, norm, colPoint);

			vec2.mul(colPoint, colPoint, eDimensions);

			return {
				t: t,
				plane: colPlane,
				colPoint: colPoint,
				normal: norm,
				pNormal: planeNormal,
				embedded: emb
			}
		}
	}

	function getSmallestRoot(a, b, c, upperLimit) {
		var det = (b*b) - 4*(a*c);
		if (det<0) return null; //no result :'(
		else {
			det = Math.sqrt(det);
			var root1 = ((-b)-det)/(2*a)
			var root2 = ((-b)+det)/(2*a)

			if (root1 > root2) { //ensure root1 is smallest
				var temp = root1;
				root1 = root2;
				root2 = temp;
			}

			if (root1>0 && root1<upperLimit) {
				return root1;
			} else if (root2>0 && root2<upperLimit) {
				return root2;
			} else {
				return null;
			}
		}
	}

	function checkPointInLine(pt, line) {
		if (Math.abs(line.p1[0]-line.p2[0]) > Math.abs(line.p1[1]-line.p2[1])) {
			return ((line.p1[0] > line.p2[0])?
						(pt[0] > line.p2[0] && pt[0] < line.p1[0]):
						(pt[0] < line.p2[0] && pt[0] > line.p1[0])
					)
		} else {
			return ((line.p1[1] > line.p2[1])?
						(pt[1] > line.p2[1] && pt[1] < line.p1[1]):
						(pt[1] < line.p2[1] && pt[1] > line.p1[1])
					)
		}
	}

	function modLine(inL, eDim) {
		return {
			p1: vec2.divide([], inL.p1, eDim),
			p2: vec2.divide([], inL.p2, eDim),
			normal: inL.normal
		}
	}
})();