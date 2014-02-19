function Run_Tests()
{
    var failed = 0;
    var results = [];
    function check(test, conv, params, result, pseudocode, cps) {
        //if (!test) {LOG("SKIPPED: " + conv); return;}
        
        Data = new DataStore();
        Data.JITName = js_conversion_rename;

        load_bytecode(Data, compile(cps));
        load_bytecode(Data, pseudocode);

        LOG(["LOADED: Conversions"]);
        for (var key in Data.Conversions) LOG(key);
        LOG([]);
        
        LOG(["LOADED: Generics"]);
        for (var key in Data.Generics) LOG(key);
        LOG([]);
        
        LOG(["LOADED: Selectors"]);
        for (var key in Data.Selectors) { LOG([key]); for(var sel in Data.Selectors[key]) LOG(sel); LOG([]); }
        LOG([]);
        
        link_conversions(Data);


        var funct = CALL(Data, conv);
        var test = funct.apply(Data.JITed, params);
        test = test ? test : "Nothing";
        if ("" + result === "" + test) LOG("Test Passed! " + result + " = " + conv + params);
        else { failed++;
              LOG("Error with test [" + conv + "] expected " + result + " but got " + test + ". Parameters: " + params);
        }
    }
    
    function make_list(list, LorR) {
        return LorR == 'L' ?
            [         list.length == 1 ? "Nothing" : make_list(list.slice(1,list.length), LorR), list[0]] :
            [list[0], list.length == 1 ? "Nothing" : make_list(list.slice(1,list.length), LorR)];
    }
    
    function listTo(val) {var r=[];for(var i=0;i<val;i++)r.push(i);return r;}
    function std(l){var m=0;for(var i=0;i<l.length;i++)m+=l[i];m/=i;var n=[];for(i=0;i<l.length;i++)n.push((l[i]-m)*(l[i]-m));var s=0;for(i=0;i<n.length;i++)s+=n[i];return Math.sqrt(s/(l.length-1));}

var NONE = '';
var NOTHING = "" +
"Conversion>[A],Nothing\n"+
"Nothing>\n";

var EXISTS = "" +
"Conversion>[A],[A]Exists\n"+
"Element>0\n"+
"Param>0\n"+
"Extract>0\n"+
"\n"+
"Specification>[B]Exists,[A]\n"+
"ENTER>\n"+
"IGNORE>(\n"+
"Param>0\n"+
"IGNORE> !== \"Nothing\" ? \n"+
"Ask>yes\n"+
"IGNORE> : \n"+ 
"Ask>no\n"+
"IGNORE>)\n"+
"EXIT>\n";

var SUM = "" + 
"Conversion>Number,Sum\n"+
"Element>0\n"+
"Param>0\n"+
"Extract>0\n"+
"\n"+
"Conversion>Sum,Number\n"+
"Data Structure>1\n"+
"\n"+
"Conversion>Sum,Number,Number\n"+
"ENTER>\n"+
"IGNORE>(\n"+
"Param>0\n"+
"IGNORE> + \n"+
"Param>1\n"+
"IGNORE>)\n"+
"EXIT>\n";

var DIFFERENCE = "" + 
"Conversion>Number,Difference\n"+
"Element>0\n"+
"Param>0\n"+
"Extract>0\n"+
"\n"+
"Conversion>Difference,Number\n"+
"Data Structure>1\n"+
"\n"+
"Conversion>Difference,Number,Number\n"+
"ENTER>\n"+
"IGNORE>(\n"+
"Param>0\n"+
"IGNORE> - \n"+
"Param>1\n"+
"IGNORE>)\n"+
"EXIT>\n";

var QUOTIENT = "" + 
"Conversion>Quotient,Number\n"+
"Data Structure>1\n"+
"\n"+
"Conversion>Number,Quotient\n"+
"Element>0\n"+
"Param>0\n"+
"Extract>0\n"+
"\n"+
"Conversion>Quotient,Number,Number\n"+
"ENTER>\n"+
"IGNORE>(\n"+
"Param>0\n"+
"IGNORE> / \n"+
"Param>1\n"+
"IGNORE>)\n"+
"EXIT>\n";

var SQUARE = "" + 
"Conversion>Number,Square\n"+
"Element>0\n"+
"Param>0\n"+
"Extract>0\n"+
"\n"+
"Specification>Square,Number\n"+
"ENTER>\n"+
"IGNORE>(\n"+
"Param>0\n"+
"IGNORE> * \n"+
"Param>0\n"+
"IGNORE>)\n"+
"EXIT>\n";

var SQRT = "" + 
"Conversion>Number,SquareRoot\n"+
"Element>0\n"+
"Param>0\n"+
"Extract>0\n"+
"\n"+
"Specification>SquareRoot,Number\n"+
"ENTER>\n"+
"IGNORE>Math.sqrt(\n"+
"Param>0\n"+
"IGNORE>)\n"+
"EXIT>\n";
    
var COMPARE = "" +
"Conversion>[A]Compare,[A]\n"+
"Data Structure>1\n"+
"\n"+
"Conversion>[A],[A]Compare\n"+
"Element>0\n"+
"Param>0\n"+
"Extract>0\n"+
"\n"+
"Conversion>[A]Compare,Character,Character\n"+
"ENTER\n"+
"Param>0\n"+
"IGNORE> < \n"+
"Param>1\n"+
"IGNORE> ? \n"+
"Ask>less\n"+
"IGNORE> : (\n"+
"Param>0\n"+
"IGNORE> == \n"+
"Param>1\n"+
"IGNORE> ? \n"+
"Ask>equal\n"+
"IGNORE> : \n"+
"Ask>greater\n"+
"IGNORE>)\n"+
"EXIT>\n"+
"\n"+
"Conversion>[A]Compare,Number,Number\n"+
"ENTER>\n"+
"Param>0\n"+
"IGNORE> < \n"+
"Param>1\n"+
"IGNORE> ? \n"+
"Ask>less\n"+
"IGNORE> : (\n"+
"Param>0\n"+
"IGNORE> == \n"+
"Param>1\n"+
"IGNORE> ? \n"+
"Ask>equal\n"+
"IGNORE> : \n"+
"Ask>greater\n"+
"IGNORE>)\n"+
"EXIT>\n";


    check(0,"TestingSpecification,Number",
            [3],
            23,
            NONE,
            'TestingSpecification is Number:\n'+
            '   23'
            );
    check(0,"Point2D,-SelectorType,Number,Number",
            ["SelectorType-Selector",1,2],
            [1,2],
            NONE,
            'Point2D is X, Y\n'+
            'X is Number\n'+
            'Y is Number\n'+
            'Point2D from Number(x), Number(y), Selector-SelectorType:\n'+
            '   [x > X, y > Y] > Point2D\n'
            );
    check(0,"Point2D,-SelectorType,Number",
            ["SelectorType-Selector",1],
            [1,20],
            NONE,
            'Point2D is X, Y\n'+
            'X is Number\n'+
            'Y is Number\n'+
            'Point2D from Number(x), Number(y), Selector-SelectorType:\n'+
            '   [x > X, y > Y] > Point2D\n'+
            'Point2D from Number(x), -SelectorType(t):\n'+
            '   [x, 20, t] > Point2D\n' 
            );
    check(0,"TestingExists,Number",
            [5],
            5,
            NOTHING+
            EXISTS,
            "TestingExists is Number:\n"+
            "   Nothing > Number > Exists'Number' {\n"+
            "       no: 4 > Exists'Number' {\n"+
            "           yes: value\n"+
            "           no: 0\n" + 
            "       }\n"+
            "       yes: 1\n" + 
            "   } > Number"
            );
    check(0,"TestSelector,Point2D", 
            [[12,9]],
            [12,20],
            NONE,
            'Point2D is X, Y\n'+
            'X is Number\n'+
            'Y is Number\n'+
            'Point2D from Number(x), Number(y), Selector-SelectorType:\n'+
            '   [x > X, y > Y] > Point2D\n'+
            "TestSelector is Point2D:\n"+
            "   [value > X > Number, 20, Selector-SelectorType] > Point2D"
            );
    check(0,"TestingSubConversions,Number,Number,Number,Number", 
            [5,6,7,8],
            26,
            SUM,
            "TestingSubConversions is Number\n"+
            "TestingSubConversions from Number(p), Number(h), Number(i), Number(l):\n"+
            "	a:	[p, i] > Sum > Number\n"+
            "	b:	[h, l] > Sum > Number\n"+
            "	[a,b] > Sum"
            );
    check(0,"TestingNothingReturn,Number,Number,Number",
            [1,2,3],
            "Nothing",
            NOTHING,
            "TestingNothingReturn is Number\n"+
            "TestingNothingReturn from Number(L), Number(k), Number(s):\n"+
            "	Nothing > Number"
            );
    check(0,"TestingAnswer,Number,Number",
            [5,6],
            12,
            SUM,
            "TestingAnswer is Number\n"+
            "TestingAnswer from Number(l), Number(k):\n"+
            "	l > TestingAsk{ignored:[l,l]>Sum used:[k,k]>Sum}\n"+

            "TestingAsk is Number\n"+
            "TestingAsk from Number(a):\n"+
            "	{used Number}"
            );
    check(0,"Point2D,Number,Number",
            [1,2],
            [1,2],
            NONE,
            "Point2D is X, Y\n"+
            "X is Number\n"+
            "Y is Number\n"+
            "Point2D from Number(x), Number(y):\n"+
            "   [x > X, y > Y] > Point2D"
            );
    check(0,"TestingNothingInDataStructure,Number",
            [5],
            [5,"Nothing"],
            NOTHING,
            "Point2D is X, Y\n"+
            "X is Number\n"+
            "Y is Number\n"+
            "TestingNothingInDataStructure is Point2D\n"+
            "TestingNothingInDataStructure from Number(x):\n"+
            "   [x > X, Nothing > Y] > Point2D"
            );
    check(0,"Y,Point2D", 
            [["Nothing",5]],
            5,
            NONE,
            "Point2D is X, Y\n"+
            "X is Number\n"+
            "Y is Number\n"
            );
    check(0,"X,Point2D",   
            [["Nothing",5]],
            "Nothing",
            NONE,
            "Point2D is X, Y\n"+
            "X is Number\n"+
            "Y is Number\n"
            );
    check(0,"TestingInjection,Number,Number,Point2D",
            [10,20,[1,2]],
            [10,20],
            NONE,
            "Point2D is X, Y\n"+
            "X is Number\n"+
            "Y is Number\n"+
            "TestingInjection is Point2D\n"+
            "TestingInjection from Point2D(l), Number(x), Number(y):\n"+
            "	[(x > X -> (y > Y -> l)) > Y,\n"+
            "	(x > X -> (y > Y -> l)) > X] > Point2D\n"
            ); 
    check(0,"List'Number',List'Number',Number",
            ["Nothing",5],
            ["Nothing",5],
            NONE,
            List_CPS
            );
    check(0,"TestingGeneric'Number',List'Number',Number,Number,X",
            ["Nothing", 17, 12, [5]],
            ["Nothing",17],
            NONE,
            List_CPS+
            "[A]TestingGeneric is [A]List\n"+
            "[P]TestingGeneric from X(s), [P](l), Number(j), [P]List(k):\n"+
            "	[l, k] > [P]List"
            );
    check(0,"TestingListBuild,Number,Number",     
            [1,2],
            make_list([1,2], 'L'),
            NOTHING,
            List_CPS+
            "TestingListBuild is List'Number'\n"+
            "TestingListBuild from Number(a), Number(b):\n"+
            "	[a, [b, Nothing > List'Number'] > List'Number'] > List'Number'"
            );
    check(0,"Foldr'Sum',List'Number',Sum",
            [make_list([1,2,3,4], 'L'),0],
            10,
            SUM+
            EXISTS,
            List_CPS+
            Foldr_CPS+
            "Sum from Sum(s), Number(n):\n"+
            "   [s > Number, n] > Sum"
            );
    check(0,"Foldl'Sum',List'Number',Sum", 
            [make_list([1,2,3,4], 'L'),0],
            10,
            SUM+
            EXISTS,
            List_CPS+
            Foldl_CPS+
            "Sum from Sum(s), Number(n):\n"+
            "   [s > Number, n] > Sum"
            );
    check(0,"Map'Point2D',List'Number'",   
            [make_list([1,2], 'L')],
            make_list([[1,1],[2,2]], 'L'),
            EXISTS,
            List_CPS+
            Map_CPS+
            "Point2D is X, Y\n"+
            "X is Number\n"+
            "Y is Number\n"+
            "Point2D from Number(n):\n"+
            "   [n > X, n > Y] > Point2D"
            );
    check(0,"Filter'IsLessThan5',List'Number'",
            [make_list(["Nothing",1,"Nothing",2,"Nothing"], 'L')],
            make_list([1,2], 'R'),
            NOTHING+
            EXISTS+
            COMPARE,
            List_CPS+
            Foldr_CPS+
            Map_CPS+
            Filter_CPS+
            "IsLessThan5 is Number:\n"+
            "   [value, 5] > Compare'Number' {\n"+
            "       less: value\n"+
            "   } > Number"
            );
    check(0,"Summation,List'Number'",
            [make_list([1,2,3,4,5,6,7,8,9,10], 'L')],
            55,
            EXISTS+
            SUM,
            List_CPS+
            Foldl_CPS+
            "Sum from Sum(s), Number(n):\n"+
            "   [s > Number, n] > Sum\n"+
            "Summation is Sum\n"+
            "Summation from List'Number'(l):\n"+
            "   [\n"+
            "       l,\n"+
            "       [0,0] > Sum\n"+
            "   ] > Foldl'Sum' > Sum > Summation"
            );
    check(0,"Count,List'Number'", 
            [make_list([1,2,3,4], 'L')],
            4,
            EXISTS+
            SUM,
            List_CPS+
            Foldl_CPS+
            Count_CPS
            );
    check(0,"Average,List'Number'", 
            [make_list([1,2,3,4], 'L')],
            2.5,
            EXISTS+
            SUM+
            QUOTIENT,
            List_CPS+
            Foldl_CPS+
            Count_CPS+
            "Sum from Sum(s), Number(n):\n"+
            "   [s > Number, n] > Sum\n"+
            "Summation is Sum\n"+
            "Summation from List'Number'(l):\n"+
            "   [\n"+
            "       l,\n"+
            "       [0,0] > Sum\n"+
            "   ] > Foldl'Sum' > Sum > Summation\n"+

            "Average is Number\n"+
            "Average from Sum(s), Count(c):\n"+
            "   [s > Number, c > Number] > Quotient > Number > Average\n"+

            "Average from List'Number'(l):\n"+
            "   [\n"+
            "       l > Summation > Sum,\n"+
            "       l > Count\n"+
            "   ] > Average\n"
            );
    check(0,"STD,List'Number'",    
            [make_list([1,2,3,4], 'L')],
            std([1,2,3,4]),
            EXISTS+
            SUM+
            DIFFERENCE+
            QUOTIENT+
            SQUARE+
            SQRT,
            List_CPS+
            Foldl_CPS+
            Map_CPS+
            Count_CPS+
            "Sum from Sum(s), Number(n):\n"+
            "   [s > Number, n] > Sum\n"+
            "Summation is Sum\n"+
            "Summation from List'Number'(l):\n"+
            "   [\n"+
            "       l,\n"+
            "       [0,0] > Sum\n"+
            "   ] > Foldl'Sum' > Sum > Summation\n"+

            "Average is Number\n"+
            "Average from Sum(s), Count(c):\n"+
            "   [s > Number, c > Number] > Quotient > Number > Average\n"+

            "Average from List'Number'(l):\n"+
            "   [\n"+
            "       l > Summation > Sum,\n"+
            "       l > Count\n"+
            "   ] > Average\n"+

            "STD is Number\n"+
            "STD from List'Number'(l):\n"+
            "   [\n"+
            "       [\n"+
            "           l,\n"+
            "           l > Average > Number\n"+
            "       ] > Map'Difference' > Map'Number' > Map'Square' > Map'Number' > List'Number' > Summation > Sum > Number,\n"+
            "       [l > Count > Number, 1] > Difference > Number\n"+
            "   ] > Quotient > Number > SquareRoot > Number > STD"
            );

    check(0,"STD,List'Number'",    
            [make_list(listTo(300), 'L')],
            std(listTo(300)),
            EXISTS+
            SUM+
            DIFFERENCE+
            QUOTIENT+
            SQUARE+
            SQRT,
            List_CPS+
            Foldl_CPS+
            Map_CPS+
            Count_CPS+
            "Sum from Sum(s), Number(n):\n"+
            "   [s > Number, n] > Sum\n"+
            "Summation is Sum\n"+
            "Summation from List'Number'(l):\n"+
            "   [\n"+
            "       l,\n"+
            "       [0,0] > Sum\n"+
            "   ] > Foldl'Sum' > Sum > Summation\n"+

            "Average is Number\n"+
            "Average from Sum(s), Count(c):\n"+
            "   [s > Number, c > Number] > Quotient > Number > Average\n"+

            "Average from List'Number'(l):\n"+
            "   [\n"+
            "       l > Summation > Sum,\n"+
            "       l > Count\n"+
            "   ] > Average\n"+

            "STD is Number\n"+
            "STD from List'Number'(l):\n"+
            "   [\n"+
            "       [\n"+
            "           l,\n"+
            "           l > Average > Number\n"+
            "       ] > Map'Difference' > Map'Number' > Map'Square' > Map'Number' > List'Number' > Summation > Sum > Number,\n"+
            "       [l > Count > Number, 1] > Difference > Number\n"+
            "   ] > Quotient > Number > SquareRoot > Number > STD"
            );

    LOG(failed !== 0 ? "Tests Failed " + failed : "Tests Complete!");
    LOG("\n");
    
    LOG([]);
}
