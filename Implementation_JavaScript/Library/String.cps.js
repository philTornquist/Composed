var String_CPS = "\
String is List'Character'                                                           \n\
AppendedString is String                                                            \n\
PrependedString is String                                                           \n\
                                                                                    \n\
AppendedString from String(s1), String(s2):                                         \n\
    [                                                                               \n\
        s1 > List'Character',                                                       \n\
        s2 > PrependedString                                                        \n\
    ] > Foldr'PrependedString' > PrependedString > String > AppendedString          \n\
                                                                                    \n\
PrependedString from PrependedString(s), Character(c):                              \n\
    [c, s > String] > PrependedString                                               \n\
                                                                                    \n\
PrependedString from String(s), Character(c):                                       \n\
    [                                                                               \n\
        c,                                                                          \n\
        s > List'Character'                                                         \n\
    ] > List'Character' > String > AppendedString                                   \n\
                                                                                    \n\
AppendedString from String(s), Character(c):                                        \n\
    [                                                                               \n\
        s,                                                                          \n\
        [                                                                           \n\
            c,                                                                      \n\
            Nothing > List'Character'                                               \n\
        ] > List'Character' > String                                                \n\
    ] > AppendedString                                                              \n\
"
