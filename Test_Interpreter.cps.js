var TEST_CODE = 
[
'test = Point2D,X,Y 1,2:',
'test = Summation,List\'Number\' [[[Nothing,3],2],1]:',

'Point2D from Number(x), -Type(t):',
'   [x, 20, t] > Point2D',

'TestSelector is Point2D:',
'   [value > X > Number, Selector-Type] > Point2D',

'Point2D from Number(x), Number(y), Selector-Type:',
'   [x, y] > Point2D',

'X from Y(l):',
' 23 > X',

'Sum from Number(p), Number(h), Number(i), Number(l):', 
'	a:	[p, i] > Sum > Number',
'	b:	[h, l] > Sum > Number',
'	[a,b] > Sum',

'X is Number',
'Y is Number',
'Point2D is X, Y',
'Vector2D is X, Y',

'Vector2D from Number(a):',
'   [a > X, a > Y] > Vector2D',

'Point2D from Number(x), Number(y):',
'	[x > X, y > Y] > Point2D',

'Number from Number(L), Number(k), Number(s):',
'	Nothing > Sum > Number > Number > Number > Number',

'Number from Number(l), Number(k):',
'	l > Number{help:[l,l]>Sum test:[k,k]>Sum}',

'Number from Number(a):',
'	{test Number}',

'Point2D from Number(l):',
'	[l, [l,l,l] > Number > Exists\'Number\'{no:23} > Number] > Point2D',


'Point2D from Number(l), Number(i), Number(k):',
'	[l > Y, [l,l,l] > Number > X] > Point2D',

'Point2D from Point2D(l), Number(x), Number(y):',
'	[(x > X -> (y > Y -> l)) > Y,',
'	(x > X -> (y > Y -> l)) > X] > Point2D',


'[P]List from X(s), [P](l), Number(j), [P]List(k):',
'	[l, k] > [P]List',

'List\'Number\' from Number(a), Number(b):',
'	[a, [b, Nothing > List\'Number\'] > List\'Number\'] > List\'Number\'',

'Sum from Sum(a), Number(b):',
'	[a > Number, b] > Sum',

'IsLessThan5 is Number:',
'   [value, 5] > Compare\'Number\' {',
'       less: value',
'   } > Number',

'Summation is Sum',
'Summation from List\'Number\'(l):',
'   [',
'       l,',
'       [0,0] > Sum',
'   ] > Foldl\'Sum\' > Sum > Summation',

'Average is Number',
'Average from Sum(s), Count(c):',
'   [s > Number, c > Number] > Quotient > Number > Average',

'Average from List\'Number\'(l):',
'   [',
'       l > Summation > Sum,',
'       l > Count',
'   ] > Average',

'STD is Number',
'STD from List\'Number\'(l):',
'   [',
'       [',
'           l,',
'           l > Average > Number',
'       ] > Map\'Difference\' > Map\'Number\' > Map\'Square\' > Map\'Number\' > List\'Number\' > Summation > Sum > Number,',
'       [l > Count > Number, 1] > Difference > Number',
'   ] > Quotient > Number > SquareRoot > Number > STD',

].join('\n');
