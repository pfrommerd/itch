import CoreNLP, { Properties, Pipeline } from 'corenlp';
import Rete from 'rete'

// some utilties
var Small = {
    'zero': 0,
    'one': 1,
    'two': 2,
    'three': 3,
    'four': 4,
    'five': 5,
    'six': 6,
    'seven': 7,
    'eight': 8,
    'nine': 9,
    'ten': 10,
    'eleven': 11,
    'twelve': 12,
    'thirteen': 13,
    'fourteen': 14,
    'fifteen': 15,
    'sixteen': 16,
    'seventeen': 17,
    'eighteen': 18,
    'nineteen': 19,
    'twenty': 20,
    'thirty': 30,
    'forty': 40,
    'fifty': 50,
    'sixty': 60,
    'seventy': 70,
    'eighty': 80,
    'ninety': 90
};

var Magnitude = {
    'thousand':     1000,
    'million':      1000000,
    'billion':      1000000000,
    'trillion':     1000000000000,
    'quadrillion':  1000000000000000,
    'quintillion':  1000000000000000000,
    'sextillion':   1000000000000000000000,
    'septillion':   1000000000000000000000000,
    'octillion':    1000000000000000000000000000,
    'nonillion':    1000000000000000000000000000000,
    'decillion':    1000000000000000000000000000000000,
};

var a, n, g;

function text2num(s) {
    if (s == 'NaN') return 'NaN';
    a = s.toString().split(/[\s-]+/);
    n = 0;
    g = 0;
    a.forEach(feach);
    return n + g;
}

function feach(w) {
    var x = Small[w];
    if (x != null) {
        g = g + x;
    }
    else if (w == "hundred") {
        g = g * 100;
    }
    else {
        x = Magnitude[w];
        if (x != null) {
            n = n + g * x
            g = 0;
        }
        else { 
            throw Error("Unknown");
        }
    }
}

const props = new Properties({
  annotators: 'tokenize,ssplit,pos,lemma,ner,parse'
});
const pipeline = new Pipeline(props, 'English');

class ComponentQuery {
  constructor(func) {
    this.fun = func;
  }
  async execute(editor) {
    return await this.fun(editor);
  }
  static byName(name) {
    return new ComponentQuery(function(editor) {
      let s = new Set();
      for (let n of editor.components) {
        let cname = n[0];
        if (cname.toLowerCase() == name.toLowerCase()) {
          s.add({type: cname, data: {'name': cname + ' ' + Math.trunc(Math.random()*20)}});
          return s;
        }
      }
      return s;
    });
  }

  static constant(value) {
    return new ComponentQuery(async function(editor) {
      var v = null;
      try {
        v = parseFloat(value)
        if (!(v === 0) && !v) v = text2num(value);
      } catch (e) {
        try {
          v = text2num(v);
        } catch(e2) {
          v = value;
        }
      }
      s.add({type: 'Constant', data: {'name': value, 'value': v}});
      return s;
    });
  }

  static union(queries) {
    return new ComponentQuery(async function(editor) {
      var results = await Promise.all(queries.map((q) => q.execute(editor)));
      var a = new Set();
      for (var s of results) {
        for (var elem of s) {
          a.add(elem);
        }
      }
      return a;
    });
  }

  static async parse(editor, structure) {
    // if we find a node which exactly matches this phrase
    // by name prefer it
    var combined = ComponentQuery.byName(join(structure));
    var combinedNodes = await combined.execute(editor);
    if (combinedNodes.size > 0) return combined;

    if (structure.pos == 'NP' || structure.pos =='VB') {
      var queries = [];
      for (let w of structure.children) {
        var q = await ComponentQuery.parse(editor, w);
        if (q) queries.push(q);
      }
      if (queries.length > 0) return ComponentQuery.union(queries);
    }
    if (structure.pos == 'CD') {
      return ComponentQuery.constant(structure.token.lemma)
    }
  }
}

