//nic_mathma.js
/*global $, SVG*/

var boardcount = 3; // more than 7 boards will not fit on the screen.

const boardsize  = 3,
      spacewidth = 50;

/*--- MAIN FUNCTIONS ---*/

$(document).ready(function () {
    
    //global variables:
    gamestate = createArray(boardcount, boardsize, boardsize);
    draw = SVG('drawing').size(spacewidth * (boardcount * (boardsize + 1) - 1), spacewidth * boardsize);

    //creates circles
    for (var g = 0; g < boardcount; g++) {
        for (var r = 0; r < boardsize; r++) {
            for (var c = 0; c < boardsize; c++) {
                draw.circle(spacewidth - 1).attr({
                    cx: (spacewidth * g * (boardsize + 1)) + (spacewidth * c) + spacewidth/2,
                    cy: (spacewidth * r) + spacewidth/2,
                    fill: '#32CD32',
                    id: g + "_" + r + "_" + c,
                    class: 'circs',
                    'data-status': "empty"
                });
                /*gamestate is a 3d array encoding the game:
                    0 = empty
                    1 = filled
                    2 = dead
                */
                gamestate[g][r][c] = 0;
            }
        }
    }
    //computer_move(gamestate); //if computer is going first

    //establishes the on-click functions for the circles.
    $(".circs").on({
        click: function() {
            if ($(this).attr("data-status") == "empty") {
                place_stone($(this).attr("id"), "P1");
                computer_move(gamestate);
                computer_move(gamestate,"hint"); //NOTE: PRESENT FOR TESTING ONLY
            }
        }
    });
    
});


function reset_game() {
    
    //confirmation if game is in progress:
    if (gamestate.every(function(grid){return grid[0][0] == 2;}) == false) {
        if (confirm("You are about to end a game in progress.\n" +
                    "Are you sure you wish to do so?") == false) {return;}
    }
    
    //resets the attributes of all the circles.
    for (var g = 0; g < boardcount; g++) {
        for (var r = 0; r < boardsize; r++) {
            for (var c = 0; c < boardsize; c++) {
                $("#" + g + "_" + r + "_" + c).attr({
                    fill: '#32CD32',
                    class: 'circs',
                    'data-status': "empty",
                    r: (spacewidth - 1)/2,
                    'stroke-width': 0        
                });
                gamestate[g][r][c] = 0;
            }
        }
    }
    //removes the victory message.
    $("#win_msg").remove();
    //puts message in console:
    console.log(" +++ New Game +++");
}


function computer_move(gs) {
    
    var all_moves = [],
        win_moves = [],
        kill_moves = [],
        move;
    
    const win_codes = ["a","bb","bc","cc"];
    
    // 1. iterate through possible moves:
    for (var g = 0; g < boardcount; g++) {
        for (var r = 0; r < boardsize; r++) {
            for (var c = 0; c < boardsize; c++) {
                var test_gs = jQuery.extend(true, [], gs); //necessary to clone 3d array

                if (gs[g][r][c] == 0) {

                    // 2. change test_gs as if a move was made:
                    test_gs[g][r][c] = 1;
                    all_moves.push([g,r,c]);

                    // 3. get code for current potential move:
                    var test_gs_code = get_gs_code(test_gs);

                    // 4. add move to possible winning moves if it would result in a winning code:
                    if (win_codes.indexOf(test_gs_code) > -1) {
                        win_moves.push([g, r, c]);
                        // 5. looks for moves that shut off the board.
                        var lethal_factors = [2*7*17, 3*11*19, 5*13*23, 7*11*13, 2*3*5, 7*11*13, 17*19*23, 2*11*23, 5*11*17];
                        var board_val = get_board_val(test_gs[g]);
                        for (var f = 0; f < lethal_factors.length; f++) {
                            if (board_val % lethal_factors[f] == 0) {
                                kill_moves.push([g,r,c]);
                            }
                        }
                    }
                }
            }
        }
    }
    
    //choose a random winning moves. If there are no such moves, choose any move at random.
    /*  NB: This is by no means the most optimal method. To make it better, the CPU should try
            and minimise the number of moves in the game to decrease the chance of the player 
            finding winning moves themselves. This could be accomplished by having the CPU select
            moves that remove boards sooner rather than later.
        
            Also, I plan on adding a difficulty slider, which adds a random chance that instead
            of playing a winning move, the CPU will play a random move instead.
    */
    if (kill_moves.length > 0) {
        move = kill_moves[Math.floor(Math.random()*kill_moves.length)];
    } else if (win_moves.length > 0) {
        move = win_moves[Math.floor(Math.random()*win_moves.length)];
    } else {
        move = all_moves[Math.floor(Math.random()*all_moves.length)];
    }
    if (gamestate.every(function(grid){return grid[0][0] == 2;}) == false) {
        if (arguments[1] != "hint") {
            place_stone(move[0] + "_" + move[1] + "_" + move[2], "CPU");
        } else {
            (win_moves.length > 0) ? console.log(move): console.log("no winning moves");
        }
    }
}


