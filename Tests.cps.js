var TEST_CODE = 
[
'testinline = Point2D,X,Y 1,2:',
'testinline = Summation,List\'Number\' [[[Nothing,3],2],1]:',

'Point2D from Number(x), -SelectorType(t):',
'   [x, 20, t] > Point2D',

'TestSelector is Point2D:',
'   [value > X > Number, Selector-SelectorType] > Point2D',

'Point2D from Number(x), Number(y), Selector-SelectorType:',
'   [x, y] > Point2D',

'TestingSpecification is Number:',
'   23',

'TestingSubConversions is Number',
'TestingSubConversions from Number(p), Number(h), Number(i), Number(l):', 
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

'TestingNothingReturn is Number',
'TestingNothingReturn from Number(L), Number(k), Number(s):',
'	Nothing > Sum > Number',

'TestingAnswer is Number',
'TestingAnswer from Number(l), Number(k):',
'	l > TestingAsk{ignored:[l,l]>Sum used:[k,k]>Sum}',

'TestingAsk is Number',
'TestingAsk from Number(a):',
'	{used Number}',

'TestingExists is Point2D',
'TestingExists from Number(l):',
'	[l, [l,l,l] > TestingNothingReturn > Exists\'Number\'{no:23} > Number] > Point2D',

'TestingNothingInDataStructure is Point2D',
'TestingNothingInDataStructure from Number(l), Number(i), Number(k):',
'	[l > Y, [l,l,l] > TestingNothingReturn > Number > X] > Point2D',

'TestingInjection is Point2D',
'TestingInjection from Point2D(l), Number(x), Number(y):',
'	[(x > X -> (y > Y -> l)) > Y,',
'	(x > X -> (y > Y -> l)) > X] > Point2D',


'[A]TestingGeneric is [A]List',
'[P]TestingGeneric from X(s), [P](l), Number(j), [P]List(k):',
'	[l, k] > [P]List',

'TestingListBuild is List\'Number\'',
'TestingListBuild from Number(a), Number(b):',
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
