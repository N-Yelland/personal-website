
// TERMINAL APPARATUS

function write_line(data) {
    // Write strimg "data" to terminal window on a new line, scroll down to make
    // sure the new line is seen, and return a jQuery pointer to the resulting div.

    var new_line = $("<div>", {
        class: "line",
        html: data
    })

    $("#terminal-output").append(new_line)
    $("#terminal-output").scrollTop($("#terminal-output").prop("scrollHeight"))

    return new_line
}

// Ensure that clicking anyway focuses the user input region (if present), which
// otherwise might be invisible.
$(document).on("click", function () {
    $("#command-line").focus()
})

window.queue = []
window.output = []
function send(data) {
    // Adds 'data' to the end of the queue. If data is a string, it's added to
    // window.output, which keeps track of everything that's been written to
    // the screen (even if it hasn't quite appeared yet).

    window.queue.push(data)

    if (typeof(data) == "string") {
        window.output.push(data)
    }
}

function random_choice(list) {
    // Returns a random element from the array 'list'.
    return list[Math.floor(list.length * Math.random())]
}

const write_interval = 200 //ms

setInterval(function() {
    // Regularly check the front queue element. If it's a string, write it to screen.
    // If it's an object (in particular, an array), then it represents an instruction
    // other than writing-to-screen, and is passed to 'run_command'.
    if (window.queue.length > 0) {
        var data = window.queue.shift()

        if (typeof(data) == "string") {
            write_line(data)
        } else if (typeof(data) == "object") {
            run_command(data)
        }
    }
}, write_interval)

window.countdown = setInterval(function() {
    // Find the element with id "timer" (whose contents are a time-string in HH:MM format)
    // and subtract a second every second! Sends the command 'times-up' on completion.
    if ($("#timer").length > 0) {
        var timer_display = $("#timer").html().split(":")
        var mins = parseInt(timer_display[0])
        var secs = parseInt(timer_display[1])

        if (secs == 0) {
            if (mins == 0) {
                clearInterval(window.countdown)
                send(["times-up"])
                return
            }
            mins = mins - 1
            secs = 59
        } else {
            secs = secs - 1
        }

        var mm = String(mins).padStart(2, '0')
        var ss = String(secs).padStart(2, '0')

        $("#timer").html(mm + ":" + ss)
    }
}, 1000)

// DATA

const init_time = "30:00"
const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const numbers = '0123456789'

const message1 = "MEMO: dont leave the manual in the photocopier!!!!"
const message2 = "MEMO: stop using the manual as a bookmark!!! Also talk to someone about finally planning that garden!"

$.getJSON("finale/data.json", function(data) {
    // This collates the various data used throughout the finale (stored in data.json) into different
    // 'window' data-properties that can be accessed by the scripts for each part.

    for (var key of Object.keys(data)) {
        window["data_" + key] = data[key]
    }

}).then(function () {

    launch_terminal()
    
})


function run_command(data) {

    // Runs internal "commands" within the terminal at "appropriate" times
    // accounting for the staggered appearance of text in the window.

    // 'data' is a list of the form [command, arg1, ...], though most commands
    // don't have any arguments.
    
    switch (data[0]) {
        case "enable-cli":
            // enable the user input region (command-line interface)
            $("#command-line").prop('disabled', false)
            $(".prefix").show()
            $("#command-line").focus()
            break

        case "disable-cli":
            // disable the user input region
            $("#command-line").prop('disabled', true)
            $(".prefix").hide()
            break

        case "restart":
            // Restarts the process after a user error.
            // Takes one optional argument: the time to wait until restart, default is 3 seconds.
            // N.B. care is taken to maintain the state of the timer.
            window.queue = []
            var wait = data[1] || 3
            send(["disable-cli"])
            $("#cli-form").off("submit")
            send(`PROCESS WILL RESTART AUTOMATICALLY IN ${wait} SECONDS...`)
            setTimeout(function () {
                var current_time = $("#timer").html()
                $("#terminal-output").empty()
                
                send("\n### SECURITY OVERRIDE PROCESS RESTARTED ###")
                send(`\nTIME UNTIL SESSION TERMINATION: <span id='timer'>${current_time}</span>`)
                
                start_stage_1()
            }, 1000 * wait)
            break

        case "wait":
            // do nothing - used to fill up the queue when a longer pause between messages is desired.
            break

        case "temp":
            // creates a temporary message (that is not recorded in window.output)
            // there are two mandatory arguments:
            // - arg1: message, string
            // - arg2: duration, int
            // After the duration expires, the message element is removed.
            var msg = data[1]
            var duration = data[2] * 1000
            var line = write_line(msg)
            setTimeout(function () {
                line.remove()
            }, duration)
            break
        
        case "times-up":
            // broadcasts alert indicating the timer has run out.
            window.queue = []
            send(["disable-cli"])
            send(`\nSESSION HAS EXPIRED: TIME LIMIT (${init_time}) HAS BEEN EXCEEDED`)
            send("\n")
            send("PLEASE CONTACT YOUR SYSTEM ADMINISTRATOR")
        default:
            return
    }

}

function reset() {
    // Performs a "full reset" (including the timer) of the terminal window.
    // Only inteded to be called via the console for testing/maintenance purposes.
    
    if (
        window.confirm("WARNING:\n" 
            + "This is considerd CHEATING when not performed by the System Administrator.\n"
            + "Are you sure you wish to cotinue?")
    ) {
        
        window.queue = []
        $("#terminal-output").empty()
        send(["disable-cli"])

        launch_terminal()
    }
    
}

function launch_terminal() {
    // Starts the timer, and begins the first stage.

    send("\n### SECURITY OVERRIDE PROCESS INITIATED ###")

    send("\n\tPRESS ANY KEY TO BEGIN")

    $(document).on("keydown", function (e) {
        e.preventDefault()
        $(document).off("keydown")
        
        send(`\nTIME UNTIL SESSION TERMINATION: <span id='timer'>${init_time}</span>`)

        start_stage_1()
    })
    
}