import { CaretDown } from "@phosphor-icons/react/CaretDown";
import { Check } from "@phosphor-icons/react/Check";
import { Copy } from "@phosphor-icons/react/Copy";
import { Slot } from "@radix-ui/react-slot";
import Prism from "prismjs";
import "prismjs/components/prism-bash.js";
import "prismjs/components/prism-csharp.js";
import "prismjs/components/prism-css.js";
import "prismjs/components/prism-go.js";
import "prismjs/components/prism-java.js";
import "prismjs/components/prism-javascript.js";
import "prismjs/components/prism-json.js";
import "prismjs/components/prism-jsx.js";
import "prismjs/components/prism-markup.js";
import "prismjs/components/prism-python.js";
import "prismjs/components/prism-ruby.js";
import "prismjs/components/prism-rust.js";
import "prismjs/components/prism-tsx.js";
import "prismjs/components/prism-typescript.js";
import "prismjs/components/prism-yaml.js";
import type { ComponentProps, Dispatch, HTMLAttributes, SetStateAction } from "react";
import { createContext, forwardRef, useContext, useEffect, useId, useMemo, useState } from "react";
import assert from "tiny-invariant";
import { useCopyToClipboard } from "../../hooks/use-copy-to-clipboard.js";
import type { WithStyleProps } from "../../types/with-style-props.js";
import { cx } from "../../utils/cx/cx.js";
import type { LineRange } from "./line-numbers.js";
import type { SupportedLanguage } from "./supported-languages.js";
import { formatLanguageClassName, supportedLanguages } from "./supported-languages.js";

/**
 * TODO(cody):
 * - fix line numbers, maybe try grid instead of :before and flex?
 * - fix line hightlighting
 * - fix line wrapping? horizontal scrolling has problems w/ line highlighting :(
 */

type CodeBlockContextType = {
	codeId: string | undefined;
	copyText: string;
	hasCodeExpander: boolean;
	isCodeExpanded: boolean;
	registerCodeId: (id: string) => void;
	setCopyText: (newCopyText: string) => void;
	setHasCodeExpander: (value: boolean) => void;
	setIsCodeExpanded: Dispatch<SetStateAction<boolean>>;
	unregisterCodeId: (id: string) => void;
};

const CodeBlockContext = createContext<CodeBlockContextType>({
	codeId: undefined,
	copyText: "",
	hasCodeExpander: false,
	isCodeExpanded: false,
	registerCodeId: () => {},
	setCopyText: () => {},
	setHasCodeExpander: () => {},
	setIsCodeExpanded: () => {},
	unregisterCodeId: () => {},
});

const CodeBlock = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => {
	const [copyText, setCopyText] = useState("");
	const [hasCodeExpander, setHasCodeExpander] = useState(false);
	const [isCodeExpanded, setIsCodeExpanded] = useState(false);
	const [codeId, setCodeId] = useState<string | undefined>(undefined);

	const context: CodeBlockContextType = useMemo(
		() =>
			({
				codeId,
				copyText,
				hasCodeExpander,
				isCodeExpanded,
				registerCodeId: (id) => {
					setCodeId((old) => {
						assert(old == null, "You can only render a single CodeBlockCode within a CodeBlock.");
						return id;
					});
				},
				setCopyText,
				setHasCodeExpander,
				setIsCodeExpanded,
				unregisterCodeId: (id) => {
					setCodeId((old) => {
						assert(old === id, "You can only render a single CodeBlockCode within a CodeBlock.");
						return undefined;
					});
				},
			}) as const,
		[codeId, copyText, hasCodeExpander, isCodeExpanded],
	);

	return (
		<CodeBlockContext.Provider value={context}>
			<div
				className={cx(
					"overflow-hidden rounded-md border border-gray-300 bg-gray-50 font-mono text-[0.8125rem]",
					className,
				)}
				ref={ref}
				{...props}
			/>
		</CodeBlockContext.Provider>
	);
});
CodeBlock.displayName = "CodeBlock";

const CodeBlockBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
	<div className={cx("relative", className)} ref={ref} {...props} />
));
CodeBlockBody.displayName = "CodeBlockBody";

type CodeBlockCodeProps = Omit<ComponentProps<"pre">, "children"> & {
	/**
	 * The code to display in the code block. Should be code formatted as a string. This code will be passed to our syntax highlighter.
	 */
	value: string;
	/**
	 * @todo not implemented yet
	 */
	highlightLines?: (LineRange | number)[];
	/**
	 * The language of the code block. This will be used to determine how to syntax highlight the code. @default `"text"`.
	 */
	language?: SupportedLanguage;
	/**
	 * @todo not implemented yet
	 */
	showLineNumbers?: boolean;
};

const CodeBlockCode = forwardRef<HTMLPreElement, CodeBlockCodeProps>(
	(
		{
			className,
			language = "text",
			style,
			value,
			highlightLines: _unusedHighlightLines, // not implemented yet
			showLineNumbers: _unusedShowLineNumbers, // not implemented yet
			tabIndex,
			...props
		},
		ref,
	) => {
		const id = useId();
		const { hasCodeExpander, isCodeExpanded, registerCodeId, setCopyText, unregisterCodeId } =
			useContext(CodeBlockContext);

		// trim any leading and trailing whitespace/empty lines
		const trimmedCode = value?.trim() ?? "";
		const [highlightedCodeInnerHtml, setHighlightedCodeInnerHtml] = useState(trimmedCode);

		useEffect(() => {
			const grammar = Prism.languages[language];
			assert(
				grammar,
				`CodeBlock does not support the language "${language}". The syntax highlighter does not have a grammar for this language. The supported languages are: ${supportedLanguages.join(", ")}.`,
			);
			const newHighlightedCodeInnerHtml = Prism.highlight(trimmedCode, grammar, language);
			setHighlightedCodeInnerHtml(newHighlightedCodeInnerHtml);
		}, [trimmedCode, language]);

		useEffect(() => {
			setCopyText(trimmedCode);
		}, [trimmedCode, setCopyText]);

		useEffect(() => {
			registerCodeId(id);

			return () => {
				unregisterCodeId(id);
			};
		}, [id, registerCodeId, unregisterCodeId]);

		return (
			<pre
				aria-expanded={hasCodeExpander ? isCodeExpanded : undefined}
				className={cx(
					"scrollbar firefox:after:mr-[3.375rem] firefox:after:inline-block firefox:after:content-[''] overflow-x-auto overflow-y-hidden p-4 pr-[3.375rem]",
					"aria-collapsed:max-h-[13.6rem]",
					formatLanguageClassName(language), // place it last because prism does weird stuff client side, causes hydration mismatches
					className,
				)}
				data-lang={language}
				id={id}
				ref={ref}
				style={{
					...style,
					tabSize: 2,
					MozTabSize: 2,
				}}
				// prism.js adds a tabindex of 0 to the pre element by default (unless it's set)
				// this is unnecessary, we do not want this automatic behavior!
				tabIndex={tabIndex ?? -1}
				{...props}
			>
				<code
					// we need to suppress the hydration warning because we are setting the innerHTML of the code block
					// and using Prism.js to "highlight" the code in a useEffect (client-side only), which does different things on the client and server
					suppressHydrationWarning
					dangerouslySetInnerHTML={{ __html: highlightedCodeInnerHtml }}
				/>
			</pre>
		);
	},
);
CodeBlockCode.displayName = "CodeBlockCode";

const CodeBlockHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
	<div
		className={cx("flex items-center gap-1 border-b border-gray-300 bg-gray-100 px-4 py-2 text-gray-700", className)}
		ref={ref}
		{...props}
	/>
));
CodeBlockHeader.displayName = "CodeBlockHeader";

const CodeBlockTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement> & { asChild?: boolean }>(
	({ asChild = false, className, ...props }, ref) => {
		const Comp = asChild ? Slot : "h3";
		return <Comp ref={ref} className={cx("font-mono text-[0.8125rem] font-normal", className)} {...props} />;
	},
);
CodeBlockTitle.displayName = "CodeBlockTitle";

