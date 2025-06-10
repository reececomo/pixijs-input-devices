import { HapticEffect } from "../HapticEffect";

type QueuedHapticEffect = HapticEffect & {
    /** When the effect should start */
    start: number;
    /** When the effect should end */
    end: number;
};

/** How long to run each effect for in between key frames. */
const MAX_KEYFRAME_MS = 2_000;

export class GamepadHapticManager
{
    public readonly hapticEvent?: "dual-rumble" | "trigger-rumble";

    private gamepad: Gamepad;
    private activeEffects: QueuedHapticEffect[] = [];

    /** Scalar from 0.0 to 1.0 for how much rumble to apply. */
    private intensity: number;

    private state = {
        rumble: 0,
        buzz: 0,
        leftTrigger: 0,
        rightTrigger: 0,
        expires: 0
    };

    public constructor(gamepad: Gamepad)
    {
        this.gamepad = gamepad;

        if ('vibrationActuator' in gamepad)
        {
            // "trigger-rumble" support is listed as experimental, fall back to "dual-rumble".
            this.hapticEvent = (gamepad.vibrationActuator as any)?.effects?.includes?.("trigger-rumble")
                ? "trigger-rumble"
                : "dual-rumble";
        }
        else this.hapticEvent = undefined;
    }

    public play(haptic: HapticEffect, intensity: number): void
    {
        const delay = Math.max(0, haptic.startDelay ?? 0);
        const start = performance.now() + delay;

        this.activeEffects.push({
            ...haptic,
            start,
            end: start + Math.max(haptic.duration, 0),
            startDelay: undefined,
        });

        if (this.intensity !== intensity)
        {
            this.intensity = Math.max(0, Math.min(1, intensity));
        }

        if (!delay && this.activeEffects.length === 0) this.update(); // start immediately
    }

    /** Clear all effects */
    public reset(): void
    {
        this.activeEffects.length = 0;
        this.state.rumble = 0.0;
        this.state.buzz = 0.0;
        this.state.leftTrigger = 0.0;
        this.state.rightTrigger = 0.0;

        if (this.gamepad.vibrationActuator)
        {
            this.gamepad.vibrationActuator.reset();
        }
        else if ((this.gamepad as any).hapticActuators)
        {
            // run an empty pulse to clear the previous effects
            // https://developer.mozilla.org/en-US/docs/Web/API/GamepadHapticActuator/pulse
            (this.gamepad as any).hapticActuators[0]?.pulse?.(0, 100);
        }
    }

    public update(): void
    {
        const now = performance.now();

        let rumble = 0.0;
        let buzz = 0.0;
        let leftTrigger = 0.0;
        let rightTrigger = 0.0;
        let maxDuration = 0.0;
        let anyHapticHasEnded = false;

        for (let i = 0; i < this.activeEffects.length; i++)
        {
            const haptic = this.activeEffects[i];

            if (haptic.end <= now)
            {
                anyHapticHasEnded = true;
                continue;
            }

            if (haptic.start > now)
            {
                // has not started yet
                continue;
            }

            if (this.hapticEvent === "trigger-rumble")
            {
                if (haptic.leftTrigger && haptic.leftTrigger > leftTrigger) leftTrigger = haptic.leftTrigger;
                if (haptic.rightTrigger && haptic.rightTrigger > rightTrigger) rightTrigger = haptic.rightTrigger;
            }

            if (haptic.rumble && haptic.rumble > rumble) rumble = haptic.rumble;
            if (haptic.buzz && haptic.buzz > buzz) buzz = haptic.buzz;
            if (haptic.end - now > maxDuration) maxDuration = haptic.end - now;
        }

        if (anyHapticHasEnded)
        {
            // Clear when done
            this.activeEffects = this.activeEffects.filter((haptic) => haptic.end >= now);
        }

        // Only send effect if intensity changed (to reduce spam)
        if (
            this.state.rumble !== rumble
            || this.state.buzz !== buzz
            || this.state.leftTrigger !== leftTrigger
            || this.state.rightTrigger !== rightTrigger
            || (
                this.state.expires <= now
                && rumble + buzz + leftTrigger + rightTrigger > 0
            )
        )
        {
            this.state.rumble = rumble;
            this.state.buzz = buzz;
            this.state.leftTrigger = leftTrigger;
            this.state.rightTrigger = rightTrigger;

            if (this.hapticEvent !== undefined)
            {
                this.state.expires = now + MAX_KEYFRAME_MS;

                this.gamepad.vibrationActuator.playEffect(this.hapticEvent, {
                    duration: MAX_KEYFRAME_MS,
                    strongMagnitude: rumble * this.intensity,
                    weakMagnitude: buzz * this.intensity,
                    leftTrigger: leftTrigger * this.intensity,
                    rightTrigger: rightTrigger * this.intensity,
                });
            }
            else if ((this.gamepad as any).hapticActuators)
            {
                const duration = Math.min(maxDuration, MAX_KEYFRAME_MS);
                const monoIntensity = Math.max(rumble, buzz) * this.intensity;

                this.state.expires = now + maxDuration;

                // https://developer.mozilla.org/en-US/docs/Web/API/GamepadHapticActuator/pulse
                (this.gamepad as any).hapticActuators[0]?.pulse?.(monoIntensity, duration);
            }
        }
    }
}
