let width = 1200;
let height = 580;
let margin = { top: 100, right: 20, bottom: 100, left: 60 };
let mapSvg = null;
let chartSvg = null;

let dropdown = d3.select("#navbar")
    .append("select")
    .attr("id", "dropdown")
    .style("position", "absolute")
    .style("top", "10px")
    .style("left", "10px");

let options = [
    "Map", "Matches played", "Wins", "Losses", "Goals", "Goals conceded", 
    "Shots", "Shots on target", "Big chances created", "Clean sheets", 
    "Shooting accuracy", "Penalties scored", "Hit woodwork", "Pass accuracy", 
    "Saves", "Own goals", "Fouls", "Tackle success", "Blocked shots", 
    "Errors leading to goal", "Aerial Battles Duels Won", "Yellow cards", 
    "Red cards", "Offsides", "1993-2023"
];

dropdown.selectAll("option")
    .data(options)
    .enter()
    .append("option")
    .text(d => d.replace(/_/g, " "))
    .attr("value", d => d.replace(/ /g, "_"));

let projection = d3.geo.mercator()
    .center([-2, 53])
    .scale(3500)
    .translate([width / 2, height / 2]);

let path = d3.geo.path().projection(projection);

function drawMap() {
    mapSvg = d3.select("#svg-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");

    d3.json("uk.json", function (regija) {
        d3.json("klubovi.json", function (klubovi) {
            mapSvg.selectAll("path")
                .data(topojson.feature(regija, regija.objects.eer).features)
                .enter()
                .append("path")
                .attr("d", path)
                .style("fill", "#BDB76B")
                .style("stroke", "white")
                .style("stroke-width", 1);

            let images = mapSvg.selectAll("image")
                .data(klubovi.features)
                .enter()
                .append("image")
                .attr("data:href", d => "img/" + d.properties.team + "-min" + ".png")
                .attr("x", d => projection(d.geometry.coordinates)[0] - 10)
                .attr("y", d => projection(d.geometry.coordinates)[1] - 10)
                .attr("width", d => (d.properties.team === "Liverpool" || d.properties.team === "Arsenal" || d.properties.team === "Manchester City") ? 50 : 32)
                .attr("height", d => (d.properties.team === "Liverpool" || d.properties.team === "Arsenal" || d.properties.team === "Manchester City") ? 50 : 32)
                .on("mouseover", function (d) {
                    d3.select("#stadiumInfo")
                        .html(d.properties.team)
                        .style("left", d3.event.pageX + 10 + "px")
                        .style("top", d3.event.pageY + 10 + "px")
                        .style("opacity", 1)
                        .style("transform", "translateY(-10px)");
                })
                .style("cursor", "pointer")
                .on("click", function (d) {
                    let stadiumInfo = d.properties.team +
                        "<br> Stadium: " + d.properties.name +
                        "<br>Capacity: " + d.properties.capacity;
                    d3.select("#stadiumInfo")
                        .html(stadiumInfo)
                        .style("left", d3.event.pageX + 10 + "px")
                        .style("top", d3.event.pageY + 10 + "px")
                        .style("opacity", 1)
                        .style("transform", "translateY(-10px)");

                    
                });

            d3.select("#svg-container").on("mouseout", function () {
                d3.select("#stadiumInfo")
                    .style("opacity", 0)
                    .style("transform", "translateY(0px)");
            });

            lazyLoadImages();

            let zoom = d3.behavior.zoom()
                .scaleExtent([1, 8])
                .on("zoom", function () {
                    mapSvg.attr("transform", "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")");
                });

            mapSvg.call(zoom);
        });
    });
}

const lazyLoadImages = () => {
    const images = document.querySelectorAll("image[data-href]");
    const observerOptions = {
        root: null,
        rootMargin: "0px",
        threshold: 0.1,
    };

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.setAttributeNS("http://www.w3.org/1999/xlink", "href", img.getAttribute("data-href"));
                img.removeAttribute("data-href");
                observer.unobserve(img);
            }
        });
    }, observerOptions);

    images.forEach(img => imageObserver.observe(img));
};

function drawBarChart(stat, sort = false) {
    d3.json("statistika.json", function (data) {
        if (sort) {
            data.sort((a, b) => b[stat] - a[stat]);
        }

        d3.select("#barChart").selectAll("*").remove();

        let chartWidth = 1400;
        let chartHeight = 580;

        let x = d3.scale.ordinal()
            .domain(data.map(d => d.Club))
            .rangeRoundBands([margin.left, chartWidth - margin.right], 0.1);

        let y = d3.scale.linear()
            .domain([0, d3.max(data, d => d[stat])])
            .nice()
            .range([chartHeight - margin.bottom, margin.top]);

        let xAxis = d3.svg.axis().scale(x).orient("bottom");
        let yAxis = d3.svg.axis().scale(y).orient("left").ticks(10);

        let chartSvg = d3.select("#barChart")
            .append("svg")
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

        let bars = chartSvg.selectAll(".bar")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.Club))
            .attr("y", chartHeight - margin.bottom)
            .attr("height", 0)
            .attr("width", x.rangeBand())
            .attr("fill", "blue");

        bars.transition()
            .duration(1500)
            .attr("y", d => y(d[stat]))
            .attr("height", d => y(0) - y(d[stat]));

        bars.on("mouseover", function (d) {
            let tooltip = d3.select("#svg-container")
                .append("div")
                .attr("class", "tooltip")
                .style("left", d3.event.pageX - 30 + "px")
                .style("top", d3.event.pageY - 50 + "px")
                .style("opacity", 0);

            tooltip.transition().style("opacity", 0.9);
            tooltip.html(stat.replace(/_/g, " ") + ": " + d[stat]);
        })
        .on("mouseout", function () {
            d3.select(".tooltip").remove().style("opacity", 0);
        });
    });
}

