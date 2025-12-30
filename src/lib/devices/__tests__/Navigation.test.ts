import { Bounds, Container } from "pixi.js";

import { UINavigation } from "../../navigation/UINavigation";
import { registerPixiJSNavigationMixin } from "../../../Container.mixin";
import { InputDevice } from "../../InputDevice";

beforeAll(() => registerPixiJSNavigationMixin(Container));

class MockContainer extends Container
{
    public constructor()
    {
        super();

        this.getBounds = (skipUpdate?: boolean, bounds?: Bounds): Bounds =>
        {
            const width = 10, height = 10;

            return new Bounds(
                this.x - width/2,
                this.y - height/2,
                this.x + width/2,
                this.y + height/2
            );
        };
    }
}

describe("UINavigation", () =>
{
    test("allows container navigation", () =>
    {
        jest.useFakeTimers();

        const stageContainer = new MockContainer();
        stageContainer.name = "Stage container";

        let buttonWasTriggered = false;

        const button1 = new MockContainer();
        button1.name = "Button 1";
        button1.x = -75;
        button1.eventMode = "static";

        button1.on("pointertap", () =>
        {
            buttonWasTriggered = true;
        });

        expect(button1.navigatable).toBe(true);

        const menuContainer = new MockContainer();
        menuContainer.name = "Menu container";
        const menuItem1 = new MockContainer();
        menuItem1.name = "Menu Item 1";
        const menuItem2 = new MockContainer();
        menuItem2.name = "Menu Item 2";

        menuContainer.addChild(menuItem1, menuItem2);

        stageContainer.addChild(
            button1,
            menuContainer,
        );

        menuContainer.x = 100;
        menuItem1.x = -50;
        menuItem1.y = -25;
        menuItem2.x = 50;
        menuItem2.y = 25;

        expect(menuItem1.navigatable).toBe(false);
        expect(menuItem2.navigatable).toBe(false);

        menuItem1.navigationMode = "always";
        menuItem1.navigationPriority = 1;

        menuItem2.navigationMode = "always";

        expect(menuItem1.navigatable).toBe(true);
        expect(menuItem2.navigatable).toBe(true);

        expect(UINavigation.getStageContainer()).toBe(undefined);
        expect(UINavigation.active).toBe(false);

        // configure pixijs-input-devices
        InputDevice.add(InputDevice.keyboard);
        UINavigation.enable(stageContainer);

        expect(UINavigation.getStageContainer().name).toBe(stageContainer.name);

        UINavigation.autoFocus();

        expect(UINavigation.focusTarget.name).toBe(menuItem1.name);

        InputDevice.emitBind("NavigateLeft", InputDevice.keyboard);

        expect(UINavigation.focusTarget.name).toBe(button1.name);

        expect(buttonWasTriggered).toBe(false);

        InputDevice.emitBind("NavigateActivate", InputDevice.keyboard);

        expect(buttonWasTriggered).toBe(true);

        InputDevice.emitBind("NavigateRight", InputDevice.keyboard);

        expect(UINavigation.focusTarget.name).toBe(menuItem1.name);

        // add a responder to set the new top-most interaction target
        UINavigation.pushResponder(menuContainer);

        // now try to go back
        InputDevice.emitBind("NavigateLeft", InputDevice.keyboard);

        expect(UINavigation.focusTarget.name).toBe(menuItem1.name);

        UINavigation.popResponder();

        // now try to go back again
        InputDevice.emitBindDown("NavigateLeft", InputDevice.keyboard);

        expect(UINavigation.focusTarget.name).toBe(button1.name);
    });
});

afterEach(() =>
{
    jest.useRealTimers();
});
