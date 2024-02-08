import { code } from "@/code-block/src/code";
import { CodeBlock, CodeBlockBody, CodeBlockCode, CodeBlockCopyButton } from "@/code-block/src/code-block";
import { Input } from "@/input/src/input";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/table/src/table";
import type { HeadersFunction, MetaFunction } from "@remix-run/node";
import { Example } from "~/components/example";

export const meta: MetaFunction = () => {
	return [
		{ title: "@ngrok/mantle — Input" },
		{ name: "description", content: "mantle is ngrok's UI library and design system" },
	];
};

export const headers: HeadersFunction = () => {
	return {
		"Cache-Control": "max-age=300, stale-while-revalidate=604800",
	};
};

export default function Page() {
	return (
		<div>
			<h1 className="text-5xl font-medium">Input</h1>
			<p className="mt-4 text-xl text-gray-600">Fundamental component for inputs.</p>

			<Example className="mt-4 flex-col gap-4">
				<Input className="max-w-64" placeholder="Enter a username" />
				<Input className="max-w-64" placeholder="Enter a username" aria-invalid />
			</Example>
			<CodeBlock className="rounded-b-lg rounded-t-none">
				<CodeBlockBody>
					<CodeBlockCopyButton />
					<CodeBlockCode language="tsx">{code`
						<>
							<Input placeholder="Enter a username" />
							<Input placeholder="Enter a username" aria-invalid />
						</>
					`}</CodeBlockCode>
				</CodeBlockBody>
			</CodeBlock>

			<h2 className="mt-16 text-3xl font-medium">API Reference</h2>
			<div className="z-10 mt-4 overflow-hidden rounded-lg border border-gray-300">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Prop</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Default</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody className="font-mono text-xs text-gray-600">
						{/* <TableRow>
							<TableCell className="align-top font-medium">state</TableCell>
							<TableCell className="space-y-2 align-top text-xs">
								<p>default</p>
								<p>danger</p>
							</TableCell>
							<TableCell className="align-top">default</TableCell>
						</TableRow> */}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
