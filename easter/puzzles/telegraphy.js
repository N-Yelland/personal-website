
var context = new AudioContext();

function make_buzzer() {
    var oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.value = 740;
    oscillator.connect(context.destination);

    return oscillator
}

function beep(duration) {
    var buzzer = make_buzzer()

    buzzer.start();
    $("#light").addClass("lit")
    setTimeout(function () {
        buzzer.stop();
        $("#light").removeClass("lit")
    }, duration);
}

// Beep for 500 milliseconds

const message = "..../---/.-../-.--|.../.--./-.--|--/.-/..-/-./-../-.--"
var unit_duration = 300

$(document).ready(function () {

    var timeouts = []
    $("#play-button").on("click", function () {

        if (!$("#play-button").hasClass("pressed")) {

            $("#play-button").addClass("pressed")
            $("#send-button").addClass("disabled")
            var wait = 0
            message.split("").forEach(function (symbol) {
                var duration = 0

                if (symbol == ".") {
                    duration = 1
                } else if (symbol == "-") {
                    duration = 3
                }

                if (duration > 0) {
                    var to = setTimeout(function () {
                        beep(duration * unit_duration)
                        //console.log(symbol)
                    }, wait)
                    wait = wait + ((duration + 1) * unit_duration)
                    timeouts.push(to)
                }

                if (symbol == "/") {
                    wait = wait + (3 * unit_duration)
                } else if (symbol == "|") {
                    wait = wait + (7 * unit_duration)
                }
            })

            var to = setTimeout(function () {
                $("#play-button").removeClass("pressed")
                $("#send-button").removeClass("disabled")
            }, wait)
            timeouts.push(to)
        } else {
            timeouts.forEach(clearTimeout)
            $("#play-button").removeClass("pressed")
            $("#send-button").removeClass("disabled")
        }
        
    
    })

    var active_buzzer
    var t0, t1
    var user_message = ""
    var msg_timeout, letter_timeout

    function message_append(text) {
        if (user_message == "") {
            $("#message").html("")
        }
        var curr_text = $("#message").html()
        $("#message").html(curr_text + text)
        user_message = user_message + text
    }

    function reset_message() {
        user_message = ""
        $("#message").html("TRANSMITTER READY")
    }
    
    $("#send-button").on("mousedown", function () {
        active_buzzer = make_buzzer()
        clearTimeout(msg_timeout)
        clearTimeout(letter_timeout)

        active_buzzer.start();
        $("#light").addClass("lit")

        t0 = new Date().getTime()
    })

    $("#send-button").on("mouseup", function () {
        active_buzzer.stop();
        $("#light").removeClass("lit")

        t1 = new Date().getTime()
        p0 = t1

        var duration = t1 - t0

        if (duration < 1.5 * unit_duration) {
            message_append(".")
        } else {
            message_append("-")
        }

        if (user_message == "--./---/---/-..") {
            $("#send-button").off("mouseup mousedown")
            $("#message").addClass("correct")
            complete_puzzle()
            return
        }

        letter_timeout = setTimeout(function () {
            message_append("/")
        }, 4 * unit_duration)
        msg_timeout = setTimeout(reset_message, 3000)
        
    })


})

