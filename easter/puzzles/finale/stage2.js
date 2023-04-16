
function gen_cid() {
    var cid = String(Math.floor(Math.random() * 10000))

    // This awkward condition prevents an inifinite loop in the flowchart.
    if (Math.random() < 0.33 && !(
        !anythingInCommon(window.request_code, "AEIOU") && 
        parseInt(cid.slice(-1)) % 2 == 1
        )
    ) {
        cid = "0" + cid
    }

    //console.log("CID:", cid)
    window.cid = cid
    return cid
}

const auth_request_messages = ["AUTH_KEY", "AUTHENTICATION_KEY", "KEY"]

function get_auth_request_message() {
    // ensure that at least one Venn condition is met
    if (window.num_requests < 6 && window.request_code.length == 4) {
        return "AUTH_KEY"
    }
    return random_choice(auth_request_messages)
}

function get_version() {
    var all_output = (window.output).join("\n")
    var key = ""
    if (all_output.includes("AUTH_KEY")) {
        key = key + "A"
    }
    if (window.num_requests >= 6) {
        key = key + "R"
    }

    if (window.request_code.length == 5) {
        key = key + "F"
    }

    var version = window.data_venn_lookup[key]
    //console.log(key, version, window.request_code)
    window.version = version
    return version

}

function get_valid_PIN() {

    var version = get_version()
    var candidate_PINs = window.data_PIN_table[version]
    var PIN

    for (var i = 0; i < candidate_PINs.length; i ++) {
        var candidate_PIN = candidate_PINs[i]
        if (anythingInCommon(candidate_PIN, window.request_code)) {
            PIN = candidate_PIN
            break
        }
    }

    return PIN
}

function start_stage_2 () {

    send("\n")
    send("CONNECTING TO AUTHENTICATION SERVER...")
    rand_wait()

    var cid = gen_cid()
    send(`CONNECTED (CONNECTION ID: ${cid})`)

    send("INCOMING AUTHENTICATION REQUEST:")
    send(`\tREQUEST_MESSAGE: "${message2}"`)

    var auth_request_message = get_auth_request_message()
    send(`\t${auth_request_message}: <span id="key_placeholder"></span>`)

    var PIN = get_valid_PIN()
    var username = get_username()

    window.auth_key = username + "#" + PIN
    //console.log(window.auth_key)

    $("#cli-form").off("submit")
    send(["enable-cli"])

    $("#cli-form").on("submit", function (e) {
        e.preventDefault()

        var user_input = $("#command-line").val()
        $("#command-line").val("")
        $("#key_placeholder").html(user_input)
        send(["disable-cli"])
        send("\n")
        send("\tVALIDATING AUTHENTICATION KEY...")
        rand_wait()

        if (user_input == window.auth_key) {
            send("\n")
            send("\tSUCCESSFULLY VALIDATED AUTHENTICATION KEY")
            send("CLOSED CONNECTION TO AUTHENTICATION SERVER")

            start_stage_3()
        } else {
            var errors = []
            if (user_input.split("#").length != 2) {
                errors.push("BAD_KEY")
            } else {
                var user_username = user_input.split("#")[0]
                var user_PIN = user_input.split("#")[1]
                if (user_username != username) {
                    errors.push("WRONG_USERNAME")
                }
                if (user_PIN != PIN) {
                    errors.push("INCCORECT_PIN")
                }
            }

            send("ERROR: AUTHENTICATION_ERROR: " + errors.join(" "))
            send(["restart"])
        }
    })

}

// UTILITY FUNCTIONS

function anythingInCommon(a, b){
    if( b.length < a.length ) {
        return anythingInCommon(b, a)
    }

    for( var i = 0, len = a.length; i < len; i++ ) {
        if(b.indexOf(a[i]) != -1) {
            return true;
        }
    }
  
    return false
}

function rand_wait() {
    var cycles_to_wait = Math.floor(6 + Math.random() * 6)
    for (var i = 0; i < cycles_to_wait; i++) {
        send(["wait"])
    }
}