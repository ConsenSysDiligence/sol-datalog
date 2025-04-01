contract Foo {
    uint[] z;
    struct F {
        uint t;
    }

    function ref() internal returns (uint[] storage) {
        return z;
    }

    function main(bool flag, uint[] calldata cd) public {
        uint x;
        uint y;
        F memory f;
        z.push(0);

        // Identifier
        x = 1;
        // Member Access
        f.t = 1;
        // Index Access
        z[0] = 1;
        // Member Access as a reference to a variable
        Foo.z[0] = 2;

        // Ternary not allowed (yet?). The below produces an error.
        //(flag ? x : y) = 2;

        // For assignment its the RHS that is an assignment. Not the lhs
        // The below produces an error
        //(x = y) = 1;

        // Function call (builtin or returning a reference)
        z.push() = 1;

        ref()[0] = 10; // in this case can't infer the changed variable

        // Unary expressions cant be an LValue. These produce errors.
        //++y = 1;
        //-y = 1;

        // Binary expressions can't be an LValue.
        // Note: If they allow reference type user-defined value types with operator overloading
        // than this may change, as operators potentially become equivalent to functions returning a reference.

        // Tuples can be LValues
        (x, ,y) = (1,2,3);

        // Index ranges can't be LValues as they are only supported on calldata, and those are immutable
        // cd[1:2] = cd[3:4];

        // Identifier, member access and index access can also appear in delete
        delete x;
        delete f.t;
        delete z[0];
        //delete (x,y);
        
        // For unary in-place mutating operators, the variable is both read and written.
        x++;
    }
}