pragma solidity 0.8.17;

contract Foo {
    function main() public returns (uint) {
        uint x = 1;
        uint sum = 0;

        do {
            sum += x;
            x = x + 1;
        } while (x < 10);

        return sum;
    }
}
