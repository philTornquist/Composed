var Data = new DataStore();

function RESET() {
Data = new DataStore();

Data.DataStructures["Sum"] = "Sum,Number";
Data.Conversions["Number,Sum"] = ["Conversion>Number,Sum","Param>0"];
Data.Conversions["Sum,Number"] = ["Conversion>Sum,Number","Param>0"];
Data.Conversions["Sum,Number,Number"] = [
    "Conversion>Sum,Number,Number",
    "ENTER>",
    "IGNORE>(",
    "Param>0",
    "IGNORE> + ",
    "Param>1",
    "IGNORE>)",
    "EXIT>"];

Data.DataStructures["Difference"] = "Difference,Number";
Data.Conversions["Number,Difference"] = ["Conversion>Number,Difference", "Param>0"];
Data.Conversions["Difference,Number"] = ["Conversion>Difference,Number", "Param>0"];
Data.Conversions["Difference,Number,Number"] = [
    "Conversion>Difference,Number,Number",
    "ENTER>",
    "IGNORE>(",
    "Param>0",
    "IGNORE> - ",
    "Param>1",
    "IGNORE>)",
    "EXIT>"];
    

Data.DataStructures["Quotient"] = "Quotient,Number";
Data.Conversions["Number,Quotient"] = ["Conversion>Number,Quotient", "Param>0"];
Data.Conversions["Quotient,Number,Number"] = [
    "Conversion>Quotient,Number,Number",
    "ENTER>",
    "IGNORE>(",
    "Param>0",
    "IGNORE> / ",
    "Param>1",
    "IGNORE>)",
    "EXIT>"];

Data.DataStructures["Modulus"] = "Modulus,Number";
Data.Conversions["Number,Modulus"] = ["Conversion>Number,Modulus", "Param>0"];
Data.Conversions["Modulus,Number,Number"] = [
    "Conversion>Modulus,Number,Number",
    "ENTER>",
    "IGNORE>(",
    "Param>0",
    "IGNORE> % ",
    "Param>1",
    "IGNORE>)",
    "EXIT>"];

Data.DataStructures["Product"] = "Product,Number";
Data.Conversions["Number,Product"] = ["Conversion>Number,Product", "Param>0"];
Data.Conversions["Product,Number,Number"] = [
    "Conversion>Product,Number,Number",
    "ENTER>",
    "IGNORE>(",
    "Param>0",
    "IGNORE> * ",
    "Param>1",
    "IGNORE>)",
    "EXIT>"];

Data.TypeSpecification["Square"] = true;
Data.DataStructures["Square"] = "Square,Number";
Data.Conversions["Number,Square"] = ["Conversion>Number,Square", "Param>0"];
Data.Conversions["Square,Number"] = [
    "Conversion>Square,Number",
    "ENTER>",
    "IGNORE>(",
    "Param>0",
    "IGNORE> * ",
    "Param>0",
    "IGNORE>)",
    "EXIT>"];

Data.TypeSpecification["SquareRoot"] = true;
Data.DataStructures["SquareRoot"] = "SquareRoot,Number";
Data.Conversions["Number,SquareRoot"] = ["Conversion>Number,SquareRoot", "Param>0"];
Data.Conversions["SquareRoot,Number"] = [
    "Conversion>SquareRoot,Number",
    "ENTER>",
    "IGNORE>Math.sqrt(",
    "Param>0",
    "IGNORE>)",
    "EXIT>"];




Data.Generics["[A],Nothing"] = function() {
    return "Nothing";
}

Data.Generics["[A],[A]Compare"] = function() {
    return arguments[0];
}

Data.Asks["[A]Compare,Character,Character"] = {};
Data.Asks["[A]Compare,Character,Character"]["less"] = 0;
Data.Asks["[A]Compare,Character,Character"]["equal"] = 1;
Data.Asks["[A]Compare,Character,Character"]["greater"] = 2;
Data.Generics["[A]Compare,Character,Character"] = [
    "Conversion>[A]Compare,Character,Character",
    ["ENTER>",
    "Param>0",
    "IGNORE> < ",
    "Param>1",
    "IGNORE> ? ",
    "Ask>less",
    "IGNORE> : (",
    "Param>0",
    "IGNORE> == ",
    "Param>1",
    "IGNORE> ? ",
    "Ask>equal",
    "IGNORE> : ",
    "Ask>greater",
    "IGNORE>)",
    "EXIT>"]];

Data.Asks["[A]Compare,Number,Number"] = {};
Data.Asks["[A]Compare,Number,Number"]["less"] = 0;
Data.Asks["[A]Compare,Number,Number"]["equal"] = 1;
Data.Asks["[A]Compare,Number,Number"]["greater"] = 2;
Data.Generics["[A]Compare,Number,Number"] = [
    "Conversion>[A]Compare,Number,Number",
    ["ENTER>",
    "Param>0",
    "IGNORE> < ",
    "Param>1",
    "IGNORE> ? ",
    "Ask>less",
    "IGNORE> : (",
    "Param>0",
    "IGNORE> === ",
    "Param>1",
    "IGNORE> ? ",
    "Ask>equal",
    "IGNORE> : ",
    "Ask>greater",
    "IGNORE>)",
    "EXIT>"]];
/*Data.Generics["[A]Compare,Number,Number"] = function(N1,N2,less,equal,greater) 
{
    return N1 < N2 ? less.apply(this) : (N1 == N2 ? equal.apply(this) : greater.apply(this));
}*/

Data.Asks["[B]Exists,[A]"] = {};
Data.Asks["[B]Exists,[A]"]["yes"] = 0;
Data.Asks["[B]Exists,[A]"]["no"] = 1;
Data.Generics["[B]Exists,[A]"] = function(A1, yes, no) {
    return (A1 !== "Nothing" ? yes.apply(this) : no.apply(this));
}
Data.Generics["[A],[A]Exists"] = function() {
    return arguments[0];
}

}

RESET();
