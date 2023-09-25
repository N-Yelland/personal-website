const alph = "ABCDEFGHIHJKLMNOPQRSTUVWXYZ"
const N = 500;

// parses text file for wordlist
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

    // once dict is loaded, run the code dependent on it.
    main()
});

function main() {
    
    var wordlist = [];
    for (var i = 0; i < N; i++) {
        wordlist.push(full_dict[Math.floor(Math.random()*full_dict.length)]);
    }

    wordlist.sort((a,b) => a.length - b.length);

    window.tree = branch_list(wordlist);
}


function branch_list(list) {
    var tree = {};
    for (var i = 0; i < list.length; i++) {
        var word = list[i];
        var end = word.slice(1) == "" ? "#" : word.slice(1);
        if (tree[word[0]] == undefined) {
            tree[word[0]] = [end];
        } else {
            tree[word[0]].push(end);
        }
    }
    
    // recursively defined!
    for (const branch in tree) {
        if (tree[branch].length > 1) {
            tree[branch] = branch_list(tree[branch]);
        } else {
            tree[branch] = tree[branch][0];
        }
    }

    return tree;
}

function collapse_tree(tree) {
    var list = [];

    for (const branch in tree) {
        if (typeof tree[branch] == 'string') {
            list.push(branch + tree[branch]);
        } else {
            collapse_tree(tree[branch]).forEach(function (w) {
                list.push(branch + w);
            })
        }
    }

    return list;
}

$("#searchbox").on("input", function () {
    var query = $(this).val().toUpperCase();

    if (query == "") {
        var output = "";
    } else {
        var results = window.tree;
        for (var i = 0; i < query.length; i++) {
            var results = results[query[i]];
        }

        if (typeof results == 'string') {
            var output = query + results;
        } else {
            var words = collapse_tree(results).map(w => query + w);
            if (words.length > 20) {
                words = words.splice(0,19);
                words.push("...");
            }
            var output = words.join("<br>");
        }
    }
    
    $("#output").html(output);
});