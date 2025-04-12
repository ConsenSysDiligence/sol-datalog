contract Foo {
    struct F {
        uint x;
        uint y;
    }

    function lhs() public {
        uint x;
        x = 1;
        uint[3] memory a;

        a[1] = 0;
        a[a[1]] = 2;

        F memory f;

        f.x = 1;
        x = f.y;
    }

    uint sVar;

    modifier M() {
        uint x = sVar;
        _;
    }

    function withMod() M() public {
    }
}