class NodeQuery {
  constructor(func) {
    this.fun = func;
  }
  async execute(editor) {
    return await this.fun(editor);
  }
  static byName(name) {
    return new NodeQuery(function(editor) {
      let s = new Set();
      for (let n of editor.nodes) {
        if (n.data.name.toLowerCase() == name.toLowerCase()) {
          s.add(n);
          return s;
        }
      }
      for (let n of editor.nodes) {
        if (n.name == name) {
          s.add(n);
          return s;
        }
      }
      return s;
    });
  }

  static constant(value) {
    return new NodeQuery(async function(editor) {
      var v = null;
      try {
        v = parseFloat(value)
        if (!(v === 0) && !v) v = text2num(value);
      } catch (e) {
        try {
          v = text2num(v);
        } catch(e2) {
          v = value;
        }
      }
      let s = new Set();
      for (let n of editor.nodes) {
        // find out if any of them are a constant node with
        // a value equal to N
        if (n.name == 'Constant' && n.data.value == v) {
          s.add(n);
          return s;
        }
      }
      let n = await createNode(editor, 'Constant', {name: 'Value ' + v, value: '' + v});
      s.add(n);
      return s;
    });
  }

  static union(queries) {
    return new NodeQuery(async function(editor) {
      var results = await Promise.all(queries.map((q) => q.execute(editor)));
      var a = new Set();
      for (var s of results) {
        for (var elem of s) {
          a.add(elem);
        }
      }
      return a;
    });
  }

  static async parse(editor, structure) {
    // if we find a node which exactly matches this phrase
    // by name prefer it
    var combined = NodeQuery.byName(join(structure));
    var combinedNodes = await combined.execute(editor);
    if (combinedNodes.size > 0) return combined;

    if (structure.pos == 'NP' || structure.pos =='VB') {
      var queries = [];
      for (let w of structure.children) {
        var q = await NodeQuery.parse(editor, w);
        if (q) queries.push(q);
      }
      if (queries.length > 0) return NodeQuery.union(queries);
    }
    if (structure.pos == 'CD') {
      return NodeQuery.constant(structure.token.lemma)
    }
  }
}

async function createNode(editor, type, data) {
  var c = editor.getComponent(type);
  var id = Rete.Node.latestId + 1;
  var x = (id * 50) % 500;
  var y = id // 10;
  var pos = [ x, y ];
  const node = new Rete.Node(type);
  node.name = type;
  node.position = pos;
  node.data = data;
  node.id = id;

  Rete.Node.latestId = Math.max(node.id, Rete.Node.latestId);
  return await c.build(node);
}

function join(structure, filter=undefined) {
  var pos = {};
  function subjoin(s) {
    if (filter && !filter(s)) return;
    if (s.pos =='DT') return;
    if (s.token) {
      pos[s.token.index] = s.token.word;
    }
    for (let o of s.children) {
      subjoin(o);
    }
  }
  subjoin(structure);
  var k = Object.keys(pos).sort();
  var words = [];
  for (let key of k) {
    words.push(pos[key]);
  }
  return words.join(' ');
}

class Add {
  constructor(query) {
    this.query = query;
  }

  static async parse(editor, structure) {
    if (structure.pos == 'VP' || structure.pos == 'NP') {
      // look for the noun phrase and parse to the NodeQuery parser
      var queries = [];
      for (let w of structure.children) {
        var q = await NodeQuery.parse(editor, w);
        if (q) queries.push(q);
      }
      if (queries.length > 0) return new Add(NodeQuery.union(queries));
    }
    return null;
  }

  async execute(editor) {
    var nodes = await this.query.execute(editor);
    // generate adding blocks to add all the nodes together
    if (nodes.size <= 0) return;
    var newNodes = [];
    var newConnections = [];

    let lastBlock = null;
    let count = 0;
    for (let n of nodes) {
      if (lastBlock != null) {
        let nb = await createNode(editor, 'Add', { name: 'Adder ' + (++count) });

        var lo = lastBlock.outputs.values().next().value
        var to = n.outputs.values().next().value
        if (!to || !lo) continue;

        newConnections.push(lo.connectTo(nb.inputs.get('A')));
        newConnections.push(to.connectTo(nb.inputs.get('B')));
        newNodes.push(nb);

        lastBlock = n;
      } else lastBlock = n;
    }
    for (let n of [...newNodes, ...nodes]) {
      if (!(n.id in editor.nodes)) {
        editor.addNode(n);
      }
    }
    for (let c of newConnections) {
        editor.view.addConnection(c);
        editor.trigger('connectioncreated', c);
    }
  }
}

