/* Diff structure
Command type
    Create 
        (create, box type, value, x, x)
        Value 
        Add
        Subtract
        Multiply
        Divide
        Mod
        And
        Or
        Not
        If/else
    Connect / Disconnect (disconnect may need less) 
        (connect, source, output, destination, input)
        (disconnect, source, output, destination, input)
        Input and output are optional if there is only one connection between the two nodes
        Source node
        Output index
        Destination node
        Input index
    Delete
        (delete, node, x, x, x)
        Source node
    Update
        (update, node, which value (name or value), value)
        Which value
        New value
*/

class Diff {
    constructor(type, arg1, arg2, arg3, arg4) {
        this.cmdType = type;
        this.arg1 = arg1;
        this.arg2 = arg2;
        this.arg3 = arg3;
        this.arg4 = arg4;
    }

    static toArray(diff) {
        return [diff.cmdType, diff.arg1, diff.arg2, diff.arg3, diff.arg4];
    };

    static fromArray(arr) {
        return new Diff(arr[0], arr[1], arr[2], arr[3], arr[4]);
    }

}

const CmdTypes = {
    CREATE: 0,
    CONNECT: 1,
    DISCONNECT: 2,
    DELETE: 3,
    UPDATE: 4
}

const NodeTypes = {
    VALUE: 0,
    ADD: 1,
    SUBTRACT: 2,
    MULTIPLY: 3,
    DIVIDE: 4,
    MOD: 5,
    AND: 6,
    OR: 7,
    NOT: 8,
    IF: 9
}

function regExTranslator(sentence) {
    var nlp = require('compromise');

    var doc = nlp(sentence);

    // look for verbs, numbers, nouns, and other key words
    let words = doc.match('(#Verb|#Value|#Noun|to|from)').out('array');
    console.log(words)

    let oldCmdMode = -1;
    let cmdMode = -1;
    let argCount = 0;
    let savedArgs = new Array(4);
    words.forEach(w => {
        // scan through the words once and assign arguments to commands
        // identifying verb will always come first. set as current mode
        // values, nouns, to/from, or it will follow, assign as arguments to command of current mode
        // create and delete will send a new command for every value or noun that follows
        let tagged = nlp(w);
        cmdMode = getModeFromWord(tagged, cmdMode);
        if (cmdMode != oldCmdMode) {
            oldCmdMode = cmdMode;
            return;
        }

        if (cmdMode == CmdTypes.CREATE) {
            handleCreateArgument(tagged, savedArgs, argCount);
        } else if (cmdMode == CmdTypes.DELETE) {
            handleDeleteArgument(tagged, savedArgs, argCount);
        } else if (cmdMode == CmdTypes.CONNECT) {
            handleConnectArgument(tagged, savedArgs, argCount);
        } else if (cmdMode == CmdTypes.DISCONNECT) {
            handleDisconnectArgument(tagged, savedArgs, argCount);
        } else if (cmdMode == CmdTypes.UPDATE) {
            parseUpdateArgument(tagged, savedArgs, argCount);
        }
    });
}

function handleCreateArgument(word, savedArgs, argCount) {
    // send create command here
    console.log('create ' + word.out('text'));
}

// doesn't need to save any args
function handleDeleteArgument(word) {
    // send delete command here
    console.log('delete ' + word.out('text'));
}

function handleConnectArgument(word, savedArgs, argCount) {
    // send connect command here
    console.log('connect ' + word.out('text'));
}

function handleDisconnectArgument(word, savedArgs, argCount) {
    // send disconnect command here
    console.log('disconnect ' + word.out('text'));
}

function parseUpdateArgument(word, savedArgs, argCount) {
    // send update command here
    console.log('connect ' + word.out('text'));
}

function getModeFromWord(word, currentMode) {
    if (word.match('(create|make|generate|produce|construct|build)').out('array').length == 1) {
        return CmdTypes.CREATE;
    } else if (word.match('(delete|remove|cancel|erase|kill)').out('array').length == 1) {
        return CmdTypes.DELETE;
    } else if (word.match('(connect|attach|join|fix|link|couple)').out('array').length == 1) {
        return CmdTypes.CONNECT;
    } else if (word.match('(disconnect|detach|uncouple|separate|disjoin)').out('array').length == 1) {
        return CmdTypes.DISCONNECT;
    } else if (word.match('(update|change|upgrade|amend)').out('array').length == 1) {
        return CmdTypes.UPDATE;
    }
    return currentMode;

}
regExTranslator('create 1, 2, 3, 4, and 5, and remove 6');