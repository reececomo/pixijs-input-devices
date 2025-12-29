import { Container } from "pixi.js";

import { UINavigation } from "../../navigation/UINavigation";
import { registerPixiJSNavigationMixin } from "../../../Container.mixin";
import { InputDevice } from "../../InputDevice";

beforeAll(() => registerPixiJSNavigationMixin(Container));

describe("Navigation", () =>
{
    it("does the thing", () =>
    {
        jest.useFakeTimers();

        const stageContainer = new Container();

        let buttonWasTriggered = false;

        const button1 = new Container();
        button1.x = -100;
        button1.interactive = true;
        button1.on("pointerup", () =>
        {
            // do something
            buttonWasTriggered = true;
        });
        button1.on("pointerdown", () =>
        {
            // do something
            buttonWasTriggered = true;
        });

        expect(button1.isNavigatable).toBe(true);

        const menu = new Container();
        const menuItem1 = new Container();
        const menuItem2 = new Container();
        menu.addChild(menuItem1, menuItem2);
        menu.x = 100;
        menuItem1.y = -50;
        menuItem1.navigationMode = "pointer";
        menuItem2.y = 50;
        menuItem2.navigationMode = "pointer";

        stageContainer.addChild(
            button1,
            menu,
        );

        expect(UINavigation.getStageContainer()).toBe(undefined);
        expect(UINavigation.active).toBe(false);

        UINavigation.enable(stageContainer);
        UINavigation.autoFocus();

        expect(UINavigation.getStageContainer()).toBe(stageContainer);
        expect(UINavigation.focusTarget === button1).toBe(true);

        expect(buttonWasTriggered).toBe(false);

        InputDevice.emitBindUp("NavigateActivate", InputDevice.keyboard);

        expect(buttonWasTriggered).toBe(true);

        InputDevice.emitBindDown("NavigateRight", InputDevice.keyboard);

        expect(UINavigation.focusTarget === menuItem1).toBe(true);

        // add a responder to set the new top-most interaction target
        UINavigation.pushResponder(menu);

        // now try to go back
        InputDevice.emitBindDown("NavigateLeft", InputDevice.keyboard);

        expect(UINavigation.focusTarget === menuItem1).toBe(true);

        UINavigation.popResponder();

        // now try to go back again
        InputDevice.emitBindDown("NavigateLeft", InputDevice.keyboard);

        expect(UINavigation.focusTarget === menuItem1).toBe(false);
        expect(UINavigation.focusTarget === button1).toBe(true);
    });
});

afterEach(() =>
{
    jest.useRealTimers();
});
