import Rete from 'rete'
import Signal from 'signals'

// an input-output descriptor
class Descriptor {
  constructor(name, socket) {
    this.name = name
    this.socket = socket
    this.nameChanged = new Signal();
    this.socketChanged = new Signal();
  }

  setName(name) {
    this.name = name
    nameChanged.dispatch(name)
  }

  setSocket(socket) {
    this.socket = socket 
    socketChanged.dispatch(socket)
  }
}

var workspaceCounter = 0;
export class Workspace extends Rete.Component {
  constructor(name) {
    super('Workspace ' + workspaceCounter)

    this.outputs = []; // list of descriptors
    this.outputAdded = new Signal();
    this.outputRemoved = new Signal();

    this.inputs = []; // list of descriptors
    this.inputsAdded = new Signal();
    this.inputsRemoved = new Signal();

    // matches the descriptors
    this.inputNodes = [];
    this.outputNodes = [];
    // the actual nodes
    this.nodes = [];
  }

  async builder(node) {
    var l = {
      outputAdded: function(output) {
        node.addOutput(output);
      },
      outputRemoved: function() {
        node.removeOutput(output);
      },
      inputAdded: function(input) {
        node.addInput(input);
      },
      inputRemoved: function(input) {
        node.removeInput(input);
      }
    };
    this.outputAdded.add(l.outputAdded);
    this.outputRemoved.add(l.outputRemoved);
    this.inputAdded.add(l.inputAdded);
    this.inputRemoved.add(l.inputRemoved);
    node.data.set('listeners', l);
  }

  addInput(input) {
    this.inputs.push(input);
    this.inputAdded.dispatch(input);

    var inputNode = new Rete.Node("Input");
    inputNode.addOutput(input.name)
  }

  addOutput(output) {
    this.outputs.push(input);
    this.outputAdded.dispatch(input);
  }

  removeInput(input) {
    var idx = this.inputs.indexOf(output);
    if (idx >= 0) {
      this.inputs.splice(idx, 1);
      this.inputRemoved.dispatch(output);
    }
  }

  removeOutput(output) {
    var idx = this.outputs.indexOf(output);
    if (idx >= 0) {
      this.outputs.splice(idx, 1);
      this.outputRemoved.dispatch(output);
    }
  }
}

export class Executor {
  execute(output) {
    var node = output.node
  }
}

/**
 * Renaming nodes
 * connecting nodes
 * creating nodes (perhaps multiple, connected at the same time)
 * deleting nodes (perhaps multiple)
 * undoing operations
 *
 * expanding nodes
 * 
 * and perhaps all of these in some manner
 */
class Diff {
}
