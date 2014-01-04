[A]List is [A], [A]List

[A]Foldr is [A]
[A]Foldr from [B]List(l), [A](b):
l > [A]Exists {
   yes:
	[
		[
			l > [B]List,
			b
       ] > [A]Foldr > [A],
       l > [B]
   ] > [A]
   no: b
   } > [A] > [A]Foldr

[A]Foldl is [A]
[A]Foldl from [B]List(l), [A](b):
l > [A]Exists {
   yes:
   [
       [
           l > [B],
           b
       ] > [A],
       l > [B]List
   ] > [A]Foldl
   no: b
} > [A] > [A]Foldl

[A]Map is [A]List
[A]Map from [B]Map(m):
   m > [B]List > [A]Map

[A]Map from [B]List(l):
l > [A]Exists'Map' {
   yes:
   [
       l > [B] > [A],
       l > [B]List > [A]Map > [A]List
   ] > [A]List > [A]Map
   no: Nothing
}

[A]Map from [B]List(l), [V](v):
l > [A]Exists'Map' {
    yes:
    [
        [
            l > [B],
            v
        ] > [A],
        [
            v,
            l > [B]List
        ] > [A]Map > [A]List
    ] > [A]List > [A]Map
    no: Nothing
}


[A]Filter is [A]List
[A]Filter from [B]List(l):
    [
        l > [A]Map > [A]List,
        Nothing > [A]FilterCheck
    ] > [A]Foldr'FilterCheck' > [A]FilterCheck > [A]List > [A]Filter

[A]FilterCheck is [A]List
[A]FilterCheck from [A](v), [A]FilterCheck(l):
   v > [A]Exists {
       yes: [v, l > [A]List] > [A]List > [A]FilterCheck
       no: l
   }

Count is Number
Count from [A]List(l):
   [
       l,
       0 > Count
   ] > Foldl'Count' > Count

Count from [A](x), Count(c):
   [1, c > Number] > Sum > Number > Count

