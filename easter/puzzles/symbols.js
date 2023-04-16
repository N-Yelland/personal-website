
var columns = ['DNBCAFLMEK', 'GFNMKJIBDO', 'GADIEBCJFH', 'LCHGIBKMAO', 'MFNIHOLEJC', 'EDGANHOKJL']

var symbol_key = {'A': '鱼',  'B': '猫',  'C': '狗',  'D': '龙', 'E': '羊', 'F': '牛',  'G': '鸡', 'H': '鸭', 'I': '马', 'J': '猪', 'K': '兔', 'L': '虎', 'M': '蛇', 'N': '鼠', 'O': '虫'}

jQuery.fn.shake = function(interval,distance,times){
    interval = typeof interval == "undefined" ? 100 : interval;
    distance = typeof distance == "undefined" ? 10 : distance;
    times = typeof times == "undefined" ? 3 : times;
    var jTarget = $(this);
    jTarget.css({
        'position': 'relative',
        'background-color': 'red'
    });
    for(var iter=0;iter<(times+1);iter++){
        jTarget.animate({ left: ((iter%2==0 ? distance : distance*-1))}, interval);
    }
    return jTarget.animate({ left: 0},interval);
}

const num_buttons = 7

function reset_puzzle() {

    var n = $(".symbol-button").length

    var selected_column = columns[Math.floor(columns.length * Math.random())]

    var char_list = selected_column.split("")

    var solution = []

    while (solution.length < num_buttons) {
        var x = Math.floor(char_list.length * Math.random())
        solution.push(char_list.splice(x, 1)[0])
    }

    var buttons = [...solution]

    solution.sort((a, b) => selected_column.indexOf(a) - selected_column.indexOf(b))

    window.answer = solution
    window.buttons = buttons
    window.progress = 0

    console.log(window.answer.map(x => symbol_key[x]))

    $(".symbol-button").shake(75, 5, 4)

    if ($(".button-box").is(":empty")) {
        var delay = 0
    } else {
        var delay = 300
    }

    setTimeout(function () {
        $(".symbol-button").fadeOut()
        $(".button-box").empty()

        window.buttons.forEach(function (value, index) {
            var symbol = symbol_key[value]
            var button = $(`<div class='symbol-button'>${symbol}</div>`)
            button.css("opacity", 0)
            button.attr("data-value", value)
            $('.button-box').append(button)

            if (index == 1 || index == 4) {
                var line_break = $("<div class='break'></div>")
                $(".button-box").append(line_break)
            }
        })
    
        $(".symbol-button").each(function (index) {
            var button = $(this)
            setTimeout(function () {
                button.animate({"opacity": 1})
            }, index * 50)
        })
    
        $('.symbol-button').on("click", function () {
            var value = $(this).attr("data-value")
            if (value == window.answer[window.progress]) {
                $(this).addClass("correct")
                window.progress ++

                if (window.progress == num_buttons) {
                    $(".symbol-button").off("click")
                    complete_puzzle()
                }
            } else {
                reset_puzzle()
            }
        })
    }, delay)
}

$(document).ready(function () {

    reset_puzzle()


})