var _grid_size = 8;
var _chart_padding = 16;

function createCrossFilter(dataPath) {
	// TODO: load data only first time then
	// create data preparation, get the available dimension
	// display dimension & group to user
	d3.csv(dataPath, function(data_) {
		data = data_;
		xf = crossfilter(data);
		dimension = new Array();
		group = new Array();
		columns = new Array();
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

		var transitionDuration = 1000;

		for (var i = 0; i < charts.length; i++) {
			var color = d3.scale.category20();
			dimension[i] = xf.dimension(dc.pluck(charts[i].dimension));
			group[i] = dimension[i].group()
					.reduceSum(dc.pluck(charts[i].group))
					;
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

			charts[i].chart
				.transitionDuration(transitionDuration)
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

		dc.renderAll();
		/*
		d3.selectAll("g.x text")
			.attr("class", "campusLabel")
			.style("text-anchor", "end")
			.attr("transform", "translate(-10,0)rotate(315)");
		*/
	});

}

// TODO: Add right and bottom padding automatically

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
	$('#chart' + id + " .title").text(charts[id].name);
	var modal = $.UIkit.modal("#chart-settings");
	modal.hide();
	restart();
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

function createChart(data) {
   	if (data.id == null) {
		data.id = 0;
		data.name = 'New';
		data.type = 'none';
		data.dimension = '';
		data.group = '';
		data.x = _grid_size;
		data.y = _grid_size * 8;
		data.width = 240;
		data.height = 120;
		data.sort = '';
		data.top = '';
		data.top_value = '0';
	}

	var html = $('#chart-template').html();
	var count = charts.length;
	html = html.replace(/_id/g, count);
	$('body').append(html);

	var chart = $('#chart' + count);
	chart.draggable({handle: '.handle'});
	chart.resizable();

	if (data.x) chart.css('left', data.x + 'px');
	if (data.y) chart.css('top',  data.y + 'px');
	if (data.width)  chart.outerWidth(data.width + 'px');
	if (data.height) chart.outerHeight(data.height + 'px');
	chart.find(".title").text(data.name);

	charts.push(data);
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
			x:x, y:y, width:w, height:h };
		$.post('/object-save', data);
	}
}

function documentSaveLayout() {
	for (var i = 0; i < charts.length; i++) {
		saveChart(i);
	}
}

function documentSettingsClose() {
	var modal = $.UIkit.modal("#settings");
	modal.hide();
}

function documentSettingsSave() {
	var checked = $('#settings [name=public]').is(':checked');
	var data = {
		document: doc,
		name: $('#settings [name=name]').val(),
		public: checked ? 1 : 0
	};
	$.post('/document-save', data, function(result) {
		documentSettingsSave();
	});
}

$('body').on('mouseup', function() {
	snapAll();
});

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
			var x1 = e.clientX;
			var y1 = e.clientY;
			// console.log('[x,y] = [' + (x1-x) + ',' + (y1-y) + ']');
			if (w-x1+x < 20 && h-y1+y < 20) {

				$(this).css('cursor', 'nwse-resize');
				$(this).addClass('resizable');

				var x = $(this).offset().left;
				var y = $(this).offset().top;

				var z = $(this).css('z-index');
				$(this).css('z-index', z + 1000);

				$(this).parents().on("mousemove", function(e) {
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
				});
			}
			e.preventDefault();
		});

		$(this).on("mouseup", function() {
			$(this).css('cursor', 'default')
			.removeClass('resizable');
			// snapAll();
		});

		return $(this);
	};
})(jQuery);

(function($) {
	$.fn.draggable = function(opt) {

		// opt = $.extend({handle:"",cursor:"move"}, opt);

		if(opt.handle === "") {
			var $el = this;
		} else {
			var $el = this.find(opt.handle);
		}

		return $el.css('cursor', opt.cursor).on("mousedown", function(e) {
			$(this).css('cursor', 'move');
			if(opt.handle === "") {
				var $drag = $(this).addClass('draggable');
			} else {
				var $drag = $(this).addClass('active-handle').parent().
									addClass('draggable');
			}
			var z_idx = $drag.css('z-index'),
				drg_h = $drag.outerHeight(),
				drg_w = $drag.outerWidth(),
				pos_y = $drag.offset().top + drg_h - e.pageY,
				pos_x = $drag.offset().left + drg_w - e.pageX;
			$drag.css('z-index', 900).parents().on("mousemove", function(e) {
				$('.draggable').offset({
					top: snap(e.pageY + pos_y - drg_h),
					left:snap(e.pageX + pos_x - drg_w)
				}).on("mouseup", function() {
					$(this).removeClass('draggable').css('z-index', z_idx);
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
		});
	};
})(jQuery);
