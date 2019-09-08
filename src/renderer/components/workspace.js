(async () => {})
import Vue from 'vue'
import Rete from 'rete'
import ConnectionPlugin from 'rete-connection-plugin'
import VueRenderPlugin from 'rete-vue-render-plugin'
import ContextMenuPlugin from 'rete-context-menu-plugin'
import ModulePlugin from 'rete-module-plugin'

var anySocket = new Rete.Socket('Any');

var counter = 0;
const VueLabel = Vue.component('comp-label', {
  props: ['readonly', 'emitter', 'ikey', 'getData', 'putData'],
  template: '<input :value="value" :readonly="readonly" @input="change($event)" @dblclick.stop=""/>',
  data() {
    return {
      value: 'label ' + counter++,
    }
  },
  methods: {
    change(e){
      this.value = e.target.value;
      this.update();
    },
    update() {
      if (this.ikey)
        this.putData(this.ikey, this.value);
      this.emitter.trigger('process', {});
    }
  },
  mounted() {
    this.value = this.getData(this.ikey);
  }
});

class TextControl extends Rete.Control {
    constructor(emitter, key, readonly = false) {
      super(key);
      this.emitter = emitter;
      this.component = VueLabel;
      this.props = { emitter, ikey: key, readonly };
      this.data.render = 'vue';
    }

    setValue(val) {
    }
}

class AddComponent extends Rete.Component {
  constructor() {
    super("Add");
  }
  async builder(node) {
    node.addOutput(new Rete.Output("C", 'C', anySocket));
    node.addInput(new Rete.Input("A", 'A', anySocket));
    node.addInput(new Rete.Input("B", 'B', anySocket));
  }
}

class ConstantComponent extends Rete.Component {
  constructor() {
    super("Constant");
  }
  async builder(node) {
    if (!node.data) node.data = {};
    if (!node.data.value) node.data.value = '0';
    var ctrl = new TextControl(this.editor, 'value');
    node.addControl(ctrl).addOutput(new Rete.Output("Value", 'Value', anySocket));
  }
}

class InputComponent extends Rete.Component {
  constructor() {
    super('Input');
    this.module = { nodeType: 'input', socket: anySocket };
  }
  async builder(node) {
    var ctrl = new TextControl(this.editor, 'name');
    node.addControl(ctrl).addOutput(new Rete.Output('output', 'Input', anySocket));
  }
}

class OutputComponent extends Rete.Component {
  constructor() {
    super('Output');
    this.module = { nodeType: 'output', socket: anySocket };
  }
  async builder(node) {
    var ctrl = new TextControl(this.editor, 'name');
    node.addControl(ctrl).addInput(new Rete.Input("input", 'Output', anySocket));
    if (node.data && node.data.name) ctrl.setValue(node.data.name);
  }
}

class ModuleComponent extends Rete.Component {
  constructor(modules, name) {
    super(name)
    this.module  = {nodeType: 'module'};
    this.modules = modules;
  }

  updateNode(node) {
    var newInputs = new Set();
    var newOutputs = new Set();
    var data = this.modules.getSource(this.name);
    for (let l in data.nodes) {
      let n = data.nodes[l];
      if (n.name == 'Output') {
        if (n.data.name) newOutputs.add(n.data.name);
      } else if (n.name == 'Input') {
        newInputs.add(n.data.name);
      }
    }
    var oldOutputs = new Set();
    var oldInputs = new Set();
    node.outputs.forEach((value, key, map) => {
      oldOutputs.add(value.name);
    });
    node.inputs.forEach((value, key, map) => {
      oldInputs.add(value.name);
    });

    // go through old outputs and remove any
    // that are not in the input
    for (let o of oldOutputs) {
      if (!(newOutputs.has(o))) {
        node.removeOutput(node.outputs.get(o));
      }
    }
    for (let i of oldInputs) {
      if (!(newInputs.has(i))) {
        node.removeInput(node.inputs.get(i));
      }
    }
    for (let o of newOutputs) {
      if (!(oldOutputs.has(o))) {
        node.addOutput(new Rete.Output(o, o, anySocket));
      }
    }
    for (let i of newInputs) {
      if (!(oldInputs.has(i))) {
        node.addInput(new Rete.Input(i, i, anySocket));
      }
    }
  }