function get_board_val(board) {
    /* The board value is the product of primes associated with different spaces as shown in the table below:
         2 |  3 |  5
        ---+----+---
         7 | 11 | 13
        ---+----+---
        17 | 19 | 23
    The argument board must be a 3x3 array/matrix. This is why only a boardsize of 3 is currently supported,
    but I may attempt to change this in the future.
    */
    var p = [2, 3, 5, 7, 11, 13, 17, 19, 23],
        board_val = 1;
    
    for (var x = 0; x < board.length; x++) {
        for (var y = 0; y < board.length; y++) {
            if (board[x][y] >= 1 ) {
                board_val *= p[(x * board.length) + y];
            }
        }
    }
    return board_val;
}


function get_gs_code(gs) {
    //function which takes gamestate matrix as input (gs), and outputs string that categorises the gamestate

    // 1. Calculate composite integer value of gamestate matrix.
    var grid_vals = [];
    var gs_code = "";
    for (var g = 0; g < boardcount; g++) {
        var board = gs[g];
        grid_vals[g] = get_board_val(board)
        grid_level_search: {
            for (var trans = 0; trans < 8; trans++) {
                
                // A dead grid contributes nothing to the gs_code
                var lethal_factors = [2*7*17, 3*11*19, 5*13*23, 7*11*13, 2*3*5, 7*11*13, 17*19*23, 2*11*23, 5*11*17];
                for (var f = 0; f < lethal_factors.length; f++) {
                    if (grid_vals[g] % lethal_factors[f] == 0) {
                        gs_code += "";
                        break grid_level_search;
                    }
                }

                // 2. Assign letter combinations to various gamestate values.
                var code_vals = [
                    ["c", [1]],
                    ["ad", [2*3]],
                    ["cc", [11]],
                    ["d",  [2*3*13, 2*3*19, 2*3*23]],
                    ["",  [2, 3, 2*13*19]],
                    ["ab", [2*3*11, 2*5*17, 3*7*11, 2*3*13*23, 2*3*13*19]],
                    ["b",  [2*5, 2*11, 2*13, 3*11, 2*3*7, 3*7*13, 2*3*11*13, 2*3*11*17, 2*3*13*17, 2*3*17*19, 2*3*17*23, 
                            2*5*11*19, 2*11*13*19, 2*3*7*13*19, 2*3*7*13*23]],
                    ["a", [2*23, 3*7, 3*19, 2*3*17, 2*5*11, 2*5*19, 2*11*13, 2*3*7*11, 2*3*7*13, 2*3*7*23, 2*3*19*23,
                          2*5*17*23, 3*7*13*19, 2*3*11*13*17, 2*3*13*17*19, 2*3*13*17*23, 2*3*7*13*19*23]]
                ];
                for (var i = 0; i < code_vals.length; i++) {
                    for (var j = 0; j < code_vals[i][1].length; j++) {
                        if (grid_vals[g] == code_vals[i][1][j]) {
                            gs_code += code_vals[i][0];
                            break grid_level_search;
                        }
                    }
                }

                // 2b. In the event of no matches, the computer tries rotations, and then reflections.
                if (trans != 4) {
                    board = rotate(board);
                } else if (trans == 4) {
                    board = rotate(board).reverse();
                }
                grid_vals[g] = get_board_val(board);
            }
        }
    }

    /* 3. Reduce gs_code string based on the following reduction rules:
        aa  => ""
        bbb => b
        bbc => c
        ccc => acc
        bbd => d    <-- non-consecutive!
        cd  => ad
        dd  => cc
    */
    var codemap = {
        aa: "",
        bbb: "b",
        bbc: "c",
        ccc: "acc",
        cd: "ad",
        dd: "cc",
    }
    var re = RegExp(Object.keys(codemap).join("|") + "|bb(?=.*d)","g");
    do {
        gs_code = stringSort(stringSort(gs_code).replace(re, function(matched){
            //special case for bbd => d: 
            if (matched == "bb") {
                return "";
            } else {
                return codemap[matched];
            }
        }));
    } while (re.test(gs_code) == true);
    return gs_code;
}


