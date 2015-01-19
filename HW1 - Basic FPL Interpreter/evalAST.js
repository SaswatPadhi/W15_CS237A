function emptyObject() { return Object.create(null); }

function copyEnv(env) {
    var newEnv = emptyObject();
    $.extend(newEnv, env);
    return newEnv;
}

F.evalAST = function (ast) {
    var env = emptyObject();
    env['vars'] = emptyObject();

    return ev.call(env, ast);
};

function ev(ast) {
    if (ast === null || typeof ast == "number"
                     || typeof ast == "boolean"
                     || (ast instanceof Array && ast[0] == "closure"))
            return ast;
    else    return evalTag[ast[0]].apply(this, ast.slice(1));
};

var evalTag = {
    "+":    function(a, b) { return chkType("number", ev.call(this, a)) + chkType("number", ev.call(this, b)); },
    "-":    function(a, b) { return chkType("number", ev.call(this, a)) - chkType("number", ev.call(this, b)); },
    "*":    function(a, b) { return chkType("number", ev.call(this, a)) * chkType("number", ev.call(this, b)); },
    "/":    function(a, b) { return chkType("number", ev.call(this, a)) / chkType("number", ev.call(this, b)); },
    "%":    function(a, b) { return chkType("number", ev.call(this, a)) % chkType("number", ev.call(this, b)); },

    "=":    function(a, b) { return ev.call(this, a) === ev.call(this, b); },
    "!=":   function(a, b) { return ev.call(this, a) !== ev.call(this, b); },
    "<":    function(a, b) { return chkType("number", ev.call(this, a)) < chkType("number", ev.call(this, b)); },
    ">":    function(a, b) { return chkType("number", ev.call(this, a)) > chkType("number", ev.call(this, b)); },

    /* short-circuited booleans */
    "and":  function(a, b) { return chkType("boolean", ev.call(this, a)) ? chkType("boolean", ev.call(this, b)) : false; },
    "or":   function(a, b) { return chkType("boolean", ev.call(this, a)) ? true : chkType("boolean", ev.call(this, b)); },

     /* short-circuited conditional */
    "if":   function(c, t, e) { return chkType("boolean", ev.call(this, c)) ? ev.call(this, t) : ev.call(this, e); },

    "id":   function(a)    { return this.vars[a]; },
    "let":  function(x, e, b) {
        var nenv = copyEnv(this);
        nenv.vars[x] = ev.call(this, e);
        return ev.call(nenv, b);
    },

    "fun":  function(a, e) { return ['closure', a, e, copyEnv(this)]; },
    "call": function(f)    {
        var c = chkType("closure", ev.call(this, f));
        var a = Array.prototype.slice.call(arguments, 1);

        if(c[1].length != a.length)
            throw "Number of arguments provided doesn't match the required number of arguments.";

        for(var i = 0; i < a.length; ++i)
            c[3].vars[c[1][i]] = ev.call(this, a[i]);

        return ev.call(c[3], c[2]);
    },
};

function chkType(t, v) {
    if((typeof v == t) || (v instanceof Array && v[0] == t))
        return v;
    else throw "Invalid operand type for `" + v + "'. Expected: " + t;
};
