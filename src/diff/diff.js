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

function regExTranslator(sentence, editor) {
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
            handleCreateArgument(tagged, editor, savedArgs, argCount);
        } else if (cmdMode == CmdTypes.DELETE) {
            handleDeleteArgument(tagged, editor, savedArgs, argCount);
        } else if (cmdMode == CmdTypes.CONNECT) {
            handleConnectArgument(tagged, editor, savedArgs, argCount);
        } else if (cmdMode == CmdTypes.DISCONNECT) {
            handleDisconnectArgument(tagged, editor, savedArgs, argCount);
        } else if (cmdMode == CmdTypes.UPDATE) {
            parseUpdateArgument(tagged, editor, savedArgs, argCount);
        }
    });
}

function handleCreateArgument(word, editor, savedArgs, argCount) {
    // send create command here
    console.log('create ' + word.out('text'));
    // check if we are making a constant
    let data = word.out('text');
    if (argCount == 0) {
        switch (data) {
            case 0:
                // making a constant; do nothing and wait for next piece of data
                argCount++;
            case 1:
                // make node normally for any other node type
                // case on type of node
                let n = new Node('todo: update naming system');
                editor.addNode(n)
        }
    } else {
        // argCount must be 1
        // data contains value for constant
        let n = new Node('a constant');
        n.data = data;
        editor.addNode(n);
    }
}

// doesn't need to save any args
function handleDeleteArgument(word, editor) {
    // send delete command here
    console.log('delete ' + word.out('text'));
    // get the node (unique name)
    const nodeName = word.out('text');
    for (let n in editor.nodes) {
        if (n.name === nodeName) {
            editor.removeNode(n);
            break;
        }
    }
}

function handleConnectArgument(word, editor, savedArgs, argCount) {
    // send connect command here
    console.log('connect ' + word.out('text'));
    // need from node/output and to node/input
    if (argCount < 4) {
        savedArgs[argCount] = word.out('text');
        return;
    }
    // now we have all the data we need
    // search for the input and output
    let output = null;
    let input = null;
    for (let n in editor.nodes) {
        if (n.name === savedArgs[0]) {
            // this is the node with the output
            // search keys for name
            for (let x in n.outputs.prototype.keys()) {
                if (x == savedArgs[1]) {
                    output = n.outputs.get(x);
                    break;
                }
            }
        } else if (n.name === savedArgs[2]) {
            // this is the node with the input 
            // search keys for number
            for (let x in n.outputs.prototype.keys()) {
                if (x === savedArgs[4]) {
                    input = n.outputs.get(x);
                    break;
                }
            }
        }
    }
    if (output != null && input != null) {
        editor.connect(output, input);
    }
}

function handleDisconnectArgument(word, editor, savedArgs, argCount) {
    // send disconnect command here
    console.log('disconnect ' + word.out('text'));
    // need from node/output and to node/input
    if (argCount < 4) {
        savedArgs[argCount] = word.out('text');
        return;
    }
    // now we have all the data we need

    // search for input and output like for connect
    // check with all connections from node.getConnections() for the same input and output
    let output = null;
    let input = null;
    let source = null;
    for (let n in editor.nodes) {
        if (n.name === savedArgs[0]) {
            // this is the node with the output
            // search keys for name
            for (let x in n.outputs.prototype.keys()) {
                if (x === savedArgs[1]) {
                    output = n.outputs.get(x);
                    source = n;
                }
            }
        } else if (n.name === savedArgs[2]) {
            // this is the node with the input 
            // search keys for number
            for (let x in n.outputs.prototype.keys()) {
                if (x === savedArgs[4]) {
                    input = n.outputs.get(x);
                }
            }
        }
    }
    for (let c in source.getConnections()) {
        if (c.output == output && c.input == input) {
            // remove connection
            editor.removeConnection(c);
            break;
        }
    }
}

function parseUpdateArgument(word, editor, savedArgs, argCount) {
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

// testing
regExTranslator('create 1, 2, 3, 4, and 5, and remove 6');