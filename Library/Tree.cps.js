var Tree_CPS = "\
[T]Tree is [T]LeftTree, [T], [T]RightTree   \n\
[T]LeftTree is [T]Tree, -Recursive          \n\
[T]RightTree is [T]Tree, -Recursive         \n\
";

var InOrderWalk_CPS = "\
[T]InOrderWalk is [T]List                   \n\
\n\
[T]InOrderWalk from [T]Tree(t):             \n\
    t > [T]Exists'InOrderWalk' {    \n\
    yes:    \n\
        [   \n\
            t > [T]LeftTree > [T]Exists'List' { no: Nothing > [T]List yes: t > [T]LeftTree > [T]Tree > [T]InOrderWalk > [T]List } > [T]List,   \n\
            [   \n\
                t > [T],    \n\
                t > [T]RightTree > [T]Exists'List' { no: Nothing > [T]List yes: t > [T]RightTree > [T]Tree > [T]InOrderWalk > [T]List } > [T]List    \n\
            ] > [T]List \n\
        ] > [T]AppendedList > [T]List > [T]InOrderWalk  \n\
    no: Nothing > [T]InOrderWalk    \n\
    } > [T]InOrderWalk  \n\
";

var Tree_Library = Tree_CPS + InOrderWalk_CPS;
