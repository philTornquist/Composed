String is List'Character'
AppendedString is String
PrependedString is String

AppendedString from String(s1), String(s2):
    [
        s1 > List'Character',
        s2 > PrependedString
    ] > Foldr'PrependedString' > PrependedString > String > AppendedString

PrependedString from PrependedString(s), Character(c):
    [c, s > String] > PrependedString

PrependedString from String(s), Character(c):
    [
        c,
        s > List'Character'
    ] > List'Character' > String > AppendedString

AppendedString from String(s), Character(c):
    [
        s,
        [
            c,
            Nothing > List'Character'
        ] > List'Character' > String
    ] > AppendedString

