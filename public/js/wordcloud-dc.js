dc.simple = function(parent, chartGroup) {
    var SPAN_CLASS = 'wordcloud';
    var _chart = dc.colorMixin(dc.baseMixin({}));
    var _id = parent;

    _chart._doRender = function() {
        drawChart();
        return _chart;
    };

    _chart._doRedraw = function(){
        return _chart._doRender();
    };

    function drawChart() {
        var color = d3.scale.category20();
        width = _chart.width();
        height = _chart.height();
        var data = _chart.group().top(Infinity);
        if (data.length > 0) {

            var max = 0;
            for (var d = 0; d < data.length; d++) {
                if (max < data[d].value) {
                    max = data[d].value;
                }
            }
            for (var d = 0; d < data.length; d++) {
                data[d].size = data[d].value * 1.0 / max;
                data[d].size *= width / 10;
                data[d].size = Math.floor(data[d].size);
            }

            _g = d3.layout.cloud()
            .size([width, height])
            .words(data)
            .padding(5)
            .rotate(0)
            .fontSize(function(d) { return d.size; })
            .on("end", function (words) {
                d3.select(_id)
                .append("svg")
                .attr("width",  width)
                .attr("height", height)
                .append("g")
                .attr("transform", "translate(" + width / 2 + "," +
                    height / 2 + ")")
                .selectAll("text")
                .data(words)
                .enter()
                .append("text")
                .style("font-size", function(d) { return d.size+"px"; })
                .style("fill", function(d, i) {return color(i);})
                .attr("text-anchor", "middle")
                .attr("transform", function(d) {
                    return "translate(" + [d.x, d.y] + ")rotate(" +
                        d.rotate + ")";
                })
                .text(function(d) { return d.key; });
            })
            .start();
        }

    }

    return _chart.anchor(parent, chartGroup);
};
