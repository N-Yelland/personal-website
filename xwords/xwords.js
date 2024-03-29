// Initialising variables...
var A_clues = new Array();
var D_clues = new Array();
$("#table-div").hide();

// Initialises puzzle menu...
var puzzle_count = 12; // how many puzzles are there?
for (i=1; i <= puzzle_count; i++) {
    var i_3 = ("00" + i).slice(-3)
    $("#puzzle-menu").append(`<div class="contents" src="xword_json/cxw${i_3}.json">No. ${i}</div`)
}
// currently assumes all crosswords are located in the file xwords_json,
// and have file names of the form cxwXXX.json where X is a digit.

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

window.setting_tools = false;
if (window.setting_tools) {
    $("h1").html("Crossword Setting Tool");
    $("#table-div").show();
    $("#puzzle-menu, #game-menu").hide();
    buildGrid("xword_json/cxw010.json");
}

// allows instant puzzle navigation via the hash...
// format: #cxw{n} takes you to the {n}th puzzle
if(window.location.hash.match(/^#cxw\d+$/)){
    console.log("TEST");
    var n = window.location.hash.replace(/#cxw/,"");
    console.log(n);
    $(`#puzzle-menu div:nth-child(${n})`).click();
}

// Deselection handling
$(document).click(function(event) {
    var target = $(event.target);
    if (target.closest(".word, li, #clue-display").length == 0) {
        $(".word, li").removeClass("selected");
        $(".word, li").removeClass("cursor");
        $("#clue-display").empty();
    }
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

        // builds table
        for (i=0; i < grid.size[0]; i++) {
            $("#grid").append(`<tr></tr>`)
            for (j=0; j < grid.size[1]; j++) {            
                $(`#grid tr:nth-child(${i+1})`).append("<td></td>")
            }
        }
        // splits multiple clues:
        var new_clues = new Array();
        for (i = 0; i < grid.clues.length; i++) {
            var clue = grid.clues[i];
            if (clue.loc.length > 3) {
                var raw_answer_parts = clue.answer.split(/\//g);
                var answer_parts = raw_answer_parts.map(ans => ans.trim().replace(/(-$)|(^-)/g, ""));
                var isMultiDir = !clue.loc.every((val, i, arr) => val == arr[0] || i % 3 != 0);
                for (var j = 0; j < answer_parts.length; j++) {
                    var new_clue = j == 0 ? clue.clue : `See ...`;
                    var links = answer_parts//.filter(e => answer_parts.indexOf(e) != j);
                    var new_clue_obj = {
                        loc: clue.loc.slice(3*j, 3*j+3),
                        clue: new_clue,
                        answer: answer_parts[j],
                        links: links,
                        isRoot: j == 0,
                        isMultiDir: isMultiDir
                    }
                    if (j == 0) {
                        new_clue_obj.full_answer = clue.answer.replace(/\//g, "");
                    }
                    new_clues.push(new_clue_obj);
                }
                clue.answer = answer_parts[0];
            } else {
                new_clues.push(clue);
            }
        }
        grid.clues = new_clues;
        console.log(grid.clues)

        var clues_list = grid.clues.sort( (a,b) => {
            var size = grid.size[1];
            var a = a.loc.slice(1)[0]*size + a.loc.slice(1)[1];
            var b = b.loc.slice(1)[0]*size + b.loc.slice(1)[1];
            return a-b; 
        });

        var index = 0
        var prev_starts = new Array();
        var clue_groups = new Array();

        // make clue IDs
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
            clue_groups.push([clueID])

            clue.clueID = clueID;
        });

        clues_list.forEach(function (clue) {

            if (clue.isRoot) {
                var Enum = createEnum(clue.full_answer);
                var labels = clue.links.map(function (a) {
                    var link = clues_list.find(c => c.answer == a);
                    var cID = link.clueID;
                    if (clue.loc[0] == link.loc[0]) {
                        var cID = link.clueID.slice(0,-1);
                    }
                    return cID;
                });
                var label = labels.join("/");
            } else {
                var Enum = createEnum(clue.answer);
                var label = clue.clueID.slice(0,-1)
            }
            

            var answer_text = clue.answer.replace(/-|\s/g, "");

            if (clue.clue == "" && window.setting_tools) {
                clue.clue = clue.answer;
            }
                       
            // groups linked clues together
            if (clue.isRoot != undefined) {
                clue.links = clue.links.map(a => clues_list.find(c => c.answer == a).clueID);
            }

            var clue_text = {
                num: label,
                text: clue.clue + " (" + Enum + ")",
                answer: clue.answer,
                isRoot: clue.isRoot,
                isMultiDir: clue.isMultiDir,
                links: clue.links,
                clueID: clue.clueID
            }

            if (clue.isRoot == false) {
                var rootID = clue.links.find(l => clues_list.find(c => c.isRoot && c.clueID == l ));
                clue_text.text = `<i>See ${rootID}</i>`
            }

            if (clue.loc[0] == "A") {
                A_clues.push(clue_text);
            }

            if (clue.loc[0] == "D") {
                D_clues.push(clue_text);
            }

            
            var len = answer_text.length;
            var coord = clue.loc.slice(1);
            for (i=0; i < len; i++) {
                var cell = getCell(coord);
                cell.addClass("word");
                if (clue.links) {
                    cell.addClass("clue" + clue.links.join("-"));
                } else {
                    cell.addClass("clue" + clue.clueID);
                }
                if (cell.has("input").length == 0) {
                    var input = document.createElement("input");
                    input.setAttribute("type", "text");
                    input.setAttribute("pattern", "[a-zA-Z]")
                    cell.append(input);
                }
                /*
                if (window.setting_tools) {
                    cell.html(answer_text[i]);
                }
                */
                if (clue.loc[0] == "A") {
                    coord[1] += 1;
                } else if (clue.loc[0] == "D") {
                    coord[0] += 1;
                }            
            }
        });

        var clue_cols = [{col_name: "A-clues", col: A_clues}, {col_name: "D-clues", col: D_clues}];
        clue_cols.forEach(function (c) {
            c.col.forEach(function(clue) {
                var li = document.createElement("li");
                li.setAttribute("data-number", clue.num + ". ");
                if (clue.links) {
                    li.classList.add("clue" + clue.links.join("-"));
                } else {
                    li.classList.add("clue" + clue.clueID);
                }                
                li.innerHTML = clue.text;
                console.log(clue.isMultiDir, clue.isRoot)
                if (clue.isRoot || clue.isMultiDir || clue.isRoot == undefined) {
                    $(`#${c.col_name} ol`).append(li);
                }
            });
        });
        
        var clue_re = /clue(\d+(A|D)-?)+/g
        $(".word, li").on("mouseover", function () {
            var classes = $(this).attr("class").match(clue_re);
            var clueID = classes[0];
            $(`[class*="${clueID}"]`).addClass("hovered");
        });

        $(".word, li").on("mouseout", function () {
            var classes = $(this).attr("class").match(clue_re);
            var clueID = classes[0];
            $(`[class*="${clueID}"]`).removeClass("hovered");
        });

        $(".word, li").on("click", function () {
            
            var classes = $(this).attr("class").match(clue_re);
            
            // deals with case where letter is in multiple words...
            if (classes.length > 1) {
                // If the letter is not in the selected word, prioritises 'earliest' clue...
                if (!classes.includes(window.selectedClue)) {
                    var clueID = classes.sort()[0];
                } else {
                    // Otherwise, ensures that 'classes[0]' is the selected clue...
                    if (window.selectedClue == classes[1]) {
                        classes.reverse();
                    }
                    
                    // ...then the selected word only changes if the box is already selected.
                    if (window.selectedClue == classes[0] && $(this).hasClass("cursor")) {
                        var clueID = classes[1];
                    } else {
                        var clueID = window.selectedClue;
                    }
                }
            } else {
                var clueID = classes[0];
            }
            window.selectedClue = clueID;
            update_clue_display(clueID);
            
            $(".word, li").removeClass("selected");
            $(`[class*="${clueID}"]`).addClass("selected");

            if ($(this).is("li")) {
                var input = $(`td[class*="${clueID}"]`).first().find("input");
            } else {
                var input = $(this).find("input");
            }
            setCaretPosition(input[0], input[0].value.length);
            
            $(".cursor").removeClass("cursor");
            if ($(this).hasClass("word")) {
                $(this).addClass("cursor");
            } else {
                $(`td[class*="${clueID}"]`).first().addClass("cursor");
            }
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
                
                // highlight 'cursor' box
                $(".cursor").removeClass("cursor");
                next_cell.addClass("cursor");
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
                
                // highlight 'cursor' box
                $(".cursor").removeClass("cursor");
                next_cell.addClass("cursor");
                
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
                update_clue_display(clueID);
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

function update_clue_display(clueID) {
    var clue_text = $(`li.${clueID}`).html();
    var clue_html = `<strong>${clueID.substring(4).replace(/-/g, "/")}:</strong> ${clue_text}`;
    $("#clue-display").html(clue_html);
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
    
    // scroll window
    $("html").animate({scrollTop: $("#puzzle-title").offset().top}, 200);
    
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