  builder(node) {
    // whenever there is a save from another editor,
    // rebuild this node's inputs/outputs
    node.data.module = this.name;
    this.updateNode(node);
    this.modules.onChange(this.name, () => this.updateNode(node));
  }
}

class Modules {
  constructor() {
    this.builtins = {};
    this.data = {
      'main': { data: {
        'id': 'itch@0.0.1',
        'nodes': {
          '1' : {
            'id': '1',
            'name': 'Output',
            'data': {'name': 'foo'},
            'inputs': {},
            'outputs': {},
            'position': [0, 0]
          }
        }
      }},
      'lib': { data: {
        'id': 'itch@0.0.1',
        'nodes': {
          '1' : {
            'id': '1',
            'position': [0, 0],
            'name': 'Add'
          }
        }
      }}
    }
    this.observers = new Map();
    this.globalObservers = [];
  }

  listCustom() {
    var l = [];
    for (name in this.data) {
      l.push(name)
    }
    return l;
  }

  component(name) {
    if (name in this.builtins) return this.builtins[name];
    return new ModuleComponent(this, name);
  }

  components() {
    var c = [];
    for (let name in this.data) {
      c.push(new ModuleComponent(this, name));
    }
    for (let b in this.builtins) {
      c.push(this.builtins[b]);
    }
    return c;
  }

  getData() {
    return this.data;
  }

  getSource(name) {
    return this.data[name] ? this.data[name].data : null;
  }

  addBuiltin(b) {
    this.builtins[b.name] = b;
  }

  createModule(module) {
    if (this.data[module]) throw new Error('Module already exists');
    var data = {id: 'itch@0.01', nodes:{}};
    this.save(module, { data: {id: 'itch@0.0.1', nodes: {}} }, null);
    return this.getSource(module);
  }

  save(module, serialized, cause) {
    if (module in this.builtins) throw new Error('Existing builtin');
    this.data[module] = serialized
    if (this.observers.has(module)) {
      let l1 = this.observers.get(module).slice(0);
      for (let l of l1) {
        l(cause);
      }
    }
    let l2 = this.globalObservers.slice(0);
    for (let l of l2) {
      l(module, cause);
    }
  }

  onChange(module, callback) {
    if (!this.observers.has(module)) this.observers.set(module, []);
    this.observers.get(module).push(callback);
  }

  anyChange(callback) {
    this.globalObservers.push(callback);
  }
};


// global modules container
export let modules = new Modules();

modules.addBuiltin(new ConstantComponent());
modules.addBuiltin(new AddComponent());
modules.addBuiltin(new InputComponent());
modules.addBuiltin(new OutputComponent());

export function bind(container, target) {
  var editor = new Rete.NodeEditor("itch@0.0.1", container);
  editor.use(ConnectionPlugin, { curvature : 0.4 });
  editor.use(ContextMenuPlugin);
  editor.use(VueRenderPlugin);

  var engine = new Rete.Engine("itch@0.0.1");

  let data = modules.getData();
  editor.use(ModulePlugin, { engine, modules: data});


  editor.view.resize();
  container.style.width = "100%";
  container.style.height = "100%";
  
  // listen for dirty buffer
  editor.on(['nodecreated', 'noderemoved', 'connectioncreated', 
             'connectionremoved', 'nodetranslated'], () => {
      target.edited();
    });
  editor.on('keydown', e => {
    if (e.dead) return;
    switch (e.code) {
    case 'Space': 
        console.log('hi');
        break;
    }
  });

  for (let c of modules.components()) {
    engine.register(c);
    editor.register(c);
  }
  var availableModules = modules.listCustom();
  modules.anyChange((name) => {
    if (target.availableModules.indexOf(name) < 0) {
      target.availableModules.push(name);
      engine.register(modules.component(name));
      editor.register(modules.component(name));
    }
  });

  return [editor, availableModules];
}

export async function loadEditor(module, editor) {
  var m = modules.getSource(module);
  if (m) {
    await editor.fromJSON(m);
  } else {
    throw new Error('Not found');
  }
}

export function saveEditor(module, editor) {
  modules.save(module, {data: editor.toJSON()}, editor)
}

export function createEditor(module, editor) {
  var m = modules.createModule(module);
  editor.fromJSON(m);
}
