Composed
========

Composed is a general purpose programming language designed to give the compiler more information about the program it is compiling. This is achieved through a statically-typed and functional language where functions are replace with Data Conversions. Data Conversions are named and referenced by their input and output types. Types in Composed should reflect the interpretation of the data and not the representation.

This gives the compiler more flexibility towards the actual representation and provides the programmer with more contex

###Data Conversions
Data Conversions define how a type can be created from other types. Data Conversions come in 3 forms:
- Combination
- Specification
- Conversion
 
Combination Conversions are like data structures in other programming languages. They define a new data type and contain 2 or more unique types. Here is how a 2-dimensional point is defined in Composed:

	Point2D is X, Y
	
That's it. Data structures are easy to define and Composed expects new ones to be created frequently. Point2D cannot be defined as the following:

	Point2D is Number, Number         'Wrong'

This is the way Point2D is defined in other programming languages and conveys the representation of Point2D. Types in Composed reflect the interpretation of them. 'A 2D Point contains an X-Coordinate and a Y-Coordinate' rather than 'Our 2D Point will contain two numbers for the X-Coordinate and Y-Coordinate'. The Composed definition of 'Point2D' is complete but in order to use it 'X' and 'Y' need to be defined.

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

The final Conversion is similar to functions in other languages. It contains a number of inputs, that can be the same type, where each gets a reference name. Conversions can be used to perform real work or as helper functions like the following:

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

Looking back to the code, it may seem verbose but allows this code to work regardless of how the definitions of 'Product', 'Number' or 'Squared' are defined. Suppose the program you are writing ends up taking the square root of every number you square. So 

