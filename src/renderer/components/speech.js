import CoreNLP, { Properties, Pipeline } from 'corenlp';

const props = new Properties({
  annotators: 'tokenize,ssplit,pos,lemma,ner,parse'
});
const pipeline = new Pipeline(props, 'English');

class NodeQuery {
  constructor(text) {
  }

  execute(editor) {
  }
}

class Add extends Action {
  constructor(query) {
    this.query = query;
  }

  execute(editor) {
  }
}

function extractQuery(node) {
}

function extractAction(node) {
}

function extractNoun(node) {
}

function extractNouns(node) {
}

export default function(editor, text) {
  const sent = new CoreNLP.simple.Sentence(text);
  pipeline.annotate(sent).then(sent => {
    console.log('parse', sent.parse());
    console.log(CoreNLP.util.Tree.fromSentence(sent).dump());
  }).catch(err => {
    console.log(err);
  });
}
