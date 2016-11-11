'use strict';

angular.module('myApp.view3')
	.service("topicTree", function() {

		var _nodes = [];
		var _treeObject = null;
		var color = d3.scaleOrdinal(d3.schemeCategory20);

		this.build = function(nodes) {
			_nodes = nodes;
			_treeObject = _build();
			_traverse(function(node) {
		  		node.name = node["Topic6"];
		  		node.size = parseFloat(node["Ad Views"]);
		  		delete node["Topic1"];
		  		delete node["Topic2"];
		  		delete node["Topic3"];
		  		delete node["Topic4"];
		  		delete node["Topic5"];
		  		delete node["Topic6"];
		  		delete node["Topic Behavior"];
		  		delete node["Ad Views"];
		  		delete node[""];
		  	});
		  	return _treeObject;
		};

		this.getTreeObject = function() {
			return _treeObject;
		};

		this.getNodes = function() {
			return _nodes;
		};

		this.searchByName = function(name) {
			var queue = [_treeObject[0]];
			 var n;

			while(queue.length>0) {

			    n = queue.shift();

			    if (n.name == name)
			    	return n;

			    if (!n.children) {
			      continue;
			    }

			    for (var i = 0; i< n.children.length; i++) {
			       queue.push(n.children[i]);
			    }
			}
		};

		function _build() {
		  	var map = {}, node, roots = [], parent;
			for (var i = 0; i < _nodes.length; i++) {
			    node = _nodes[i];
			    node.children = [];
			    node.id = i;
			    node.color = color(node.id);
			    map[node["Topic6"]] = i;
			    
			    if (node["Topic6"] != node["Topic5"])
			    	parent = node["Topic5"];
			    else if (node["Topic5"] != node["Topic4"])
			    	parent = node["Topic4"];
			    else if (node["Topic4"] != node["Topic3"])
			    	parent = node["Topic3"];
			    else if (node["Topic3"] != node["Topic2"])
			    	parent = node["Topic2"];
			    else if (node["Topic2"] != node["Topic1"])
			    	parent = node["Topic1"];
			    else if (node["Topic1"] != node["Topic Behavior"])
			    	parent = node["Topic Behavior"];


			    if (node["Topic6"] != node["Topic Behavior"]) {
			        _nodes[map[parent]].children.push(node);
			    } else {
			        roots.push(node);
			    }
			}
			return roots;
		}

		function _traverse(callback) {
		  var queue = [_treeObject[0]];
		  var n;

		  while(queue.length>0) {

		    n = queue.shift();
		    callback(n);

		    if (!n.children) {
		      continue;
		    }

		    for (var i = 0; i< n.children.length; i++) {
		       queue.push(n.children[i]);
		    }
		  }
	  }


	});