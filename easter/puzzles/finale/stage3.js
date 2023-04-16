var A, B
const master_key_length = 8

function start_stage_3() {

    var labels = window.data_label_table.flat(1)

    chunky_shuffle(labels, 8)
    
    var block_dict = {}
    var blocks = labels.map(function (label) {
        let block = generate_block()
        block_dict[label] = block

        var data_bytes = block.data_bytes.join(" ")
        return `${label}: ${data_bytes} // ${block.instruction} ${block.destination}`
    })

    send("\n")
    send("OPENING SECURE CONNECTION TO MASTER KEY FILE...")
    send("Connection: <span id='stability'>STABLE</span>")

    make_file_pane("mk_file", blocks)

    var root_label = random_choice(labels)
    A = random_choice([1,2,3,4,5,6])
    B = random_choice([A-1, A, A+1])

    var master_key_bytes = extract_master_key(block_dict, root_label, A, B)
    var master_key = master_key_bytes
        .map(byte => String.fromCharCode(parseInt(byte, 16)))
        .join("")
    //console.log(master_key)
    
    var total_correct_inputs = 0

    send(`ROOT:${root_label}\tA:${A} B:${B}\t\tL:<span id="line-num">0</span>`)
    send("\n")
    send("\tMASTER_KEY: <span id='mk'></span>")
    send("\n")

    $("#cli-form").off("submit")
    send(["enable-cli"])
    
    $("#cli-form").on("submit", function (e) {
        e.preventDefault()

        var user_input = $("#command-line").val()
        $("#command-line").val("")

        if (user_input.length != 1) {
            send(["temp", "WARNING: YOU MUST SUBMIT ONE CHARACTER AT A TIME", 3])
        } else {

            if (user_input == master_key[total_correct_inputs]) {
                total_correct_inputs += 1
                $("#mk").html(master_key.slice(0, total_correct_inputs))

                if (total_correct_inputs == master_key_length) {
                    // Master Key complete and all correct!
                    clearInterval(window.countdown)
                    send(["disable-cli"])
                    send("MASTER KEY ACCEPTED")
                    send("COMMENCING SECURITY OVERRIDE...")
                    send("<span id='loading-bar'></span")
                    // command "finish" will be executed once
                    // loading bar is complete
                }

            } else {
                send(["temp", "ERROR: DECRPYTION_ERROR: MALFORMED_KEY", 3])
                reduce_stability()

                if (stability_level == 0) {
                    send("CONNECTION TO MASTER KEY FILE LOST")
                    send(["restart", 10])
                }
            }
        }
    })

    var loading_bar_listener = setInterval(function () {
        if ($("#loading-bar").length > 0) {
            fill($("#loading-bar"), 1000, 40, finish)
            clearInterval(loading_bar_listener)
        }
    }, 500)

}

function make_file_pane(id, data) {
    send(`<div id='${id}' class='pane'></div>`)
    var file_open_listener = setInterval(function () {
        if ($(`#${id}`).length > 0) {
            open_file(id, data)
            clearInterval(file_open_listener)
        }
    }, 500)
}

var stability_level = 3
var stability_levels = [
    {label: "LOST", percentage: 0.0},
    {label: "FAILING", percentage: 0.3},
    {label: "UNSTABLE", percentage: 0.6},
    {label: "STABLE", percentage: 0.9}
]

var stability = stability_levels[stability_level].percentage
function reduce_stability() {
    stability_level = stability_level - 1
    stability = stability_levels[stability_level].percentage
    $("#stability").html(stability_levels[stability_level].label)

}

function open_file(id, data) {
    var pane = $(`#${id}`)
    var curr_top_line = 0
    var height = 8

    // initial display
    function display(top_line) {
        var lines = data.slice(top_line, top_line + height)
        
        for (var i = 0; i < height; i++) {
            if (Math.random() > stability) {
                lines[i] = lines[i].slice(0, 5) + " " + "#".repeat(26)
            }
        }
        pane.html(lines.join("\n"))
        $("#line-num").html(curr_top_line)
    }
    
    display(curr_top_line)

    $(document).on("keydown", function (e) {
        // Up arrow pressed
        if (e.keyCode == 38) {
            e.preventDefault()
            if (curr_top_line > 0) {
                curr_top_line = curr_top_line - 1
                display(curr_top_line)
            }
            
        }

        // Down arrow pressed
        if (e.keyCode == 40) {
            e.preventDefault()
            if (curr_top_line < data.length - height) {
                curr_top_line = curr_top_line + 1
                display(curr_top_line)
            }
        }
    })

}


