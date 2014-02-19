var HISTORY = [];
var BEGIN = "";
var END = "";
function LOG(str)
{
    if (str instanceof Array)
    {
        var blank_line = false;
        var title = "";
        if (str.length != 1)
        {
            blank_line = true;
            BEGIN = BEGIN.substring(2);
            HISTORY.pop();
        }
        else
        {
            title = str[0].toString();
            HISTORY.push(str[0]);
        }

        var end_stuff = "";
        for(var i = title.length; i < 80; i++)
            end_stuff += "-";

        print(BEGIN + "+--" + title + end_stuff);
        if (blank_line)
            print(BEGIN);

        if (str.length == 1) BEGIN += "| ";
    }
    else
    {
        var split = str ? str.toString().split('\n') : ["undefined"];
        for (var i = 0; i < split.length; i++)
            print(BEGIN + split[i]);
    }
}
NLOG = function(){};
if (!print)
{
    function print(str)
    {
        document.getElementById("output").value += str + "\n";
    }
}
