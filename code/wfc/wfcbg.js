const W = $(window).width();
const H = $(window).height();

const draw = SVG().addTo('body').size(W,H-1);
const R = 10; // user determined

const L = H/R
const C = Math.ceil(W/L);


var tile_codes = {
    0: 'BBBBBBBB',
    1: 'BWBBBWBB',
    2: 'BBWBBBWB',
    3: 'WBBBWBBB',
    4: 'WBBWBBBB',
    5: 'BBBBWBBW',
    6: 'BBBWBBWB',
    7: 'BBWBBBBW',
    8: 'BBBBWBBB',
    9: 'BBBBBWBB',
    10:'BBBBBBWB',
    11:'BBBBBBBW',
    12:'WBBBBBBB',
    14:'BLCCCHBW',
    15:'CCCHBWBL',
    16:'CHBBBBBL',
    17:'BLCHBBBB',
    18:'BBBLCHBB',
    19:'CCCCCCCC',
}

const valid_pairs = ['BB', 'WW', 'CC', 'LH', 'HL']

const raw_tile_ids = Object.keys(tile_codes);
const raw_tile_count = raw_tile_ids.length;
const offset = 22;

function flip (code) {
    var flipped_code =  code[0] + code.slice(1).split("").reverse().join("");
    return flipped_code.replace(/(L|H)/g, function(str, m) { return m == "L" ? "H" : "L"; });
}

for (var i = 0; i < raw_tile_count; i++) {
    var id = raw_tile_ids[i];
    var code = tile_codes[id];
    if (code != flip(code)) {
        tile_codes[parseInt(id) + offset] = flip(code);
    }
}

const tile_ids = Object.keys(tile_codes);
const tile_count = tile_ids.length;

const valid_nbrs = {}
for (var i = 0; i < tile_count; i++) {
    var id = tile_ids[i]
    valid_nbrs[id] = []
    for (var j=0; j < 8; j++) {
        valid_nbrs[id][j] = []
        for (var k=0; k < tile_count; k++) {
            var nbr_id = tile_ids[k]
            var pair = tile_codes[id][j] + tile_codes[nbr_id][(j+4)%8];
            if (valid_pairs.includes(pair)) {
                valid_nbrs[id][j].push(nbr_id);
            }
        }
    }
}

// time to collapse some wave functions!

var tiles = [];

for (var r = 0; r < R; r++) {
    for (var c = 0; c < C; c++) {
        tiles[r*C + c] = {
            options: [...tile_ids],
            position: [r,c],
            resolved: false
        }
    }
}


function get_tile(r,c) {
    return tiles.find(tile => tile.position[0] == r && tile.position[1] == c);
}

var i = 0;

function random_choice(array) {
    return array[Math.floor(Math.random() * array.length)];
}
    
var gaps = [];
    
var loop = setInterval(function () {
    i++;

    // choose tile with fewest options
    var unresolved_tiles = tiles.filter(tile => tile.resolved == false);
    var min_options = Math.min(...(unresolved_tiles.map(tile => tile.options.length)));
    
    var minimal_tiles = unresolved_tiles.filter(tile => tile.options.length == min_options);
    var tile = random_choice(minimal_tiles);

    var r = tile.position[0];
    var c = tile.position[1];

    tile.resolved = true;
    if (tile.options.length > 0) {
        var id = random_choice(tile.options);
        tile.options = [id];        

        for (var dr = -1; dr <= 1; dr++) {
            for (var dc = -1; dc <= 1; dc++) {
                if (0 <= r+dr && r+dr < R && 0 <= c+dc && c+dc < C) {
                    var nbr = get_tile(r+dr, c+dc);
                    if (!nbr.resolved) {
                        var nbr_id = dr - dc > 0 ? 4 - dr - dc : (8 + dr + dc) % 8; //converts (dr,dc) to number from 0 to 7 counting clockwise from NE.
                        nbr.options = nbr.options.filter(option => valid_nbrs[id][nbr_id].includes(option));
                    }
                }
            }
        }

    }else {
        id = 21;
    }

    
    var t = draw.image(`tiles/${id % offset}.svg`);
    t.move((c-0.2)*L, (r-0.2)*L).size(L*1.2, L*1.2);

    // check if tile needs flipping
    if (id >= offset) {
        t.transform({
            scaleY: -1,
            rotate: -90,
        });
    }

    // check if gap needs filling later
    if (tile_codes[id][2] == "W") {
        gaps.push([r,c,"SE"]);
    }

    if (tile_codes[id][4] == "W") {
        gaps.push([r,c,"SW"]);
    }

    if (tile_codes[id][6] == "W") {
        gaps.push([r,c,"NW"]);
    }


    if (i == R*C) {
        clearInterval(loop);
        fill_gaps();  
    }

}, 0);

function fill_gaps() {
    console.log("filling gaps...")
    for (var i = 0; i < gaps.length; i++) {
        var r = gaps[i][0];
        var c = gaps[i][1];
        var t = draw.image(`tiles/20.svg`);
        t.move((c+0.2)*L, (r+0.2)*L).size(L*1.2, L*1.2);
        if (gaps[i][2] == "SW") {
            t.transform({
                scaleX: -1,
                translate: [-L*0.8,-0.2*L]
            });
        }
        if (gaps[i][2] == "NW") {
            t.transform({
                rotate: 180,
                translate: [-L*0.6,-L*0.2]
            });
        }
    }
}

