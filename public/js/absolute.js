"use strict";
var _grid_size = 8;
var _chart_padding = 16;
var _z_index = 1000;

function createCrossFilter(dataResult) {
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

	$("select[name=dimension]").html("");
	$("select[name=group]").html("");
	var sortedColumns = columns.sort();
	for (var i = 0; i < columns.length; i++) {
		$("select[name=dimension]")
			.append("<option>" + sortedColumns[i] + "</option>");
		$("select[name=group]")
			.append("<option>" + sortedColumns[i] + "</option>");
	}

	// console.log(charts);

	for (var i = 0; i < charts.length; i++) {
		dimension[i] = xf.dimension(dc.pluck(charts[i].dimension));
		group[i]   = dimension[i].group()
					.reduceSum(dc.pluck(charts[i].group));
		var color  = d3.scale.category20();
		var width  = $("#chart" + i).outerWidth();
		var height = $("#chart" + i).outerHeight();
		height    -= _chart_padding;
		var square = Math.min(width, height);

		if (charts[i].type === "pie" ||
			charts[i].type === "donut") {
			charts[i].chart = dc.pieChart("#chart" + i)
				.width(width)
				.height(height - _chart_padding)
				.dimension(dimension[i])
				.group(group[i])
				.radius(square / 2 - _chart_padding)
				.innerRadius(charts[i].type === "pie" ? 0 : square / 10)
				.legend(dc.legend())
				;
		}
		else
		if (charts[i].type === "row") {
			charts[i].chart = dc.rowChart("#chart" + i)
				.width(width)
				.height(height - _chart_padding)
				.dimension(dimension[i])
				.group(group[i])
				.elasticX(true)
				;
		}
		else
		if (charts[i].type === "line") {
			var dat = group[i].top(Infinity);
			var min = +Infinity;
			var max = -Infinity;
			for (var d = 0; d < dat.length; d++) {
				var value = parseFloat(dat[d].key);
				if (min > value)
					min = value;
				if (max < value)
					max = value;
			}
			charts[i].chart = dc.lineChart("#chart" + i)
				.width(width)
				.height(height - _chart_padding)
				.dimension(dimension[i])
				.group(group[i])
				.elasticY(true)
				.brushOn(true)
				.x(d3.scale.linear().domain([min, max]))
				;
		}
		else
		if (charts[i].type === "bar") {
			var dat = group[i].top(Infinity);
			var min = +Infinity;
			var max = -Infinity;
			for (var d = 0; d < dat.length; d++) {
				var value = parseFloat(dat[d].key);
				if (min > value)
					min = value;
				if (max < value)
					max = value;
			}

			charts[i].chart = dc.barChart("#chart" + i)
				.width(width)
				.height(height - _chart_padding)
				.dimension(dimension[i])
				.group(group[i])
				.centerBar(true)
				.brushOn(true)
				.elasticY(true)
				.x(d3.scale.linear().domain([min, max]))
				.renderHorizontalGridLines(true)
				.outerPadding(1)
				.barPadding(.5)
				.gap(1)
				;
		}
		else
		if (charts[i].type === "wordcloud") {
			charts[i].chart = dc.wordCloud("#chart" + i)
				.width(width)
				.height(height - _chart_padding)
				.ordering(function(d){ return d.value; })
				.dimension(dimension[i])
				.group(group[i])
				;
		}
		/*
		else
		if (charts[i].type === 'bubble') {
			charts[i].chart = dc.bubbleChart('#chart' + i)
				.width(width)
				.height(height - _chart_padding)
				.ordering(function(d){ return d.value; })
				.dimension(dimension[i])
				.group(group[i])
				.brushOn(true)
				.elasticY(true)
				.x(d3.scale.ordinal())
				.xUnits(dc.units.ordinal)
				;
		}
		*/

		if (charts[i].chart != null) {
			charts[i].chart
				.transitionDuration(1000)
				.colors(color);

			if (charts[i].sort === "asc") {
				charts[i].chart.ordering(function(d){ return d.value; })
			}
			else
			if (charts[i].sort === "desc") {
				charts[i].chart.ordering(function(d){ return -d.value; })
			}

			if (charts[i].top === "top") {
				group[i].value = parseInt(charts[i].top_value);
				charts[i].chart.data(function(group) {
					return group.top(group.value);
				});
			}
			else
			if (charts[i].top === "bottom") {
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
}

var saveCount = 0;
function documentSaveLayout() {
	saveCount = 0;
	for (var i = 0; i < charts.length; i++) {
		saveChart(i);
	}
}

function documentDelete() {
	$.post("/document-delete/" + doc)
	.success(function(result) {
		window.location = "/";
	});
}

function documentChooseFile() {
	$("[name=file]").click();
}

function documentSettings() {
	$("#settings [name=data]").val(data_type);
	documentDataType();
	var modal = $.UIkit.modal("#settings").show();
}

function documentDataType() {
	var source = $("#settings [name=data]").val();
	if (source === "file") {
		$("#data-url").hide();
		$("#choose-csv").fadeIn();
	}
	else
	if (source === "url") {
		$("#choose-csv").hide();
		$("#data-url").fadeIn();
	}
}

function documentSettingsClose() {
	$.UIkit.modal("#settings").hide();
}

function documentViewData() {
	var MAX = 10;
	var str = "";
	for (var j = 0; j < columns.length - 1; j++) {
		str += columns[j] + ",";
	}
	str += columns[columns.length - 1] + "\n";

	MAX = Math.min(MAX, data.length);

	for (var i = 0; i < MAX; i++) {
		for (var j = 0; j < columns.length - 1; j++) {
			str += data[i][columns[j]] + ",";
		}
		str += data[i][columns[columns.length - 1]] + "\n";
	}

	$("#data #csv").val(str);
	$.UIkit.modal("#data").show();
}

function sampleCode() {
	var s = "data.forEach(function(d) {\n  d.Count = 1;\n});";
	$("[name=init]").val(s);
}

function theme(name) {
	if (name === "light") {
		$("[name=style]").val("");
	}
	else
	if (name === "dark") {
		var s = "{\n  background: '#333',\n  text: '#eee',\n  " +
		"chartTitle: '#777',\n  chartBorder: '#777',\n  " +
		"chartBackground: '#555',\n  " +
		"chartShadow: 'inset 0px 0px 300px rgba(0,0,0,.5)',\n  " +
		"axis: 'white'\n}";
		$('[name=style]').val(s);
	}
	else
	if (name === "white") {
		var s = "{\n  background: 'white',\n  text: '#666',\n  " +
		"chartTitle: '#eee',\n  chartBorder: '@background',\n  " +
		"chartBackground: '@background',\n  axis: '#666'\n}";
		$('[name=style]').val(s);
	}
}


function createChart(data) {
	if (data.id == null) {
		data.id = 0;
		data.name = "New";
		data.type = "none";
		data.dimension = "";
		data.group = "";
		data.x = _grid_size;
		data.y = _grid_size * 6;
		data.width = 304;
		data.height = 304;
		data.sort = "";
		data.top = "";
		data.top_value = "0";
		data.maximize_width = 0;
		data.maximize_height = 0;
	}

	var count = charts.length;
	var html = $('#chart-template').html().replace(/_id/g, count);
	$('body').append(html);

	var chart = $('#chart' + count);
	chart.draggable({handle: '.handle'});
	chart.resizable();
	chart.css('z-index', count + _z_index);

	if (data.x)	chart.css('left', data.x + 'px');
	if (data.y)	chart.css('top',  data.y + 'px');

	if (data.maximize_width) {
		var width = $(document).width();
		chart.outerWidth(width - data.x - _grid_size);
	}
	else {
		if (data.width) {
			chart.outerWidth(data.width + 'px');
		}
	}

	if (data.maximize_height) {
		var height = $(document).height();
		chart.outerHeight(height - data.y - _grid_size);
	}
	else {
		if (data.height) {
			chart.outerHeight(data.height + 'px');
		}
	}

	chart.find(".title").text(data.name);
	charts.push(data);
}

function chartSettings(k) {
	$('#chart-settings').prop('data-chart-id', k);
	$('#chart-settings [name=id]'       ).val(k);
	$('#chart-settings [name=name]'     ).val(charts[k].name);
	$('#chart-settings [name=type]'     ).val(charts[k].type);
	$('#chart-settings [name=dimension]').val(charts[k].dimension);
	$('#chart-settings [name=group]'    ).val(charts[k].group);
	$('#chart-settings [name=sort]'     ).val(charts[k].sort);
	$('#chart-settings [name=top]'      ).val(charts[k].top);
	$('#chart-settings [name=top-value]').val(charts[k].top_value);
	$('[name=maximize-width]' ).prop('checked', charts[k].maximize_width );
	$('[name=maximize-height]').prop('checked', charts[k].maximize_height);
	topChange();
	var modal = $.UIkit.modal("#chart-settings").show();
}

function chartSettingsSave() {
	var id					= $('#chart-settings [name=id]'       ).val();
	charts[id].name			= $('#chart-settings [name=name]'     ).val();
	charts[id].type			= $('#chart-settings [name=type]'     ).val();
	charts[id].dimension	= $('#chart-settings [name=dimension]').val();
	charts[id].group		= $('#chart-settings [name=group]'    ).val();
	charts[id].sort			= $('#chart-settings [name=sort]'     ).val();
	charts[id].top			= $('#chart-settings [name=top]'      ).val();
	charts[id].top_value	= $('#chart-settings [name=top-value]').val();
	charts[id].maximize_width = $('[name=maximize-width]' ).is(':checked')? 1:0;
	charts[id].maximize_height= $('[name=maximize-height]').is(':checked')? 1:0;
	$('#chart' + id + " .title").text(charts[id].name);
	var modal = $.UIkit.modal("#chart-settings");
	modal.hide();
	start();
}

function sortChange() {
	var val = $('select[name=sort]').val();
	if (val === 'asc' || val === 'desc') {
		$('select[name=top]').val('none');
		topChange();
	}
}

function topChange() {
	var val = $('select[name=top]').val();
	if (val === 'top' || val === 'bottom') {
		$('input[name=top-value]').fadeIn();
		$('select[name=sort]').val('none');
	}
	else {
		$('input[name=top-value]').fadeOut();
	}
}

function chartDelete(id) {
	charts[id].deleted = true;
	$('#chart' + id).fadeOut();
}

function chartDeleteThis() {
	var id = $('#chart-settings [name=id]').val();
	$.UIkit.modal("#chart-settings").hide();
	chartDelete(id);
}

function saveChart(index) {
	if (charts[index].deleted) {
		var data = { id: charts[index].id, document: doc };
		$.post('/object-delete', data);
	}
	else {
		var chart = $('#chart' + index);
		var x = chart.position().left;
		var y = chart.position().top;
		var w = chart.outerWidth();
		var h = chart.outerHeight();

		var data = {
			document:  doc,
			id:        charts[index].id,
			name:      charts[index].name,
			type:      charts[index].type,
			dimension: charts[index].dimension,
			group:     charts[index].group,
			sort:      charts[index].sort,
			top:       charts[index].top,
			top_value: charts[index].top_value,
			x:x, y:y, width:w, height:h,
			maximize_width:  charts[index].maximize_width,
			maximize_height: charts[index].maximize_height
			};
		$.post('/object-save', data, function(result) {
			saveCount++;
			if (saveCount === charts.length) {
				location.reload();
			}
		});
	}
}


function snapAll() {
	$('body').css('width', '100%');
	$('.ruler').fadeOut();

	for (var i = 0; i < charts.length; i++) {
		$('#chart' + i).css('z-index', _z_index + i);
		// console.log($('#chart' + i).css('z-index'));
	}

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
		// $(this).css('z-index', _z_index + i);
	});

}

function snap(x) {
	x = parseInt(x);
	var grid = _grid_size;

	if (x % grid === 0) {
		// nothing
	}
	if (x % grid > grid / 2) {
		x = (parseInt(x / grid) + 1) * grid;
	}
	else {
		x = parseInt(x / grid) * grid;
	}

	return x;
}

function resize() {
	// stretch
	for (var i = 0; i < charts.length; i++) {
		if (charts[i].maximize_width) {
			var width = $(window).width();
			width = width  - charts[i].x - _grid_size;
			// width = snap(width);
			$('#chart' + i).outerWidth(width  + 'px');
		}

		if (charts[i].maximize_height) {
			var height = $(window).height();
			height = height - charts[i].y - _grid_size;
			// height = snap(height);
			$('#chart' + i).outerHeight(height + 'px');
		}
	}

	var maxWidth = 0;
	var maxHeight = 0;
	for (var i = 0; i < charts.length; i++) {
		var tmp = charts[i].x + $('#chart' + i).outerWidth();
		if (maxWidth < tmp) {
			maxWidth = tmp;
		}
		var tmp = charts[i].y + $('#chart' + i).outerHeight();
		if (maxHeight < tmp) {
			maxHeight = tmp;
		}
	}

	$('#pad-right').css('left', maxWidth + 'px');
	$('#pad-bottom').css('top', maxHeight + 'px');
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
				// var background = $('body').css('background');
				// $('body').css('background', '#eaeaea');

				var x = $(this).offset().left;
				var y = $(this).offset().top;

				var z = parseInt($(this).css('z-index'));
				$(this).css('z-index', 10000 + z);

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
					// $('body').css('background', background);
					snapAll();
				});
			}
			e.preventDefault();
		});

		/*
		$(this).on("mouseup", function() {
			$(this).css('cursor', 'default')
			.removeClass('resizable');
			snapAll();
		});
		*/

		return $(this);
	};
})(jQuery);

(function($) {
	$.fn.draggable = function(opt) {
		if (opt.handle === "") {
			var el = this;
		}
		else {
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
			var z = parseInt(drag.css('z-index'));
			var drg_h = drag.outerHeight();
			var drg_w = drag.outerWidth();
			var pos_y = drag.offset().top + drg_h - e.pageY;
			var pos_x = drag.offset().left + drg_w - e.pageX;

			drag.css('z-index', 10000 + z)
			.parents().on("mousemove", function(e) {
				if ($('.draggable').length > 0) {
					$('.ruler').fadeIn();
				}

				$('.draggable').offset({
					top: snap(e.pageY + pos_y - drg_h),
					left:snap(e.pageX + pos_x - drg_w)
				}).on("mouseup", function() {
					$(this).removeClass('draggable').css('z-index', z);
					snapAll();
				});
			});
			e.preventDefault();
		}).on("mouseup", function() {
			$(this).css('cursor', 'default');
			if(opt.handle === "") {
				$(this).removeClass('draggable');
			} else {
				$(this).removeClass('active-handle').parent().
						removeClass('draggable');
			}
			snapAll();
		});
	};
})(jQuery);
