var Data = new DataStore();

Data.Conversions["Sum,Number,Number"] = function(params) {
    return params[0] + params[1];
}
Data.Conversions["Number,Sum"] = function(params) {
    return params[0];
}
Data.Conversions["Difference,Number,Number"] = function(params) {
    return params[0] - params[1];
}
Data.Conversions["Number,Difference"] = function(params) {
    return params[0];
}
Data.Conversions["Difference,Number"] = function(params) {
    return params[0];
}

Data.Conversions["Quotient,Number,Number"] = function(params) {
    return params[0] / params[1];
}
Data.Conversions["Number,Quotient"] = function(params) {
    return params[0];
}
Data.Conversions["Product,Number,Number"] = function(params) {
    return params[0] * params[1];
}
Data.Conversions["Number,Product"] = function(params) {
    return params[0];
}
Data.Conversions["Square,Number"] = function(params) {
    return params[0] * params[0];
}
Data.Conversions["Number,Square"] = function(params) {
    return params[0];
}
Data.Conversions["SquareRoot,Number"] = function(params) {
    return Math.sqrt(params[0]);
}
Data.Conversions["Number,SquareRoot"] = function(params) {
    return params[0];
}

Data.Generics["[A],[A]Compare"] = function(params) {
    return params[0];
}
Data.Generics["[A]Compare,Number,Number"] = function(params, answers) 
{
    return call_answer( params[0] < params[1] ? "less" : (params[0] == params[1] ? "equal" : "greater"), answers);
}

Data.Generics["[B]Exists,[A]"] = function(params, answers) {
    return call_answer((params[0] !== "Nothing" ? "yes" : "no"), answers);
}
Data.Generics["[A],[A]Exists"] = function(params) {
    return params[0];
}
