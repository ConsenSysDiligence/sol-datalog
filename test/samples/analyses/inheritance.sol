abstract contract Base {
  function foo() external virtual returns(uint);
  uint public bar;

  modifier Noop() { _; }
  function boo() Noop() internal virtual returns(uint) {}

  modifier Foo() virtual;
  //modifier Doo() virtual;

  function goo() public returns (uint) {}
}

abstract contract Base1 is Base {

}

abstract contract Base2 is Base {

}

contract Child is Base1, Base2 {
  uint public override foo;
  /*
  // Compile error: Cant override public vars
  function bar() external virtual override returns(uint) {
    return 1;
  }
  */

  function boo() internal virtual override returns(uint) {
  }

  modifier Foo() override { _; }
  /*
  // Compiler error: For modifier same name different args still overrides
  modifier Doo(uint x) { _; }
  */

  // Functions with same name and different args are not overriding
  function goo(uint a) public returns (uint) {}
}
