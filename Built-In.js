var Data = new DataStore();

function RESET() {
Data = new DataStore();
Data.Conversions["Sum,Number,Number"] = function() {
    return arguments[0] + arguments[1];
}
Data.Conversions["Number,Sum"] = function() {
    return arguments[0];
}
Data.Conversions["Difference,Number,Number"] = function() {
    return arguments[0] - arguments[1];
}
Data.Conversions["Number,Difference"] = function() {
    return arguments[0];
}
Data.Conversions["Difference,Number"] = function() {
    return arguments[0];
}

Data.Conversions["Quotient,Number,Number"] = function() {
    return arguments[0] / arguments[1];
}
Data.Conversions["Number,Quotient"] = function() {
    return arguments[0];
}
Data.Conversions["Product,Number,Number"] = function() {
    return arguments[0] * arguments[1];
}
Data.Conversions["Number,Product"] = function() {
    return arguments[0];
}
Data.Conversions["Square,Number"] = function() {
    return arguments[0] * arguments[0];
}
Data.Conversions["Number,Square"] = function() {
    return arguments[0];
}
Data.Conversions["SquareRoot,Number"] = function() {
    return Math.sqrt(arguments[0]);
}
Data.Conversions["Number,SquareRoot"] = function() {
    return arguments[0];
}

Data.Generics["[A],Nothing"] = function() {
    return "Nothing";
}

Data.Generics["[A],[A]Compare"] = function() {
    return arguments[0];
}

Data.Asks["[A]Compare,Number,Number"] = {};
Data.Asks["[A]Compare,Number,Number"]["$less"] = 0;
Data.Asks["[A]Compare,Number,Number"]["$equal"] = 1;
Data.Asks["[A]Compare,Number,Number"]["$greater"] = 2;
Data.Generics["[A]Compare,Number,Number"] = function(N1,N2,less,equal,greater) 
{
    return N1 < N2 ? less.apply(this) : (N1 == N2 ? equal.apply(this) : greater.apply(this));
}

Data.Asks["[B]Exists,[A]"] = {};
Data.Asks["[B]Exists,[A]"]["$yes"] = 0;
Data.Asks["[B]Exists,[A]"]["$no"] = 1;
Data.Generics["[B]Exists,[A]"] = function(A1, yes, no) {
    return (A1 !== "Nothing" ? yes.apply(this) : no.apply(this));
}
Data.Generics["[A],[A]Exists"] = function() {
    return arguments[0];
}

}

RESET();
