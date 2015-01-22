function emptyObject() { return Object.create(null); }

function pushEnv(env) {
    var newEnv = emptyObject();
    newEnv["_parent"] = env;
    newEnv["vars"] = emptyObject();
    return newEnv;
}

F.evalAST = function (ast) {
    return ev.call(pushEnv(null), ast);
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

    "seq":  function(a, b) { ev.call(this, a); return ev.call(this, b); },

    "id":   function(a)    { return chkDefined(this, a).vars[a]; },
    "set":  function(x, e) { return chkDefined(this, x).vars[x] = ev.call(this, e) },
    "let":  function(x, e, b) {
        var nenv = pushEnv(this);
        nenv.vars[x] = ev.call(nenv, e);
        return ev.call(nenv, b);
    },

    "fun":  function(a, e) { return ['closure', a, e, this]; },
    "call": function(f)    {
        var c = chkType("closure", ev.call(this, f));
        var a = Array.prototype.slice.call(arguments, 1);

        if(c[1].length < a.length)
            throw "Number of arguments provided is more than the required number of arguments.";

        var nenv = pushEnv(c[3]);
        for(var i = 0; i < a.length; ++i)
            nenv.vars[c[1][i]] = ev.call(this, a[i]);

        if(i < c[1].length) return ['closure', c[1].slice(i), c[2], nenv];
        else                return ev.call(nenv, c[2]);
    },

    "cons": function(h, t) { return ['cons', ev.call(this, h), ev.call(this, t)]; },
    "match":function(e)    {
        var nvars, v = ev.call(this, e);

        for(var i = 1; i < arguments.length; i += 2)
            if((nvars = patMatch(arguments[i], v)) !== false) {
                var nenv = pushEnv(this);
                $.extend(nenv.vars, nvars);
                return ev.call(nenv, arguments[i+1]);
            }

        throw "Match failure!";
    },

    "delay":function(e) { return evalTag['fun'].call(this, [], e); },
    "force":function(f) { return evalTag['call'].call(this, f); },

    "listComp": function(e, x, el) {
        var lv = ev.call(this, el);
        if(lv === null) return null;

        var nenv = pushEnv(this);
        nenv.vars[x] = chkType("cons", lv)[1];

        if(arguments.length > 3) {
            if(chkType("boolean", ev.call(nenv, arguments[3])) === true)
                return ['cons', ev.call(nenv, e) , evalTag["listComp"].call(this, e, x, lv[2], arguments[3])];
            else
                return evalTag["listComp"].call(this, e, x, lv[2], arguments[3]);
        } else return ['cons', ev.call(nenv, e) , evalTag["listComp"].call(this, e, x, lv[2])];
    },
};

function chkType(t, v) {
    if((typeof v == t) || (v instanceof Array && v[0] == t))
        return v;
    else throw "Invalid operand type for `" + v + "'. Expected: " + t;
};

function chkDefined(env, v) {
    if(env === null)                    throw "Variable " + v + " not in scope.";
    else if(env.vars[v] !== undefined)  return env;
    else                                return chkDefined(env["_parent"], v);
};

function patMatch(p, v) {
    if(p === v)                 return emptyObject();
    if(!(p instanceof Array))   return false;

    if(p[0] == '_')         return emptyObject();
    else if(p[0] == 'id')   { res = emptyObject(); res[p[1]] = v; return res; }
    else if(p[0] == 'cons') {
        if(!(v instanceof Array && v[0] == 'cons')) return false;

        var r1, r2;
        if((r1 = patMatch(p[1], v[1])) === false) return false;
        if((r2 = patMatch(p[2], v[2])) === false) return false;

        return $.extend(r1, r2);
    } else return false;
};
