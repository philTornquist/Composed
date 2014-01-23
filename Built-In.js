var Data = new DataStore();
Data.JS = {};

Data.JS["Sum,Number,Number"] = function() {
    return arguments[0] + arguments[1];
}
Data.JS["Number,Sum"] = function() {
    return arguments[0];
}
Data.JS["Difference,Number,Number"] = function() {
    return arguments[0] - arguments[1];
}
Data.JS["Number,Difference"] = function() {
    return arguments[0];
}
Data.JS["Difference,Number"] = function() {
    return arguments[0];
}

Data.JS["Quotient,Number,Number"] = function() {
    return arguments[0] / arguments[1];
}
Data.JS["Number,Quotient"] = function() {
    return arguments[0];
}
Data.JS["Product,Number,Number"] = function() {
    return arguments[0] * arguments[1];
}
Data.JS["Number,Product"] = function() {
    return arguments[0];
}
Data.JS["Square,Number"] = function() {
    return arguments[0] * arguments[0];
}
Data.JS["Number,Square"] = function() {
    return arguments[0];
}
Data.JS["SquareRoot,Number"] = function() {
    return Math.sqrt(arguments[0]);
}
Data.JS["Number,SquareRoot"] = function() {
    return arguments[0];
}

Data.Generics["[A],[A]Compare"] = function() {
    return arguments[0];
}
Data.Generics["[A]Compare,Number,Number"] = function() 
{
    var answers = arguments[arguments.length-1];
    return call_answer( arguments[0] < arguments[1] ? "less" : (arguments[0] == arguments[1] ? "equal" : "greater"), answers);
}

Data.Generics["[B]Exists,[A]"] = function() {
    var answers = arguments[arguments.length-1];
    return call_answer((arguments[0] !== "Nothing" ? "yes" : "no"), answers);
}
Data.Generics["[A],[A]Exists"] = function() {
    return arguments[0];
}
