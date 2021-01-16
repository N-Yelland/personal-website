/*global $, SVG*/

// gets html from src for each object in class 'ext'
$(".ext").each(function(index) {
    var url = $(this).attr("src");
    fetch(url).then(response => {return response.text();})
        .then(data => {
            $(this).html(data);
            $("#home-link").addClass("current");
        });
});

// gets background images for table 'menu-boxes'
$("#menu-boxes td").each(function(index) {
    var css_img_url = "url(images/"+$(this).text()+".jpg)";
    $(this).css("background-image", css_img_url);
});

// adds random quote from quotes.json to 'quote' div
$.getJSON("quotes.json", function (data) {
    var quote = data[Math.floor(Math.random() * data.length)];
    var quote_div = document.getElementById("quote");
    quote_div.innerHTML = "&ldquo;" + quote.quote + "&rdquo;"
    
    var source = document.createElement("p");
    source.innerHTML = "&mdash;" + quote.source;
    quote_div.appendChild(source);
    
});

// fun with the background - Conway's GoL

$(document).ready(function() {
	
    var w = window.innerWidth;
    var h = window.innerHeight;

    xnum = 100;
    refresh_rate = 100; //ms
    var initDensity = 0.33;
    
    
    var squareWidth = w / xnum;
    ynum = Math.ceil(h / squareWidth);
    
	// create svg drawing
	var draw = SVG("bg").size(w, h);
    for (var i = 0; i < xnum; i++) {
		for (var j = 0; j < ynum; j++) {
			draw.rect(squareWidth-1, squareWidth-1).attr({
                x: squareWidth*i,
                y: squareWidth*j,
                id: 'c-'+i+'-'+j,
                class: 'cells',
            });
		}
	}
    $(".cells").each(function (index) {
        if (Math.random() < initDensity) {
            $(this).attr("data-status","alive");
        } else {
            $(this).attr("data-status","dead");
        }
    });
    
    isMouseDown = false
    $('body').mousedown(function() {
        isMouseDown = true;
    })
    .mouseup(function() {
        isMouseDown = false;
    });
    
    
    $(".cells").mouseover(function() {
        if (isMouseDown) {
            toggle_life($(this));
        }
    });
    
    $(".cells").click(function() {
        toggle_life($(this));
    });
    
    window.anim = setInterval(update, refresh_rate)
    isPaused = false;
    
});

function toggle_life(cell){
    if (cell.attr("data-status") == "alive") {
        cell.attr("data-status", "dead");
    } else {
        cell.attr("data-status", "alive");
    }
}

function update() {
    $(".cells").each(function(index) {
        var coord = this.id.split("-").slice(1);
        
        // set of points which are nbrs if [0,0] is self
        var nbr_set = [[-1,-1], [-1,0], [-1,1], [0,-1], [0,1], [1,-1], [1,0], [1,1]];
        
        // counts number of alive neighbours
        var live_nbrs = 0;
        for (n of nbr_set) {
            var nbr = [parseInt(coord[0]) + n[0], parseInt(coord[1]) + n[1]];
            if (0 <= nbr[0] < xnum && 0 <= nbr[1] < 50) {
                var nbr_id = '#c-' + nbr.join("-");
                if ($(nbr_id).attr("data-status") == "alive") {
                    live_nbrs = live_nbrs + 1;
                }
            }
        }
        $(this).attr("data-nbrs",live_nbrs);
    });
    $(".cells").each(function(index) {
        var nbrs = parseInt($(this).attr("data-nbrs"));
        var status = $(this).attr("data-status");
        if (nbrs == 3 || (nbrs == 2 && status == "alive")) {
            $(this).attr("data-status","alive");
        } else {
            $(this).attr("data-status","dead");
        }
    });
}

function togglemain() {
    $("main").toggle();
    $("#gol-tools").toggle();
    if ($(".arrow").hasClass("flipped")) {
        $(".arrow").removeClass("flipped");
    } else {
        $(".arrow").addClass("flipped");
    }
}

function clear_bg() {
    $(".cells").each(function(index) {
        $(this).attr("data-status", "dead");
    });
}

$("#play-pause").click(function(){
    if (isPaused) {
        window.anim = setInterval(update, refresh_rate)
        isPaused = false;
        $(this).html("Pause");
    } else {
        clearInterval(window.anim);
        isPaused = true;
        $(this).html("Play");
    }
});