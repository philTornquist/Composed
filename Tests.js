var log_loaded_conversions = NLOG;
var log_loaded_generics = NLOG;
var log_loaded_selectors = NLOG;

var Tests = {};

function make_list(list, LorR) {
    return LorR == 'L' ?
        [         list.length == 1 ? "Nothing" : make_list(list.slice(1,list.length), LorR), list[0]] :
        [list[0], list.length == 1 ? "Nothing" : make_list(list.slice(1,list.length), LorR)];
}

function listTo(val) {var r=[];for(var i=0;i<val;i++)r.push(i);return r;}
function std(l){var m=0;for(var i=0;i<l.length;i++)m+=l[i];m/=i;var n=[];for(i=0;i<l.length;i++)n.push((l[i]-m)*(l[i]-m));var s=0;for(i=0;i<n.length;i++)s+=n[i];return Math.sqrt(s/(l.length-1));}
function test(test, conv, params, result, pseudocode, cps)
{
    if (!test) { Tests[conv] = false; return; }
    var res = {};
    res.conversion = conv;
    res.params = params;
    res.result = result;
    res.pseudocode = pseudocode;
    res.composedcode = cps;

    if (Tests[conv] !== undefined) 
        throw "Test already defined: " + conv;
    Tests[conv] = res;
}

function Run_Tests()
{
    LOG(["Testing"]);
    var failed = 0;
    var results = [];
    for (var key in Tests)
    {
        var test = Tests[key];
        if (!test) {LOG("SKIPPED: " + key); continue;}
        
        var Data = new DataStore();
        Data.JITName = js_conversion_rename;

        load_pseudocode(Data, compile(test.composedcode));
        load_pseudocode(Data, test.pseudocode);

        log_loaded_conversions(["LOADED: Conversions"]);
        for (var key in Data.Conversions) log_loaded_conversions(key);
        log_loaded_conversions([]);
        
        log_loaded_generics(["LOADED: Generics"]);
        for (var key in Data.Generics) log_loaded_generics(key);
        log_loaded_generics([]);
        
        log_loaded_selectors(["LOADED: Selectors"]);
        for (var key in Data.Selectors) { log_loaded_selectors([key]); for(var sel in Data.Selectors[key]) log_loaded_selectors(sel); log_loaded_selectors([]); }
        log_loaded_selectors([]);
        
        link_conversions(Data);


		var tested = Interpret(Data, test.conversion, test.params, {});
        //var funct = CALL(Data, test.conversion);
        //var tested = funct.apply(Data.JITed, test.params);
        tested = tested ? tested : "Nothing";
        if (test.result.toString() === tested.toString()) LOG("Test Passed! " + test.result + " = " + test.conversion + test.params);
        else { failed++;
              LOG("Error with test [" + test.conversion + "] expected " + test.result + " but got " + tested + ". Parameters: " + test.params);
        }
    }

    LOG("\n");
    LOG(failed !== 0 ? "Tests Failed " + failed : "Tests Complete!");
    
    LOG([]);
}




     test(0,"TestingSpecification,Number",
            [3],
            23,
            NONE,
            'TestingSpecification is Number:\n'+
            '   23'
            );
    test(0,"Point2D,-SelectorType,Number,Number",
            ["SelectorType-Selector",1,2],
            [1,2],
            NONE,
            'Point2D is X, Y\n'+
            'X is Number\n'+
            'Y is Number\n'+
            'Point2D from Number(x), Number(y), Selector-SelectorType:\n'+
            '   [x > X, y > Y] > Point2D\n'
            );
    test(0,"Point2D,-SelectorType,Number",
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
    test(0,"TestingExists,Number",
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
    test(0,"TestSelector,Point2D", 
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
    test(0,"TestingSubConversions,Number,Number,Number,Number", 
            [5,6,7,8],
            26,
            SUM,
            "TestingSubConversions is Number\n"+
            "TestingSubConversions from Number(p), Number(h), Number(i), Number(l):\n"+
            "	a:	[p, i] > Sum > Number\n"+
            "	b:	[h, l] > Sum > Number\n"+
            "	[a,b] > Sum"
            );
    test(0,"TestingNothingReturn,Number,Number,Number",
            [1,2,3],
            "Nothing",
            NOTHING,
            "TestingNothingReturn is Number\n"+
            "TestingNothingReturn from Number(L), Number(k), Number(s):\n"+
            "	Nothing > Number"
            );
    test(0,"TestingAnswer,Number,Number",
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
    test(0,"Point2D,Number,Number",
            [1,2],
            [1,2],
            NONE,
            "Point2D is X, Y\n"+
            "X is Number\n"+
            "Y is Number\n"+
            "Point2D from Number(x), Number(y):\n"+
            "   [x > X, y > Y] > Point2D"
            );
    test(0,"TestingNothingInDataStructure,Number",
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
    test(0,"Y,Point2D", 
            [["Nothing",5]],
            5,
            NONE,
            "Point2D is X, Y\n"+
            "X is Number\n"+
            "Y is Number\n"
            );
    test(0,"X,Point2D",   
            [["Nothing",5]],
            "Nothing",
            NONE,
            "Point2D is X, Y\n"+
            "X is Number\n"+
            "Y is Number\n"
            );
    test(0,"TestingInjection,Number,Number,Point2D",
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
    test(0,"List'Number',List'Number',Number",
            ["Nothing",5],
            ["Nothing",5],
            NONE,
            List_CPS
            );
    test(0,"TestingGeneric'Number',List'Number',Number,Number,X",
            ["Nothing", 17, 12, [5]],
            ["Nothing",17],
            NONE,
            List_CPS+
            "[A]TestingGeneric is [A]List\n"+
            "[P]TestingGeneric from X(s), [P](l), Number(j), [P]List(k):\n"+
            "	[l, k] > [P]List"
            );
    test(0,"TestingListBuild,Number,Number",     
            [1,2],
            make_list([1,2], 'L'),
            NOTHING,
            List_CPS+
            "TestingListBuild is List'Number'\n"+
            "TestingListBuild from Number(a), Number(b):\n"+
            "	[a, [b, Nothing > List'Number'] > List'Number'] > List'Number'"
            );
    test(0,"Foldr'Sum',List'Number',Sum",
            [make_list([1,2,3,4], 'L'),0],
            10,
            SUM+
            EXISTS,
            List_CPS+
            Foldr_CPS+
            "Sum from Sum(s), Number(n):\n"+
            "   [s > Number, n] > Sum"
            );
    test(0,"Foldl'Sum',List'Number',Sum", 
            [make_list([1,2,3,4], 'L'),0],
            10,
            SUM+
            EXISTS,
            List_CPS+
            Foldl_CPS+
            "Sum from Sum(s), Number(n):\n"+
            "   [s > Number, n] > Sum"
            );
    test(0,"Map'Point2D',List'Number'",   
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
    test(0,"Filter'IsLessThan5',List'Number'",
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
    test(0,"Summation,List'Number'",
            [make_list(listTo(10001), 'L')],
            (10000*10001)/2,
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
    test(0,"Count,List'Number'", 
            [make_list([1,2,3,4], 'L')],
            4,
            EXISTS+
            SUM,
            List_CPS+
            Foldl_CPS+
            Count_CPS
            );
    test(0,"Average,List'Number'", 
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
    test(0,"STD,List'Number'",    
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

    test(0,"BigSTD,List'Number'",    
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
            "   ] > Quotient > Number > SquareRoot > Number > STD\n"+

            "BigSTD is STD\n"+
            "BigSTD from List'Number'(l):\n"+
            "   l > STD > BigSTD"
            );


