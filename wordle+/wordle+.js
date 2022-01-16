/* WORDLE+ Beta Version 
(final name undecided)
*/

var full_dict, dict, N, R, answer, in_progress;

$(document).ready(function () {
    run()
});

async function run() {
    N = 5; //default size is the 'original' 5, will be changeable

    $("#change-size-box").hide();

    // build on-screen keyboard
    var keyboard = [
        ["Q","W","E","R","T","Y","U","I","O","P"],
        ["A","S","D","F","G","H","J","K","L"],
        ["Enter","Z","X","C","V","B","N","M","Delete"]]

    for (var i = 0; i < keyboard.length; i++) {
        var row = keyboard[i];
        $("#keyboard").append(`<div class="row" id="keyrow${i}"}></div>`)

        for (var j = 0; j < row.length; j++) {
            var key = row[j];
            $(`#keyrow${i}`).append(`<div class="key" id="${key}-key">${key}</div>`)
        }
    }
    
    // inserts icons in menu buttons
    $(".icon").each(function(){
        var icon_name = $(this).attr("id").replace("-btn", "");
        $(this).append(`<img src="icons/${icon_name}.svg">`)
    });
    
    //parse wordlist
    await fetch('../code/hangman/big_wordlist.txt')
        .then(response => response.text())
        .then(data => {
        
        // split data between newlines to make array
        var raw_dict = data
            .split(/\r?\n/)
            .map(word => word.toUpperCase());
        
        var alph = "ABCDEFGHIHJKLMNOPQRSTUVWXYZ"
        // filter out all words that contain characters not present in alph
        // full_dict contains all words
        full_dict = raw_dict.filter(function (word) {
            return word.split('').every(char => alph.includes(char));   
        });

        console.log("[1] Finished parsing wordlist")
    });
    build_env();
    
}

async function build_env() {
    await build_grid();
    await set_event_handlers();
    new_game();
}

async function new_game() {
    // scroll window
    $("html").animate({scrollTop: $("#game-title").offset().top}, 200);

    $(".box, .key").removeClass(["correct","appears","incorrect","active"]);
    $(".box").html("");

    await choose_answer();
    in_progress = false;
    awaiting_input = true;
    R = 0;
    $(`#row${R} .box:first-child`).addClass("active");
    $("#loading-screen").hide();
}


function build_grid() {
    $("#grid").empty();
    // build N x N+1 letter grid
    for (var i = 0; i < N+1; i++) {
        $("#grid").append(`<div class="row" id="row${i}"}></div>`);
        for (var j = 0; j < N; j++) {
            $(`#row${i}`).append(`<div class="box" id="box${j}r${i}"></div>`)
        }
    }

    // clicking box moves cursor to that box
    $(`.box`).click(function () {
        if ($(this).siblings(".active").length > 0) {
            $(".box").removeClass("active");
            $(this).addClass("active");
        }
    });

    return new Promise(resolve => {
        console.log("[2] Finished building game environment");
        resolve();
    });    
}

// prepare for instance of game

async function choose_answer() {

    // restrict dictionary to words of length N
    dict = full_dict.filter(word => word.length == N);

    // Here, we use the Datamuse API to find the frequency of the word, to ensure it's not too obscure!
    var f = 0; // f is the number of times the word occurs per million words of English text according to Google Books Ngrams.
    var f_min = 2;// f_min is the minimum frequency threshhold - reduce for harder words!
    // keep finding new word until f >= f_min
    while (f < f_min) {
        answer = random_choice_from(dict);
            await fetch(`https://api.datamuse.com/words?sp=${answer.toLowerCase()}&md=f&max=1`)
                .then(response => response.json())
                .then(data => {
                    if (data.length > 0) {
                        f = parseFloat(data[0].tags[0].replace("f:",""));
                        //console.log(answer, f);
                    }});
    }


    return new Promise(resolve => {
        console.log(`[4] Chosen answer`);
        //console.log(`Hint: it's ${answer}!`);
        resolve();
    });
}


