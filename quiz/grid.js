/* The Quiz Grid */

$(document).ready(function () {
    if (window.location.pathname .includes("grid.html")) {
        if (readCookie("is_final") == "true") {
            start_final();
        } else {
            console.log("Getting quiz data...")
            get_quiz(quiz_file);
        }
    }
});

var R = 5, C = 5; // # of rows and columns in grid
var VM = 12, HM = 15; //margin in vw/vh
var S = 4; //separaion in vw/vh

var question_limit = 50;

var inc = 5; dec = 5

var whoosh = new Audio("media/sfx/whoosh_sfx.wav");
var countdown = new Audio("media/sfx/30 sec countdown.wav");
var sleighbell = new Audio("media/sfx/sleighbell.wav");
countdown.volume = 0.1;

// build quiz json object from .xlsx file
async function get_xlsx_file(url) {
    var response = await fetch(url);
    var data = await response.blob();
    return new File([data], url, {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
}

async function xlsx_to_json(file) {
    var reader = new FileReader();

    reader.onload = function(e) {
        var data = e.target.result;
        var ss = XLSX.read(data, {
            type: 'binary'
        });
        var output = {}
        ss.SheetNames.forEach(function(sheetName) {
            var sheet = XLS.utils.sheet_to_row_object_array(ss.Sheets[sheetName]);
            output[sheetName] = JSON.stringify(sheet);
        });
        start_quiz(output);
    }
    reader.onerror = function(ex) {
        // error has occured, log exception
        console.log(ex)
    }

    reader.readAsBinaryString(file);
}

async function get_quiz(url) {
    var f = await get_xlsx_file(url);
    xlsx_to_json(f);
}

async function start_quiz(quiz, renew=false) {
    window.quiz = quiz;
    var all_questions = JSON.parse(quiz.standardQuestions);

    // attach index to data of each question
    all_questions.forEach((q, i) => {
        q.index = i;
    });
    var n = all_questions.length;

    // have the indices for this grid already been created?
    if (readCookie("indices") && !renew) {

        var indices = JSON.parse(readCookie("indices"));
        var grid_questions = indices.map(i => {
            return all_questions.find(q => q.index == i);
        });

    } else {

        // remove questions that have already been asked
        if (readCookie("seen_indices")) {
            console.log("removing seen questions...")
            var seen = JSON.parse(readCookie("seen_indices"));
            var new_questions = all_questions.filter(function(q) {
                return !seen.includes(q.index);
            });

        } else {
            console.log("New Grid!")
            var new_questions = all_questions;
            createCookie("seen_indices", JSON.stringify([]), 7);
        }

        // shuffle remaining questions
        let shuffled_questions = new_questions
            .map(q => ({ q, sort: Math.random() }))
            .sort((a,b) => a.sort - b.sort)
            .map(({ q }) => q);
        console.log(shuffled_questions)

        // select enough to fill the grid and store their indices
        var grid_questions = shuffled_questions.slice(0,R*C);
        var indices = grid_questions.map(q => q.index);
        console.log(indices);
        createCookie("indices", JSON.stringify(indices), 7);
    }

    if (readCookie("grid") && !renew) {
        grid_stats = JSON.parse(readCookie("grid"));
    } else {
        grid_stats = Array(R*C).fill("none")
    }

    if (renew) {
        $(".q:not(#template)").remove();
    }

    for (var r = 0; r < R; r++) {
        for (var c = 0;  c < C; c++) {

            q =  grid_questions[r*R + c];
            var new_q = build_question(q);

            new_q.attr("id", "q" + (r*C + c));
            new_q.attr("data-index", q.index);

            new_q.css({
                top:  VM + r*(100-2*VM)/(R-1) + "vh",
                left: HM + c*(100-2*HM)/(C-1) + "vw",

                height: 100/R - S + "vh",
                width: 100/C - S + "vw"
            });
            
            if (grid_stats[r*R+c] == "dull") {
                new_q.addClass("dull");
                new_q.css("filter", "brightness(0.5)");
            };
            if (grid_stats[r*R+c] == "closed") {
                new_q.addClass("closed");
                new_q.css("filter", "brightness(0.5)");
            }

            if (renew) {
                new_q.css("filter", "none");
            }

            $("body").append(new_q);
            new_q.css({opacity: 0});
        }
    }

    // staggered fade-in
    $(".q:not(#template)").each(function (index) {
        $(this)
            .delay(100 + 100*index)
            .animate({opacity: 100}, 100)
    })
    var seen = JSON.parse(readCookie("seen_indices"));
    var percentage = seen.length/question_limit * 100;
    $("#counter-fill").css({height: percentage + "%"});
    $("#counter-num").html(seen.length);
}

// generic template for question box
$("#template.q").click(function (e) {
    if ($(e.target).hasClass("q-front")) {
        $("#screen").delay(800).fadeIn();
        $(this).addClass("open");
        flip_sfx(this.id); //FIXABLE?

        // staggered fade-in animation
        $(this).find(".q-back > div").each(function (index) {
            $(this)
                .css({opacity: 0})
                .delay(1200 + 400*index)
                .animate({opacity: 100}, 400);
        });
    }
})

// Button functionality
$(".q .close").click(function () {
    var qid = $(this).closest(".q").attr("id");
    $(`#${qid} .q-back > div`).animate({opacity: 0, "z-index":2}, {
        duration: 600,
        complete: function () {
            flip_sfx(qid);

            $(`#${qid}`).removeClass("open");
            $(`#${qid}`).css({"z-index": 2});
            $("#screen").delay(100).fadeOut(800, function () {
                $(`#${qid}`).addClass("closed");
                $(`#${qid}`).css({"z-index": 0});               
            });
            setTimeout(function() {
                show_scoreboard();
            }, 800);
        },
    });
    setTimeout(function () {update_questions(qid);}, 1000);
});

$(".player .close").click(function () {
    $(this).closest(".player").remove();
    update_players_cookie();
});

$(".player .shuffle").click(function () {
    hide_scoreboard();
    renew_grid();
    $(this)
        .html("sync_disabled")
        .off("click")
        .css({"pointer-events": "none"});
})

$(".hint-btn").click(function () {
    var hint = $(this).children(".hint")
    var btn = $(this);
    $(this).children(".label").fadeOut(function() {
        hint.fadeIn();
        btn.addClass("pressed")
    });
});

$(".answer-btn").click(function () {
    var answer = $(this).children(".answer")
    var btn = $(this);
    $(this).children(".label").fadeOut(function() {
        answer.fadeIn();
        btn.addClass("pressed")
    });
});

function build_question(q) {
    var new_q = $("#template").clone(true);
    new_q.attr("id", "");

    new_q.find(".q-front, .title").html(q.title);
    var content = new_q.find(".content");
    var media_obj = new_q.find(".media");
    content.html(q.question);

    new_q.find(".hint").html(q.hint)
    new_q.find(".answer").html(q.answer)

    if (!q.hint) {
        new_q.find(".hint-btn").remove();
    }

    if (q.xmas == "yes") {
        new_q.addClass("xmas")
    }

    // media handling
    if (!q.media) {
        media_obj.remove();
    } else {
        var ext = q.media.split(".").pop(); // gets file extension
        if (ext == "wav") {
            media_obj.find("img").remove();
            media_obj.find("source").attr({
                type: "audio/" + ext,
                src: "media/" + q.media,
            });
        } else if (ext == "png" || ext == "jpg" || ext == "gif") {

            // resize text
            content.css({
                "margin-bottom": "0em",
                "font-size": "1em",
            });

            media_obj.find("audio").remove();
            var img = media_obj.find("img")
            img.attr({
                src: "media/" + q.media,
            });
            img.click(function () {
                enlarge($(this));
            });

        } else {
            media_obj.html(`Error loading media: ${q.media} not found`);
        } 
    }
    return new_q;
}

//variant sfx for xmas questions
function flip_sfx(qid) {
    if ($(`#${qid}`).hasClass("xmas")) {
        sleighbell.play();
    } else {
        whoosh.play();
    }
}

function update_questions (qid) {

    // start updating visuals
    $(".q:not(.closed)").addClass("dull")
    $(".q:not(.closed)").css("filter", "brightness(0.4)");

    // select orthongally adjacent tiles
    var id_num = parseInt(qid.replace("q",""));
    var r = Math.floor(id_num / R), c = id_num % C;
    var ids = [];
    if (c-1 >= 0) {ids.push(C*r + c - 1);}
    if (c+1 < C) {ids.push(C*r + c + 1);}
    if (r-1 >= 0) {ids.push(C*(r-1) + c);}
    if (r+1 < R) {ids.push(C*(r+1) + c)};

    // detect if the tiles need refilling
    var refill_needed = (ids.length > 0) && ids.every(function (id) {
        return $(`#q${id}`).hasClass("closed");
    });

    // renew seen indices cookie
    var index = parseInt($(`#${qid}`).attr("data-index"));
    var seen = JSON.parse(readCookie("seen_indices"))
    if (!seen.includes(index)) {
        seen.push(index);
        createCookie("seen_indices", JSON.stringify(seen), 7);
        console.log(readCookie("seen_indices"));
    }

    // update progress bar visuals
    var percentage = seen.length/question_limit * 100;
    $("#counter-fill").css({height: percentage + "%"});
    $("#counter-num").html(seen.length);

    // check to see if the final starts, or the board needs shuffling
    if (seen.length == question_limit) {
        setTimeout(function() {
            start_final();
        }, 1000)
    }else if (!refill_needed) {
        ids.forEach(function (id) {
            setTimeout(function () {
                $(`#q${id}`).removeClass("dull");
                $(`#q${id}:not(.closed)`).css("filter", "brightness(1)");
                update_grid_cookie();
            }, 600);
        });
    } else {
        console.log("Refill Needed!");
        renew_grid();
    }
}

async function renew_grid() {
    $(".q:not(#template)").each( function () {
        var qid = $(this).closest(".q").attr("id");
        var id = parseInt(qid.substring(1));
        $(this).delay(100+50*id)
            .animate({opacity: 0}, 75);
    });
    setTimeout(async function() {
        $(".q").removeClass("dull", "closed");
        await eraseCookie("grid");
        await eraseCookie("indices");
        start_quiz(window.quiz, renew=true);
    }, 500 + R*C*50)
   
}

// open scoreboard on load
$(document).ready(function () {
    $("#scoreboard").css({bottom:"-50%"}, 500);
    //show_scoreboard()
});

// Scoreboard
var scoreboard_open = false;
// keyboard shortcut handling
$(document).on("keydown", function (e) {
    var typing = $(":focus").hasClass("player-name");

    // s to open scoreboard
    // console.log(e.key);
    if (e.key.toLowerCase() == "s" && !typing) {
        if (!scoreboard_open) {
            show_scoreboard();
        } else {
            hide_scoreboard();
        }
    }

    // if typing, save player names
    if (typing) {
        update_players_cookie();
    }
});

$("#top-screen").click(function () {
    hide_scoreboard();
    update_players_cookie();
});

function hide_scoreboard() {
    $("#top-screen").fadeOut();
    $("#scoreboard").animate({bottom:"-50%"}, 500);
    scoreboard_open = false;
    
}
function show_scoreboard() {
    $("#scoreboard").css({visibility: "visible"})
    $("#top-screen").fadeIn();
    $("#scoreboard").animate({bottom:"0%"}, 500);
    scoreboard_open = true;
    update_players_cookie();
}

function change_score(score_div, x) {
    score_div
        .animate({"font-size": 100 + 10*Math.sign(x) + "%"}, 50)
        .delay(50)
        .animate({"font-size": "100%"}, 50);
    var new_score = parseInt(score_div.html()) + x;
    score_div.html(new_score);
    
    // manipulate stacks for final
    if (window.is_final = true) {
        var player = score_div.closest(".player");
        var stack = player.find(".stack");
        stack.find(".bar").animate({
            height: window.bar_height * new_score + 15
        }, 100);
    }

    //update cookie
    update_players_cookie()
}

$(".player-score .add").click(function () {
    var score_div = $(this).siblings(".score-num");
    change_score(score_div, 5);
})

$(".player-score .sub").click(function () {
    var score_div = $(this).siblings(".score-num");
    change_score(score_div, -5);
})

var colours = ["#ff8b1e", "#689947", "#6ea6aa", "#4e5b99", "#a474cc", "#f890ef"]

var max_players = 6;

var players = [];
if (readCookie("players")) {
    var players = JSON.parse(readCookie("players"));
    players.forEach(function (p) {
        addPlayer(p.name, p.score, p.colour, p.shuffled)
    });
} else {
    createCookie("players", JSON.stringify(players), 7);
}

function addPlayer(name=null, score=0, colour=null, shuffled=false) {
    var i = $("#new-player").index() - 1;
    if (!name) {name = "Player" + i;}
    if (!colour) {
        var index = Math.floor(colours.length * Math.random());
        var colour = colours[index];
    }

    var new_player = $("#player-template").clone(true)
    new_player
        .attr("id", "player" + i)
        .css({"background": colour});
    if (shuffled) {
        new_player.find(".shuffle")
            .html("sync_disabled")
            .off("click")
            .css({"pointer-events": "none"});
    }
    

    new_player.find(".player-name").html(name);
    new_player.find(".score-num").html(score);
    new_player.insertBefore("#new-player");
}

$("#new-player").click(function () {
    // create new "empty" player
    addPlayer();
    // update cookies
    update_players_cookie();
});

$(".player-name").click(function () {
    $(this).focus();
    $(this).focus();
});

function update_players_cookie() {
    var players = []
    $(":not(#player-template, #new-player).player").each(function () {
        var name = $(this).find(".player-name").html();
        var score = $(this).find(".score-num").html();
        var colour = $(this).css("background");
        var shuffled = $(this).find(".shuffle").html() == "sync_disabled";
        var player_obj = {
            "name": name,
            "score": score,
            "colour": colour,
            "shuffled": shuffled
        }
        players.push(player_obj);
    });
    createCookie("players", JSON.stringify(players));
}

function update_grid_cookie() {
    var statuses = []
    $(".q:not(#template)").each(function () {
        if ($(this).hasClass("closed")) {
            var status = "closed";
        } else if ($(this).hasClass("dull")) {
            var status = "dull";
        } else {
            var status = "none";
        }
        statuses.push(status);
    });
    createCookie("grid", JSON.stringify(statuses));
}

// enlarge images for accessibility reasons
// f is final vertical fraction of the screen that the image will cover
function enlarge(obj, f=0.8) {
    var big_ver = $("<div id='big_ver'>").append(obj.clone());
    big_ver.children("img").css({height: "100%"});

    var H = $(window).height();
    var W = $(window).width();
    var h = $(obj).height();
    var w = $(obj).width()

    var top = 0.5*H*(1-f);
    var left = 0.5*(W - w*f*H/h);

    var state1 = {
        position: "fixed",
        height: obj.height(),
        top: obj.offset().top,
        left: obj.offset().left
    }

    var state2 = {
        top: top,
        left: left,
        height: 100*f + "vh"
    }

    $("#img-screen").fadeIn()

    big_ver.css(state1);
    big_ver.delay(50).animate(state2, 500);

    big_ver.click(function () {
        $("#img-screen").fadeOut()
        big_ver.animate(state1, 500, function () {
            $(this).remove();
        });
    });

    $("main").append(big_ver);
}

// timer code
var timer_paused = true;
var timer_max = 30;
var time_remaining = 30;

$("#timer").on("click", function() {
    if (time_remaining != 0) {
        timer_paused = !timer_paused;
        if (!timer_paused) {
            countdown.play();
        } else {
            countdown.pause();
        }
    } else {
        time_remaining = 30;
        $("#timer-num").html(time_remaining);
        var percentage = time_remaining/timer_max * 100;
        $("#timer-fill").css({height: percentage + "%"})
    }
    
});

setInterval(function() {
    if (!timer_paused) {
        if (time_remaining == 0) {
            timer_paused = true;
        }
        else {
            time_remaining -= 1;
            $("#timer-num").html(time_remaining);
            var percentage = time_remaining/timer_max * 100;
            $("#timer-fill").css({height: percentage + "%"})
        }
    }
}, 1000);    