//nic_mathma.js
/*global $, SVG*/

var numSquaresH = 61,
    numSquaresW = 61,
	squareWidth = 12;

$(document).ready(function () {
	
	// create svg drawing
	var draw = SVG('drawing').size(squareWidth * numSquaresW, squareWidth * numSquaresH);
    for (var h = 0; h < numSquaresH; h++) {
		for (var w = 0; w< numSquaresW; w++) {
			draw.rect(squareWidth-1, squareWidth-1).attr({ x:squareWidth*w, y:squareWidth*h, fill: '#CEF' , id:'r_w'+w+'h'+h+'_' ,class:'rects', "data-status":'false'});
		}
	}

    //sets initial status
    $('#r_w30h30_').attr("style", "fill:#000") //marks origin
    circle_pointsets = generate_circle_pointsets("r_w30h30_",L_matrix);
    
    //on-click function for squares
    $(".rects").on({
	  click: function() {
		if ($(this).attr("data-status") == "selected") {
			$(this).attr("data-status","none");
		} else {
            $("[data-status='selected']").attr("data-status","none");
			$(this).attr("data-status", "selected");
            var this_id = $( this ).attr("id");
            var K_dist = 0;
            for (r = 0; r < circle_pointsets.length; r++) {
                if (circle_pointsets[r].indexOf(this_id) > -1) {
                    K_dist = r;
                    break;
                } else if (r == max_radius) {
                    K_dist = ">" + max_radius;
                }
            }
            document.getElementById("select_dist").innerHTML = K_dist;
		}
      }});
    
    //on-hover function to display location and K-distance
    $(".rects").hover(
        function() {
            var this_id = $( this ).attr("id");
            var K_dist = 0;
            for (r = 0; r < circle_pointsets.length; r++) {
                if (circle_pointsets[r].indexOf(this_id) > -1) {
                    K_dist = r;
                    break;
                } else if (r == max_radius) {
                    K_dist = ">" + max_radius;
                }
            }
            document.getElementById("hover_dist").innerHTML = K_dist;
        }
    )
});

//initialises the first "circle"
var a = 1,
    b = 2;

var radius = 0;

document.getElementById("a").value = a
document.getElementById("b").value = b
document.getElementById("radius_value").value = radius

/* the L-matrix defines the knight's move. 
(i.e: the set of all possible vector translations of the 'knight' in one move) */
var L_matrix = generate_Lmatrix(a,b);
// for reference: [[1,2],[1,-2],[-1,2],[-1,-2],[2,1],[2,-1],[-2,1],[-2,-1]] is the default chess knight.


var max_radius = 20;

function generate_circle_pointsets (centre,M_matrix) {
    
    var circle_pointsets = [],
        past_pointset = [],
        active_circle = [centre];
    
    for (r = 0; r <= max_radius; r++) {
        
        past_pointset = past_pointset.concat(active_circle);
        circle_pointsets[r] = active_circle;
        if (r == max_radius) { break; };
    
        var new_circle = [];
        for (var i = 0; i < active_circle.length; i++) {
            var hpos = active_circle[i].indexOf("h"),
                endpos = active_circle[i].indexOf("_",hpos),
                w = active_circle[i].slice(3,hpos),
                h = active_circle[i].slice(hpos+1,endpos);
            for (var j = 0; j < M_matrix.length; j++) {
                var new_w = Number(w) + M_matrix[j][0],
                    new_h = Number(h) - M_matrix[j][1],
                    new_rect = "r_w" + new_w + "h" + new_h + "_";
                if (new_w > 61 || new_h > 61 || new_w < 0 || new_h < 0) {
                    new_rect += "x";
                }   
                if (past_pointset.indexOf(new_rect) == -1 && new_circle.indexOf(new_rect) == -1) {
                    new_circle.push(new_rect);
                }
            }
        }    
        active_circle = new_circle;
    }
    /*
    for (r = 0; r < circle_pointsets.length; r++) {
        for (p = 0; p <circle_pointsets[r].length; p++) {
            if (circle_pointsets[p][r].indexOf("x") > -1) {
                circle_pointsets[p].splice(r,1);
            }
        }
        if (circle_pointsets[p].length == 0) {
            circle_pointsets.splice(p,1);
        }
    }
    */
    //console.log(circle_pointsets);
    return circle_pointsets;
}

function update_grid (pointset) {
    clear_grid();
    if (pointset == "map") {
        for (r = 0; r < circle_pointsets.length; r++) {
            for (p = 0; p <circle_pointsets[r].length; p++) {
                var rgb_val = "rgb(0,0," + (255 * (1 - r/max_radius)).toString() + "," + (255 * (r/max_radius)).toString() + ")";
                $('#' + circle_pointsets[r][p]).attr("style", "fill:" + rgb_val);
            }
        }
    }
    for (p = 0; p < pointset.length; p++) {
        $('#' + pointset[p]).attr("class","active");
    }
}

function change_radius(a) {
    radius = Number(document.getElementById("radius_value").value)
    //updates html
    if (radius + a > max_radius) {
        console.warn("Maximum radius reached!");
        alert("Maximum radius reached!");
    } else if (radius + a < 0) {
        console.warn("Radius must be positive!");
        alert("Radius must be positive!");
    } else {
        radius = radius + a;
        document.getElementById("radius_value").value = radius;
    }
    if (radius < 10){
        $("#radius_value").attr("size","1");
        console.log("Setting input field size to 1");
    }
    else{
        $("#radius_value").attr("size","2");
        console.log("Setting input field size to 2");
    }
    
    //updates grid
    update_grid(circle_pointsets[radius]);
}

function generate_Lmatrix(p,q) {
    var new_Lmatrix = [];
    for (i = 1; i > -2; i = i - 2) {
        for (j = 1; j > -2; j = j - 2) {
            var new_moves = [[p * i, q * j],[q * i, p* j]];
            new_Lmatrix = new_Lmatrix.concat(new_moves);
        }
    }
    return new_Lmatrix;
}

function clear_grid() {
    $('#drawing svg rect')
        .removeAttr("style")
        .attr("class","rects");
}

function validate() {
    var data = document.getElementById("a").value + document.getElementById("b").value;
    function isNumeric(value) {
        return /^\d+$/.test(value);
    }
    if (isNumeric(data) == false) {
        document.getElementById("error_msg").innerHTML = "Error: Must be integer.";
    }
    else {
        document.getElementById("error_msg").innerHTML = "";
        a = Number(document.getElementById("a").value);
        b = Number(document.getElementById("b").value);
        L_matrix = generate_Lmatrix(a,b);
        circle_pointsets = generate_circle_pointsets("r_w30h30_",L_matrix);
    }
}
