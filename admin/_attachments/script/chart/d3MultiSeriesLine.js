var d3 = require('d3');

module.exports = {
   draw: function(options) {
      var element = d3.select(options.selector);
      var margin = {
         top: 20,
         right: 55,
         bottom: 30,
         left: 40
      };
      var width = element[0][0].clientWidth - margin.left - margin.right;
      var height = element[0][0].clientHeight - margin.top - margin.bottom;

      var x = d3.time.scale()
         .range([0, width]);
      var y = d3.scale.linear()
         .range([height, 0]);

      var xAxis;

      if (options.intervalX) {
         xAxis = d3.svg.axis()
            .scale(x)
            .ticks(options.intervalX, options.stepX)
            .orient("bottom");
      } else {
         xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");
      }

      var yAxis = d3.svg.axis()
         .scale(y)
         .orient("left");

      var line = d3.svg.line()
         .interpolate("linear")
         .x(function(d) {
            return x(d.x);
         })
         .y(function(d) {
            return y(d.y);
         });

      var color = d3.scale.category20();
      color.domain(options.title);

      var seriesData = [];

      var seriesMap = options.title.map(function(name, index) {
         return {
            name: name,
            value: options.series[index].map(function(d) {
               d.name = name;
               return d;
            })
         };
      });

      seriesData = seriesData.concat(seriesMap);
      var flatSeriesData = Array.prototype.concat.apply([], options.series);

      x.domain(d3.extent(flatSeriesData, function(d) {
         return d.x;
      }));

      if (typeof options.minY === 'undefined') {
         y.domain(d3.extent(flatSeriesData, function(d) {
            return d.y;
         }));
      } else {
         y.domain([options.minY, d3.max(flatSeriesData, function(d) {
            return d.y;
         })]);
      }

      var svg = element.append("svg")
         .attr("width", "100%")
         .attr("height", "100%")
         .attr('viewBox', '0 0 ' + (width + margin.left + margin.right) + ' ' + (height + margin.top + margin.bottom))
         .attr('preserveAspectRatio', 'xMinYMin')
         .append("g")
         .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      svg.append("g")
         .attr("class", "x axis")
         .attr("transform", "translate(0," + height + ")")
         .call(xAxis);

      svg.append("g")
         .attr("class", "y axis")
         .call(yAxis)
         .append("text")
         .attr("transform", "rotate(-90)")
         .attr("y", 6)
         .attr("dy", ".71em")
         .style("text-anchor", "end");

      var series = svg.selectAll(".series")
         .data(seriesData)
         .enter().append("g")
         .attr("class", "series");

      series.append("path")
         .attr("class", "line")
         .attr("d", function(d) {
            // ensure series is in correct order
            // before building svg line
            return line(d.value.sort(function(a, b) {
               return d3.ascending(a.x, b.x);
            }));
         })
         .style("stroke", function(d) {
            return color(d.name);
         })
         .style("fill", "none");

      var legend = svg.selectAll(".legend")
         .data(options.title.slice().reverse())
         .enter().append("g")
         .attr("class", "legend")
         .attr("transform", function(d, i) {
            return "translate(" + margin.right + "," + i * 20 + ")";
         });

      legend.append("rect")
         .attr("x", width - 10)
         .attr("width", 10)
         .attr("height", 10)
         .style("fill", color)
         .style("stroke", "grey");

      legend.append("text")
         .attr("x", width - 17)
         .attr("y", 6)
         .attr("dy", ".35em")
         .style("text-anchor", "end")
         .text(function(d) {
            return d;
         });
   }
};
