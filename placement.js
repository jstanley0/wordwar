function Placement()
{
    this.colors = [];
    for(var i = 0; i < COUNT; ++i) {
        this.colors.push('u');
    }
    
    this.clone = function() {
        retval = new Placement();
        retval.colors = this.colors.slice(0);
        return retval;
    }
    
    this.claimIndex = function(index, player) {
        if (this.colors[index] != this.colors[index].toUpperCase()) {
            this.colors[index] = (player == PlayerEnum.blue) ? 'b' : 'r';
        }
    }
    
    this.claimIndices = function(indexArray, player) {
        for(var i = 0; i < indexArray.length; ++i) {
            this.claimIndex(indexArray[i], player);
        }
    }

    this.checkSetLock = function(index) {
        var my_letter = this.colors[index].toUpperCase();
        this.colors[index] = my_letter.toLowerCase();
        if (index > WIDTH && this.colors[index - WIDTH].toUpperCase() != my_letter)
            return false;   // up
        if (index < COUNT - WIDTH && this.colors[index + WIDTH].toUpperCase() != my_letter)
            return false;   // down
        var h = index % WIDTH;
        if (h != 0 && this.colors[index - 1].toUpperCase() != my_letter)
            return false;   // left
        if (h != WIDTH - 1 && this.colors[index + 1].toUpperCase() != my_letter)
            return false;   // right
        this.colors[index] = my_letter;
        return true;
    }
    
    this.countUpdateLock = function() {
        var retval = {red: {claimed: 0, locked: 0}, blue: {claimed: 0, locked: 0}};
        for(var i = 0; i < COUNT; ++i) {
            if (this.colors[i] != 'u') {
                var player = (this.colors[i].toUpperCase() == 'B') ? 'blue' : 'red';
                retval[player].claimed++;
                if (this.checkSetLock(i))
                    retval[player].locked++;
            }
        }
        return retval;
    }
    
    this.full = function() {
        return this.colors.indexOf('u') < 0;
    }
    
    this.color_classes = function(index) {
        var retval = [];
        if (this.colors[index].toUpperCase() == 'B')
            retval.push('blue');
        else if (this.colors[index].toUpperCase() == 'R')
            retval.push('red');
        if (this.colors[index] == this.colors[index].toUpperCase())
            retval.push('locked');
        return retval;
    }
}
