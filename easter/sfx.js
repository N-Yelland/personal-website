
class Sound {
    constructor(src) {
        this.el = document.createElement("audio");
        this.el.src = src;
        this.el.setAttribute("preload", "auto");
        this.el.setAttribute("controls", "none");
        this.el.style.display = "none";
        document.body.appendChild(this.el);
    }

    play() {
        this.el.play();
    }

    stop() {
        this.el.pause();
    }

}