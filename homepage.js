/*global $, SVG*/

// gets html from src for each object in class 'ext'
$(".ext").each(function(index) {
    var url = $(this).attr("src");
    fetch(url).then(response => {return response.text();})
        .then(data => {
            $(this).html(data);
            $("#home-link").addClass("current");
        });
});

// gets background images for table 'menu-boxes'
$("#menu-boxes td").each(function(index) {
    var css_img_url = "url(images/"+$(this).text()+".jpg)";
    $(this).css("background-image", css_img_url);
});

// adds random quote from quotes.json to 'quote' div
$.getJSON("quotes.json", function (data) {
    var quote = data[Math.floor(Math.random() * data.length)];
    var quote_div = document.getElementById("quote");
    quote_div.innerHTML = "&ldquo;" + quote.quote + "&rdquo;"
    
    var source = document.createElement("p");
    source.innerHTML = "&mdash;" + quote.source;
    quote_div.appendChild(source);
    
});