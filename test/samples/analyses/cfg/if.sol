pragma solidity 0.8.17;

contract Foo {
    function main() public {
        uint x = 0;

        if (x++ > 1) {
            x = 5;
        } else {
            x = 6;
        }

        x = 7;
    }

    function test() public {
        uint y = 0;

        if (y++ > 1) {
            y = 5;
        }

        y = 7;
    }
}
