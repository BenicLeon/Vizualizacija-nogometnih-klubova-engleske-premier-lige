var width = 1200;
var height = 580;
var margin = { top: 100, right: 20, bottom: 100, left: 60 };
var mapSvg = null;
var chartSvg = null;

var dropdown = d3.select("#navbar").append("select")
    .attr("id", "dropdown")
    .style("position", "absolute")
    .style("top", "10px")
    .style("left", "10px");

var options = ["Map", "Matches played", "Wins", "Losses", "Goals", "Goals conceded","Shots","Shots on target","Big chances created", "Clean sheets","Shooting accuracy", "Penalties scored","Hit woodwork","Pass accuracy", "Saves", "Own goals", "Fouls","Tackle success","Blocked shots","Errors leading to goal","Aerial Battles Duels Won", "Yellow cards", "Red cards", "Offsides"];

dropdown.selectAll("option")
    .data(options)
    .enter()
    .append("option")
    .text(function(d) { return d.replace(/_/g, ' '); })
    .attr("value", function(d) { return d.replace(/ /g, '_'); });

var projection = d3.geo.mercator()
    .center([-2, 53])
    .scale(3500)
    .translate([width / 2, height / 2]);

var path = d3.geo.path()
    .projection(projection);



function drawMap() {
    mapSvg = d3.select("#svg-container").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");
        

    d3.json("uk.json", function(regija) {
        d3.json("klubovi.json", function(klubovi) {
            mapSvg.selectAll("path")
                .data(topojson.feature(regija, regija.objects.eer).features)
                .enter().append("path")
                .attr("d", path)
                .style("fill", "#BDB76B")
                .style("stroke", "white")
                .style("stroke-width", 1);

            var images = mapSvg.selectAll("image")
                .data(klubovi.features)
                .enter().append("image")
                .attr("data:href", function(d) {
                    return "img/" + d.properties.team + ".png";
                })
                .attr("x", function(d) { return projection(d.geometry.coordinates)[0] - 10; })
                .attr("y", function(d) { return projection(d.geometry.coordinates)[1] - 10; })
                .attr("width", function(d) {
                    return (d.properties.team === "Liverpool" || d.properties.team === "Arsenal" || d.properties.team === "Manchester City") ? 50 : 32;
                })
                .attr("height", function(d) {
                    return (d.properties.team === "Liverpool" || d.properties.team === "Arsenal" || d.properties.team === "Manchester City") ? 50 : 32;
                })
                .on("mouseover", function(d) {
                    d3.select("#stadiumInfo")
                        .html(d.properties.team)
                        .style("left", (d3.event.pageX + 10) + "px")
                        .style("top", (d3.event.pageY + 10) + "px")
                        .style("opacity", 1)
                        .style("transform", "translateY(-10px)");
                })
                .style("cursor", "pointer")
                .on("click", function(d) {
                    var stadiumInfo = d.properties.team +"<br> Stadium: " + d.properties.name + "<br>Capacity: " + d.properties.capacity;
                    d3.select("#stadiumInfo")
                        .html(stadiumInfo)
                        .style("left", (d3.event.pageX + 10) + "px")
                        .style("top", (d3.event.pageY + 10) + "px")
                        .style("opacity", 1)
                        .style("transform", "translateY(-10px)");
                });

            
            d3.select("#svg-container").on("mouseout", function() {
                d3.select("#stadiumInfo")
                    .style("opacity", 0)
                    .style("transform", "translateY(0px)");
            });

            lazyLoadImages();
            var zoom = d3.zoom()
            .scaleExtent([1, 8])
            .on("zoom", function () {
                mapSvg.attr("transform", d3.event.transform);
            });

        mapSvg.call(zoom);
        });
    });
}


const lazyLoadImages = () => {
    const images = document.querySelectorAll('image[data-href]');
    const observerOptions = {
        root: null, // Use the viewport as the root
        rootMargin: '0px',
        threshold: 0.1 // Trigger when 10% of the image is in view
    };

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', img.getAttribute('data-href'));
                img.removeAttribute('data-href');
                observer.unobserve(img);
            }
        });
    }, observerOptions);

    images.forEach(img => {
        imageObserver.observe(img);
    });
};

function drawBarChart(stat) {
    d3.json("statistika.json", function(data) {
        d3.select("#barChart").selectAll("*").remove(); 

        var chartWidth = 1400;
        var chartHeight = 580;

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
            .attr("transform", "translate(0," + (chartHeight - margin.bottom) + ")")
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("fill", "black") 
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-25)");  

        chartSvg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + margin.left + ",0)")
            .call(yAxis);

        var bars = chartSvg.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function(d) { return x(d.Club); })
            .attr("y", chartHeight - margin.bottom)
            .attr("height", 0)
            .attr("width", x.rangeBand())
            .attr("fill", "blue");

        bars.transition()
            .duration(1000)
            .attr("y", function(d) { return y(d[stat]); })
            .attr("height", function(d) { return y(0) - y(d[stat]); });

        bars.on("mouseover", function(d) {
            var tooltip = d3.select("#svg-container").append("div")
                .attr("class", "tooltip")
                .style("left", (d3.event.pageX - 30) + "px")
                .style("top", (d3.event.pageY - 50) + "px")
                .style("opacity", 0);

            tooltip.transition()
                .style("opacity", .9);

            tooltip.html(stat.replace(/_/g, ' ') + ": " + d[stat]);
        })
        .on("mouseout", function() {
            d3.select(".tooltip").remove()
                .style("opacity", 0);
        });
    });
}

d3.select("#dropdown").on("change", function() {
    var value = d3.select(this).property("value");
    d3.select("#svg-container").selectAll("svg").remove(); 

    if (value === 'Map') {
        drawMap();
    } else {
        drawBarChart(value);
    }
});

drawMap();