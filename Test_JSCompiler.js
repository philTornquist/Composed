
function Conversion(call, args, expanded) 
{
	var funct = Data.JS[call];

	if (funct === undefined)
	{
		if (inputs_of(call).length == 1 && inputs_of(call)[0] === "Nothing") 
        {
        	funct = function() { return "Nothing"; };
        	Data.JS[call] = funct;
        }
	}

	if (funct === undefined)
	{
		var ip = create_conversion(Data, call);
		if (ip !== undefined)
		{
			funct = isFinite(ip) ? js_conversion(Data, ip) : ip;
			Data.JS[call] = funct;
		}
	}

	if (expanded) 
		return funct;

	if (funct === undefined && !expanded)
	{
		var newCall = output_of(call);
        var selects = [];
        var inputs = inputs_of(call);
        for (var i = 0; i < inputs.length; i++)
        {
            if (Data.Selectors[inputs[i]])
            {
                var sel = args.splice(i, 1); 
                selects.push(sel[0]);
            }
            else
                newCall += "," + inputs[i];
        }
    
        newCall += ":" + selects.join(",");
        funct = Conversion(newCall, args, true);
	}

	if (funct === undefined)
		throw "Conversion does not exist: " + call;

	var res = funct.apply(this, args);
	if (res === "Nothing" && args[args.length-1]["Nothing"])
		res = args[args.length-1]["Nothing"]();
	return res;
}

function Test_JSCompiler()
{
	var log_compiler = false;
    
    LOG(["TEST!!! JSCompiler"]);
    
    
        var SAVED = log_compiler_conversions;
        log_compiler_conversions = log_compiler ? LOG : NLOG;
    var conversions = parse(TEST_CODE);
        log_compiler_conversions = SAVED;
    
    Data.ToRun = conversions[1];
    for(var i = 0; i < conversions[0].length; i++) {
    	load_conversion(Data, conversions[0][i].name, conversions[0][i].bytecode);
    }

    for(var key in Data.Conversions)
    {
    	Data.JS[key] = js_conversion(Data, Data.Conversions[key]);
    }

    var failed = 0;
    var results = [];
    function check(result, conv, params, ans) {
    	//try
    	{
    		params.push(ans ? ans : {});
        	var test = Conversion(conv, params);
	        test = test ? test : "Nothing";
	        if ("" + result === "" + test) LOG("Test Passed! " + result + " = " + conv + params);
	        else { failed++;
	            LOG("Error with test [" + conv + "] expected " + result + " but got " + test + ". Parameters: " + params);
	        }
        }
        /*catch (e) 
        {
        	failed++;
        	LOG("Caught Exception: " + e);
        }*/
    }
    
    function make_list(list, LorR) {
        return LorR == 'L' ?
            [         list.length == 1 ? "Nothing" : make_list(list.slice(1,list.length), LorR), list[0]] :
            [list[0], list.length == 1 ? "Nothing" : make_list(list.slice(1,list.length), LorR)];
    }
    
    function std(l){var m=0;for(var i=0;i<l.length;i++)m+=l[i];m/=i;var s=0;for(i=0;i<l.length;i++)s+=(l[i]-m)*(l[i]-m);return Math.sqrt(s/(l.length-1));}
    
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
    
    
    check(  23,                                   "X,Y",                                                    [3]);
    check(  [1,2],                                "Point2D,Number,Number,Type",                             [1,2,"Type-Selector"]);
    check(  [1,20],                               "Point2D,Number,Type",                                    [1,"Type-Selector"]);
    check(  [5,23],                               "Point2D,Number",                                         [5]);
    check(  26,                                   "Sum,Number,Number,Number,Number",                        [5,6,7,8]);
    check(  "Nothing",                            "Number,Number,Number,Number",                            [1,2,3]);
    check(  12,                                   "Number,Number,Number",                                   [5,6]);
    check(  [1,2],                                "Point2D,Number,Number",                                  [1,2]);
    check(  ["Nothing", 5],                       "Point2D,Number,Number,Number",                           [5,6,7]);
    check(  5,                                    "Y,Point2D",                                              [["Nothing",5]]);
    check(  "Nothing",                            "X,Point2D",                                              [["Nothing",5]]);
    check(  [10,20],                              "Point2D,Number,Number,Point2D",                          [10,20,[1,2]]); 
    check(  [5,"Nothing"],                        "List'Number',List'Number',Number",                       [5,"Nothing"]);
    check(  ["Nothing",17],                       "List'Number',List'Number',Number,Number,X",              ["Nothing", 17, 12, [5]]);
    check(  make_list([1,2], 'L'),                "List'Number',Number,Number",                             [1,2]);
    check(  10,                                   "Foldr'Sum',List'Number',Sum",                            [make_list([1,2,3,4], 'L'),0]);
    check(  10,                                   "Foldl'Sum',List'Number',Sum",                            [make_list([1,2,3,4], 'L'),0]);
    check(  make_list([[1,1],[2,2]], 'L'),        "Map'Vector2D',List'Number'",                             [make_list([1,2], 'L')]);
    check(  make_list([1,2], 'R'),                "Filter'IsLessThan5',List'Number'",                       [make_list(["Nothing",1,"Nothing",2,"Nothing"], 'L')]);
    check(  55,                                   "Summation,List'Number'",                                 [make_list([1,2,3,4,5,6,7,8,9,10], 'L')]);
    check(  4,                                    "Count,List'Number'",                                     [make_list([1,2,3,4], 'L')]);
    check(  2.5,                                  "Average,List'Number'",                                   [make_list([1,2,3,4], 'L')]);
    check(  std([1,2,3,4]),                       "STD,List'Number'",                                       [make_list([1,2,3,4], 'L')]);


    function listTo(val) {var r=[];for(var i=0;i<val;i++)r.push(i);return r;}
	check(  std(listTo(500)),                       "STD,List'Number'",                                       [make_list(listTo(500), 'L')]);
		

    LOG(failed !== 0 ? "Tests Failed " + failed : "Tests Complete!");
    LOG("\n");
    
    LOG([]);
 }