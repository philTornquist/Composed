Composed
========

Composed is a general purpose programming language designed to give the compiler more information about the program it is compiling. This is achieved through a statically-typed and functional language where functions are replace with Data Conversions. Data Conversions are named and referenced by their input and output types. Types in Composed should reflect the interpretation of the data and not the representation. This gives the compiler more flexibility towards the actual representation and provides the programmer with more context. 

Composed can become verbose but leads to code that is easy to maintain and extend. There are only a few specific instances where written code will need to be modified to add a new feature. New type definitons are expected frequently but are simple to create. Code can be organized in anyway the programmer thinks is best. 

A major future goal of this language is a smart JIT compiler that can create the extemely fast native code due to the amount of information about the program available. The compiler could be able to choose the best data representation, within the programmers requirements, and remove all operations that are not required such as data structure creations where only some of the data is used.


###Data Conversions
Data Conversions define how a type can be created from other types. Data Conversions come in 3 forms:
- Combination
- Specification
- Conversion
 
####Combination
Combination Conversions are like data structures in other programming languages. They define a new data type and contain 2 or more unique types. Here is how a 2-dimensional point is defined in Composed:

	Point2D is X, Y
	
That's it. Data structures are easy to define and Composed expects new ones to be created frequently. Point2D cannot be defined as the following:

	Point2D is Number, Number         'Wrong'

This is the way Point2D is defined in other programming languages and conveys the representation of Point2D. Types in Composed reflect the interpretation of them. 'A 2D Point contains an X-Coordinate and a Y-Coordinate' rather than 'Our 2D Point will contain two numbers for the X-Coordinate and Y-Coordinate'. The Composed definition of 'Point2D' is complete but in order to use it 'X' and 'Y' need to be defined.

####Specification
Specification Conversions are like typedefs in C. They are used to extend the meaning of another type. Continuing the 'Point2D' example, 'X' and 'Y' will be defined as:

	X is Number
	Y is Number
	
Additionally we could also have the y-coordinates of the 'Point2D' be a 'String':

	X is Number
	Y is String
	
Again the 'Point2D' reflects the interpretation and should never have to be redefined. Any type definition should never have to be rewritten as long as the interpretation is still the same. 

Another aspect of Specification Conversions is the ability to add a body to the definition to restrict the possible values stored:

	Squared is Number:
		[value, value] > Product > Number
		
Here is the definition for the square of a number. The input type is referenced by the 'value' keyword like in C#. The syntax of the body will be explained in detail later.

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
	
Will always make 10 be x and 20 be y since that was the order in the Conversion definition. Additionally with the following example:

	Foo from Number(a), Number(b), Bar(c):
		...do something...
		
And calling:
	
	[10, ...some 'Bar' data... , 20] > Foo
	
Will assign 10 to reference 'a' and 20 to reference 'b'

###Nothing
The keyword 'Nothing' in Composed is similar to null, nil or undefined in other languages. Nothing can be converted to any data type by:

	Nothing > Point2D
	
	Nothing > Number
	
The conversion is required for Composed to know what conversion you are trying to call.

###Generics
Composed supports single-type generic data definitions. The linked-list definition is a generic data definition:

	[T]List is [T], [T]List
	
The 'T' inside '[T]' is the generic variable and can be any name. The following is just as valid:

	[Type]List is [Type], [Type]List
	
Generic variable names can be the same as type names without conflict.

Generics in Conversion definitions allow for definitions like the map function:

	[B]Map from [A]List:
		...Map the list from type [A] to type [B]
		
The types [A] and [B] do not have to be different but Composed will attempt to match generic conversions where they are different first.

To create a real type from a generic can be done as the following:

	List'Point2D'
	
Is the signature for a list of Point2D. Or as a list of list of 'Point2D'.

	List'List'Point2D''
	
These definitions can usually be read by adding "of" between each of the types.

The generic variables can also be used in the body of a conversion.

###Selectors
Selectors in Composed provide support for other programming language features like enums and switch statements.

Selectors do not have to be explicitly defined and have a type. The possible selectors for the attacks of a fighting game player:

	Punch-Attack
	Kick-Attack
	Jump-Attack
	...
	
A selector, and the selector type, is defined when it is added to a Conversion definition.

	Damage from Player-Stats(ps), Jump-Attack:
		... calculate jump damage ...
		
	Damage from Player-Stats(ps), Kick-Attack:
		... calculate kick damage ...
		
The Composed runtime will select which conversion to call depending on the selector passed into the call. As in the conversion to get the damage from a player:

	Player is Player-Stats, Attack
	Damage from Player(player):
		[
			player > Attack,
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
