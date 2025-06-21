// https://github.com/n8n-io/n8n/blob/n8n%401.97.0/packages/%40n8n/nodes-langchain/nodes/chains/ChainLLM/ChainLlm.node.ts

import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeApiError, NodeOperationError, sleep } from 'n8n-workflow';

// @ts-ignore
import { ChainLlm as UpstreamChainLlm } from '@n8n/n8n-nodes-langchain/dist/nodes/chains/ChainLLM/ChainLlm.node';

// @ts-ignore
import { getOptionalOutputParser } from '@n8n/n8n-nodes-langchain/dist/utils/output_parsers/N8nOutputParser';

// @ts-ignore
import { formatResponse, getInputs, nodeProperties } from '@n8n/n8n-nodes-langchain/dist/nodes/chains/ChainLLM/methods';

import { processItem } from './methods/processItem';
import {
	getCustomErrorMessage as getCustomOpenAiErrorMessage,
	isOpenAiError,
	// @ts-ignore
} from '@n8n/n8n-nodes-langchain/dist/nodes/vendors/OpenAi/helpers/error-handling';

export class ChainLlmWithCallbacks extends UpstreamChainLlm {
	constructor(...args: any) {
		super(...args)

		const patchedInputs = (() => {
			// @ts-ignore this.description should be assigned in the super constructor
			const origInputs = this.description.inputs;

			if (typeof origInputs !== 'string') {
				// TODO
				// eslint-disable-next-line n8n-nodes-base/node-execute-block-wrong-error-thrown
				throw new Error('[ChainLlmWithCallbacks] Expect description.inputs of the upstream AgentV2 to be a string, but got: ' + typeof origInputs);
			}

			let patched: string = origInputs

			patched = replaceExactOnce(patched, /return inputs/, `inputs.push({ displayName: 'Callbacks', type: 'ai_chain', required: false }); return inputs`)

			return patched
		})()

		// @ts-ignore this.description should be assigned in the super constructor
		const { version: _, ...restDescription }: { version: Array<number> } = this.description

		// HACK:
		// In the database, the table `installed_nodes` stores the `latestVersion` as INTEGER (SQLite) or int4 (PostgreSQL), and the installation will fail if PostgreSQL is used (user will see something like `Error loading package "n8n-nodes-langfuse" : Failed to save installed package Cause: invalid input syntax for type integer: "1.7"`)
		// const latestVersion = Math.max(...version);
		// const latestVersionInt = Math.ceil(latestVersion);
		// if (latestVersion !== latestVersionInt) {
		// 	version.push(latestVersionInt);
		// }
		const version = [2]

		// @ts-ignore
		this.description = {
			...restDescription,
			// @ts-ignore
			displayName: `${this.description.displayName} with Callbacks`,
			version,
			// @ts-ignore
			version: this.description.version,
			inputs: patchedInputs as any,
		}
	}

	// This function isn't modified, we copy it just because we want to use a overridden version of the processItem function
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		this.logger.debug('Executing Basic LLM Chain');
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const outputParser = await getOptionalOutputParser(this);
		// If the node version is 1.6(and LLM is using `response_format: json_object`) or higher or an output parser is configured,
		//  we unwrap the response and return the object directly as JSON
		const shouldUnwrapObjects = this.getNode().typeVersion >= 1.6 || !!outputParser;

		const batchSize = this.getNodeParameter('batching.batchSize', 0, 5) as number;
		const delayBetweenBatches = this.getNodeParameter(
			'batching.delayBetweenBatches',
			0,
			0,
		) as number;

		if (this.getNode().typeVersion >= 1.7 && batchSize > 1) {
			// Process items in batches
			for (let i = 0; i < items.length; i += batchSize) {
				const batch = items.slice(i, i + batchSize);
				const batchPromises = batch.map(async (_item, batchItemIndex) => {
					return await processItem(this, i + batchItemIndex);
				});

				const batchResults = await Promise.allSettled(batchPromises);

				batchResults.forEach((promiseResult, batchItemIndex) => {
					const itemIndex = i + batchItemIndex;
					if (promiseResult.status === 'rejected') {
						const error = promiseResult.reason as Error;
						// Handle OpenAI specific rate limit errors
						if (error instanceof NodeApiError && isOpenAiError(error.cause)) {
							const openAiErrorCode: string | undefined = (error.cause as any).error?.code;
							if (openAiErrorCode) {
								const customMessage = getCustomOpenAiErrorMessage(openAiErrorCode);
								if (customMessage) {
									error.message = customMessage;
								}
							}
						}

						if (this.continueOnFail()) {
							returnData.push({
								json: { error: error.message },
								pairedItem: { item: itemIndex },
							});
							return;
						}
						throw new NodeOperationError(this.getNode(), error);
					}

					const responses = promiseResult.value;
					responses.forEach((response: unknown) => {
						returnData.push({
							json: formatResponse(response, shouldUnwrapObjects),
						});
					});
				});

				if (i + batchSize < items.length && delayBetweenBatches > 0) {
					await sleep(delayBetweenBatches);
				}
			}
		} else {
			// Process each input item
			for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
				try {
					const responses = await processItem(this, itemIndex);

					// Process each response and add to return data
					responses.forEach((response: any) => {
						returnData.push({
							json: formatResponse(response, shouldUnwrapObjects),
						});
					});
				} catch (error) {
					// Handle OpenAI specific rate limit errors
					if (error instanceof NodeApiError && isOpenAiError(error.cause)) {
						const openAiErrorCode: string | undefined = (error.cause as any).error?.code;
						if (openAiErrorCode) {
							const customMessage = getCustomOpenAiErrorMessage(openAiErrorCode);
							if (customMessage) {
								error.message = customMessage;
							}
						}
					}

					// Continue on failure if configured
					if (this.continueOnFail()) {
						returnData.push({ json: { error: error.message }, pairedItem: { item: itemIndex } });
						continue;
					}

					throw error;
				}
			}
		}

		return [returnData];
	}
}

function replaceExactOnce(input: string, regex: RegExp, replacement: string) {
	const matches = input.match(new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g'));

	if (!matches || matches.length !== 1) {
		// TODO
		// eslint-disable-next-line n8n-nodes-base/node-execute-block-wrong-error-thrown
		throw new Error(`[AgentWithCallbacks] Expected exactly one match for pattern ${regex}, but found ${matches ? matches.length : 0}: ${input}`);
	}

	return input.replace(regex, replacement);
}
