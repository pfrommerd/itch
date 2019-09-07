(async () => {})
import Rete from 'rete'
import ConnectionPlugin from 'rete-connection-plugin'
import VueRenderPlugin from 'rete-vue-render-plugin'
import ContextMenuPlugin from 'rete-context-menu-plugin'
import ModulePlugin from 'rete-module-plugin'

class TestComponent extends Rete.Component {
  constructor() {
    super("Test");
  }
  builder(node) {
  }
}

var anySocket = new Rete.Socket();

class ModuleComponent extends Rete.Component {
  constructor(modules) {
    super("Module")
    this.module  = { nodeType: 'module' };
    this.modules = modules;
  }

  builder(node) {
    // whenever there is a save from another editor,
    // rebuild this module
    this.modules.onChange(node.data.module, 
      () => {
        console.log('hi')
    });
  }
}

class Modules {
  constructor() {
    this.data = {
      'main.itch': { data: {
        'id': 'itch@0.0.1',
        'nodes': {
          '1' : {
            'id': '1',
            'name': 'Test',
            'inputs': {},
            'outputs': {},
            'position': [0, 0]
          }
        }
      }},
      'lib.itch': { data: {
        'id': 'itch@0.0.1',
        'nodes': {
          '1' : {
            'id': '1',
            'position': [0, 0],
            'name': 'Test'
          }
        }
      }}
    }
    this.observers = new Map();
    this.globalObservers = [];
  }

  getData() {
    return this.data;
  }

  getModule(name) {
    return this.data[name] ? this.data[name].data : null;
  }

  createModule(module) {
    if (this.data[name]) throw new Error('Module already exists');
    this.save(module, { data: {id: 'itch@0.0.1', nodes: {}} });
    return this.getModule(module);
  }

  save(module, serialized) {
    this.data[module] = serialized
    if (!this.observers.has(module)) return;
    
    let l1 = this.observers.get(module).slice(0);
    for (let l of l1) {
      l();
    }
    let l2 = this.globalObservers.slice(0);
    for (let l of l2) {
      l();
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
var modules = new Modules();

export function mount() {
  this.$nextTick(start.bind(this));
}

function start() {

  var container = this.$el.childNodes[0];
  var editor = new Rete.NodeEditor("itch@0.0.1", container);
  editor.use(ConnectionPlugin, { curvature : 0.4 });
  editor.use(ContextMenuPlugin);
  editor.use(VueRenderPlugin);

  var engine = new Rete.Engine("itch@0.0.1");

  let data = modules.getData();
  editor.use(ModulePlugin, { engine, data });

  let components = [new TestComponent(), new ModuleComponent(modules)];
  for (let c of components) {
    engine.register(c);
    editor.register(c);
  }

  editor.view.resize();
  container.style.width = "100%";
  container.style.height = "100%";

  var m = modules.getModule(this.module)
  if (!m) {
    m = modules.createModule(this.module);
  }
  editor.fromJSON(m);
  
  // listen for dirty buffer
  editor.on(['nodecreated', 'noderemoved', 'connectioncreated', 
             'connectionremoved', 'nodetranslated'],
    () => {
      this.dirty = true;
    });
  editor.on('keydown', e => {
    switch (e.code) {
    case 'Delete': 
        editor.selected.each(n => editor.removeNode(n));
        break;
    case 'KeyS':
        if (!e.ctrlKey) break;
        let dump = editor.toJSON();
        modules.save(this.module, dump);
        console.log(modules);
        break;
    }
  });
}
