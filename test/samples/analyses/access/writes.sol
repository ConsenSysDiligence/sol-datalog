contract Foo {
    uint s;

    uint[] arr;
    uint[][] arr2D;

    modifier Moo(uint x) {
        s += x;
        _;
    }

    function id(uint t) internal returns (uint) {
        return t;
    }

    function main(uint t) public Moo(t) {
        uint u;
        uint v;
        uint w;

        int a;

        // Binary
        u = (v = 1) + (w = 2);
        // Unary
        a = -(a = 3);

        // Ternary
        ((t = 4) > 0) ?  (t = 5) : (t = 6);

        // If
        if ((v++) > 7) {
            a = 9;
        } else {
            a = 8;
        }

        arr2D.push() = [uint(1),2,3];
        arr2D.push().push() = 10;

        // While
        uint i = 0;
        while (i++ < 10) {}

        // For 
        for (uint i = 11; i < (u=12); i += (u= 13)) {}

        // Function call
        id(w = 14);
    }
}