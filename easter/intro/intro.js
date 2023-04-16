const password = "HopHopHop2023"

function acronymise(selector) {

    $(selector).each(function() {

        var text=$(selector).html()

        var html1 = text.replace(/\b\w*?\|/g, function (match) {
            return `<span class="bold">${match.slice(0, -1)}</span>`
        })

        var html2 = html1.replace(/(?<=<\/span>).*?(?=(?:<span)|$)/g, function (match) {
            return `<span class="removable">${match}</span>`
        })

        $(this).html(html2)

    })

}

$(document).on("click", function () {
    $("#password").focus()
})

$(document).ready(function() {

    acronymise("#line1")
    acronymise("#line2")
    $(".big-text, #subtitle, #password-entry").css("opacity", 0)

    const duration = 2000
    const bootup_sfx = new Sound("../sounds/powerup.wav")
    const success_sfx = new Sound("../sounds/correct.wav")
    const error_sfx = new Sound("../sounds/error.wav")

    $("#logo").on("click", function () {

        bootup_sfx.play()
        $("html").css({
            "pointer-events": "none",
            "cursor": "none"
        })
        $(".big-text").animate({"opacity": 1}, 500)

        setTimeout(function () {
            $("span").each(function (index) {
                let self = this
                setTimeout(function () {
                    
                    if ($(self).hasClass("bold")) {
                        $(self).css({"font-weight": "bold"})
                    }
                    if ($(self).hasClass("removable")) {
                        $(self).css({"color": "gray"})
                    }
                }, 300*Math.floor(index/2))
            })
    
            setTimeout(function () {
                $("span.removable").animate({
                    "opacity": 0
                }, duration/2, function () {
    
                    $("span.removable").animate({
                        "width": 0
                    }, duration/2) 
    
                    $("span.bold").animate({
                        "font-size": "10vh"
                    }, duration/2)
                    
                    setTimeout(function () {
                        $("#subtitle, #password-entry").animate({"opacity": 1}, 500)
                        $("#password").focus()
                    }, duration + 1000)
    
                })
            }, 150*$("span").length)
        }, 2000)
        
    })

    $("#password-form").on("submit", function (e) {
        e.preventDefault()
        let msg = $("#message")
        let pwd = $("#password")

        let entry = pwd.val()
        pwd.val("")
        pwd.css({"visibility": "hidden"})
        
        var alert, colour
        if (entry == password) {
            alert = "ACCESS GRANTED"
            colour = "green"
            success_sfx.play()
        } else {
            alert = "ACCESS DENIED"
            colour = "red"
            error_sfx.play()
        }

        msg.html(alert)
        msg.css({
            "left": $("#password").position().left,
            "color": colour
        })
        msg.show()

        setTimeout(function() {
            if (entry == password) {
                $("#main-content div").fadeOut()
                setTimeout(function() {
                    window.location.pathname = "/home.html"
                }, 1000)
            } else {
                msg.hide()
                pwd.css({"visibility": "visible"})
                pwd.focus()
            }
    
        }, 1500)

    })


})