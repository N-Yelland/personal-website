const H1 = Math.sin(Math.atan(1/Math.sqrt(2)));
const H3 = Math.sqrt(3)
const H2 = H3 - H1
const base = 0.13 // percentage from bottom of canvas
const node_size = "5vh" // radius

const dphi = 0.01
const time_step = 10 //ms
var global_speed = 1

class Node {
    constructor(svg_obj, speed=1) {
        this.svg = svg_obj
        this.speed = speed
        this.lines = {start: [], end: []}
    }

    rotate(phi) {
        var self = this
        phi = phi + (dphi * this.speed * global_speed)
        if (phi > 2*Math.PI) {
            phi = phi - 2*Math.PI
        }
        var new_cx = x_pos(Math.sin(phi))
        
        for (var line of this.lines.start) {
            $(line).animate({"svgX1": new_cx}, time_step/2)
        }
        for (var line of this.lines.end) {
            $(line).animate({"svgX2": new_cx}, time_step/2)
        }
        
        $(this.svg).animate({"svgCx": new_cx}, time_step, function() {
            setTimeout(function () {
                self.rotate(phi)
            }, time_step)
        })

        var node_id = this.svg.id;
        if (node_id == window.hover_node) {
            move_tooltip(node_id)
        }

    }
}

class Canvas {
    constructor(svg_selector) {
        this.svg = $(svg_selector);
        this.draw_queue = []
    }

    draw(shape, params, priority=0) {
        let e = document.createElementNS("http://www.w3.org/2000/svg", shape)
        
        for (const attr in params) {
            e.setAttribute(attr, params[attr])
        }
        this.draw_queue.push({shape: e, priority: priority})
        
        e.classList.add(statuses[e.id])

        if ($(e).hasClass("node")) {
            var node = new Node(e)
            return node
        } else {
            return e
        }
    }

    show() {
        while (this.draw_queue.length > 0) {
            var priorities = this.draw_queue.map(s => s.priority)
            var least_priority = Math.min(...priorities)
            
            let i = 0;
            while (this.draw_queue[i].priority != least_priority) {i ++}
            this.svg.append(this.draw_queue[i].shape)
            this.draw_queue.splice(i, 1)
        }
    }

    connect(node1, node2) {
        var l = this.draw("line", {
            "stroke": "black",
            "stroke-width": "10pt",
            "x1": node1.svg.cx.baseVal.valueAsString,
            "x2": node2.svg.cx.baseVal.valueAsString,
            "y1": node1.svg.cy.baseVal.valueAsString,
            "y2": node2.svg.cy.baseVal.valueAsString
        })
        node1.lines.start.push(l)
        node2.lines.end.push(l)
    }
}

function y_pos(y) {
    return (100 * (1 - base - (y*(1-2*base))/H3)) + "%"
}

function x_pos(x) {
    var aspect_ratio = $("#main").height()/$("#main").width()
    return (50 + aspect_ratio*100*(x*(1-2*base))/H3) + "%"
}

