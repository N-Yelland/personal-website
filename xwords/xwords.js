var A_clues = new Array();
var D_clues = new Array();
    

$.getJSON("xword_json/cxw001.json", function (data) {
    var grid = data;
    window.grid = data;
    
    var grid_info = new Array(grid.size[0]);
    for (i=0; i < grid.size[1]; i++) {
        grid_info[i] = new Array(grid.size[1]);
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
            
            //cell.html(answer_text[i]);
            
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
        
        if ($(this).is("li")) {
            $(`td[class*="${clueID}"]`).first().find("input").focus();
        }
    });
    
    $(".word input").inputFilter(function (value) {
        return /^(|[a-z])$/i.test(value);
    });
    
    $(".word input").on("input", function (value) {
        var cell = $(this).parent();
        var word = $(`td[class*="${window.selectedClue}"]`);
        var ind = word.index(cell) 
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
    
});

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

function show_errors() {
    $(".word").each(function(index){    
        var input = $(this).find("input");
        if (input.val() != "") {
            var clues = $(this).attr("class").match(/clue\d+(A|D)/g);
            var clueID = clues[0];
            
        }
    })
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
// Original JavaScript code by Chirp Internet: chirpinternet.eu
// Please acknowledge use of this code by including this header.

var today = new Date();
var expiry = new Date(today.getTime() + 30 * 24 * 3600 * 1000); // plus 30 days

function setCookie(name, value) {
    document.cookie=name + "=" + escape(value) + "; path=/; expires=" + expiry.toGMTString();
}

function buildCookie() {
    var cookie = "";
    $("#grid tr").each(function (index) {
        $(this).children("td").each(function (index2) {
            if ($(this).hasClass("word")) {
                var input = $(this).find("input");
                if (input.val() == "") {
                    cookie += "_";
                } else {
                    cookie += input.val();
                }
            } else {
                cookie += "-"
            }
        });
    });
    setCookie("grid1", cookie);
}

setInterval(buildCookie, 2000);