function eq_Clauses(c1, c2) {
  if(c1 instanceof Clause && c2 instanceof Clause && c1.name == c2.name && c1.args.length == c2.args.length)
    return c1.args.reduce(function(p,a,i){ return p && a.constructor === c2.args[i].constructor
                                                    && ( a instanceof Var
                                                      || (a instanceof Const && a.val == c2.args[i].val)
                                                      || (a instanceof Clause && eq_Clauses(a, c2.args[i]))) }, true);
  return false;
};

function rem_Consts_from_Clause(c, i) {
  i = i || 0;
  return new Clause(c.name, c.args.map(function(a) {
    return a instanceof Const ? new Var('Z'+(i++)) : (a instanceof Clause ? rem_Consts_from_Clause(a, i) : a);
  }));
}

// ---------------------------------------------------------
// "Classes" that represent AST nodes
// ---------------------------------------------------------

function Program(rules, query) {
  this.rules = rules;
  this.query = query;

  var nots = rules.filter(function(r) { return r.head.name == 'not' && r.head.args[0] instanceof Clause; })
                  .map(function(nr) { return nr.head.args[0] });
  var i = nots.length;

  this.rules.forEach(function(r) {
    r.body.forEach(function(c) {
      if(c.name == 'not' && c.args[0] instanceof Clause) {
        var nc = rem_Consts_from_Clause(c.args[0]);
        if(nots.reduce(function(p,cc) { return p && !eq_Clauses(cc, nc) }, true))
          nots = nots.concat(nc);
      }
    })
  });
  this.query.forEach(function(c) {
    if(c.name == 'not' && c.args[0] instanceof Clause) {
      var nc = rem_Consts_from_Clause(c.args[0]);
      if(nots.reduce(function(p,cc) { return p && !eq_Clauses(cc, nc) }, true))
        nots = nots.concat(nc);
    }
  });

  nots = nots.slice(i);
  if(nots.length) {
    this.rules = this.rules.concat(nots.map(function(c) {
      return new Rule(new Clause('not', [new Clause(c.name, c.args)]), [new Clause(c.name, c.args), new Clause('!'), new Clause('fail')], true);
    }));
    this.rules = this.rules.concat([new Rule(new Clause('not', [new Var('G')]), [], true)]);
  }
};

function Rule(head, optBody, override) {
  if((head.name == "is" || head.name == '!' || head.name == 'not') && !override)
    throw new Error("Attempt to define built-in rule `" + head.name + "'.");

  this.head = head;
  this.body = optBody || [];
  this.hasCut = this.body.reduce(function(p,q) { return p || q.name == '!' }, false);
  this.cut = false;

  if(this.hasCut) {
    var i;
    for(i = this.body.length - 1; i >= 0; --i)
      if(this.body[i].name == '!') break;

    for(; i >= 0; --i)
      this.body[i].parent = this;
  }
};

function Clause(name, optArgs) {
  if(name == "is" && (!optArgs
                  || optArgs.length != 2
                  || (optArgs[0] instanceof Clause && optArgs[0].args.length != 0)
                  || (optArgs[1] instanceof Clause && optArgs[1].args.length != 0)))
    throw new Error("Illegal use of `is' rule.");

  if(optArgs && ((name == "!" && optArgs.length > 0)
             || optArgs.reduce(function(p,q) { return p || q.name == '!' }, false)))
    throw new Error("Illegal use of `cut' operator.");

  if(optArgs && ((name == 'not' && optArgs.length > 1)
             || optArgs.reduce(function(p,q) { return p || q.name == 'not' }, false)))
    throw new Error("Illegal use of `not' operator.");

  this.name = name;
  this.args = optArgs || [];
};

function Const(val) {
  val = typeof val == 'string' ? val : val.toString();
  this.val = val;
};

function evalConst(cnst, sub) {
  var bindings = '';
  for (var name in sub.bindings)
    if(cnst.val.indexOf(name) > -1 && sub.bindings[name] instanceof Const)
      bindings += 'var ' + name + ' = ' + evalConst(sub.bindings[name], sub).val + '; ';
  return new Const(eval(bindings + cnst.val));
}

function Var(name) {
  this.name = name;
};

// ---------------------------------------------------------
// Substitutions
// ---------------------------------------------------------

function Subst() {
  this.bindings = Object.create(null);
};

Subst.prototype.lookup = function(varName) {
  return this.bindings[varName];
};

Subst.prototype.bind = function(varName, term) {
  this.bindings[varName] = term;
  return this;
};

Subst.prototype.clone = function() {
  var clone = new Subst();
  for (var varName in this.bindings) {
    clone.bind(varName, this.lookup(varName));
  }
  return clone;
};

