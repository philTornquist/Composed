Composed
========

Composed is a general purpose programming language designed to give the compiler more information about the program it is compiling. This is achieved through a statically-typed and functional language where functions are replaced with 'Data Conversions'. Data Conversions are named and referenced by their input and output types. Types in Composed should reflect the interpretation of the data and not the representation. This gives the compiler more flexibility towards the actual representation and provides the programmer with more context. 

Composed can become verbose but leads to code that is easy to maintain and extend. There are only a few specific instances where existing code will need to be modified to add a new feature. With a proper IDE the negatives of the verbosity can be elimated.

New type definitons are expected frequently because type names should convey the interpretation of the data. Type definitions with only one type should make up a large portion of type definitions. This is similar to typedef in C. Type definitions are simple to create and can be placed anywhere within the source file or within another file.

Code can be organized in anyway the programmer thinks is best. All definitions, data conversions and types, are stand-alone entities until runtime meaning they can be placed anywhere (it is possible every definition can be in its own library that are all loaded at runtime ... but that isn't practical). Definitions are compiled into bytecode by the programmer and linked at runtime. This allows the user to select alternative definitions to load for use in a program. 

A major future goal of this language is a smart JIT compiler that can create the extemely fast native code due to the amount of information about the program available. The compiler could be able to choose the best data representation, within the programmers requirements, and remove all operations that are not required such as data structure creations where only some of the data will be used.


###Data Conversions
Data Conversions define how a type can be created from other types. Data Conversions come in 3 forms:
- Combination
- Specification
- Conversion
 
####Combination
Combination Conversions are like data structures in other programming languages. They define a new data type and contain 2 or more unique types. Here is how a 2-dimensional point is defined in Composed:

	Point2D is X, Y
	
That's it. Data structures are easy to define and Composed expects new ones to be created frequently. Additionally 'Point2D' cannot be defined as the following:

	Point2D is Number, Number         'Wrong'

This is the way 'Point2D' is defined in other programming languages and conveys the representation of 'Point2D'. Types in Composed reflect the interpretation of them. Composed combinations can be read "A 2D Point contains an X-Coordinate and a Y-Coordinate" and not like "Our 2D Point will contain two numbers for the X-Coordinate and Y-Coordinate". The Composed definition of 'Point2D' is complete but in order to use it 'X' and 'Y' need to be defined.

####Specification
Specification Conversions are like typedefs in C. They are used to extend the meaning of another type and even narrow the possible values. Continuing the 'Point2D' example, 'X' and 'Y' will be defined as:

	X is Number
	Y is Number
	
Additionally we could also have the y-coordinates of the 'Point2D' be a 'String':

	X is Number
	Y is String
	
Again the 'Point2D' reflects the interpretation and should never have to be redefined. Any type definition should never have to be rewritten as long as the interpretation is still the same. 

Another aspect of Specification Conversions is the ability to add a body to the definition to restrict the possible values stored:

	Squared is Number:
		[value, value] > Product > Number
		
Here is the definition for the square of a number. The input type is referenced by the 'value' keyword like in C#. The syntax of the body will be explained in detail later but for now you can read '>' as "convert to".

####Conversion
Conversions is similar to functions in other languages. It contains a number of inputs, that can be the same type, where each gets a reference name. Conversions can be used to perform real work or as helper functions like the following:

	Point2D from Number(x), Number(y):
		[
			x > X,
			y > Y,
		] > Point2D
		
This is the formatting style I have come to like using with Composed but there is no required style. The only whitespace required is before and after the 'is' and 'from' keywords. This Conversion could be formatted:

	Point2D from Number(x),Number(y):[x>X,y>Y]>Point2D
	
But that doesn't read well.

When the same type is used more than once right-to-left order is used in matching inputs to reference names. Calling:

	[10,20] > Point2D
	
Will always make 10 be assigned to reference 'x' and 20 be assigned referenece 'y' since that was the order in the Conversion definition. Additionally with the following example:

	Foo from Number(a), Number(b), Bar(c):
		...do something...
		
And calling:
	
	[10, ...some 'Bar' data... , 20] > Foo
	
Will assign 10 to reference 'a' and 20 to reference 'b', as well as "...some 'Bar' data..." to reference 'c'

###Nothing
The keyword 'Nothing' in Composed is similar to null, nil or undefined in other languages. Nothing can be converted to any data type by:

	Nothing > Point2D
	
	Nothing > Number
	
The conversion is required for Composed to know what data type you want Nothing to be and more importantly the conversion you are trying to call.

###Generics
Composed supports single-type generic data definitions. The linked-list definition is a generic data definition:

	[T]List is [T], [T]List
	
The 'T' inside '[T]' is the generic reference. Generic references can be any name including type names without conflict. The following is just as valid:

	[Point2D]List is [Point2D], [Point2D]List

Generics in Conversion definitions allow for definitions like the map function:

	[B]Map from [A]List:
		...Map the list from type [A] to type [B]
		
The types [A] and [B] do not have to be different but Composed will attempt to match generic conversions where they are different first. However all instances of a generic reference must be the same type. Generic references can also be used in the body of the conversion.

To create a real type from a generic can be done as the following:

	List'Point2D'
	
That is the signature for a list of Point2D. Or as a list of list of 'Point2D'.

	List'List'Point2D''
	
These definitions can usually be read by adding "of" between each of the types.

###Selectors
Selectors in Composed provide support for other programming language features like enums, switch statements and object heiarchies.

Selectors do not have to be explicitly defined and have a type. For example the possible selectors for the attacks of a fighting game player could be:

	Punch-Attack
	Kick-Attack
	Jump-Attack
	...
	
A selector, and the selector type, is defined when it is used either in a conversion or a conversion definition.

	Damage from Player-Stats(ps), Jump-Attack:
		... calculate jump damage ...
		
	Damage from Player-Stats(ps), Kick-Attack:
		... calculate kick damage ...
		
The Composed runtime will select which conversion to call depending on the selector passed into the call. As in the conversion to get the damage from a player:

	Player is Player-Stats, -Attack
	Damage from Player(player):
		[
			player > -Attack,
			player > Player-Stats
		] > Damage

Selectors can also be used to create an object heiarchy. Consider the following:

	Shape is ShapeType, Circle, Rectangle
	
	Area from Shape(s):
		[s, s > ShapeType] > Area
		
	Area from Shape(s), Circle-ShapeType:
		s > Circle > Area
		
	Area from Shape(s), Rectangle-ShapeType:
		s > Rectangle > Area
		
Either Circle or Rectangle in the shape definition will have actual data which will be reflected by the value of ShapeType. Adding another shape to the heiarchy is slightly more complicated than an object oriented language but overall relatively simple. 

###Conversion Body
The body of a conversion consists of any number pre-conversion calls and a result conversion call. The syntax of a conversion call has two forms, single input and multi-input:

    10 > Square > Number
    [10, 20] > Point2D > Length
    
Multiple inputs must be contained inside '[ ]' and seperated by commas. A single input can have '[ ]' but it is not required. Following the inputs is one or more conversion operators.

Before the result conversion call any number of pre-conversions can be defined:

    partialResult: [2,2] > Sum > Number
    
"partialResult" is now a reference name that can be used in the following pre-conversions and the result converion. The result conversion is a just a standalone conversion and ends the conversion definition. A final example for cubing a number:

    Cubed from Number(n):
        squared: [n, n] > Product > Number
        [squared, n] > Product > Number