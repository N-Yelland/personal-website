// loads cookie if possible...
var c_code = getCookie("code");
if (c_code) {
    $("#inputbox").val(c_code);
}

// inserts icons...
$(".icon").each(function(){
    var icon_name = $(this).attr("id").replace("-btn", "");
    $(this).append(`<img src="icons/${icon_name}.svg">`)
});


// creates cookie from code whenever a change is made
$("#inputbox").on("input", function () {
    var raw = $(this).val();
    setCookie("code", raw, 30);
});

function reset_run_btn() {
    $("#run-btn").children("img").attr("src", "icons/run.svg");
    $("#run-btn").attr("title", "Run Code");
    running = false;
}

$("#codebox").on("click", function () {
   if (!running) {
       $("#inputbox").show();
       $("#codebox").hide();
   }
});

var running = false;
$("#run-btn").on("click", function () {
    if (!running) {
        $(this).children("img").attr("src", "icons/stop.svg");
        $(this).attr("title", "Stop");
        running = true;
        
        var raw = $("#inputbox").val();
        var code = raw.replace(/[^><+\-.,[\]]/gm, "");
        console.log("Attempting to run code", code);
        run(code);
    } else {
        reset_run_btn()
        clearInterval(window.loop);
        throw_error("Excecution Interrupted")
    }
    
});

var viewing_tape = false;
$("#tape-btn").on("click", function () {
   if (!viewing_tape) {
       $(this).css({
           "background": "grey",
           "border": "solid 2.5pt #474747"
       });
       $(this).attr("title", "Hide Tape");
       viewing_tape = true;
       $("#tape").show();
   } else {
       $(this).css({
           "background": "#474747",
           "border": "0"
       });
       $(this).attr("title", "View Tape");
       viewing_tape = false;
       $("#tape").hide();
   }
});

var converter_open = false;
$("#ascii-converter").hide();
$("#ascii-converter-btn").on("click", function () {
    if (!converter_open) {
        $(this).css({
            "background": "grey",
            "border": "solid 2.5pt #474747"
        });
        $(this).attr("title", "Close ASCII Converter");
        converter_open = true;
        $("#ascii-converter").show();
    } else {
        $(this).css({
            "background": "#474747",
            "border": "0"
        });
        $(this).attr("title", "Open ASCII Converter");
        converter_open = false;
        $("#ascii-converter").hide();
    }
});

$("#char-entry").on("input", function (e) {
    var char = $(this).val();
    if (char.length > 1) {
        char = char.slice(char.length-1);
        $(this).val(char);
    }
    if (char) {
        var num = char.charCodeAt(0) % 256;
        $("#num-entry").val(num);
    } else {
        $("#num-entry").val("0");
    }
})

$("#num-entry").on("input", function(e) {
    var num = $(this).val().replace(/\D/, "");
    if (num.length > 3) {
        num = num.slice(1);
    }
    $(this).val(num);
    if (num) {
        var char = String.fromCharCode(num % 256);
        $("#char-entry").val(char);
    } else {
        $("#char-entry").val("");
    }
    
})

