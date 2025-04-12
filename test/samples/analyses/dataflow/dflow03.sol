contract Foo {
    function main(uint x) public returns (uint) {
        uint sum;
        uint i = 0;
        while (i++ < x) {
            sum += i;
        }

        return sum;
    }
}