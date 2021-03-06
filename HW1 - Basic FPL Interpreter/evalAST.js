function cleanObject(init) { return $.extend(Object.create(null), init === undefined ? {} : init); }

function pushEnv(env, init) { return $.extend(cleanObject(), {'_parent': env, 'vars': cleanObject(init)}); }

F.evalAST = function (ast) { return ev.call(pushEnv(null), ast); };

function ev(ast) {
    if (ast === null || typeof ast == 'number'
                     || typeof ast == 'boolean'
                     || (ast instanceof Array && ast[0] == 'closure'))
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

    'id':   function(a)    { return chkDefined(this, a).vars[a]; },
    'let':  function(x, e, b) {
        var nenv = pushEnv(this);
        nenv.vars[x] = ev.call(this, e);
        return ev.call(nenv, b);
    },

    'fun':  function(a, e) { return ['closure', a, e, this]; },
    'call': function(f)    {
        var c = chkType('closure', ev.call(this, f));
        var a = Array.prototype.slice.call(arguments, 1);

        if(c[1].length != a.length)
            throw 'Number of arguments provided doesn\'t match the required number of arguments.';

        var nenv = pushEnv(c[3]);
        for(var i = 0; i < a.length; ++i)
            nenv.vars[c[1][i]] = ev.call(this, a[i]);

        return ev.call(nenv, c[2]);
    },
};

function chkType(t, v) {
    if((typeof v == t) || (v instanceof Array && v[0] == t)) return v;
    else throw 'Invalid operand type for `' + v + '\'. Expected: ' + t;
};

function chkDefined(env, v) {
    if(env === null)                    throw 'Variable ' + v + ' not in scope.';
    else if(env.vars[v] !== undefined)  return env;
    else                                return chkDefined(env['_parent'], v);
};
