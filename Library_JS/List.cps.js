var List_CPS = "\
[A]List is [A], [A]List                                                \n\
                                                                       \n\
[A]Foldr is [A]                                                        \n\
[A]Foldr from [B]List(l), [A](b):                                      \n\
l > [A]Exists {                                                        \n\
   yes:                                                                \n\
	[                                                                    \n\
		[                                                                  \n\
			l > [B]List,                                                     \n\
			b                                                                \n\
       ] > [A]Foldr > [A],                                             \n\
       l > [B]                                                         \n\
   ] > [A]                                                             \n\
   no: b                                                               \n\
   } > [A] > [A]Foldr                                                  \n\
                                                                       \n\
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
} > [A] > [A]Foldl                                                     \n\
                                                                       \n\
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
}                                                                      \n\
                                                                       \n\
                                                                       \n\
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
   }                                                                   \n\
                                                                       \n\
Count is Number                                                        \n\
Count from [A]List(l):                                                 \n\
   [                                                                   \n\
       l,                                                              \n\
       0 > Count                                                       \n\
   ] > Foldl'Count' > Count                                            \n\
                                                                       \n\
Count from [A](x), Count(c):                                           \n\
   [1, c > Number] > Sum > Number > Count                              \n\
"

    
