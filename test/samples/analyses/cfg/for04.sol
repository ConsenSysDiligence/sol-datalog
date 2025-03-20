pragma solidity 0.8.17;

contract Foo {
    function for4() public returns (uint) {
        uint x = 1;
        uint sum = 0;

        for (; ;) {
            sum += x;
            x++;

            if (x-- >= 10) {
                break;
            } 

            x++;
        }

        return sum;
    }
}
