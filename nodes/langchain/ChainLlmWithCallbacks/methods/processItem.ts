// @ts-ignore should be included in n8n
import type { BaseLanguageModel } from '@langchain/core/language_models/base';
import { type IExecuteFunctions, NodeConnectionType, NodeOperationError } from 'n8n-workflow';

// @ts-ignore
import { getPromptInputByType } from '@n8n/n8n-nodes-langchain/dist/utils/helpers';
// @ts-ignore
import { getOptionalOutputParser } from '@n8n/n8n-nodes-langchain/dist/utils/output_parsers/N8nOutputParser';

import { executeChain } from './chainExecutor';
// import { type MessageTemplate } from './types';

export const processItem = async (ctx: IExecuteFunctions, itemIndex: number) => {
	const llm = (await ctx.getInputConnectionData(
		NodeConnectionType.AiLanguageModel,
		0,
	)) as BaseLanguageModel;

	// Get output parser if configured
	const outputParser = await getOptionalOutputParser(ctx);

	// Get user prompt based on node version
	let prompt: string;

	if (ctx.getNode().typeVersion <= 1.3) {
		prompt = ctx.getNodeParameter('prompt', itemIndex) as string;
	} else {
		prompt = getPromptInputByType({
			ctx,
			i: itemIndex,
			inputKey: 'text',
			promptTypeKey: 'promptType',
		});
	}

	// Validate prompt
	if (prompt === undefined) {
		throw new NodeOperationError(ctx.getNode(), "The 'prompt' parameter is empty.");
	}

	// Get chat messages if configured
	const messages = ctx.getNodeParameter(
		'messages.messageValues',
		itemIndex,
		[],
	) as any[];

	// Execute the chain
	return await executeChain({
		context: ctx,
		itemIndex,
		query: prompt,
		llm,
		outputParser,
		messages,
		...({
			callbacks: await ctx.getInputConnectionData(
				NodeConnectionType.AiChain,
				0,
			),
		} as any)
	});
};
