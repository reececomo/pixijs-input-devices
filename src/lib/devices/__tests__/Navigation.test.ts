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

        expect(UINavigation.getStageContainer()?.label).toBe(stageContainer.label);
        expect(UINavigation.focusTarget?.label).toBeUndefined();

        UINavigation.autoFocus();

        expect(UINavigation.focusTarget?.label).toBe(menuItem1.label);

        InputDevice.emitBindDownUp("NavigateLeft", InputDevice.keyboard);

        expect(UINavigation.focusTarget?.label).toBe(button1.label);

        InputDevice.emitBindDownUp("NavigateRight", InputDevice.keyboard);

        expect(UINavigation.focusTarget?.label).toBe(menuItem1.label);

        InputDevice.emitBindDownUp("NavigateLeft", InputDevice.keyboard);

        expect(UINavigation.focusTarget?.label).toBe(button1.label);

        expect(buttonActivated).toBe(false);

        InputDevice.emitBindDownUp("NavigateActivate", InputDevice.keyboard);

        expect(buttonActivated).toBe(true);

        InputDevice.emitBindDownUp("NavigateRight", InputDevice.keyboard);

        expect(UINavigation.focusTarget?.label).toBe(menuItem1.label);

        // add a responder to set the new top-most interaction target
        UINavigation.pushResponder(menuContainer);

        // now try to go back
        InputDevice.emitBindDownUp("NavigateLeft", InputDevice.keyboard);

        expect(UINavigation.focusTarget?.label).toBe(menuItem1.label);

        UINavigation.popResponder();

        // now try to go back again
        InputDevice.emitBindDownUp("NavigateLeft", InputDevice.keyboard);

        expect(UINavigation.focusTarget?.label).toBe(button1.label);
    });
});

afterEach(() =>
{
    jest.useRealTimers();
});

