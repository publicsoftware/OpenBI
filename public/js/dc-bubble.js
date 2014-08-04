dc.bubble = function(parent, chartGroup) {
	var className = 'bubble';
	var _chart = dc.colorMixin(dc.baseMixin({}));
	var width  = _chart.width;
	var height = _chart.height;

	_chart._doRender = function() {
		drawChart();
		return _chart;
	};

	_chart._doRedraw = function(){
		return _chart._doRender();
	};

	var drawChart = function() {
		width = _chart.width();
		height = _chart.height();
		var data = _chart.data();
		var max = 0;
		for (var d = 0; d < data.length; d++) {
			if (max < data[d].value) {
				max = data[d].value;
			}
		}

		for (var d = 0; d < data.length; d++) {
			data[d].size = data[d].value * 1.0 / max * width / 5.0;
			data[d].size = Math.floor(data[d].size);
			data[d].x = data[d].size;
			data[d].y = data[d].size;
		}
		var root = {name: 'root', children: data};
		d3.select(parent).selectAll("svg").remove();

		var bubble = d3.layout.pack().size([width, height]);
		var svg = d3.select(parent)
			.append("svg")
			.attr("width", width)
			.attr("height", height)
			.attr("class", className);

		var node = svg.selectAll(".node")
			.data(bubble.nodes(root))
			// .data(data)
			;
			node
			.enter()
			.append("g")
			.attr("class", "node")
			.attr("transform", function(d) {
				if (d.x) {
					return "translate(" + d.x + "," + d.y + ")";
				}
			})
			;
			node.exit().remove();

		node.append("title")
			.text(function(d) { return d.key + ": " + d.value; });

		node.append("circle")
			.attr("r", function(d) { return d.size; })
			.style("fill", function(d, i) { return _chart.getColor(d, i); });

/*
		node.append("text")
			.attr("dy", "0.1rem")
			.style("text-anchor", "middle")
			.text(function(d) { return d.key; });
*/

		// d3.select(self.frameElement).style("height", height + "px");
	};

	return _chart.anchor(parent, chartGroup);
};
