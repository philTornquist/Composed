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

log_compiler_conversions    = LOG;

log_linking                 = LOG;
log_linker_restructure      = LOG;
log_missing                 = LOG;
log_jitting                 = LOG;
log_passes                  = LOG;


var indexFile = read("index.html")
var start_of_bytecode = indexFile.indexOf("inputBytecode")
    start_of_bytecode = indexFile.indexOf(">", start_of_bytecode)
var built_in = indexFile.substring(start_of_bytecode, indexFile.indexOf("</", start_of_bytecode))


var Data = new DataStore();

Data.JITName = js_conversion_rename;

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
