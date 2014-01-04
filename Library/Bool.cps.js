var Bool_CPS = "\
Bit is Number:                                      \n\
    [                                               \n\
        value,                                      \n\
        0                                           \n\
    ] > Compare'Number' {                           \n\
        less: 1                                     \n\
        greater: 1                                  \n\
        equal: 0                                    \n\
    }                                               \n\
                                                    \n\
BitAnd is Bit                                       \n\
BitAnd from Bit(b1), Bit(b2):                       \n\
    [                                               \n\
        b1 > Number,                                \n\
        b2 > Number                                 \n\
    ] > Product > Number > Bit                      \n\
                                                    \n\
BitOr is Bit                                        \n\
BitOr from Bit(b1), Bit(b2):                        \n\
    [                                               \n\
        b1 > Number,                                \n\
        b2 > Number                                 \n\
    ] > Sum > Number > Bit                          \n\
                                                    \n\
BitXor is Bit                                       \n\
BitXor from Bit(b1), Bit(b2):                       \n\
    [                                               \n\
        b1 > Number,                                \n\
        b2 > Number                                 \n\
    ] > Difference > Number > Bit                   \n\
                                                    \n\
BitNot is Bit                                       \n\
BitNot from Bit(b1):                                \n\
    [                                               \n\
        b1 > Number,                                \n\
        1                                           \n\
    ] > Difference > Number > Bit > BitNot          \n\
                                                    \n\
[A]Test is [A]                                      \n\
[A]Test from Bit(b):                                \n\
    [                                               \n\
        b > Number,                                 \n\
        0                                           \n\
    ] > [A]Compare {                                \n\
        equal: {false A}                            \n\
        less: {true A}                              \n\
        greater: {true A}                           \n\
    } > [A] > [A]Test                               \n\
"
