var CCompiler_CPS = "\
Literal is String                                                               \n\
Parser'Literal' from [A]Parser(p):                                              \n\
    [                                                                           \n\
        Nothing > Literal,                                                      \n\
        p                                                                       \n\
    ] > Parser'Literal' > Parser'Literal'                                       \n\
                                                                                \n\
Parser'Literal' from Parser'Literal'(p):                                        \n\
    p > IsLiteralTerminator > Bit > Test'Parser'Literal'' {                     \n\
        false:                                                                  \n\
            [                                                                   \n\
                [                                                               \n\
                    p > Character,                                              \n\
                    p > Literal > String                                        \n\
                ] > AppendedString > String > Literal,                          \n\
                p > Next'Parser'Literal'' > Parser'Literal'                     \n\
            ] > Parser'Literal' > Parser'Literal'                               \n\
        true: p                                                                 \n\
    } > Parser'Literal'                                                         \n\
                                                                                \n\
                                                                                \n\
ClearedWhite is Number                                                          \n\
Parser'ClearedWhite' from [A]Parser(p):                                         \n\
    p > IsWhiteSpace > Bit > Test'Parser'ClearedWhite''{                        \n\
        true:                                                                   \n\
            p > [A]Next'Parser' > [A]Parser > Parser'ClearedWhite'              \n\
        false:                                                                  \n\
            [                                                                   \n\
                p,                                                              \n\
                12345 > ClearedWhite                                            \n\
            ] > Parser'ClearedWhite'                                            \n\
    } > Parser'ClearedWhite'                                                    \n\
                                                                                \n\
DataType is GenericType, SubType                                                \n\
SubType is Literal, SubType                                                     \n\
GenericType is Literal                                                          \n\
                                                                                \n\
Parser'DataType' from [A]Parser(p):                                             \n\
    [                                                                           \n\
        [                                                                       \n\
            [                                                                   \n\
                p > Parser'Literal' > Literal,                                  \n\
                p > Parser'Literal' > Parser'SubType' > SubType                 \n\
            ] > SubType,                                                        \n\
            Nothing > GenericType                                               \n\
        ] > DataType,                                                           \n\
        p > Parser'Literal' > Parser'SubType'                                   \n\
    ] > Parser'DataType'                                                        \n\
                                                                                \n\
Parser'SubType' from [A]Parser(p):                                              \n\
    p > Parser'ClearedWhite' > IsQuote > Bit > Test'Parser'SubType'' {          \n\
        false:                                                                  \n\
            [                                                                   \n\
                Nothing > SubType,                                              \n\
                p                                                               \n\
            ] > Parser'SubType'                                                 \n\
        true:                                                                   \n\
            [                                                                   \n\
                [                                                               \n\
                    p > Parser'ClearedWhite' > Next'Parser'ClearedWhite'' > Parser'ClearedWhite' > Parser'Literal' > Literal,\n\
                    p > Parser'ClearedWhite' > Next'Parser'ClearedWhite'' > Parser'ClearedWhite' > Parser'Literal' > Parser'SubType' > SubType\n\
                ] > SubType,                                                    \n\
                p > Parser'ClearedWhite' > Next'Parser'ClearedWhite'' > Parser'ClearedWhite' > Parser'Literal' > Parser'SubType'\n\
            ] > Parser'SubType'                                                 \n\
    } > Parser'SubType'                                                         \n\
                                                                                \n\
Parser'GenericType' from [A]Parser(p):                                          \n\
    p > Parser'ClearedWhite' > IsOpenSquareBrace > Bit > Test'Parser'GenericType'\n\
                                                                                \n\
                                                                                \n\
                                                                                \n\
IsLiteralTerminator is Bit                                                      \n\
IsLiteralTerminator from [A]Parser(p):                                          \n\
    [                                                                           \n\
        [                                                                       \n\
            p > IsWhiteSpace > Bit,                                             \n\
            [\"_\", p > Character] > CompareBit > Bit                           \n\
        ] > BitOr > Bit,                                                        \n\
        p > IsQuote > Bit                                                       \n\
    ] > BitOr > Bit > IsLiteralTerminator                                       \n\
                                                                                \n\
IsWhiteSpace is Bit                                                             \n\
IsWhiteSpace from [A]Parser(p):                                                 \n\
    [\" \", p > Character] > CompareBit > Bit > IsWhiteSpace                    \n\
                                                                                \n\
IsQuote is Bit                                                                  \n\
IsQuote from [A]Parser(p):                                                      \n\
    [\"'\", p > Character] > CompareBit > Bit > IsQuote                         \n\
                                                                                \n\
CompareBit is Bit                                                               \n\
CompareBit from Character(c1), Character(c2):                                   \n\
    [c1, c2] > Compare'Bit' {equal:1 less:0 greater:0} > Bit > CompareBit       \n\
                                                                                \n\
IsOpenSquareBrace is Bit                                                        \n\
IsOpenSquareBrace from [A]Parser(p):                                            \n\
    [\"[\", p > Character] > CompareBit > Bit > IsOpenSquareBrace               \n\
"
