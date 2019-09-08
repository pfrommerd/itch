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

function retrieve(node, inputName) {
  var input = node.inputs.get(inputName);
  if (!input) return null;
  if (input.connections.length == 0) return null;
  var conn = input.connections[0];
  return [conn.output.node, conn.output.name];
}

class AddComponent extends Rete.Component {
  constructor() {
    super("Add");
  }
  async builder(node) {
    node.addOutput(new Rete.Output("C", 'C', anySocket));
    node.addInput(new Rete.Input("A", 'A', anySocket));
    node.addInput(new Rete.Input("B", 'B', anySocket));

    node.execute = async function(cache) {
      if (cache.has(this)) return cache.get(this);
      var [a, ao] = retrieve(node, 'A');
      var [b, bo] = retrieve(node, 'B');
      if (!a) throw new Error('Could not find A input for Add');
      if (!b) throw new Error('Could not find B input for Add');

      var ar = (await a.execute(cache))[ao];
      var br = (await b.execute(cache))[bo];
      var result = {'C': ar + br};
      cache.set(this, result);
      return result;
    };
  }
}

class MultiplyComponent extends Rete.Component {
  constructor() {
    super("Multiply");
  }
  async builder(node) {
    node.addOutput(new Rete.Output("C", 'C', anySocket));
    node.addInput(new Rete.Input("A", 'A', anySocket));
    node.addInput(new Rete.Input("B", 'B', anySocket));

    node.execute = async function(cache) {
      if (cache.has(this)) return cache.get(this);
      var [a, ao] = retrieve(node, 'A');
      var [b, bo] = retrieve(node, 'B');
      if (!a) throw new Error('Could not find A input for Multiply');
      if (!b) throw new Error('Could not find B input for Multiply');

      var ar = (await a.execute(cache))[ao];
      var br = (await b.execute(cache))[bo];

      var result = {'C': ar * br};
      cache.set(this, result);
      return result;
    };
  }
}

class IfComponent extends Rete.Component {
  constructor() {
    super("If");
  }
  async builder(node) {
    node.addInput(new Rete.Input("Expr", 'Expr', anySocket));
    node.addInput(new Rete.Input("True", 'True', anySocket));
    node.addInput(new Rete.Input("False", 'False', anySocket));
    node.addOutput(new Rete.Output("Value", 'Value', anySocket));

    node.execute = async function(cache) {
      if (cache.has(this)) return cache.get(this);
      var [a, ao] = retrieve(node, 'True');
      var [b, bo] = retrieve(node, 'False');
      if (!a) throw new Error('Could not find True input for If');
      if (!b) throw new Error('Could not find False input for If');

      var [e, eo] = retrieve(node, 'Expr');
      if (!e) throw new Error('Could not find Expr input for If');
      var er = (await e.execute(cache))[eo];

      var val = null;
      if (er) {
        val = (await a.execute(cache))[ao];
      } else {
        val = (await b.execute(cache))[bo];
      }
      var result = {'Value': val};
      cache.set(this, result);
      return result;
    };
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

    node.execute = await function(cache) {
      if (cache.has(this)) return cache.get(this);
      var result = {'Value': parseInt(node.data.value)};
      cache.set(this, result);
      return result;
    };
  }
}

class InputComponent extends Rete.Component {
  constructor() {
    super('Input');
    this.module = { nodeType: 'input', socket: anySocket };
  }
  async builder(node) {
    var ctrl = new TextControl(this.editor, 'name');
    node.addControl(ctrl).addOutput(new Rete.Output('Input', 'Input', anySocket));
    node.execute = async function(cache) {
      if (cache.has(this)) {
        var c = cache.get(this);
        if (typeof c == 'function') {
          var s = c();
          // make them all wait on the same promise
          cache.set(this, () => s);
          var r = await s;
          cache.set(this, {'Input': r});
        }
        return cache.get(this);
      } else {
        throw new Error('Input not linked to anything, cannot execute');
      }
    }
  }
}

