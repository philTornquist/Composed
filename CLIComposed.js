load('LogHistory.js')
load('ConversionUtils.js')
load('Pseudocode.js')
load('Library/List.cps.js')
load('Tests.js')
load('Compiler.js')
load('Linker.js')
load('Optimize.js')
load('JSCompiler.js')

log_compiler_conversions    = NLOG;

log_linking                 = NLOG;
log_linker_restructure      = NLOG;
log_missing                 = NLOG;
log_jitting                 = NLOG;
log_passes                  = NLOG;

log_loaded_conversions      = NLOG;
log_loaded_generics         = NLOG;
log_loaded_selectors        = NLOG;


var indexFile = read("index.html")
var start_of_bytecode = indexFile.indexOf("inputBytecode")
    start_of_bytecode = indexFile.indexOf(">", start_of_bytecode)
var BUILT_IN = indexFile.substring(start_of_bytecode, indexFile.indexOf("</", start_of_bytecode))


Run_Tests();
