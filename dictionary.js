function Dictionary(successCb, failureCb)
{
    this.buildIndex = function(gamestate) {
        this.index = {};
        // strip whitespace and/or deal with dictionary weirdness
        var acceptable_word_pattern = /^([A-Z]+)\s*$/
        for(var i = 0; i < this.wordlist.length; ++i) {
            match = this.wordlist[i].match(acceptable_word_pattern);
            if (match && gamestate.canMakeWord(match[1])) {
                this.index[match[1]] = true;
            }
        }
    }
    
    this.lookupWord = function(word) {
        return this.index.hasOwnProperty(word);
    }
    
    this.enumWords = function(callback) {
        for(word in this.index) {
            if (this.index.hasOwnProperty(word)) {
                callback(word);
            }
        }
    }

    // download dictionary
    var thedict = this;
    var req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (req.readyState == 4) {
            if (req.status == 200) {
                thedict.wordlist = req.responseText.split('\n');
                successCb();
            } else {
                failureCb(req.status + " " + req.statusText);
            }
        }
    }
    req.open("GET", "dictionary.txt", true);
    req.send();
}
