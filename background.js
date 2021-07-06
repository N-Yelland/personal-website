// fun with the background - Conway's GoL

$(document).ready(function() {
	
    // only active for non-mobile devices!
    if (!detectMob()) {
        var w = window.innerWidth;
        var h = window.innerHeight;
        console.log(h)

        xnum = 100;
        refresh_rate = 500; //ms
        var initDensity = 0.25;


        var squareWidth = 0.02 * w;
        ynum = Math.ceil(h / squareWidth);

        // create svg drawing
        var draw = SVG("bg").size("100%", "100%");
        for (var i = 0; i < xnum; i++) {
            for (var j = 0; j < ynum; j++) {
                draw.rect("2vw", "2vw").attr({
                    x: 2*i + "vw",
                    y: 2*j + "vw",
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
            console.log($(this).offset())
        });

        window.anim = setInterval(update, refresh_rate)
        isPaused = false;
    
    }
    
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
        //var f = "#" + Math.max((200-(t+1)*5),128).toString(16).repeat(3);
        //$(this).css("fill", f);
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

function detectMob() {
    const toMatch = [
        /Android/i,
        /webOS/i,
        /iPhone/i,
        /iPad/i,
        /iPod/i,
        /BlackBerry/i,
        /Windows Phone/i
    ];

    return toMatch.some((toMatchItem) => {
        return navigator.userAgent.match(toMatchItem);
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