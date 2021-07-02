// Initialising variables...
var A_clues = new Array();
var D_clues = new Array();
$("#table-div").hide();

window.setting_tools = false;
if (window.setting_tools) {
    $("h1").html("Crossword Setting Tool");
    $("#table-div").show();
    $("#puzzle-menu, #game-menu").hide();
    buildGrid("xword_json/cxw005.json");
}    

$("#puzzle-menu > div").on("click", function(){
    $("#table-div").show();
    $("#completion-msg").hide();
    var url = $(this).attr("src");
    window.puzzle = url
    
    A_clues = [];
    D_clues = [];
    if (window.show_errors_enabled) {
        toggle_show_errors();
    }
    
    buildGrid(url);
});

// Function to build crossword from json file located at url
function buildGrid(url) {
    $("#grid, #A-clues ol, #D-clues ol").empty();
    $.getJSON(url, function (data) {
        var grid = data;
        window.grid = data;

        $("#puzzle-title").html(grid.title);
        if (grid.description) {
            $("#puzzle-description").html(grid.description);
        } else {
            $("#puzzle-description").html("");
        }

        // build table
        for (i=0; i < grid.size[0]; i++) {
            $("#grid").append(`<tr></tr>`)
            for (j=0; j < grid.size[1]; j++) {            
                $(`#grid tr:nth-child(${i+1})`).append("<td></td>")
            }
        }

        var clues_list = grid.clues.sort( (a,b) => {
            var size = grid.size[1];
            var a = a.loc.slice(1)[0]*size + a.loc.slice(1)[1];
            var b = b.loc.slice(1)[0]*size + b.loc.slice(1)[1];
            return a-b; 
        });

        var index = 0
        var prev_starts = new Array();

        clues_list.forEach(function (clue) {
            var coord = clue.loc.slice(1);

            // if this word does not share a start with another...
            if (!array_list_contains(prev_starts, coord)) {
                prev_starts.push(coord.slice());
                index++;
                var cell=getCell(coord);
                cell.append(`<div class="number">${index}</div>`);    
            }

            var clueID = (index).toString() + clue.loc[0];

            var answer_text = clue.answer.replace(/-|\s/g, "");
            var len = answer_text.length;

            var Enum = createEnum(clue.answer);
            
            if (clue.clue == "" && window.setting_tools) {
                clue.clue = clue.answer;
            }
            var clue_text = {
                num: clueID.slice(0,-1),
                text: clue.clue + " (" + Enum + ")",
                answer: clue.answer
            }
            

            if (clue.loc[0] == "A") {
                A_clues.push(clue_text);
            }

            if (clue.loc[0] == "D") {
                D_clues.push(clue_text);
            }


            for (i=0; i < len; i++) {
                var cell = getCell(coord);
                cell.addClass("word");
                cell.addClass("clue" + clueID);

                if (cell.has("input").length == 0) {
                    var input = document.createElement("input");
                    input.setAttribute("type", "text");
                    input.setAttribute("pattern", "[a-zA-Z]")
                    cell.append(input);
                }
                
                if (window.setting_tools) {
                    cell.html(answer_text[i]);
                }

                if (clue.loc[0] == "A") {
                    coord[1] += 1;
                } else if (clue.loc[0] == "D") {
                    coord[0] += 1;
                }            
            }
        });

        A_clues.forEach(function(clue) {
            var li = document.createElement("li");
            li.setAttribute("value", clue.num);
            li.classList.add("clue" + clue.num + "A");
            li.innerHTML = clue.text;
            $("#A-clues ol").append(li);
        });
        D_clues.forEach(function(clue) {
            var li = document.createElement("li");
            li.setAttribute("value", clue.num);
            li.classList.add("clue" + clue.num + "D");
            li.innerHTML = clue.text;
            $("#D-clues ol").append(li);
        });


        $(".word, li").on("mouseover", function () {
            var classes = $(this).attr("class").match(/clue\d+(A|D)/g);
            var clueID = classes[0];
            $(`[class*="${clueID}"]`).addClass("hovered");
        });

        $(".word, li").on("mouseout", function () {
            var classes = $(this).attr("class").match(/clue\d+(A|D)/g);
            var clueID = classes[0];
            $(`[class*="${clueID}"]`).removeClass("hovered");
        });

        $(".word, li").on("click", function () {

            var classes = $(this).attr("class").match(/clue\d+(A|D)/g);
            if (classes.length > 1) {
                if (window.selectedClue == classes[0]) {
                    var clueID = classes[1];
                } else {
                    var clueID = classes[0];
                }
            } else {
                var clueID = classes[0];
            }
            window.selectedClue = clueID;
            
            $(".word, li").removeClass("selected");
            $(`[class*="${clueID}"]`).addClass("selected");

            if ($(this).is("li")) {
                var input = $(`td[class*="${clueID}"]`).first().find("input");
            } else {
                var input = $(this).find("input");
            }
            setCaretPosition(input[0], input[0].value.length);
        });
        
        // Ensures input is only letters (of the Roman alphabet)
        $(".word input").inputFilter(function (value) {
            return /^(|[a-z])$/i.test(value);
        });
        
        // Tasks to be done whenever input is recieved:
        $(".word input").on("input", function (value) {
            var cell = $(this).parent();
            var word = $(`td[class*="${window.selectedClue}"]`);
            var ind = word.index(cell)
            
            // show errors, if enabled.
            if (window.show_errors_enabled) {
                show_errors();
            }
            
            // position the cursor on the right
            if (this.value != "" && ind < word.length - 1) {
                var next_cell = $(word[ind + 1]);
                var input = next_cell.find("input");
                setCaretPosition(input[0], input[0].value.length);
            }
        });

        $(".word").on("keydown", function (e) {
            var input = $(this).find("input");
            var word = $(`td[class*="${window.selectedClue}"]`);
            var cell = $(":focus").parent();

            if (e.keyCode == 8) {
                //backspace pressed...
                var ind = word.index($(this));
                if (input.val() == "" && ind > 0) {
                    var next_cell = $(word[ind - 1]);

                }
            } else if (e.key.match(/^[a-z]$/i)) {
                input.val("");
            } else if (e.key.match(/Arrow/)) {
                e.preventDefault();
                var row = $(this).parent().children("td");
                var ind = row.index(cell);

                var wordrow = row.filter(".word");
                var xind = wordrow.index(cell);

                var col = $(`#grid tr td.word:nth-child(${ind+1})`);
                var yind = col.index(cell);

                if (e.key == "ArrowLeft") {
                    if (xind > 0) {
                        var next_cell = $(wordrow[xind - 1]);

                    }
                } else if (e.key == "ArrowRight") {
                    if (xind < wordrow.length - 1) {
                        var next_cell = $(wordrow[xind + 1]);

                    }
                } else if (e.key == "ArrowUp") {
                    if (yind > 0) {
                        var next_cell = $(col[yind - 1]);

                    }
                } else if (e.key == "ArrowDown") {
                    if (yind < col.length - 1) {
                        var next_cell = $(col[yind + 1]);

                    }
                }
            }

            if (next_cell) {
                var input = next_cell.find("input");
                setCaretPosition(input[0], 2);

                var classes = next_cell.attr("class").match(/clue\d+(A|D)/g);

                if (classes.length > 1) {
                    if (window.selectedClue != classes[0]) {
                        var clueID = classes[1];
                        window.selectedClue = classes[1];
                    } else {
                        var clueID = classes[0];
                        window.selectedClue = classes[0];
                    }
                } else {
                    var clueID = classes[0];
                    window.selectedClue = classes[0];
                }

                $(".word, li").removeClass("selected");
                $(`[class*="${clueID}"]`).addClass("selected");
            }

        });
        
        // detect correct completion...
        $(".word").on("keyup", function(){
            check_completion()
        });
        
        // refill answers from cookie
        var c = getCookie(window.puzzle);
        if (c != "") {
            $(".word input").each(function (index) {
                if (c[index] != "_") {
                    $(this).val(c[index]);
                }
            });
        }
        check_completion()
        
        // function to make cookie
        setInterval(function () {
            var cookie = "";
            $(".word input").each(function(){
                if ($(this).val() != "") {
                    cookie += $(this).val().toUpperCase();
                } else {
                    cookie += "_";
                }
            });
            //console.log(cookie);
            setCookie(window.puzzle, cookie, 30);
        }, 5000);

    });
}


