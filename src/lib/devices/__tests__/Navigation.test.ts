import { Bounds, Container, ContainerOptions } from "pixi.js";

import { UINavigation } from "../../navigation/UINavigation";
import { registerPixiJSNavigationMixin } from "../../../Container.mixin";
import { InputDevice } from "../../InputDevice";
import { getAllNavigatables, invalidateNavigatablesCache } from "../../navigation/Navigatable";

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
            x: -90,
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

        InputDevice.emitBindDownUp("NavigateLeft", InputDevice.keyboard);

        expect(UINavigation.focusTarget.label).toBe(button1.label);

        InputDevice.emitBindDownUp("NavigateRight", InputDevice.keyboard);

        expect(UINavigation.focusTarget.label).toBe(menuItem1.label);

        InputDevice.emitBindDownUp("NavigateLeft", InputDevice.keyboard);

        expect(UINavigation.focusTarget.label).toBe(button1.label);

        expect(buttonActivated).toBe(false);

        InputDevice.emitBindDownUp("NavigateActivate", InputDevice.keyboard);

        expect(buttonActivated).toBe(true);

        InputDevice.emitBindDownUp("NavigateRight", InputDevice.keyboard);

        expect(UINavigation.focusTarget.label).toBe(menuItem1.label);

        // add a responder to set the new top-most interaction target
        UINavigation.pushResponder(menuContainer);

        // now try to go back
        InputDevice.emitBindDownUp("NavigateLeft", InputDevice.keyboard);

        expect(UINavigation.focusTarget.label).toBe(menuItem1.label);

        UINavigation.popResponder();

        // now try to go back again
        InputDevice.emitBindDownUp("NavigateLeft", InputDevice.keyboard);

        expect(UINavigation.focusTarget.label).toBe(button1.label);
    });
});

afterEach(() =>
{
    jest.useRealTimers();
});

// -------------------------------------------------------------------
// Navigation cache tests
// -------------------------------------------------------------------

describe("getAllNavigatables cache", () =>
{
    beforeAll(() => registerPixiJSNavigationMixin(Container));

    it("returns cached result for the same root on repeated calls", () =>
    {
        const root = new MockContainer();
        const child = new MockContainer({ navigationMode: "always" });
        root.addChild(child);

        invalidateNavigatablesCache(root);

        const first = getAllNavigatables(root);
        const second = getAllNavigatables(root);

        // Same array reference — no rebuild
        expect(first).toBe(second);
        expect(first).toContain(child);
    });

    it("invalidateNavigatablesCache(root) forces a fresh walk", () =>
    {
        const root = new MockContainer();
        const child1 = new MockContainer({ navigationMode: "always" });
        root.addChild(child1);

        invalidateNavigatablesCache(root);
        const before = getAllNavigatables(root);
        expect(before.length).toBe(1);

        // Add a new child — cache is stale until invalidated
        const child2 = new MockContainer({ navigationMode: "always" });
        root.addChild(child2);

        invalidateNavigatablesCache(root);
        const after = getAllNavigatables(root);

        expect(after.length).toBe(2);
        expect(after).not.toBe(before); // new array
    });

    it("invalidateNavigatablesCache() with no arg clears all roots", () =>
    {
        const rootA = new MockContainer();
        const rootB = new MockContainer();
        const child = new MockContainer({ navigationMode: "always" });

        rootA.addChild(new MockContainer({ navigationMode: "always" }));
        rootB.addChild(child);

        invalidateNavigatablesCache();
        getAllNavigatables(rootA);
        getAllNavigatables(rootB);

        // Now invalidate everything
        invalidateNavigatablesCache();

        // Both should rebuild on next call (no stale reference)
        const a2 = getAllNavigatables(rootA);
        const b2 = getAllNavigatables(rootB);

        expect(a2.length).toBe(1);
        expect(b2.length).toBe(1);
    });

    it("UINavigation.invalidateNavCache() invalidates the stage root", () =>
    {
        const stage = new MockContainer();
        const nav1 = new MockContainer({ navigationMode: "always" });
        stage.addChild(nav1);

        UINavigation.enable(stage); // calls invalidateNavigatablesCache internally

        const first = getAllNavigatables(stage);
        expect(first).toContain(nav1);

        // Add another child — cache is stale
        const nav2 = new MockContainer({ navigationMode: "always" });
        stage.addChild(nav2);

        UINavigation.invalidateNavCache();

        const second = getAllNavigatables(stage);
        expect(second.length).toBe(2);
        expect(second).toContain(nav2);

        UINavigation.disable();
    });
});