function handleYearInput() {
d3.select("#yearInputContainer").style("display", "block");
d3.select("#svg-container").style("display", "none");

d3.select("#submitYear").on("click", function() {
d3.select("#svg-container2").style("display", "block");
var year = parseInt(d3.select("#yearInput").property("value"));

if (year >= 1993 && year <= 2023) {
d3.json("rankings.json", function(data) {
    var clubsForYear = data.filter(function(d) { return d.Season_End_Year === year; });
    clubsForYear.sort(function(a, b) { return b.Rk - a.Rk; });

    var bestClub = clubsForYear[clubsForYear.length - 1];
    var worstClub = clubsForYear[0];

    
    var colors = ["green", "yellow", "red"];

    
    var width = 600;
    var height = 400;
    var radius = Math.min(width, height) / 3;

    
    d3.select("#svg-container2").selectAll("*").remove();
    

    // Append SVG for best club pie chart
    var svgBest = d3.select("#svg-container2")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
    let bestClubTitle = bestClub.Rk + "." + " " + bestClub.Team;
    let worstClubTitle = worstClub.Rk + "."+ " " + worstClub.Team;

    svgBest.append("g")
        .attr("transform", "translate(" + (width / 4) + "," + (height / 2) + ")")
        .call(drawPieChart, [
            { value: bestClub.W, label: "Wins" },
            { value: bestClub.D, label: "Draws" },
            { value: bestClub.L, label: "Losses" }
        ], colors, bestClubTitle, radius);

    
    var svgWorst = d3.select("#svg-container2")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    svgWorst.append("g")
        .attr("transform", "translate(" + (width * 3 / 4) + "," + (height / 2) + ")")
        .call(drawPieChart, [
            { value: worstClub.W, label: "Wins" },
            { value: worstClub.D, label: "Draws" },
            { value: worstClub.L, label: "Losses" }
        ], colors, worstClubTitle, radius);

});
}
else{
d3.select("#svg-container2").style("display", "none");
handleYearInput();
alert("Enter a year between 1993-2023.");
}
});

}

function drawPieChart(selection, data, color, title, radius) {
var arc = d3.svg.arc()
.outerRadius(radius - 10)
.innerRadius(0);

var arcHover = d3.svg.arc()
.outerRadius(radius)
.innerRadius(0);

var pie = d3.layout.pie()
.sort(null)
.value(function(d) { return d.value; });

var g = selection.selectAll(".arc")
.data(pie(data))
.enter().append("g")
.attr("class", "arc");

g.append("path")
.attr("d", arc)
.style("fill", function(d, i) { return color[i]; })
.transition() 
.duration(3000)
.attrTween("d", function(d) {
    var interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
    return function(t) {
        return arc(interpolate(t));
    };
});

g.append("text")
.attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
.attr("dy", ".35em")
.style("text-anchor", "middle")
.style("font-size", "25px")
.style("font-weight","bold") 
.style("fill", "#000")
.text(function(d) { return ""; }) 

g.on("mouseover", function(d) {
d3.select(this).select("text")
    .text(function(d) { return d.data.value;
    
     }); 
})

g.select("path")
.on("mouseover", function(d) {
    d3.select(this)
        .transition()
        .duration(200)
        .attr("d", arcHover); 
})
.on("mouseout", function(d) {
    d3.select(this)
        .transition()
        .duration(200)
        .attr("d", arc); 
});

selection.append("text")
.attr("x", 0)
.attr("y", radius + 20)
.attr("text-anchor", "middle")
.text(title);
}





let currentStat = null;
let sorted = false;

d3.select("#dropdown").on("change", function () {
    let value = d3.select(this).property("value");
    d3.select("#svg-container").selectAll("svg").remove();

    if (value === "Map") {
        drawMap();
        d3.select("#sortButton").style("display", "none");
        d3.select("#submitYear").style("display", "none");
        d3.select("#yearInput").style("display", "none");
        d3.select("#svg-container2").style("display", "none");
        d3.select("#svg-container").style("display", "block");
        
    }
    else if(value === "1993-2023"){
        handleYearInput();
        d3.select("#sortButton").style("display", "none");
        d3.select("#submitYear").style("display", "inline-block");
        d3.select("#yearInput").style("display", "inline-block");
        d3.select("#svg-container2").style("display", "none");
        d3.select("#svg-container").style("display", "nonce");
        
    } 
    else {
        currentStat = value;
        sorted = false;
        drawBarChart(currentStat);
        d3.select("#sortButton").style("display", "inline-block");
        d3.select("#submitYear").style("display", "none");
        d3.select("#yearInput").style("display", "none");
        d3.select("#svg-container2").style("display", "none");
        d3.select("#svg-container").style("display", "block");
    }
});

d3.select("#sortButton").on("click", function () {
    if (currentStat) {
        sorted = !sorted;
        drawBarChart(currentStat, sorted);
    }
});

drawMap();
d3.select("#sortButton").style("display", "none");