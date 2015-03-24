// Initialize the class table!

OO.initializeCT();

// Tests for Part III

tests(O,
  {
    name: 'thenElse (1/2)',
    code: 'def True then tb else fb = tb.call();\n' +
          'def False then tb else fb = fb.call();\n' +
          '1 > 2 then {111} else {222}',
    expected: 222
  },
  {
    name: 'thenElse (2/2)',
    code: 'def True then tb else fb = tb.call();\n' +
          'def False then tb else fb = fb.call();\n' +
          '1 < 2 then {111} else {222}',
    expected: 111
  },
  {
    name: 'non-local return (1/2)',
    code: 'def True then tb else fb = tb.call();\n' +
          'def False then tb else fb = fb.call();\n\n' +
          'def Number.fact() {\n' +
          '  this === 0 then {\n' +
          '    return 1;\n' +
          '  } else {\n' +
          '    return this * (this - 1).fact();\n' +
          '  }\n' +
          '}\n\n' +
          '5.fact()',
    expected: 120
  },
  {
    name: 'non-local return (2/2)',
    code: 'def Object.m() {\n' +
          '  var b = { return 5; };\n' +
          ' return this.n(b) * 2;\n' +
          '}\n\n' +
          'def Object.n(aBlock) {\n' +
          '  aBlock.call();\n' +
          '  return 42;\n' +
          '}\n\n' +
          'new Object().m()',
    expected: 5
  },

/* by David Torosyan */
  {
    name: 'implicit return (1/2)',
    code: '{ var x = 1; x + 2; var y = 2;}.call()\n',
    expected: 3
  },
  {
    name: 'null return block',
    code: '{}.call()\n',
    expected: null
  },
  {
    name: 'null return method',
    code: 'def Object.foo() {\n' +
          '1;\n' +
          '}\n' +
          '\n' +
          'new Object().foo()\n',
    expected: null
  },
  {
    name: 'recursive non-local return',
    code: 'def True then tb else fb = tb.call();\n' +
          'def False then tb else fb = fb.call();\n' +
          '\n' +
          'def Object.foo(first) {\n' +
          '  first\n' +
          '    then { this.bar(); }\n' +
          '    else { \n' +
          '      var b =  {return 5;}; \n' +
          '      return b;\n' +
          '    }\n' +
          '}\n' +
          '\n' +
          'def Object.bar() {\n' +
          '  this.foo(false).call();\n' +
          '}\n' +
          '\n' +
          'new Object().foo(true)\n',
    shouldThrow: true
  },
  {
    name: 'while loop',
    code: 'def True then tb else fb = tb.call();\n' +
          'def False then tb else fb = fb.call();\n' +
          'def Block while body = this.call() then {body.call(); this while body; } else {};\n' +
          '\n' +
          'var i = 0;\n' +
          'var sum = 0;\n' +
          '{i < 10} while {\n' +
          '    i = i + 1;\n' +
          '    sum = sum + i;\n' +
          ' };\n' +
          ' \n' +
          ' sum;\n',
    expected: 55
  },
  {
    name: 'do while loop',
    code: 'def True then tb else fb = tb.call();\n' +
          'def False then tb else fb = fb.call();\n' +
          'def Block while body = this.call() then {body.call(); this while body; } else {};\n' +
          'def Block doWhile cond {\n' +
          '    this.call();\n' +
          '    cond.call() then {this doWhile cond;} else {};\n' +
          '}\n' +
          '\n' +
          'var i = 0;\n' +
          'var sum = 0;\n' +
          '{\n' +
          '    i = i + 1;\n' +
          '    sum = sum + i;\n' +
          ' } doWhile {i < 10};\n' +
          ' \n' +
          ' sum;\n',
    expected: 55
  },
  {
    name: 'for loop',
    code: 'def True then tb else fb = tb.call();\n' +
          'def False then tb else fb = fb.call();\n' +
          'def Number to n do body = this <= n then {body.call(this); this+1 to n do body} else {};\n' +
          '\n' +
          'var sum = 0;\n' +
          '0 to 10 do {\n' +
          '    i | sum = sum + i;\n' +
          ' };\n' +
          ' \n' +
          ' sum;\n',
    expected: 55
  },
  {
    name: 'floating this',
    code: 'this;\n',
    shouldThrow: true
  },
  {
    name: 'floating super',
    code: 'super.foo();\n',
    shouldThrow: true
  },
  {
    name: 'Object super',
    code: 'def Object.foo() { return super.foo(); };\n',
    shouldThrow: true
  },
  {
    name: 'ans',
    code: '1;\n' +
          'def Object.m() {\n' +
          '}\n',
    expected: 1
  },
{
    name: 'Mixed inst/normal vars',
    code: "class T with a, b;\n" +
    "def T.m() {this.a = 6; var b=20;var m = {var b; this.b = 5; this.a = 2; b=7;};var t = {return this.a * b;};m.call();return t.call();}\n" +
    "new T().m();",
    expected: 40
},
{
    name: "block closure",
    code: "var y = {var z=0; {z=z+1;z}};{ x | x.call(); x.call();  x.call(); }.call(y.call());",
    expected: 3
},
{
    name: "closure with non-local return",
    code: "def True then tb else fb = tb.call();def False then tb else fb = fb.call();var c=0;\n" +
    "def Object.m() {var c=20;var b = {return c;};return this.n(b);}\n" +
    "def Object.n(aBlock) {(c > 10) then {aBlock.call();} else {c=c+1;};return this.n(aBlock)+100;}\n" +
    "new Object().m();",
    expected: 20
}
);

