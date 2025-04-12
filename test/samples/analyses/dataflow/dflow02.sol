contract Foo {
    function main(bool flag, uint x) public returns (uint) {
        uint y;
        if (flag) {
            y = x + 1;
        } else {
            y = x + 2;
        }

        y++;

        return y;
    }
}