type CodeBlockCopyButtonProps = WithStyleProps & {
	/**
	 * Callback fired when the copy button is clicked, passes the copied text as an argument.
	 */
	onCopy?: (value: string) => void;
	/**
	 * Callback fired when an error occurs during copying.
	 */
	onCopyError?: (error: unknown) => void;
};

const CodeBlockCopyButton = forwardRef<HTMLButtonElement, CodeBlockCopyButtonProps>(
	({ className, onCopy, onCopyError, style }, ref) => {
		const { copyText } = useContext(CodeBlockContext);
		const [, copyToClipboard] = useCopyToClipboard();
		const [copied, setCopied] = useState(false);

		useEffect(() => {
			if (copied) {
				const timeoutId = window.setTimeout(() => {
					setCopied(false);
				}, 2000);

				return () => {
					clearTimeout(timeoutId);
				};
			}
		}, [copied]);

		return (
			<button
				type="button"
				className={cx(
					"focus-visible:border-accent-600 focus-visible:ring-focus-accent absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded border border-gray-300 bg-gray-50 shadow-[-1rem_0_0.75rem_-0.375rem_hsl(var(--gray-50)),1rem_0_0_-0.25rem_hsl(var(--gray-50))] hover:border-gray-400 hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-4",
					copied &&
						"bg-filled-success text-on-filled hover:bg-filled-success focus:bg-filled-success focus-visible:border-success-600 focus-visible:ring-focus-success w-auto gap-1 border-transparent pl-2 pr-1.5 hover:border-transparent",
					className,
				)}
				ref={ref}
				style={style}
				onClick={async () => {
					try {
						// eslint-disable-next-line @typescript-eslint/await-thenable
						await copyToClipboard(copyText);
						onCopy?.(copyText);
						setCopied(true);
					} catch (error) {
						onCopyError?.(error);
					}
				}}
			>
				<span className="sr-only">Copy code</span>
				{copied ? (
					<>
						Copied
						<Check className="h-4 w-4" weight="bold" />
					</>
				) : (
					<Copy className="-ml-px h-5 w-5" />
				)}
			</button>
		);
	},
);
CodeBlockCopyButton.displayName = "CodeBlockCopyButton";

type CodeBlockExpanderButtonProps = Omit<
	HTMLAttributes<HTMLButtonElement>,
	"children" | "aria-controls" | "aria-expanded"
>;

const CodeBlockExpanderButton = forwardRef<HTMLButtonElement, CodeBlockExpanderButtonProps>(
	({ className, onClick, ...props }, ref) => {
		const { codeId, isCodeExpanded, setIsCodeExpanded, setHasCodeExpander } = useContext(CodeBlockContext);

		useEffect(() => {
			setHasCodeExpander(true);

			return () => {
				setHasCodeExpander(false);
			};
		}, [setHasCodeExpander]);

		return (
			<button
				{...props}
				aria-controls={codeId}
				aria-expanded={isCodeExpanded}
				className={cx(
					"flex w-full items-center justify-center gap-0.5 border-t border-gray-300 bg-gray-50 px-4 py-2 font-sans text-gray-700 hover:bg-gray-100",
					className,
				)}
				ref={ref}
				type="button"
				onClick={(event) => {
					setIsCodeExpanded((prev) => !prev);
					onClick?.(event);
				}}
			>
				{isCodeExpanded ? "Show less" : "Show more"}{" "}
				<CaretDown
					className={cx("h-4 w-4", isCodeExpanded && "rotate-180", "transition-all duration-150")}
					weight="bold"
				/>
			</button>
		);
	},
);
CodeBlockExpanderButton.displayName = "CodeBlockExpanderButton";

export {
	CodeBlock,
	CodeBlockBody,
	CodeBlockCode,
	CodeBlockCopyButton,
	CodeBlockExpanderButton,
	CodeBlockHeader,
	CodeBlockTitle,
};
