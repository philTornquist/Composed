var List_CPS = "\
[A]List is [A], [A]List                                                \n"

var AppendedList_CPS = "\
[T]AppendedList is [T]List      \n\
[T]AppendedList from [T]List(f), [T]List(r):    \n\
    f > [T]Exists'List' {       \n\
        yes: [f > [T], [f > [T]List, r] > [T]AppendedList > [T]List] > [T]List       \n\
        no: r      \n\
    } > [T]List > [T]AppendedList     \n\
"

var Foldr_CPS = "\
[A]Foldr is [A]                                                        \n\
[A]Foldr from [B]List(l), [A](b):                                      \n\
l > [A]Exists {                                                        \n\
   yes:                                                                \n\
	[                                                                  \n\
		[                                                              \n\
			l > [B]List,                                               \n\
			b                                                          \n\
       ] > [A]Foldr > [A],                                             \n\
       l > [B]                                                         \n\
   ] > [A]                                                             \n\
   no: b                                                               \n\
   } > [A] > [A]Foldr                                                  \n"

var Foldl_CPS = "\
[A]Foldl is [A]                                                        \n\
[A]Foldl from [B]List(l), [A](b):                                      \n\
l > [A]Exists {                                                        \n\
   yes:                                                                \n\
   [                                                                   \n\
       [                                                               \n\
           l > [B],                                                    \n\
           b                                                           \n\
       ] > [A],                                                        \n\
       l > [B]List                                                     \n\
   ] > [A]Foldl                                                        \n\
   no: b                                                               \n\
} > [A] > [A]Foldl                                                     \n"

var Map_CPS = "\
[A]Map is [A]List                                                      \n\
[A]Map from [B]Map(m):                                                 \n\
   m > [B]List > [A]Map                                                \n\
                                                                       \n\
[A]Map from [B]List(l):                                                \n\
l > [A]Exists'Map' {                                                   \n\
   yes:                                                                \n\
   [                                                                   \n\
       l > [B] > [A],                                                  \n\
       l > [B]List > [A]Map > [A]List                                  \n\
   ] > [A]List > [A]Map                                                \n\
   no: Nothing                                                         \n\
}                                                                      \n\
                                                                       \n\
[A]Map from [B]List(l), [V](v):                                        \n\
l > [A]Exists'Map' {                                                   \n\
    yes:                                                               \n\
    [                                                                  \n\
        [                                                              \n\
            l > [B],                                                   \n\
            v                                                          \n\
        ] > [A],                                                       \n\
        [                                                              \n\
            v,                                                         \n\
            l > [B]List                                                \n\
        ] > [A]Map > [A]List                                           \n\
    ] > [A]List > [A]Map                                               \n\
    no: Nothing                                                        \n\
}                                                                      \n"

var Filter_CPS = "\
[A]Filter is [A]List                                                   \n\
[A]Filter from [B]List(l):                                             \n\
    [                                                                  \n\
        l > [A]Map > [A]List,                                          \n\
        Nothing > [A]FilterCheck                                       \n\
    ] > [A]Foldr'FilterCheck' > [A]FilterCheck > [A]List > [A]Filter   \n\
                                                                       \n\
[A]FilterCheck is [A]List                                              \n\
[A]FilterCheck from [A](v), [A]FilterCheck(l):                         \n\
   v > [A]Exists {                                                     \n\
       yes: [v, l > [A]List] > [A]List > [A]FilterCheck                \n\
       no: l                                                           \n\
   }                                                                   \n"

var Count_CPS = "\
Count is Number                                                        \n\
Count from [A]List(l):                                                 \n\
   [                                                                   \n\
       l,                                                              \n\
       0 > Count                                                       \n\
   ] > Foldl'Count' > Count                                            \n\
                                                                       \n\
Count from [A](x), Count(c):                                           \n\
   [1, c > Number] > Sum > Number > Count                              \n"

var Last_CPS = "\
[A]Last is [A]                                                         \n\
[A]Last from [A]List(l):                                               \n\
   [l] > [A]Exists'Last' {                                             \n\
      yes: l > [A]List > [A]Exists'Last' {                             \n\
	     yes: l > [A]List > [A]Last                                    \n\
		 no: l > [A] > [A]Last                                         \n\
	  } > [A]Last                                                      \n\
	  no: Nothing > [A]Last                                            \n\
   } > [A]Last                                                         \n"

    
var List_Library = List_CPS + AppendedList_CPS + Foldr_CPS + Foldl_CPS + Map_CPS + Filter_CPS + Count_CPS + Last_CPS;
