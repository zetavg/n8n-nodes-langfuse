import {
	NodeOperationError,
	type INode,
} from 'n8n-workflow';

export function validatePromptJsonInput(node: INode, inputName: string, input: unknown, options?: { optional?: boolean }) {
	if (options?.optional && !input) {
		return undefined;
	}

	const json = validateJsonInput(node, inputName, input);

	if (options?.optional && Object.keys(json).length === 0) {
		return undefined
	}

	if (typeof json.name !== 'string' || typeof json.version !== 'number') {
		throw new NodeOperationError(
			node,
			`Input ${inputName} does not look like a valid Langfuse prompt object. It should have a 'name' string and a 'version' number. If you are using expression, make sure you are passing the correct level of the data, for example, ${'`{{ JSON.stringify($json.prompt) }}`'} rather then ${'`{{ JSON.stringify($json.prompt.prompt) }}`'}.`,
		);
	}

	return json as { name: string, version: number } & Record<string, any>;
}

export function validateStringInput(node: INode, inputName: string, input: unknown): string {
	if (typeof input === 'string') {
		return input;
	}

	throw new NodeOperationError(
		node,
		`Input ${inputName} should be a string, got ${typeof input} instead.`,
	);
}

export function validateAnyInput(node: INode, inputName: string, input: unknown): unknown {
	if (input && typeof input === 'object') {
		return input;
	}

	if (typeof input !== 'string') {
		return input;
	}

	try {
		return JSON.parse(input);
	} catch (error) {
		return input;
	}
}

export function validateJsonInput(node: INode, inputName: string, input: unknown): Record<string, any> {
	if (input && typeof input === 'object') {
		return input;
	}

	if (typeof input !== 'string') {
		throw new NodeOperationError(
			node,
			`Input ${inputName} should be a JSON string or object, got ${typeof input} instead.`,
		);
	}

	try {
		return JSON.parse(input);
	} catch (error) {
		throw new NodeOperationError(
			node,
			`Input ${inputName} should be a valid JSON string (parse error: ${error instanceof Error ? error.message : String(error)}).`
		);
	}
}
