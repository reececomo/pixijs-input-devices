import { KeyboardDevice } from "../KeyboardDevice";

describe( "KeyboardDevice", () =>
{
  describe( "named groups", () =>
  {
    it("correctly maps named groups to their buttons", () =>
    {
      const now = Date.now();
      const keyboard = KeyboardDevice.global;
      keyboard.options.navigation.enabled = false;

      keyboard.options.namedGroups = {
        jump: [ "Space", "ControlLeft" ],
        crouch: [ "ControlLeft", "ShiftLeft" ],
      };

      expect ( keyboard.groupPressed( "jump" ) ).toBe( false );
      expect ( keyboard.groupPressed( "crouch" ) ).toBe( false );

      mockKeydown( "ShiftLeft" );
      keyboard.update( now );

      expect ( keyboard.groupPressed( "jump" ) ).toBe( false );
      expect ( keyboard.groupPressed( "crouch" ) ).toBe( true );

      mockKeyup( "ShiftLeft" );
      keyboard.update( now );

      expect ( keyboard.groupPressed( "jump" ) ).toBe( false );
      expect ( keyboard.groupPressed( "crouch" ) ).toBe( false );

      mockKeydown( "ControlLeft" );
      keyboard.update( now );

      expect ( keyboard.groupPressed( "jump" ) ).toBe( true );
      expect ( keyboard.groupPressed( "crouch" ) ).toBe( true );

      mockKeyup( "ControlLeft" );
      keyboard.update( now );

      expect ( keyboard.groupPressed( "jump" ) ).toBe( false );
      expect ( keyboard.groupPressed( "crouch" ) ).toBe( false );
    });
  });
});

function mockKeydown( keyCode: string ): void
{
  const event = new KeyboardEvent("keydown", { "code": keyCode });
  document.dispatchEvent(event);
}

function mockKeyup( keyCode: string ): void
{
  const event = new KeyboardEvent("keyup", { "code": keyCode });
  document.dispatchEvent(event);
}
