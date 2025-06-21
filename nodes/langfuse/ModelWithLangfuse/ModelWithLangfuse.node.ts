import type {
	INodeType,
	INodeTypeDescription,
	ISupplyDataFunctions,
	SupplyData,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import { CallbackHandler } from 'langfuse-langchain';
// @ts-ignore should be included in n8n
import type { BaseLanguageModel } from '@langchain/core/language_models/base';

// import { getLangfuseKeys } from '../lib/utils';
// import { validateJsonInput } from '../lib/validators';
import { getConnectedTraceOrObservation, TRACE_NODE_CONNECTION_TYPE } from '../lib/connection-helpers';
import { LANGFUSE_OBSERVATION_NODES, LANGFUSE_TRACE_NODES } from '../lib/constants';

export class ModelWithLangfuse implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Model with Langfuse',
		name: 'modelWithLangfuse',
		icon: 'file:langfuse.svg',
		group: ['transform'],
		version: [1, 1.1, 1.2],
		description: 'Wraps a language model with Langfuse for tracking and monitoring',
		defaults: {
			name: 'Model with Langfuse',
		},
		codex: {},
		inputs: [
			{
				type: NodeConnectionType.AiLanguageModel,
				displayName: 'Model',
				required: true,
				maxConnections: 1,
			},
			{
				type: TRACE_NODE_CONNECTION_TYPE,
				displayName: 'Tr/Obs',
				required: true,
				maxConnections: 1,
				filter: {
					nodes: [
						...LANGFUSE_TRACE_NODES,
						...LANGFUSE_OBSERVATION_NODES,
					],
				},
			},
		],
		outputs: [NodeConnectionType.AiLanguageModel],
		outputNames: ['Model'],
		properties: [
			{
				displayName: 'Update Trace/Observation',
				name: 'updateParent',
				type: 'boolean',
				default: false,
				description: 'Whether to set the input/output of the model as the input/output of the trace/observation',
			},
			// {
			// 	displayName: 'Additional Callback Constructor Params',
			// 	name: 'additionalCallbackConstructorParams',
			// 	type: 'json',
			// 	default: '{}',
			// 	placeholder: '{}',
			// 	description: 'Check the ConstructorParams type in langfuse-langchain',
			// },
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const traceOrObservation = await getConnectedTraceOrObservation(this);
		if (!traceOrObservation) {
			throw new NodeOperationError(this.getNode(), 'No connected trace/observation found.')
		}

		const updateParent = this.getNodeParameter('updateParent', itemIndex);

		// const additionalCallbackConstructorParams = validateJsonInput(
		// 	this.getNode(),
		// 	'additionalCallbackConstructorParams',
		// 	this.getNodeParameter('additionalCallbackConstructorParams', itemIndex) || {},
		// );

		const langfuseLangchainHandler = await (async () => {
			if (traceOrObservation) {
				return new CallbackHandler({
					root: traceOrObservation,
					updateRoot: !!updateParent,
					flushAt: 1, // do not batch events, send them immediately
					// ...additionalCallbackConstructorParams,
				});
			} else {
				throw new NodeOperationError(this.getNode(), 'Not connecting a trace is not supported for now.')
				// try {
				// 	const {
				// 		LANGFUSE_HOST,
				// 		LANGFUSE_PUBLIC_KEY,
				// 		LANGFUSE_SECRET_KEY,
				// 	} = await getLangfuseKeys(this);

				// 	return new CallbackHandler({
				// 		baseUrl: LANGFUSE_HOST,
				// 		publicKey: LANGFUSE_PUBLIC_KEY,
				// 		secretKey: LANGFUSE_SECRET_KEY,
				// 		// ...additionalCallbackConstructorParams,
				// 		flushAt: 1, // do not batch events, send them immediately
				// 	});
				// } catch (e) {
				// 	throw new NodeOperationError(this.getNode(), (e instanceof Error ? e.message : 'Unknown error') + 'Note: Langfuse credentials are required if a trace is not provided.');
				// }
			}
		})()

		let lmConnectionData = (await this.getInputConnectionData(
			NodeConnectionType.AiLanguageModel,
			0,
		));
		this.logger.debug(`ModelWithLangfuse: got lmConnectionData ${JSON.stringify(lmConnectionData)}`);

		if (Array.isArray(lmConnectionData)) {
			lmConnectionData = lmConnectionData[0];
		}

		const llm = lmConnectionData as BaseLanguageModel;
		this.logger.debug(`ModelWithLangfuse: got llm ${JSON.stringify(llm)}`);

		if (!llm) {
			throw new NodeOperationError(
				this.getNode(),
				'ModelWithLangfuse: A Model sub-node must be connected and enabled',
			);
		}

		if (!llm.callbacks) {
			llm.callbacks = [];
		}

		if (Array.isArray(llm.callbacks)) {
			llm.callbacks.push(langfuseLangchainHandler);
		} else {
			throw new NodeOperationError(
				this.getNode(),
				`ModelWithLangfuse: Expected llm.callbacks to be an array, got ${typeof llm.callbacks}`,
			);
		}

		return {
			response: llm,
		};
	}
}
