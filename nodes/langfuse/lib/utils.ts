import {
	type FunctionsBase,
	IExecuteFunctions,
	NodeOperationError,
} from 'n8n-workflow';

export { randomString } from 'n8n-workflow';

// @ts-ignore should be included in node
import { Buffer } from 'buffer';

export async function getLangfuseKeys(t: FunctionsBase) {
	const {
		host: LANGFUSE_HOST,
		publicKey: LANGFUSE_PUBLIC_KEY,
		secretKey: LANGFUSE_SECRET_KEY,
	} = await t.getCredentials('langfuseApi');

	if (typeof LANGFUSE_HOST !== 'string') {
		throw new NodeOperationError(t.getNode(), 'Langfuse host should be a string');
	}
	if (typeof LANGFUSE_PUBLIC_KEY !== 'string') {
		throw new NodeOperationError(t.getNode(), 'Langfuse host should be a string');
	}
	if (typeof LANGFUSE_SECRET_KEY !== 'string') {
		throw new NodeOperationError(t.getNode(), 'Langfuse host should be a string');
	}

	return {
		LANGFUSE_HOST,
		LANGFUSE_PUBLIC_KEY,
		LANGFUSE_SECRET_KEY,
	}
}

export function getLangfuseAuth({
	LANGFUSE_PUBLIC_KEY,
	LANGFUSE_SECRET_KEY,
}: {
	LANGFUSE_PUBLIC_KEY: string;
	LANGFUSE_SECRET_KEY: string;
}) {
	const LANGFUSE_TOKEN = Buffer.from(`${LANGFUSE_PUBLIC_KEY}:${LANGFUSE_SECRET_KEY}`).toString('base64');

	const LANGFUSE_AUTHORIZATION = `Basic ${LANGFUSE_TOKEN}`;


	return {
		LANGFUSE_AUTHORIZATION,
		LANGFUSE_TOKEN,
	}
}

export function getN8nMetadata(ctx: Pick<IExecuteFunctions, 'getExecutionId' | 'getWorkflow' | 'getInstanceId' | 'getInstanceBaseUrl' | 'getMode' | 'getActivationMode'>) {
	const n8nMetadata = {
		executionId: ctx.getExecutionId(),
		workflow: ctx.getWorkflow(),
		instance: {
			id: ctx.getInstanceId(),
			baseUrl: ctx.getInstanceBaseUrl(),
		},
		misc: {
			mode: ctx.getMode(),
			activationMode: ctx.getActivationMode?.(),
		},
	}

	return n8nMetadata
}

