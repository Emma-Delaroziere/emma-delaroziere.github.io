// append svg

width = 700;
height = 400;

map = d3.select("#map-container")
    .append("svg")
    .attr("id","map")
    .style("background", "white")
    .attr("width", `${width}`)
    .attr("height", `${height}`);


// fetching and parsing geographic data

async function get_json(file_name) {
    json = await d3.json(file_name)
	.then(function (d) {
	    return d;
	});
    console.log(json);
    return json;
}

var projection;
var path;

// draw background

get_json("ne_10m_ocean.geojson").then( oceans => {
    projection = d3.geoConicConformal().fitSize([width, height], oceans);
    path = d3.geoPath().projection(projection);

    map.selectAll("path")
	.data(oceans.features)
	.join("path")
	.attr("d", path)
	.style("fill", "blue");

    return map.node();
});



// fetching, parsing and filtering taxonomic data
async function get_clean_entries (file_name) {
    var clean_entries = await d3.csv(file_name)
	.then(function (d) {
	    d.forEach(row => {
		row.latitude = +row.latitude;
		row.longitude = +row.longitude;
	    });
	    
	    grouped_by_species = Object.fromEntries(
		d3.group(d, row => row.ScientificName));

	    //filter insufficient data
	    keys = [];
	    Object.keys(grouped_by_species).map(k => {
		if (grouped_by_species[k].length>=3000) {
		    keys.push(k);
		}
	    });

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

	    filtered_groups = {};
	    keys.map(k => {
		filtered_groups[k] = grouped_by_species[k];
	    });
	    return filtered_groups;
	});
    console.log("Filtered:", clean_entries);
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

function draw_dots(projected_coordinates){
    var dot_group = map.append("g").attr("id", "dot-group");
    dot_group.selectAll("circle")
	.data(projected_coordinates)
	.enter()
	.append("circle")
	.attr("r","20")
	.attr("cx", d => d[1])
	.attr("cy", d => d[0])
	.attr("fill", "green");
}

function draw_matrix (matrix, labels) {
    const square_side = 10;
    d3.select("#matrix-container")
	.attr("width", "1000")
	.attr("height", "1000");
    var svg = d3.select("#correlation-matrix");
    var square_group = svg.append("g").attr("id", "square-group");
    square_group.selectAll("rect")
	.data(species_matrix)
	.enter()
	.append("rect")
	.attr("x", (square, index) => {
	    return (index%labels.length)*(square_side+2);
	})
	.attr("y", (square, index) => {
	    return Math.trunc(index/labels.length)*(square_side+2);
	})
	.attr("width", square_side)
	.attr("height", square_side)
	.attr("fill", "blue");
}


var species_list;
var current_species = "";
var species_matrix = [];
var year1 = 2000;
var year2 = 2000;



const coral_data = get_clean_entries("deep_sea_corals.csv").then(d => {
    species_list = Object.keys(d);

    // preparing data for matrix
    species_list.forEach(species1 => {
	var species_square = {}
	species_square.species_1 = species1;
	species_list.forEach(species2 => {
	    //TODO : function to calculate cooexistence between species
	    species_square.species_2 = species2;
	    species_square.value = Math.random();
	    species_matrix.push(species_square);
	});
    });
    console.log(species_matrix);
    draw_matrix(species_matrix, species_list);

    // appending available species for dropdown
    d3.select("#species-select")
	.selectAll("option")
	.data(species_list)
	.join("option")
	.attr("value", d => d)
	.text(d => d);

    // event listener for dropdown menu
    d3.select("#species-select").on("change", function () {
	current_species = this.options[this.selectedIndex].value;
	console.log("Current species:",current_species);
	draw_dots(get_projection(d, "Alcyonacea", "2005"));
    });

    //event listeners for date selectors

    d3.select("#date-1")
	.on("change", function () {
	    year1 = this.value;
	    console.log("Year 1:", year1);
	});

    d3.select("#date-2")
	.on("change", function () {
	    year2 = this.value;
	    console.log("Year 2:", year2);
	});
    
    return d
});


function updateAll () {
}
