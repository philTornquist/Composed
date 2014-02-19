function Run_Tests()
{
    var failed = 0;
    var results = [];
    function check(result, conv, params) {
        
        var funct = CALL(Data, conv);
        var test = funct.apply(Data.JITed, params);
        console.log(test);
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

    
    check(  23,                                   "TestingSpecification,Number",                            [3]);
    check(  [1,2],                                "Point2D,-Type,Number,Number",                            ["Type-Selector",1,2]);
    check(  [1,20],                               "Point2D,-Type,Number",                                   ["Type-Selector",1]);
    check(  [5,23],                               "TestingExists,Number",                                   [5]);
    check(  [12,20],                              "TestSelector,Point2D",                                   [[12,9]]);
    check(  26,                                   "TestingSubConversions,Number,Number,Number,Number",      [5,6,7,8]);
    check(  "Nothing",                            "TestingNothingReturn,Number,Number,Number",              [1,2,3]);
    check(  12,                                   "TestingAnswer,Number,Number",                            [5,6]);
    check(  [1,2],                                "Point2D,Number,Number",                                  [1,2]);
    check(  ["Nothing", 5],                       "Point2D,Number,Number,Number",                           [5,6,7]);
    check(  5,                                    "Y,Point2D",                                              [["Nothing",5]]);
    check(  "Nothing",                            "X,Point2D",                                              [["Nothing",5]]);
    check(  [10,20],                              "TestingInjection,Number,Number,Point2D",                 [10,20,[1,2]]); 
    check(  ["Nothing",5],                        "List'Number',List'Number',Number",                       ["Nothing",5]);
    check(  ["Nothing",17],                       "TestingGeneric'Number',List'Number',Number,Number,X",    ["Nothing", 17, 12, [5]]);
    check(  make_list([1,2], 'L'),                "TestingListBuild,Number,Number",                         [1,2]);
    check(  10,                                   "Foldr'Sum',List'Number',Sum",                            [make_list([1,2,3,4], 'L'),0]);
    check(  10,                                   "Foldl'Sum',List'Number',Sum",                            [make_list([1,2,3,4], 'L'),0]);
    check(  make_list([[1,1],[2,2]], 'L'),        "Map'Vector2D',List'Number'",                             [make_list([1,2], 'L')]);
    check(  make_list([1,2], 'R'),                "Filter'IsLessThan5',List'Number'",                       [make_list(["Nothing",1,"Nothing",2,"Nothing"], 'L')]);
    check(  55,                                   "Summation,List'Number'",                                 [make_list([1,2,3,4,5,6,7,8,9,10], 'L')]);
    check(  4,                                    "Count,List'Number'",                                     [make_list([1,2,3,4], 'L')]);
    check(  2.5,                                  "Average,List'Number'",                                   [make_list([1,2,3,4], 'L')]);
    check(  std([1,2,3,4]),                       "STD,List'Number'",                                       [make_list([1,2,3,4], 'L')]);
	check(  std(listTo(500)),                     "STD,List'Number'",                                       [make_list(listTo(500), 'L')]);
	
    LOG(failed !== 0 ? "Tests Failed " + failed : "Tests Complete!");
    LOG("\n");
    
    LOG([]);
}
