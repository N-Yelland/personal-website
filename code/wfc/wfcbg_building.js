const W = $(window).width();
const H = $(window).height();

const draw = SVG().addTo('body').size(W,H-1);
draw.attr("id", "svg-pane")
const R = 6; // user determined


const L = H/(R-0.2)
const C = Math.ceil(W/L);


var tile_codes = {
    "0ab":  0xFFFF,
    "1ab":  0xC7FF,
    "2abc": 0x07FD,
    "3abc": 0xC03F,
    "4ab":  0x003D,
    "5ab":  0xFC3F,
    "6ab":  0x0000,
    "7ab":  0x3C00,
    "8abc": 0xFC03,
    "9a":   0xC2FF,
    "9b":   0xC2BF,
    "9c":   0x82FF,
    "10a":  0xBEFF,
    "10b":  0xFEBF,
    "10c":  0xEEBF,
    "10d":  0xFEFF,
    "11ab": 0xFEFB,
    "11c":  0xEEBB,
    "12a":  0xC2FB,
    "12b":  0xC2BB,
    "13a":  0x02F8,
    "13b":  0x02B8,
    "14ab": 0x3EC0,
    "14c":  0x3E80,
    "15a":  0xFE83,
    "15b":  0xBEC3,
    "16ab": 0x03C0,
    "16c":  0x0280,
    "17a":  0xC283,
    "17b":  0x82C3,
    "18ab": 0xC1FF,
    "19ab": 0x01FD,
    "20ab": 0x01F4,
    "21ab": 0x0034,
    "22a":  0x3C34,
    "22b":  0xC1C3
}

const raw_tile_ids = Object.keys(tile_codes);
const raw_tile_count = raw_tile_ids.length;
const offset = raw_tile_count;

function flip (x) {
    return ((x&0xC000)>>2)|((x&0x3000)<<2)|((x&0xC00)>>10)|((x&0x300)>>6)|((x&0xC0)>>2)|((x&0x30)<<2)|((x&0xC)<<6)|((x&0x3)<<10);
}

function swap (x) {
    return ((x&0xC)>>2) | ((x&0x3)<<2);
}

for (var i = 0; i < raw_tile_count; i++) {
    var id = raw_tile_ids[i];
    var code = tile_codes[id];
    if (code != flip(code)) {
        tile_codes[id + "*"] = flip(code);
    }
}

const tile_ids = Object.keys(tile_codes);
const tile_count = tile_ids.length;

const valid_nbrs = {}
for (var i = 0; i < tile_count; i++) {
    var id = tile_ids[i]
    valid_nbrs[id] = []
    for (var j=0; j < 4; j++) {
        var seek_num = swap(parseInt(get_code(id)[j],16)).toString(16);
        valid_nbrs[id][j] = tile_ids.filter(function(nbr_id) {
            if (get_code(nbr_id)[(j+2)%4] == seek_num) {
                return true;
            };
        });
    }
}

// time to collapse some wave functions!

var tiles = [];
gen_tiles();

function gen_tiles() {
    for (var r = 0; r < R; r++) {
        for (var c = 0; c < C; c++) {
            tiles[r*C + c] = {
                options: [...tile_ids],
                position: [r,c],
                resolved: false
            }
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

        for (var j = 0; j < 4; j++) {
            var dr = [-1,0,1,0][j]
            var dc = [0,1,0,-1][j]
            if (0 <= r+dr && r+dr < R && 0 <= c+dc && c+dc < C) {
                var nbr = get_tile(r+dr, c+dc);
                if (!nbr.resolved) {
                    nbr.options = nbr.options.filter(option => valid_nbrs[id][j].includes(option));
                    if (nbr.options.length == 0) {
                        var stuck = true;                        
                    }
                }
            }
        }
    }

    // deconcatenates variants...
    var sub_ids = id.match(/[a-z]/g).map(a => parseInt(id) + a);
    var sub_id = random_choice(sub_ids);

    if (!stuck) {
        var t = draw.image(`tiles_building/${sub_id}.svg`);
        t.move(c*L, r*L).size(L, L);
    
        t.attr("data-id", id.replace(/[a-z]+/g, sub_id.replace(/[0-9]/g, "")));
    
        // check if tile needs flipping
        var re = /\*/g; 
        if (re.test(id)) {
            t.transform({
                scaleX: -1,
            });
        }
    
        if (i == R*C) {
            clearInterval(loop);
        }
    } else {
        i = 0;
        $("#svg-pane").empty();
        tiles = [];
        gen_tiles();
    }
    

}, 0);

function get_code(raw_id) {
    var id_num = parseInt(raw_id);
    var id_var = raw_id.match(/[a-z]/)[0];
    var id = tile_ids.find(function(id_) {
        if (id_num == parseInt(id_)) {
            if (id_.match(/[a-z]/g).includes(id_var)) {
                return true;
            }
        }
    })
    var code = tile_codes[id];
    var re = /\*/g; 
    if (re.test(raw_id)) {
        code = flip(code);
    }
    code = code.toString(16);
    // pad with leading zeros to length of 4
    while (code.length < 4) {
        code = "0" + code;
    }

    return code;
}

function fill_gaps() {
    // nothing to do - there should be no gaps!

    // Debugging tools
    $("image").on("click", function() {
        var id = $(this).attr("data-id");
        console.log(id, get_code(id));

    });

}


