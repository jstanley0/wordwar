var g_game;
var g_dict;
var StateEnum = {
    loadingDict: 0,
    inProgress: 1,
    gameOver: 2
}
var g_state = StateEnum.loadingDict;
var COLOR_CLASSES = ['red', 'blue', 'locked'];

function updateState(newState)
{
    switch(newState)
    {
    case StateEnum.inProgress:
        document.getElementById('btnPlay').disabled = false;
        document.getElementById('btnClear').disabled = false;
        document.getElementById('btnNewGame').disabled = false;
        break;
    case StateEnum.gameOver:
        document.getElementById('btnPlay').disabled = true;
        break;
    }
    g_state = newState;
}

function init()
{
    g_dict = new Dictionary(
        function() {
            // success
            ph = document.getElementById('loadingPlaceholder');
            ph.parentElement.removeChild(ph);
            renderTable();
            initNewGame();
            initiateNextPlay();
        }, function(status) {
            // failure
            document.getElementById('loadingPlaceholder').innerHTML =
                "Failed to download dictionary:<br>" + status;
        });
}

function newGame()
{
    if (g_state == StateEnum.inProgress &&
            g_game.playedWords.length > 0 &&
            !confirm("A game is in progress.  Are you sure you want to start a new one?"))
        return;
    status("");
    resetRack();
    initNewGame();
    initiateNextPlay();
}

function initNewGame()
{
    g_game = new GameState(g_dict, true, false);
    updateState(StateEnum.inProgress);
}

function letterId(index)
{
    return "let" + index;
}

function dragOverRack(ev)
{
    if (g_game.humanTurn())
        ev.preventDefault();
}

function dragLetter(ev)
{
    ev.dataTransfer.setData("Text", ev.target.id);
    ev.target.classList.add('dragging');
}

function dragEnd(ev)
{
    ev.target.classList.remove('dragging');
}

function getRackedWord()
{
    var word = ""
    var rack = document.getElementById('rack');
    for(var i = 0; i < rack.children.length - 1; ++i) {
        word += rack.children[i].letter;
    }
    return word;
}

function getRackedElements()
{
    var elements = [];
    var rack = document.getElementById('rack');
    for(var i = 0; i < rack.children.length - 1; ++i) {
        elements.push(getBoardLetterForRackedLetter(rack.children[i]));
    }    
    return elements;
}

function getRackedIndices()
{
    var indices = [];
    var elements = getRackedElements();
    for(var i = 0; i < elements.length; ++i) {
        indices.push(elements[i].index);
    }
    return indices;
}

function status(text)
{
    document.getElementById('statusMessage').innerHTML = text;
}

function initiateNextPlay()
{
    if (g_game.game_over) {
        updateState(StateEnum.gameOver);
    } else if (!g_game.humanTurn()) {
        if (g_game.humanOpponent())
            status("Thinking...");
        setTimeout(function() {
            g_game.doComputerPlay(function(bestPlay) {
                g_game.playWord(bestPlay.word, bestPlay.coords);
                if (bestPlay.score > 0) {
                    status("I played " + bestPlay.word);
                } else {
                    status("I passed :?");
                }
                initiateNextPlay();
            })
        }, 20);
    }
    updateDisplay();
}

function play()
{
    var word = getRackedWord();
    if (!word || word.length == 0)
        return;
    if (!g_dict.lookupWord(word)) {
        status(word + " is not in the dictionary. :(");
        return;
    }
    if (g_game.wordHasBeenPlayed(word)) {
        status(word + " has already been played. :/");
        return;
    }
    status("");
    g_game.playWord(word, getRackedIndices());
    resetRack();
    initiateNextPlay();
}

function rackLetter(sourceElement)
{
    letter = document.createElement("td");
    letter.letter = sourceElement.letter;
    letter.appendChild(document.createTextNode(sourceElement.innerHTML));
    letter.classList.add("racked");
    letter.id = "rack_" + sourceElement.id;
    letter.draggable = true;
    letter.ondragstart = dragLetter;
    letter.ondragend = dragEnd;
    letter.onclick = clickRackedLetter;
    for(var i = 0; i < COLOR_CLASSES.length; ++i) {
        if (sourceElement.classList.contains(COLOR_CLASSES[i]))
            letter.classList.add(COLOR_CLASSES[i]);
    }
    return letter;
}

function dropLetter(ev)
{
    ev.preventDefault();
    var data = ev.dataTransfer.getData("Text");
    var sourceElement = document.getElementById(data);
    if (!sourceElement)
        return;
    sourceElement.classList.remove('dragging');
    if (sourceElement.classList.contains('letter'))
        return dropBoardLetter(sourceElement, ev);
    else if (sourceElement.classList.contains('racked'))
        return dropRackLetter(sourceElement, ev);
}

