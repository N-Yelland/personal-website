const requests = [
    "ACCESS", "CPU", "DATA", "DATALINK", "DISK", "MEDIA", "OVERCLOCK",
    "POWER", "RAM", "STORAGE"
]

const responses = [
    "100%", "90%", "50%", "10%", "ENABLED", "DISABLED", "DISCONNECTED",
    "CONNECTED", "ENCRYPTED", "NO DATA"
]

const success_messages = [
    "DATA REQUEST EXCHANGE COMPLETED SUCCESSFULLY",
    "SUCCESSFULLY COMPLETED DATA REQUEST EXCHANGE",
    "REQUEST EXCHANGE SUCCESSFUL",
    "COMPLETED DATA REQUEST EXCHANGE",
    "COMPLETED ALL DATA REQUESTS SUCCESSFULLY"
]


function gen_request_code() {

    /*
    Generates a request code of the following format:
        DDLL(D|L)?
    where D is any digit 0-9 and L is any letter A-Z.
    
    N.B. there is a roughly 1 in 3 chance of no 5th character.
    */

    var rc = random_choice(numbers) + random_choice(numbers)
    rc = rc + random_choice(letters) + random_choice(letters)

    if (Math.random() < 0.66) {
        rc = rc + random_choice(letters + numbers)
    }

    window.request_code = rc
    return rc
}

function start_stage_1() {

    function get_next_request(prev_request, prev_response) {
        /*
        Determines what the next request should be given the previous
        request/response pair, in accordance with the table data_request_table.
        */

        var response_index = responses.indexOf(prev_response)
    
        return window.data_request_table[prev_request][response_index]
    }

    function get_response(request, prev_requests, to_end=false) {
        /*
        Chooses a random response that would not demand a subsequent request that already
        appears in 'prev_requests', nor would it lead to the 'END' request (unless 'to_end' is true)
        */

        var available_responses = []
        var end_response;

        responses.forEach(function (response) {
            var next_request = get_next_request(request, response)
            
            if (next_request == "END") {
                end_response = response
            } else if (!(prev_requests.includes(next_request))) {
                available_responses.push(response)
            }
        })

        if (to_end || available_responses.length == 0) {
            return end_response
        }

        return random_choice(available_responses)

    }

    send("INCOMING DATA PACKET:")
    var rc = gen_request_code()
    send("\tREQUEST_CODE: " + rc)
    send(`\tSECURITY_MESSAGE: "${message1}"`)
    send("\n")
    send("\tDATA_REQUESTS:")
    
    var init_request = random_choice(requests)
    var is_end = false;
    var num_requests = random_choice([4, 5, 6, 7])
    window.num_requests = num_requests
    //console.log(num_requests)

    var previous_requests = [init_request]
    var init_response = get_response(init_request, previous_requests, is_end)
    window.correct_request = get_next_request(init_request, init_response)

    send(`\t\t${init_request}: ${init_response}`)
    //console.log("ANSWER:", window.correct_request)

    var success_message = random_choice(success_messages)
    window.success_message = success_message

    send(["enable-cli"])

    $("#cli-form").on("submit", function (e) {
        e.preventDefault()
        send(["disable-cli"])

        var input_request = $("#command-line").val().toUpperCase()
        //console.log("User Input: " + input_request)

        $("#command-line").val("")

        if (input_request == window.correct_request) {
            if (input_request == "END") {
                send("\n")
                send(`${success_message} (${num_requests} total)`)

                start_stage_2()

            } else {
                previous_requests.push(input_request)

                if (previous_requests.length == num_requests) {
                    is_end = true
                }

                var response = get_response(input_request, previous_requests, is_end)

                if (response != "END") {
                    send(`\t\t${input_request}: ${response}`)
                    send(["enable-cli"])

                    window.correct_request = get_next_request(input_request, response)
                    //console.log("ANSWER: " + window.correct_request)
                }
            }
        } else {
            if (requests.includes(input_request)) {
                var error_msg = "BAD_REQUEST"
            } else {
                var error_msg = "UNKNOWN_REQUEST"
            }
            send(`ERROR: ${error_msg}: "${input_request}"`)
            send(["restart"])
        }
    })
}