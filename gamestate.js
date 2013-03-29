var WIDTH = 5;
var HEIGHT = 5;
var COUNT = WIDTH * HEIGHT;

var PlayerEnum = {blue: 0, red: 1};
var PlayerName = ['blue', 'red'];
  
function GameState(dictionary, blueHuman, redHuman)
{
    this.game_over = false;
    this.blue_score = 0;
    this.red_score = 0;
    this.to_play = PlayerEnum.blue;
    this.humans = [blueHuman, redHuman];
    this.letters = "";
    this.index = {};
    for(var i = 65; i < 91; ++i) {
        this.index[String.fromCharCode(i)] = [];
    }
    for(var i = 0; i < COUNT; ++i) {
        var letter = String.fromCharCode(
            65 + Math.floor(Math.random() * 26));
        this.letters += letter;
        this.index[letter].push(i);
    }
    this.placement = new Placement();
    this.playedWords = [];

    this.humanTurn = function() {
        return !this.game_over && this.humans[this.to_play];
    }
    
    this.humanOpponent = function() {
        return this.humans[(this.to_play == PlayerEnum.blue) ? PlayerEnum.red : PlayerEnum.blue];
    }
    
    // can't play a word that a previously played word starts with
    this.wordHasBeenPlayed = function(word) {
        for(var i = 0; i < this.playedWords.length; ++i) {
            if (word.length <= this.playedWords[i].length &&
                    this.playedWords[i].substring(0, word.length) == word)
                return true;
        }
        return false;        
    }
    
    // does not ask whether word is a word, only whether it can be made
    // with the letters we have available
    this.canMakeWord = function(word) {
        available_letters = this.letters;
        for(var i = 0; i < word.length; ++i) {
            var ix = available_letters.indexOf(word[i]);
            if (ix < 0)
                return false;
            available_letters = available_letters.slice(0, ix) + available_letters.slice(ix + 1);
        }
        return true;
    }
    
    this.playWord = function(word, indexArray) {
        this.placement.claimIndices(indexArray, this.to_play);
        this.playedWords.push(word);

        var stats = this.placement.countUpdateLock();
        this.blue_score = stats.blue.claimed;
        this.red_score = stats.red.claimed;
        
        // next turn or end
        this.to_play = (this.to_play == PlayerEnum.blue) ? PlayerEnum.red : PlayerEnum.blue;
        if (this.placement.full()) {
            this.game_over = true;
        }
    }
    
    this.evaluatePlay = function(stats, player)
    {
        // make sure we pick a win, if there is one
        var win_bias = 0;
        if (stats.red.claimed + stats.blue.claimed == COUNT &&
                stats[player].claimed > (COUNT / 2))
            win_bias = 1000000;
        
        return win_bias + stats[player].locked * 4 + stats[player].claimed;
    }

    this.evaluateWord = function(word, letter_ix, coords, available_letters, bestPlay)
    {
        if (letter_ix == word.length) {
            var scratch = this.placement.clone();
            scratch.claimIndices(coords, this.to_play);
            var stats = scratch.countUpdateLock(scratch);
            var player = PlayerName[this.to_play];
            var score = this.evaluatePlay(stats, player);
            if (score > bestPlay.score) {
                bestPlay.word = word;
                bestPlay.score = score;
                bestPlay.coords = coords;
            }
        } else {
            var letterIndices = this.index[word[letter_ix]];
            for(var i = 0; i < letterIndices.length; ++i) {
                if (available_letters[letterIndices[i]] != '.') {
                    new_available_letters = available_letters;
                    new_available_letters[letterIndices[i]] = '.';
                    this.evaluateWord(word, letter_ix + 1, coords.concat([letterIndices[i]]), new_available_letters, bestPlay);
                }
            }
        }
    }
    
    this.doComputerPlay = function(wordCallback)
    {
        var bestPlay = {score: 0, word: "", coords: []};
        self = this;
        g_dict.enumWords(function(word) {
            if (!self.wordHasBeenPlayed(word)) {
                self.evaluateWord(word, 0, [], self.letters, bestPlay)
            }
        });
        wordCallback(bestPlay);
    }
    
    dictionary.buildIndex(this);    
}
