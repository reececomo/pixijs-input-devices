import { Bounds, Container, ContainerOptions } from "pixi.js";

import { UINavigation } from "../../navigation/UINavigation";
import { registerPixiJSNavigationMixin } from "../../../Container.mixin";
import { InputDevice } from "../../InputDevice";

beforeAll(() => registerPixiJSNavigationMixin(Container));

class MockContainer extends Container
{
    public constructor(options?: ContainerOptions)
    {
        super(options);

        this.getBounds = (skipUpdate?: boolean, bounds?: Bounds): Bounds =>
        {
            const width = 10, height = 10;

            let target: Container | null = this;
            let x = 0;
            let y = 0;

            while (target)
            {
                x += target.x;
                y += target.y;
                target = target.parent;
            }

            return new Bounds(
                x - width/2,
                y - height/2,
                x + width/2,
                y + height/2
            );
        };

        this.isInteractive = () => this.eventMode === "static" || this.eventMode === "dynamic";
    }
}

describe("UINavigation", () =>
{
    test("allows container navigation", () =>
    {
        jest.useFakeTimers();

        // data
        let buttonActivated = false;
        const activateButton = (): any => buttonActivated = true;

        // cotainers
        const stageContainer = new MockContainer({
            label: "Stage container",
        });

        const menuContainer = new MockContainer({
            label: "Menu container",
            x: 100,
        });

        const menuItem1 = new MockContainer({
            label: "Menu Item 1",
            navigationPriority: 1,
            x: -55,
            y: -25,
        });

        const menuItem2 = new MockContainer({
            label: "Menu Item 2",
            navigationMode: "always",
            x: 50,
            y: -25,
        });

        const button1 = new MockContainer({
            label: "Button 1",
            eventMode: "static",
            x: -75,
            y: -20,
        }).on("pointertap", activateButton);

        menuContainer.addChild(
            menuItem1,
            menuItem2,
        );

        stageContainer.addChild(
            button1,
            menuContainer,
        );

        expect(button1.navigatable).toBe(true);
        expect(menuItem1.navigatable).toBe(false);
        expect(menuItem2.navigatable).toBe(true);

        menuItem1.navigationMode = "always";
        menuItem1.navigationLinks.left = button1;
        expect(menuItem1.navigatable).toBe(true);

        // sanity check
        expect(UINavigation.active).toBe(false);
        expect(UINavigation.getStageContainer()).toBeUndefined();

        // configure pixijs-input-devices
        InputDevice.add(InputDevice.keyboard);
        UINavigation.enable(stageContainer);

        expect(UINavigation.getStageContainer().label).toBe(stageContainer.label);
        expect(UINavigation.focusTarget?.label).toBeUndefined();

        UINavigation.autoFocus();

        expect(UINavigation.focusTarget.label).toBe(menuItem1.label);

        InputDevice.emitBind("NavigateLeft", InputDevice.keyboard);

        expect(UINavigation.focusTarget.label).toBe(button1.label);

        expect(buttonActivated).toBe(false);

        InputDevice.emitBind("NavigateActivate", InputDevice.keyboard);

        expect(buttonActivated).toBe(true);

        InputDevice.emitBind("NavigateRight", InputDevice.keyboard);

        expect(UINavigation.focusTarget.label).toBe(menuItem1.label);

        // add a responder to set the new top-most interaction target
        UINavigation.pushResponder(menuContainer);

        // now try to go back
        InputDevice.emitBind("NavigateLeft", InputDevice.keyboard);

        expect(UINavigation.focusTarget.label).toBe(menuItem1.label);

        UINavigation.popResponder();

        // now try to go back again
        InputDevice.emitBindDown("NavigateLeft", InputDevice.keyboard);

        expect(UINavigation.focusTarget.label).toBe(button1.label);
    });
});

afterEach(() =>
{
    jest.useRealTimers();
});
