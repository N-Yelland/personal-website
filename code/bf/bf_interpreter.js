// loads cookie if possible...
var raw = getCookie("code");
if (raw) {
    $("#inputbox").val(raw);
}


// inserts icons...
$(".icon").each(function(){
    var icon_name = $(this).attr("id").replace("-btn", "");
    $(this).append(`<img src="icons/${icon_name}.svg">`)
});


// show placeholder text if the input box is empty
$("#inputbox").on("input", function () {
    var raw = $(this).val();
    setCookie("code", raw, 30);
});

$("#run-btn").on("click", function () {
    var raw = $("#inputbox").val();
    var code = raw.replace(/[^><+\-.,[\]]/gm, "");
    console.log("Attempting to run code", code);
    run(code);
});


// cookie management, to make code persist...
// from https://www.w3schools.com/js/js_cookies.asp
function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  var expires = "expires="+ d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
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
    var box = $("#outputbox");
    box.append(`<p class="error-msg">ERROR: ${error_type}</p>`);
}

// function to run BF code
function run(code) {
    var box = $("#outputbox");
    box.html("");
    
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
                var error = "Parentheses Error";
                // highlight index?
                break;
            }
            var start = starts[starts.length - 1];
            start.end = i;
            height -= 1;
        }
        if (height < 0) {
            var error = "Parentheses Error";
            break;
        }
    }
    if (height != 0) {
        var error = "Parentheses Error";
    }
    if (error) {
        throw_error(error);
    } else {
        console.log(pairs);
    }
    
    // iterates through code:
    var i = 0;
    var ops = 0;
    maxops = 1000000;
    tapemax = 30000;
    error = false;
    
    /*
    // for 'view tape' mode
    var program = {
        code: code,
        tape: tape,
        pointer: pointer,
        index: i,
        pairs: pairs
    }
    
    
    var interval = setInterval(function(){
        program = step(program);
        if ( program.index >= code.length) {
            clearInterval(interval);
        }
    }, 5);
    */
    
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
            box.append(`<p class="input-msg">Input: </p>`)
            // more needed... await keydown? toggle some flag?
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
        
}

function step(program) {
    
    var box = $("#outputbox");
    
    var code = program.code;
    var tape = program.tape;
    var pointer = program.pointer;
    var i = program.index;
    var pairs = program.pairs;

    // move pointer right
    if (code[i] == ">") {
        pointer += 1;
        if (pointer > tape.length-1) {
            tape.push(0);
        }
        if (pointer > tapemax) {
            error = true;
            throw_error("End of Tape: index too large");
        }
    }

    // move pointer left
    if (code[i] == "<") {
        pointer -= 1
        if (pointer < 0) {
            error = true;
            throw_error("End of Tape: negative index");
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
        box.append(`<p class="input-msg">Input: </p>`)
        // more needed... await keydown? toggle some flag?
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
    var display_pointer = `<span class='pointer'>${tape[pointer]}</span>`;
    var display_tape = tape.slice(0,pointer).concat([display_pointer], tape.slice(pointer+1)).join(",");

    $("#tape").html(display_tape);
    
    var next_program = {
        code: code,
        tape: tape,
        pointer: pointer,
        index: i,
        pairs: pairs
    }
    return next_program;
}