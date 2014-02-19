Composed JavaScript Implementation
========

An implementation of Composed in JavaScript.

Explaination of the language is in the [README](https://github.com/philTornquist/Composed) in the master branch.

[Try it](http://philTornquist.github.io/Composed)

Implementation Supports:
- Compilation to JavaScript
- Conversion inlining 

Working on:
- Tail call optimization
- Partial conversion call
    In a trivial example:

    [5, 10] > Point2D > X
    
    Should be optimized to:
    
    5