var init_node_data, node_data, statuses = {}
$.getJSON("node_data.json", function(data) {
    init_node_data = data
    
}).then(function () {

    //console.log(localStorage.getItem("node_data"))

    if (localStorage.getItem("node_data") == null) {
        console.log("Initialising node data from file...")
        node_data = init_node_data
        localStorage.setItem("node_data", JSON.stringify(node_data))
    } else {
        node_data = JSON.parse(localStorage.getItem("node_data"))
    }
    
    node_data.forEach(function (n) {
        statuses[n.node_id] = n.status
    })

    console.log(statuses)

    var canvas = new Canvas("#main");
    
    /*
    cursor = canvas.draw("circle", {
        "r": "2pt",
        "cx": 0,
        "cy": 0,
        "class": "cursor"
    }, Infinity)
    */

    bottom_node = canvas.draw("circle", {
        "r" : node_size,
        "cy" : y_pos(0),
        "cx" : "50%",
        "class": "node",
        "id": "bottom"
    }, 1)

    top_node = canvas.draw("circle", {
        "r" : node_size,
        "cy" : y_pos(H3),
        "cx" : "50%",
        "class": "node",
        "id": "top"
    }, 1)

    nodes = []

    for (var h of [H1, H2]) {
        for (var i = 0; i < 3; i++) {
            var phi0 = i*2*Math.PI/3
            var id = "lower"
            if (h == H2) {
                phi0 = phi0 + Math.PI/3
                id = "upper"
            }
            var node_id = id + i
            var p = canvas.draw("circle", {
                "r" : node_size,
                "cy" : y_pos(h),
                "cx" : x_pos(Math.sin(phi0)),
                "class": "node ",
                "id": node_id
            }, 1, "node")
            nodes.push(p)
            p.rotate(phi0)
        }
    }

    for (var i = 0; i < 3; i ++) {
        canvas.connect(bottom_node, nodes[i])
        canvas.connect(top_node, nodes[3+i])
        canvas.connect(nodes[i], nodes[3+i])
        canvas.connect(nodes[i], nodes[3+((2+i) % 3)])
    }

    canvas.show()

    const swipe_duration = 500 //ms
    $("#screen").animate({
        left: "90vw"
    }, swipe_duration)

    /*
    $(document).on("mousemove", function(e) {
        $(cursor).animate({
            "svgCx": e.pageX - $("#main").offset().left,
            "svgCy": e.pageY - $("#main").offset().top,
        }, 0)
    })
    */

    window.hover_wait = false;
    const max_speed = 3
    const min_speed = 0.25

    $(".node").on("mouseover", function (e) {
        clearInterval(window.speed_up)
        window.slow_down = setInterval(function() {
            if (global_speed <= min_speed) {
                global_speed = min_speed;
                clearInterval(window.slow_down)
            } else {
                global_speed = global_speed - 0.02
            }
        }, 25)

        if (!window.hover_wait) {
            window.hover_wait = true
            setTimeout(function () {
                window.hover_wait = false;
            }, 250)
            window.hover_node = e.target.id
            update_display()
            update_toolip()
        }

    })

    $(".node").on("mouseout", function (e) {
        clearInterval(window.slow_down)
        window.speed_up = setInterval(function() {
            if (global_speed >= max_speed) {
                global_speed = max_speed;
                clearInterval(window.speed_up)
            } else {
                global_speed = global_speed + 0.01
            }
        }, 25)

        if (window.hover_node != "none") {
            window.hover_node = "none"
            update_display()
            update_toolip()
        }

    })

    $(".node").on("click", function (e) {

        var this_node = node_data.find(n => n.node_id == e.target.id)
        var title = this_node.title

        if (this_node.status != "locked") {
            localStorage.setItem("current_puzzle", title)

            const swipe_duration = 500 //ms
            $("#screen").animate({
                left: "10vw"
            }, swipe_duration)
            
            $("div").fadeOut(swipe_duration)
            setTimeout(function () {
                window.location.pathname = `/puzzles/${this_node.page}.html`
            }, swipe_duration)
        }
        
    })

})

function update_display() {

    display = $("#section-title")
    
    if (window.hover_node == "none") {
        display.fadeOut()
        display.html("")
        return
    }

    var this_node = node_data.find(n => n.node_id == window.hover_node)
    var content = `-- ${this_node.status.toUpperCase()} --`

    if (content) {
        display.html(content)
        display.fadeIn()
    }

    if (this_node.status == "complete") {
        display.addClass("complete")
    } else {
        display.removeClass("complete")
    }
}

function update_toolip() {
    tooltip = $("#tooltip")

    if (window.hover_node == "none") {
        tooltip.fadeOut()
        clearInterval(window.tooltip_obfuscation)
        tooltip.html("")
        return
    }

    move_tooltip(window.hover_node)
    var this_node = node_data.find(n => n.node_id == window.hover_node)

    tooltip.html(this_node.title)
    if (!this_node.seen) {
        window.tooltip_obfuscation = obfuscate("tooltip", 0.03)
    }
    tooltip.fadeIn()

    if (this_node.status == "complete") {
        tooltip.addClass("complete")
    } else {
        tooltip.removeClass("complete")
    }

}

function move_tooltip(node_id) {
    let node = $(`#${node_id}`)
    let tooltip = $("#tooltip")
    let x = `calc(${node.offset().left}px)`
    let y = `calc(${node.offset().top}px)`
    tooltip.css({
        left: x,
        top: y
    })
}

const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWYXZ1234567890-=!£$%^&*()_+[]{};#:@~,./<>?|¬¦"
const num_chars = chars.length

function obfuscate(object_id, rate=0.25) {
    let len = $(`#${object_id}`).html().length

    handler = setInterval(function () {

        let output = ""
        while (output.length < len) {
            output += chars[Math.floor(Math.random() * num_chars)]
        }
        
        $(`#${object_id}`).html(output)

    }, rate * 1000)

    return handler
}

function reset() {
    if (window.confirm("Are you sure you wish to reset? This action cannot be undone.")) {
        localStorage.clear()
        window.location.pathname = "/intro/intro.html"
    }
}