describe("UINavigation spatial backtracking", () =>
{
    // Layout (all elements at y=0, spread along x-axis):
    //   left(-200)   center(0)   right(200)
    //
    // Also includes `near` at x=10, which is spatially between center and right.
    // This lets us verify that backtrack returns to `center` when navigating
    // right from `center` to `right` and then back left — even though `near`
    // would be the closest spatial candidate from `right`.

    let stage: MockContainer;
    let left: MockContainer;
    let center: MockContainer;
    let near: MockContainer;
    let right: MockContainer;

    beforeEach(() =>
    {
        stage = new MockContainer({ label: "stage" });
        left = new MockContainer({ label: "left", navigationMode: "always", x: -200 });
        center = new MockContainer({ label: "center", navigationMode: "always", x: 0, navigationPriority: 1 });
        near = new MockContainer({ label: "near", navigationMode: "always", x: 100 });
        right = new MockContainer({ label: "right", navigationMode: "always", x: 200 });

        stage.addChild(left, center, near, right);
        InputDevice.add(InputDevice.keyboard);
        UINavigation.enable(stage);
        UINavigation.autoFocus();

        expect(UINavigation.focusTarget?.label).toBe("center");
    });

    afterEach(() =>
    {
        UINavigation.disable();
    });

    test("returns to the origin when navigating in reverse", () =>
    {
        // center → right (spatial skips `near` since it's much farther right in this layout)
        // Actually, `near` at x=10 is closer than `right` at x=200, so center → near first.
        // Navigate again from near → right.
        InputDevice.emitBindDownUp("NavigateRight", InputDevice.keyboard);
        expect(UINavigation.focusTarget?.label).toBe("near");

        InputDevice.emitBindDownUp("NavigateLeft", InputDevice.keyboard);
        expect(UINavigation.focusTarget?.label).toBe("center"); // backtrack to center
    });

    test("backtracks differ from spatial when an element is between origin and destination", () =>
    {
        // Force focus to right so the backtrack source is center (skipping `near`).
        // We do this by navigating: center → near (spatial) → right (spatial).
        // Backtrack source after the second step is `near`, not `center`.
        // So going left from `right` gives `near` (backtrack), not `center` (which is farther).
        InputDevice.emitBindDownUp("NavigateRight", InputDevice.keyboard);
        expect(UINavigation.focusTarget?.label).toBe("near");

        InputDevice.emitBindDownUp("NavigateRight", InputDevice.keyboard);
        expect(UINavigation.focusTarget?.label).toBe("right");

        // Backtrack: returns to `near`, not `center`
        InputDevice.emitBindDownUp("NavigateLeft", InputDevice.keyboard);
        expect(UINavigation.focusTarget?.label).toBe("near");
    });

    test("backtrack memory is consumed after one use", () =>
    {
        InputDevice.emitBindDownUp("NavigateRight", InputDevice.keyboard); // center → near
        InputDevice.emitBindDownUp("NavigateLeft", InputDevice.keyboard);  // backtrack: near → center
        // Backtrack consumed. Now navigate right again → spatial from center → near.
        InputDevice.emitBindDownUp("NavigateRight", InputDevice.keyboard);
        expect(UINavigation.focusTarget?.label).toBe("near");
    });

    test("clears on Activate", () =>
    {
        InputDevice.emitBindDownUp("NavigateRight", InputDevice.keyboard); // center → near
        InputDevice.emitBindDownUp("NavigateActivate", InputDevice.keyboard); // clears backtrack
        InputDevice.emitBindDownUp("NavigateRight", InputDevice.keyboard); // near → right (spatial, not backtrack to center)
        expect(UINavigation.focusTarget?.label).toBe("right");
    });

    test("clears on Back", () =>
    {
        InputDevice.emitBindDownUp("NavigateRight", InputDevice.keyboard); // center → near
        InputDevice.emitBindDownUp("NavigateBack", InputDevice.keyboard);  // clears backtrack + clears focus
        UINavigation.setFocus(near, InputDevice.keyboard);                 // restore focus
        InputDevice.emitBindDownUp("NavigateRight", InputDevice.keyboard); // near → right (spatial, not backtrack)
        expect(UINavigation.focusTarget?.label).toBe("right");
    });

    test("clears on any other directional navigation", () =>
    {
        InputDevice.emitBindDownUp("NavigateRight", InputDevice.keyboard); // center → near (store backtrack)
        InputDevice.emitBindDownUp("NavigateDown", InputDevice.keyboard);  // no target below; clears backtrack
        InputDevice.emitBindDownUp("NavigateLeft", InputDevice.keyboard);  // spatial from near → center (no backtrack)
        expect(UINavigation.focusTarget?.label).toBe("center");
        // If backtrack had NOT been cleared by NavigateDown, we would have gone to center (same here).
        // Verify the backtrack WAS cleared: a second left from center should go to left, not loop.
        InputDevice.emitBindDownUp("NavigateLeft", InputDevice.keyboard);
        expect(UINavigation.focusTarget?.label).toBe("left");
    });

    test("clears on pointer setFocus", () =>
    {
        InputDevice.emitBindDownUp("NavigateRight", InputDevice.keyboard); // center → near (store backtrack)
        UINavigation.setFocus(near);                                        // pointer focus clears backtrack
        InputDevice.emitBindDownUp("NavigateRight", InputDevice.keyboard); // near → right (spatial, not backtrack to center)
        expect(UINavigation.focusTarget?.label).toBe("right");
    });

    test("clears when pushResponder is called", () =>
    {
        const responder = new MockContainer({ label: "responder", eventMode: "static", x: 50 });
        stage.addChild(responder);

        InputDevice.emitBindDownUp("NavigateRight", InputDevice.keyboard); // center → near (store backtrack)
        UINavigation.pushResponder(responder);
        UINavigation.popResponder();
        // Backtrack cleared. From near, navigate left → spatial → center.
        InputDevice.emitBindDownUp("NavigateLeft", InputDevice.keyboard);
        expect(UINavigation.focusTarget?.label).toBe("center");
    });

    test("clears when popResponder is called", () =>
    {
        const responder = new MockContainer({ label: "responder", eventMode: "static", x: 50 });
        stage.addChild(responder);

        UINavigation.pushResponder(responder);
        InputDevice.emitBindDownUp("NavigateRight", InputDevice.keyboard); // responder → right (store backtrack)
        expect(UINavigation.focusTarget?.label).toBe("center");
        UINavigation.popResponder();

        expect(UINavigation.focusTarget?.label).toBe("center");
        // Backtrack cleared by popResponder. From near (where we were before responder), navigate left → center.
        InputDevice.emitBindDownUp("NavigateLeft", InputDevice.keyboard);
        expect(UINavigation.focusTarget?.label).toBe("left");
    });

    test("disabled when spatial.backtracking is false", () =>
    {
        UINavigation.options.spatial.backtracking = false;

        InputDevice.emitBindDownUp("NavigateRight", InputDevice.keyboard); // center → near
        InputDevice.emitBindDownUp("NavigateLeft", InputDevice.keyboard);  // spatial (not backtrack): near → center
        // Without backtrack this still lands on center (spatial agrees here).
        // Navigate right → near, right → right to confirm no backtrack state builds up.
        InputDevice.emitBindDownUp("NavigateRight", InputDevice.keyboard); // center → near
        InputDevice.emitBindDownUp("NavigateRight", InputDevice.keyboard); // near → right
        InputDevice.emitBindDownUp("NavigateLeft", InputDevice.keyboard);  // spatial: right → near (not backtrack to near either)
        expect(UINavigation.focusTarget?.label).toBe("near");

        UINavigation.options.spatial.backtracking = true; // restore
    });
});

