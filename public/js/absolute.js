var _grid_size = 8;
var _chart_padding = 16;

function chartSettings(k) {
	$('#chart-settings').prop('data-chart-id', k);
	$('#chart-settings [name=id]'       ).val(k);
	$('#chart-settings [name=name]'     ).val(charts[k].name);
	$('#chart-settings [name=type]'     ).val(charts[k].type);
	$('#chart-settings [name=dimension]').val(charts[k].dimension);
	$('#chart-settings [name=group]'    ).val(charts[k].group);
	var modal = $.UIkit.modal("#chart-settings");
	modal.show();
}

function chartSave() {
	var id               = $('#chart-settings [name=id]'       ).val();
	charts[id].name      = $('#chart-settings [name=name]'     ).val();
	charts[id].type      = $('#chart-settings [name=type]'     ).val();
	charts[id].dimension = $('#chart-settings [name=dimension]').val();
	charts[id].group     = $('#chart-settings [name=group]'    ).val();
	$('#chart' + id + ' .title').text(charts[id].name);
	var modal = $.UIkit.modal("#chart-settings");
	modal.hide();
}

function chartMinimize(k) {
	$('#chart' + k).outerWidth('240px');
	$('#chart' + k).outerHeight('120px');
}

function chartDelete(k) {
	charts[k].deleted = true;
	$('#chart' + k).fadeOut();
}

function closeSettings() {
	var modal = $.UIkit.modal("#settings");
	modal.hide();
}

function saveSettings() {
	var checked = $('#settings [name=public]').is(':checked');
	var data = {
		dashboard: dashboard,
		name: $('#settings [name=name]').val(),
		public: checked ? 1 : 0
	};
	$.post('/dashboard-save', data, function(result) {
		closeSettings();
	});
}

function createChart(data) {
   	if (data.id == null) {
		data.id = 0;
		data.name = 'New Chart';
		data.type = 'pie';
		data.dimension = '';
		data.group = '';
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

function saveLayout() {
	var count = 0;
	for (var i = 0; i < charts.length; i++) {
		if (charts[i].deleted) {
			var data = { id: charts[i].id, dashboard: dashboard };
			$.post('/chart-delete', data, function(result) {
				// console.log(result);
				count++;
				if (count === charts.length) {
					location.reload();
				}
			});
		}
		else {
			var chart = $('#chart' + i);
			var x = chart.position().left;
			var y = chart.position().top;
			var w = chart.outerWidth();
			var h = chart.outerHeight();

			var data = {
				dashboard: dashboard,
				id:        charts[i].id, 
				name:      charts[i].name,
				type:      charts[i].type,
				dimension: charts[i].dimension,
				group:     charts[i].group,
				x:x, y:y, width:w, height:h};
			$.post('/chart-save', data, function(result) {
				// console.log(result);
				count++;
				if (count === charts.length) {
					location.reload();
				}
			});
		}
	}
}

$('body').on('mouseup', function() {
	/*
	$('.resizable').css('cursor', 'default');
	$('.resizable').removeClass('resizable');
	*/
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

