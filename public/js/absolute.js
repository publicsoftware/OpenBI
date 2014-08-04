"use strict;"
var _grid_size = 8;
var _chart_padding = 16;

function createCrossFilter(dataUrl) {
	// TODO load data only one time
	// TODO support realtime data
	d3.csv(dataUrl, function(dataResult) {
		data = dataResult;

		try {
			var r = eval(init);
		}
		catch (e) {
		}

		xf        = crossfilter(data);
		dimension = new Array();
		group     = new Array();
		columns   = new Array();
		for (var k in data[0]) {
			columns.push(k);
		}

		$('select[name=dimension]').html('');
		$('select[name=group]').html('');
		for (var i = 0; i < columns.length; i++) {
			$('select[name=dimension]')
				.append('<option>' + columns[i] + '</option>');
			$('select[name=group]')
				.append('<option>' + columns[i] + '</option>');
		}

		console.log(charts);

		for (var i = 0; i < charts.length; i++) {
			dimension[i] = xf.dimension(dc.pluck(charts[i].dimension));
			group[i] = dimension[i].group()
					.reduceSum(dc.pluck(charts[i].group))
					;
			var color = d3.scale.category20();
			var width  = $('#chart' + i).outerWidth();
			var height = $('#chart' + i).outerHeight();
			height -= _chart_padding;
			var square = Math.min(width, height);

			if (charts[i].type === 'pie') {
				charts[i].chart = dc.pieChart("#chart" + i)
					.width(width)
					.height(height - _chart_padding)
					.dimension(dimension[i])
					.group(group[i])
					.radius(square / 2 - _chart_padding)
					.innerRadius(square / 10)
					.legend(dc.legend())
					;
			}
			else
			if (charts[i].type === 'row') {
				charts[i].chart = dc.rowChart('#chart' + i)
					.width(width)
					.height(height - _chart_padding)
					.dimension(dimension[i])
					.group(group[i])
					.elasticX(true)
					;
			}
			else
			if (charts[i].type === 'line') {
				charts[i].chart = dc.lineChart('#chart' + i)
					.width(width)
					.height(height - _chart_padding)
					.dimension(dimension[i])
					.group(group[i])
					.elasticY(true)
					.brushOn(true)
					.x(d3.scale.ordinal())
					.xUnits(dc.units.ordinal)
					;
			}
			else
			if (charts[i].type === 'bar') {
				charts[i].chart = dc.barChart('#chart' + i)
					.width(width)
					.height(height - _chart_padding)
					.dimension(dimension[i])
					.group(group[i])
					.centerBar(true)
					.brushOn(true)
					.elasticY(true)
					.x(d3.scale.ordinal())
					.xUnits(dc.units.ordinal)
					.renderHorizontalGridLines(true)
					.barPadding(1)
					.outerPadding(.5)
					.gap(1)
					;
			}
			else
			if (charts[i].type === 'wordcloud') {
				charts[i].chart = dc.wordCloud('#chart' + i)
					.width(width)
					.height(height - _chart_padding)
					.ordering(function(d){ return d.value; })
					.dimension(dimension[i])
					.group(group[i])
					;
			}

			if (charts[i].chart != null) {
				charts[i].chart
					.transitionDuration(1000)
					.colors(color);

				if (charts[i].sort === 'asc') {
					charts[i].chart.ordering(function(d){ return d.value; })
				}
				else
				if (charts[i].sort === 'desc') {
					charts[i].chart.ordering(function(d){ return -d.value; })
				}

				if (charts[i].top === 'top') {
					group[i].value = parseInt(charts[i].top_value);
					charts[i].chart.data(function(group) {
						return group.top(group.value);
					});
				}
				else
				if (charts[i].top === 'bottom') {
					group[i].value = -parseInt(charts[i].top_value);
					charts[i].chart.data(function(group) {
						return group.top(Infinity).splice(group.value);
					});
				}
			}
		}

		dc.renderAll();
		/*
		d3.selectAll("g.x text")
			.attr("class", "campusLabel")
			.style("text-anchor", "end")
			.attr("transform", "translate(-10,0)rotate(315)");
		*/
	});
}

