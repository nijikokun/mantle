import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cx } from "../cx";
import type { WithAsChild } from "../types/as-child";
import type { VariantProps } from "../types/variant-props";

const buttonVariants = cva(
	"inline-flex items-center justify-center rounded-md font-medium focus-visible:outline-none focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-50 h-11 sm:h-9 px-3 border whitespace-nowrap sm:text-sm",
	{
		variants: {
			appearance: {
				outline:
					"bg-white dark:bg-gray-50 border-blue-600 text-blue-600 hover:bg-blue-500/5 dark:hover:bg-blue-500/5 active:bg-blue-500/10 focus-visible:ring-blue-500/25",
				solid:
					"border-transparent bg-blue-500 text-button hover:bg-blue-600 dark:hover:bg-blue-400 active:bg-blue-700 dark:active:bg-blue-300 focus-visible:border-blue-600 focus-visible:ring-blue-500/25",
				ghost:
					"border-transparent text-blue-600 hover:bg-blue-500/5 active:bg-blue-500/10 focus-visible:ring-blue-500/25",
			},
			priority: {
				default: "",
				danger: "",
				muted: "",
			},
		},
		defaultVariants: {
			appearance: "ghost",
		},
		compoundVariants: [
			{
				appearance: "ghost",
				priority: "danger",
				class: "border-transparent text-red-600 hover:bg-red-500/5 active:bg-red-500/10 focus-visible:ring-red-500/25",
			},
			{
				appearance: "outline",
				priority: "danger",
				class:
					"bg-white dark:bg-gray-50 border-red-600 text-red-600 dark:hover:bg-red-500/5 hover:bg-red-500/5 active:bg-red-500/10 focus-visible:ring-red-500/25",
			},
			{
				appearance: "solid",
				priority: "danger",
				class:
					"border-transparent bg-red-500 hover:bg-red-600 active:bg-red-700 focus-visible:ring-red-500/25 focus-visible:border-red-600 dark:hover:bg-red-400 dark:active:bg-red-300",
			},
			{
				appearance: "ghost",
				priority: "muted",
				class:
					"border-transparent text-gray-900 hover:bg-gray-500/5 active:bg-gray-500/10 focus-visible:ring-blue-500/25",
			},
			{
				appearance: "outline",
				priority: "muted",
				class:
					"bg-white dark:bg-gray-50 border-gray-300 text-gray-900 hover:bg-gray-500/5 dark:hover:bg-gray-500/5 active:bg-gray-500/10 focus-visible:ring-blue-500/25 focus-visible:border-blue-600",
			},
			{
				appearance: "solid",
				priority: "muted",
				class:
					"border-transparent bg-gray-500 hover:bg-gray-600 active:bg-gray-700 focus-visible:ring-gray-500/25 focus-visible:border-gray-600 dark:hover:bg-gray-400 dark:active:bg-gray-300",
			},
		],
	},
);

type ButtonVariants = VariantProps<typeof buttonVariants>;

/**
 * The props for the `Button` component.
 */
export type ButtonProps = WithAsChild & ButtonHTMLAttributes<HTMLButtonElement> & ButtonVariants;

/**
 * Renders a button or a component that looks like a button, an interactive
 * element activated by a user with a mouse, keyboard, finger, voice command, or
 * other assistive technology. Once activated, it then performs an action, such
 * as submitting a form or opening a dialog.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, appearance = "ghost", priority = "default", asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : "button";

		return <Comp className={cx(buttonVariants({ appearance, priority, className }))} ref={ref} {...props} />;
	},
);
Button.displayName = "Button";

export { Button, buttonVariants };