// UTILITY FUNCTIONS

function chunky_shuffle(array, iterations) {

    for (let i = 0; i < iterations; i++) {
        var start = Math.floor(Math.random() * array.length)
        var size = Math.floor(Math.random() * (array.length - start))
    
        var chunk = array.splice(start, size)
        array.push(...chunk)
    }
}

const printable_chars = "!#$%&*+-=/.0123456789:;?@ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz^_|"

function generate_instruction() {
    var left = random_choice("012345678abc")
    var right = random_choice("012345678abc")

    return left + right
}

function generate_destination() {
    var left = random_choice("0123")
    var right = random_choice("0123456789abcdef")

    return left + right
}

function generate_block() {
    var data_bytes = []
    for (var i = 0; i < 6; i++) {
        data_bytes.push(random_choice(printable_chars).charCodeAt(0).toString(16))
    }

    return {
        data_bytes: data_bytes,
        instruction: generate_instruction(),
        destination: generate_destination()
    }
}

function get_action(instruction) {

    var range, action
    
    if (/[0-9]/.test(instruction[1])) {
        range = instruction[0] + "N"
    } else {
        range = instruction[0] + "L"
    }

    range = range.toUpperCase()

    for (var key of Object.keys(window.data_instruction_lookup)) {
        if (key.includes(range)) {
            action = window.data_instruction_lookup[key]
            break
        }
    }

    return action
}

function get_destination(destination) {
    
    var col = parseInt(destination[0])
    var row = parseInt(destination[1], 16)

    return window.data_label_table[col][row]

}

function select_byte(data_bytes, xyz, A, B) {
    if (A < B) {
        return data_bytes[xyz[0]-1]
    }
    if (A == B) {
        return data_bytes[xyz[1]-1]
    }
    if (A > B) {
        return data_bytes[xyz[2]-1]
    }
}

function extract_master_key(block_data, root, A, B, depth=0) {

    if (depth == master_key_length) {
        return ""
    }
    
    var block = block_data[root]
    var action = get_action(block.instruction)
    var next_label = get_destination(block.destination)
    var new_byte = select_byte(block.data_bytes, action.xyz, A, B)

    A = A + action.ab[0]
    B = B + action.ab[1]

    return [new_byte, ...extract_master_key(block_data, next_label, A, B, depth+1)]

}

function fill (bar, rate, width, complete) {
    for (let i = 0; i <= width; i++) {
        setTimeout(function () {
            var percentage = Math.round(100*i/width)
            var text = "[" + "=".repeat(i) + " ".repeat(width-i) + "] " + percentage + "%"
            bar.html(text)
        }, rate*i + rate*(Math.random() - 0.5))
    }

    setTimeout(complete, rate*(width+1))
}

function finish() {
    complete_puzzle()
    send("\nSECURITY OVERRIDE COMPELTE")
    send("LAUNCHING TERMINAL IN 'full_access' MODE...")

    $("#cli-form").off("submit")
    send(["enable-cli"])
    
    $("#cli-form").on("submit", function (e) {
        e.preventDefault()

        var user_input = $("#command-line").val()
        $("#command-line").val("")

        send(user_input)

        if (user_input != "show_secret()") {
            send(`ERROR: Unrecognised Command: "${user_input.split(" ")[0]}"\n`)
        } else {
            send("FOUND (1) SECRET:\n")
            send("I lied about the out-of-bounds zones...")
            send("You can find the Grand Prize in a location oft guarded by a Fearsome Beast")
            send("Beath Machines than control the forces of Darkness and Time")
        }
    
    })
}