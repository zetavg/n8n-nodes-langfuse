import type {
	INodeType,
	INodeTypeDescription,
	ISupplyDataFunctions,
	SupplyData,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import { CallbackHandler } from 'langfuse-langchain';
import { getConnectedTrace, TRACE_NODE_CONNECTION_TYPE } from '../lib/connection-helpers';
import { validatePromptJsonInput } from '../lib/validators';
import { LANGFUSE_TRACE_NODES } from '../lib/constants';

export class LangfuseCallbackHandler implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Langfuse Callback Handler',
		name: 'langfuseCallbackHandler',
		icon: 'file:langfuse.svg',
		group: ['transform'],
		version: [1],
		description: 'Langfuse Langchain Callback Handler for tracking and monitoring',
		defaults: {
			name: 'Langfuse Callback Handler',
		},
		codex: {},
		inputs: [
			{
				type: TRACE_NODE_CONNECTION_TYPE,
				displayName: 'Trace',
				required: true,
				maxConnections: 1,
				filter: {
					nodes: LANGFUSE_TRACE_NODES,
				}
			},
		],
		outputs: [NodeConnectionType.AiChain],
		outputNames: ['Callback Handler'],
		properties: [
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				default: {},
				placeholder: 'Add Option',
				options: [
					{
						displayName: 'Prompt',
						name: 'prompt',
						type: 'json',
						default: '',
						description: 'The Langfuse prompt used for the run that this callback handler is attached to. This will be used to track the prompt in Langfuse.',
					},
				],
			}
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const trace = await getConnectedTrace(this);
		if (!trace) {
			throw new NodeOperationError(this.getNode(), 'No trace connected to this node')
		}

		const callbacKHandler = new CallbackHandler({
			root: trace as any,
			// updateRoot: ..., // TODO
			flushAt: 1, // do not batch events, send them immediately
		});

		const prompt = validatePromptJsonInput(this.getNode(), 'options.prompt', this.getNodeParameter('options.prompt', itemIndex, '{}'), { optional: true });
		if (prompt) {
			// HACK!
			// @ts-expect-error
			callbacKHandler.promptToParentRunMap = {
				has: () => true,
				get: () => prompt,
				set: () => { },
				delete: () => { },
			}
		}

		return {
			response: callbacKHandler,
		};
	}
}
