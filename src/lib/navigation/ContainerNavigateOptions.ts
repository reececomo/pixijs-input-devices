import type { Container } from "pixi.js";

export interface ContainerNavigateOptions
{
    /** Container to navigate to on "NavigateLeft". */
    left?: Container | null;

    /** Container to navigate to on "NavigateRight". */
    right?: Container | null;

    /** Container to navigate to on "NavigateUp". */
    up?: Container | null;

    /** Container to navigate to on "NavigateDown". */
    down?: Container | null;

    /** Container to navigate to on "NavigateBack". */
    back?: Container | null;

    /** Container to navigate to on "NavigateActivate". */
    activate?: Container | null;
}
