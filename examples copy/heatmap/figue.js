/*!
 * Figue v1.0.1
 *
 * Copyright 2010, Jean-Yves Delort
 * Licensed under the MIT license.
 *
 */


var figue = function () {


	function euclidianDistance (vec1 , vec2) {
		var N = vec1.length ;
		var d = 0 ;
		for (var i = 0 ; i < N ; i++)
			d += Math.pow (vec1[i] - vec2[i], 2)
		d = Math.sqrt (d) ;
		return d ;
	}

	function manhattanDistance (vec1 , vec2) {
		var N = vec1.length ;
		var d = 0 ;
		for (var i = 0 ; i < N ; i++)
			d += Math.abs (vec1[i] - vec2[i])
		return d ;
	}

	function maxDistance (vec1 , vec2) {
		var N = vec1.length ;
		var d = 0 ;
		for (var i = 0 ; i < N ; i++)
			d = Math.max (d , Math.abs (vec1[i] - vec2[i])) ;
		return d ;
	}

	function addVectors (vec1 , vec2) {
		var N = vec1.length ;
		var vec = new Array(N) ;
		for (var i = 0 ; i < N ; i++)
			vec[i] = vec1[i] + vec2[i] ;
		return vec ;
	}	

	function multiplyVectorByValue (value , vec) {
		var N = vec.length ;
		var v = new Array(N) ;
		for (var i = 0 ; i < N ; i++)
			v[i] = value * vec[i] ;
		return v ;
	}	


	function repeatChar(c, n) {
		var str = "";
		for (var i = 0 ; i < n ; i++)
			str += c ;
		return str ;
	}
	
	function calculateCentroid (c1Size , c1Centroid , c2Size , c2Centroid) {
		var newCentroid = new Array(c1Centroid.length) ;
		var newSize = c1Size + c2Size ;
		for (var i = 0 ; i < c1Centroid.length ; i++) 
			newCentroid[i] = (c1Size * c1Centroid[i] + c2Size * c2Centroid[i]) / newSize ;
		return newCentroid ;	
	}


	function centerString(str, width) {
		var diff = width - str.length ;
		if (diff < 0)
			return ;

		var halfdiff = Math.floor(diff / 2) ;
		return repeatChar (" " , halfdiff) + str + repeatChar (" " , diff - halfdiff)  ;
	}

	function putString(str, width, index) {
		var diff = width - str.length ;
		if (diff < 0)
			return ;

		return repeatChar (" " , index) + str + repeatChar (" " , width - (str.length+index)) ;
	}

	function prettyVector(vector) {
		var vals = new Array(vector.length) ;
		var precision = Math.pow(10, figue.PRINT_VECTOR_VALUE_PRECISION) ; 
		for (var i = 0 ; i < vector.length ; i++)
			vals[i] = Math.round(vector[i]*precision)/precision ;
		return vals.join(",")
	}

	function prettyValue(value) {
		var precision = Math.pow(10, figue.PRINT_VECTOR_VALUE_PRECISION) ; 
		return String (Math.round(value*precision)/precision) ;
	}

	function generateDendogram(tree, sep, balanced, withLabel, withCentroid, withDistance) {
		var lines = new Array ;
		var centroidstr = prettyVector(tree.centroid) ;
		if (tree.isLeaf()) {
			var labelstr = String(tree.label) ;
			var len = 1;
			if (withCentroid) 
				len = Math.max(centroidstr.length , len) ;
			if (withLabel)
				len = Math.max(labelstr.length , len) ;

			lines.push (centerString ("|" , len)) ;
			if (withCentroid) 
				lines.push (centerString (centroidstr , len)) ;
			if (withLabel) 
				lines.push (centerString (labelstr , len)) ;

		} else {
			var distancestr = prettyValue(tree.dist) ;
			var left_dendo = generateDendogram(tree.left ,sep, balanced,withLabel,withCentroid, withDistance) ;
			var right_dendo = generateDendogram(tree.right, sep, balanced,withLabel,withCentroid,withDistance) ;
			var left_bar_ix = left_dendo[0].indexOf("|") ;
			var right_bar_ix = right_dendo[0].indexOf("|") ;
	
			// calculate nb of chars of each line
			var len = sep + right_dendo[0].length + left_dendo[0].length ;
			if (withCentroid) 
				len = Math.max(centroidstr.length , len) ;
			if (withDistance) 
				len = Math.max(distancestr.length , len) ;


			// calculate position of new vertical bar
			var bar_ix =  left_bar_ix + Math.floor(( left_dendo[0].length - (left_bar_ix) + sep + (1+right_bar_ix)) / 2) ;
			
			// add line with the new vertical bar 
			lines.push (putString ("|" , len , bar_ix)) ;
			if (withCentroid) {
				lines.push (putString (centroidstr , len , bar_ix - Math.floor (centroidstr.length / 2))) ; //centerString (centroidstr , len)) ;
			}
			if (withDistance) {
				lines.push (putString (distancestr , len , bar_ix - Math.floor (distancestr.length / 2))) ; //centerString (centroidstr , len)) ;
			}
				
			// add horizontal line to connect the vertical bars of the lower level
			var hlineLen = sep + (left_dendo[0].length -left_bar_ix) + right_bar_ix+1 ;
			var hline = repeatChar ("_" , hlineLen) ;
			lines.push (putString(hline, len, left_bar_ix)) ;
	
			// IF: the user want the tree to be balanced: all the leaves have to be at the same level
			// THEN: if the left and right subtrees have not the same depth, add extra vertical bars to the top of the smallest subtree
			if (balanced &&  (left_dendo.length != right_dendo.length)) {
				var shortest ;
				var longest ;
				if (left_dendo.length > right_dendo.length) {
					longest = left_dendo ;
					shortest = right_dendo ;
				} else {
					longest = right_dendo ;
					shortest = left_dendo ;
				}
				// repeat the first line containing the vertical bar
				header = shortest[0] ;
				var toadd = longest.length - shortest.length ;
				for (var i = 0 ; i < toadd ; i++) {
					shortest.splice (0,0,header) ;
				}
			}
		
			// merge the left and right subtrees 
			for (var i = 0 ; i < Math.max (left_dendo.length , right_dendo.length) ; i++) {
				var left = "" ;
				if (i < left_dendo.length)
					left = left_dendo[i] ;
				else
					left = repeatChar (" " , left_dendo[0].length) ;
	
				var right = "" ;
				if (i < right_dendo.length)
					right = right_dendo[i] ;
				else
					right = repeatChar (" " , right_dendo[0].length) ;
				lines.push(left + repeatChar (" " , sep) + right) ;	
				var l = left + repeatChar (" " , sep) + right ;
//				if (l.length != len) alert(l.length + "     -     " + len +"     -    " + l);
			}
		}
		
		return lines ;
	}



	function agglomerate (labels, vectors, distance, linkage) {
		var N = vectors.length ;
		var dMin = new Array(N) ;
		var cSize = new Array(N) ;
		var matrixObj = new figue.Matrix(N,N);
		var distMatrix = matrixObj.mtx ;
		var clusters = new Array(N) ;

		var c1, c2, c1Cluster, c2Cluster, i, j, p, root , newCentroid ;

		if (distance == figue.EUCLIDIAN_DISTANCE)
			distance = euclidianDistance ;
		else if (distance == figue.MANHATTAN_DISTANCE)
			distance = manhattanDistance ;
		else if (distance == figue.MAX_DISTANCE)
			distance = maxDistance ;

		// Initialize distance matrix and vector of closest clusters
		for (i = 0 ; i < N ; i++) {
			dMin[i] = 0 ;
			for (j = 0 ; j < N ; j++) {
				if (i == j)
					distMatrix[i][j] = Infinity ;
				else
					distMatrix[i][j] = distance(vectors[i] , vectors[j]) ;
	
				if (distMatrix[i][dMin[i]] > distMatrix[i][j] )
					dMin[i] = j ;
			}
		}
	
		// create leaves of the tree
		for (i = 0 ; i < N ; i++) {
			clusters[i] = [] ;
			clusters[i][0] = new Node (labels[i], null, null, 0, vectors[i]) ;
			cSize[i] = 1 ;
		}
		
		// Main loop
		for (p = 0 ; p < N-1 ; p++) {
			// find the closest pair of clusters
			c1 = 0 ;
			for (i = 0 ; i < N ; i++) {
				if (distMatrix[i][dMin[i]] < distMatrix[c1][dMin[c1]])
					c1 = i ;
			}
			c2 = dMin[c1] ;
	
			// create node to store cluster info 
			c1Cluster = clusters[c1][0] ;
			c2Cluster = clusters[c2][0] ;

			newCentroid = calculateCentroid ( c1Cluster.size , c1Cluster.centroid , c2Cluster.size , c2Cluster.centroid ) ;
			newCluster = new Node (-1, c1Cluster, c2Cluster , distMatrix[c1][c2] , newCentroid) ;
			clusters[c1].splice(0,0, newCluster) ;
			cSize[c1] += cSize[c2] ;
		
			//Â overwriteÂ rowÂ c1Â with respect to the linkage type
			for (j = 0 ; j < N ; j++) {
				if (linkage == figue.SINGLE_LINKAGE) {
					if (distMatrix[c1][j] > distMatrix[c2][j])
						distMatrix[j][c1] = distMatrix[c1][j] = distMatrix[c2][j] ;
				} else if (linkage == figue.COMPLETE_LINKAGE) {
					if (distMatrix[c1][j] < distMatrix[c2][j])
						distMatrix[j][c1] = distMatrix[c1][j] = distMatrix[c2][j] ;
				} else if (linkage == figue.AVERAGE_LINKAGE) {
					var avg = ( cSize[c1] * distMatrix[c1][j] + cSize[c2] * distMatrix[c2][j])  / (cSize[c1] + cSize[j]) 
					distMatrix[j][c1] = distMatrix[c1][j] = avg ;
				}
			}
			distMatrix[c1][c1] = Infinity ;
		
			//Â infinity Â­outÂ oldÂ rowÂ c2Â andÂ columnÂ c2
			for (i = 0 ; i < N ; i++)
				distMatrix[i][c2] = distMatrix[c2][i] = Infinity ;
	
			//Â updateÂ dminÂ andÂ replaceÂ onesÂ thatÂ previousÂ pointedÂ to c2 to point to c1
			for (j = 0; j < N ; j++) {
				if (dMin[j] == c2)
					dMin[j] = c1;
				if (distMatrix[c1][j] < distMatrix[c1][dMin[c1]]) 
					dMin[c1] = j;
			}
	
			// keep track of the last added cluster
			root = newCluster ;
		}
	
		return root ;
	}


	function kmeans (k, vectors) {
		var n = vectors.length ;
		if ( k > n ) 
			return null ;

		// randomly choose k different vectors among n entries
		var centroids = new Array(k) ;
		var tested_indices = new Object ;
		var tested = 0 ;
		var cluster = 0 ;
		var i , vector, select ;
		while (cluster < k) {
			if (tested == n)
				return null ;

			var random_index = Math.floor(Math.random()*(n)) ;
			if (random_index in tested_indices)
				continue
			tested_indices[random_index] = 1;
			tested++ ;
			vector = vectors[random_index] ;
			select = true ;
			for (i = 0 ; i < cluster ; i++) {
				if ( vector.compare (centroids[i]) ) {
					select = false ;
					break ;
				}
			}
			if (select) {
				centroids[cluster] = vector ;
				cluster++ ;
			}
		}
	
		var assignments = new Array(n) ;
		var clusterSizes = new Array(k) ;
		var repeat = true ;
		var nb_iters = 0 ;
		while (repeat) {

			// assignment step
			for (var j = 0 ; j < k ; j++)
				clusterSizes[j] = 0 ;
			
			for (var i = 0 ; i < n ; i++) {
				var vector = vectors[i] ;
				var mindist = Number.MAX_VALUE ;
				var best ;
				for (var j = 0 ; j < k ; j++) {
					dist = euclidianDistance (centroids[j], vector)
					if (dist < mindist) {
						mindist = dist ;
						best = j ;
					}
				}
				clusterSizes[best]++ ;
				assignments[i] = best ;
			}
			//alert(assignments);

			// update centroids step
			var newCentroids = new Array(k) ;
			for (var j = 0 ; j < k ; j++)
				newCentroids[j] = null ;

			for (var i = 0 ; i < n ; i++) {
				cluster = assignments[i] ;
				if (newCentroids[cluster] == null)
					newCentroids[cluster] = vectors[i] ;
				else
					newCentroids[cluster] = addVectors (newCentroids[cluster] , vectors[i]) ;	
			}

			for (var j = 0 ; j < k ; j++) {
				newCentroids[j] = multiplyVectorByValue (1/clusterSizes[j] , newCentroids[j]) ;
			}	
			
			//alert(clusterSizes + " " + assignments + " " + newCentroids);

			// check convergence
			repeat = false ;
			for (var j = 0 ; j < k ; j++) {
				if (! newCentroids[j].compare (centroids[j])) {
					repeat = true ; 
					break ; 
				}
			}
			centroids = newCentroids ;
			nb_iters++ ;
			if (nb_iters > figue.KMEANS_MAX_ITERATIONS)
				repeat = false ;
			
		}
		return { 'centroids': centroids , 'assignments': assignments} ;

	}

	function Matrix (rows,cols) 
	{
		this.rows = rows ;
		this.cols = cols ;
		this.mtx = new Array(rows) ; 

		for (var i = 0 ; i < rows ; i++)
		{
			var row = new Array(cols) ;
			for (var j = 0 ; j < cols ; j++)
				row[j] = 0;
			this.mtx[i] = row ;
		}
	}

	function Node (label,left,right,dist, centroid) 
	{
		this.label = label ;
		this.left = left ;
		this.right = right ;
		this.dist = dist ;
		this.centroid = centroid ;
		if (left == null && right == null) {
			this.size = 1 ;
			this.depth = 0 ;
		} else {
			this.size = left.size + right.size ;
			this.depth = 1 + Math.max (left.depth , right.depth ) ;
		}
	}



	return { 
		SINGLE_LINKAGE: 0,
		COMPLETE_LINKAGE: 1,
		AVERAGE_LINKAGE:2 ,
		EUCLIDIAN_DISTANCE: 0,
		MANHATTAN_DISTANCE: 1,
		MAX_DISTANCE: 2,
		PRINT_VECTOR_VALUE_PRECISION: 2,
		KMEANS_MAX_ITERATIONS: 10,

		Matrix: Matrix,
		Node: Node,
		generateDendogram: generateDendogram,
		agglomerate: agglomerate,
		kmeans: kmeans
	}
}() ;


figue.Matrix.prototype.toString = function() 
{
	var lines = [] ;
	for (var i = 0 ; i < this.rows ; i++) 
		lines.push (this.mtx[i].join("\t")) ;
	return lines.join ("\n") ;
}

figue.Node.prototype.isLeaf = function() 
{
	if ((this.left == null) && (this.right == null))
		return true ;
	else
		return false ;
}

figue.Node.prototype.buildDendogram = function (sep, balanced,withLabel,withCentroid, withDistance)
{
	lines = figue.generateDendogram(this, sep, balanced,withLabel,withCentroid, withDistance) ;
	return lines.join ("\n") ;	
}


Array.prototype.compare = function(testArr) {
    if (this.length != testArr.length) return false;
    for (var i = 0; i < testArr.length; i++) {
        if (this[i].compare) { 
            if (!this[i].compare(testArr[i])) return false;
        }
        if (this[i] !== testArr[i]) return false;
    }
    return true;
}

