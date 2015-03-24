// -----------------------------------------------------------------------------
// Part I: Rule.prototype.makeCopyWithFreshVarNames() and
//         {Clause, Var}.prototype.rewrite(subst)
// -----------------------------------------------------------------------------

function rndStr() {
  var range = "ABCDEFGHIJKLMNOPQRSTUVWXYZ", res = '';
  for(var i = 0; i < 8 + Math.floor(Math.random() * 24); ++i)
    res += range.charAt(Math.floor(Math.random() * range.length));
  return res;
}



Rule.prototype.getVarNames = function() {
  return $.map(this.body, function(c) { return c.getVarNames() }).concat(this.head.getVarNames());
};

Clause.prototype.getVarNames = function() {
  return $.map(this.args, function(a) { return a.getVarNames() });
};

Const.prototype.getVarNames = function() {
  return [];
}

Var.prototype.getVarNames = function() {
  return [this.name];
};



Rule.prototype.makeCopyWithFreshVarNames = function(subst) {
  var sub = subst || new Subst();
  $.map(this.getVarNames(), function(n) { sub.bind(n, new Var(rndStr())) });
  return new Rule(this.head.rewrite(sub), $.map(this.body, function(c) { return c.rewrite(sub) }), true);
};

Clause.prototype.rewrite = function(subst) {
  return new Clause(this.name, $.map(this.args, function(a) { return a.rewrite(subst) }));
};

Const.prototype.rewrite = function(subst) {
  var nval = this.val;
  for(var name in subst.bindings)
    if(subst.bindings[name] instanceof Var)
      nval = nval.replace(new RegExp('\\b' + name + '\\b', 'g'), subst.bindings[name].name);
  return new Const(nval);
}

Var.prototype.rewrite = function(subst) {
  return (this.name in subst.bindings ? subst.bindings[this.name] : new Var(this.name));
};

// -----------------------------------------------------------------------------
// Part II: Subst.prototype.unify(term1, term2)
// -----------------------------------------------------------------------------

function UnificationError() { return new Error("unification failed"); }

Subst.prototype.unify = function(term1, term2) {
  if(term1 instanceof Const && term2 instanceof Const && term1.val == term2.val) {
    // no bindings
  } else if(term1 instanceof Var && term2 instanceof Var) {
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
    return this.unify(term2, term1);
  } else if(term1 instanceof Clause && term2 instanceof Clause
         && term1.name == term2.name && term1.args.length == term2.args.length) {
    for(var i = 0; i < term1.args.length; ++i)
      this.unify(term1.args[i].rewrite(this), term2.args[i].rewrite(this));
  } else throw UnificationError();

  for(var key in this.bindings) this.bind(key, this.lookup(key).rewrite(this));

  return this;
};

// -----------------------------------------------------------------------------
// Part III: Program.prototype.solve()
// -----------------------------------------------------------------------------

Program.prototype.solve = function(sub) {
  var cur_solver = 0, rest_solver = null, xsub = sub || new Subst();
  var i, rules = this.rules, queries = this.query;

  for(i = 0; i < queries.length; ++i) {
    if(queries[i].name == 'is') {
      try { xsub.unify(queries[i].args[0] instanceof Const ? evalConst(queries[i].args[0], xsub) : queries[i].args[0],
                       queries[i].args[1] instanceof Const ? evalConst(queries[i].args[1], xsub) : queries[i].args[1])
      } catch(e) { return {next: function() { return null; } }; }
    } else break;
  }
  while(i < queries.length && queries[i].name == '!') {
    if(queries[i].parent) queries[i].parent.cut = true;
    ++i;
  }
  queries = queries.slice(i);

  if(queries.length == 0) {
    return {
      next: function() {
        var res = cur_solver++ == 0 ? xsub : null;
        return res;
      }
    };
  }

  return {next : function() {
    if(rest_solver != null) {
      var nres = rest_solver.next();
      if(nres != null) return nres;
      rest_solver = null;
    }

    for(cur_solver; cur_solver < rules.length; ++cur_solver) {
      var res = xsub.clone(), nrule = rules[cur_solver].makeCopyWithFreshVarNames();
      var hasCut = nrule.hasCut || (queries[0].parent && queries[0].parent.hasCut),
             cut = nrule.cut || (queries[0].parent && queries[0].parent.cut);

      try { res.unify(queries[0], nrule.head); } catch(e) { if(cut) break; else continue; }

      var nqueries = nrule.body.concat(queries.slice(1));
      if(nqueries.length == 0) {
        rest_solver = null;
        cur_solver = (hasCut ? rules.length : cur_solver) + 1;
        return res;
      }

      rest_solver = new Program(rules, nqueries).solve(res);
      var nres = rest_solver.next();
      if(nres != null) {
          cur_solver = (hasCut ? rules.length : cur_solver) + 1;
          return nres;
      }
      rest_solver = null;

      cut = nrule.cut || (queries[0].parent && queries[0].parent.cut);
      if(cut) break;
    }

    return null;
  }};
};
