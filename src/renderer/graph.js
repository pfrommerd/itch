import Rete from 'rete'
import Signal from 'signals'

async function foo() {
}

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

export class Workspace extends Rete.Component {


  constructor(name) {
    super(name)
    this.outputs = []; // list of descriptors
    this.outputAdded = new Signal();
    this.outputRemoved = new Signal();

    this.inputs = []; // list of descriptors
    this.inputsAdded = new Signal();
    this.inputsRemoved = new Signal();
  }

  async builder(node) {
    node.data.set('implementation', this)

    var l = {
      outputAdded: function() {
      },
      outputRemoved: function() {
      }
    };
    node.data.set('listeners', l);
  }

  addInput(input) {
  }

  addOutput(output) {
  }

  removeInput(input) {
  }

  removeOutput(output) {
  }

  calculate() {
  }
}

class Diff {
}
