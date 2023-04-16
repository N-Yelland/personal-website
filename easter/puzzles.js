function complete_puzzle() {

    $(".title").addClass("complete")

    var current_puzzle = localStorage.getItem("current_puzzle")

    var this_node = node_data.find(n => n.title == current_puzzle)
    this_node.status = "complete"

    // check for unlockable nodes
    var statuses = {}
    node_data.forEach(function (n) {
        statuses[n.node_id] = n.status
    })

    node_data.forEach(function (n) {
        if (n.prereqs && n.status == "locked") {
            if (n.prereqs.every(id => statuses[id] == "complete")) {
                console.log("Unlock " + n.title)
                n.status = "unlocked"
            }
        }
    })

    localStorage.setItem("node_data", JSON.stringify(node_data))

    console.log(localStorage.getItem("node_data"))
}

var node_data;
$(document).ready(function() {

    node_data = JSON.parse(localStorage.getItem("node_data"))
    var current_puzzle = localStorage.getItem("current_puzzle")

    var this_node = node_data.find(n => n.title == current_puzzle)

    const swipe_duration = 500 //ms
    $("#screen").animate({
        left: "-80vw"
    }, swipe_duration)

    $("#return-btn").on("click", function () {

        localStorage.setItem("node_data", JSON.stringify(node_data))

        const swipe_duration = 500 //ms
        $("#screen").animate({
            left: "10vw"
        }, swipe_duration)
        
        setTimeout(function () {
            window.location.pathname = "/home.html"
        }, swipe_duration)
    })

    //deobfuscate(".title")

    if (!this_node.seen) {
        this_node.seen = true
        deobfuscate(".title", 1, 4)
        deobfuscate(".main-text p", 2, 4)
    } else {
        deobfuscate(".title", 0, 2)
        deobfuscate(".main-text p", 1, 2)
    }


    setInterval(function() {
        $("span.obfuscated").each(function() {
            let i = Math.floor(Math.random() * num_chars)
            $(this).html(chars[i])
        })
    }, 25)

    $(".entry-box").each(function () {
        var n = $(this).attr("data-size")

        if (!n) {
            var input_box = $("<div>", {
                class: "wide-input-box",
                contentEditable: "true",    
            })

            input_box.appendTo(this)

            input_box.on("keydown", function (e) {
                if (e.key == "Enter") {
                    console.log("submitting...")
                    e.preventDefault()

                    var correct_answer = $(this).parent().attr("data-answer")
                    var answer = $(this).html()
                    
                    if (correct_answer.toUpperCase() == answer.toUpperCase()) {
                        cement($(this).parent())
                        complete_puzzle()

                    }
                }
            })

            return;
        }

        for (var i= 0; i < n; i ++) {
            var input_box = $("<div>", {
                class: "input-box",
                contentEditable: "true",
                maxlength: 1,
            })
            
            input_box.appendTo(this)

            input_box.get(0).addEventListener("beforeinput", function (e) {
                if((e.inputType.slice(0,6) == "insert" && e.target.innerHTML.length) > 0 || e.inputType != "insertText") {
                    e.preventDefault()
                }
            })

            input_box.on("keydown", function(e) {
                e.preventDefault()

                switch (e.key) {
                    case "Backspace":
                        $(this).html("")
                        $(this).prev().focus()
                        break
                    case "Delete":
                        $(this).html("")
                        break
                    case "ArrowLeft":
                        $(this).prev().focus()
                        break
                    case "ArrowRight":
                        $(this).next().focus()
                    default:
                        if (e.key.match(/^[a-zA-Z]$/)) {
                            $(this).html(e.key.toUpperCase())
                            $(this).next().focus()
                        }
                }
            })
        }
    })

    $(".picture-box img").on("click", function () {
        enlarge($(this))
    })

})

const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWYXZ1234567890-=!£$%^&*()_+[]{};#:@~,./<>?|¬¦"
const num_chars = chars.length

function deobfuscate(selector, wait=3, duration=5) {

    $(selector).each(function () {

        let self = $(this)
        
        let text = self.html()
        let len = text.length

        let indices = Array.from(new Array(len), (_, i) => i)
        let durations = Array.from(new Array(len-1), (_) => Math.random() * duration * 1000)
        durations.push(duration * 1000)

        shuffleArray(indices)
        durations.sort(function(a, b){return a-b})

        const blank = `<span class='obfuscated'>?</span>`
        self.html(blank.repeat(len))
        
        setTimeout(function () {
            for (let j = 0; j < indices.length; j++) {
                setTimeout(function () {
                    let new_text = ""
                    for (let i = 0; i < len; i++) {
                        if (indices.slice(0,j+1).includes(i)) {
                            new_text = new_text + text[i]
                        } else {
                            new_text = new_text + blank
                        }
                    }
                    self.html(new_text)
                }, durations[j])
            }
        }, wait * 1000)

    })
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}


function enlarge(obj, f=0.8) {
    var big_ver = $("<div id='big_ver'>").append(obj.clone());
    big_ver.children("img").css({height: "100%"});

    var H = $(window).height();
    var W = $(window).width();
    var h = $(obj).height();
    var w = $(obj).width()

    var top = 0.5*H*(1-f);
    var left = 0.5*(W - w*f*H/h);

    var state1 = {
        position: "fixed",
        height: obj.height(),
        top: obj.offset().top,
        left: obj.offset().left
    }

    var state2 = {
        top: top,
        left: left,
        height: 100*f + "vh"
    }

    big_ver.css(state1);
    big_ver.delay(50).animate(state2, 500);

    big_ver.click(function () {
        big_ver.animate(state1, 500, function () {
            $(this).remove();
        });
    });

    $("main").append(big_ver);
}

function cement(entry_box) {
    entry_box.children().prop("contentEditable", false)
    entry_box.children().css({
        background: "transparent",
        "font-weight": "bold"
    })
}