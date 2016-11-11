'use strict';

angular.module('myApp.view3')
.controller('View3Ctrl', ["$scope", "topicTree", function($scope, topicTree) {

	var svg = d3.select("svg"),
    margin = 20,
    diameter = + 0.5*svg.attr("width"),
    g = svg.append("g").attr("transform", "translate(" + diameter + "," + (0.5*diameter + 40) + ")"),
    breadCrumbsContainer = svg.append("g")
    						.attr("transform", "translate(" + 10 + "," + 20 + ")")
    						.attr("width", svg.attr("width"));

    var labelFormat = d3.format(".0s");
    var tooltipFormat = d3.format(",");

	var color = d3.scaleOrdinal(d3.schemeCategory20);

	var pack = d3.pack()
	    .size([diameter - margin, diameter - margin])
	    .padding(2);

	d3.csv("behavior_topic.csv", function(error, jsonData) {

	  if (error) throw error;

	  var root = topicTree.build(jsonData)[0];

	  var div = d3.select("body").append("div")	
	    .attr("class", "tooltip")				
	    .style("opacity", 0);

	  root = d3.hierarchy(root)
	      .sum(function(d) { return d.size; })
	      .sort(function(a, b) { return b.value - a.value; });

	  var focus = root, view, nodes = pack(root).descendants();

	  var circle = g.selectAll("circle")
	    .data(nodes)
	    .enter().append("circle")
	      .filter(function(d){return d.value || d.data.size;})
	      .attr("class", function(d) { return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root"; })
	      .style("fill", function(d) { 
	      	return d.data.color;
	      })
	      .style("fill-opacity", function(d) { return d.parent === focus ? 1 : 0; })
	      .style("display", function(d) { return d.parent === focus ? "inline" : "none"; })
	      .on("click", function(d) { 
	      	if (focus !== d && focus.children.length) 
	      		zoom(d), d3.event.stopPropagation(); 
	      })
	      .on("mouseover", function(d) {
	      		var tooltip = "<b>" + d.data.name + " - " + tooltipFormat(d.value) + " views</b>";
	      		if (d.children) {
	      			tooltip += d.children.filter(function(d){return d.value;}).reduce(function(prev, child) {
	      						return prev + "<br/>" + child.data.name + " - " + tooltipFormat(child.value) + " views";
	      					}, "");
	      		}
	      					
	            div.transition()		
	                .duration(200)		
	                .style("opacity", .9);		
	            div	.html(tooltip)	
	                .style("left", (d3.event.pageX) + "px")		
	                .style("top", (d3.event.pageY - 28) + "px");	
	            })					
	        .on("mouseout", function(d) {		
	            div.transition()		
	                .duration(500)		
	                .style("opacity", 0);	
	        });

	  var text = g.selectAll("text")
	    .data(nodes)
	    .enter().append("text")
	      .filter(function(d){return d.value;})
	      .attr("class", "label")
	      .style("fill-opacity", function(d) { return d.parent === root ? 1 : 0; })
	      .style("display", function(d) { return d.parent === root ? "inline" : "none"; })
	      .html(function(d) { return d.data.name + " - "  + labelFormat(d.value)  + " views"});

	  var node = g.selectAll("circle,text");

	  /*svg.on("click", function() { zoom(root); });*/

	  zoomTo([root.x, root.y, root.r * 2 + margin]);
	  $scope.$apply(function() {
	  	  $scope.breadCrumbs = [root.data.name];
	  	  drawBreadCrumbs($scope.breadCrumbs);
	  });

	 // console.log(root);

	  function zoom(d) {
	    var focus0 = focus, focus = d;

	    $scope.$apply(function() {
	    	var currentLevel = focus.data.name;
	    	var index = $scope.breadCrumbs.indexOf(currentLevel);
	    	if (index != -1)
	    		$scope.breadCrumbs.splice(index + 1);
	    	else
	    		$scope.breadCrumbs.push(focus.data.name);
	    });

	    var transition = d3.transition()
	        .duration(d3.event.altKey ? 7500 : 750)
	        .tween("zoom", function(d) {
	          var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r*2 + margin]);
	          return function(t) { zoomTo(i(t)); };
	        });

	    transition.selectAll("text")
	      .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
	      .style("fill-opacity", function(d) { return d.parent === focus ? 1 : 0; })
	      .on("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
	      .on("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });

	    transition.selectAll("circle")
	      .style("fill-opacity", function(d) { return d.parent === focus ? 1 : 0; })
	      .on("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
	      .on("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
	  }

	  function zoomTo(v) {
	    var k = diameter / v[2]; view = v;
	    node.attr("transform", function(d) { return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; });
	    circle.attr("r", function(d) { return d.r * k; });
	  }

	  function drawBreadCrumbs(data) {
	  	var crumbs = breadCrumbsContainer.selectAll("g").data(data);	
		var g1 = crumbs.enter().append("g")
			.attr("class","breadcrumb")
			.on("click", function(d) {
				d3.event.stopPropagation();
				var currentNode = nodes.filter(function(node) {
					return node.data.name === d;
				});
				zoom(currentNode[0]);
			});

		var arrows = g1.append("polygon")
			.style("fill", function(d){ return topicTree.searchByName(d).color; });

		g1.append("text").text(function(d){ return d; });
		g1.attr("transform", function(d,i) {
			var x, y, lastLevel, currentLevel;
			lastLevel = crumbs.nodes().reduce(function(prev, node){ 
				var nodeLevel = parseInt(d3.select(node).attr("level"));
				return prev > nodeLevel ? prev : nodeLevel}, 0);
			var LastLevelCrumbs = breadCrumbsContainer.selectAll("g[level='"+ lastLevel +"']");
			var lastLevelCrumbsLength = LastLevelCrumbs.nodes().reduce(function(total, node) {
				return total + node.getBBox().width;
			}, 0);
			currentLevel = lastLevelCrumbsLength + this.getBBox().width < svg.attr("width") ? lastLevel : lastLevel + 1;

			var currentLevelCrumbs = breadCrumbsContainer.selectAll("g[level='"+ currentLevel +"']");
			d3.select(this).attr("level",currentLevel);
			var x0 = currentLevelCrumbs.nodes().reduce(function(total, node) {
				return total + node.getBBox().width;
			}, 0);
			x = x0 + 5 || 5;
			y = 20 + 40*currentLevel;
			return "translate(" + x + "," + y + ")";
		});
		arrows
		.attr("points", function(d) {
			var w = this.parentNode.getBBox().width + 30;
			var t = 10;
			var h = 30;
			var mh = -17;
			var mw = -15;
			var points = [];
			points.push(0+mw,0+mh);
			points.push(w-t+mw,0+mh);
			points.push(w+mw,h/2+mh);
			points.push(w-t+mw,h+mh);
			points.push(0+mw,h+mh);
			points.push(t+mw,h/2+mh);

			return points.join(" ");
		});
		crumbs.exit().remove();
	  }

	  //watches
		$scope.$watch("breadCrumbs", drawBreadCrumbs, true);

	});




}]);