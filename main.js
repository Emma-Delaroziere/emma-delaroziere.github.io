// append svg

width = 1200;
height = 900;



const map = d3.select("#map-container")
    .append("svg")
    .attr("id","map")
    .style("background", "white")
    .attr("width", `${width}`)
    .attr("height", `${height}`);


const defs = d3.select("#adjacency-matrix").append("defs");

// fetching and parsing geographic data

async function get_json(file_name) {
    json = await d3.json(file_name)
	.then(function (d) {
	    return d;
	});
    console.log(file_name+" fetched: ", json);
    return json;
}

var projection;
var path;

// draw background

get_json("data/ne_110m_ocean.geojson").then( oceans => {
    projection = d3.geoMercator().fitSize([width, height], oceans);
    path = d3.geoPath().projection(projection);

    map.selectAll("path")
	.data(oceans.features)
	.join("path")
	.attr("d", path)
	.style("fill", "#62a0ea");

    //separate layers for simple date and comparison display

    var g_simple = map.append("g").attr("id", "simple").attr("class", "dot-group");
    var g_compare = map.append("g")
	.attr("id", "compare")
	.attr("class", "dot-group")
	.style("opacity", "0");

    return map.node();
});



// fetching, parsing and filtering taxonomic data
async function get_clean_entries (file_name) {
    var clean_entries = await d3.csv("data/"+file_name)
	.then(function (d) {
	    d.forEach(row => {
		row.latitude = +row.latitude;
		row.longitude = +row.longitude;
	    });
	    
	    grouped_by_species = Object.fromEntries(
		d3.group(d, row => row.ScientificName));
	    
	    keys =  Object.keys(grouped_by_species);
	    
	//sort by year
	for (const species in grouped_by_species) {
	    grouped_by_year = Object.fromEntries(d3.group(
		grouped_by_species[species],
		entry => {
		    return entry.ObservationDate.slice(0,4);
		}));
	    grouped_by_year.total = grouped_by_species[species].length;
	    grouped_by_species[species] = grouped_by_year;
	}

	    return grouped_by_species;
	});
    console.log("Entries: ", clean_entries);
    return clean_entries;
}

// display interactive data


function get_coordinates(file, species, year) {
    var coordinates_list = file[species][year].map(row => {
	return [row.longitude, row.latitude];
    });
    console.log("Coordinates:", coordinates_list);
    return coordinates_list;
}

function get_projection(file, species, year) {
    var projection_list = get_coordinates(file, species, year)
	.map(c => projection(c));
    console.log("Projected dots:", projection_list);
    return projection_list;
}

function draw_dots(projected_coordinates, dot_group){
    dot_group.selectAll("circle")
	.data(projected_coordinates)
	.join("circle")
	.attr("r","5")
	.attr("cx", d => d[1])
	.attr("cy", d => d[0])
	.attr("fill", (dot_group.attr('id') == "simple") ? "#57e389" : "#ed333b");
    console.log("Dots updated:", year1);
}