function snapAll() {
	$('body').css('width', '100%');
	$('.chart').each(function() {
		var x = $(this).position().left;
		var y = $(this).position().top;
		var w = $(this).outerWidth();
		var h = $(this).outerHeight();
		x = snap(x);
		y = snap(y);
		w = snap(w);
		h = snap(h);
		$(this).css('left', x + 'px');
		$(this).css('top',  y + 'px');
		$(this).outerWidth(w + 'px');
		$(this).outerHeight(h + 'px');
	});
}

function snap(x) {
	x = parseInt(x);
	grid = parseInt(_grid_size);

	if (x % grid === 0) {
	}
	if (x % grid > grid / 2) {
		x = (parseInt(x / grid) + 1) * grid;
	}
	else {
		x = parseInt(x / grid) * grid;
	}

	if (x % _grid_size !== 0)
		console.log('error ' + x);
	return x;
}

(function($) {
	$.fn.resizable = function() {

		$(this).css('cursor', 'default');
		$(this).on("mousedown", function(e) {
			var x = $(this).offset().left;
			var y = $(this).offset().top;
			var w = $(this).outerWidth();
			var h = $(this).outerHeight();
			// console.log('[w,h] = [' + w + ',' + h + ']');
			var x1 = e.pageX;
			var y1 = e.pageY;
			// console.log('[x,y] = [' + (x1-x) + ',' + (y1-y) + ']');
			if (w-x1+x < 40 && h-y1+y < 40) {
				$(this).css('cursor', 'nwse-resize');
				$(this).addClass('resizable');

				var x = $(this).offset().left;
				var y = $(this).offset().top;

				var z = $(this).css('z-index');
				$(this).css('z-index', z + 1000);

				$(this).parents().on("mousemove", function(e) {
					if ($('.resizable').length > 0) {
						$('.ruler').fadeIn();
					}
					var width  = snap(e.pageX - x);
					var height = snap(e.pageY - y);
					$('.resizable')
					.outerWidth(width + 'px')
					.outerHeight(height + 'px');
				});

				$(this).parents().on("mouseup", function() {
					$('.resizable')
					.css('z-index', z)
					.css('cursor', 'default')
					.removeClass('resizable');
					$('.ruler').fadeOut();
				});
			}
			e.preventDefault();
		});

		$(this).on("mouseup", function() {
			$(this).css('cursor', 'default')
			.removeClass('resizable');
			$('.ruler').fadeOut();
			// snapAll();
		});

		return $(this);
	};
})(jQuery);

(function($) {
	$.fn.draggable = function(opt) {
		if(opt.handle === "") {
			var el = this;
		} else {
			var el = this.find(opt.handle);
		}

		return el.css('cursor', opt.cursor)
		.on("mousedown", function(e) {
			$(this).css('cursor', 'move');
			if (opt.handle === "") {
				var drag = $(this).addClass('draggable');
			} else {
				var drag = $(this).addClass('active-handle').parent().
									addClass('draggable');
			}
			var z = drag.css('z-index');
			var drg_h = drag.outerHeight();
			var drg_w = drag.outerWidth();
			var pos_y = drag.offset().top + drg_h - e.pageY;
			var pos_x = drag.offset().left + drg_w - e.pageX;

			drag.css('z-index', 900).parents().on("mousemove", function(e) {
				if ($('.draggable').length > 0) {
					$('.ruler').fadeIn();
				}

				$('.draggable').offset({
					top: snap(e.pageY + pos_y - drg_h),
					left:snap(e.pageX + pos_x - drg_w)
				}).on("mouseup", function() {
					$(this).removeClass('draggable').css('z-index', z);
				});
			});
			e.preventDefault();
		}).on("mouseup", function() {
			$(this).css('cursor', 'default');
			$('.ruler').fadeOut();
			if(opt.handle === "") {
				$(this).removeClass('draggable');
			} else {
				$(this).removeClass('active-handle').parent().
						removeClass('draggable');
			}
		});
	};
})(jQuery);
