/* eslint-env browser */

// GLOBAL VARIABLES:
var alph = "ABCDEFGHIHJLMNOPQRSTUVWXYZ"

var game = document.getElementById("game")

// Get data from 'big_wordlist.txt'
fetch('big_wordlist.txt')
    .then(response => response.text())
    .then(data => {
    
    // split data between newlines to make array
    var raw_dict = data
        .split(/\r?\n/)
        .map(word => word.toUpperCase());
    
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
    Array.from(game.children).forEach(child => child.classList.add('hidden'));
    // unhide length-input
    show('length-input');
}

function submitLength() {
    var length = document.getElementById('length-input-box').value;
    
    // hide length-input
    hide('length-input');
    
    // build blanks-row
    var table = document.getElementById('blanks');
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
    
    //global, list of words of correct length
    dict = full_dict.filter(word => word.length == length);    
    
    startGuessing(length);
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

function startGuessing(length) {
    
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

function makeGuess(wordlist){
    
    if (wordlist.length == 1) {
        // ready to guess entire word
        console.log('Guess entire word!');
    } else if (wordlist.length == 0) {
        // word not in dictionary
        console.log('Your word isn\'t in my dictionary.');
    } else {
        // characters that can be guessed
        var charset = new Set(wordlist.join('').split(''));
        var pos_chars = Array.from(charset).filter(char => !guesses.includes(char));

        // select best ranked character that has not already been guessed
        var pos_char_ranks = pos_chars.map(char => rankChar(char, wordlist));
        var min_rank = pos_char_ranks.reduce((a,v) => v < a ? v : a);
        //global
        guess = pos_chars[pos_char_ranks.indexOf(min_rank)];

        guesses.push(guess);

        //guess 'ends' here, needs to update html

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
        
        show('guess-row');
        var msg = document.getElementById('guess-msg');
        msg.innerHTML = 'I guess... ' + guess;
    }
}

function submitLetters() {
    
    // update html
    var letters = Array.from(document.getElementById('top-row').children);
    for (i=0; i < letters.length; i++) {
        if (letters[i].children.length > 0) {
            word[i] = letters[i].children[0].innerHTML;
            letters[i].innerHTML = word[i];
        }
    }
    
    var d_pos = getMatches(dict, word, guesses);
    console.log(d_pos);
    
    makeGuess(d_pos);
}

function clickLetter() {
    this.innerHTML = (this.innerHTML == '_') ? guess : '_';
}

$(document).ready(function(){    

    startNewGame();
    
});