class Create {
  constructor(query) {
    this.query = query;
  }
  static async parse(editor, structure) {
    if (structure.pos == 'VP' || structure.pos == 'NP') {
      // look for the noun phrase and parse to the NodeQuery parser
      var queries = [];
      for (let w of structure.children) {
        var q = await ComponentQuery.parse(editor, w);
        if (q) queries.push(q);
      }
      if (queries.length > 0) return new Create(ComponentQuery.union(queries));
    }
    return null;
  }
  async execute(editor) {
    var comps = await this.query.execute(editor);
    let newNodes = [];
    for (let c of comps) {
      let nb = await createNode(editor, c.type, c.data);
      newNodes.push(nb);
    }
    for (let n of newNodes) {
      if (!(n.id in editor.nodes)) {
        editor.addNode(n);
      }
    }
  }
}

class Compound {
  constructor(actions) {
    this.actions = actions;
  }
  
  async execute(editor) {
    for (let a of this.actions) {
      await a.execute(editor);
    }
  }
}

async function parseAction(editor, structure) {
  var words = [ // importance hierarchy for keywords
    {'create': Create, 'import': Create, 'make': Create},
    {'add': Add, '+': Add, 'plus': Add},
    {'add': Create}
  ];
  var allWords = new Set();
  for (let w of words) {
    for (let wo in w) {
      allWords.add(wo);
    }
  }
  async function parseStruct(structure) {
    for (let l of words) {
      // search the direct children for these key words
      for (var w of structure.children) {
        if (w.word in l) {
          // try and parse the associated action
          var action = await l[w.word].parse(editor, structure);
          if (action) return action;
        }
      }
    }
    for (let l of words) {
      // search the direct children for these key words
      for (var w of structure.children) {
        if (w.word in l) {
          // try and parse the associated action
          var action = await l[w.word].parse(editor, structure);
          if (action) return action;
        }
      }
    }
    // if that fails try and recursively call parse action on
    // each of the children in the tree
    for (let w of structure.children) {
      var action = await parseAction(editor, w);
      if (action) return action;
    }
    return null;
  }

  var phraseList = [];
  function removePhrases(structure) {
    var nc = [];
    for (let c of structure.children) {
      if (c.pos == 'VP') continue;
      var newc = removePhrases(c);
      nc.push(newc);
    }
    structure.children = nc;
    return structure;
  }
  function isolatePhrases(structure) {
    if (structure.pos == 'VP') {
      if (structure.children[0].pos == 'VB') {
        var copy = JSON.parse(JSON.stringify(structure));
        phraseList.push(removePhrases(copy));
      }
    }
    for (var w of structure.children) {
      isolatePhrases(w);
    }
  }
  isolatePhrases(structure);
  var actions = [];
  for (let w of phraseList) {
    console.log(join(w));
    var p = await parseStruct(w);
    if (p) actions.push(p);
  }
  if (actions.length == 1) return actions[0];
  if (actions.length == 0) return parseStruct(structure);
  else {
    console.log(actions);
    return new Compound(actions);
  }
}

export default function(editor, text) {
  if (text.length == 0) return;
  const sent = new CoreNLP.simple.Sentence(text);
  pipeline.annotate(sent).then(sent => {
    (async() => {
      var structure = JSON.parse(CoreNLP.util.Tree.fromSentence(sent).dump());
      var action = await parseAction(editor, structure);
      if (action) action.execute(editor);
      console.log('parse', sent.parse());
    })();
  }).catch(err => {
    console.log(err);
  });

}
