
function get_username() {

    var all_output = (window.output).join("\n")

    var first_word = window.success_message.split(" ")[0]
    var percentage_count = (all_output.match(/%/g) || []).length
    var data_count = (all_output.match(/DATA/gi) || []).length

    data = {
        first_word: first_word,
        percentage_count: percentage_count,
        connection_id: window.cid,
        request_code: window.request_code,
        data_count: data_count
    }

    modifiers = []

    return Q_first_word(data, modifiers)
}

/* data should have keys:
    1. first_word
    2. percentage_count
    3. connection_id
    4. request_code
    5. data_count
*/

function end(username, modifiers) {
    console.log(modifiers)

    if (modifiers.includes("CAP")) {
        username = username[0].toUpperCase() + username.slice(1)
    }

    if (modifiers.includes("SUF")) {
        username = username + window.request_code[0]
    }

    return username
}

function Q_first_word(data, modifiers) {
    console.log(data.first_word)
    switch (data.first_word) {
        case "REQUEST":
            return Q_percentages(data, modifiers)
        case "SUCCESSFULLY":
            modifiers.push("CAP")
            return Q_cid_first(data, modifiers)
        case "COMPLETED":
            return Q_cid_final(data, modifiers)
        case "DATA":
            return Q_rc_vowel(data, modifiers)
        default:
            return
    }
}

function Q_percentages(data, modifiers) {
    if (data.percentage_count <= 1) {
        modifiers.push("SUF")
        return end("user", modifiers)
    } else {
        return Q_cid_first(data, modifiers)
    }
}

function Q_cid_first(data, modifiers) {
    var d = parseInt(data.connection_id[0])
    if (d == 0) {
        modifiers.push("SUF")
        return Q_rc_vowel(data, modifiers)
    } else if (d <= 3) {
        return end("user", modifiers)
    } else if (d <= 6) {
        return Q_rc_char5(data, modifiers)
    } else {
        return end("server", modifiers)
    }
}

function Q_cid_final(data, modifiers) {
    var d = parseInt(data.connection_id.slice(-1))
    if (d % 2 == 1) {
        return Q_cid_first(data, modifiers)
    } else {
        return Q_data_count(data, modifiers)
    }
}

function Q_rc_vowel(data, modifiers) {
    if (anythingInCommon(data.request_code, "AEIOU")) {
        return end("host", modifiers)
    } else {
        return Q_cid_final(data, modifiers)
    }
}

function Q_rc_char5(data, modifiers) {
    if (data.request_code.length < 5) {
        modifiers.push("SUF")
        return end("server", modifiers)
    } else if (/[0-9]/.test(data.request_code[5])) {
        modifiers.push("SUF")
        return end("user", modifiers)
    } else {
        return end("admin", modifiers)
    }
}

function Q_data_count(data, modifiers) {
    if (data.data_count >= 4) {
        return end("admin", modifiers)
    } else {
        modifiers.push("CAP")
        return end("host", modifiers)
    }
}