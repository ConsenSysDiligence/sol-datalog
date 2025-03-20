pragma solidity 0.8.17;

contract Foo {
    function main() public returns (uint) {
        uint x = 1;
        uint sum = 0;

        while (x < 10) {
            sum += x;
            x = x + 1;
        }

        return sum;
    }
}
