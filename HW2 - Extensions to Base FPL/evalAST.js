function cleanObject(init) { return $.extend(Object.create(null), init === undefined ? {} : init); }

function pushEnv(env, init) { return $.extend(cleanObject(), {'_parent': env, 'vars': cleanObject(init)}); }

F.evalAST = function (ast) { return ev.call(pushEnv(null), ast); };

function ev(ast) {
    if (ast === null || typeof ast == 'number'
                     || typeof ast == 'boolean'
                     || (ast instanceof Array && (ast[0] == 'closure' || ast[0] == 'lazy')))
            return ast;
    else    return evalTag[ast[0]].apply(this, ast.slice(1));
};

var evalTag = {
    '+':    function(a, b) { return chkType('number', ev.call(this, a)) + chkType('number', ev.call(this, b)); },
    '-':    function(a, b) { return chkType('number', ev.call(this, a)) - chkType('number', ev.call(this, b)); },
    '*':    function(a, b) { return chkType('number', ev.call(this, a)) * chkType('number', ev.call(this, b)); },
    '/':    function(a, b) { return chkType('number', ev.call(this, a)) / chkType('number', ev.call(this, b)); },
    '%':    function(a, b) { return chkType('number', ev.call(this, a)) % chkType('number', ev.call(this, b)); },

    '=':    function(a, b) { return ev.call(this, a) === ev.call(this, b); },
    '!=':   function(a, b) { return ev.call(this, a) !== ev.call(this, b); },
    '<':    function(a, b) { return chkType('number', ev.call(this, a)) < chkType('number', ev.call(this, b)); },
    '>':    function(a, b) { return chkType('number', ev.call(this, a)) > chkType('number', ev.call(this, b)); },

    /* short-circuited booleans */
    'and':  function(a, b) { return chkType('boolean', ev.call(this, a)) ? chkType('boolean', ev.call(this, b)) : false; },
    'or':   function(a, b) { return chkType('boolean', ev.call(this, a)) ? true : chkType('boolean', ev.call(this, b)); },

     /* short-circuited conditional */
    'if':   function(c, t, e) { return chkType('boolean', ev.call(this, c)) ? ev.call(this, t) : ev.call(this, e); },

    'seq':  function(a, b) { ev.call(this, a); return ev.call(this, b); },

    'id':   function(a)    { return chkDefined(this, a).vars[a]; },
    'set':  function(x, e) { return chkDefined(this, x).vars[x] = ev.call(this, e) },
    'let':  function(x, e, b) {
        var nenv = pushEnv(this, {x: 'dummy'});
        nenv.vars[x] = ev.call(nenv, e);
        return ev.call(nenv, b);
    },

    'fun':  function(a, e) { return ['closure', a, e, this]; },
    'call': function(f)    {
        var c = chkType('closure', ev.call(this, f));
        var a = Array.prototype.slice.call(arguments, 1);

        if(c[1].length < a.length)
            throw 'Number of arguments provided is more than the required number of arguments.';

        var nenv = pushEnv(c[3]);
        for(var i = 0; i < a.length; ++i)
            nenv.vars[c[1][i]] = ev.call(this, a[i]);

        if(i < c[1].length) return ['closure', c[1].slice(i), c[2], nenv];
        else                return ev.call(nenv, c[2]);
    },

    'cons': function(h, t) { return ['cons', ev.call(this, h), ev.call(this, t)]; },
    'match':function(e)    {
        var nvars, v = ev.call(this, e);

        for(var i = 1; i < arguments.length; i += 2)
            if((nvars = patMatch(arguments[i], v)) !== false)
                return ev.call($.extend(pushEnv(this), {'vars': nvars}), arguments[i+1]);

        throw 'Match failure!';
    },

    'delay':function(e) { return ['lazy', evalTag['fun'].call(this, [], e)]; },
    'force':function(f) { return evalTag['call'].call(this, chkType('lazy', ev.call(this, f))[1]); },

    'listComp': function(e, x, el) {
        var lv = ev.call(this, el);
        if(lv === null) return null;

        var nenv = pushEnv(this);
        nenv.vars[x] = chkType('cons', lv)[1];

        if(arguments.length > 3) {
            if(chkType('boolean', ev.call(nenv, arguments[3])))
                return ['cons', ev.call(nenv, e) , evalTag['listComp'].call(this, e, x, lv[2], arguments[3])];
            else
                return evalTag['listComp'].call(this, e, x, lv[2], arguments[3]);
        } else return ['cons', ev.call(nenv, e) , evalTag['listComp'].call(this, e, x, lv[2])];
    },
};

function chkType(t, v) {
    if((typeof v == t) || (v instanceof Array && v[0] == t)) return v;
    else throw 'Invalid operand type for `' + v + '\'. Expected: ' + t;
};

function chkDefined(env, v) {
    if(env === null)                    throw 'Variable ' + v + ' not in scope.';
    else return env.vars[v] !== undefined ? env : chkDefined(env['_parent'], v);
};

function patMatch(p, v) {
    var r1, r2;
    if(p === v)                 return cleanObject();
    if(!(p instanceof Array))   return false;

    if(p[0] == '_')         return cleanObject();
    else if(p[0] == 'id')   { res = cleanObject(); res[p[1]] = v; return res; }
    else if(p[0] == 'cons') {
        if(!(v instanceof Array && v[0] == 'cons')) return false;
        return (r1 = patMatch(p[1], v[1])) && (r2 = patMatch(p[2], v[2])) ? $.extend(r1, r2) : false;
    } else return false;
};
