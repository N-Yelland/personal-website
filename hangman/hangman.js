/* HANGMAN in JAVASCRIPT */

// Get data from 'big_wordlist.txt'
fetch('big_wordlist.txt')
    .then(response => response.text())
    .then(data => {
    
    // split data between newlines to make array
    var raw_dict = data
        .split(/\r?\n/)
        .map(word => word.toUpperCase());
    
    var alph = "ABCDEFGHIHJLMNOPQRSTUVWXYZ"
    // filter out all words that contain characters not present in alph
    // full_dict contains all words
    full_dict = raw_dict.filter(function(word){
        return word.split('').every(char => alph.includes(char));   
    });  
});

function hide(elementid) {
    document.getElementById(elementid).classList.add('hidden');
}
function show(elementid) {
    document.getElementById(elementid).classList.remove('hidden');
}

function startNewGame() {
    // hides all objects
    var game = document.getElementById("game")
    Array.from(game.children).forEach(child => child.classList.add('hidden'));
    hide('guesses');
    // unhide length-input
    show('length-input');
    
    //begins image loop, as global variable
    imgloop = setInterval(nextImage, 500);
}

function submitLength() {
    var length = document.getElementById('length-input-box').value;
    
    // stops image loop
    clearInterval(imgloop);
    var imgdiv = document.getElementById('image');
    imgdiv.src = 'images/0-fails.jpg';
    imgdiv.setAttribute('data-num', 0);
    
    // hide length-input
    hide('length-input');
    
    // build blanks-row
    var table = document.getElementById('blanks');
    table.innerHTML = '';
    var row = document.createElement('tr');
    table.appendChild(row);
    row.id = 'top-row'
    for (i=0; i < length; i++) {
        var blank = document.createElement('td');
        row.appendChild(blank);
        blank.id = "letter-" + i;
        blank.innerHTML = "_"
        
    }
    show('blanks-row');
    show('guesses');
    
    //global, list of words of correct length
    dict = full_dict.filter(word => word.length == length);    
    
    //global, letters of word, unknown letters are '_'
    word = Array(length)
    word .fill('_');
    
    //global, list of guessed characters
    guesses = [];
    
    // dictionary of possible words
    var d_pos = dict;
    // (intialised to dict, updated after each guess)
    
    makeGuess(d_pos);
}

function getMatches(wordlist, pattern, guesses) {
    // returns all words in wordlist that match pattern of word, and
    // that dont use guessed characters.
    
    var exclude = guesses.length > 0 ? '[^' + guesses.join('') + ']' : '.';
    var re = new RegExp('^' + pattern.join('').replace(/_/g, exclude) + '$', 'g');

    var matches = wordlist.filter(word => word.match(re));
    return matches;
}

function rankChar(char, wordlist) {
    // returns 'rank' for how good a guess the letter char is, i.e: how close
    // the proportion of words in wordlist that contain char is to 50/50
    // lower rank is better, 0 is ideal.
    
    var n = wordlist.reduce((a,v) => v.includes(char) ? a + 1 : a, 0);
    return Math.abs(n/wordlist.length - 0.5);
}

function makeGuess(wordlist){
    
    if (wordlist.length <= 1) {
        // ready to guess entire word
        
        hide('guess-row');
        show('final-guess');
        var msg = document.getElementById('final-guess-msg');
        
        if (wordlist.length == 1) {
            msg.innerHTML = 'I think your word is <span class="blue">'+ wordlist[0] + '</span>';
            
            var letters = Array.from(document.getElementById('top-row').children);
            for (i=0; i < letters.length; i++) {
                if (letters[i].innerHTML == '_') {
                    letters[i].innerHTML = '<span class="blue">' + wordlist[0][i] + '</span>';
                }
            }
            
        } else {
            msg.innerHTML = 'Your word isn\'t in my dictionary!'
        }
    } else {
        // console info
        var N = wordlist.length;
        console.log('Considering ' + N + ' words, expecting to need '
                    + Math.round(Math.log2(N)) + ' guesses.');
        
        // characters that can be guessed
        var charset = new Set(wordlist.join('').split(''));
        var pos_chars = Array.from(charset).filter(char => !guesses.includes(char));

        // select best ranked character that has not already been guessed
        var pos_char_ranks = pos_chars.map(char => rankChar(char, wordlist));
        var min_rank = pos_char_ranks.reduce((a,v) => v < a ? v : a);
        //global
        guess = pos_chars[pos_char_ranks.indexOf(min_rank)];

        guesses.push(guess);

        // update html
        var letters = Array.from(document.getElementById('top-row').children);
        for (td of letters) {
            if (td.innerHTML == '_') {
                td.innerHTML = '';
                var btn = document.createElement('button');
                td.appendChild(btn);
                
                //btn.id = td.id + '-btn';
                btn.innerHTML = '_';
                btn.onclick = clickLetter;
            }
        }
        
        document.getElementById('guesses').innerHTML = guesses.join(' ');
        
        show('guess-row');
        var msg = document.getElementById('guess-msg');
        msg.innerHTML = 'I guess... ' + guess;
    }
}

function submitLetters() {
    
    // update html
    var letters = Array.from(document.getElementById('top-row').children);
    var hit = false
    for (i=0; i < letters.length; i++) {
        if (letters[i].children.length > 0) {
            word[i] = letters[i].children[0].innerHTML;
            if (!(word[i] == '_')) {
                hit = true;
            }
            letters[i].innerHTML = word[i];
        }
    }
    
    // guessed wrong...
    if (!hit) {
        // out of lives?
        if (nextImage() == 9) {
            hide('guess-row');
            show('final-guess');
            var msg = document.getElementById('final-guess-msg');
            msg.innerHTML = 'I\'m out of lives, you win!'
                + '<br>Was your word any of these?<br>' + getMatches(dict, word, guesses).join(' ')
            ;
        
        // carry on...
        } else {
            var d_pos = getMatches(dict, word, guesses);
            makeGuess(d_pos);
        }
    } else {
        // guessed last letter...
        if (!word.includes('_')) {
            hide('guess-row');
            show('final-guess');
            var msg = document.getElementById('final-guess-msg');
            msg.innerHTML = 'I win! Your word is <span class="blue">' + word.join('') + '</span>';

        // guessed correct but not finished...
        } else {
            var d_pos = getMatches(dict, word, guesses);
            makeGuess(d_pos);
        }
    }
}

function clickLetter() {
    this.innerHTML = (this.innerHTML == '_') ? guess : '_';
}

function nextImage() {
    var imgdiv = document.getElementById('image');
    var n = (parseInt(imgdiv.getAttribute('data-num')) + 1) % 10;
    imgdiv.setAttribute('data-num', n);
    imgdiv.src = 'images/' + n + '-fails.jpg';
    return n;
}

$(document).ready(function(){    
    startNewGame();
});
