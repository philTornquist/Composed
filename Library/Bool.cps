Bit is Number:
    [
        value,
        0
    ] > Compare'Number' {
        less: 1
        greater: 1
        equal: 0
    }

BitAnd is Bit
BitAnd from Bit(b1), Bit(b2):
    [
        b1 > Number,
        b2 > Number
    ] > Product > Number > Bit

BitOr is Bit
BitOr from Bit(b1), Bit(b2):
    [
        b1 > Number,
        b2 > Number
    ] > Sum > Number > Bit

BitXor is Bit
BitXor from Bit(b1), Bit(b2):
    [
        b1 > Number,
        b2 > Number
    ] > Difference > Number > Bit

BitNot is Bit
BitNot from Bit(b1):
    [
        b1 > Number,
        1
    ] > Difference > Number > Bit > BitNot

[A]Test is [A]
[A]Test from Bit(b):
    [
        b > Number,
        0
    ] > [A]Compare {
        equal: {false A}
        less: {true A}
        greater: {true A}
    } > [A] > [A]Test
