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