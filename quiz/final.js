// trigger final?

// build 'arena'

function start_final() {
    if (!readCookie("is_final")) {
        createCookie("is_final", "true");
        // hide grid

        $(".q:not(#template)").each(function (index) {
            var q = $(this);
            setTimeout(function () {
                q.animate({
                    opacity: 0
                }, 100);
            }, 50*index);
        });

        var wait =  R*C*50 + 250
    }

    
    if (scoreboard_open) {
        hide_scoreboard();
        wait += 500;
    }

    var timers = new Object;
    var tick_rate = 1200; //ms - worth increasing when there are more players?
    var paused = true;

    var audio_loop = new Audio('media/sfx/countdown_loop.wav');
    var bell_ding = new Audio('media/sfx/bell_ding.wav');
    var gong = new Audio('media/sfx/gong_sfx.wav');
    var victory = new Audio('media/sfx/victory_sting.wav');

    audio_loop.loop = true;

    var player_data = JSON.parse(readCookie('players'));

    $(":not(#player-template, #new-player).player").css({
        "border-radius": "0 0 15px 15px"
    });

    setTimeout(function () {
        show_scoreboard();
        $("#pause-icon").animate({opacity: 1}, 400);
        $("#counter, #timer").animate({opacity: 0}, 100);
        $('#red-line').animate({opacity: 0.5}, 1000);
        
        
        var sb = $("#scoreboard");
        sb.attr("id", "final-scores");
        sb.find("#scoreboard-title, #new-player, #player-template, .icon").remove();

        $(".player").each(function (index) {
            var score_div = $(this).find(".score-num");
            var stack = $("<div class='stack'></div>");
            stack.attr("id", "stack" + index);
            
            $(this).find(" .player-name").css({
                "pointer-events": "none"
            });
            $(this).find(".player-name").attr("contenteditable", "false");       

            var score = parseInt(score_div.html());
            var colour = $(this).css("background");
            stack.append($("<div class='bar'></div>"));
            stack.appendTo(this);
            

            var max_score = Math.max(...player_data.map(p => parseInt(p.score)));
            window.bar_height = $(window).height()*0.7/(max_score+1);
            stack.find(".bar").height(15 + score*window.bar_height);
            
            var bar_style = $(`<style> #stack${index} .bar {
                background: ${colour}
            }</style>`);
            bar_style.appendTo("head");

            $(this).click(function (e) {
                if (!$(e.target).hasClass("score-btn")) {
                    $(".player").not(this).removeClass("frozen");
                    $(this).toggleClass("frozen");
                }
            });

            timers[$(this).attr("id")] = setInterval(function() {
                var player = $(stack).closest(".player");
                var score = parseInt(player.find(".score-num").html());

                // is this stack non-empty?
                if (score > 1 && !player.hasClass("frozen") && !paused) {
                    // remove top bar
                    change_score(score_div, -1);
                } else if (!player.hasClass("frozen") && !paused) {
                    if (score == 1) { 
                        change_score(score_div, -1);
                    }
                    player.addClass("empty");
                }
                
                var remaining_player_count = $(".player:not(.empty)").length;
                // are all-but-one stacks empty?
                if (remaining_player_count <= 1 && score > 0) {
                    // stop all the timers - we have a winner!
                    for (var p in timers) {
                        clearInterval(timers[p]);
                    }
                    audio_loop.pause();
                    gong.play();
                    $(document).off("keypress");

                    $("#red-line, .player").animate({opacity: 0}, 6000);

                    // establish winning player
                    setTimeout(function() {
                        victory.play();

                        var winner = $(".player:not(.empty) .player-name").html()
                        // var winner = player_data[0];
                        $("#winner-alert p").html(winner);
                        $("#winner-alert").animate({opacity: 1}, 1000)
                        setTimeout(function() {
                            $("#thankyou-msg").animate({opacity: 1}, 1000);
                        }, 8500);
                    }, 6000);                 
                }
            }, tick_rate);
        });
    }, wait); // wait for anim to finish...

    var player_count = player_data.length;
    var buzzer_keys = [...Array(player_count).keys()].map(n => (n+1).toString());
    console.log(buzzer_keys);

    var player_names = player_data.map(p => p.name);

    // space/buzzer to pause/play
    $(document).on({
        keypress: function (e) {
            if (e.key == " " || (buzzer_keys.includes(e.key) && !$(`.player:nth-child(${e.key})`).hasClass(`empty`))) {
                if (!paused) {
                    paused = true;
                    audio_loop.pause();
                    
                    if (e.key != " ") {
                        bell_ding.play();
                        $("#buzzer-alert p").html(player_names[parseInt(e.key)-1])
                        $("#buzzer-alert").animate({opacity: 1}, 100);
                        $(`.player:not(:nth-child(${e.key}))`).addClass("nonbuzzed");
                    } else {
                        $("#pause-icon").animate({opacity: 1}, 100);
                    }
                } else {
                    if (e.key == " ") {
                        paused = false;
                        $("#pause-icon, #buzzer-alert").animate({opacity: 0}, 100);
                        $(".player").removeClass("nonbuzzed");
                        audio_loop.play();
                    }
                }

                if (e.key != " ") {
                    var ms = new Date().getMilliseconds();
                    ms = ms.toString().padStart(3, '0')
                    var t = new Date().toLocaleTimeString();
                    console.log(`Buzz recieved from ${player_names[parseInt(e.key)-1]} at ${t+"."+ms}`);
                }
            }
        }
    });
}