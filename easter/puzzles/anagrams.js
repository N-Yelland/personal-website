
function get_answer(entry_box) {
    var answer = ""
    entry_box.children().each(function () {
        if ($(this).html()) {
            answer = answer + $(this).html()
        } else {
            answer = answer + "_"
        }
        
    });

    return answer
}

const correct_answers = [
    "FLORENTINE", "BENEDICT", "HARDBOILED"
]

$(document).on("keyup", function () {
    
    var num_correct = 0
    $(".entry-box").each(function (index) {
        var answer = get_answer($(this))
        //console.log(answer)

        if (answer == correct_answers[index]) {
            cement($(this))
            num_correct ++
        }
    })

    if (num_correct == correct_answers.length) {
        complete_puzzle()
    }

})