class OutputComponent extends Rete.Component {
  constructor() {
    super('Output');
    this.module = { nodeType: 'output', socket: anySocket };
  }
  async builder(node) {
    var ctrl = new TextControl(this.editor, 'name');
    node.addControl(ctrl).addInput(new Rete.Input("Output", 'Output', anySocket));
    if (node.data && node.data.name) ctrl.setValue(node.data.name);

    node.execute = async function(cache) {
      if (cache.has(node)) return cache.get(node);
      var [i, io] = retrieve(node, 'Output');
      var iv = (await i.execute(cache))[io];
      var result = {'Output': iv};
      cache.set(node, result);
      return result;
    }
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
  async load() {
    var nodes = {};
    var inputs = {};
    var outputs = {};
    var source = this.modules.getSource(this.name);
    await Promise.all(Object.keys(source.nodes).map(async id => {
      const node = source.nodes[id];
      const component = this.modules.component(node.name);

      nodes[id] = await component.build(Rete.Node.fromJSON(node));
      if (nodes[id].name == 'Input') inputs[id] = nodes[id];
      if (nodes[id].name == 'Output') outputs[id] = nodes[id];
    }));
    Object.keys(source.nodes).forEach(id => {
      const jsonNode = source.nodes[id];
      const node = nodes[id];
      Object.keys(jsonNode.outputs).forEach(key => {
        const outputJson = jsonNode.outputs[key];
        outputJson.connections.forEach(jsonConnection => {
          const nodeId = jsonConnection.node;
          const data = jsonConnection.data;
          const targetOutput = node.outputs.get(key);
          const targetInput = nodes[nodeId].inputs.get(jsonConnection.input);
          if (!targetOutput || !targetInput) {
            throw new Error('Input/output not found for connection');
          }
          var conn = targetOutput.connectTo(targetInput);
          conn.data = data;
        });
      });
    });
    return [nodes, inputs, outputs];
  }

  builder(node) {
    // whenever there is a save from another editor,
    // rebuild this node's inputs/outputs
    node.data.module = this.name;
    this.updateNode(node);
    this.modules.onChange(this.name, () => this.updateNode(node));

    var c = this;
    node.execute = async function(cache) {
      if (cache.has(this)) return cache.get(this);
      var [nodes, inputs, outputs] = await c.load();
      var newCache = new Map();
      for (let i in inputs) {
        let input = inputs[i];
        newCache.set(input, async function() {
          var [i, io] = retrieve(node, input.data.name);
          return (await i.execute(cache))[io];
        });
      }
      var outputs = await Promise.all(Object.keys(outputs).map(async id => {
        const node = outputs[id];
        const val = (await node.execute(newCache))['Output'];
        return [ node.data.name, val];
      }));
      var result = {};
      for (let r of outputs) {
        let [n, v] = r;
        result[n] = v;
      }
      cache.set(this, result);
      return result;
    };
  }
}

import * as fs from 'fs';

class Modules {
  constructor() {
    this.builtins = {};
    this.data = {};
    this.observers = new Map();
    this.globalObservers = [];

    try {
      let rawData = fs.readFileSync('data.json');
      let json = JSON.parse(rawData);
      this.data = json;
    } catch (e) {}

    var data = this.data;
    setInterval(function() {
      var json = JSON.stringify(data);
      fs.writeFile('data.json', json, 'utf8', function() {});
    }, 10000);
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
modules.addBuiltin(new MultiplyComponent());
modules.addBuiltin(new IfComponent());
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
    if (focus != editor) return;
    if (e.dead) return;
    switch (e.code) {
    case 'Space': 
        break;
    case 'KeyR':
        (async() => {
          if (editor.selected.list.length > 0) {
            var node = editor.selected.list[0];
            var rep = null;
            try {
              var result = await node.execute(new Map());
              var keys = Object.keys(result);
              if (keys.length == 1) {
                rep = result[keys[0]];
              } else {
                rep = '';
                for (let k of keys) {
                  rep = k + '= ' + result[k].toString() + '\n';
                }
              }
            } catch (e) {
              rep = e.toString();
            }
            target.note(rep);
          }
        })();
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
var focus = null;
export function focusEditor(editor) {
  focus = editor;
}