function set_event_handlers() {

    // gameplay loop (triggered by keypresses)
    $(document).keydown(function (e) {
        in_progress = true;

        var key = e.key;
        //console.log(key + " pressed");
        // if a letter is entered...
        if (awaiting_input && key.match(/^[a-z]$/i)) {
            awaiting_input = false;

            var box = $(".box.active")
            
            //cursor does not move forwards from final position
            $(".box:not(:last-child).active").removeClass("active");

            box.html(key.toUpperCase());
            box.next(".box").addClass("active");
            
            awaiting_input = true;
        }
        
        // if backspace is pressed...
        if (awaiting_input && key == "Backspace") {
            awaiting_input = false;

            var box = $(".box.active");

            // sort out nice behaviour...
            if (box.html() == "") {
                if (box.index() != 0) {
                    box.removeClass("active");
                    box = box.prev();
                    box.addClass("active");
                }
            }
            box.html("");
            

            awaiting_input = true;
        }

        // if arrow keys are pressed...
        if (awaiting_input && key == "ArrowLeft") {
            var box = $(".box.active");

            if (box.index() != 0) {
                box.removeClass("active");
                box.prev().addClass("active");
            }
        }
        if (awaiting_input && key == "ArrowRight") {
            var box = $(".box.active");

            if (box.index() != N-1) {
                box.removeClass("active");
                box.next().addClass("active");
            }
        }

        // if enter is pressed...
        if (awaiting_input && key == "Enter") {
            awaiting_input = false;

            //create guess
            var guess = "";
            $(`#row${R} .box`).each(function () {
                guess = guess + $(this).html();
            });

            //console.log(`Player guessed ${guess}`);

            // is the guess complete and valid?
            if (dict.includes(guess)) {
                //'mark' the guess
                correct_letters = 0;
                for (var i = 0; i < N; i++) {
                    var box = $(`#row${R} .box:nth-child(${i+1}), #${guess[i].toUpperCase()}-key`);
                    //box.css("transform", "rotateY(180deg)") // yet to implement rotation
                    if (guess[i] == answer[i]) {
                        // if perfect match, letter goes green
                        box.addClass("correct");
                        correct_letters ++;
                    } else if (~answer.indexOf(guess[i])) {
                        // if answer contains the letter, letter goes orange
                        box.addClass("appears");
                    } else {
                        // answer does not contain the letter, letter goes gray
                        box.addClass("incorrect");
                    }
                }

                $(".box").removeClass("active");

                //did the player 'win'?
                if (correct_letters == N) {
                    //console.log(`Player wins after ${R+1} guesses.`);
                    var msgs = ["Well done!", "Congratulations!", "Magnificent", "Splendid!", "By Jove!", "Aren't you clever!", "Amazing!"];
                    message(random_choice_from(msgs), 2000);
                    //invite player to play new game
                } else {
                        //move on to next row
                    if (R < N) {
                        R ++;
                        $(`#row${R} .box:first-child`).addClass("active");
                        awaiting_input = true;
                    } else {
                        // player loses if that was the last row!
                        awaiting_input = false;
                        //console.log(`Player ran out of guesses. The answer was ${answer}.`);
                        var msg = `Unlucky. The correct answer was ${answer}`;
                        message(msg, 3000);
                        //invite player to play new game
                        //...or keep trying, granting extra guesses
                    }
                }            

            } else {
                console.log("Invalid guess!");
                if (guess.length < N) {
                    var msg = "Guess is too short!"
                } else {
                    var msg = `${guess} is not in the wordlist!`
                }
                message(msg, 1500);
                shake(`#row${R}`);
                $(`#row${R} .box`).addClass("flash");
                setTimeout(function () {
                    $(`#row${R} .box`).removeClass("flash")
                }, 500);

                awaiting_input = true;
            }            
        }

    });

    // INTERACTIVE ELEMENTS

    // clicking on-screen keyboard creates keypresses
    $(".key").click(function () {
        var key = $(this).attr("id").replace("-key","").toLowerCase();
        
        if (key == "delete") {key = "Backspace";}
        if (key == "enter") {key = "Enter";}

        $(this).trigger({type: "keydown", key: key});
    });

    // MENU BUTTONS

    $("#restart-btn").click(function () {
        // warn player that this will end game in progress
        var warning_text = "Warning - this will end you game in progress.\nAre you sure you want to restart?";
        if (!in_progress || window.confirm(warning_text)) {
            $("#loading-screen").show();
            new_game();
        }
    });

    $("#plusminus-btn").click(function () {
        // warn player that this will end game in progress
        var warning_text = "Warning - this will end you game in progress.\nAre you sure you want to do this?";
        if (!in_progress || window.confirm(warning_text)) {
            $("#change-size-box").show();
        }
    });

    $("#confirm-btn").click(async function () {
        $("#loading-screen").show();
        $("#change-size-box").hide();
        await build_grid();
        new_game();
    });

    $("#minus").click(function() {
        if (N >= 4) {
            N = N - 1;
            $("#N-display").html(N);
        }
    });

    $("#plus").click(function() {
        if (N <= 9) {
            N = N + 1;
            $("#N-display").html(N);
        }
    });

    $("#stats-btn, #settings-btn").click(function () {
        message("Not implemented yet", 1000);
    })

    return new Promise(resolve => {
        console.log("[3] Finished setting event handlers");
        resolve();
    });
}

// UTILITY FUNCTIONS

function random_choice_from(choices) {
    var index = Math.floor(Math.random() * choices.length);
    return choices[index];
}

function message(text, duration) {
    var msg = $(`<div class="message">${text}</div>`);
    msg.appendTo("#message-box");
    msg.delay(duration).fadeOut(1000);
}

function shake(div,interval=100,distance=10,times=4){
    $(div).css('position','relative');
    for(var iter=0;iter<(times+1);iter++){
        $(div).animate({ left: ((iter%2==0 ? distance : distance*-1))}, interval);
    }
    $(div).animate({ left: 0},interval);
}