// cookie management, to make code persist...
// from https://www.w3schools.com/js/js_cookies.asp
function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  var expires = "expires="+ d.toUTCString();
  document.cookie = cname + "=" + encodeURIComponent(cvalue) + ";" + expires + ";path=/";
}
function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for(var i = 0; i <ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function throw_error(error_type) {
    console.log("ERROR:", error_type);
    
    box.append(`<p class="error-msg">ERROR: ${error_type}</p>`);
    reset_run_btn();
}

function get_input() {
    var box = $("#outputbox");
    box.append(`<p class="input-msg">Input:</p>`)
    var input_char = "";
    while (input_char.length != 1) {
        var input_char = prompt("Please input a single character");
        if (input_char == "" || input_char == null) {
            input_char = "\u0000";
        }
    }
    var input_num = input_char.charCodeAt(0) % 256;
    box.children("p:last-child").html(`Input: ${input_char} (${input_num})`);
    return input_num;
}

// function to run BF code
function run(code) {
    var box = $("#outputbox");
    box.html("");
    
    error = false;
    
    var t0 = Date.now();
    
    // initiating tape:
    var tape = [0];
    var pointer = 0;
    
    // parsing parentheses:
    var pairs = [];
    var height = 0
    for (i=0; i < code.length; i++) {
        if (code[i] == "[") {
            height += 1;
            pairs.push({start: i, end: null, height: height});
        } else if (code[i] == "]") {
            var starts = pairs.filter(p => p.height == height);
            if (starts.length == 0) {
                error = true;
                // highlight index?
                break;
            }
            var start = starts[starts.length - 1];
            start.end = i;
            height -= 1;
        }
        if (height < 0) {
            error = true;
            break;
        }
    }
    if (height != 0) {
        error = true;
    }
    if (error) {
        throw_error("Parentheses Error");
    } else {
        // iterates through code:
        var i = 0;
        var ops = 0;
        var maxops = 1000000;
        var tapemax = 30000;


        // format code for display while running
        var raw = $("#inputbox").val()
        $("#inputbox").hide();
        $("#codebox").show();
        // de-highlight comments
        var block_regex = /[><+\-.,[\]]|([^><+\-.,[\]]+)/g;
        var code_regex = /[><+\-.,[\]]/;
        var formatted_raw = raw.replace(block_regex, function(match){
            if (code_regex.test(match)) {
                return `<span tabindex="1">${match}</span>`;
            } else {
                return `<span class="comment">${match}</span>`;
            }
        });

        $("#codebox").html(formatted_raw);

        if (viewing_tape) {
            var program = {
                code: code,
                tape: tape,
                pointer: pointer,
                index: i,
                pairs: pairs
            }

            window.loop = setInterval(function(){
                ops++;
                program = step(program);
                if (program.index >= code.length || ops > maxops) {
                    if (ops > maxops) {
                        error = true;
                        throw_error(`Operation Limit Exceeded (${maxops})`);
                    }
                    if (program.pointer > tapemax) {
                        error = true;
                        throw_error("End of Tape: index too large");
                    }
                    if (program.pointer < 0) {
                        error = true;
                        throw_error("End of Tape: negative index");
                    }
                    if (!error) {
                        box.append(`<br><p class="end-msg">+++ Execution Complete +++<br>`
                                   +`Final Tape Length: ${tape.length}<br>`
                                   +`Total Operations:  ${ops}<br>`
                                   +`++++++++++++++++++++++++++</p>`)
                    }
                    reset_run_btn()
                    clearInterval(window.loop);
                }
            }, 10);
        } else {
            while (i < code.length && ops <= maxops) {

                // move pointer right
                if (code[i] == ">") {
                    pointer += 1;
                    if (pointer > tape.length-1) {
                        tape.push(0);
                    }
                    if (pointer > tapemax) {
                        error = true;
                        throw_error("End of Tape: index too large");
                        break;
                    }
                }

                // move pointer left
                if (code[i] == "<") {
                    pointer -= 1
                    if (pointer < 0) {
                        error = true;
                        throw_error("End of Tape: negative index");
                        break;
                    }
                }

                // increment cell at pointer
                if (code[i] == "+") {
                    tape[pointer] = (tape[pointer] + 1) % 256
                }

                // decrement cell at pointer
                if (code[i] == "-") {
                   tape[pointer] = (tape[pointer] + 255) % 256
                }

                // output character corresponding to cell value at pointer
                if (code[i] == ".") {
                    box.append(String.fromCharCode(tape[pointer]));
                }

                // request input of a character to be stored as corresponding
                // value in cell at pointer
                if (code[i] == ",") {
                    tape[pointer] = get_input();
                }

                // jump from [ to matching ] if the cell at pointer has value 0
                if (code[i] == "[") {
                    if (tape[pointer] == 0) {
                        i = pairs.find(pair => pair.start == i).end;
                    }
                }

                // jump from ] to matching [ if cell at pointer is non-zero
                if (code[i] == "]") {
                    if (tape[pointer] != 0) {
                        i = pairs.find(pair => pair.end == i).start;
                    }
                }

                i++;
                ops++;
            }

            if (ops > maxops) {
                error = true;
                throw_error(`Operation Limit Exceeded (${maxops})`);
            }
            if (!error) {
                var t1 = Date.now();
                var T = (t1 - t0)/1000;
                box.append(`<br><p class="end-msg">+++ Execution Complete +++<br>`
                           +`Completed in ${T}s<br>`
                           +`Final Tape Length: ${tape.length}<br>`
                           +`Total Operations:  ${ops}<br>`
                           +`++++++++++++++++++++++++++</p>`)
            }
            reset_run_btn()
        }
    }
}

function step(program) {
    
    var box = $("#outputbox");
    
    var code = program.code;
    var tape = program.tape;
    var pointer = program.pointer;
    var i = program.index;
    var pairs = program.pairs;
    
    switch (code[i]) {
        case ">":
            pointer += 1;
            if (pointer > tape.length-1) {
                tape.push(0);
            }
            break;
        case "<":
            pointer -= 1
            break;
        case "+":
            tape[pointer] = (tape[pointer] + 1) % 256;
            break;
        case "-":
            tape[pointer] = (tape[pointer] + 255) % 256;
            break;
        case ".":
            box.append(String.fromCharCode(tape[pointer]));
            break;
        case ",":
            tape[pointer] = get_input();
            break;
        case "[":
            if (tape[pointer] == 0) {
                i = pairs.find(pair => pair.start == i).end;
            }
            break;
        case "]":
            if (tape[pointer] != 0) {
                i = pairs.find(pair => pair.end == i).start;
            }
            break;   
    }
    
    var display_pointer = `<span class='pointer' tabindex="1">${tape[pointer]}</span>`;
    var display_tape = tape.slice(0,pointer).concat([display_pointer], tape.slice(pointer+1)).join(",");

    $("#tape").html(display_tape);
    $(".pointer").get(0).focus();
    
    // highlight active code element:
    $("#codebox span").not(".comment").eq(i).focus();
    
    i++; 
    
    var next_program = {
        code: code,
        tape: tape,
        pointer: pointer,
        index: i,
        pairs: pairs
    }
    return next_program;
}