function getCell(coord) {
    var col = coord[0] + 1;
    var row = coord[1] + 1;
    return $(`#grid tr:nth-child(${col}) td:nth-child(${row})`);
}

function array_list_contains(list, coord) {
    for (i=0; i < list.length; i++) {
        var arr = list[i];
        if (arr.length != coord.length) return false;
        if (arr[0] == coord[0] && arr[1] == coord[1]) return true;
    }
    return false;
}

function createEnum(answer) {
    var regex = /-|\s/g;
    var words =  answer.split(regex);
    var bits = answer.match(regex);
    var lengths = words.map(word => word.length);
    
    var Enum = ""
    for (i=0; i< lengths.length; i++) {
        Enum += lengths[i].toString();
        if (bits && i < bits.length) {
            Enum += bits[i].replace(" ", ",");
        }
    }
    return Enum;
}

function show_errors(counting = false) {
    var error_count = 0;
    $(".word").each(function(index){    
        var input = $(this).find("input");
        if (input.val() != "") {
            var clues = $(this).attr("class").match(/clue\d+(A|D)/g);
            var clueID = clues[0];
            var cluenum = clueID.replace(/clue|A|D/g, "");
            if (clueID.slice(-1) == "A") {
                var clue = A_clues.find(c => c.num == cluenum);
            } else {
                var clue = D_clues.find(c => c.num == cluenum);
            }
            var word = $(`td[class*="${clueID}"]`);
            var ind = word.index($(this));
            var answer_text = clue.answer.replace(/-|\s/g, "");
            
            if (answer_text[ind] != input.val().toUpperCase()) {
                error_count ++;
                if (!counting) {
                    input.addClass("error");
                }
            } else {
                input.removeClass("error");
            }
        } else {
            input.removeClass("error");
        }
    });
    return error_count;
}