function draw_matrix (matrix, labels) {
    const margin =  {"top": 150, "left": 150};
    const square_side = 10;
    const font_size = "12px";
    const spacing = 3;
    const extent = d3.extent(matrix, square => square.value);
    
    var color = d3.scaleLinear()
	.domain(extent)
	.range(["white", "black"]);
    
    var svg = d3.select("#adjacency-matrix");
	//.attr("height", "1000")
	//.attr("width", "1000");
    var square_group = svg.append("g").attr("id", "square-group");
    
    square_group.selectAll("rect")
	.data(species_matrix)
	.enter()
	.append("rect")
	.attr("y", (square) => {
	    //console.log("y:",labels.indexOf(square.species_2)*(square_side+1));
	    return labels.indexOf(square.species_2)*(square_side+spacing) + margin.top;
	})
	.attr("x", (square) => {
	    //console.log("x:", labels.indexOf(square.species_1)*(square_side+1));
	    return labels.indexOf(square.species_1)*(square_side+spacing) + margin.left;
	})
	.attr("width", square_side)
	.attr("height", square_side)
	.attr("fill", square => color(square.value));
    console.log("Matrix drawn");

    // text for columns and rows

    var column = svg.append("g")
	.attr("id", "column-names")
	.selectAll("text")
	.data(species_list)
	.enter()
	.append("text")
	.text(s => s)
    	.style("font-size", font_size)
	.style("text-anchor", "start")
	.attr("transform", s => {
	    return `translate(${labels.indexOf(s)*(square_side+spacing) + margin.left + square_side}, ${margin.top - spacing}) rotate(-90)`;
	});
     var row = svg.append("g")
	.attr("id", "row-names")
	.selectAll("text")
	.data(species_list)
	.enter()
	.append("text")
	.text(s => s)
    	.style("font-size", font_size)
	.style("text-anchor", "end")
	.attr("transform", s => {
	    return `translate( ${margin.left - spacing}, ${labels.indexOf(s)*(square_side+spacing) + margin.top + square_side})`;
	});

    // scale display

    const gradient_width = 300;
    const gradient_height = 25;

    var gradient = defs.append("linearGradient")
	.attr("id", "scale-gradient");

    var stops = [{"offset":"0%", "stop-color":"white"}, {"offset":"100%", "stop-color":"black"}];
    gradient.selectAll("stop")
	.data(stops)
	.enter()
	.append("stop")
	.attr("offset", c => c["offset"])
	.attr("stop-color", c => c["stop-color"]);
    
    var scale = svg.append("g")
	.attr("id", "color-scale");

    scale.append("rect")
	.attr("width", gradient_width)
	.attr("height", gradient_height)
	.attr("stroke", "black")
	.attr("fill","url(#scale-gradient)");

    var xscale = d3.scaleLinear()
	 .domain(extent)
	.range([0, gradient_width]);

    var x_axis = d3.axisBottom().scale(xscale).ticks(5);
    scale.append("g").call(x_axis).attr("transform", `translate(0, ${gradient_height})`);

    scale.attr("transform",
	       `translate(${margin.left}, ${10 + margin.top + species_list.length*(square_side+spacing)})`);
}


var species_list;
var current_species = "";
var species_matrix = [];
var mode = "simple"; // mode d'affichage : 1 date ou 2 dates

var archived_years = []
var year1 = 2000;
var year2 = 2000;



const coral_data = get_clean_entries("deep_sea_corals(filtered).csv").then(d => {
    species_list = Object.keys(d);

    // appending available species for dropdown
    d3.select("#species-select")
	.selectAll("option")
	.data(species_list)
	.join("option")
	.attr("value", s => s)
	.text(s => s);

    // event listener for dropdown menu
    d3.select("#species-select").on("change", function () {
	// change selected species
	current_species = this.options[this.selectedIndex].value;
	console.log("Current species:", current_species);

	//update available dates for selection
	archived_years = Object.keys(d[current_species]);
	d3.select("#years-1")
	    .selectAll("option")
	    .data(archived_years)
	    .join("option")
	    .attr("value", y => y);
    });

    //event listener for display mode change
    d3.selectAll("input[name='mode']")
	.on("change", function () {
	    mode = this.value;
	    d3.selectAll(".dot-group").style("opacity", "0");
	    d3.select(`#${this.value}`).style("opacity","1");
	    console.log("Mode: ", this.value);
	});
    

    //event listeners for date selectors

    d3.select("#date-1")
	.on("change", function () {
	    if (archived_years.includes(this.value)) {	
		year1 = this.value;
		console.log("Year 1:", year1);
		draw_dots(get_projection(d, current_species, this.value),
			  d3.select("#simple"));
		draw_dots(get_projection(d, current_species, this.value),
			  d3.select("#compare"));
		d3.select(`#${mode}`).style("opacity", "1");
	    } else {
		d3.selectAll(".dot-group").style("opacity", "0");
	    }
	});

    d3.select("#date-2")
	.on("change", function () {
	    year2 = this.value;
	    console.log("Year 2:", year2);
	});
    
    return d
});

const adjacency_data = get_json("/data/adjacency.json").then( matrix => {
    species_list = Object.keys(matrix);

    species_list.forEach(species1 => {

	species_list.forEach(species2 => {
	    var species_square = {};
	    species_square.species_1 = species1;
	    species_square.species_2 = species2;
	    species_square.value = matrix[species1][species2];
	    species_matrix.push(species_square);
	});
    });
    //console.log("Species matrix:", species_matrix);
    draw_matrix(species_matrix, species_list);
});
