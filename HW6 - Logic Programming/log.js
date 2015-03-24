// -----------------------------------------------------------------------------
// Part I: Rule.prototype.makeCopyWithFreshVarNames() and
//         {Clause, Var}.prototype.rewrite(subst)
// -----------------------------------------------------------------------------

function rndStr() {
  var range = "ABCDEFGHIJKLMNOPQRSTUVWXYZ", res = '';
  for(var i = 0; i < 8 + Math.floor(Math.random() * 8); ++i)
    res += range.charAt(Math.floor(Math.random() * range.length));
  return res;
}



Rule.prototype.getVarNames = function() {
  return $.map(this.body, function(c) { return c.getVarNames() }).concat(this.head.getVarNames());
};

Clause.prototype.getVarNames = function() {
  return $.map(this.args, function(a) { return a.getVarNames() });
};

Var.prototype.getVarNames = function() {
  return this.name;
};



Rule.prototype.makeCopyWithFreshVarNames = function() {
  var sub = new Subst();
  $.map(this.getVarNames(), function(n) { sub.bind(n, new Var(rndStr())) });
  return new Rule(this.head.rewrite(sub), $.map(this.body, function(c) { return c.rewrite(sub) }));
};

Clause.prototype.rewrite = function(subst) {
  return new Clause(this.name, $.map(this.args, function(a) { return a.rewrite(subst) }));
};

Var.prototype.rewrite = function(subst) {
  return (this.name in subst.bindings ? subst.bindings[this.name] : new Var(this.name));
};

// -----------------------------------------------------------------------------
// Part II: Subst.prototype.unify(term1, term2)
// -----------------------------------------------------------------------------

function UnificationError() { return new Error("unification failed"); }

Subst.prototype.unify = function(term1, term2) {
  if(term1 instanceof Var && term2 instanceof Var) {
    if(term1.name != term2.name) {
      if(term1.name in this.bindings)
        this.unify(this.lookup(term1.name), term2);
      else if(term2.name in this.bindings)
        this.unify(term1, this.lookup(term2.name));
      else
        this.bind(term1.name, new Var(term2.name));
    }
  } else if(term1 instanceof Var) {
    if(term1.name in this.bindings)
      this.unify(this.lookup(term1.name), term2);
    else
      this.bind(term1.name, term2);
  } else if(term2 instanceof Var) {
    if(term2.name in this.bindings)
      this.unify(this.lookup(term2.name), term1);
    else
      this.bind(term2.name, term1);
  } else if(term1 instanceof Clause && term2 instanceof Clause){
    if(term1.name != term2.name) throw UnificationError();
    for(var i = 0; i < term1.args.length; ++i)
      this.unify(term1.args[i].rewrite(this), term2.args[i].rewrite(this));
  } else throw UnificationError();

  for(var key in this.bindings) this.bind(key, this.lookup(key).rewrite(this));

  return this;
};

// -----------------------------------------------------------------------------
// Part III: Program.prototype.solve()
// -----------------------------------------------------------------------------

Program.prototype.solve = function() {
  var cur_solver = 0, rest_solver = null;
  var rules = this.rules, queries = this.query;
  var xsub = arguments.length > 0 ? arguments[0] : new Subst();

  return {next : function() {
    if(rest_solver != null) {
      var nres = rest_solver.next();
      if(nres != null) return nres;
      rest_solver = null;
    }

    for(cur_solver; cur_solver < rules.length; ++cur_solver) {
      if(rules[cur_solver].head.name != queries[0].name) continue;

      var res = xsub.clone(), nrule = rules[cur_solver].makeCopyWithFreshVarNames();
      try { res.unify(queries[0], nrule.head); } catch(e) { continue; }

      var nqueries = nrule.body.concat(queries.slice(1));
      if(nqueries.length == 0) {
        rest_solver = null;
        ++cur_solver;
        return res;
      }

      rest_solver = new Program(rules, nqueries).solve(res);
      var nres = rest_solver.next();
      if(nres != null) {
          ++cur_solver;
          return nres;
      }
      rest_solver = null;
    }

    return null;
  }};
};
