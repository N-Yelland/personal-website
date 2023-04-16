const correct_answer = [
    "JE B",
    "G JO",
    "FFA DK",
    "SG JP",
    "FQOTO JH",
    "CN BL",
    "HOTS MA",
    "TTWH KH",
    "R BH",
    "FO BB"
]

$(document).ready(function () {
    $(".draggable").each(function () {
        // console.log($(this).html())
    
        var container = $(this).parent()
        var num_children = container.children().length
    
        $(this).css({
            top: container.offset().top + (($(this).index() + 1) * container.height() / (num_children + 1)) - $(this).height()/2,
            left: container.offset().left  + (container.width()- $(this).width())/2
        })
    
        $(this).on("mousedown", function (e) {
            window.mouse_offset = {
                x: e.pageX - $(this).offset().left,
                y: e.pageY - $(this).offset().top
            }
            if ($(".draggable.dragged").length == 0) {
                $(this).addClass("dragged")
                $(this).css("z-index", 3)
            }
        })
    })
    
    $(document).on("mousemove", function(e) {
        $(".draggable").each(function () {
            if ($(this).hasClass("dragged")) {
                $(this).css({
                    top: e.pageY - window.mouse_offset.y,
                    left: e.pageX - window.mouse_offset.x
                })
            }
        })
    
    })
    
    $(document).on("mouseup", function () {
        $(".draggable").removeClass("dragged")
        
        // re-align elements
        var elements = []
        $(".draggable").each(function () {
            elements.push($(this))
        })
    
        elements.sort((a, b) => a.offset().top - b.offset().top)
    
        var container = $(".order-box")
        var num_children = container.children().length
    
        elements.forEach(function (element, index) {
            element.animate({
                top: container.offset().top + ((index + 1) * container.height() / (num_children + 1)) - element.height()/2,
                left:  container.offset().left  + (container.width()- element.width())/2
            }, 250, function () {
                $(".draggable").css("z-index", 1)
            })
        })

        var answer = elements.map(e => e.html())
        console.log(answer)
        if (JSON.stringify(answer) == JSON.stringify(correct_answer)) {
            $(".draggable").off("mousedown")
            $(".draggable").addClass("done")
            complete_puzzle()
        }
    
    })
})