function dropBoardLetter(sourceElement, ev)
{        
    var letter = rackLetter(sourceElement);
    rack = document.getElementById('rack');
    var place;
    if (ev.target.parentElement == rack)
        place = ev.target;
    else
        place = document.getElementById('spacer')
    sourceElement.classList.add("inplay");
    rack.insertBefore(letter, place);
}

function dropRackLetter(sourceElement, ev)
{
    // if dragging to the right, move _after_ the element dropped on,
    // not before (otherwise, dragging one to the right is a no-op)
    var place = ev.target;
    if (place.nextSibling) {
        for(var el = sourceElement.nextSibling; el; el = el.nextSibling) {
            if (el == place) {
                place = place.nextSibling;
                break;
            }
        }
    }
    sourceElement.parentElement.insertBefore(sourceElement, place);
}

function clickLetter(ev)
{
    if (!g_game.humanTurn())
        return;
    var sourceElement = ev.target;
    if (sourceElement.classList.contains('inplay'))
        return;
    var rack = document.getElementById('rack');
    var place = document.getElementById('spacer');
    var letter = rackLetter(sourceElement);
    sourceElement.classList.add("inplay");
    rack.insertBefore(letter, place);
}

function clickRackedLetter(ev)
{
    unRackLetter(ev.target);
}

function getBoardLetterForRackedLetter(rackedLetter)
{
    var board_id = rackedLetter.id.substring(5); // 'rack_'
    return document.getElementById(board_id);
}

function unRackLetter(rackedLetter)
{
    getBoardLetterForRackedLetter(rackedLetter).classList.remove('inplay');
    rackedLetter.parentElement.removeChild(rackedLetter);
}

function resetRack()
{
    var rack = document.getElementById('rack');
    // -2: don't un-rack the spacer element at the end
    for(var i = rack.children.length - 2; i >= 0; --i) {
        unRackLetter(rack.children[i]);
    }
}

function dragOverBoard(ev)
{
    var dragged_id = ev.dataTransfer.getData("Text");
    if (dragged_id.substring(0, 5) != 'rack_')
        return; // can't rearrange letters! ;)
    ev.preventDefault();    
}

function dropOverBoard(ev)
{
    ev.preventDefault();
    var dragged_id = ev.dataTransfer.getData("Text");
    var rackedLetter = document.getElementById(dragged_id);
    if (!rackedLetter.classList.contains('racked'))
        return;
    unRackLetter(rackedLetter);
}

function renderTable()
{
    var table = document.createElement("table");
    table.className = "board"
    table.ondragover = dragOverBoard;
    table.ondrop = dropOverBoard;
    var index = 0;
    for(var i = 0; i < HEIGHT; ++i)
    {
        var row = document.createElement("tr");
        for(var j = 0; j < WIDTH; ++j)
        {
            var td = document.createElement("td");
            td.id = letterId(index);
            td.draggable = true;
            td.ondragstart = dragLetter;
            td.ondragend = dragEnd;
            td.onclick = clickLetter;
            td.className = "letter ";
            td.index = index;
            if ((i + j) & 1 == 1)
                td.className += "odd"
            else
                td.className += "even"
            row.appendChild(td);
            ++index;
        }
        table.appendChild(row);
    }
    document.getElementById("board-holder").appendChild(table);
}

function updateLetter(element, letter, color_classes)
{
    for(var i = 0; i < COLOR_CLASSES.length; ++i)
        element.classList.remove(COLOR_CLASSES[i]);
    for(i = 0; i < color_classes.length; ++i)
        element.classList.add(color_classes[i]);
    element.letter = letter;
    element.innerHTML = letter;
}

function updateDisplay()
{
    var redBox = document.getElementById('red-score');
    var blueBox = document.getElementById('blue-score');
    redBox.classList.remove('to-play');
    blueBox.classList.remove('to-play');
    redBox.classList.remove('won');
    blueBox.classList.remove('won');

    for(var i = 0; i < COUNT; ++i) {
        var td = document.getElementById(letterId(i));
        updateLetter(td, g_game.letters[i], g_game.placement.color_classes(i));
    }
    
    blueBox.innerHTML = g_game.blue_score;
    redBox.innerHTML = g_game.red_score;
    
    if (g_state == StateEnum.inProgress) {
        if (g_game.to_play == PlayerEnum.blue) {
            blueBox.classList.add('to-play');
        } else {
            redBox.classList.add('to-play');
        }
    } else {
        if (g_game.red_score > g_game.blue_score) {
            redBox.classList.add('won');
        } else {
            blueBox.classList.add('won');        
        }
    }    
}