function check_grids(player) {
    
    var grid_vals = [];
    for (var b = 0; b < boardcount; b++) {grid_vals[b] = get_board_val(gamestate[b]);}
    for (var g = 0; g < boardcount; g++) {
        // if the board value is a multiple of any of these numbers, then the board is dead.
        var lethal_factors = [2*7*17, 3*11*19, 5*13*23, 7*11*13, 2*3*5, 7*11*13, 17*19*23, 2*11*23, 5*11*17];
        for (var f = 0; f < lethal_factors.length; f++) {
            if (grid_vals[g] % lethal_factors[f] == 0) {
                kill_grid(g);
                break;
            }
        }
    }
    
    //checks to see if all boards are dead
    if (gamestate.every(function(grid){return grid[0][0] == 2;})) {
        
        //"player" loses, so the other player wins:
        var winner = (player == "CPU") ? "P1" : "CPU"
        
        //creates victory message
        draw.text(winner + " WINS!").font({
            fill: "#F00",
            family: "Times New Roman",
            size: (spacewidth * boardsize * 0.60),
            anchor: "middle",
            weight: 900
        }).attr({
            id: "win_msg",
            x: (spacewidth * (boardcount * (boardsize + 1) - 1))/2,
            y: 0,
            'alignment-baseline': "central",
            opacity: 0.5
        });
    }
}


function place_stone(id, player) {
    
    var stonesize = 0.8;
    
    //updates svg visuals
    $("#" + id).attr({
        class: "stone",
        'data-status': "stone",
        r: (spacewidth - 1)/2 * stonesize,
        stroke: '#32CD32',
        'stroke-width': (spacewidth - 1) * (1-stonesize),
        fill: "#000"
    });
    
    //updates gamestate matrix
    var s = get_coords(id);
    gamestate[s[0]][s[1]][s[2]] = 1;
    check_grids(player);
}


function kill_grid(g) {
    
    //sets the gamestate value to 2 for all the spaces in the board
    //and updates the svg to make it look greyed-out
    for (var r = 0; r < boardsize; r++) {
        for (var c = 0; c < boardsize; c++) {
            var idtag  = "#" + g + "_" + r + "_" + c;
            gamestate[g][r][c] = 2;
            if ($(idtag).attr("class") == "circs") {
                $(idtag).attr({
                    "data-status": "dead",
                    fill: "#90EE90",
                    class: "circs"
                });
            } else {
                $(idtag).attr({
                    stroke: "#90EE90",
                    fill: "#696969"
                });
            }
        }
    }
}


/*--- UTILITY FUNCTIONS ---*/

function createArray(length) {
    var arr = new Array(length || 0),
        i = length;
    if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments, 1);
        while(i--) arr[length-1 - i] = createArray.apply(this, args);
    }
    return arr;
}

function stringSort(str) {
    return str.split("").sort().join("");
}

function rotate(a) {
    const flipMatrix = a[0].map((column, index) => (a.map(row => row[index])));
    return flipMatrix.reverse();
}

function get_coords (id) {
    var rpos = id.indexOf("_"),
        cpos = id.lastIndexOf("_"),
        g = parseInt(id),
        r = parseInt(id.slice(rpos + 1)),
        c = parseInt(id.slice(cpos + 1));
    return [g, r, c];
}