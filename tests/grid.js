
/* The Quiz Grid */

$(".q").click(function (e) {
    if ($(e.target).hasClass("q-front")) {
        $("#screen").delay(800).fadeIn();
        $(this).addClass("open");
    }
})

// Button functionality

$(".q .close").click(function () {
    var qid = $(this).closest(".q").attr("id");
    $(`#${qid} .q-back > div`).animate({opacity: 0, "z-index":2}, {
        duration: 600,
        complete: function () {
            $(`#${qid}`).removeClass("open");
            $(`#${qid}`).css({"z-index": 2});
            $("#screen").delay(100).fadeOut(800, function () {
                $(`#${qid}`).addClass("closed");
                $(`#${qid}`).css({"z-index": 0});
            });
        },
    });
    setTimeout(function() {update_questions(qid);}, 1000);
});

function update_questions (qid) {
    $(".q:not(.closed)").addClass("dull")
    var id_num = parseInt(qid.replace("q",""));
    var r = Math.floor(id_num / R), c = id_num % C;
    var ids = [];
    if (c-1 >= 0) {ids.push(C*r + c - 1);}
    if (c+1 < C) {ids.push(C*r + c + 1);}
    if (r-1 >= 0) {ids.push(C*(r-1) + c);}
    if (r+1 < R) {ids.push(C*(r+1) + c)};

    var refill_needed = ids.every(function (id) {
        return $(`#q${id}`).hasClass("closed");
    });

    if (!refill_needed) {
        ids.forEach(function (id) {
            setTimeout(function () {
                $(`#q${id}`).removeClass("dull");
            }, 500);
        });
    } else {
        console.log("Refill Needed!");
    }
}