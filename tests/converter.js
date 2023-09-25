$("#input").on("input", function () {
    var result = convert($(this).val());
    $("#output").html(result);
})

const bin_codes = {
    "S": "00",
    "R": "01",
    "F": "10",
    "W": "11"
}

function convert(input) {
    var bin_str = input.toUpperCase().split("").map(c => bin_codes[c]).join("");
    var dec_val = parseInt(bin_str, 2);
    var hex_val = dec_val.toString(16);
    return hex_val;
}