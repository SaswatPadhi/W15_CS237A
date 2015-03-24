tests(
  L,
  {
    name: 'numerics test',
    code: 'p(1).\n' +
          'p((-2)).\n' +
          'p((-3.1)).\n' +
          'p(X) :- X is (-2).\n' +
          'p(X) :- X is (-3.1).\n' +
          'p(X)?',
    expected: makeIterator(
      { X: new Const("1") },
      { X: new Const("(-2)") },
      { X: new Const("(-3.1)") },
      { X: new Const("-2") },
      { X: new Const("-3.1") }
    )
  },
  {
    name: 'arithmetic expressions',
    code: 'p((-2)*3.2+(4.6-1.3)/5).\n' +
          'p(Z) :- Z is (-2)*3.2+(4.6-1.3)/5.\n' +
          'p(Z) :- Z is 1.2345*(-12.345)/(-123.45)+(-1234.5)-(-12345).\n' +
          'p(X)?',
    expected: makeIterator(
      { X: new Const("(-2)*3.2+(4.6-1.3)/5") },
      { X: new Const("-5.74") },
      { X: new Const("11110.62345") }
    )
  },
  {
    name: 'relational expressions',
    code: 'q(X) :- X is 1.8/(3.4+5.6).\n' +
          'q(1.23456).\n' +
          'q(X) :- X is 1*2.3-3.4+5.6/7.8.\n' +
          'q((-6)).\n' +
          'pos(X) :- $X>0 is "true".\n' +
          'q(Z), pos(Z)?',
    expected: makeIterator(
      { Z: new Const("0.2") },
      { Z: new Const("1.23456") }
    )
  },
  {
    name: '$variables in expressions',
    code: 'p(0).\np(2).\np(5).\np(10).\np(17).\n\n' +
          'q(1).\nq(5).\nq(28).\nq(11).\nq(19).\nq(38).\n\n' +
          'oddeven(X,Y,Z) :- $X%2==1 is "true", $Y%2 is 0, Z is $X+$Y.\n\n' +
          'p(X), q(Y), oddeven(X,Y,Z), $Z%2 is 1?',
    expected: makeIterator(
      { X: new Const("5"), Y: new Const("28"), Z: new Const("33") },
      { X: new Const("5"), Y: new Const("38"), Z: new Const("43") },
      { X: new Const("17"), Y: new Const("28"), Z: new Const("45") },
      { X: new Const("17"), Y: new Const("38"), Z: new Const("55") }
    )
  },
  {
    name: 'factorial',
    code: 'pos(X) :- $X>0 is "true".\n\n' +
          'fact(0, 1).\n' +
          'fact(N, F) :- pos(N), N1 is $N-1, fact(N1, F1), F is $N*$F1.\n' +
          'fact(10,F)?',
    expected: makeIterator(
      { F: new Const("3628800") }
    )
  },
  {
    name: 'cut (1/4)',
    code: 'b(1).\nb(2).\nb(3).\n\n' +
          'c(1).\nc(2).\nc(3).\n\n' +
          'a(X, Y) :- b(X), !, c(Y).\n' +
          'a(X,Y)?',
    expected: makeIterator(
      { X: new Const("1"), Y: new Const("1") },
      { X: new Const("1"), Y: new Const("2") },
      { X: new Const("1"), Y: new Const("3") }
    )
  },
  {
    name: 'cut (2/4)',
    code: 'b(1).\nb(2).\nb(3).\n\n' +
          'c(1).\nc(2).\nc(3).\n\n' +
          'd(4).\nd(6).\n\n' +
          'a(X, Y) :- b(X), !, c(Y).\n' +
          'a(X, Y) :- d(X), d(Y).\n' +
          'a(X,Y)?',
    expected: makeIterator(
      { X: new Const("1"), Y: new Const("1") },
      { X: new Const("1"), Y: new Const("2") },
      { X: new Const("1"), Y: new Const("3") }
    )
  },
  {
    name: 'cut (3/4)',
    code: 'b(1).\nb(2).\nb(3).\n\n' +
          'c(1).\nc(2).\nc(3).\n\n' +
          'd(4).\nd(6).\n\n' +
          'a(X, Y) :- b(X), fail, !, c(Y).\n' +
          'a(X, Y) :- d(X), d(Y).\n' +
          'a(X,Y)?',
    expected: makeIterator(
      { X: new Const("4"), Y: new Const("4") },
      { X: new Const("4"), Y: new Const("6") },
      { X: new Const("6"), Y: new Const("4") },
      { X: new Const("6"), Y: new Const("6") }
    )
  },
  {
    name: 'cut (3/4)',
    code: 'b(1).\nb(2).\nb(3).\n\n' +
          'c(1).\nc(2).\nc(3).\n\n' +
          'd(4).\nd(6).\n\n' +
          'a(X, Y) :- b(X), !, c(Y), fail.\n' +
          'a(X, Y) :- d(X), d(Y).\n' +
          'a(X,Y)?',
    expected: makeIterator()
  },
  {
    name: "simple not",
    code: 'pos(X) :- $X>0 is "true".\n' +
          'X is 1.2-2.9*3.4, not(pos(X))?',
    expected: makeIterator(
      { X: new Const("-8.66") }
    )
  },
  {
    name: "isPrime",
    code: 'hasFactor(N,L) :- $N%$L is 0.\n' +
          'hasFactor(N,L) :- $L*$L<$N is "true", L2 is $L+2, hasFactor(N,L2).\n\n'+
          'isPrime(2).\nisPrime(3).\n' +
          'isPrime(P) :- $P>3 is "true", $P%2 is 1, not(hasFactor(P,3)).\n\n' +
          'isPrime(97)?',
    expected: makeIterator({})
  }
);