function toggle_show_errors() {
    if (window.show_errors_enabled) {
        window.show_errors_enabled = false;
        $(".word input").removeClass("error");
        $("#toggle-errors-btn").html("Show<br>Errors");
    } else {
        window.show_errors_enabled = true;
        $("#toggle-errors-btn").html("Hide<br>Errors");
        show_errors();
    }
}

function clear_grid() {
    // prompts user to confirm that they do indeed want to clear the grid!
    var letters = $(".word input").toArray();
    if (letters.some(node => $(node).val() != "")) {
        if (window.confirm("Are you sure you want to clear the grid? Your progress will be lost!")) {
          $(".word input").val("");  
        }
    }
    
}

function check_completion() {
    // check completion of each word
    $("#clue-box li").each(function(){
        var clueID = $(this).attr("class").match(/clue\d+(A|D)/g)[0];
        var word = $(`td[class*="${clueID}"]`);
        var letters = word.toArray().map(c => $(c).find("input").val().toUpperCase());
        if (letters.every(l => l != "")) {
            $(`li.${clueID}`).addClass("complete");
        } else {
            $(`li.${clueID}`).removeClass("complete");
        } 
    });
    
    // check completion of whole grid
    var error_count = show_errors(counting = true);
    var letters = $(".word input").toArray().map(a => $(a).val());
    if (error_count === 0 && letters.indexOf("") == -1 && letters.length > 0) {
        //console.log("Puzzle completed!");
        var msg = $("#completion-msg");
        msg.show();
    }
}

// Restricts input for the set of matched elements to the given inputFilter function.
(function($) {
  $.fn.inputFilter = function(inputFilter) {
    return this.on("input keydown keyup mousedown mouseup select contextmenu drop", function() {
        if (inputFilter(this.value)) {
            this.oldValue = this.value;
            this.oldSelectionStart = this.selectionStart;
            this.oldSelectionEnd = this.selectionEnd;
            
      } else if (this.hasOwnProperty("oldValue")) {
        this.value = this.oldValue;
        this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
      } else {
        this.value = "";
      }
    });
  };
}(jQuery));

// function to position cursor at the end of input text
// Credits: http://blog.vishalon.net/index.php/javascript-getting-and-setting-caret-position-in-textarea/, via https://codepen.io/chrisshaw/pen/yNOVaz
function setCaretPosition(ctrl, pos) {
  // Modern browsers
  if (ctrl.setSelectionRange) {
    ctrl.focus();
    ctrl.setSelectionRange(pos, pos);
  
  // IE8 and below
  } else if (ctrl.createTextRange) {
    var range = ctrl.createTextRange();
    range.collapse(true);
    range.moveEnd('character', pos);
    range.moveStart('character', pos);
    range.select();
  }
}

// cookie management, to automatically save progress:
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