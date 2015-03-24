// The parser

var g = ohm.grammar("L");
var toAST = g.synthesizedAttribute({
  Program:       function(rules, query)        { return new Program(toAST(rules), toAST(query)); },
  Rule_body:     function(head, _, body, _)    { return new Rule(toAST(head), toAST(body)); },
  Rule_noBody:   function(head, _)             { return new Rule(toAST(head)); },
  Query:         function(c, q)                { return toAST(c) },
  Clause_is:     function(n,_,t)               { return new Clause('is', [toAST(n), toAST(t)]); },
  Clause_cut:    function(_)                   { return new Clause('!'); },
  Clause_args:   function(sym, _, a, _, as, _) { return new Clause(toAST(sym), [toAST(a)].concat(toAST(as))); },
  Clause_noArgs: function(sym)                 { return new Clause(toAST(sym)); },
  Clauses:       function(c, _, cs)            { return [toAST(c)].concat(toAST(cs)); },
  variable:      function(_, _)                { return new Var(this.interval.contents); },
  symbol:        function(_, _)                { return this.interval.contents; },
  expr:          function(x, y, _)             { return new Const(x.interval.contents == '"' ? y.interval.contents
                                                                                             : (x.interval.contents + y.interval.contents).replace(/\$/g,'')); },
  _terminal: ohm.actions.getValue,
  _list: ohm.actions.map,
  _default: ohm.actions.passThrough
});

var L = new Interpreter(g, "Program", toAST);

// L.evalAST is declared in plumbing.js
// L.prettyPrintAST and L.prettyPrintValue are declared in prettyPrint.js

