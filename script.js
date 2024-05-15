
        var width = 1200;
        var height = 800;  // Adjust height to fit on one screen
        var margin = { top: 20, right: 20, bottom: 100, left: 60 };
        var mapSvg = null;
        var chartSvg = null;

        function drawMap() {
            d3.json("uk.json").then(function(regija) {
                var projection = d3.geo.mercator()
                    .center([-2, 54])
                    .scale(3000)  // Adjust scale to fit the map better
                    .translate([width / 2, height / 2]);

                var path = d3.geo.path()
                    .projection(projection);

                mapSvg = d3.select("body").append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .style("background", "black");

                var g = mapSvg.append("g");

                d3.json("klubovi.json").then(function(klubovi) {
                    var circles = g.selectAll("circle")
                        .data(klubovi.features)
                        .enter().append("circle")
                        .attr("cx", function(d) { return projection(d.geometry.coordinates)[0]; })
                        .attr("cy", function(d) { return projection(d.geometry.coordinates)[1]; })
                        .attr("r", 4)  // Smaller circles
                        .style("fill", "red")
                        .style("stroke", "black")
                        .style("stroke-width", 1)
                        .on("mouseover", function(event, d) {
                            var clubName = d.properties.team;
                            d3.select("#clubName")
                                .html(clubName)
                                .style("left", (event.pageX + 10) + "px")
                                .style("top", (event.pageY - 20) + "px")
                                .style("opacity", 1);
                        })
                        .on("mouseout", function() {
                            d3.select("#clubName")
                                .style("opacity", 0);
                        });

                    g.selectAll("path")
                        .data(topojson.feature(regija, regija.objects.eer).features)
                        .enter().append("path")
                        .attr("d", path)
                        .style("fill", "none")
                        .style("stroke", "white")
                        .style("stroke-width", 1);
                });
            });
        }

        function drawBarChart(stat) {
            d3.json("statistika.json").then(function(data) {
                d3.select("#barChart").selectAll("*").remove(); // Clear previous chart

                var chartWidth = 1000;
                var chartHeight = 600;

                var x = d3.scale.ordinal()
                    .domain(data.map(function(d) { return d.Club; }))
                    .rangeRoundBands([margin.left, chartWidth - margin.right], 0.1);

                var y = d3.scale.linear()
                    .domain([0, d3.max(data, function(d) { return d[stat]; })])
                    .nice()
                    .range([chartHeight - margin.bottom, margin.top]);

                var xAxis = d3.svg.axis()
                    .scale(x)
                    .orient("bottom");

                var yAxis = d3.svg.axis()
                    .scale(y)
                    .orient("left")
                    .ticks(10);

                chartSvg = d3.select("#barChart").append("svg")
                    .attr("width", chartWidth)
                    .attr("height", chartHeight);

                chartSvg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", `translate(0,${chartHeight - margin.bottom})`)
                    .call(xAxis)
                    .selectAll("text")
                    .style("text-anchor", "end")
                    .attr("dx", "-.8em")
                    .attr("dy", ".15em")
                    .attr("transform", "rotate(-65)");  // Rotate x-axis labels

                chartSvg.append("g")
                    .attr("class", "y axis")
                    .attr("transform", `translate(${margin.left},0)`)
                    .call(yAxis);

                var bars = chartSvg.selectAll(".bar")
                    .data(data)
                    .enter().append("rect")
                    .attr("class", "bar")
                    .attr("x", function(d) { return x(d.Club); })
                    .attr("y", chartHeight - margin.bottom)
                    .attr("height", 0)
                    .attr("width", x.rangeBand());

                bars.transition()
                    .duration(1000)
                    .attr("y", function(d) { return y(d[stat]); })
                    .attr("height", function(d) { return y(0) - y(d[stat]); });

                bars.on("mouseover", function(event, d) {
                    var tooltip = d3.select("body").append("div")
                        .attr("class", "tooltip")
                        .style("left", (event.pageX - 30) + "px")
                        .style("top", (event.pageY - 50) + "px")
                        .style("opacity", 0);

                    tooltip.transition()
                        .duration(200)
                        .style("opacity", .9);

                    tooltip.html(stat + ": " + d[stat]);
                })
                .on("mouseout", function() {
                    d3.select(".tooltip").remove();
                });
            });
        }

        document.getElementById('dropdown').addEventListener('change', function(event) {
            var value = event.target.value;
            d3.select("body").selectAll("svg").remove(); // Clear map and bar chart

            if (value === 'map') {
                drawMap();
            } else {
                drawBarChart(value);
            }
        });

        // Initial load
        drawMap();