load('Tests.js')
load('Tests.cps.js')
load('Library/List.cps.js')
load('LogHistory.js')
load('Bytecode.js')
load('ConversionUtils.js')
load('Compiler.js')
load('Linker.js')
load('Optimize.js')
load('JSCompiler.js')




var indexFile = read("index.html")
var start_of_bytecode = indexFile.indexOf("inputBytecode")
    start_of_bytecode = indexFile.indexOf(">", start_of_bytecode)
var built_in = indexFile.substring(start_of_bytecode, indexFile.indexOf("</", start_of_bytecode))


var Data = new DataStore();
var conversions = compile(TEST_CODE + List_CPS);

load_bytecode(Data, conversions);
load_bytecode(Data, built_in);

LOG(["LOADED: Conversions"]);
for (var key in Data.Conversions) LOG(key);
LOG([]);

LOG(["LOADED: Generics"]);
for (var key in Data.Generics) LOG(key);
LOG([]);

LOG(["LOADED: Selectors"]);
for (var key in Data.Selectors) { LOG([key]); for(var sel in Data.Selectors[key]) LOG(sel); LOG([]); }
LOG([]);

log_missing = LOG;
link_conversions(Data);

Run_Tests();
