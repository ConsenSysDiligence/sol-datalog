contract Foo {
    function main(uint x, uint y) public returns (uint) {
        uint z = x + 1;

        z = z + y;

        uint sum = 0;

        for (uint i = 0; i < z; i ++) {
            sum += i;
        }

        uint t;
        t = 1 + (t = 2) + 2 * t;

        return sum + t;
    }
}