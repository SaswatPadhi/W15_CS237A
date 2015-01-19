C.evalAST = function (ast) {
    return ev.call({'vars': {}}, ast);
};

function ev(ast) {
    if(typeof ast == "number")  return ast;
    else                        return evalTag[ast[0]].apply(this, ast.slice(1));
};

var evalTag = {
    "+":    function(a, b) { return ev.call(this, a) + ev.call(this, b); },
    "-":    function(a, b) { return ev.call(this, a) - ev.call(this, b); },
    "*":    function(a, b) { return ev.call(this, a) * ev.call(this, b); },
    "/":    function(a, b) { return ev.call(this, a) / ev.call(this, b); },
    "^":    function(a, b) { return Math.pow(ev.call(this, a), ev.call(this, b)); },

    "id":   function(a)    { return this.vars[a] || 0; },

    "seq":  function(a, b) { ev.call(this, a); return ev.call(this, b); },
    "set":  function(a, b) { return this.vars[a] = ev.call(this, b); },
};
