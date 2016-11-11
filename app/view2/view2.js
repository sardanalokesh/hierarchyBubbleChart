'use strict';

angular.module('myApp.view2', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/view2', {
    templateUrl: 'view2/view2.html',
    controller: 'View2Ctrl'
  });
}])

.controller('View2Ctrl', [function() {

	var svg = d3.select("svg"),
    margin = 20,
    diameter = +svg.attr("width"),
    g = svg.append("g").attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

	/*var color = d3.scaleLinear()
	    .domain([-1, 5])
	    .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
	    .interpolate(d3.interpolateHcl);
	*/
	var color = d3.scaleOrdinal(d3.schemeCategory20);

	var pack = d3.pack()
	    .size([diameter - margin, diameter - margin])
	    .padding(2);

	d3.csv("IT_motives_2013.csv", function(error, jsonData) {
	  if (error) throw error;

	  var root = {
	  	name: "India",
	  	children: jsonData.filter(function(d) {
	  		return !d["State/UTs"].match(/^Total/);
	  	}).map(function(d) {
	  		var key, children = [];
	  		for (key in d) {
	  			if (key != "State/UTs" && key != "Total" && key != "Year" && key != "Crime Head") {
		  			children.push({
		  				name: key,
		  				size: d[key]
		  			});
		  		}
	  		}
	  		return {
	  			name: d["State/UTs"],
	  			children: children 
	  		};
	  	})
	  };

	  var div = d3.select("body").append("div")	
	    .attr("class", "tooltip")				
	    .style("opacity", 0);

	  root = d3.hierarchy(root)
	      .sum(function(d) { return d.size; })
	      .sort(function(a, b) { return b.value - a.value; });

	  var focus = root,
	      nodes = pack(root).descendants(),
	      view;

	  var circle = g.selectAll("circle")
	    .data(nodes)
	    .enter().append("circle")
	      .filter(function(d){return d.value;})
	      .attr("class", function(d) { return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root"; })
	      .style("fill", function(d) { 
	      	if (d === root)
	      		return "#060696";
	      	else if (!d.children)
	      		return color(d.data.name);
	      	return "#ffffff";
	      })
	      .on("click", function(d) { if (focus !== d) zoom(d), d3.event.stopPropagation(); })
	      .on("mouseover", function(d) {
	      		var tooltip = "<b>" + d.data.name + " " + d.value + "</b>"
	      					+ d.children.filter(function(d){return d.value;}).reduce(function(prev, child) {
	      						return prev + "<br/>" + child.data.name + " " + child.value;
	      					}, "");
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
	      .text(function(d) { return d.parent == root ? d.data.name : d.data.name + " "  + d.value });

	  var node = g.selectAll("circle,text");

	  svg.on("click", function() { zoom(root); });

	  zoomTo([root.x, root.y, root.r * 2 + margin]);

	  function zoom(d) {
	    var focus0 = focus; focus = d;

	    var transition = d3.transition()
	        .duration(d3.event.altKey ? 7500 : 750)
	        .tween("zoom", function(d) {
	          var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
	          return function(t) { zoomTo(i(t)); };
	        });

	    transition.selectAll("text")
	      .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
	        .style("fill-opacity", function(d) { return d.parent === focus ? 1 : 0; })
	        .on("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
	        .on("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
	  }

	  function zoomTo(v) {
	    var k = diameter / v[2]; view = v;
	    node.attr("transform", function(d) { return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; });
	    circle.attr("r", function(d) { return d.r * k; });
	  }
	});

}]);