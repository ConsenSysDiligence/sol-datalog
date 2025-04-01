contract Foo {
  uint[] a; // a0 []

  function main() public returns (uint[] memory) {
    a.push(0); // a1 [0]
    a.push(3); // a2 [0, 3]
    /*a5 [2, 2]*/a[a[0]++ /*a4 [1, 2] eval 0*/] = --a[1] /*a3 [0, 2] eval 2*/;

    return a;
  }
}
