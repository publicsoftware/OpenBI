dc.wordCloud = function(parent, chartGroup) {
	var wordcloudClass = 'wordcloud';
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
		width    = _chart.width();
		height   = _chart.height();
		var data = _chart.data();
		var max  = 0;
		for (var d = 0; d < data.length; d++) {
			if (max < data[d].value) {
				max = data[d].value;
			}
		}

		for (var d = 0; d < data.length; d++) {
			data[d].size = data[d].value * 1.0 / max * width / 10.0;
			data[d].size = Math.floor(data[d].size);
			data[d].x = data[d].size * 10;
			data[d].y = data[d].size * 10;
		}

		d3.select(parent).selectAll("svg").remove();

		d3.layout.cloud()
			.size([width, height])
			.words(data)
			.padding(5)
			.rotate(0)
			.fontSize(function(d) { return d.size; })
			.on("end", draw)
			.start()
			;
	};

	var draw = function(words) {
		d3.select(parent)
			.append("svg")
			.attr("width",  width)
			.attr("height", height)
			.append("g")
			.attr("transform", "translate(" + width/2 + "," + height/2 + ")")
			.selectAll("text")
			.data(words)
			.enter()
			.append("text")
			.style("font-size", function(d) { return d.size + "px"; })
			.style("fill", function(d, i) { return _chart.getColor(d, i); })
			.style("opacity", 0)
			.attr("text-anchor", "middle")
			.attr("transform", function(d) {
				return "translate(" + [d.x, d.y] + ")rotate(" +
					d.rotate + ")";
			})
			.attr("class", function (d, i) {
				return wordcloudClass + " _" + i;
			})
			.transition()
			.duration(_chart.transitionDuration())
			.style("opacity", function(d, i) { return 1; })
			.text(function(d) { return d.key; })
			;
	};

	return _chart.anchor(parent, chartGroup);
};
